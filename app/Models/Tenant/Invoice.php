<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'tenant_id',
        'subscription_id',
        'invoice_number',
        'amount',
        'currency',
        'status',
        'payment_method',
        'razorpay_order_id',
        'razorpay_payment_id',
        'billing_period_start',
        'billing_period_end',
        'due_date',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'billing_period_start' => 'date',
        'billing_period_end' => 'date',
        'due_date' => 'date',
        'paid_at' => 'datetime',
    ];

    /**
     * Get the subscription this invoice belongs to
     */
    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class, 'subscription_id', 'id');
    }

    /**
     * Get payments for this invoice
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'invoice_id', 'id');
    }

    /**
     * Get the payment for this invoice
     */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class, 'id', 'invoice_id');
    }

    /**
     * Check if invoice is paid
     */
    public function isPaid(): bool
    {
        return $this->status === 'paid' && $this->paid_at !== null;
    }

    /**
     * Check if invoice is overdue
     */
    public function isOverdue(): bool
    {
        if ($this->isPaid() || !$this->due_date) {
            return false;
        }

        return now()->isAfter($this->due_date);
    }

    /**
     * Check if invoice is pending payment
     */
    public function isPending(): bool
    {
        return in_array($this->status, ['draft', 'sent', 'failed']);
    }

    /**
     * Mark as sent
     */
    public function markAsSent(): void
    {
        $this->update(['status' => 'sent']);
    }

    /**
     * Mark as paid
     */
    public function markAsPaid(string $paymentId = null): void
    {
        $this->update([
            'status' => 'paid',
            'paid_at' => now(),
            'razorpay_payment_id' => $paymentId ?? $this->razorpay_payment_id,
        ]);
    }

    /**
     * Mark as failed
     */
    public function markAsFailed(): void
    {
        $this->update(['status' => 'failed']);
    }

    /**
     * Mark as refunded
     */
    public function markAsRefunded(): void
    {
        $this->update(['status' => 'refunded']);
    }

    /**
     * Get days until due
     */
    public function getDaysUntilDue(): int
    {
        if (!$this->due_date) {
            return 0;
        }

        return now()->diffInDays($this->due_date, false);
    }

    /**
     * Generate unique invoice number
     */
    public static function generateInvoiceNumber(string $tenantId): string
    {
        $year = now()->year;
        $lastInvoice = self::where('tenant_id', $tenantId)
            ->latest('created_at')
            ->first();

        $sequence = $lastInvoice ? (intval(substr($lastInvoice->invoice_number, -5)) + 1) : 1;

        return sprintf('INV-%s-%05d', $year, $sequence);
    }

    /**
     * Scope to paid invoices
     */
    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    /**
     * Scope to unpaid invoices
     */
    public function scopeUnpaid($query)
    {
        return $query->whereIn('status', ['draft', 'sent', 'failed']);
    }

    /**
     * Scope to overdue invoices
     */
    public function scopeOverdue($query)
    {
        return $query->whereIn('status', ['sent', 'failed'])
            ->where('due_date', '<', now()->toDateString());
    }

    /**
     * Scope to specific tenant
     */
    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}
