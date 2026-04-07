<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Multi-tenant login supporting both central and tenant users
     *
     * Flow:
     * 1. Try central DB user (super_admin)
     * 2. If not found, find tenant by email and switch to tenant DB
     * 3. Try tenant DB user
     * 4. Return authenticated user with tenant context
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $email = $request->email;
        $password = $request->password;
        $tenant = null;
        $user = null;

        // Step 1: Try to find and authenticate central DB user (super_admin)
        if (Auth::attempt(['email' => $email, 'password' => $password])) {
            $user = Auth::user();

            // Verify user is active
            if (!$user->is_active) {
                Auth::logout();
                throw ValidationException::withMessages([
                    'email' => ['Your account has been deactivated.'],
                ]);
            }

            $user->update(['last_login_at' => now()]);
            $token = $user->createToken('auth-token', [$user->role])->plainTextToken;

            return response()->json([
                'user'  => $this->formatUser($user),
                'token' => $token,
            ]);
        }

        // Step 2: User not in central DB, search for tenant by email
        // The tenant's admin email is stored in central DB tenants.email column
        $tenant = Tenant::where('email', $email)->first();

        if (!$tenant) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Step 3: Initialize tenant context and try to authenticate
        try {
            tenancy()->initialize($tenant);

            // Try to authenticate user in tenant database
            if (Auth::attempt(['email' => $email, 'password' => $password])) {
                $user = Auth::user();

                // Verify user is active
                if (!$user->is_active) {
                    Auth::logout();
                    tenancy()->end();
                    throw ValidationException::withMessages([
                        'email' => ['Your account has been deactivated.'],
                    ]);
                }

                $user->update(['last_login_at' => now()]);
                $token = $user->createToken('auth-token', [$user->role])->plainTextToken;

                // End tenancy but keep token valid (token contains tenant_id)
                tenancy()->end();

                return response()->json([
                    'user'  => $this->formatUser($user),
                    'token' => $token,
                ]);
            }

            tenancy()->end();
        } catch (\Exception $e) {
            tenancy()->end();
            throw ValidationException::withMessages([
                'email' => ['Login failed. Please try again.'],
            ]);
        }

        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->formatUser($request->user()),
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update(['password' => $request->password]);

        return response()->json(['message' => 'Password changed successfully.']);
    }

    private function formatUser(User $user): array
    {
        return [
            'id'           => $user->id,
            'name'         => $user->name,
            'email'        => $user->email,
            'role'         => $user->role,
            'role_display' => $user->role_display,
            'tenant_id'    => $user->tenant_id,
            'tenant_name'  => $user->tenant_id ? ($user->tenant?->name ?? $user->tenant_id) : null,
            'avatar'       => $user->avatar,
            'is_active'    => $user->is_active,
            'last_login_at' => $user->last_login_at?->toISOString(),
            'created_at'   => $user->created_at->toISOString(),
        ];
    }
}
