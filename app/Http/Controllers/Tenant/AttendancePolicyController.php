<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\AttendancePolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendancePolicyController extends Controller
{
    // ── Index ─────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $policies = AttendancePolicy::forTenant($tenantId)
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->paginate(10);

        return response()->json([
            'data' => $policies->items(),
            'meta' => [
                'current_page' => $policies->currentPage(),
                'last_page'    => $policies->lastPage(),
                'per_page'     => $policies->perPage(),
                'total'        => $policies->total(),
            ],
        ]);
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $validated = $request->validate([
            'name'                        => 'required|string|max:255',
            'is_default'                  => 'boolean',
            'work_hours_per_day'          => 'required|numeric|min:1|max:24',
            'work_days_per_week'          => 'required|integer|min:1|max:7',
            'work_start_time'             => 'required|date_format:H:i',
            'work_end_time'               => 'required|date_format:H:i',
            'grace_period_minutes'        => 'integer|min:0|max:60',
            'half_day_hours'              => 'nullable|numeric|min:0',
            'min_hours_for_present'       => 'nullable|numeric|min:0',
            'min_hours_for_half_day'      => 'nullable|numeric|min:0',
            'overtime_applicable'         => 'boolean',
            'overtime_rate_multiplier'    => 'nullable|numeric|min:0',
            'late_deduction_applicable'   => 'boolean',
            'late_deduction_type'         => 'nullable|in:none,half_day,full_day,per_minute',
            'late_deduction_after_minutes'=> 'nullable|integer|min:0',
            'cycle_type'                  => 'required|in:calendar_month,custom',
            'cycle_start_day'             => 'integer|min:1|max:28|required_if:cycle_type,custom',
            'week_off_days'               => 'array',
            'week_off_days.*'             => 'integer|min:0|max:6',
            'is_active'                   => 'boolean',
        ]);

        $validated['tenant_id'] = $tenantId;

        // If setting this policy as default, clear other defaults first
        if (!empty($validated['is_default'])) {
            AttendancePolicy::where('tenant_id', $tenantId)
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        $policy = AttendancePolicy::create($validated);

        return response()->json([
            'message' => 'Attendance policy created successfully.',
            'policy'  => $policy,
        ], 201);
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function show(Request $request, AttendancePolicy $attendancePolicy): JsonResponse
    {
        $this->authorizePolicy($request, $attendancePolicy);

        return response()->json(['policy' => $attendancePolicy]);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function update(Request $request, AttendancePolicy $attendancePolicy): JsonResponse
    {
        $this->authorizePolicy($request, $attendancePolicy);

        $tenantId = $request->user()->tenant_id;

        $validated = $request->validate([
            'name'                        => 'sometimes|required|string|max:255',
            'is_default'                  => 'boolean',
            'work_hours_per_day'          => 'sometimes|required|numeric|min:1|max:24',
            'work_days_per_week'          => 'sometimes|required|integer|min:1|max:7',
            'work_start_time'             => 'sometimes|required|date_format:H:i',
            'work_end_time'               => 'sometimes|required|date_format:H:i',
            'grace_period_minutes'        => 'integer|min:0|max:60',
            'half_day_hours'              => 'nullable|numeric|min:0',
            'min_hours_for_present'       => 'nullable|numeric|min:0',
            'min_hours_for_half_day'      => 'nullable|numeric|min:0',
            'overtime_applicable'         => 'boolean',
            'overtime_rate_multiplier'    => 'nullable|numeric|min:0',
            'late_deduction_applicable'   => 'boolean',
            'late_deduction_type'         => 'nullable|in:none,half_day,full_day,per_minute',
            'late_deduction_after_minutes'=> 'nullable|integer|min:0',
            'cycle_type'                  => 'sometimes|required|in:calendar_month,custom',
            'cycle_start_day'             => 'integer|min:1|max:28|required_if:cycle_type,custom',
            'week_off_days'               => 'array',
            'week_off_days.*'             => 'integer|min:0|max:6',
            'is_active'                   => 'boolean',
        ]);

        // If setting this policy as default, clear other defaults first
        if (!empty($validated['is_default'])) {
            AttendancePolicy::where('tenant_id', $tenantId)
                ->where('id', '!=', $attendancePolicy->id)
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        $attendancePolicy->update($validated);

        return response()->json([
            'message' => 'Attendance policy updated successfully.',
            'policy'  => $attendancePolicy->fresh(),
        ]);
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function destroy(Request $request, AttendancePolicy $attendancePolicy): JsonResponse
    {
        $this->authorizePolicy($request, $attendancePolicy);

        if ($attendancePolicy->is_default) {
            return response()->json([
                'message' => 'Cannot delete the default attendance policy. Please set another policy as default first.',
            ], 422);
        }

        $attendancePolicy->delete();

        return response()->json(['message' => 'Attendance policy deleted successfully.']);
    }

    // ── Set Default ───────────────────────────────────────────────────────────

    public function setDefault(Request $request, AttendancePolicy $attendancePolicy): JsonResponse
    {
        $this->authorizePolicy($request, $attendancePolicy);

        $tenantId = $request->user()->tenant_id;

        // Clear existing default
        AttendancePolicy::where('tenant_id', $tenantId)
            ->where('is_default', true)
            ->update(['is_default' => false]);

        $attendancePolicy->update(['is_default' => true]);

        return response()->json([
            'message' => 'Default attendance policy updated.',
            'policy'  => $attendancePolicy->fresh(),
        ]);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function authorizePolicy(Request $request, AttendancePolicy $policy): void
    {
        if ($policy->tenant_id !== $request->user()->tenant_id) {
            abort(403, 'Access denied.');
        }
    }
}
