<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\OrganisationSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    // ── Index ─────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $query = Employee::forTenant($tenantId)
            ->with([
                'department:id,name',
                'designation:id,title',
                'branch:id,name',
                'reportingManager:id,first_name,last_name,employee_code',
            ]);

        // Filters
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->integer('department_id'));
        }

        if ($request->filled('designation_id')) {
            $query->where('designation_id', $request->integer('designation_id'));
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        if ($request->filled('employment_status')) {
            $query->where('employment_status', $request->input('employment_status'));
        }

        if ($request->filled('employment_type')) {
            $query->where('employment_type', $request->input('employment_type'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('display_name', 'like', "%{$search}%")
                  ->orWhere('work_email', 'like', "%{$search}%")
                  ->orWhere('employee_code', 'like', "%{$search}%");
            });
        }

        $employees = $query
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->paginate(15);

        return response()->json([
            'data' => collect($employees->items())->map(fn (Employee $e) => $this->formatEmployeeList($e)),
            'meta' => [
                'current_page' => $employees->currentPage(),
                'last_page'    => $employees->lastPage(),
                'per_page'     => $employees->perPage(),
                'total'        => $employees->total(),
            ],
        ]);
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $validated = $request->validate([
            // Personal
            'first_name'                  => 'required|string|max:100',
            'last_name'                   => 'required|string|max:100',
            'display_name'                => 'nullable|string|max:200',
            'work_email'                  => [
                'required', 'email', 'max:255',
                Rule::unique('employees')->where(fn ($q) => $q->where('tenant_id', $tenantId)->whereNull('deleted_at')),
            ],
            'personal_email'              => 'nullable|email|max:255',
            'phone'                       => 'nullable|string|max:20',
            'alternate_phone'             => 'nullable|string|max:20',
            'date_of_birth'               => 'nullable|date|before:today',
            'gender'                      => 'nullable|in:male,female,other,prefer_not_to_say',
            'blood_group'                 => 'nullable|string|max:5',
            'marital_status'              => 'nullable|in:single,married,divorced,widowed',
            'nationality'                 => 'nullable|string|max:100',
            'religion'                    => 'nullable|string|max:100',
            // Employment
            'department_id'               => [
                'nullable', 'integer',
                Rule::exists('departments', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'designation_id'              => [
                'nullable', 'integer',
                Rule::exists('designations', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'branch_id'                   => [
                'nullable', 'integer',
                Rule::exists('branches', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'reporting_manager_id'        => [
                'nullable', 'integer',
                Rule::exists('employees', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)->whereNull('deleted_at')),
            ],
            'employment_type'             => 'required|in:full_time,part_time,contract,intern,consultant',
            'employment_status'           => 'required|in:active,probation,notice_period,on_leave,inactive,terminated',
            'date_of_joining'             => 'required|date',
            'date_of_confirmation'        => 'nullable|date|after_or_equal:date_of_joining',
            'notice_period_days'          => 'nullable|integer|min:0',
            'work_location_type'          => 'nullable|in:office,remote,hybrid',
            // Address
            'current_address'             => 'nullable|array',
            'current_address.line1'       => 'nullable|string|max:255',
            'current_address.line2'       => 'nullable|string|max:255',
            'current_address.city'        => 'nullable|string|max:100',
            'current_address.state'       => 'nullable|string|max:100',
            'current_address.country'     => 'nullable|string|max:100',
            'current_address.pincode'     => 'nullable|string|max:10',
            'same_as_current_address'     => 'boolean',
            'permanent_address'           => 'nullable|array',
            'permanent_address.line1'     => 'nullable|string|max:255',
            'permanent_address.line2'     => 'nullable|string|max:255',
            'permanent_address.city'      => 'nullable|string|max:100',
            'permanent_address.state'     => 'nullable|string|max:100',
            'permanent_address.country'   => 'nullable|string|max:100',
            'permanent_address.pincode'   => 'nullable|string|max:10',
            // Government IDs
            'pan_number'                  => 'nullable|string|max:20',
            'aadhar_number'               => 'nullable|string|max:20',
            'uan_number'                  => 'nullable|string|max:20',
            'esi_number'                  => 'nullable|string|max:20',
            'passport_number'             => 'nullable|string|max:30',
            'passport_expiry'             => 'nullable|date',
            'driving_license'             => 'nullable|string|max:30',
            // Bank
            'bank_account_number'         => 'nullable|string|max:30',
            'bank_name'                   => 'nullable|string|max:100',
            'bank_ifsc'                   => 'nullable|string|max:15',
            'bank_branch'                 => 'nullable|string|max:100',
            'bank_account_type'           => 'nullable|in:savings,current',
            // Emergency
            'emergency_contact_name'      => 'nullable|string|max:100',
            'emergency_contact_relation'  => 'nullable|string|max:50',
            'emergency_contact_phone'     => 'nullable|string|max:20',
            // Meta
            'is_active'                   => 'boolean',
            'custom_fields'               => 'nullable|array',
        ]);

        $employee = DB::transaction(function () use ($validated, $tenantId, $request) {
            $setting = OrganisationSetting::where('tenant_id', $tenantId)->firstOrFail();
            $code    = $setting->generateEmployeeCode();

            $validated['tenant_id']    = $tenantId;
            $validated['employee_code'] = $code;
            $validated['created_by']   = $request->user()->id;

            // If same_as_current_address is true, mirror the address
            if (!empty($validated['same_as_current_address']) && !empty($validated['current_address'])) {
                $validated['permanent_address'] = $validated['current_address'];
            }

            return Employee::create($validated);
        });

        $employee->load(['department:id,name', 'designation:id,title', 'branch:id,name', 'reportingManager:id,first_name,last_name,employee_code']);

        return response()->json([
            'message'  => 'Employee created successfully.',
            'employee' => $this->formatEmployee($employee),
        ], 201);
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function show(Request $request, Employee $employee): JsonResponse
    {
        $this->authorizeEmployee($request, $employee);

        $employee->load([
            'department:id,name,code',
            'designation:id,title,code,level',
            'branch:id,name,code',
            'reportingManager:id,first_name,last_name,employee_code,work_email',
            'currentSalary.salaryStructure:id,name',
        ]);

        return response()->json(['employee' => $this->formatEmployee($employee)]);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function update(Request $request, Employee $employee): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $this->authorizeEmployee($request, $employee);

        $validated = $request->validate([
            // Personal
            'first_name'                  => 'sometimes|required|string|max:100',
            'last_name'                   => 'sometimes|required|string|max:100',
            'display_name'                => 'nullable|string|max:200',
            'work_email'                  => [
                'sometimes', 'required', 'email', 'max:255',
                Rule::unique('employees')
                    ->where(fn ($q) => $q->where('tenant_id', $tenantId)->whereNull('deleted_at'))
                    ->ignore($employee->id),
            ],
            'personal_email'              => 'nullable|email|max:255',
            'phone'                       => 'nullable|string|max:20',
            'alternate_phone'             => 'nullable|string|max:20',
            'date_of_birth'               => 'nullable|date|before:today',
            'gender'                      => 'nullable|in:male,female,other,prefer_not_to_say',
            'blood_group'                 => 'nullable|string|max:5',
            'marital_status'              => 'nullable|in:single,married,divorced,widowed',
            'nationality'                 => 'nullable|string|max:100',
            'religion'                    => 'nullable|string|max:100',
            // Employment
            'department_id'               => [
                'nullable', 'integer',
                Rule::exists('departments', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'designation_id'              => [
                'nullable', 'integer',
                Rule::exists('designations', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'branch_id'                   => [
                'nullable', 'integer',
                Rule::exists('branches', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'reporting_manager_id'        => [
                'nullable', 'integer',
                Rule::exists('employees', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)->whereNull('deleted_at')),
                function ($attribute, $value, $fail) use ($employee) {
                    if ((int) $value === $employee->id) {
                        $fail('An employee cannot report to themselves.');
                    }
                },
            ],
            'employment_type'             => 'sometimes|required|in:full_time,part_time,contract,intern,consultant',
            'employment_status'           => 'sometimes|required|in:active,probation,notice_period,on_leave,inactive,terminated',
            'date_of_joining'             => 'sometimes|required|date',
            'date_of_confirmation'        => 'nullable|date|after_or_equal:date_of_joining',
            'notice_period_days'          => 'nullable|integer|min:0',
            'date_of_exit'                => 'nullable|date',
            'exit_reason'                 => 'nullable|string|max:255',
            'exit_remarks'                => 'nullable|string|max:1000',
            'work_location_type'          => 'nullable|in:office,remote,hybrid',
            // Address
            'current_address'             => 'nullable|array',
            'current_address.line1'       => 'nullable|string|max:255',
            'current_address.line2'       => 'nullable|string|max:255',
            'current_address.city'        => 'nullable|string|max:100',
            'current_address.state'       => 'nullable|string|max:100',
            'current_address.country'     => 'nullable|string|max:100',
            'current_address.pincode'     => 'nullable|string|max:10',
            'same_as_current_address'     => 'boolean',
            'permanent_address'           => 'nullable|array',
            'permanent_address.line1'     => 'nullable|string|max:255',
            'permanent_address.line2'     => 'nullable|string|max:255',
            'permanent_address.city'      => 'nullable|string|max:100',
            'permanent_address.state'     => 'nullable|string|max:100',
            'permanent_address.country'   => 'nullable|string|max:100',
            'permanent_address.pincode'   => 'nullable|string|max:10',
            // Government IDs
            'pan_number'                  => 'nullable|string|max:20',
            'aadhar_number'               => 'nullable|string|max:20',
            'uan_number'                  => 'nullable|string|max:20',
            'esi_number'                  => 'nullable|string|max:20',
            'passport_number'             => 'nullable|string|max:30',
            'passport_expiry'             => 'nullable|date',
            'driving_license'             => 'nullable|string|max:30',
            // Bank
            'bank_account_number'         => 'nullable|string|max:30',
            'bank_name'                   => 'nullable|string|max:100',
            'bank_ifsc'                   => 'nullable|string|max:15',
            'bank_branch'                 => 'nullable|string|max:100',
            'bank_account_type'           => 'nullable|in:savings,current',
            // Emergency
            'emergency_contact_name'      => 'nullable|string|max:100',
            'emergency_contact_relation'  => 'nullable|string|max:50',
            'emergency_contact_phone'     => 'nullable|string|max:20',
            // Meta
            'is_active'                   => 'boolean',
            'custom_fields'               => 'nullable|array',
        ]);

        // Mirror permanent address if same_as_current_address is being set true
        if (array_key_exists('same_as_current_address', $validated) && $validated['same_as_current_address']) {
            $currentAddress = $validated['current_address'] ?? $employee->current_address;
            $validated['permanent_address'] = $currentAddress;
        }

        $employee->update($validated);
        $employee->load(['department:id,name,code', 'designation:id,title,code,level', 'branch:id,name,code', 'reportingManager:id,first_name,last_name,employee_code,work_email']);

        return response()->json([
            'message'  => 'Employee updated successfully.',
            'employee' => $this->formatEmployee($employee->fresh(['department', 'designation', 'branch', 'reportingManager'])),
        ]);
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function destroy(Request $request, Employee $employee): JsonResponse
    {
        $this->authorizeEmployee($request, $employee);

        // Check for active payroll runs tied to this employee
        $hasActivePayroll = DB::table('payroll_entries')
            ->where('employee_id', $employee->id)
            ->whereIn('status', ['draft', 'processing', 'approved'])
            ->exists();

        if ($hasActivePayroll) {
            return response()->json([
                'message' => 'Cannot delete employee: active payroll entries exist. Please finalise or remove payroll entries first.',
            ], 422);
        }

        $employee->delete(); // SoftDeletes

        return response()->json(['message' => 'Employee deleted successfully.']);
    }

    // ── Update Status ─────────────────────────────────────────────────────────

    public function updateStatus(Request $request, Employee $employee): JsonResponse
    {
        $this->authorizeEmployee($request, $employee);

        $validated = $request->validate([
            'employment_status' => 'required|in:active,probation,notice_period,on_leave,inactive,terminated',
            'reason'            => 'nullable|string|max:500',
            'effective_date'    => 'nullable|date',
            // Exit-specific fields — required when terminating
            'date_of_exit'      => 'nullable|date',
            'exit_reason'       => 'nullable|string|max:255',
            'exit_remarks'      => 'nullable|string|max:1000',
        ]);

        $updatePayload = [
            'employment_status' => $validated['employment_status'],
        ];

        if ($validated['employment_status'] === 'terminated') {
            $updatePayload['date_of_exit'] = $validated['date_of_exit'] ?? $validated['effective_date'] ?? now()->toDateString();
            if (!empty($validated['exit_reason'])) {
                $updatePayload['exit_reason'] = $validated['exit_reason'];
            }
            if (!empty($validated['exit_remarks'])) {
                $updatePayload['exit_remarks'] = $validated['exit_remarks'];
            }
            $updatePayload['is_active'] = false;
        } elseif (in_array($validated['employment_status'], ['active', 'probation', 'notice_period', 'on_leave'])) {
            $updatePayload['is_active'] = true;
        } elseif ($validated['employment_status'] === 'inactive') {
            $updatePayload['is_active'] = false;
        }

        $employee->update($updatePayload);

        return response()->json([
            'message'           => 'Employee status updated successfully.',
            'employment_status' => $employee->fresh()->employment_status,
            'employee_id'       => $employee->id,
        ]);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function authorizeEmployee(Request $request, Employee $employee): void
    {
        if ($employee->tenant_id !== $request->user()->tenant_id) {
            abort(403, 'Access denied.');
        }
    }

    /**
     * Compact list format — used in index() to keep response lean.
     */
    private function formatEmployeeList(Employee $e): array
    {
        return [
            'id'                => $e->id,
            'employee_code'     => $e->employee_code,
            'full_name'         => $e->full_name,
            'display_name'      => $e->display_name,
            'work_email'        => $e->work_email,
            'phone'             => $e->phone,
            'department'        => $e->department ? ['id' => $e->department->id, 'name' => $e->department->name] : null,
            'designation'       => $e->designation ? ['id' => $e->designation->id, 'title' => $e->designation->title] : null,
            'branch'            => $e->branch ? ['id' => $e->branch->id, 'name' => $e->branch->name] : null,
            'reporting_manager' => $e->reportingManager ? [
                'id'            => $e->reportingManager->id,
                'full_name'     => $e->reportingManager->full_name,
                'employee_code' => $e->reportingManager->employee_code,
            ] : null,
            'employment_type'   => $e->employment_type,
            'employment_status' => $e->employment_status,
            'date_of_joining'   => $e->date_of_joining?->toDateString(),
            'is_active'         => $e->is_active,
            'profile_photo'     => $e->profile_photo,
        ];
    }

    /**
     * Full detail format — used in show(), store() and update() responses.
     */
    private function formatEmployee(Employee $e): array
    {
        return [
            // IDs & code
            'id'                          => $e->id,
            'employee_code'               => $e->employee_code,
            'user_id'                     => $e->user_id,

            // Personal
            'first_name'                  => $e->first_name,
            'last_name'                   => $e->last_name,
            'full_name'                   => $e->full_name,
            'display_name'                => $e->display_name,
            'work_email'                  => $e->work_email,
            'personal_email'              => $e->personal_email,
            'phone'                       => $e->phone,
            'alternate_phone'             => $e->alternate_phone,
            'date_of_birth'               => $e->date_of_birth?->toDateString(),
            'gender'                      => $e->gender,
            'blood_group'                 => $e->blood_group,
            'marital_status'              => $e->marital_status,
            'nationality'                 => $e->nationality,
            'religion'                    => $e->religion,
            'profile_photo'               => $e->profile_photo,

            // Employment
            'department'                  => $e->department ? [
                'id'   => $e->department->id,
                'name' => $e->department->name,
                'code' => $e->department->code ?? null,
            ] : null,
            'designation'                 => $e->designation ? [
                'id'    => $e->designation->id,
                'title' => $e->designation->title,
                'code'  => $e->designation->code ?? null,
                'level' => $e->designation->level ?? null,
            ] : null,
            'branch'                      => $e->branch ? [
                'id'   => $e->branch->id,
                'name' => $e->branch->name,
                'code' => $e->branch->code ?? null,
            ] : null,
            'reporting_manager'           => $e->reportingManager ? [
                'id'            => $e->reportingManager->id,
                'full_name'     => $e->reportingManager->full_name,
                'employee_code' => $e->reportingManager->employee_code,
                'work_email'    => $e->reportingManager->work_email,
            ] : null,
            'employment_type'             => $e->employment_type,
            'employment_status'           => $e->employment_status,
            'date_of_joining'             => $e->date_of_joining?->toDateString(),
            'date_of_confirmation'        => $e->date_of_confirmation?->toDateString(),
            'notice_period_days'          => $e->notice_period_days,
            'date_of_exit'                => $e->date_of_exit?->toDateString(),
            'exit_reason'                 => $e->exit_reason,
            'exit_remarks'                => $e->exit_remarks,
            'work_location_type'          => $e->work_location_type,

            // Address
            'current_address'             => $e->current_address,
            'permanent_address'           => $e->permanent_address,
            'same_as_current_address'     => $e->same_as_current_address,

            // Government IDs
            'pan_number'                  => $e->pan_number,
            'aadhar_number'               => $e->aadhar_number,
            'uan_number'                  => $e->uan_number,
            'esi_number'                  => $e->esi_number,
            'passport_number'             => $e->passport_number,
            'passport_expiry'             => $e->passport_expiry?->toDateString(),
            'driving_license'             => $e->driving_license,

            // Bank
            'bank_account_number'         => $e->bank_account_number,
            'bank_name'                   => $e->bank_name,
            'bank_ifsc'                   => $e->bank_ifsc,
            'bank_branch'                 => $e->bank_branch,
            'bank_account_type'           => $e->bank_account_type,

            // Emergency contact
            'emergency_contact_name'      => $e->emergency_contact_name,
            'emergency_contact_relation'  => $e->emergency_contact_relation,
            'emergency_contact_phone'     => $e->emergency_contact_phone,

            // Meta
            'is_active'                   => $e->is_active,
            'onboarding_completed_at'     => $e->onboarding_completed_at,
            'onboarding_progress'         => $e->onboarding_progress,
            'custom_fields'               => $e->custom_fields,
            'created_by'                  => $e->created_by,
            'created_at'                  => $e->created_at,
            'updated_at'                  => $e->updated_at,
        ];
    }
}
