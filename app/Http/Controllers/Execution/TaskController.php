<?php
namespace App\Http\Controllers\Execution;
use App\Http\Controllers\Controller;
use App\Models\Execution\EsTask;
use App\Services\Execution\TaskService;
use App\Services\Execution\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TaskController extends Controller {
    public function __construct(
        private TaskService $service,
        private ActivityLogService $logger,
    ) {}

    public function index(Request $request): JsonResponse {
        $tenantId = auth()->user()->tenant_id;
        $tasks = $this->service->paginate($tenantId, $request->only([
            'status','role_id','priority','assigned_to','due_today','overdue','search',
        ]), (int)$request->get('per_page', 20));
        return response()->json($tasks);
    }

    public function myTasks(): JsonResponse {
        $tasks = $this->service->myTasksToday(auth()->id(), auth()->user()->tenant_id);
        return response()->json($tasks);
    }

    public function staffTasks(Request $request): JsonResponse {
        $tab   = $request->input('tab', 'active'); // active | needs_attention | completed
        $tasks = $this->service->staffTasks(auth()->id(), auth()->user()->tenant_id, $tab);
        return response()->json($tasks);
    }

    public function teamTasks(Request $request): JsonResponse {
        $tab   = $request->input('tab', 'active'); // active | needs_attention | completed
        $tasks = $this->service->teamTasks(auth()->id(), auth()->user()->tenant_id, $tab);
        return response()->json($tasks);
    }

    public function store(Request $request): JsonResponse {
        $data = $request->validate([
            'title'            => 'required|string|max:500',
            'description'      => 'nullable|string',
            'role_id'          => 'required|integer|exists:es_roles,id',
            'assigned_user_id' => 'nullable|integer|exists:users,id',
            'area_id'          => 'nullable|integer|exists:es_role_areas,id',
            'activity_id'      => 'nullable|integer|exists:es_role_activities,id',
            'priority'         => 'nullable|in:low,medium,high,urgent',
            'due_date'         => 'nullable|date',
            'observer_ids'     => 'nullable|array',
            'observer_ids.*'   => 'integer|exists:users,id',
        ]);
        $task = $this->service->create(auth()->user()->tenant_id, auth()->id(), $data);
        return response()->json($task, 201);
    }

    public function show(EsTask $esTask): JsonResponse {
        $this->authorizeTask($esTask);
        $task = $this->service->show($esTask->id, auth()->user()->tenant_id);
        return response()->json($task);
    }

    public function update(Request $request, EsTask $esTask): JsonResponse {
        $this->authorizeTask($esTask);
        $data = $request->validate([
            'title'             => 'sometimes|string|max:500',
            'description'       => 'nullable|string',
            'role_id'           => 'sometimes|integer|exists:es_roles,id',
            'assigned_user_id'  => 'nullable|integer|exists:users,id',
            'area_id'           => 'nullable|integer|exists:es_role_areas,id',
            'activity_id'       => 'nullable|integer|exists:es_role_activities,id',
            'status'            => 'nullable|in:pending,in_progress,completed,cancelled',
            'priority'          => 'nullable|in:low,medium,high,urgent',
            'due_date'          => 'nullable|date',
            'reassign_reason'   => 'nullable|string',
            'action'            => 'nullable|string',
        ]);
        $task = $this->service->update($esTask, auth()->id(), $data);
        return response()->json($task);
    }

    public function complete(Request $request, EsTask $esTask): JsonResponse {
        $this->authorizeTask($esTask);
        $request->validate([
            'note' => 'nullable|string',
            'action' => 'nullable|string',
        ]);
        $task = $this->service->complete($esTask, auth()->id(), $request->note, $request->input('action'));
        return response()->json($task);
    }

    public function destroy(EsTask $esTask): JsonResponse {
        $this->authorizeTask($esTask);
        $this->service->delete($esTask);
        return response()->json(null, 204);
    }

    // ── Notes ─────────────────────────────────────────────────────────────────
    public function addNote(Request $request, EsTask $esTask): JsonResponse {
        $this->authorizeTask($esTask);
        $request->validate(['note' => 'required|string']);
        $note = $this->service->addNote($esTask, auth()->id(), $request->note);
        return response()->json($note, 201);
    }

    // ── Time Logs ─────────────────────────────────────────────────────────────
    public function logTime(Request $request, EsTask $esTask): JsonResponse {
        $this->authorizeTask($esTask);
        $data = $request->validate([
            'start_time' => 'required|date',
            'end_time'   => 'required|date|after:start_time',
            'notes'      => 'nullable|string',
        ]);
        $log = $this->service->logTime($esTask, auth()->id(), $data);
        return response()->json($log, 201);
    }

    public function stopTimer(Request $request, EsTask $esTask, int $logId): JsonResponse {
        $this->authorizeTask($esTask);
        $request->validate(['notes' => 'nullable|string']);
        $log = $this->service->stopTimer($logId, auth()->id(), auth()->user()->tenant_id, $request->notes);
        abort_if(!$log, 404, 'Active timer not found');
        return response()->json($log);
    }

    // ── Reviews ───────────────────────────────────────────────────────────────
    public function addReview(Request $request, EsTask $esTask): JsonResponse {
        $this->authorizeTask($esTask);
        $data = $request->validate([
            'status'        => 'required|in:pending,approved,rework',
            'quality_score' => 'nullable|integer|min:1|max:10',
            'remarks'       => 'nullable|string',
        ]);
        $review = $this->service->addReview($esTask, auth()->id(), $data);
        return response()->json($review, 201);
    }

    // ── Observers ─────────────────────────────────────────────────────────────
    public function addObserver(Request $request, EsTask $esTask): JsonResponse {
        $this->authorizeTask($esTask);
        $request->validate(['user_id' => 'required|integer|exists:users,id']);
        $obs = $this->service->addObserver($esTask, (int)$request->user_id);
        return response()->json($obs->load('user:id,name'), 201);
    }

    public function removeObserver(EsTask $esTask, int $userId): JsonResponse {
        $this->authorizeTask($esTask);
        $this->service->removeObserver($esTask, $userId);
        return response()->json(null, 204);
    }

    // ── Activity Log ─────────────────────────────────────────────────────────
    public function activityLog(EsTask $esTask): JsonResponse {
        $this->authorizeTask($esTask);
        $logs = $this->logger->forEntity('task', $esTask->id, auth()->user()->tenant_id);
        return response()->json($logs);
    }

    // ── Deadline Change Request ───────────────────────────────────────────────
    public function requestDeadlineChange(Request $request, EsTask $esTask): JsonResponse {
        $this->authorizeTask($esTask);
        $data = $request->validate([
            'new_due_date' => 'required|date|after:today',
            'reason'       => 'required|string|max:500',
        ]);
        $task = $this->service->requestDeadlineChange($esTask, auth()->id(), $data['new_due_date'], $data['reason']);
        return response()->json($task);
    }

    public function managerDeadlineChanges(): JsonResponse {
        $tasks = $this->service->managerPendingDeadlineChanges(auth()->id(), auth()->user()->tenant_id);
        return response()->json($tasks);
    }

    public function approveDeadlineChange(Request $request, EsTask $esTask): JsonResponse {
        $this->authorizeTask($esTask);
        $request->validate(['approved' => 'required|boolean']);
        $task = $this->service->reviewDeadlineChange($esTask, auth()->id(), $request->boolean('approved'));
        return response()->json($task);
    }

    private function authorizeTask(EsTask $task): void {
        abort_if($task->tenant_id !== auth()->user()->tenant_id, 403, 'Access denied');
    }
}
