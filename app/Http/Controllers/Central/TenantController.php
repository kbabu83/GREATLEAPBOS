<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Central\SubscriptionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TenantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Tenant::with('domains')->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('id', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('plan')) {
            $query->where('plan', $request->plan);
        }

        $tenants = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'data' => collect($tenants->items())->map(fn ($tenant) => $this->formatTenant($tenant))->values(),
            'meta' => [
                'current_page' => $tenants->currentPage(),
                'last_page'    => $tenants->lastPage(),
                'per_page'     => $tenants->perPage(),
                'total'        => $tenants->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        \Log::info('Admin tenant creation started', ['data' => $request->except(['admin_password'])]);

        $validated = $request->validate([
            'company_name'  => 'required|string|max:255',
            'admin_name'    => 'required|string|max:255',
            'admin_email'   => 'required|email|unique:users,email|unique:tenants,email',
            'admin_password' => 'required|string|min:8',
            'plan'          => ['required', Rule::in([Tenant::PLAN_FREE, Tenant::PLAN_STARTER, Tenant::PLAN_PROFESSIONAL, Tenant::PLAN_ENTERPRISE])],
        ]);

        try {
            // Generate unique subdomain from company name
            $subdomain = Str::slug($validated['company_name']);
            $originalSubdomain = $subdomain;
            $counter = 1;
            
            \Log::info('Generating unique subdomain for admin creation', ['base' => $subdomain]);
            
            while (\Stancl\Tenancy\Database\Models\Domain::where('domain', $subdomain . '.' . env('CENTRAL_DOMAIN', 'greatlap.local'))->exists()) {
                $subdomain = $originalSubdomain . '-' . $counter;
                $counter++;
            }
            
            $fullDomain = $subdomain . '.' . env('CENTRAL_DOMAIN', 'greatlap.local');
            \Log::info('Subdomain determined for admin creation', ['domain' => $fullDomain]);

            // Create tenant with UUID as ID
            $tenant = Tenant::create([
                'id'     => Str::uuid(),
                'name'   => $validated['company_name'],
                'email'  => $validated['admin_email'],
                'plan'   => $validated['plan'],
                'status' => Tenant::STATUS_TRIAL,
            ]);

            // Create domain entry
            $tenant->domains()->create([
                'domain' => $fullDomain,
            ]);

            \Log::info('Tenant and domain records created', ['tenant_id' => $tenant->id]);

            // Initialize tenancy context - this creates the tenant database
            tenancy()->initialize($tenant);

            // Run tenant migrations to create tenant database tables
            \Log::info('Running tenant migrations');
            \Illuminate\Support\Facades\Artisan::call('migrate', [
                '--path' => 'database/migrations/tenant',
                '--force' => true,
            ]);

            // Create admin user IN TENANT DATABASE (now that tenancy is initialized)
            $user = User::create([
                'name'              => $validated['admin_name'],
                'email'             => $validated['admin_email'],
                'password'          => Hash::make($validated['admin_password']),
                'role'              => 'tenant_admin',
                'is_active'         => true,
                'email_verified_at' => now(),
            ]);

            \Log::info('Admin user created in tenant database');

            // Create subscription record
            $plan = SubscriptionPlan::where('slug', $validated['plan'])->first();
            if ($plan) {
                $tenant->subscription()->create([
                    'id'            => Str::uuid(),
                    'tenant_id'     => $tenant->id,
                    'plan_id'       => $plan->id,
                    'billing_cycle' => 'monthly',
                    'current_price' => $plan->monthly_price ?? 0,
                    'status'        => 'active',
                    'trial_ends_at' => now()->addDays(14),
                ]);
                \Log::info('Subscription record created');
            }

            // End tenancy context
            tenancy()->end();

            return response()->json([
                'message' => 'Tenant account created successfully.',
                'tenant'  => $this->formatTenant($tenant->fresh('domains')),
                'admin'   => [
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => 'Tenant Admin',
                ],
                'login_url' => url("/login"),
            ], 201);

        } catch (\Exception $e) {
            if (tenancy()->initialized) {
                tenancy()->end();
            }

            \Log::error('Admin tenant creation failed', [
                'email'   => $validated['admin_email'] ?? 'unknown',
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            // Cleanup if possible
            if (isset($tenant)) {
                $tenant->delete();
            }

            return response()->json([
                'message' => 'Failed to create tenant: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(string $id): JsonResponse
    {
        $tenant = Tenant::with('domains')->findOrFail($id);

        // Get user count for this tenant
        $userCount = 0;
        try {
            tenancy()->initialize($tenant);
            $userCount = \App\Models\User::count();
            tenancy()->end();
        } catch (\Exception $e) {
            tenancy()->end();
        }

        $data = $this->formatTenant($tenant);
        $data['user_count'] = $userCount;

        return response()->json(['tenant' => $data]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        $validated = $request->validate([
            'name'   => 'sometimes|string|max:255',
            'email'  => ['sometimes', 'email', Rule::unique('tenants', 'email')->ignore($id)],
            'plan'   => ['sometimes', Rule::in([Tenant::PLAN_FREE, Tenant::PLAN_STARTER, Tenant::PLAN_PROFESSIONAL, Tenant::PLAN_ENTERPRISE])],
            'status' => ['sometimes', Rule::in([Tenant::STATUS_ACTIVE, Tenant::STATUS_INACTIVE, Tenant::STATUS_SUSPENDED, Tenant::STATUS_TRIAL])],
        ]);

        $tenant->update($validated);

        return response()->json([
            'message' => 'Tenant updated successfully.',
            'tenant'  => $this->formatTenant($tenant->fresh('domains')),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);
        $tenant->delete();

        return response()->json(['message' => 'Tenant deleted successfully.']);
    }

    /**
     * Reset admin user password for a tenant
     *
     * CRITICAL: Tenant admin users are stored in the TENANT database, not central DB
     * Must initialize tenancy context to access tenant database
     */
    public function resetAdminPassword(Request $request, string $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        $validated = $request->validate([
            'new_password' => 'required|string|min:8',
        ]);

        try {
            // Initialize tenancy to access tenant database
            tenancy()->initialize($tenant);

            // Find tenant admin user IN TENANT DATABASE (not central)
            $admin = User::where('role', User::ROLE_TENANT_ADMIN)
                ->where('tenant_id', $id)
                ->first();

            if (!$admin) {
                tenancy()->end();
                return response()->json(['error' => 'Admin user not found for this tenant.'], 404);
            }

            // Update password in tenant database
            $admin->update([
                'password' => $validated['new_password'],
            ]);

            $adminEmail = $admin->email;
            $adminName = $admin->name;

            tenancy()->end();

            return response()->json([
                'message' => "Admin password reset successfully. Email: {$adminEmail}",
                'admin' => [
                    'name' => $adminName,
                    'email' => $adminEmail,
                ],
            ]);
        } catch (\Exception $e) {
            tenancy()->end();
            \Log::error('Password reset failed', [
                'tenant_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to reset password: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Toggle tenant status (active/inactive)
     */
    public function toggleStatus(Request $request, string $id): JsonResponse
    {
        $tenant = Tenant::findOrFail($id);

        $newStatus = $tenant->status === Tenant::STATUS_ACTIVE
            ? Tenant::STATUS_INACTIVE
            : Tenant::STATUS_ACTIVE;

        $tenant->update(['status' => $newStatus]);

        return response()->json([
            'message' => "Tenant status changed to {$newStatus}.",
            'tenant' => $this->formatTenant($tenant->fresh('domains')),
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        \Log::info('Public tenant registration started', ['data' => $request->except(['admin_password', 'admin_password_confirmation'])]);

        try {
            $validated = $request->validate([
                'tenant_name'      => 'required|string|max:255',
                'tenant_email'     => 'required|email',
                'admin_name'       => 'required|string|max:255',
                'admin_email'      => 'required|email|unique:users,email|unique:tenants,email',
                'admin_password'   => 'required|string|min:8|confirmed',
                'plan'             => ['required', Rule::in([Tenant::PLAN_FREE, Tenant::PLAN_STARTER, Tenant::PLAN_PROFESSIONAL, Tenant::PLAN_ENTERPRISE])],
                'number_of_users'  => 'required|integer|min:1',
                // Allow optional payment fields
                'razorpay_payment_id' => 'nullable|string',
                'razorpay_order_id'   => 'nullable|string',
                'razorpay_signature'  => 'nullable|string',
            ]);
            
            \Log::info('Public registration validation passed');

            // Generate unique subdomain from tenant name
            $subdomain = Str::slug($validated['tenant_name']);
            $originalSubdomain = $subdomain;
            $counter = 1;
            
            \Log::info('Generating unique subdomain for public registration', ['base' => $subdomain]);
            
            while (\Stancl\Tenancy\Database\Models\Domain::where('domain', $subdomain . '.' . env('CENTRAL_DOMAIN', 'greatlap.local'))->exists()) {
                $subdomain = $originalSubdomain . '-' . $counter;
                $counter++;
            }
            
            $fullDomain = $subdomain . '.' . env('CENTRAL_DOMAIN', 'greatlap.local');
            \Log::info('Subdomain determined for public registration', ['domain' => $fullDomain]);

            // Create tenant with UUID as ID
            $tenant = Tenant::create([
                'id'     => Str::uuid(),
                'name'   => $validated['tenant_name'],
                'email'  => $validated['admin_email'],
                'plan'   => $validated['plan'],
                'status' => Tenant::STATUS_ACTIVE,
            ]);

            // Create domain entry
            $tenant->domains()->create([
                'domain' => $fullDomain,
            ]);

            \Log::info('Tenant and domain records created', ['tenant_id' => $tenant->id]);

            // Initialize tenancy context
            tenancy()->initialize($tenant);
            \Log::info('Tenancy context initialized');

            // Run tenant migrations
            \Log::info('Running tenant migrations');
            \Illuminate\Support\Facades\Artisan::call('migrate', [
                '--path' => 'database/migrations/tenant',
                '--force' => true,
            ]);
            \Log::info('Tenant migrations finished');

            // Create admin user IN TENANT DATABASE
            $user = User::create([
                'name'              => $validated['admin_name'],
                'email'             => $validated['admin_email'],
                'password'          => Hash::make($validated['admin_password']),
                'role'              => 'tenant_admin',
                'is_active'         => true,
                'email_verified_at' => now(), 
            ]);
            \Log::info('Admin user created in tenant database');

            // Create subscription record
            $plan = SubscriptionPlan::where('slug', $validated['plan'])->first();
            if ($plan) {
                $tenant->subscription()->create([
                    'id'            => Str::uuid(),
                    'tenant_id'     => $tenant->id,
                    'plan_id'       => $plan->id,
                    'billing_cycle' => 'monthly',
                    'current_price' => $plan->monthly_price ?? 0,
                    'status'        => 'active',
                    'trial_ends_at' => now()->addDays(14),
                ]);
                \Log::info('Subscription record created');
            }

            // End tenancy context
            tenancy()->end();
            \Log::info('Tenancy context closed');

            return response()->json([
                'message' => 'Tenant account created successfully.',
                'tenant'  => $this->formatTenant($tenant->fresh('domains')),
                'admin'   => [
                    'name'  => $user->name,
                    'email' => $user->email,
                    'role'  => 'Tenant Admin',
                ],
                'login_url' => url("/login"),
            ], 201);

        } catch (\Exception $e) {
            if (tenancy()->initialized) {
                tenancy()->end();
            }
            
            if (isset($tenant)) {
                $tenant->delete();
            }

            \Log::error('Public tenant registration failed', [
                'email'   => $validated['admin_email'] ?? 'unknown',
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Registration failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function formatTenant(Tenant $tenant): array
    {
        return [
            'id'         => $tenant->id,
            'name'       => $tenant->name,
            'email'      => $tenant->email,
            'plan'       => $tenant->plan,
            'status'     => $tenant->status,
            'logo'       => $tenant->logo,
            'domain'     => $tenant->domains->first()?->domain,
            'created_at' => $tenant->created_at->toISOString(),
            'updated_at' => $tenant->updated_at->toISOString(),
        ];
    }
}
