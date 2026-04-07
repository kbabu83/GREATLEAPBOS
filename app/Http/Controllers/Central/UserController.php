<?php

namespace App\Http\Controllers\Central;

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
        // Central users only (no tenant affiliation)
        $query = User::whereNull('tenant_id')->latest();

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
            'data' => collect($users->items())->map(fn ($user) => $this->formatUser($user))->values(),
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
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role'     => ['required', Rule::in([User::ROLE_SUPER_ADMIN, User::ROLE_TENANT_ADMIN, User::ROLE_STAFF])],
        ]);

        $user = User::create([
            ...$validated,
            'is_active' => true,
            // No tenant_id — this is a central platform user
        ]);

        return response()->json([
            'message' => 'User created successfully.',
            'user'    => $this->formatUser($user),
        ], 201);
    }

    public function show(User $user): JsonResponse
    {
        // Only expose central users
        abort_if($user->tenant_id !== null, 404);

        return response()->json(['user' => $this->formatUser($user)]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        abort_if($user->tenant_id !== null, 404);

        $validated = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'email'     => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'role'      => ['sometimes', Rule::in([User::ROLE_SUPER_ADMIN, User::ROLE_TENANT_ADMIN, User::ROLE_STAFF])],
            'is_active' => 'sometimes|boolean',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'User updated successfully.',
            'user'    => $this->formatUser($user->fresh()),
        ]);
    }

    public function destroy(User $user): JsonResponse
    {
        abort_if($user->tenant_id !== null, 404);

        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Cannot delete your own account.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }

    private function formatUser(User $user): array
    {
        return [
            'id'            => $user->id,
            'name'          => $user->name,
            'email'         => $user->email,
            'role'          => $user->role,
            'role_display'  => $user->role_display,
            'avatar'        => $user->avatar,
            'is_active'     => $user->is_active,
            'last_login_at' => $user->last_login_at?->toISOString(),
            'created_at'    => $user->created_at->toISOString(),
        ];
    }
}
