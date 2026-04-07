<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DepartmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        // Load the full flat list with parent name and children so the
        // frontend can build its own tree or flat table as needed.
        $departments = Department::forTenant($tenantId)
            ->with([
                'parent:id,name',
                'children:id,name,code,parent_id,is_active',
                'head:id,first_name,last_name,employee_code',
            ])
            ->orderBy('name')
            ->get()
            ->map(fn (Department $d) => $this->formatDepartment($d));

        return response()->json(['data' => $departments]);
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'code'             => [
                'nullable', 'string', 'max:50',
                Rule::unique('departments')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'description'      => 'nullable|string|max:1000',
            'parent_id'        => [
                'nullable', 'integer',
                Rule::exists('departments', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'head_employee_id' => [
                'nullable', 'integer',
                Rule::exists('employees', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'is_active'        => 'boolean',
        ]);

        $validated['tenant_id'] = $tenantId;

        $department = Department::create($validated);
        $department->load(['parent:id,name', 'children:id,name,code,parent_id,is_active', 'head:id,first_name,last_name,employee_code']);

        return response()->json([
            'message'    => 'Department created successfully.',
            'department' => $this->formatDepartment($department),
        ], 201);
    }

    public function show(Request $request, Department $department): JsonResponse
    {
        $this->authorizeDepartment($request, $department);

        $department->load(['parent:id,name', 'children:id,name,code,parent_id,is_active', 'head:id,first_name,last_name,employee_code']);

        return response()->json(['department' => $this->formatDepartment($department)]);
    }

    public function update(Request $request, Department $department): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $this->authorizeDepartment($request, $department);

        $validated = $request->validate([
            'name'             => 'sometimes|required|string|max:255',
            'code'             => [
                'nullable', 'string', 'max:50',
                Rule::unique('departments')
                    ->where(fn ($q) => $q->where('tenant_id', $tenantId))
                    ->ignore($department->id),
            ],
            'description'      => 'nullable|string|max:1000',
            'parent_id'        => [
                'nullable', 'integer',
                Rule::exists('departments', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
                // Prevent a department from becoming its own parent or creating a cycle
                function ($attribute, $value, $fail) use ($department) {
                    if ((int) $value === $department->id) {
                        $fail('A department cannot be its own parent.');
                    }
                },
            ],
            'head_employee_id' => [
                'nullable', 'integer',
                Rule::exists('employees', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'is_active'        => 'boolean',
        ]);

        $department->update($validated);
        $department->load(['parent:id,name', 'children:id,name,code,parent_id,is_active', 'head:id,first_name,last_name,employee_code']);

        return response()->json([
            'message'    => 'Department updated successfully.',
            'department' => $this->formatDepartment($department->fresh(['parent', 'children', 'head'])),
        ]);
    }

    public function destroy(Request $request, Department $department): JsonResponse
    {
        $this->authorizeDepartment($request, $department);

        $employeeCount = $department->employees()->count();
        if ($employeeCount > 0) {
            return response()->json([
                'message' => "Cannot delete department: {$employeeCount} employee(s) are assigned to it.",
            ], 422);
        }

        // Re-parent any child departments to null so we don't orphan them
        Department::where('parent_id', $department->id)->update(['parent_id' => null]);

        $department->delete();

        return response()->json(['message' => 'Department deleted successfully.']);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function authorizeDepartment(Request $request, Department $department): void
    {
        if ($department->tenant_id !== $request->user()->tenant_id) {
            abort(403, 'Access denied.');
        }
    }

    private function formatDepartment(Department $d): array
    {
        return [
            'id'               => $d->id,
            'name'             => $d->name,
            'code'             => $d->code,
            'description'      => $d->description,
            'parent_id'        => $d->parent_id,
            'parent_name'      => $d->parent?->name,
            'head_employee_id' => $d->head_employee_id,
            'head_name'        => $d->head ? trim("{$d->head->first_name} {$d->head->last_name}") : null,
            'is_active'        => $d->is_active,
            'children'         => $d->children->map(fn ($c) => [
                'id'        => $c->id,
                'name'      => $c->name,
                'code'      => $c->code,
                'parent_id' => $c->parent_id,
                'is_active' => $c->is_active,
            ])->values()->all(),
            'created_at'       => $d->created_at,
            'updated_at'       => $d->updated_at,
        ];
    }
}
