<?php

namespace App\Services\Execution;

use App\Models\Execution\EsTask;
use Carbon\Carbon;

class ReportService {

    /**
     * Get time spent by each user
     */
    public function timeSpentByUser(string $tenantId, ?string $startDate = null, ?string $endDate = null, ?int $managerId = null): array {
        $start = $startDate ? Carbon::parse($startDate) : Carbon::now()->subMonth();
        $end = $endDate ? Carbon::parse($endDate) : Carbon::now();

        $query = EsTask::where('tenant_id', $tenantId)
            ->whereHas('timeLogs', fn($q) =>
                $q->whereBetween('start_time', [$start, $end])
            )
            ->with(['assignedUser:id,name', 'timeLogs' => fn($q) =>
                $q->whereBetween('start_time', [$start, $end])
            ]);

        // If manager filter, only their team
        if ($managerId) {
            $teamUserIds = \App\Models\User::where('reporting_to', $managerId)->pluck('id')->toArray();
            $query->whereIn('assigned_user_id', $teamUserIds);
        }

        $tasks = $query->get();

        $userTimeMap = [];
        foreach ($tasks as $task) {
            $userId = $task->assigned_user_id;
            $userName = $task->assignedUser?->name ?? 'Unassigned';

            if (!isset($userTimeMap[$userId])) {
                $userTimeMap[$userId] = [
                    'user_id' => $userId,
                    'user_name' => $userName,
                    'total_minutes' => 0,
                    'total_hours' => 0,
                    'task_count' => 0,
                ];
            }

            $taskMinutes = $task->timeLogs->sum('duration_minutes');
            $userTimeMap[$userId]['total_minutes'] += $taskMinutes;
            $userTimeMap[$userId]['total_hours'] += round($taskMinutes / 60, 2);
            $userTimeMap[$userId]['task_count']++;
        }

        return array_values(array_sort_by_key($userTimeMap, 'total_hours', SORT_DESCENDING));
    }

    /**
     * Get task completion metrics by user
     */
    public function taskCompletionByUser(string $tenantId, ?int $managerId = null): array {
        $query = EsTask::where('tenant_id', $tenantId)
            ->with('assignedUser:id,name');

        if ($managerId) {
            $teamUserIds = \App\Models\User::where('reporting_to', $managerId)->pluck('id')->toArray();
            $query->whereIn('assigned_user_id', $teamUserIds);
        }

        $tasks = $query->get();

        $userMetrics = [];
        foreach ($tasks as $task) {
            $userId = $task->assigned_user_id;
            $userName = $task->assignedUser?->name ?? 'Unassigned';

            if (!isset($userMetrics[$userId])) {
                $userMetrics[$userId] = [
                    'user_id' => $userId,
                    'user_name' => $userName,
                    'total_tasks' => 0,
                    'completed_tasks' => 0,
                    'cancelled_tasks' => 0,
                    'active_tasks' => 0,
                    'overdue_tasks' => 0,
                    'completion_rate' => 0,
                ];
            }

            $userMetrics[$userId]['total_tasks']++;
            if ($task->status === 'completed') {
                $userMetrics[$userId]['completed_tasks']++;
            } elseif ($task->status === 'cancelled') {
                $userMetrics[$userId]['cancelled_tasks']++;
            } else {
                $userMetrics[$userId]['active_tasks']++;
            }

            if ($task->due_date && new \DateTime($task->due_date) < new \DateTime() && !in_array($task->status, ['completed', 'cancelled'])) {
                $userMetrics[$userId]['overdue_tasks']++;
            }
        }

        // Calculate completion rate
        foreach ($userMetrics as &$metric) {
            if ($metric['total_tasks'] > 0) {
                $metric['completion_rate'] = round(($metric['completed_tasks'] / $metric['total_tasks']) * 100, 2);
            }
        }

        return array_values(array_sort_by_key($userMetrics, 'completed_tasks', SORT_DESCENDING));
    }

    /**
     * Get deadline performance (early, on-time, late)
     */
    public function deadlinePerformanceByUser(string $tenantId, ?int $managerId = null): array {
        $query = EsTask::where('tenant_id', $tenantId)
            ->whereNotNull('completed_at')
            ->whereIn('status', ['completed', 'cancelled'])
            ->with('assignedUser:id,name');

        if ($managerId) {
            $teamUserIds = \App\Models\User::where('reporting_to', $managerId)->pluck('id')->toArray();
            $query->whereIn('assigned_user_id', $teamUserIds);
        }

        $tasks = $query->get();

        $userPerformance = [];
        foreach ($tasks as $task) {
            $userId = $task->assigned_user_id;
            $userName = $task->assignedUser?->name ?? 'Unassigned';

            if (!isset($userPerformance[$userId])) {
                $userPerformance[$userId] = [
                    'user_id' => $userId,
                    'user_name' => $userName,
                    'early' => 0,
                    'on_time' => 0,
                    'late' => 0,
                    'avg_days_difference' => 0,
                ];
            }

            if ($task->due_date && $task->completed_at) {
                $dueDate = new \DateTime($task->due_date);
                $completedDate = new \DateTime($task->completed_at);
                $diff = $completedDate->diff($dueDate);
                $days = ($completedDate < $dueDate) ? -$diff->days : $diff->days;

                if ($days < 0) {
                    $userPerformance[$userId]['early']++;
                } elseif ($days === 0) {
                    $userPerformance[$userId]['on_time']++;
                } else {
                    $userPerformance[$userId]['late']++;
                }
            }
        }

        return array_values(array_sort_by_key($userPerformance, 'on_time', SORT_DESCENDING));
    }

    /**
     * Get team summary metrics
     */
    public function teamSummary(string $tenantId, ?int $managerId = null): array {
        $tasks = EsTask::where('tenant_id', $tenantId);

        if ($managerId) {
            $teamUserIds = \App\Models\User::where('reporting_to', $managerId)->pluck('id')->toArray();
            $tasks->whereIn('assigned_user_id', $teamUserIds);
        }

        $tasks = $tasks->get();

        $totalTasks = $tasks->count();
        $completedTasks = $tasks->where('status', 'completed')->count();
        $activeTasks = $tasks->whereNotIn('status', ['completed', 'cancelled'])->count();
        $overdueTasks = $tasks->filter(fn($t) =>
            $t->due_date && new \DateTime($t->due_date) < new \DateTime() &&
            !in_array($t->status, ['completed', 'cancelled'])
        )->count();

        $totalMinutes = 0;
        foreach ($tasks as $task) {
            $totalMinutes += $task->timeLogs->sum('duration_minutes');
        }

        return [
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'active_tasks' => $activeTasks,
            'overdue_tasks' => $overdueTasks,
            'total_hours_logged' => round($totalMinutes / 60, 2),
            'completion_rate' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 2) : 0,
            'team_member_count' => $managerId ?
                \App\Models\User::where('reporting_to', $managerId)->count() :
                \App\Models\User::where('tenant_id', $tenantId)->count(),
        ];
    }

    /**
     * Get daily time tracking data
     */
    public function dailyTimeTracking(string $tenantId, int $days = 30, ?int $managerId = null): array {
        $startDate = Carbon::now()->subDays($days);
        $endDate = Carbon::now();

        $timeLogs = \App\Models\Execution\EsTaskTimeLog::whereHas('task', fn($q) =>
            $q->where('tenant_id', $tenantId)
        )
        ->whereBetween('start_time', [$startDate, $endDate]);

        if ($managerId) {
            $teamUserIds = \App\Models\User::where('reporting_to', $managerId)->pluck('id')->toArray();
            $timeLogs->whereHas('task', fn($q) =>
                $q->whereIn('assigned_user_id', $teamUserIds)
            );
        }

        $timeLogs = $timeLogs->with('user:id,name')->get();

        $dailyData = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            $dailyData[$date] = ['date' => $date, 'hours' => 0, 'tasks' => 0];
        }

        foreach ($timeLogs as $log) {
            $date = $log->start_time->format('Y-m-d');
            if (isset($dailyData[$date])) {
                $dailyData[$date]['hours'] += round($log->duration_minutes / 60, 2);
                $dailyData[$date]['tasks']++;
            }
        }

        return array_values($dailyData);
    }

    /**
     * Get task priority distribution
     */
    public function taskPriorityDistribution(string $tenantId, ?int $managerId = null): array {
        $query = EsTask::where('tenant_id', $tenantId);

        if ($managerId) {
            $teamUserIds = \App\Models\User::where('reporting_to', $managerId)->pluck('id')->toArray();
            $query->whereIn('assigned_user_id', $teamUserIds);
        }

        $tasks = $query->get();

        $priorityMap = [
            'urgent' => ['label' => 'Urgent', 'count' => 0, 'color' => '#ef4444'],
            'high' => ['label' => 'High', 'count' => 0, 'color' => '#f97316'],
            'medium' => ['label' => 'Medium', 'count' => 0, 'color' => '#eab308'],
            'low' => ['label' => 'Low', 'count' => 0, 'color' => '#6b7280'],
        ];

        foreach ($tasks as $task) {
            if (isset($priorityMap[$task->priority])) {
                $priorityMap[$task->priority]['count']++;
            }
        }

        return array_values($priorityMap);
    }
}

function array_sort_by_key(&$array, $key, $sort_order = SORT_ASC) {
    $sort_keys = array_column($array, $key);
    array_multisort($sort_keys, $sort_order, $array);
    return $array;
}
