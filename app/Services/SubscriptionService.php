<?php

namespace App\Services;

use App\Models\Central\SubscriptionPlan;
use App\Models\Tenant\Subscription;
use App\Models\Tenant\UserSubscriptionOverride;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SubscriptionService
{
    /**
     * Create a new subscription for a tenant
     */
    public function createSubscription(
        string $tenantId,
        string $planId,
        string $billingCycle = 'monthly',
        Carbon $startDate = null,
        int $trialDays = 14
    ): Subscription {
        $plan = SubscriptionPlan::findOrFail($planId);
        $startDate = $startDate ?? now();

        // Calculate next billing date based on billing cycle
        $nextBillingDate = $billingCycle === 'annual'
            ? $startDate->clone()->addYear()
            : $startDate->clone()->addMonth();

        // Calculate trial end date
        $trialEndsAt = $plan->isFreePlan() ? null : $startDate->clone()->addDays($trialDays);

        // Determine subscription status
        $status = $plan->isFreePlan() ? 'active' : 'trial';
        $currentPrice = $billingCycle === 'annual'
            ? $plan->annual_price
            : $plan->monthly_price;

        $subscription = Subscription::create([
            'id' => Str::uuid(),
            'tenant_id' => $tenantId,
            'plan_id' => $planId,
            'billing_cycle' => $billingCycle,
            'current_price' => $currentPrice,
            'status' => $status,
            'trial_ends_at' => $trialEndsAt,
            'next_billing_date' => $nextBillingDate,
        ]);

        return $subscription;
    }

    /**
     * Upgrade subscription to a new plan
     */
    public function upgradeSubscription(
        Subscription $subscription,
        string $newPlanId,
        string $billingCycle = null
    ): Subscription {
        $newPlan = SubscriptionPlan::findOrFail($newPlanId);
        $billingCycle = $billingCycle ?? $subscription->billing_cycle;

        $currentPrice = $billingCycle === 'annual'
            ? $newPlan->annual_price
            : $newPlan->monthly_price;

        // Calculate pro-rata credit for remaining days
        $daysRemaining = $subscription->next_billing_date
            ? now()->diffInDays($subscription->next_billing_date)
            : 0;

        $proRataCredit = $this->calculateProRataAmount(
            $subscription,
            $currentPrice,
            $daysRemaining
        );

        $subscription->update([
            'plan_id' => $newPlanId,
            'billing_cycle' => $billingCycle,
            'current_price' => $currentPrice,
            'status' => 'active',
        ]);

        // Log activity
        \Log::info('Subscription upgraded', [
            'tenant_id' => $subscription->tenant_id,
            'old_plan' => $subscription->plan_id,
            'new_plan' => $newPlanId,
            'pro_rata_credit' => $proRataCredit,
        ]);

        return $subscription;
    }

    /**
     * Downgrade subscription to a new plan
     */
    public function downgradeSubscription(
        Subscription $subscription,
        string $newPlanId,
        string $billingCycle = null
    ): Subscription {
        $newPlan = SubscriptionPlan::findOrFail($newPlanId);
        $billingCycle = $billingCycle ?? $subscription->billing_cycle;

        $currentPrice = $billingCycle === 'annual'
            ? $newPlan->annual_price
            : $newPlan->monthly_price;

        $subscription->update([
            'plan_id' => $newPlanId,
            'billing_cycle' => $billingCycle,
            'current_price' => $currentPrice,
            'status' => 'active',
        ]);

        // Downgrade takes effect on next billing date
        \Log::info('Subscription downgraded', [
            'tenant_id' => $subscription->tenant_id,
            'old_plan' => $subscription->plan_id,
            'new_plan' => $newPlanId,
            'effective_date' => $subscription->next_billing_date,
        ]);

        return $subscription;
    }

    /**
     * Cancel subscription
     */
    public function cancelSubscription(
        Subscription $subscription,
        string $reason = null
    ): Subscription {
        $subscription->markAsCancelled();

        \Log::info('Subscription cancelled', [
            'tenant_id' => $subscription->tenant_id,
            'plan_id' => $subscription->plan_id,
            'reason' => $reason,
        ]);

        return $subscription;
    }

    /**
     * Renew subscription for next billing period
     */
    public function renewSubscription(Subscription $subscription): Subscription
    {
        if (!$subscription->isActive()) {
            throw ValidationException::withMessages([
                'subscription' => ['Cannot renew an inactive subscription.'],
            ]);
        }

        $nextBillingDate = $subscription->billing_cycle === 'annual'
            ? $subscription->next_billing_date->clone()->addYear()
            : $subscription->next_billing_date->clone()->addMonth();

        $subscription->update([
            'next_billing_date' => $nextBillingDate,
        ]);

        return $subscription;
    }

    /**
     * Apply per-user pricing override
     */
    public function applyUserOverride(
        User $user,
        string $planId,
        float $monthlyPrice = null,
        float $annualPrice = null,
        Carbon $effectiveFrom = null,
        Carbon $effectiveTo = null,
        string $notes = null,
        User $createdBy = null
    ): UserSubscriptionOverride {
        $plan = SubscriptionPlan::findOrFail($planId);
        $tenantId = $user->tenant_id;

        // Use plan prices if overrides not provided
        if ($monthlyPrice === null) {
            $monthlyPrice = $plan->monthly_price;
        }
        if ($annualPrice === null) {
            $annualPrice = $plan->annual_price;
        }

        $override = UserSubscriptionOverride::updateOrCreate(
            ['tenant_id' => $tenantId, 'user_id' => $user->id],
            [
                'id' => Str::uuid(),
                'plan_id' => $planId,
                'monthly_price' => $monthlyPrice,
                'annual_price' => $annualPrice,
                'effective_from' => $effectiveFrom ?? now(),
                'effective_to' => $effectiveTo,
                'notes' => $notes,
                'created_by_user_id' => $createdBy?->id,
            ]
        );

        \Log::info('User subscription override applied', [
            'tenant_id' => $tenantId,
            'user_id' => $user->id,
            'plan_id' => $planId,
            'monthly_price' => $monthlyPrice,
        ]);

        return $override;
    }

    /**
     * Remove user pricing override
     */
    public function removeUserOverride(UserSubscriptionOverride $override): void
    {
        $override->delete();

        \Log::info('User subscription override removed', [
            'tenant_id' => $override->tenant_id,
            'user_id' => $override->user_id,
        ]);
    }

    /**
     * Calculate pro-rata amount for plan changes
     */
    public function calculateProRataAmount(
        Subscription $subscription,
        float $newPrice,
        int $daysRemaining
    ): float {
        if ($daysRemaining <= 0) {
            return 0;
        }

        $daysInBillingCycle = $subscription->billing_cycle === 'annual' ? 365 : 30;
        $oldDailyRate = $subscription->current_price / $daysInBillingCycle;
        $newDailyRate = $newPrice / $daysInBillingCycle;

        $difference = ($newDailyRate - $oldDailyRate) * $daysRemaining;

        return round($difference, 2);
    }

    /**
     * Check if user is within plan limits
     */
    public function isUserWithinPlanLimits(User $user): array
    {
        // Get user's subscription
        $subscription = Subscription::where('tenant_id', $user->tenant_id)->first();

        if (!$subscription) {
            return ['within_limits' => true];
        }

        $plan = $subscription->plan;
        $features = $plan->features ?? [];

        $violations = [];

        // Check task limit if applicable
        if (isset($features['tasks_limit'])) {
            $taskCount = $user->tasks()->count();
            if ($taskCount >= $features['tasks_limit']) {
                $violations[] = [
                    'feature' => 'tasks',
                    'limit' => $features['tasks_limit'],
                    'current' => $taskCount,
                ];
            }
        }

        // Check user limit if applicable
        if (isset($features['users_limit'])) {
            $userCount = \App\Models\User::where('tenant_id', $user->tenant_id)
                ->where('is_active', true)
                ->count();

            if ($userCount >= $features['users_limit']) {
                $violations[] = [
                    'feature' => 'users',
                    'limit' => $features['users_limit'],
                    'current' => $userCount,
                ];
            }
        }

        return [
            'within_limits' => empty($violations),
            'plan_name' => $plan->name,
            'violations' => $violations,
        ];
    }

    /**
     * Get all active subscriptions
     */
    public function getActiveSubscriptions(string $tenantId = null): Collection
    {
        $query = Subscription::where('status', 'active');

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        return $query->with('plan')->get();
    }

    /**
     * Get subscriptions expiring soon
     */
    public function getExpiringSubscriptions(int $days = 7): Collection
    {
        return Subscription::where('status', 'active')
            ->whereBetween('next_billing_date', [now(), now()->addDays($days)])
            ->with('plan')
            ->get();
    }

    /**
     * Get trial subscriptions ending soon
     */
    public function getTrialsEndingSoon(int $days = 3): Collection
    {
        return Subscription::where('status', 'trial')
            ->whereBetween('trial_ends_at', [now(), now()->addDays($days)])
            ->with('plan')
            ->get();
    }
}
