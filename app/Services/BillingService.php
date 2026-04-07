<?php

namespace App\Services;

use App\Mail\InvoiceMail;
use App\Models\Tenant\Invoice;
use App\Models\Tenant\Subscription;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BillingService
{
    /**
     * Generate invoice for subscription
     */
    public function generateInvoice(
        Subscription $subscription,
        Carbon $billingPeriodStart = null,
        Carbon $billingPeriodEnd = null,
        string $paymentMethod = null
    ): Invoice {
        $billingPeriodStart = $billingPeriodStart ?? now();

        if ($subscription->billing_cycle === 'annual') {
            $billingPeriodEnd = $billingPeriodEnd ?? $billingPeriodStart->clone()->addYear();
        } else {
            $billingPeriodEnd = $billingPeriodEnd ?? $billingPeriodStart->clone()->addMonth();
        }

        // Generate unique invoice number
        $invoiceNumber = Invoice::generateInvoiceNumber($subscription->tenant_id);

        $invoice = Invoice::create([
            'id' => Str::uuid(),
            'tenant_id' => $subscription->tenant_id,
            'subscription_id' => $subscription->id,
            'invoice_number' => $invoiceNumber,
            'amount' => $subscription->current_price,
            'currency' => 'INR',
            'status' => 'draft',
            'payment_method' => $paymentMethod ?? 'razorpay',
            'billing_period_start' => $billingPeriodStart->toDateString(),
            'billing_period_end' => $billingPeriodEnd->toDateString(),
            'due_date' => $billingPeriodStart->clone()->addDays(15)->toDateString(),
        ]);

        \Log::info('Invoice generated', [
            'invoice_id' => $invoice->id,
            'invoice_number' => $invoiceNumber,
            'tenant_id' => $subscription->tenant_id,
            'amount' => $subscription->current_price,
        ]);

        return $invoice;
    }

    /**
     * Get upcoming invoices for tenant
     */
    public function getUpcomingInvoices(string $tenantId, int $days = 30): \Illuminate\Database\Eloquent\Collection
    {
        return Invoice::forTenant($tenantId)
            ->where('status', '!=', 'paid')
            ->where('due_date', '<=', now()->addDays($days)->toDateString())
            ->with('subscription.plan')
            ->orderBy('due_date')
            ->get();
    }

    /**
     * Get unpaid invoices
     */
    public function getUnpaidInvoices(string $tenantId): \Illuminate\Database\Eloquent\Collection
    {
        return Invoice::forTenant($tenantId)
            ->unpaid()
            ->with('subscription.plan')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Send invoice email to tenant
     */
    public function sendInvoiceEmail(Invoice $invoice): void
    {
        try {
            // Get tenant info
            $tenant = \App\Models\Tenant::findByIdOrFail($invoice->tenant_id);

            // Get admin email for tenant
            $adminEmail = \App\Models\User::where('tenant_id', $invoice->tenant_id)
                ->where('role', 'tenant_admin')
                ->first()
                ?->email;

            if (!$adminEmail) {
                \Log::warning('No admin email found for tenant', [
                    'tenant_id' => $invoice->tenant_id,
                    'invoice_id' => $invoice->id,
                ]);
                return;
            }

            Mail::to($adminEmail)->queue(new InvoiceMail($invoice, $tenant));

            $invoice->markAsSent();

            \Log::info('Invoice email sent', [
                'invoice_id' => $invoice->id,
                'email' => $adminEmail,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to send invoice email', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Mark invoice as paid
     */
    public function markInvoiceAsPaid(Invoice $invoice, string $paymentId = null): void
    {
        $invoice->markAsPaid($paymentId);

        // Send payment confirmation email
        $this->sendPaymentConfirmationEmail($invoice);

        \Log::info('Invoice marked as paid', [
            'invoice_id' => $invoice->id,
            'payment_id' => $paymentId,
        ]);
    }

    /**
     * Send payment confirmation email
     */
    public function sendPaymentConfirmationEmail(Invoice $invoice): void
    {
        try {
            $adminEmail = \App\Models\User::where('tenant_id' => $invoice->tenant_id)
                ->where('role', 'tenant_admin')
                ->first()
                ?->email;

            if (!$adminEmail) {
                return;
            }

            Mail::to($adminEmail)->queue(new \App\Mail\PaymentConfirmationMail($invoice));
        } catch (\Exception $e) {
            \Log::error('Failed to send payment confirmation email', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Apply credits to invoice
     */
    public function applyCredits(Invoice $invoice, float $creditAmount): void
    {
        if ($creditAmount > $invoice->amount) {
            throw ValidationException::withMessages([
                'credits' => ['Credit amount cannot exceed invoice amount.'],
            ]);
        }

        $newAmount = $invoice->amount - $creditAmount;

        $invoice->update(['amount' => $newAmount]);

        \Log::info('Credit applied to invoice', [
            'invoice_id' => $invoice->id,
            'credit_amount' => $creditAmount,
            'new_amount' => $newAmount,
        ]);
    }

    /**
     * Create refund for payment
     */
    public function createRefund(Invoice $invoice, float $amount, string $reason = null): \App\Models\Tenant\Payment
    {
        $payment = $invoice->payments()->first();

        if (!$payment || !$payment->canRefund()) {
            throw ValidationException::withMessages([
                'payment' => ['This invoice cannot be refunded.'],
            ]);
        }

        // Create refund payment record
        $refund = \App\Models\Tenant\Payment::create([
            'id' => Str::uuid(),
            'tenant_id' => $invoice->tenant_id,
            'invoice_id' => $invoice->id,
            'razorpay_payment_id' => 'REFUND-' . $payment->razorpay_payment_id,
            'amount' => -$amount,
            'currency' => 'INR',
            'status' => 'refunded',
            'payment_method_details' => ['reason' => $reason],
            'razorpay_response' => ['refund' => true],
        ]);

        $invoice->markAsRefunded();

        // Send refund email
        $this->sendRefundEmail($invoice, $amount);

        \Log::info('Refund created', [
            'invoice_id' => $invoice->id,
            'refund_amount' => $amount,
            'reason' => $reason,
        ]);

        return $refund;
    }

    /**
     * Send refund confirmation email
     */
    public function sendRefundEmail(Invoice $invoice, float $amount): void
    {
        try {
            $adminEmail = \App\Models\User::where('tenant_id' => $invoice->tenant_id)
                ->where('role', 'tenant_admin')
                ->first()
                ?->email;

            if (!$adminEmail) {
                return;
            }

            Mail::to($adminEmail)->queue(new \App\Mail\RefundMail($invoice, $amount));
        } catch (\Exception $e) {
            \Log::error('Failed to send refund email', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get invoice summary for dashboard
     */
    public function getInvoiceSummary(string $tenantId): array
    {
        $invoices = Invoice::forTenant($tenantId)->get();

        $totalAmount = $invoices->sum('amount');
        $paidAmount = $invoices->where('status', 'paid')->sum('amount');
        $unpaidAmount = $invoices->unpaid()->sum('amount');
        $overdue = $invoices->unpaid()
            ->where('due_date', '<', now()->toDateString())
            ->count();

        return [
            'total_invoices' => $invoices->count(),
            'total_amount' => round($totalAmount, 2),
            'paid_amount' => round($paidAmount, 2),
            'unpaid_amount' => round($unpaidAmount, 2),
            'overdue_count' => $overdue,
            'payment_rate' => $invoices->count() > 0
                ? round(($paidAmount / $totalAmount) * 100, 2)
                : 0,
        ];
    }

    /**
     * Get monthly revenue
     */
    public function getMonthlyRevenue(string $tenantId = null, int $months = 12): array
    {
        $query = Invoice::where('status', 'paid');

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $revenue = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $month = $date->format('Y-m');
            $monthName = $date->format('M Y');

            $amount = $query->clone()
                ->whereYear('paid_at', $date->year)
                ->whereMonth('paid_at', $date->month)
                ->sum('amount');

            $revenue[] = [
                'month' => $month,
                'month_name' => $monthName,
                'revenue' => round($amount, 2),
            ];
        }

        return $revenue;
    }
}
