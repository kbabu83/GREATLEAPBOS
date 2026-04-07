<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Execution\EsRole;
use App\Models\Execution\EsTask;
use App\Models\Execution\EsTaskTimeLog;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user     = $request->user();
        $tenantId = $user->tenant_id;

        return $user->isStaff()
            ? $this->staffDashboard($request, $user, $tenantId)
            : $this->adminDashboard($request, $user, $tenantId);
    }

    // ── Staff personal work dashboard ─────────────────────────────────────────

    private function staffDashboard(Request $request, User $user, string $tenantId): JsonResponse
    {
        $userId = $user->id;
        $period = $request->input('period', 'week'); // day | week | month

        [$periodStart, $periodEnd, $periodLabels] = $this->resolvePeriod($period);

        // Task counts — includes assigned, created, and observed tasks (matches staffTasks endpoint)
        $taskBase = EsTask::where('tenant_id', $tenantId)
            ->where(function ($q) use ($userId) {
                $q->where('assigned_user_id', $userId)
                  ->orWhere('created_by_user_id', $userId)
                  ->orWhereHas('observers', fn ($o) => $o->where('user_id', $userId));
            });

        $totalTasks      = (clone $taskBase)->count();
        $pendingTasks    = (clone $taskBase)->where('status', 'pending')->count();
        $inProgressTasks = (clone $taskBase)->where('status', 'in_progress')->count();
        $completedTasks  = (clone $taskBase)->where('status', 'completed')->count();
        $overdueTasks    = (clone $taskBase)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->toDateString())
            ->count();
        $completedInPeriod = (clone $taskBase)
            ->where('status', 'completed')
            ->whereBetween('completed_at', [$periodStart, $periodEnd])
            ->count();

        // Time logged in period
        $timeBase     = EsTaskTimeLog::where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->whereBetween('start_time', [$periodStart, $periodEnd])
            ->where('duration_minutes', '>', 0);
        $totalMinutes = (clone $timeBase)->sum('duration_minutes');

        // Time per slot (for bar chart)
        $timeBySlot = EsTaskTimeLog::where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->whereBetween('start_time', [$periodStart, $periodEnd])
            ->where('duration_minutes', '>', 0)
            ->select(
                DB::raw("DATE_FORMAT(start_time, '{$this->slotFormat($period)}') as slot"),
                DB::raw('SUM(duration_minutes) as total_minutes')
            )
            ->groupBy('slot')
            ->orderBy('slot')
            ->get()
            ->keyBy('slot');

        $timeChart = collect($periodLabels)->map(fn ($lbl) => [
            'label'   => $lbl['label'],
            'hours'   => round(($timeBySlot[$lbl['key']]->total_minutes ?? 0) / 60, 1),
            'minutes' => (int) ($timeBySlot[$lbl['key']]->total_minutes ?? 0),
        ])->values();

        // Status breakdown (pie)
        $statusBreakdown = [
            ['status' => 'Pending',     'count' => $pendingTasks,    'color' => '#94a3b8'],
            ['status' => 'In Progress', 'count' => $inProgressTasks, 'color' => '#3b82f6'],
            ['status' => 'Completed',   'count' => $completedTasks,  'color' => '#22c55e'],
            ['status' => 'Overdue',     'count' => $overdueTasks,    'color' => '#ef4444'],
        ];

        // Upcoming / active tasks list
        $upcomingTasks = (clone $taskBase)
            ->with(['role:id,name', 'area:id,area_name', 'activity:id,activity_name'])
            ->whereIn('status', ['pending', 'in_progress'])
            ->orderByRaw("CASE WHEN status = 'in_progress' THEN 0 ELSE 1 END")
            ->orderBy(DB::raw('ISNULL(due_date)'))
            ->orderBy('due_date')
            ->take(8)
            ->get()
            ->map(fn ($t) => [
                'id'         => $t->id,
                'title'      => $t->title,
                'status'     => $t->status,
                'priority'   => $t->priority,
                'due_date'   => $t->due_date?->toDateString(),
                'is_overdue' => $t->isDueTodayOrOverdue() && !in_array($t->status, ['completed', 'cancelled']),
                'role'       => $t->role?->name,
                'area'       => $t->area?->area_name,
                'activity'   => $t->activity?->activity_name,
            ]);

        // User's assigned execution roles (full detail, supports multiple)
        $userRoles = $user->esRoles()->with([
            'areas.parameters',
            'activities',
            'skills',
            'performanceDefinition',
            'reportingRole:id,name',
        ])->get();

        $esRoles = $userRoles->map(fn ($rm) => [
            'id'             => $rm->id,
            'name'           => $rm->name,
            'purpose'        => $rm->purpose,
            'reporting_role' => $rm->reportingRole?->name,
            'areas'          => $rm->areas->map(fn ($a) => [
                'id'          => $a->id,
                'area_name'   => $a->area_name,
                'description' => $a->description,
                'parameters'  => $a->parameters->map(fn ($p) => [
                    'id'             => $p->id,
                    'parameter_name' => $p->parameter_name,
                    'description'    => $p->description,
                ]),
            ]),
            'activities'             => $rm->activities->map(fn ($a) => [
                'id'              => $a->id,
                'activity_name'   => $a->activity_name,
                'frequency_type'  => $a->frequency_type,
                'frequency_value' => $a->frequency_value,
                'area_id'         => $a->area_id,
            ]),
            'skills'                 => [
                'hard_skills' => $rm->skills?->hard_skills ?? [],
                'soft_skills' => $rm->skills?->soft_skills ?? [],
            ],
            'performance_definition' => $rm->performanceDefinition ? [
                'excellent_definition' => $rm->performanceDefinition->excellent_definition,
                'average_definition'   => $rm->performanceDefinition->average_definition,
                'poor_definition'      => $rm->performanceDefinition->poor_definition,
            ] : null,
        ])->values();

        // Login activity (from personal_access_tokens last_used_at)
        $loginActivity = DB::table('personal_access_tokens')
            ->where('tokenable_type', User::class)
            ->where('tokenable_id', $userId)
            ->orderByDesc('last_used_at')
            ->take(10)
            ->pluck('last_used_at')
            ->filter()
            ->map(fn ($t) => Carbon::parse($t)->toISOString())
            ->values();

        return response()->json([
            'type'   => 'staff',
            'user'   => [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'department' => $user->department,
                'last_login' => $user->last_login_at?->toISOString(),
            ],
            'period'           => $period,
            'task_stats'       => [
                'total'               => $totalTasks,
                'pending'             => $pendingTasks,
                'in_progress'         => $inProgressTasks,
                'completed'           => $completedTasks,
                'overdue'             => $overdueTasks,
                'completed_in_period' => $completedInPeriod,
                'hours_logged'        => round($totalMinutes / 60, 1),
                'minutes_logged'      => (int) $totalMinutes,
            ],
            'time_chart'       => $timeChart,
            'status_breakdown' => $statusBreakdown,
            'upcoming_tasks'   => $upcomingTasks,
            'es_roles'         => $esRoles,
            'login_activity'   => $loginActivity,
        ]);
    }

    // ── Admin org overview dashboard ──────────────────────────────────────────

    private function adminDashboard(Request $request, User $user, string $tenantId): JsonResponse
    {
        $totalUsers  = User::where('tenant_id', $tenantId)->count();
        $activeUsers = User::where('tenant_id', $tenantId)->where('is_active', true)->count();
        $adminUsers  = User::where('tenant_id', $tenantId)->where('role', User::ROLE_TENANT_ADMIN)->count();
        $staffUsers  = User::where('tenant_id', $tenantId)->where('role', User::ROLE_STAFF)->count();

        $usersByRole = User::where('tenant_id', $tenantId)
            ->select('role', DB::raw('count(*) as count'))
            ->groupBy('role')
            ->get()
            ->map(fn ($i) => [
                'role'  => $i->role,
                'label' => match ($i->role) {
                    User::ROLE_TENANT_ADMIN => 'Tenant Admin',
                    User::ROLE_STAFF        => 'Staff',
                    default                 => $i->role,
                },
                'count' => $i->count,
            ]);

        $monthlyRegistrations = User::where('tenant_id', $tenantId)
            ->select(DB::raw('YEAR(created_at) as year'), DB::raw('MONTH(created_at) as month'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', now()->subMonths(12))
            ->groupBy('year', 'month')
            ->orderBy('year')->orderBy('month')
            ->get()
            ->map(fn ($i) => ['month' => date('M Y', mktime(0, 0, 0, $i->month, 1, $i->year)), 'count' => $i->count]);

        $recentUsers = User::where('tenant_id', $tenantId)->latest()->take(5)->get()
            ->map(fn ($u) => [
                'id' => $u->id, 'name' => $u->name, 'email' => $u->email,
                'role' => $u->role, 'is_active' => $u->is_active,
                'created_at' => $u->created_at->toISOString(),
            ]);

        $taskStats = [
            'total'       => EsTask::where('tenant_id', $tenantId)->count(),
            'pending'     => EsTask::where('tenant_id', $tenantId)->where('status', 'pending')->count(),
            'in_progress' => EsTask::where('tenant_id', $tenantId)->where('status', 'in_progress')->count(),
            'completed'   => EsTask::where('tenant_id', $tenantId)->where('status', 'completed')->count(),
            'overdue'     => EsTask::where('tenant_id', $tenantId)
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->whereNotNull('due_date')->where('due_date', '<', now()->toDateString())
                ->count(),
        ];

        $tenant = Tenant::find($tenantId);

        return response()->json([
            'type'  => 'admin',
            'stats' => [
                'total_users'  => $totalUsers,
                'active_users' => $activeUsers,
                'admin_users'  => $adminUsers,
                'staff_users'  => $staffUsers,
            ],
            'task_stats'            => $taskStats,
            'users_by_role'         => $usersByRole,
            'monthly_registrations' => $monthlyRegistrations,
            'recent_users'          => $recentUsers,
            'tenant'                => $tenant ? ['id' => $tenant->id, 'name' => $tenant->name, 'plan' => $tenant->plan, 'status' => $tenant->status] : null,
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function slotFormat(string $period): string
    {
        return match ($period) {
            'day'   => '%Y-%m-%d %H:00',
            'month' => '%Y-%m-%d',
            default => '%Y-%m-%d',
        };
    }

    private function resolvePeriod(string $period): array
    {
        $now = now();

        return match ($period) {
            'day' => [
                $now->copy()->startOfDay(),
                $now->copy()->endOfDay(),
                collect(range(0, 23))->map(fn ($h) => [
                    'key'   => $now->copy()->setHour($h)->format('Y-m-d H:00'),
                    'label' => $now->copy()->setHour($h)->format('H:00'),
                ])->all(),
            ],
            'month' => [
                $now->copy()->startOfMonth(),
                $now->copy()->endOfMonth(),
                collect(range(1, (int) $now->format('t')))->map(fn ($d) => [
                    'key'   => $now->copy()->setDay($d)->format('Y-m-d'),
                    'label' => $now->copy()->setDay($d)->format('d'),
                ])->all(),
            ],
            default => [ // week
                $now->copy()->startOfWeek(),
                $now->copy()->endOfWeek(),
                collect(range(0, 6))->map(fn ($d) => [
                    'key'   => $now->copy()->startOfWeek()->addDays($d)->format('Y-m-d'),
                    'label' => $now->copy()->startOfWeek()->addDays($d)->format('D'),
                ])->all(),
            ],
        };
    }
}
