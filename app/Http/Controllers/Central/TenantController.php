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
        $validated = $request->validate([
            'company_name'  => 'required|string|max:255',
            'admin_name'    => 'required|string|max:255',
            'admin_email'   => 'required|email|unique:users,email|unique:tenants,email',
            'admin_password' => 'required|string|min:8',
            'plan'          => ['required', Rule::in([Tenant::PLAN_FREE, Tenant::PLAN_STARTER, Tenant::PLAN_PROFESSIONAL, Tenant::PLAN_ENTERPRISE])],
        ]);

        // Create tenant with UUID as ID
        $tenant = Tenant::create([
            'id'     => \Illuminate\Support\Str::uuid(),
            'name'   => $validated['company_name'],
            'email'  => $validated['admin_email'],
            'plan'   => $validated['plan'],
            'status' => Tenant::STATUS_TRIAL,
        ]);

        // Create domain entry
        $domain = env('CENTRAL_DOMAIN', 'greatlap.local');
        $tenant->domains()->create([
            'domain' => $domain,
        ]);

        // Initialize tenancy context - this creates the tenant database
        tenancy()->initialize($tenant);

        try {
            // Run tenant migrations to create tenant database tables
            \Illuminate\Support\Facades\Artisan::call('migrate', [
                '--path' => 'database/migrations/tenant',
                '--force' => true,
            ]);

            // Create admin user IN TENANT DATABASE (now that tenancy is initialized)
            $user = User::create([
                'name'              => $validated['admin_name'],
                'email'             => $validated['admin_email'],
                'password'          => $validated['admin_password'],
                'role'              => 'tenant_admin',
                'is_active'         => true,
                'email_verified_at' => now(), // Skip email verification
            ]);

            // End tenancy context
            tenancy()->end();
        } catch (\Exception $e) {
            tenancy()->end();

            // Cleanup on failure
            $tenant->delete();

            \Log::error('Tenant creation failed', [
                'email'   => $validated['admin_email'],
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to create tenant: ' . $e->getMessage(),
            ], 500);
        }

        // Create subscription with selected plan
        $plan = SubscriptionPlan::where('slug', $validated['plan'])->first();
        if ($plan) {
            $tenant->subscription()->create([
                'plan_id'  => $plan->id,
                'status'   => 'active',
                'started_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Tenant account created successfully. Admin can now login.',
            'tenant'  => $this->formatTenant($tenant->fresh('domains')),
            'admin'   => [
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => 'Tenant Admin',
            ],
            'login_url' => url("/login"),
        ], 201);
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
        // DEBUG: Test if endpoint is reachable
        return response()->json(['message' => 'API is reachable'], 200);

        $validated = $request->validate([
            'tenant_name'                => 'required|string|max:255',
            'tenant_email'               => 'required|email|unique:tenants,email',
            'admin_name'                 => 'required|string|max:255',
            'admin_email'                => 'required|email',
            'admin_password'             => 'required|string|min:8|confirmed',
            'plan'                       => ['required', Rule::in([Tenant::PLAN_FREE, Tenant::PLAN_STARTER, Tenant::PLAN_PROFESSIONAL, Tenant::PLAN_ENTERPRISE])],
            'number_of_users'            => 'required|integer|min:1|max:10000',
            'razorpay_payment_id'        => 'nullable|string',
            'razorpay_order_id'          => 'nullable|string',
            'razorpay_signature'         => 'nullable|string',
        ]);

        // Manual validation for admin_email uniqueness across all databases
        // Check central users table
        if (\App\Models\User::where('email', $validated['admin_email'])->exists()) {
            throw ValidationException::withMessages([
                'admin_email' => ['This email is already in use by another account.'],
            ]);
        }

        // Check all tenant databases for this email
        $tenantsWithEmail = \App\Models\Tenant::all();
        foreach ($tenantsWithEmail as $tenant) {
            tenancy()->initialize($tenant);
            if (\App\Models\User::where('email', $validated['admin_email'])->exists()) {
                tenancy()->end();
                throw ValidationException::withMessages([
                    'admin_email' => ['This email is already in use by another tenant.'],
                ]);
            }
            tenancy()->end();
        }

        // Also check that tenant_email is not used as admin_email anywhere
        if (\App\Models\Tenant::where('email', $validated['admin_email'])->exists()) {
            throw ValidationException::withMessages([
                'admin_email' => ['This email is reserved for a tenant account.'],
            ]);
        }

        // Get the plan
        $plan = \App\Models\Central\SubscriptionPlan::where('slug', $validated['plan'])->firstOrFail();

        // Check if plan can accommodate this many users
        if (!$plan->canAccommodateUsers($validated['number_of_users'])) {
            return response()->json([
                'message' => "Plan {$plan->name} supports maximum {$plan->max_users} users",
            ], 400);
        }

        // For paid plans, verify payment
        if ($plan->per_user_price > 0) {
            if (!$validated['razorpay_payment_id']) {
                return response()->json([
                    'message' => 'Payment ID required for paid plans',
                ], 400);
            }

            // Verify payment signature (optional - backend can verify before creating tenant)
            // For now, we trust the frontend has verified it via Razorpay
        }

        // Create Tenant with UUID
        $tenant = Tenant::create([
            'id'     => Str::uuid(),
            'name'   => $validated['tenant_name'],
            'email'  => $validated['tenant_email'],
            'plan'   => $validated['plan'],
            'status' => Tenant::STATUS_TRIAL,
        ]);

        // Create Domain entry
        $centralDomain = env('CENTRAL_DOMAIN', 'greatlap.local');
        $tenant->domains()->create([
            'domain' => $centralDomain,
        ]);

        // Initialize tenancy context
        tenancy()->initialize($tenant);

        try {
            // Run tenant migrations to create tables in tenant database
            \Illuminate\Support\Facades\Artisan::call('migrate', [
                '--path' => 'database/migrations/tenant',
                '--force' => true,
            ]);

            // Create Tenant Admin User
            $user = \App\Models\User::create([
                'name'      => $validated['admin_name'],
                'email'     => $validated['admin_email'],
                'password'  => $validated['admin_password'],
                'role'      => \App\Models\User::ROLE_TENANT_ADMIN,
                'is_active' => true,
            ]);

            // Calculate invoice amount - Defaulting number_of_users to 1
            $invoiceAmount = $plan->calculateInvoiceAmount($request->input('number_of_users', 1));

            // Create Subscription
            $subscription = \App\Models\Tenant\Subscription::create([
                'id'                => Str::uuid(),
                'tenant_id'         => $tenant->id,
                'plan_id'           => $plan->id,
                'number_of_users'   => $request->input('number_of_users', 1),
                'billing_cycle'     => 'monthly',
                'current_price'     => $invoiceAmount,
                'status'            => 'active',
                'trial_ends_at'     => now()->addDays(7),
                'next_billing_date' => now()->addDays(7),
            ]);

            // Create Invoice for paid plans
            if ($plan->per_user_price > 0 && $validated['razorpay_payment_id']) {
                $invoice = \App\Models\Tenant\Invoice::create([
                    'id'                     => Str::uuid(),
                    'tenant_id'              => $tenant->id,
                    'subscription_id'        => $subscription->id,
                    'invoice_number'         => 'INV-' . now()->format('YmdHis'),
                    'amount'                 => $invoiceAmount,
                    'status'                 => 'paid',
                    'razorpay_order_id'      => $validated['razorpay_order_id'],
                    'razorpay_payment_id'    => $validated['razorpay_payment_id'],
                    'billing_period_start'   => now(),
                    'billing_period_end'     => now()->addMonth(),
                    'due_date'               => now(),
                    'paid_at'                => now(),
                ]);

                // Create Payment Record
                \App\Models\Tenant\Payment::create([
                    'id'                  => Str::uuid(),
                    'tenant_id'           => $tenant->id,
                    'invoice_id'          => $invoice->id,
                    'razorpay_payment_id' => $validated['razorpay_payment_id'],
                    'amount'              => $invoiceAmount,
                    'status'              => 'captured',
                    'razorpay_response'   => json_encode([
                        'payment_id' => $validated['razorpay_payment_id'],
                        'order_id'   => $validated['razorpay_order_id'],
                        'users' => $request->input('number_of_users', 1),
                        'per_user_price' => $plan->per_user_price,
                    ]),
                ]);
            }

            // Create Auth Token
            $token = $user->createToken('auth-token', [$user->role])->plainTextToken;

            tenancy()->end();

            return response()->json([
                'message'   => 'Company registered successfully.',
                'user'      => [
                    'id'          => $user->id,
                    'name'        => $user->name,
                    'email'       => $user->email,
                    'role'        => $user->role,
                    'tenant_id'   => $tenant->id,
                    'tenant_name' => $tenant->name,
                ],
                'token'     => $token,
                'tenant_id' => $tenant->id,
                'plan'      => $validated['plan'],
            ], 201);
        } catch (\Exception $e) {
            if (isset($tenant)) {
                tenancy()->end();
                // Cleanup on failure
                $tenant->delete();
            }

            \Log::error('Tenant registration failed', [
                'email'   => $request->input('tenant_email'),
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Registration failed: ' . $e->getMessage(),
                'debug'   => [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]
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
