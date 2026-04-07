<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\SalaryComponent;
use App\Models\SalaryStructure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SalaryStructureController extends Controller
{
    // ── Index ─────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $structures = SalaryStructure::forTenant($tenantId)
            ->withCount('components')
            ->orderBy('name')
            ->paginate(10);

        return response()->json([
            'data' => $structures->items(),
            'meta' => [
                'current_page' => $structures->currentPage(),
                'last_page'    => $structures->lastPage(),
                'per_page'     => $structures->perPage(),
                'total'        => $structures->total(),
            ],
        ]);
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'is_active'   => 'boolean',
        ]);

        $validated['tenant_id'] = $tenantId;

        $structure = SalaryStructure::create($validated);

        return response()->json([
            'message'   => 'Salary structure created successfully.',
            'structure' => $structure,
        ], 201);
    }

    // ── Show ──────────────────────────────────────────────────────────────────

    public function show(Request $request, SalaryStructure $salaryStructure): JsonResponse
    {
        $this->authorizeStructure($request, $salaryStructure);

        $salaryStructure->load('components');

        // Group components by type
        $grouped = $salaryStructure->components->groupBy('type');

        return response()->json([
            'structure'  => $salaryStructure->only(['id', 'tenant_id', 'name', 'description', 'is_active', 'created_at', 'updated_at']),
            'components' => [
                'earnings'               => $grouped->get('earning', collect())->values(),
                'deductions'             => $grouped->get('deduction', collect())->values(),
                'employer_contributions' => $grouped->get('employer_contribution', collect())->values(),
            ],
        ]);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function update(Request $request, SalaryStructure $salaryStructure): JsonResponse
    {
        $this->authorizeStructure($request, $salaryStructure);

        $validated = $request->validate([
            'name'        => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'is_active'   => 'boolean',
        ]);

        $salaryStructure->update($validated);

        return response()->json([
            'message'   => 'Salary structure updated successfully.',
            'structure' => $salaryStructure->fresh(),
        ]);
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function destroy(Request $request, SalaryStructure $salaryStructure): JsonResponse
    {
        $this->authorizeStructure($request, $salaryStructure);

        // Prevent deletion if structure is assigned to employees
        $assignedCount = DB::table('employee_salary_assignments')
            ->where('salary_structure_id', $salaryStructure->id)
            ->count();

        if ($assignedCount > 0) {
            return response()->json([
                'message' => 'Cannot delete salary structure: it is assigned to ' . $assignedCount . ' employee(s). Please reassign before deleting.',
            ], 422);
        }

        // Delete all components first
        $salaryStructure->components()->delete();
        $salaryStructure->delete();

        return response()->json(['message' => 'Salary structure deleted successfully.']);
    }

    // ── Store Component ───────────────────────────────────────────────────────

    public function storeComponent(Request $request, SalaryStructure $salaryStructure): JsonResponse
    {
        $this->authorizeStructure($request, $salaryStructure);

        $validated = $request->validate([
            'name'               => 'required|string|max:255',
            'code'               => [
                'required',
                'string',
                'max:20',
                Rule::unique('salary_components', 'code')
                    ->where(fn ($q) => $q->where('salary_structure_id', $salaryStructure->id)),
            ],
            'type'               => 'required|in:earning,deduction,employer_contribution',
            'calculation_type'   => 'required|in:fixed,percentage_of_basic,percentage_of_gross,percentage_of_ctc,formula',
            'value'              => 'required|numeric|min:0',
            'formula'            => 'nullable|string|max:1000',
            'is_taxable'         => 'boolean',
            'is_pf_applicable'   => 'boolean',
            'is_esi_applicable'  => 'boolean',
            'display_order'      => 'nullable|integer|min:0',
            'is_active'          => 'boolean',
        ]);

        $validated['tenant_id']           = $request->user()->tenant_id;
        $validated['salary_structure_id'] = $salaryStructure->id;

        // Auto-assign display_order if not provided
        if (!isset($validated['display_order'])) {
            $maxOrder = SalaryComponent::where('salary_structure_id', $salaryStructure->id)
                ->where('type', $validated['type'])
                ->max('display_order');
            $validated['display_order'] = ($maxOrder ?? -1) + 1;
        }

        $component = SalaryComponent::create($validated);

        return response()->json([
            'message'   => 'Salary component added successfully.',
            'component' => $component,
        ], 201);
    }

    // ── Update Component ──────────────────────────────────────────────────────

    public function updateComponent(Request $request, SalaryStructure $salaryStructure, SalaryComponent $salaryComponent): JsonResponse
    {
        $this->authorizeStructure($request, $salaryStructure);
        $this->authorizeComponent($salaryStructure, $salaryComponent);

        $validated = $request->validate([
            'name'               => 'sometimes|required|string|max:255',
            'code'               => [
                'sometimes',
                'required',
                'string',
                'max:20',
                Rule::unique('salary_components', 'code')
                    ->where(fn ($q) => $q->where('salary_structure_id', $salaryStructure->id))
                    ->ignore($salaryComponent->id),
            ],
            'type'               => 'sometimes|required|in:earning,deduction,employer_contribution',
            'calculation_type'   => 'sometimes|required|in:fixed,percentage_of_basic,percentage_of_gross,percentage_of_ctc,formula',
            'value'              => 'sometimes|required|numeric|min:0',
            'formula'            => 'nullable|string|max:1000',
            'is_taxable'         => 'boolean',
            'is_pf_applicable'   => 'boolean',
            'is_esi_applicable'  => 'boolean',
            'display_order'      => 'nullable|integer|min:0',
            'is_active'          => 'boolean',
        ]);

        $salaryComponent->update($validated);

        return response()->json([
            'message'   => 'Salary component updated successfully.',
            'component' => $salaryComponent->fresh(),
        ]);
    }

    // ── Destroy Component ─────────────────────────────────────────────────────

    public function destroyComponent(Request $request, SalaryStructure $salaryStructure, SalaryComponent $salaryComponent): JsonResponse
    {
        $this->authorizeStructure($request, $salaryStructure);
        $this->authorizeComponent($salaryStructure, $salaryComponent);

        $salaryComponent->delete();

        return response()->json(['message' => 'Salary component deleted successfully.']);
    }

    // ── Reorder Components ────────────────────────────────────────────────────

    public function reorderComponents(Request $request, SalaryStructure $salaryStructure): JsonResponse
    {
        $this->authorizeStructure($request, $salaryStructure);

        $validated = $request->validate([
            'components'                => 'required|array|min:1',
            'components.*.id'           => 'required|integer',
            'components.*.display_order'=> 'required|integer|min:0',
        ]);

        $structureId  = $salaryStructure->id;
        $updatedCount = 0;

        DB::transaction(function () use ($validated, $structureId, &$updatedCount) {
            foreach ($validated['components'] as $item) {
                $updatedCount += SalaryComponent::where('id', $item['id'])
                    ->where('salary_structure_id', $structureId)
                    ->update(['display_order' => $item['display_order']]);
            }
        });

        return response()->json([
            'message'       => 'Components reordered successfully.',
            'updated_count' => $updatedCount,
        ]);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function authorizeStructure(Request $request, SalaryStructure $structure): void
    {
        if ($structure->tenant_id !== $request->user()->tenant_id) {
            abort(403, 'Access denied.');
        }
    }

    private function authorizeComponent(SalaryStructure $structure, SalaryComponent $component): void
    {
        if ($component->salary_structure_id !== $structure->id) {
            abort(404, 'Salary component not found in this structure.');
        }
    }
}
