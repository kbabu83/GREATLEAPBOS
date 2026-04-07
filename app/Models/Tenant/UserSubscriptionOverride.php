<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;
use App\Models\Central\SubscriptionPlan;

class UserSubscriptionOverride extends Model
{
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'tenant_id',
        'user_id',
        'plan_id',
        'monthly_price',
        'annual_price',
        'effective_from',
        'effective_to',
        'notes',
        'created_by_user_id',
    ];

    protected $casts = [
        'monthly_price' => 'decimal:2',
        'annual_price' => 'decimal:2',
        'effective_from' => 'datetime',
        'effective_to' => 'datetime',
    ];

    /**
     * Get the user this override applies to
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    /**
     * Get the subscription plan for this override
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id', 'id')->withoutGlobalScopes();
    }

    /**
     * Get the user who created this override
     */
    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id', 'id');
    }

    /**
     * Check if override is currently active
     */
    public function isActive(): bool
    {
        $now = now();

        $startsOk = $this->effective_from === null || $now->isAfter($this->effective_from);
        $endsOk = $this->effective_to === null || $now->isBefore($this->effective_to);

        return $startsOk && $endsOk;
    }

    /**
     * Get effective price for billing cycle
     */
    public function getEffectivePrice(string $billingCycle = 'monthly'): float
    {
        if ($billingCycle === 'annual') {
            return (float) ($this->annual_price ?? $this->plan->annual_price);
        }

        return (float) ($this->monthly_price ?? $this->plan->monthly_price);
    }

    /**
     * Get savings compared to standard plan pricing
     */
    public function getSavings(string $billingCycle = 'monthly'): float
    {
        $planPrice = $billingCycle === 'annual'
            ? $this->plan->annual_price
            : $this->plan->monthly_price;

        $overridePrice = $this->getEffectivePrice($billingCycle);

        return max(0, $planPrice - $overridePrice);
    }

    /**
     * Get savings percentage
     */
    public function getSavingsPercentage(string $billingCycle = 'monthly'): float
    {
        $planPrice = $billingCycle === 'annual'
            ? $this->plan->annual_price
            : $this->plan->monthly_price;

        if ($planPrice == 0) {
            return 0;
        }

        $savings = $this->getSavings($billingCycle);

        return round(($savings / $planPrice) * 100, 2);
    }

    /**
     * Scope to active overrides only
     */
    public function scopeActive($query)
    {
        $now = now();

        return $query
            ->where(function ($q) use ($now) {
                $q->whereNull('effective_from')
                    ->orWhere('effective_from', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('effective_to')
                    ->orWhere('effective_to', '>', $now);
            });
    }

    /**
     * Scope to overrides for a specific user
     */
    public function scopeForUser($query, User $user)
    {
        return $query->where('user_id', $user->id);
    }

    /**
     * Scope to overrides for a specific tenant
     */
    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}
