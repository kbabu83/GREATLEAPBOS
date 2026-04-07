<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Central\SubscriptionPlan;
use App\Models\Tenant\UserSubscriptionOverride;
use App\Models\User;
use App\Services\SubscriptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class UserPricingController extends Controller
{
    public function __construct(
        private SubscriptionService $subscriptionService,
    ) {}

    /**
     * Get user's subscription overrides
     */
    public function show(Request $request, User $user)
    {
        // Ensure user is from same tenant
        if ($user->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $overrides = $user->subscriptionOverrides()
            ->active()
            ->with('plan')
            ->get();

        return response()->json([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'overrides' => $overrides,
        ]);
    }

    /**
     * Create user subscription override
     */
    public function store(Request $request, User $user)
    {
        // Ensure user is from same tenant
        if ($user->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'plan_id' => ['required', 'string', 'exists:subscription_plans,id'],
            'monthly_price' => ['nullable', 'numeric', 'min:0'],
            'annual_price' => ['nullable', 'numeric', 'min:0'],
            'effective_from' => ['nullable', 'date'],
            'effective_to' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $override = $this->subscriptionService->applyUserOverride(
                user: $user,
                planId: $validated['plan_id'],
                monthlyPrice: isset($validated['monthly_price']) ? (float) $validated['monthly_price'] : null,
                annualPrice: isset($validated['annual_price']) ? (float) $validated['annual_price'] : null,
                effectiveFrom: $validated['effective_from'] ? \Carbon\Carbon::parse($validated['effective_from']) : null,
                effectiveTo: $validated['effective_to'] ? \Carbon\Carbon::parse($validated['effective_to']) : null,
                notes: $validated['notes'] ?? null,
                createdBy: $request->user(),
            );

            return response()->json([
                'message' => 'Pricing override created successfully.',
                'override' => $override->load('plan'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create override: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Update user subscription override
     */
    public function update(Request $request, User $user, UserSubscriptionOverride $override)
    {
        // Verify user and override belong to same tenant
        if ($user->tenant_id !== $request->user()->tenant_id ||
            $override->tenant_id !== $request->user()->tenant_id ||
            $override->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'plan_id' => ['string', 'exists:subscription_plans,id'],
            'monthly_price' => ['nullable', 'numeric', 'min:0'],
            'annual_price' => ['nullable', 'numeric', 'min:0'],
            'effective_from' => ['nullable', 'date'],
            'effective_to' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $updateData = [];

        if (isset($validated['plan_id'])) {
            $updateData['plan_id'] = $validated['plan_id'];
        }
        if (isset($validated['monthly_price'])) {
            $updateData['monthly_price'] = $validated['monthly_price'];
        }
        if (isset($validated['annual_price'])) {
            $updateData['annual_price'] = $validated['annual_price'];
        }
        if (isset($validated['effective_from'])) {
            $updateData['effective_from'] = $validated['effective_from'];
        }
        if (isset($validated['effective_to'])) {
            $updateData['effective_to'] = $validated['effective_to'];
        }
        if (isset($validated['notes'])) {
            $updateData['notes'] = $validated['notes'];
        }

        $override->update($updateData);

        return response()->json([
            'message' => 'Override updated successfully.',
            'override' => $override->load('plan'),
        ]);
    }

    /**
     * Delete user subscription override
     */
    public function destroy(Request $request, User $user, UserSubscriptionOverride $override)
    {
        // Verify authorization
        if ($user->tenant_id !== $request->user()->tenant_id ||
            $override->tenant_id !== $request->user()->tenant_id ||
            $override->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $this->subscriptionService->removeUserOverride($override);

        return response()->json([
            'message' => 'Override removed successfully.',
        ]);
    }

    /**
     * Get pricing report for all team members
     */
    public function report(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        // Get all users with active overrides
        $users = User::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->with(['subscriptionOverrides' => function ($q) {
                $q->active()->with('plan');
            }])
            ->get()
            ->map(function ($user) {
                $override = $user->subscriptionOverrides->first();

                if ($override) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'plan_name' => $override->plan->name,
                        'monthly_price' => $override->monthly_price,
                        'annual_price' => $override->annual_price,
                        'plan_monthly_price' => $override->plan->monthly_price,
                        'plan_annual_price' => $override->plan->annual_price,
                        'monthly_savings' => $override->getSavings('monthly'),
                        'annual_savings' => $override->getSavings('annual'),
                        'savings_percentage' => $override->getSavingsPercentage('monthly'),
                        'effective_from' => $override->effective_from,
                        'effective_to' => $override->effective_to,
                        'notes' => $override->notes,
                    ];
                }

                return null;
            })
            ->filter()
            ->values();

        // Calculate totals
        $totalMonthlySavings = $users->sum('monthly_savings');
        $totalAnnualSavings = $users->sum('annual_savings');

        return response()->json([
            'total_users_with_overrides' => $users->count(),
            'total_monthly_savings' => round($totalMonthlySavings, 2),
            'total_annual_savings' => round($totalAnnualSavings, 2),
            'overrides' => $users,
        ]);
    }

    /**
     * Bulk upload pricing overrides from CSV
     */
    public function bulkUpload(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt'],
        ]);

        $file = $request->file('file');
        $results = [
            'successful' => 0,
            'failed' => 0,
            'errors' => [],
        ];

        try {
            $handle = fopen($file->getPathname(), 'r');
            $row = 0;

            while (($data = fgetcsv($handle, 1000, ',')) !== false) {
                $row++;

                // Skip header
                if ($row === 1) {
                    continue;
                }

                // Parse CSV: email, plan_slug, monthly_price, annual_price
                [$email, $planSlug, $monthlyPrice, $annualPrice] = $data;

                try {
                    $user = User::where('email', $email)
                        ->where('tenant_id', $request->user()->tenant_id)
                        ->firstOrFail();

                    $plan = SubscriptionPlan::where('slug', $planSlug)->firstOrFail();

                    $this->subscriptionService->applyUserOverride(
                        user: $user,
                        planId: $plan->id,
                        monthlyPrice: (float) $monthlyPrice,
                        annualPrice: (float) $annualPrice,
                        createdBy: $request->user(),
                    );

                    $results['successful']++;
                } catch (\Exception $e) {
                    $results['failed']++;
                    $results['errors'][] = "Row {$row}: " . $e->getMessage();
                }
            }

            fclose($handle);

            return response()->json($results);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Bulk upload failed: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get available plans for selection
     */
    public function getPlans()
    {
        $plans = SubscriptionPlan::active()
            ->sorted()
            ->get(['id', 'slug', 'name', 'monthly_price', 'annual_price']);

        return response()->json($plans);
    }
}
