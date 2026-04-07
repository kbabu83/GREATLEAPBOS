<?php

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory, SoftDeletes;

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'tenant_id',
        'invoice_id',
        'razorpay_payment_id',
        'amount',
        'currency',
        'status',
        'payment_method_details',
        'razorpay_response',
        'error_message',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_method_details' => 'json',
        'razorpay_response' => 'json',
    ];

    /**
     * Get the invoice this payment is for
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'invoice_id', 'id');
    }

    /**
     * Check if payment is successful
     */
    public function isSuccessful(): bool
    {
        return in_array($this->status, ['authorized', 'captured']);
    }

    /**
     * Check if payment is captured
     */
    public function isCaptured(): bool
    {
        return $this->status === 'captured';
    }

    /**
     * Check if payment has failed
     */
    public function hasFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Check if payment can be refunded
     */
    public function canRefund(): bool
    {
        return $this->isCaptured() && !$this->isRefunded();
    }

    /**
     * Check if payment is refunded
     */
    public function isRefunded(): bool
    {
        return $this->status === 'refunded';
    }

    /**
     * Get Razorpay payment details
     */
    public function getRazorpayDetails(): ?array
    {
        return $this->razorpay_response;
    }

    /**
     * Mark as authorized
     */
    public function markAsAuthorized(): void
    {
        $this->update(['status' => 'authorized']);
    }

    /**
     * Mark as captured
     */
    public function markAsCaptured(): void
    {
        $this->update(['status' => 'captured']);
    }

    /**
     * Mark as failed with error message
     */
    public function markAsFailed(string $errorMessage = null): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $errorMessage,
        ]);
    }

    /**
     * Mark as refunded
     */
    public function markAsRefunded(): void
    {
        $this->update(['status' => 'refunded']);
    }

    /**
     * Get formatted amount
     */
    public function getFormattedAmount(): string
    {
        return number_format($this->amount, 2) . ' ' . $this->currency;
    }

    /**
     * Get payment method from Razorpay response
     */
    public function getPaymentMethod(): string
    {
        if ($this->razorpay_response && isset($this->razorpay_response['method'])) {
            return ucfirst($this->razorpay_response['method']);
        }

        return $this->payment_method_details['type'] ?? 'Unknown';
    }

    /**
     * Scope to successful payments
     */
    public function scopeSuccessful($query)
    {
        return $query->whereIn('status', ['authorized', 'captured']);
    }

    /**
     * Scope to failed payments
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope to specific tenant
     */
    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope to recent payments
     */
    public function scopeRecent($query)
    {
        return $query->latest('created_at');
    }
}
