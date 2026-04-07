<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BranchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $branches = Branch::forTenant($tenantId)
            ->orderByDesc('is_head_office')
            ->orderBy('name')
            ->paginate(20);

        return response()->json([
            'data' => $branches->items(),
            'meta' => [
                'current_page' => $branches->currentPage(),
                'last_page'    => $branches->lastPage(),
                'per_page'     => $branches->perPage(),
                'total'        => $branches->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'code'          => [
                'nullable', 'string', 'max:20',
                Rule::unique('branches')->where(fn ($q) => $q->where('tenant_id', $tenantId)),
            ],
            'is_head_office' => 'boolean',
            'address_line1'  => 'nullable|string|max:255',
            'address_line2'  => 'nullable|string|max:255',
            'city'           => 'nullable|string|max:100',
            'state'          => 'nullable|string|max:100',
            'country'        => 'nullable|string|max:100',
            'pincode'        => 'nullable|string|max:10',
            'phone'          => 'nullable|string|max:20',
            'email'          => 'nullable|email|max:255',
            'is_active'      => 'boolean',
        ]);

        $validated['tenant_id'] = $tenantId;

        if (!empty($validated['is_head_office'])) {
            Branch::forTenant($tenantId)->update(['is_head_office' => false]);
        }

        $branch = Branch::create($validated);

        return response()->json([
            'message' => 'Branch created successfully.',
            'branch'  => $branch,
        ], 201);
    }

    public function show(Request $request, Branch $branch): JsonResponse
    {
        $this->authorizeBranch($request, $branch);

        return response()->json(['branch' => $branch]);
    }

    public function update(Request $request, Branch $branch): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $this->authorizeBranch($request, $branch);

        $validated = $request->validate([
            'name'           => 'sometimes|required|string|max:255',
            'code'           => [
                'nullable', 'string', 'max:20',
                Rule::unique('branches')
                    ->where(fn ($q) => $q->where('tenant_id', $tenantId))
                    ->ignore($branch->id),
            ],
            'is_head_office' => 'boolean',
            'address_line1'  => 'nullable|string|max:255',
            'address_line2'  => 'nullable|string|max:255',
            'city'           => 'nullable|string|max:100',
            'state'          => 'nullable|string|max:100',
            'country'        => 'nullable|string|max:100',
            'pincode'        => 'nullable|string|max:10',
            'phone'          => 'nullable|string|max:20',
            'email'          => 'nullable|email|max:255',
            'is_active'      => 'boolean',
        ]);

        if (!empty($validated['is_head_office'])) {
            Branch::forTenant($tenantId)
                ->where('id', '!=', $branch->id)
                ->update(['is_head_office' => false]);
        }

        $branch->update($validated);

        return response()->json([
            'message' => 'Branch updated successfully.',
            'branch'  => $branch->fresh(),
        ]);
    }

    public function destroy(Request $request, Branch $branch): JsonResponse
    {
        $this->authorizeBranch($request, $branch);

        $employeeCount = $branch->employees()->count();
        if ($employeeCount > 0) {
            return response()->json([
                'message' => "Cannot delete branch: {$employeeCount} employee(s) are assigned to it.",
            ], 422);
        }

        $branch->delete();

        return response()->json(['message' => 'Branch deleted successfully.']);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function authorizeBranch(Request $request, Branch $branch): void
    {
        if ($branch->tenant_id !== $request->user()->tenant_id) {
            abort(403, 'Access denied.');
        }
    }
}
