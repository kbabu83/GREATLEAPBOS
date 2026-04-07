<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\LeaveApplication;
use App\Models\LeavePolicy;
use App\Models\LeaveType;
use App\Models\LeaveTypeApprovalLevel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class LeavePolicyController extends Controller
{
    // ── Leave Policies ────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $policies = LeavePolicy::where('tenant_id', $tenantId)
            ->withCount('leaveTypes')
            ->with(['leaveTypes' => fn($q) => $q->orderBy('display_order')->orderBy('name')])
            ->orderByDesc('is_default')->orderBy('name')->get();
        return response()->json(['data' => $policies]);
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId  = $request->user()->tenant_id;
        $validated = $this->validatePolicy($request, $tenantId);
        $policy = DB::transaction(function () use ($tenantId, $validated) {
            if (!empty($validated['is_default'])) {
                LeavePolicy::where('tenant_id', $tenantId)->update(['is_default' => false]);
            }
            return LeavePolicy::create(array_merge($validated, ['tenant_id' => $tenantId]));
        });
        return response()->json(['message' => 'Leave policy created.', 'policy' => $policy->load('leaveTypes')], 201);
    }

    public function show(Request $request, LeavePolicy $leavePolicy): JsonResponse
    {
        $this->authorizePolicy($request, $leavePolicy);
        $leavePolicy->load(['leaveTypes' => fn($q) => $q->orderBy('display_order'), 'leaveTypes.approvalLevels.specificEmployee']);
        return response()->json(['policy' => $leavePolicy]);
    }

    public function update(Request $request, LeavePolicy $leavePolicy): JsonResponse
    {
        $this->authorizePolicy($request, $leavePolicy);
        $tenantId  = $request->user()->tenant_id;
        $validated = $this->validatePolicy($request, $tenantId, $leavePolicy->id);
        DB::transaction(function () use ($tenantId, $validated, $leavePolicy) {
            if (!empty($validated['is_default'])) {
                LeavePolicy::where('tenant_id', $tenantId)->where('id', '!=', $leavePolicy->id)->update(['is_default' => false]);
            }
            $leavePolicy->update($validated);
        });
        return response()->json(['message' => 'Policy updated.', 'policy' => $leavePolicy->fresh()]);
    }

    public function destroy(Request $request, LeavePolicy $leavePolicy): JsonResponse
    {
        $this->authorizePolicy($request, $leavePolicy);
        if ($leavePolicy->is_default) {
            return response()->json(['message' => 'Cannot delete the default policy.'], 422);
        }
        $leavePolicy->delete();
        return response()->json(['message' => 'Policy deleted.']);
    }

    // ── Leave Types ───────────────────────────────────────────────────────────

    public function storeLeaveType(Request $request, LeavePolicy $leavePolicy): JsonResponse
    {
        $this->authorizePolicy($request, $leavePolicy);
        $tenantId  = $request->user()->tenant_id;
        $validated = $this->validateLeaveType($request, $tenantId);

        $leaveType = DB::transaction(function () use ($tenantId, $leavePolicy, $validated, $request) {
            $lt = LeaveType::create(array_merge($validated, [
                'tenant_id'       => $tenantId,
                'leave_policy_id' => $leavePolicy->id,
            ]));
            if ($request->has('approval_level_configs')) {
                $this->syncApprovalLevels($lt, $request->input('approval_level_configs', []));
            }
            return $lt;
        });

        return response()->json(['message' => 'Leave type created.', 'leave_type' => $leaveType->load('approvalLevels.specificEmployee')], 201);
    }

    public function updateLeaveType(Request $request, LeavePolicy $leavePolicy, LeaveType $leaveType): JsonResponse
    {
        $this->authorizePolicy($request, $leavePolicy);
        $this->authorizeLeaveType($leavePolicy, $leaveType);
        $tenantId  = $request->user()->tenant_id;
        $validated = $this->validateLeaveType($request, $tenantId, $leaveType->id);

        DB::transaction(function () use ($validated, $leaveType, $request) {
            $leaveType->update($validated);
            if ($request->has('approval_level_configs')) {
                $this->syncApprovalLevels($leaveType, $request->input('approval_level_configs', []));
            }
        });

        return response()->json(['message' => 'Leave type updated.', 'leave_type' => $leaveType->fresh()->load('approvalLevels.specificEmployee')]);
    }

    public function destroyLeaveType(Request $request, LeavePolicy $leavePolicy, LeaveType $leaveType): JsonResponse
    {
        $this->authorizePolicy($request, $leavePolicy);
        $this->authorizeLeaveType($leavePolicy, $leaveType);

        $hasApplications = LeaveApplication::where('leave_type_id', $leaveType->id)
            ->whereNotIn('status', ['draft', 'cancelled', 'withdrawn'])->exists();
        if ($hasApplications) {
            return response()->json(['message' => 'Cannot delete: this leave type has active or historical applications.'], 422);
        }
        $leaveType->delete();
        return response()->json(['message' => 'Leave type deleted.']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function validatePolicy(Request $request, string $tenantId, ?int $ignoreId = null): array
    {
        return $request->validate([
            'name'                          => 'required|string|max:150',
            'description'                   => 'nullable|string|max:500',
            'is_default'                    => 'boolean',
            'allow_negative_balance'        => 'boolean',
            'year_start_month'              => 'integer|min:1|max:12',
            'carry_forward_process_month'   => 'integer|min:1|max:12',
            'applicable_employment_types'   => 'nullable|array',
            'applicable_employment_types.*' => 'in:monthly_salaried,daily_wage,hourly_wage',
            'applicable_department_ids'     => 'nullable|array',
            'applicable_branch_ids'         => 'nullable|array',
            'is_active'                     => 'boolean',
        ]);
    }

    private function validateLeaveType(Request $request, string $tenantId, ?int $ignoreId = null): array
    {
        return $request->validate([
            'name'                          => 'required|string|max:100',
            'code'                          => ['required','string','max:10', Rule::unique('leave_types','code')->where('tenant_id',$tenantId)->ignore($ignoreId)],
            'color'                         => ['nullable','regex:/^#([A-Fa-f0-9]{6})$/'],
            'icon'                          => 'nullable|string|max:10',
            'description'                   => 'nullable|string|max:500',
            'display_order'                 => 'integer|min:0',
            'is_paid'                       => 'boolean',
            // Entitlement
            'days_per_year'                 => 'required|numeric|min:0|max:365',
            'accrual_type'                  => 'in:lump_sum,monthly,quarterly',
            'accrual_per_period'            => 'nullable|numeric|min:0',
            'credit_during_probation'       => 'boolean',
            'credit_on_loss_of_pay_days'    => 'boolean',
            'prorate_on_joining'            => 'boolean',
            'prorate_basis'                 => 'in:months_completed,calendar_days',
            'prorate_on_exit'               => 'boolean',
            // Limits
            'min_days_per_application'      => 'numeric|min:0',
            'max_days_per_application'      => 'nullable|numeric|min:0',
            'max_consecutive_days'          => 'nullable|numeric|min:0',
            'max_days_per_month'            => 'nullable|numeric|min:0',
            'max_days_per_quarter'          => 'nullable|numeric|min:0',
            // Application rules
            'allow_half_day'                => 'boolean',
            'advance_notice_days'           => 'integer|min:0',
            'allow_backdated_application'   => 'boolean',
            'max_backdated_days'            => 'integer|min:0',
            'requires_document'             => 'boolean',
            'document_required_after_days'  => 'integer|min:1',
            'include_holidays_in_count'     => 'boolean',
            'include_weekends_in_count'     => 'boolean',
            // Carry forward
            'carry_forward'                 => 'boolean',
            'max_carry_forward_days'        => 'nullable|numeric|min:0',
            'carry_forward_expires'         => 'boolean',
            'carry_forward_expiry_months'   => 'nullable|integer|min:1|max:12',
            // Encashment
            'encashable'                    => 'boolean',
            'max_encashment_days_per_year'  => 'nullable|numeric|min:0',
            'min_balance_after_encashment'  => 'numeric|min:0',
            'encashment_on_exit'            => 'boolean',
            // Eligibility
            'gender_restriction'            => 'in:none,male,female',
            'employment_type_restriction'   => 'nullable|array',
            'employment_type_restriction.*' => 'in:monthly_salaried,daily_wage,hourly_wage',
            'applicable_after_days'         => 'integer|min:0',
            'applicable_during_probation'   => 'boolean',
            'department_restriction'        => 'nullable|array',
            'branch_restriction'            => 'nullable|array',
            'designation_restriction'       => 'nullable|array',
            // Approval
            'approval_levels'               => 'integer|min:1|max:3',
            'auto_approve'                  => 'boolean',
            'auto_approve_after_hours'      => 'nullable|integer|min:1',
            'notify_hr_on_apply'            => 'boolean',
            'notify_team_on_approval'       => 'boolean',
            // Admin
            'is_admin_only'                 => 'boolean',
            'is_active'                     => 'boolean',
            // Approval configs (optional, sent together with leave type save)
            'approval_level_configs'                             => 'nullable|array|max:3',
            'approval_level_configs.*.level'                     => 'required|integer|min:1|max:3',
            'approval_level_configs.*.approver_type'             => 'required|in:reporting_manager,department_head,hr_manager,specific_employee',
            'approval_level_configs.*.specific_employee_id'      => 'nullable|exists:employees,id',
            'approval_level_configs.*.skip_if_approver_on_leave' => 'boolean',
            'approval_level_configs.*.notify_on_new_application' => 'boolean',
        ]);
    }

    private function syncApprovalLevels(LeaveType $leaveType, array $levels): void
    {
        LeaveTypeApprovalLevel::where('leave_type_id', $leaveType->id)->delete();
        foreach ($levels as $level) {
            LeaveTypeApprovalLevel::create([
                'leave_type_id'              => $leaveType->id,
                'level'                      => $level['level'],
                'approver_type'              => $level['approver_type'],
                'specific_employee_id'       => $level['specific_employee_id'] ?? null,
                'skip_if_approver_on_leave'  => $level['skip_if_approver_on_leave']  ?? false,
                'notify_on_new_application'  => $level['notify_on_new_application']  ?? true,
                'notify_on_cancellation'     => $level['notify_on_cancellation']      ?? true,
            ]);
        }
    }

    private function authorizePolicy(Request $request, LeavePolicy $policy): void
    {
        abort_if($policy->tenant_id !== $request->user()->tenant_id, 403);
    }

    private function authorizeLeaveType(LeavePolicy $policy, LeaveType $leaveType): void
    {
        abort_if($leaveType->leave_policy_id !== $policy->id, 404);
    }
}
