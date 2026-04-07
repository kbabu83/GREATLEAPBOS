<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Central\SubscriptionPlan;

class Subscription extends Model
{
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'tenant_id',
        'plan_id',
        'billing_cycle',
        'current_price',
        'status',
        'trial_ends_at',
        'next_billing_date',
        'number_of_users',
        'cancelled_at',
    ];

    protected $casts = [
        'current_price' => 'decimal:2',
        'trial_ends_at' => 'datetime',
        'next_billing_date' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    /**
     * Get the subscription plan
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id', 'id')->withoutGlobalScopes();
    }

    /**
     * Get invoices for this subscription
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'subscription_id', 'id');
    }

    /**
     * Get payments for this subscription
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'subscription_id', 'id');
    }

    /**
     * Check if subscription is currently active
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if subscription is in trial period
     */
    public function isTrial(): bool
    {
        return $this->status === 'trial' && $this->trial_ends_at?->isFuture();
    }

    /**
     * Check if subscription is cancelled
     */
    public function isCancelled(): bool
    {
        return $this->status === 'cancelled' || $this->cancelled_at !== null;
    }

    /**
     * Get days until next billing
     */
    public function daysUntilRenewal(): int
    {
        if (!$this->next_billing_date) {
            return 0;
        }

        return now()->diffInDays($this->next_billing_date, false);
    }

    /**
     * Check if subscription can be downgraded
     */
    public function canDowngrade(): bool
    {
        return $this->isActive() || $this->isTrial();
    }

    /**
     * Mark subscription as active
     */
    public function markAsActive(): void
    {
        $this->update([
            'status' => 'active',
            'trial_ends_at' => null,
        ]);
    }

    /**
     * Mark subscription as cancelled
     */
    public function markAsCancelled(string $reason = null): void
    {
        $this->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);
    }

    /**
     * Mark subscription as suspended
     */
    public function markAsSuspended(): void
    {
        $this->update(['status' => 'suspended']);
    }

    /**
     * Get the latest paid invoice
     */
    public function getLatestPaidInvoice(): ?Invoice
    {
        return $this->invoices()
            ->where('status', 'paid')
            ->latest('paid_at')
            ->first();
    }

    /**
     * Get unpaid invoices
     */
    public function getUnpaidInvoices(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->invoices()
            ->whereIn('status', ['draft', 'sent', 'failed'])
            ->get();
    }
}
