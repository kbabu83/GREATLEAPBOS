<?php
namespace App\Repositories\Execution;
use App\Models\Execution\EsTask;
use App\Models\Execution\EsTaskNote;
use App\Models\Execution\EsTaskTimeLog;
use App\Models\Execution\EsTaskAssignment;
use App\Models\Execution\EsTaskReview;
use App\Models\Execution\EsTaskObserver;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class TaskRepository {
    public function paginate(string $tenantId, array $filters = [], int $perPage = 20): LengthAwarePaginator {
        $q = EsTask::where('tenant_id', $tenantId)
            ->with(['role:id,name', 'assignedUser:id,name', 'area:id,area_name', 'activity:id,activity_name'])
            ->withCount(['notes','timeLogs']);

        if (!empty($filters['status']))       $q->where('status', $filters['status']);
        if (!empty($filters['role_id']))      $q->where('role_id', $filters['role_id']);
        if (!empty($filters['priority']))     $q->where('priority', $filters['priority']);
        if (!empty($filters['assigned_to'])) $q->where('assigned_user_id', $filters['assigned_to']);
        if (!empty($filters['due_today']))    $q->whereDate('due_date', today());
        if (!empty($filters['overdue']))      $q->whereDate('due_date', '<', today())->whereNotIn('status', ['completed','cancelled']);
        if (!empty($filters['search']))       $q->where('title', 'like', '%'.$filters['search'].'%');

        return $q->latest()->paginate($perPage);
    }

    public function myTasksToday(int $userId, string $tenantId): Collection {
        return EsTask::where('tenant_id', $tenantId)
            ->where('assigned_user_id', $userId)
            ->whereNotIn('status', ['completed','cancelled'])
            ->where(fn($q) => $q->whereDate('due_date', today())->orWhereDate('due_date', '<', today()))
            ->with(['role:id,name','area:id,area_name','activity:id,activity_name'])
            ->orderByRaw("FIELD(priority,'urgent','high','medium','low')")
            ->get();
    }

    /**
     * Staff-scoped task list: tasks assigned to, created by, or observed by the user.
     *
     * Tabs:
     *   active           — not completed/cancelled
     *   needs_attention  — created by me AND completed (awaiting my final review)
     *   completed        — completed or cancelled
     */
    public function staffTasks(int $userId, string $tenantId, string $tab = 'active'): Collection {
        $q = EsTask::where('tenant_id', $tenantId)
            ->where(function ($sub) use ($userId) {
                $sub->where('assigned_user_id', $userId)
                    ->orWhere('created_by_user_id', $userId)
                    ->orWhereHas('observers', fn ($o) => $o->where('user_id', $userId));
            })
            ->with([
                'role:id,name',
                'area:id,area_name',
                'activity:id,activity_name',
                'assignedUser:id,name',
                'createdBy:id,name',
                'timeLogs',
            ])
            ->withCount(['notes']);

        switch ($tab) {
            case 'needs_attention':
                // Tasks I created that have been completed — need my final review/approval
                $q->where('created_by_user_id', $userId)
                  ->where('status', 'completed')
                  ->whereDoesntHave('reviews', fn ($r) => $r->where('reviewer_id', $userId));
                break;

            case 'completed':
                $q->whereIn('status', ['completed', 'cancelled']);
                break;

            default: // active
                $q->whereNotIn('status', ['completed', 'cancelled']);
                break;
        }

        return $q->orderByRaw("FIELD(priority,'urgent','high','medium','low')")
                 ->latest()
                 ->get();
    }

    /**
     * Team-scoped task list: tasks assigned to users who report to the current user.
     *
     * Tabs:
     *   active           — not completed/cancelled
     *   needs_attention  — completed (awaiting manager's review)
     *   completed        — completed or cancelled
     */
    public function teamTasks(int $managerId, string $tenantId, string $tab = 'active'): Collection {
        // Get all users who report to this manager
        $reportingUserIds = \App\Models\User::where('tenant_id', $tenantId)
            ->where('reporting_to', $managerId)
            ->pluck('id')
            ->toArray();

        // If no one reports to this user, return empty collection
        if (empty($reportingUserIds)) {
            return collect([]);
        }

        $q = EsTask::where('tenant_id', $tenantId)
            ->whereIn('assigned_user_id', $reportingUserIds)
            ->with([
                'role:id,name',
                'area:id,area_name',
                'activity:id,activity_name',
                'assignedUser:id,name',
                'createdBy:id,name',
                'timeLogs',
            ])
            ->withCount(['notes']);

        switch ($tab) {
            case 'needs_attention':
                // Team tasks that have been completed — need manager's review
                $q->where('status', 'completed');
                break;

            case 'completed':
                $q->whereIn('status', ['completed', 'cancelled']);
                break;

            default: // active
                $q->whereNotIn('status', ['completed', 'cancelled']);
                break;
        }

        return $q->orderByRaw("FIELD(priority,'urgent','high','medium','low')")
                 ->latest()
                 ->get();
    }

    public function findWithRelations(int $id, string $tenantId): ?EsTask {
        return EsTask::where('id', $id)->where('tenant_id', $tenantId)
            ->with([
                'role:id,name,purpose',
                'area:id,area_name',
                'activity:id,activity_name,frequency_type',
                'assignedUser:id,name,email',
                'createdBy:id,name',
                'notes.user:id,name',
                'timeLogs.user:id,name',
                'assignments.previousUser:id,name',
                'assignments.newUser:id,name',
                'assignments.assignedBy:id,name',
                'reviews.reviewer:id,name',
                'observers.user:id,name',
            ])
            ->first();
    }

    public function create(string $tenantId, array $data): EsTask {
        return EsTask::create(array_merge($data, ['tenant_id' => $tenantId]));
    }

    public function update(EsTask $task, array $data): EsTask {
        $task->update($data);
        return $task->fresh();
    }

    public function delete(EsTask $task): void { $task->delete(); }

    // ── Notes ─────────────────────────────────────────────────────────────────
    public function addNote(EsTask $task, int $userId, string $note): EsTaskNote {
        return EsTaskNote::create(['tenant_id' => $task->tenant_id, 'task_id' => $task->id, 'user_id' => $userId, 'note' => $note]);
    }

    public function deleteNote(int $noteId, int $userId, string $tenantId): bool {
        return (bool) EsTaskNote::where('id', $noteId)->where('user_id', $userId)->where('tenant_id', $tenantId)->delete();
    }

    // ── Time Logs ─────────────────────────────────────────────────────────────
    public function startTimer(EsTask $task, int $userId, string $notes = ''): EsTaskTimeLog {
        return EsTaskTimeLog::create([
            'tenant_id'  => $task->tenant_id,
            'task_id'    => $task->id,
            'user_id'    => $userId,
            'start_time' => now(),
            'notes'      => $notes,
        ]);
    }

    public function logTime(EsTask $task, int $userId, array $data): EsTaskTimeLog {
        $start = \Carbon\Carbon::parse($data['start_time']);
        $end   = \Carbon\Carbon::parse($data['end_time']);
        return EsTaskTimeLog::create([
            'tenant_id'        => $task->tenant_id,
            'task_id'          => $task->id,
            'user_id'          => $userId,
            'start_time'       => $start,
            'end_time'         => $end,
            'duration_minutes' => max(0, (int)$start->diffInMinutes($end)),
            'notes'            => $data['notes'] ?? null,
        ]);
    }

    public function stopTimer(int $logId, int $userId, string $tenantId, ?string $notes): ?EsTaskTimeLog {
        $log = EsTaskTimeLog::where('id', $logId)->where('user_id', $userId)->where('tenant_id', $tenantId)->whereNull('end_time')->first();
        if (!$log) return null;
        $log->end_time = now();
        $log->duration_minutes = max(0, (int)\Carbon\Carbon::parse($log->start_time)->diffInMinutes($log->end_time));
        if ($notes) $log->notes = $notes;
        $log->save();
        return $log;
    }

    public function deleteTimeLog(int $logId, int $userId, string $tenantId): bool {
        return (bool) EsTaskTimeLog::where('id', $logId)->where('user_id', $userId)->where('tenant_id', $tenantId)->delete();
    }

    // ── Assignment ─────────────────────────────────────────────────────────────
    public function reassign(EsTask $task, ?int $newUserId, int $assignedByUserId, ?string $reason): EsTask {
        EsTaskAssignment::create([
            'tenant_id'          => $task->tenant_id,
            'task_id'            => $task->id,
            'previous_user_id'   => $task->assigned_user_id,
            'new_user_id'        => $newUserId,
            'assigned_by_user_id'=> $assignedByUserId,
            'reason'             => $reason,
        ]);
        $task->update(['assigned_user_id' => $newUserId]);
        return $task->fresh();
    }

    // ── Reviews ───────────────────────────────────────────────────────────────
    public function addReview(EsTask $task, int $reviewerId, array $data): EsTaskReview {
        return EsTaskReview::create([
            'tenant_id'     => $task->tenant_id,
            'task_id'       => $task->id,
            'reviewer_id'   => $reviewerId,
            'status'        => $data['status'],
            'quality_score' => $data['quality_score'] ?? null,
            'remarks'       => $data['remarks'] ?? null,
            'reviewed_at'   => now(),
        ]);
    }

    // ── Observers ─────────────────────────────────────────────────────────────
    public function addObserver(EsTask $task, int $userId): EsTaskObserver {
        return EsTaskObserver::firstOrCreate([
            'task_id' => $task->id,
            'user_id' => $userId,
        ], ['tenant_id' => $task->tenant_id]);
    }

    public function removeObserver(EsTask $task, int $userId): bool {
        return (bool) EsTaskObserver::where('task_id', $task->id)->where('user_id', $userId)->delete();
    }

    // ── Deadline Change Requests ──────────────────────────────────────────────
    public function managerPendingDeadlineChanges(int $managerId, string $tenantId): Collection {
        return EsTask::where('tenant_id', $tenantId)
            ->where('created_by_user_id', $managerId)
            ->where('deadline_change_status', 'pending')
            ->with([
                'role:id,name',
                'area:id,area_name',
                'activity:id,activity_name',
                'assignedUser:id,name',
                'createdBy:id,name',
            ])
            ->withCount(['notes', 'timeLogs'])
            ->orderByRaw("FIELD(priority,'urgent','high','medium','low')")
            ->latest()
            ->get();
    }
}
