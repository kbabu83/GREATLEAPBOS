<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Designation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DesignationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $designations = Designation::forTenant($tenantId)
            ->with('department:id,name')
            ->orderBy('level')
            ->orderBy('title')
            ->get()
            ->map(fn (Designation $d) => $this->formatDesignation($d));

        return response()->json(['data' => $designations]);
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $validated = $request->validate([
            'title'         => 'required|string|max:255',
            'code'          => [
                'nullable', 'string', 'max:50',
                Rule::unique('designations')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'department_id' => [
                'nullable', 'integer',
                Rule::exists('departments', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'level'         => 'nullable|integer|min:1|max:8',
            'description'   => 'nullable|string|max:1000',
            'is_active'     => 'boolean',
        ]);

        $validated['tenant_id'] = $tenantId;

        $designation = Designation::create($validated);
        $designation->load('department:id,name');

        return response()->json([
            'message'     => 'Designation created successfully.',
            'designation' => $this->formatDesignation($designation),
        ], 201);
    }

    public function show(Request $request, Designation $designation): JsonResponse
    {
        $this->authorizeDesignation($request, $designation);

        $designation->load('department:id,name');

        return response()->json(['designation' => $this->formatDesignation($designation)]);
    }

    public function update(Request $request, Designation $designation): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $this->authorizeDesignation($request, $designation);

        $validated = $request->validate([
            'title'         => 'sometimes|required|string|max:255',
            'code'          => [
                'nullable', 'string', 'max:50',
                Rule::unique('designations')
                    ->where(fn ($q) => $q->where('tenant_id', $tenantId))
                    ->ignore($designation->id),
            ],
            'department_id' => [
                'nullable', 'integer',
                Rule::exists('departments', 'id')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'level'         => 'nullable|integer|min:1|max:8',
            'description'   => 'nullable|string|max:1000',
            'is_active'     => 'boolean',
        ]);

        $designation->update($validated);
        $designation->load('department:id,name');

        return response()->json([
            'message'     => 'Designation updated successfully.',
            'designation' => $this->formatDesignation($designation->fresh(['department'])),
        ]);
    }

    public function destroy(Request $request, Designation $designation): JsonResponse
    {
        $this->authorizeDesignation($request, $designation);

        $employeeCount = $designation->employees()->count();
        if ($employeeCount > 0) {
            return response()->json([
                'message' => "Cannot delete designation: {$employeeCount} employee(s) are assigned to it.",
            ], 422);
        }

        $designation->delete();

        return response()->json(['message' => 'Designation deleted successfully.']);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function authorizeDesignation(Request $request, Designation $designation): void
    {
        if ($designation->tenant_id !== $request->user()->tenant_id) {
            abort(403, 'Access denied.');
        }
    }

    private function formatDesignation(Designation $d): array
    {
        return [
            'id'              => $d->id,
            'title'           => $d->title,
            'code'            => $d->code,
            'department_id'   => $d->department_id,
            'department_name' => $d->department?->name,
            'level'           => $d->level,
            'level_label'     => $d->level_label,
            'description'     => $d->description,
            'is_active'       => $d->is_active,
            'created_at'      => $d->created_at,
            'updated_at'      => $d->updated_at,
        ];
    }
}
