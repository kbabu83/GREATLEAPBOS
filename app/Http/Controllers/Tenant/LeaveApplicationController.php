<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\EmployeeLeaveBalance;
use App\Models\LeaveApplication;
use App\Models\LeaveApplicationApproval;
use App\Models\LeaveType;
use App\Models\LeaveTypeApprovalLevel;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeaveApplicationController extends Controller
{
    // ── List applications ─────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $tenantId    = $request->user()->tenant_id;
        $currentUser = $request->user();

        // Find the employee record for the logged-in user
        $employee = Employee::where('tenant_id', $tenantId)
            ->where('user_id', $currentUser->id)->first();

        $query = LeaveApplication::where('tenant_id', $tenantId)
            ->with(['employee', 'leaveType', 'approvals.assignedTo'])
            ->orderByDesc('created_at');

        // Non-admins see only their own applications
        if ($currentUser->role !== 'tenant_admin' && $employee) {
            $query->where('employee_id', $employee->id);
        }

        // Filters
        if ($request->filled('status'))        $query->where('status', $request->status);
        if ($request->filled('employee_id'))   $query->where('employee_id', $request->employee_id);
        if ($request->filled('leave_type_id')) $query->where('leave_type_id', $request->leave_type_id);
        if ($request->filled('from_date'))     $query->where('from_date', '>=', $request->from_date);
        if ($request->filled('to_date'))       $query->where('to_date', '<=', $request->to_date);

        $apps = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'data' => collect($apps->items())->map(fn($a) => $this->formatApplication($a))->values(),
            'meta' => [
                'current_page' => $apps->currentPage(),
                'last_page'    => $apps->lastPage(),
                'per_page'     => $apps->perPage(),
                'total'        => $apps->total(),
            ],
        ]);
    }

    // ── Applications pending MY approval ──────────────────────────────────────

    public function pendingMyApproval(Request $request): JsonResponse
    {
        $tenantId    = $request->user()->tenant_id;
        $currentUser = $request->user();

        $myEmployee = Employee::where('tenant_id', $tenantId)->where('user_id', $currentUser->id)->first();

        if (!$myEmployee) {
            return response()->json(['data' => [], 'meta' => ['total' => 0]]);
        }

        // Find approval rows assigned to me that are still pending
        $approvalIds = LeaveApplicationApproval::where('assigned_to_employee_id', $myEmployee->id)
            ->where('status', 'pending')->pluck('leave_application_id');

        // Also: if this user is tenant_admin, they are the "hr_manager" approver for any HR-level pending
        $hrApprovalIds = collect();
        if ($currentUser->role === 'tenant_admin') {
            $hrApprovalIds = LeaveApplicationApproval::where('approver_type', 'hr_manager')
                ->where('status', 'pending')->pluck('leave_application_id');
        }

        $allIds = $approvalIds->merge($hrApprovalIds)->unique();

        $apps = LeaveApplication::whereIn('id', $allIds)
            ->where('status', 'pending')
            ->with(['employee', 'leaveType', 'approvals'])
            ->orderByDesc('submitted_at')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'data' => collect($apps->items())->map(fn($a) => $this->formatApplication($a))->values(),
            'meta' => ['current_page' => $apps->currentPage(), 'last_page' => $apps->lastPage(), 'total' => $apps->total()],
        ]);
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function show(Request $request, LeaveApplication $leaveApplication): JsonResponse
    {
        $this->authorizeApplication($request, $leaveApplication);
        $leaveApplication->load(['employee', 'leaveType', 'approvals.assignedTo', 'approvals.actionedBy', 'appliedByUser']);
        return response()->json(['application' => $this->formatApplication($leaveApplication)]);
    }

    // ── Apply (create + submit) ───────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $tenantId    = $request->user()->tenant_id;
        $currentUser = $request->user();

        $validated = $request->validate([
            'employee_id'           => 'required|exists:employees,id',
            'leave_type_id'         => 'required|exists:leave_types,id',
            'from_date'             => 'required|date',
            'to_date'               => 'required|date|after_or_equal:from_date',
            'is_half_day'           => 'boolean',
            'half_day_session'      => 'nullable|in:first_half,second_half',
            'reason'                => 'required|string|max:500',
            'contact_during_leave'  => 'nullable|string|max:100',
            'submit'                => 'boolean', // false = save as draft
        ]);

        $employee  = Employee::where('tenant_id', $tenantId)->findOrFail($validated['employee_id']);
        $leaveType = LeaveType::where('tenant_id', $tenantId)->findOrFail($validated['leave_type_id']);

        // Non-admin can only apply for themselves
        if ($currentUser->role !== 'tenant_admin') {
            $myEmployee = Employee::where('tenant_id', $tenantId)->where('user_id', $currentUser->id)->first();
            abort_if(!$myEmployee || $myEmployee->id !== $employee->id, 403, 'You can only apply leave for yourself.');
        }

        // Admin-only check: non-admins cannot apply admin-only leaves
        if ($leaveType->is_admin_only && $currentUser->role !== 'tenant_admin') {
            return response()->json(['message' => 'This leave type can only be granted by HR/admin.'], 422);
        }

        // Eligibility check
        if (!$leaveType->isEligibleFor($employee)) {
            return response()->json(['message' => 'This employee is not eligible for this leave type.'], 422);
        }

        // Calculate working days
        $totalDays = $this->calculateWorkingDays(
            $validated['from_date'],
            $validated['to_date'],
            $validated['is_half_day'] ?? false,
            $leaveType
        );

        // Balance check (skip for admin grants and unpaid/LOP)
        if (!$leaveType->is_admin_only || $currentUser->role !== 'tenant_admin') {
            $balance = EmployeeLeaveBalance::where('employee_id', $employee->id)
                ->where('leave_type_id', $leaveType->id)
                ->where('year', date('Y'))->first();

            $available = $balance?->available_balance ?? 0;
            $allow_negative = $leaveType->leavePolicy->allow_negative_balance ?? false;

            if (!$allow_negative && $available < $totalDays) {
                return response()->json([
                    'message'   => "Insufficient leave balance. Available: {$available} days, Requested: {$totalDays} days.",
                    'available' => $available,
                    'requested' => $totalDays,
                ], 422);
            }
        }

        $application = DB::transaction(function () use (
            $tenantId, $validated, $employee, $leaveType, $totalDays, $currentUser
        ) {
            $shouldSubmit   = $validated['submit'] ?? true;
            $approvalLevels = $leaveType->approvalLevels()->count();
            $isAutoApprove  = $leaveType->auto_approve;

            $app = LeaveApplication::create([
                'tenant_id'              => $tenantId,
                'application_number'     => LeaveApplication::generateNumber($tenantId),
                'employee_id'            => $employee->id,
                'leave_type_id'          => $leaveType->id,
                'from_date'              => $validated['from_date'],
                'to_date'                => $validated['to_date'],
                'total_days'             => $totalDays,
                'is_half_day'            => $validated['is_half_day'] ?? false,
                'half_day_session'       => $validated['half_day_session'] ?? null,
                'reason'                 => $validated['reason'],
                'contact_during_leave'   => $validated['contact_during_leave'] ?? null,
                'status'                 => $shouldSubmit ? ($isAutoApprove ? 'auto_approved' : 'pending') : 'draft',
                'current_approval_level' => $shouldSubmit ? 1 : 0,
                'total_approval_levels'  => $approvalLevels ?: 1,
                'is_admin_granted'       => $currentUser->role === 'tenant_admin' && $currentUser->id !== null,
                'applied_by_user_id'     => $currentUser->id,
                'submitted_at'           => $shouldSubmit ? now() : null,
                'approved_at'            => ($shouldSubmit && $isAutoApprove) ? now() : null,
                'auto_approve_at'        => ($shouldSubmit && !$isAutoApprove && $leaveType->auto_approve_after_hours)
                                            ? now()->addHours($leaveType->auto_approve_after_hours) : null,
            ]);

            if ($shouldSubmit) {
                if ($isAutoApprove) {
                    // Create all approval rows as auto_approved
                    for ($lvl = 1; $lvl <= max($approvalLevels, 1); $lvl++) {
                        LeaveApplicationApproval::create([
                            'leave_application_id'     => $app->id,
                            'level'                    => $lvl,
                            'approver_type'            => 'system',
                            'status'                   => 'auto_approved',
                            'actioned_at'              => now(),
                        ]);
                    }
                    // Deduct balance immediately
                    $this->deductBalance($tenantId, $employee->id, $leaveType->id, $totalDays);
                } else {
                    // Create approval rows
                    $this->createApprovalRows($app, $leaveType, $employee);
                    // Reserve balance as pending
                    $this->reservePendingBalance($tenantId, $employee->id, $leaveType->id, $totalDays);
                }
            }

            return $app;
        });

        return response()->json([
            'message'     => $application->status === 'auto_approved'
                ? 'Leave auto-approved successfully.'
                : ($application->status === 'draft' ? 'Leave saved as draft.' : 'Leave application submitted.'),
            'application' => $this->formatApplication($application->load(['employee','leaveType','approvals'])),
        ], 201);
    }

    // ── Approve ───────────────────────────────────────────────────────────────

    public function approve(Request $request, LeaveApplication $leaveApplication): JsonResponse
    {
        $this->authorizeApplication($request, $leaveApplication);
        $tenantId    = $request->user()->tenant_id;
        $currentUser = $request->user();

        if (!$leaveApplication->isPending()) {
            return response()->json(['message' => 'Only pending applications can be approved.'], 422);
        }

        $comments   = $request->input('comments', '');
        $myEmployee = Employee::where('tenant_id', $tenantId)->where('user_id', $currentUser->id)->first();
        $level      = $leaveApplication->current_approval_level;

        $approvalRow = LeaveApplicationApproval::where('leave_application_id', $leaveApplication->id)
            ->where('level', $level)->where('status', 'pending')->first();

        if (!$approvalRow) {
            return response()->json(['message' => 'No pending approval row found for this level.'], 422);
        }

        // Verify current user is the correct approver
        if (!$this->canActOnApproval($approvalRow, $myEmployee, $currentUser)) {
            return response()->json(['message' => 'You are not authorised to approve at this level.'], 403);
        }

        DB::transaction(function () use ($leaveApplication, $approvalRow, $myEmployee, $comments, $tenantId) {
            $approvalRow->update([
                'status'                    => 'approved',
                'actioned_by_employee_id'   => $myEmployee?->id,
                'comments'                  => $comments,
                'actioned_at'               => now(),
            ]);

            $nextLevel  = $leaveApplication->current_approval_level + 1;
            $totalLevels = $leaveApplication->total_approval_levels;

            if ($nextLevel > $totalLevels) {
                // All levels approved → finalize
                $leaveApplication->update([
                    'status'      => 'approved',
                    'approved_at' => now(),
                ]);
                // Move balance from pending → availed
                $this->confirmBalance($tenantId, $leaveApplication->employee_id, $leaveApplication->leave_type_id, $leaveApplication->total_days);
            } else {
                // Advance to next level
                $leaveApplication->update(['current_approval_level' => $nextLevel]);
            }
        });

        return response()->json([
            'message'     => 'Application approved.',
            'application' => $this->formatApplication($leaveApplication->fresh()->load('approvals')),
        ]);
    }

    // ── Reject ────────────────────────────────────────────────────────────────

    public function reject(Request $request, LeaveApplication $leaveApplication): JsonResponse
    {
        $this->authorizeApplication($request, $leaveApplication);
        $tenantId    = $request->user()->tenant_id;
        $currentUser = $request->user();

        if (!$leaveApplication->isPending()) {
            return response()->json(['message' => 'Only pending applications can be rejected.'], 422);
        }

        $request->validate(['comments' => 'required|string|max:500']);
        $myEmployee = Employee::where('tenant_id', $tenantId)->where('user_id', $currentUser->id)->first();
        $level      = $leaveApplication->current_approval_level;

        $approvalRow = LeaveApplicationApproval::where('leave_application_id', $leaveApplication->id)
            ->where('level', $level)->where('status', 'pending')->first();

        if (!$approvalRow) {
            return response()->json(['message' => 'No pending approval row found.'], 422);
        }

        if (!$this->canActOnApproval($approvalRow, $myEmployee, $currentUser)) {
            return response()->json(['message' => 'You are not authorised to reject at this level.'], 403);
        }

        DB::transaction(function () use ($leaveApplication, $approvalRow, $myEmployee, $request, $tenantId) {
            $approvalRow->update([
                'status'                  => 'rejected',
                'actioned_by_employee_id' => $myEmployee?->id,
                'comments'                => $request->comments,
                'actioned_at'             => now(),
            ]);
            $leaveApplication->update(['status' => 'rejected', 'rejected_at' => now()]);
            // Release the pending balance reservation
            $this->releasePendingBalance($tenantId, $leaveApplication->employee_id, $leaveApplication->leave_type_id, $leaveApplication->total_days);
        });

        return response()->json(['message' => 'Application rejected.']);
    }

    // ── Cancel / Withdraw ─────────────────────────────────────────────────────

    public function cancel(Request $request, LeaveApplication $leaveApplication): JsonResponse
    {
        $this->authorizeApplication($request, $leaveApplication);
        $tenantId    = $request->user()->tenant_id;
        $currentUser = $request->user();

        if (!$leaveApplication->isCancellable()) {
            return response()->json(['message' => 'This application cannot be cancelled.'], 422);
        }

        $request->validate(['reason' => 'required|string|max:300']);
        $myEmployee = Employee::where('tenant_id', $tenantId)->where('user_id', $currentUser->id)->first();

        // Non-admin can only cancel their own applications
        if ($currentUser->role !== 'tenant_admin' && $leaveApplication->employee_id !== $myEmployee?->id) {
            return response()->json(['message' => 'You can only cancel your own applications.'], 403);
        }

        DB::transaction(function () use ($leaveApplication, $myEmployee, $request, $tenantId) {
            $wasPending = $leaveApplication->isPending();
            $leaveApplication->update([
                'status'                    => 'cancelled',
                'cancellation_reason'       => $request->reason,
                'cancelled_by_employee_id'  => $myEmployee?->id,
            ]);
            if ($wasPending) {
                // Release reserved pending balance
                $this->releasePendingBalance($tenantId, $leaveApplication->employee_id, $leaveApplication->leave_type_id, $leaveApplication->total_days);
            }
        });

        return response()->json(['message' => 'Application cancelled.']);
    }

    public function withdraw(Request $request, LeaveApplication $leaveApplication): JsonResponse
    {
        $this->authorizeApplication($request, $leaveApplication);
        $tenantId    = $request->user()->tenant_id;
        $currentUser = $request->user();

        if (!$leaveApplication->isWithdrawable()) {
            return response()->json(['message' => 'Only approved applications can be withdrawn.'], 422);
        }

        // Cannot withdraw past leave
        if ($leaveApplication->from_date->isPast()) {
            return response()->json(['message' => 'Cannot withdraw leave that has already started.'], 422);
        }

        $request->validate(['reason' => 'required|string|max:300']);
        $myEmployee = Employee::where('tenant_id', $tenantId)->where('user_id', $currentUser->id)->first();

        DB::transaction(function () use ($leaveApplication, $myEmployee, $request, $tenantId) {
            $leaveApplication->update([
                'status'                    => 'withdrawn',
                'cancellation_reason'       => $request->reason,
                'cancelled_by_employee_id'  => $myEmployee?->id,
            ]);
            // Restore availed balance
            $this->restoreAvaileBalance($tenantId, $leaveApplication->employee_id, $leaveApplication->leave_type_id, $leaveApplication->total_days);
        });

        return response()->json(['message' => 'Leave withdrawn successfully.']);
    }

    // ── Balance overview ──────────────────────────────────────────────────────

    public function balanceSummary(Request $request): JsonResponse
    {
        $tenantId    = $request->user()->tenant_id;
        $currentUser = $request->user();
        $year        = $request->input('year', date('Y'));
        $employeeId  = $request->input('employee_id');

        // Default to self
        if (!$employeeId) {
            $me = Employee::where('tenant_id', $tenantId)->where('user_id', $currentUser->id)->first();
            $employeeId = $me?->id;
        }

        if (!$employeeId) {
            return response()->json(['data' => []]);
        }

        $balances = EmployeeLeaveBalance::where('employee_id', $employeeId)
            ->where('year', $year)
            ->with('leaveType')
            ->get()
            ->map(fn($b) => [
                'leave_type'      => ['id' => $b->leaveType->id, 'name' => $b->leaveType->name, 'code' => $b->leaveType->code, 'color' => $b->leaveType->color],
                'year'            => $b->year,
                'opening'         => $b->opening_balance,
                'accrued'         => $b->accrued,
                'carry_forward'   => $b->carry_forward,
                'additional'      => $b->additional_granted,
                'total_credited'  => $b->total_credited,
                'availed'         => $b->availed,
                'pending'         => $b->pending,
                'encashed'        => $b->encashed,
                'lapsed'          => $b->lapsed,
                'available'       => $b->available_balance,
            ]);

        return response()->json(['data' => $balances]);
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private function calculateWorkingDays(string $from, string $to, bool $isHalfDay, LeaveType $leaveType): float
    {
        if ($isHalfDay) return 0.5;

        $start    = new \DateTime($from);
        $end      = new \DateTime($to);
        $interval = new \DateInterval('P1D');
        $days     = 0;

        for ($d = clone $start; $d <= $end; $d->add($interval)) {
            $dow = (int) $d->format('N'); // 1=Mon ... 7=Sun
            // Skip weekends unless sandwich rule is ON
            if (!$leaveType->include_weekends_in_count && in_array($dow, [6, 7])) continue;
            $days++;
        }

        return $days;
    }

    private function createApprovalRows(LeaveApplication $app, LeaveType $leaveType, Employee $employee): void
    {
        $levels = $leaveType->approvalLevels;

        if ($levels->isEmpty()) {
            // Default: single-level reporting manager approval
            $assignedTo = $employee->reporting_manager_id;
            LeaveApplicationApproval::create([
                'leave_application_id'     => $app->id,
                'level'                    => 1,
                'approver_type'            => 'reporting_manager',
                'assigned_to_employee_id'  => $assignedTo,
                'status'                   => 'pending',
            ]);
            return;
        }

        foreach ($levels as $level) {
            $assignedTo = match ($level->approver_type) {
                'reporting_manager' => $employee->reporting_manager_id,
                'department_head'   => $employee->department?->head_employee_id,
                'specific_employee' => $level->specific_employee_id,
                default             => null, // hr_manager: any tenant_admin resolves at action time
            };

            LeaveApplicationApproval::create([
                'leave_application_id'     => $app->id,
                'level'                    => $level->level,
                'approver_type'            => $level->approver_type,
                'assigned_to_employee_id'  => $assignedTo,
                'status'                   => $level->level === 1 ? 'pending' : 'pending',
            ]);
        }
    }

    private function reservePendingBalance(string $tenantId, int $empId, int $ltId, float $days): void
    {
        $balance = EmployeeLeaveBalance::firstOrCreate(
            ['tenant_id' => $tenantId, 'employee_id' => $empId, 'leave_type_id' => $ltId, 'year' => date('Y')],
            ['opening_balance' => 0, 'accrued' => 0, 'carry_forward' => 0, 'additional_granted' => 0,
             'availed' => 0, 'pending' => 0, 'encashed' => 0, 'lapsed' => 0, 'available_balance' => 0]
        );
        $balance->pending = bcadd((string)$balance->pending, (string)$days, 2);
        $balance->recalculate();
    }

    private function releasePendingBalance(string $tenantId, int $empId, int $ltId, float $days): void
    {
        $balance = EmployeeLeaveBalance::where(['tenant_id' => $tenantId, 'employee_id' => $empId, 'leave_type_id' => $ltId, 'year' => date('Y')])->first();
        if ($balance) {
            $balance->pending = max(0, bcsub((string)$balance->pending, (string)$days, 2));
            $balance->recalculate();
        }
    }

    private function confirmBalance(string $tenantId, int $empId, int $ltId, float $days): void
    {
        $balance = EmployeeLeaveBalance::where(['tenant_id' => $tenantId, 'employee_id' => $empId, 'leave_type_id' => $ltId, 'year' => date('Y')])->first();
        if ($balance) {
            $balance->pending = max(0, bcsub((string)$balance->pending, (string)$days, 2));
            $balance->availed = bcadd((string)$balance->availed, (string)$days, 2);
            $balance->recalculate();
        }
    }

    private function deductBalance(string $tenantId, int $empId, int $ltId, float $days): void
    {
        $balance = EmployeeLeaveBalance::firstOrCreate(
            ['tenant_id' => $tenantId, 'employee_id' => $empId, 'leave_type_id' => $ltId, 'year' => date('Y')],
            ['opening_balance' => 0, 'accrued' => 0, 'carry_forward' => 0, 'additional_granted' => 0,
             'availed' => 0, 'pending' => 0, 'encashed' => 0, 'lapsed' => 0, 'available_balance' => 0]
        );
        $balance->availed = bcadd((string)$balance->availed, (string)$days, 2);
        $balance->recalculate();
    }

    private function restoreAvaileBalance(string $tenantId, int $empId, int $ltId, float $days): void
    {
        $balance = EmployeeLeaveBalance::where(['tenant_id' => $tenantId, 'employee_id' => $empId, 'leave_type_id' => $ltId, 'year' => date('Y')])->first();
        if ($balance) {
            $balance->availed = max(0, bcsub((string)$balance->availed, (string)$days, 2));
            $balance->recalculate();
        }
    }

    private function canActOnApproval(LeaveApplicationApproval $row, ?Employee $myEmployee, User $currentUser): bool
    {
        // HR manager role: any tenant_admin can approve hr_manager level
        if ($row->approver_type === 'hr_manager' && $currentUser->role === 'tenant_admin') return true;
        // Specific assigned approver
        if ($myEmployee && $row->assigned_to_employee_id === $myEmployee->id) return true;
        // Tenant admin can always act
        if ($currentUser->role === 'tenant_admin') return true;
        return false;
    }

    private function authorizeApplication(Request $request, LeaveApplication $app): void
    {
        abort_if($app->tenant_id !== $request->user()->tenant_id, 403);
    }

    private function formatApplication(LeaveApplication $app): array
    {
        return [
            'id'                     => $app->id,
            'application_number'     => $app->application_number,
            'employee'               => $app->employee ? ['id' => $app->employee->id, 'name' => $app->employee->full_name, 'employee_code' => $app->employee->employee_code] : null,
            'leave_type'             => $app->leaveType ? ['id' => $app->leaveType->id, 'name' => $app->leaveType->name, 'code' => $app->leaveType->code, 'color' => $app->leaveType->color] : null,
            'from_date'              => $app->from_date?->toDateString(),
            'to_date'                => $app->to_date?->toDateString(),
            'total_days'             => $app->total_days,
            'is_half_day'            => $app->is_half_day,
            'half_day_session'       => $app->half_day_session,
            'reason'                 => $app->reason,
            'status'                 => $app->status,
            'current_approval_level' => $app->current_approval_level,
            'total_approval_levels'  => $app->total_approval_levels,
            'approvals'              => $app->approvals?->map(fn($a) => [
                'level'          => $a->level,
                'approver_type'  => $a->approver_type,
                'assigned_to'    => $a->assignedTo ? $a->assignedTo->full_name : null,
                'actioned_by'    => $a->actionedBy ? $a->actionedBy->full_name : null,
                'status'         => $a->status,
                'comments'       => $a->comments,
                'actioned_at'    => $a->actioned_at?->toISOString(),
            ])->values() ?? [],
            'submitted_at'           => $app->submitted_at?->toISOString(),
            'approved_at'            => $app->approved_at?->toISOString(),
            'rejected_at'            => $app->rejected_at?->toISOString(),
            'cancellation_reason'    => $app->cancellation_reason,
            'created_at'             => $app->created_at->toISOString(),
        ];
    }
}
