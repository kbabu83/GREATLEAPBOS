<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Execution\EsRole;
use App\Models\Tenant\UserSubscriptionOverride;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // Role constants
    const ROLE_SUPER_ADMIN  = 'super_admin';
    const ROLE_TENANT_ADMIN = 'tenant_admin';
    const ROLE_STAFF        = 'staff';

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'tenant_id',
        'avatar',
        'phone',
        'department',
        'reporting_to',
        'is_active',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at'     => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
        ];
    }

    // ── Relationships ────────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function esRoles(): BelongsToMany
    {
        return $this->belongsToMany(EsRole::class, 'user_es_roles', 'user_id', 'es_role_id')
                    ->withTimestamps();
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporting_to');
    }

    public function reportingUsers()
    {
        return $this->hasMany(User::class, 'reporting_to');
    }

    public function subscriptionOverrides(): HasMany
    {
        return $this->hasMany(UserSubscriptionOverride::class, 'user_id', 'id');
    }

    // ── Role helpers ─────────────────────────────────────────────────────────

    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    public function isTenantAdmin(): bool
    {
        return $this->role === self::ROLE_TENANT_ADMIN;
    }

    public function isStaff(): bool
    {
        return $this->role === self::ROLE_STAFF;
    }

    public function isTenantUser(): bool
    {
        return $this->tenant_id !== null;
    }

    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    public function hasAnyRole(array $roles): bool
    {
        return in_array($this->role, $roles);
    }

    public function getRoleDisplayAttribute(): string
    {
        return match($this->role) {
            self::ROLE_SUPER_ADMIN  => 'Super Admin',
            self::ROLE_TENANT_ADMIN => 'Tenant Admin',
            self::ROLE_STAFF        => 'Staff',
            default                 => 'Unknown',
        };
    }

    // ── Subscription helpers ─────────────────────────────────────────────────

    /**
     * Get the effective price for this user, considering overrides
     */
    public function getEffectivePrice(string $billingCycle = 'monthly'): float
    {
        // Get active override if exists
        $override = $this->subscriptionOverrides()
            ->active()
            ->latest('created_at')
            ->first();

        if ($override) {
            return $override->getEffectivePrice($billingCycle);
        }

        // Default: return 0 (will use subscription plan price)
        return 0;
    }

    /**
     * Check if user has an active subscription override
     */
    public function hasActiveOverride(): bool
    {
        return $this->subscriptionOverrides()
            ->active()
            ->exists();
    }

    /**
     * Get the active override for this user
     */
    public function getActiveOverride(): ?UserSubscriptionOverride
    {
        return $this->subscriptionOverrides()
            ->active()
            ->latest('created_at')
            ->first();
    }

    // ── Feature helpers ──────────────────────────────────────────────────────

    /**
     * Check if user has a specific feature
     */
    public function hasFeature(string $featureSlug): bool
    {
        // Super admins have all features
        if ($this->isSuperAdmin()) {
            return true;
        }

        // For tenant users, check subscription
        if (!$this->isTenantUser()) {
            return false;
        }

        $subscription = $this->tenant?->subscription;
        if (!$subscription || $subscription->status !== 'active') {
            return false;
        }

        return $subscription->plan->features()
            ->where('slug', $featureSlug)
            ->exists();
    }

    /**
     * Check if user has any of the given features
     */
    public function hasAnyFeature(array $featureSlugs): bool
    {
        foreach ($featureSlugs as $slug) {
            if ($this->hasFeature($slug)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get all features for user's plan
     */
    public function getFeatures(): array
    {
        if ($this->isSuperAdmin()) {
            return \App\Models\Central\Feature::where('is_active', true)
                ->pluck('slug')
                ->toArray();
        }

        if (!$this->isTenantUser()) {
            return [];
        }

        $subscription = $this->tenant?->subscription;
        if (!$subscription || $subscription->status !== 'active') {
            return [];
        }

        return $subscription->plan->features()
            ->pluck('slug')
            ->toArray();
    }
}
