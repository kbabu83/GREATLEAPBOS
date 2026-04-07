<?php
namespace App\Services\Execution;
use App\Models\Execution\EsTask;
use App\Repositories\Execution\TaskRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class TaskService {
    public function __construct(
        private TaskRepository $repo,
        private ActivityLogService $logger,
    ) {}

    public function paginate(string $tenantId, array $filters, int $perPage = 20): LengthAwarePaginator {
        return $this->repo->paginate($tenantId, $filters, $perPage);
    }

    public function myTasksToday(int $userId, string $tenantId): Collection {
        return $this->repo->myTasksToday($userId, $tenantId);
    }

    public function staffTasks(int $userId, string $tenantId, string $tab): Collection {
        return $this->repo->staffTasks($userId, $tenantId, $tab);
    }

    public function teamTasks(int $userId, string $tenantId, string $tab): Collection {
        return $this->repo->teamTasks($userId, $tenantId, $tab);
    }

    public function show(int $id, string $tenantId): ?EsTask {
        return $this->repo->findWithRelations($id, $tenantId);
    }

    public function create(string $tenantId, int $userId, array $data): EsTask {
        $task = $this->repo->create($tenantId, [
            'title'            => $data['title'],
            'description'      => $data['description'] ?? null,
            'role_id'          => $data['role_id'],
            'assigned_user_id' => $data['assigned_user_id'] ?? null,
            'created_by_user_id' => $userId,
            'area_id'          => $data['area_id'] ?? null,
            'activity_id'      => $data['activity_id'] ?? null,
            'status'           => 'pending',
            'priority'         => $data['priority'] ?? 'medium',
            'due_date'         => $data['due_date'] ?? null,
        ]);

        // record initial assignment
        if ($task->assigned_user_id) {
            $this->repo->reassign($task, $task->assigned_user_id, $userId, 'Initial assignment');
        }

        // add observers
        if (!empty($data['observer_ids'])) {
            foreach ($data['observer_ids'] as $oid) { $this->repo->addObserver($task, (int)$oid); }
        }

        $this->logger->log($tenantId, $userId, 'task_created', 'task', $task->id, ['title' => $task->title]);
        return $this->repo->findWithRelations($task->id, $tenantId);
    }

    public function update(EsTask $task, int $userId, array $data): EsTask {
        $this->repo->update($task, array_intersect_key($data, array_flip([
            'title','description','role_id','area_id','activity_id','status','priority','due_date',
        ])));

        if (array_key_exists('assigned_user_id', $data) && $data['assigned_user_id'] != $task->assigned_user_id) {
            $this->repo->reassign($task, $data['assigned_user_id'], $userId, $data['reassign_reason'] ?? null);
            $this->logger->log($task->tenant_id, $userId, 'task_assigned', 'task', $task->id, [
                'new_user_id' => $data['assigned_user_id'],
            ]);
        }

        if (($data['status'] ?? null) === 'completed') {
            $task->update(['completed_at' => now()]);
            $this->logger->log($task->tenant_id, $userId, 'task_completed', 'task', $task->id, []);
        } elseif (($data['status'] ?? null) === 'cancelled') {
            $task->update(['completed_at' => now()]);
            $this->logger->log($task->tenant_id, $userId, 'task_cancelled', 'task', $task->id, []);
        } elseif (($data['action'] ?? null) === 'reopened') {
            $task->update(['completed_at' => null]);
            $this->logger->log($task->tenant_id, $userId, 'task_reopened', 'task', $task->id, []);
        } else {
            $this->logger->log($task->tenant_id, $userId, 'task_updated', 'task', $task->id, ['status' => $data['status'] ?? null]);
        }

        return $this->repo->findWithRelations($task->id, $task->tenant_id);
    }

    public function complete(EsTask $task, int $userId, ?string $note, ?string $action = null): EsTask {
        $task->update(['status' => 'completed', 'completed_at' => now()]);
        if ($note) $this->repo->addNote($task, $userId, $note);
        $logAction = $action === 'cancelled' ? 'task_cancelled' : 'task_completed';
        $this->logger->log($task->tenant_id, $userId, $logAction, 'task', $task->id, []);
        return $this->repo->findWithRelations($task->id, $task->tenant_id);
    }

    public function addNote(EsTask $task, int $userId, string $note) {
        $n = $this->repo->addNote($task, $userId, $note);
        $this->logger->log($task->tenant_id, $userId, 'note_added', 'task', $task->id, ['note_id' => $n->id]);
        return $n->load('user:id,name');
    }

    public function logTime(EsTask $task, int $userId, array $data) {
        $log = $this->repo->logTime($task, $userId, $data);
        $this->logger->log($task->tenant_id, $userId, 'time_logged', 'task', $task->id, ['minutes' => $log->duration_minutes]);
        return $log->load('user:id,name');
    }

    public function stopTimer(int $logId, int $userId, string $tenantId, ?string $notes) {
        return $this->repo->stopTimer($logId, $userId, $tenantId, $notes);
    }

    public function reassign(EsTask $task, ?int $newUserId, int $byUserId, ?string $reason): EsTask {
        $updated = $this->repo->reassign($task, $newUserId, $byUserId, $reason);
        $this->logger->log($task->tenant_id, $byUserId, 'task_assigned', 'task', $task->id, ['new_user_id' => $newUserId]);
        return $updated;
    }

    public function addReview(EsTask $task, int $reviewerId, array $data) {
        $review = $this->repo->addReview($task, $reviewerId, $data);
        if ($data['status'] === 'rework') $task->update(['status' => 'in_progress']);
        $this->logger->log($task->tenant_id, $reviewerId, 'review_added', 'task', $task->id, ['status' => $data['status']]);
        return $review->load('reviewer:id,name');
    }

    public function addObserver(EsTask $task, int $userId) { return $this->repo->addObserver($task, $userId); }
    public function removeObserver(EsTask $task, int $userId): bool { return $this->repo->removeObserver($task, $userId); }
    public function delete(EsTask $task): void { $this->repo->delete($task); }
    public function activityLogs(string $tenantId, int $taskId, ActivityLogService $logger) {
        return $logger->forEntity('task', $taskId, $tenantId);
    }

    public function requestDeadlineChange(EsTask $task, int $userId, string $newDueDate, string $reason): EsTask {
        $task->update([
            'deadline_change_requested_at' => now(),
            'requested_new_due_date' => $newDueDate,
            'deadline_change_reason' => $reason,
            'deadline_change_status' => 'pending',
        ]);
        $this->logger->log($task->tenant_id, $userId, 'deadline_change_requested', 'task', $task->id, [
            'new_due_date' => $newDueDate,
            'reason' => $reason,
        ]);
        return $this->repo->findWithRelations($task->id, $task->tenant_id);
    }

    public function managerPendingDeadlineChanges(int $managerId, string $tenantId): Collection {
        return $this->repo->managerPendingDeadlineChanges($managerId, $tenantId);
    }

    public function reviewDeadlineChange(EsTask $task, int $reviewerId, bool $approved): EsTask {
        if ($approved) {
            $task->update([
                'due_date' => $task->requested_new_due_date,
                'deadline_change_status' => 'approved',
                'deadline_change_reviewed_at' => now(),
                'deadline_change_reviewed_by' => $reviewerId,
            ]);
            $this->logger->log($task->tenant_id, $reviewerId, 'deadline_change_approved', 'task', $task->id, [
                'new_due_date' => $task->requested_new_due_date,
            ]);
        } else {
            $task->update([
                'deadline_change_status' => 'rejected',
                'deadline_change_reviewed_at' => now(),
                'deadline_change_reviewed_by' => $reviewerId,
            ]);
            $this->logger->log($task->tenant_id, $reviewerId, 'deadline_change_rejected', 'task', $task->id, []);
        }
        return $this->repo->findWithRelations($task->id, $task->tenant_id);
    }
}
