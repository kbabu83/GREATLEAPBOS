<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\PayrollPolicy;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PayrollPolicyController extends Controller
{
    // ── Index ─────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $policies = PayrollPolicy::forTenant($tenantId)
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
            'name'                          => 'required|string|max:255',
            'is_default'                    => 'boolean',
            'attendance_cycle_type'         => 'required|in:calendar_month,custom',
            'attendance_cycle_start_day'    => 'integer|min:1|max:28|required_if:attendance_cycle_type,custom',
            'payroll_cycle_type'            => 'required|in:calendar_month,custom',
            'payroll_cycle_start_day'       => 'integer|min:1|max:28|required_if:payroll_cycle_type,custom',
            'payment_frequency'             => 'required|in:monthly,weekly,daily,adhoc',
            'payment_day'                   => 'nullable|integer|min:1|max:31',
            'working_days_basis'            => 'required|in:calendar_days,fixed_26,fixed_30,actual_working_days',
            'lop_applicable'                => 'boolean',
            'lop_deduction_basis'           => 'nullable|in:calendar_days,fixed_26,fixed_30,actual_working_days',
            'block_on_missing_attendance'   => 'boolean',
            'block_on_missing_pan'          => 'boolean',
            'block_on_missing_bank_details' => 'boolean',
            'block_on_missing_uan'          => 'boolean',
            'include_arrears'               => 'boolean',
            'is_active'                     => 'boolean',
        ]);

        $validated['tenant_id'] = $tenantId;

        // Clear other defaults if this one is being set as default
        if (!empty($validated['is_default'])) {
            PayrollPolicy::where('tenant_id', $tenantId)
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        $policy = PayrollPolicy::create($validated);

        return response()->json([
            'message' => 'Payroll policy created successfully.',
            'policy'  => $policy,
        ], 201);
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function show(Request $request, PayrollPolicy $payrollPolicy): JsonResponse
    {
        $this->authorizePolicy($request, $payrollPolicy);

        return response()->json(['policy' => $payrollPolicy]);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function update(Request $request, PayrollPolicy $payrollPolicy): JsonResponse
    {
        $this->authorizePolicy($request, $payrollPolicy);

        $tenantId = $request->user()->tenant_id;

        $validated = $request->validate([
            'name'                          => 'sometimes|required|string|max:255',
            'is_default'                    => 'boolean',
            'attendance_cycle_type'         => 'sometimes|required|in:calendar_month,custom',
            'attendance_cycle_start_day'    => 'integer|min:1|max:28|required_if:attendance_cycle_type,custom',
            'payroll_cycle_type'            => 'sometimes|required|in:calendar_month,custom',
            'payroll_cycle_start_day'       => 'integer|min:1|max:28|required_if:payroll_cycle_type,custom',
            'payment_frequency'             => 'sometimes|required|in:monthly,weekly,daily,adhoc',
            'payment_day'                   => 'nullable|integer|min:1|max:31',
            'working_days_basis'            => 'sometimes|required|in:calendar_days,fixed_26,fixed_30,actual_working_days',
            'lop_applicable'                => 'boolean',
            'lop_deduction_basis'           => 'nullable|in:calendar_days,fixed_26,fixed_30,actual_working_days',
            'block_on_missing_attendance'   => 'boolean',
            'block_on_missing_pan'          => 'boolean',
            'block_on_missing_bank_details' => 'boolean',
            'block_on_missing_uan'          => 'boolean',
            'include_arrears'               => 'boolean',
            'is_active'                     => 'boolean',
        ]);

        // Clear other defaults if this one is being set as default
        if (!empty($validated['is_default'])) {
            PayrollPolicy::where('tenant_id', $tenantId)
                ->where('id', '!=', $payrollPolicy->id)
                ->where('is_default', true)
                ->update(['is_default' => false]);
        }

        $payrollPolicy->update($validated);

        return response()->json([
            'message' => 'Payroll policy updated successfully.',
            'policy'  => $payrollPolicy->fresh(),
        ]);
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function destroy(Request $request, PayrollPolicy $payrollPolicy): JsonResponse
    {
        $this->authorizePolicy($request, $payrollPolicy);

        if ($payrollPolicy->is_default) {
            return response()->json([
                'message' => 'Cannot delete the default payroll policy. Please set another policy as default first.',
            ], 422);
        }

        $payrollPolicy->delete();

        return response()->json(['message' => 'Payroll policy deleted successfully.']);
    }

    // ── Set Default ───────────────────────────────────────────────────────────

    public function setDefault(Request $request, PayrollPolicy $payrollPolicy): JsonResponse
    {
        $this->authorizePolicy($request, $payrollPolicy);

        $tenantId = $request->user()->tenant_id;

        // Clear existing default
        PayrollPolicy::where('tenant_id', $tenantId)
            ->where('is_default', true)
            ->update(['is_default' => false]);

        $payrollPolicy->update(['is_default' => true]);

        return response()->json([
            'message' => 'Default payroll policy updated.',
            'policy'  => $payrollPolicy->fresh(),
        ]);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function authorizePolicy(Request $request, PayrollPolicy $policy): void
    {
        if ($policy->tenant_id !== $request->user()->tenant_id) {
            abort(403, 'Access denied.');
        }
    }
}
