<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if ($request->user()->isStaff()) {
            return response()->json(['message' => 'Insufficient permissions.'], 403);
        }

        $tenantId = $request->user()->tenant_id;
        $query    = User::with('esRoles')->where('tenant_id', $tenantId)->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        $users = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'data' => collect($users->items())->map(fn ($u) => $this->formatUser($u))->values(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
                'per_page'     => $users->perPage(),
                'total'        => $users->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId    = $request->user()->tenant_id;
        $currentUser = $request->user();

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|email|unique:users,email',
            'password'      => 'required|string|min:8',
            'role'          => ['required', Rule::in([User::ROLE_TENANT_ADMIN, User::ROLE_STAFF])],
            'phone'         => 'nullable|string|max:20',
            'department'    => 'nullable|string|max:100',
            'es_role_ids'   => 'nullable|array',
            'es_role_ids.*' => 'integer|exists:es_roles,id',
        ]);

        if ($currentUser->isStaff() && $validated['role'] === User::ROLE_TENANT_ADMIN) {
            return response()->json(['message' => 'Insufficient permissions.'], 403);
        }

        $user = User::create([
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'password'  => $validated['password'],
            'role'      => $validated['role'],
            'phone'     => $validated['phone'] ?? null,
            'department'=> $validated['department'] ?? null,
            'tenant_id' => $tenantId,
            'is_active' => true,
        ]);

        if (!empty($validated['es_role_ids'])) {
            $pivotData = collect($validated['es_role_ids'])->mapWithKeys(fn ($id) => [
                $id => ['tenant_id' => $tenantId],
            ])->all();
            $user->esRoles()->sync($pivotData);
        }

        return response()->json([
            'message' => 'User created successfully.',
            'user'    => $this->formatUser($user->load('esRoles')),
        ], 201);
    }

    public function show(Request $request, User $user): JsonResponse
    {
        $this->authorizeTenant($request, $user);
        return response()->json(['user' => $this->formatUser($user->load('esRoles'))]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorizeTenant($request, $user);

        $currentUser = $request->user();

        if ($currentUser->isStaff() && $currentUser->id !== $user->id) {
            return response()->json(['message' => 'Insufficient permissions.'], 403);
        }

        $validated = $request->validate([
            'name'          => 'sometimes|string|max:255',
            'email'         => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'role'          => ['sometimes', Rule::in([User::ROLE_TENANT_ADMIN, User::ROLE_STAFF])],
            'phone'         => 'nullable|string|max:20',
            'department'    => 'nullable|string|max:100',
            'es_role_ids'   => 'nullable|array',
            'es_role_ids.*' => 'integer|exists:es_roles,id',
            'is_active'     => 'sometimes|boolean',
        ]);

        $roleIds = $validated['es_role_ids'] ?? null;
        unset($validated['es_role_ids'], $validated['password']);

        $user->update($validated);

        if ($roleIds !== null) {
            $tenantId = $request->user()->tenant_id;
            $pivotData = collect($roleIds)->mapWithKeys(fn ($id) => [
                $id => ['tenant_id' => $tenantId],
            ])->all();
            $user->esRoles()->sync($pivotData);
        }

        return response()->json([
            'message' => 'User updated successfully.',
            'user'    => $this->formatUser($user->fresh()->load('esRoles')),
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorizeTenant($request, $user);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Cannot delete your own account.'], 403);
        }

        $user->delete();
        return response()->json(['message' => 'User deleted successfully.']);
    }

    /**
     * Reset a user's password
     */
    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $this->authorizeTenant($request, $user);

        $validated = $request->validate([
            'new_password' => 'required|string|min:8',
        ]);

        $user->update([
            'password' => $validated['new_password'],
        ]);

        return response()->json([
            'message' => "Password reset successfully for {$user->email}",
            'user' => $this->formatUser($user->fresh()),
        ]);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function authorizeTenant(Request $request, User $user): void
    {
        if ($user->tenant_id !== $request->user()->tenant_id) {
            abort(404);
        }
    }

    private function formatUser(User $user): array
    {
        return [
            'id'            => $user->id,
            'name'          => $user->name,
            'email'         => $user->email,
            'role'          => $user->role,
            'role_display'  => $user->role_display,
            'phone'         => $user->phone,
            'department'    => $user->department,
            'avatar'        => $user->avatar,
            'is_active'     => $user->is_active,
            'es_roles'      => $user->esRoles->map(fn ($r) => [
                'id'      => $r->id,
                'name'    => $r->name,
                'purpose' => $r->purpose,
            ])->values(),
            'last_login_at' => $user->last_login_at?->toISOString(),
            'created_at'    => $user->created_at->toISOString(),
        ];
    }
}
