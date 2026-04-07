<?php

namespace App\Http\Controllers\Execution;

use App\Http\Controllers\Controller;
use App\Services\Execution\ReportService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller {
    public function __construct(
        private ReportService $service,
    ) {}

    /**
     * Time spent by each user
     */
    public function timeSpentByUser(Request $request): JsonResponse {
        $tenantId = auth()->user()->tenant_id;
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $managerId = null;

        // If user has reportees, can view their team
        if ($request->boolean('team_only')) {
            $managerId = auth()->id();
        }

        $data = $this->service->timeSpentByUser($tenantId, $startDate, $endDate, $managerId);
        return response()->json($data);
    }

    /**
     * Task completion metrics
     */
    public function taskCompletionByUser(Request $request): JsonResponse {
        $tenantId = auth()->user()->tenant_id;
        $managerId = null;

        if ($request->boolean('team_only')) {
            $managerId = auth()->id();
        }

        $data = $this->service->taskCompletionByUser($tenantId, $managerId);
        return response()->json($data);
    }

    /**
     * Deadline performance metrics
     */
    public function deadlinePerformance(Request $request): JsonResponse {
        $tenantId = auth()->user()->tenant_id;
        $managerId = null;

        if ($request->boolean('team_only')) {
            $managerId = auth()->id();
        }

        $data = $this->service->deadlinePerformanceByUser($tenantId, $managerId);
        return response()->json($data);
    }

    /**
     * Team summary
     */
    public function teamSummary(Request $request): JsonResponse {
        $tenantId = auth()->user()->tenant_id;
        $managerId = null;

        if ($request->boolean('team_only')) {
            $managerId = auth()->id();
        }

        $data = $this->service->teamSummary($tenantId, $managerId);
        return response()->json($data);
    }

    /**
     * Daily time tracking
     */
    public function dailyTimeTracking(Request $request): JsonResponse {
        $tenantId = auth()->user()->tenant_id;
        $days = (int)$request->input('days', 30);
        $managerId = null;

        if ($request->boolean('team_only')) {
            $managerId = auth()->id();
        }

        $data = $this->service->dailyTimeTracking($tenantId, $days, $managerId);
        return response()->json($data);
    }

    /**
     * Task priority distribution
     */
    public function taskPriority(Request $request): JsonResponse {
        $tenantId = auth()->user()->tenant_id;
        $managerId = null;

        if ($request->boolean('team_only')) {
            $managerId = auth()->id();
        }

        $data = $this->service->taskPriorityDistribution($tenantId, $managerId);
        return response()->json($data);
    }
}
