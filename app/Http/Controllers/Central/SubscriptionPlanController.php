<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\SubscriptionPlan;
use App\Models\Central\SubscriptionPlanFeature;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SubscriptionPlanController extends Controller
{
    /**
     * List all subscription plans
     */
    public function index(Request $request)
    {
        $plans = SubscriptionPlan::query()
            ->when($request->has('active'), function ($q) {
                $q->active();
            })
            ->sorted()
            ->paginate($request->get('per_page', 15));

        return response()->json($plans);
    }

    /**
     * Create a new subscription plan
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'slug' => ['required', 'string', 'alpha_dash', Rule::unique('subscription_plans', 'slug')],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'per_user_price' => ['required', 'numeric', 'min:0'],
            'max_users' => ['nullable', 'integer', 'min:1'],
            'features' => ['nullable', 'json'],
            'is_active' => ['boolean'],
            'is_configurable' => ['boolean'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $plan = SubscriptionPlan::create([
            'id' => Str::uuid(),
            'slug' => $validated['slug'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'per_user_price' => $validated['per_user_price'],
            'max_users' => $validated['max_users'],
            'features' => $validated['features'] ? json_decode($validated['features'], true) : null,
            'is_active' => $validated['is_active'] ?? true,
            'is_configurable' => $validated['is_configurable'] ?? true,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        return response()->json([
            'message' => 'Subscription plan created successfully.',
            'plan' => $plan->load('features'),
        ], 201);
    }

    /**
     * Get a specific plan
     */
    public function show(SubscriptionPlan $subscriptionPlan)
    {
        return response()->json($subscriptionPlan->load('features', 'planFeatures'));
    }

    /**
     * Update a subscription plan
     */
    public function update(Request $request, SubscriptionPlan $subscriptionPlan)
    {
        $validated = $request->validate([
            'name' => ['string', 'max:255'],
            'description' => ['nullable', 'string'],
            'per_user_price' => ['numeric', 'min:0'],
            'max_users' => ['nullable', 'integer', 'min:1'],
            'features' => ['nullable', 'json'],
            'is_active' => ['boolean'],
            'is_configurable' => ['boolean'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $subscriptionPlan->update($validated);

        return response()->json([
            'message' => 'Subscription plan updated successfully.',
            'plan' => $subscriptionPlan->load('features'),
        ]);
    }

    /**
     * Delete a subscription plan
     */
    public function destroy(SubscriptionPlan $subscriptionPlan)
    {
        $subscriptionPlan->delete();

        return response()->json([
            'message' => 'Subscription plan deleted successfully.',
        ]);
    }

    /**
     * Restore a soft-deleted plan
     */
    public function restore($id)
    {
        $plan = SubscriptionPlan::onlyTrashed()->findOrFail($id);
        $plan->restore();

        return response()->json([
            'message' => 'Plan restored successfully.',
            'plan' => $plan,
        ]);
    }

    /**
     * Add or update plan features
     */
    public function updateFeatures(Request $request, SubscriptionPlan $subscriptionPlan)
    {
        $validated = $request->validate([
            'features' => ['required', 'array'],
            'features.*.feature_key' => ['required', 'string'],
            'features.*.feature_value' => ['required'],
            'features.*.description' => ['nullable', 'string'],
        ]);

        // Delete existing features
        $subscriptionPlan->planFeatures()->delete();

        // Create new features
        foreach ($validated['features'] as $feature) {
            SubscriptionPlanFeature::create([
                'plan_id' => $subscriptionPlan->id,
                'feature_key' => $feature['feature_key'],
                'feature_value' => $feature['feature_value'],
                'description' => $feature['description'] ?? null,
            ]);
        }

        return response()->json([
            'message' => 'Plan features updated successfully.',
            'features' => $subscriptionPlan->planFeatures,
        ]);
    }

    /**
     * Add feature to plan
     */
    public function addFeature(Request $request, SubscriptionPlan $subscriptionPlan)
    {
        $validated = $request->validate([
            'feature_id' => 'required|exists:features,id',
        ]);

        // Check if already exists
        if ($subscriptionPlan->features()->where('feature_id', $validated['feature_id'])->exists()) {
            return response()->json([
                'message' => 'Feature already assigned to this plan.',
            ], 422);
        }

        $subscriptionPlan->features()->attach($validated['feature_id']);

        return response()->json([
            'message' => 'Feature added to plan successfully.',
            'plan' => $subscriptionPlan->load('features'),
        ]);
    }

    /**
     * Remove feature from plan
     */
    public function removeFeature(Request $request, SubscriptionPlan $subscriptionPlan)
    {
        $validated = $request->validate([
            'feature_id' => 'required|exists:features,id',
        ]);

        $subscriptionPlan->features()->detach($validated['feature_id']);

        return response()->json([
            'message' => 'Feature removed from plan successfully.',
            'plan' => $subscriptionPlan->load('features'),
        ]);
    }

    /**
     * Add/Update multiple features for a plan
     */
    public function setFeatures(Request $request, SubscriptionPlan $subscriptionPlan)
    {
        $validated = $request->validate([
            'feature_ids' => 'required|array',
            'feature_ids.*' => 'exists:features,id',
        ]);

        // Sync features (removes old, adds new)
        $subscriptionPlan->features()->sync($validated['feature_ids']);

        return response()->json([
            'message' => 'Plan features updated successfully.',
            'plan' => $subscriptionPlan->load('features'),
        ]);
    }

    /**
     * Get plans usage statistics
     */
    public function statistics()
    {
        $plans = SubscriptionPlan::active()
            ->with('features', 'planFeatures')
            ->get()
            ->map(function ($plan) {
                // Count active subscriptions using this plan
                $activeSubscriptions = \DB::connection('mysql')
                    ->table('subscriptions')
                    ->where('plan_id', $plan->id)
                    ->where('status', 'active')
                    ->count();

                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'per_user_price' => $plan->per_user_price,
                    'max_users' => $plan->max_users,
                    'active_subscriptions' => $activeSubscriptions,
                    'total_users' => $this->getTotalUsersForPlan($plan->id),
                ];
            });

        return response()->json([
            'total_plans' => count($plans),
            'total_subscriptions' => $plans->sum('active_subscriptions'),
            'monthly_revenue' => $this->calculateMonthlyRevenue($plans),
            'plans' => $plans,
        ]);
    }

    /**
     * Get total users for a plan
     */
    private function getTotalUsersForPlan($planId)
    {
        return \DB::connection('mysql')
            ->table('subscriptions')
            ->where('plan_id', $planId)
            ->where('status', 'active')
            ->sum('number_of_users');
    }

    /**
     * Calculate monthly revenue from subscriptions
     */
    private function calculateMonthlyRevenue($plans)
    {
        return 0; // TODO: Calculate from invoices
    }
}
