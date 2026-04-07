<?php

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Central\Feature;

class SubscriptionPlan extends Model
{
    use HasFactory, SoftDeletes;

    protected $connection = 'central';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'slug',
        'name',
        'description',
        'monthly_price',
        'annual_price',
        'per_user_price',
        'max_users',
        'features',
        'is_active',
        'is_configurable',
        'sort_order',
    ];

    protected $casts = [
        'monthly_price' => 'decimal:2',
        'annual_price' => 'decimal:2',
        'per_user_price' => 'decimal:2',
        'features' => 'json',
        'is_active' => 'boolean',
        'is_configurable' => 'boolean',
    ];

    protected $appends = ['display_name'];

    /**
     * Get plan features from old system
     */
    public function planFeatures(): HasMany
    {
        return $this->hasMany(SubscriptionPlanFeature::class, 'plan_id', 'id');
    }

    /**
     * Get features for this plan (new system)
     */
    public function features()
    {
        return $this->belongsToMany(
            Feature::class,
            'plan_features',
            'plan_id',
            'feature_id'
        )->orderBy('category')->orderBy('name');
    }

    /**
     * Calculate invoice amount based on number of users
     */
    public function calculateInvoiceAmount($numberOfUsers = 1): float
    {
        return (float) ($numberOfUsers * $this->per_user_price);
    }

    /**
     * Check if this plan can accommodate the given number of users
     */
    public function canAccommodateUsers($numberOfUsers): bool
    {
        if ($this->max_users === null) {
            return true;
        }
        return $numberOfUsers <= $this->max_users;
    }

    /**
     * Check if this is a free plan
     */
    public function isFreePlan(): bool
    {
        return $this->per_user_price == 0;
    }

    /**
     * Check if this is a premium plan
     */
    public function isPremium(): bool
    {
        return !$this->isFreePlan();
    }

    /**
     * Get monthly price
     */
    public function getMonthlyPrice(): float
    {
        return (float) $this->monthly_price;
    }

    /**
     * Get annual price
     */
    public function getAnnualPrice(): float
    {
        return (float) $this->annual_price;
    }

    /**
     * Get annual discount percentage
     */
    public function getAnnualDiscount(): float
    {
        if ($this->monthly_price == 0) {
            return 0;
        }

        $monthlyTotal = (float) $this->monthly_price * 12;
        $discount = (($monthlyTotal - $this->annual_price) / $monthlyTotal) * 100;

        return round($discount, 2);
    }

    /**
     * Get display name for the plan
     */
    public function getDisplayNameAttribute(): string
    {
        return "{$this->name} - ₹" . number_format($this->monthly_price, 2) . "/month";
    }

    /**
     * Scope to active plans only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to premium plans only
     */
    public function scopePremium($query)
    {
        return $query->where('monthly_price', '>', 0);
    }

    /**
     * Scope to free plans only
     */
    public function scopeFree($query)
    {
        return $query->where('monthly_price', 0)->where('annual_price', 0);
    }

    /**
     * Get all plans sorted by price
     */
    public function scopeSorted($query)
    {
        return $query->orderBy('sort_order')->orderBy('monthly_price');
    }
}
