<?php

namespace App\Services;

use App\Models\Tenant\Invoice;
use App\Models\Tenant\Payment;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Razorpay\Api\Api;
use Razorpay\Api\Errors\SignatureVerificationError;

class RazorpayService
{
    private Api $api;

    public function __construct()
    {
        $this->api = new Api(
            config('razorpay.key_id'),
            config('razorpay.key_secret')
        );
    }

    /**
     * Create a Razorpay order for an invoice
     */
    public function createOrder(
        Invoice $invoice,
        string $tenantEmail,
        string $tenantName
    ): array {
        try {
            $order = $this->api->order->create([
                'amount' => (int) ($invoice->amount * 100), // Convert to paise
                'currency' => config('razorpay.currency', 'INR'),
                'receipt' => $invoice->invoice_number,
                'description' => 'Invoice #' . $invoice->invoice_number . ' - ' . $tenantName,
                'customer_notify' => 1,
                'notes' => [
                    'invoice_id' => $invoice->id,
                    'tenant_id' => $invoice->tenant_id,
                    'subscription_id' => $invoice->subscription_id,
                ],
            ]);

            // Store order ID in invoice
            $invoice->update([
                'razorpay_order_id' => $order['id'],
            ]);

            \Log::info('Razorpay order created', [
                'order_id' => $order['id'],
                'invoice_id' => $invoice->id,
                'amount' => $invoice->amount,
            ]);

            return [
                'order_id' => $order['id'],
                'amount' => $invoice->amount,
                'currency' => config('razorpay.currency', 'INR'),
                'key_id' => config('razorpay.key_id'),
                'customer_email' => $tenantEmail,
                'customer_name' => $tenantName,
            ];
        } catch (\Exception $e) {
            \Log::error('Failed to create Razorpay order', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'payment' => ['Failed to create payment order. Please try again.'],
            ]);
        }
    }

    /**
     * Verify payment signature from Razorpay
     */
    public function verifyPayment(
        string $razorpayPaymentId,
        string $razorpayOrderId,
        string $razorpaySignature
    ): bool {
        try {
            $this->api->utility->verifyPaymentSignature([
                'razorpay_order_id' => $razorpayOrderId,
                'razorpay_payment_id' => $razorpayPaymentId,
                'razorpay_signature' => $razorpaySignature,
            ]);

            return true;
        } catch (SignatureVerificationError $e) {
            \Log::warning('Razorpay signature verification failed', [
                'payment_id' => $razorpayPaymentId,
                'order_id' => $razorpayOrderId,
                'error' => $e->getMessage(),
            ]);

            return false;
        } catch (\Exception $e) {
            \Log::error('Razorpay verification error', [
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Get payment details from Razorpay
     */
    public function getPaymentDetails(string $paymentId): array
    {
        try {
            $payment = $this->api->payment->fetch($paymentId);

            return [
                'id' => $payment['id'],
                'amount' => $payment['amount'] / 100, // Convert from paise
                'currency' => $payment['currency'],
                'status' => $payment['status'],
                'method' => $payment['method'],
                'email' => $payment['email'],
                'contact' => $payment['contact'],
                'created_at' => date('Y-m-d H:i:s', $payment['created_at']),
                'description' => $payment['description'],
                'error_code' => $payment['error_code'] ?? null,
                'error_description' => $payment['error_description'] ?? null,
            ];
        } catch (\Exception $e) {
            \Log::error('Failed to fetch payment details', [
                'payment_id' => $paymentId,
                'error' => $e->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'payment' => ['Failed to fetch payment details.'],
            ]);
        }
    }

    /**
     * Capture payment (for authorized payments)
     */
    public function capturePayment(string $paymentId, int $amount): array
    {
        try {
            $payment = $this->api->payment->fetch($paymentId);

            if ($payment['status'] !== 'authorized') {
                throw new \Exception('Payment is not in authorized state');
            }

            $captured = $this->api->payment->capture($paymentId, $amount * 100);

            \Log::info('Payment captured', [
                'payment_id' => $paymentId,
                'amount' => $amount,
            ]);

            return [
                'id' => $captured['id'],
                'status' => $captured['status'],
                'amount' => $captured['amount'] / 100,
            ];
        } catch (\Exception $e) {
            \Log::error('Payment capture failed', [
                'payment_id' => $paymentId,
                'error' => $e->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'payment' => ['Failed to capture payment.'],
            ]);
        }
    }

    /**
     * Refund payment
     */
    public function refundPayment(
        string $paymentId,
        float $amount = null,
        string $reason = null
    ): array {
        try {
            $refundData = [
                'receipt' => 'REFUND-' . Str::random(10),
            ];

            if ($amount) {
                $refundData['amount'] = (int) ($amount * 100);
            }

            if ($reason) {
                $refundData['notes'] = ['reason' => $reason];
            }

            $refund = $this->api->refund->create($refundData);

            \Log::info('Payment refunded', [
                'payment_id' => $paymentId,
                'refund_id' => $refund['id'],
                'amount' => $amount,
            ]);

            return [
                'id' => $refund['id'],
                'status' => $refund['status'],
                'amount' => ($refund['amount'] ?? 0) / 100,
            ];
        } catch (\Exception $e) {
            \Log::error('Payment refund failed', [
                'payment_id' => $paymentId,
                'error' => $e->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'refund' => ['Failed to process refund.'],
            ]);
        }
    }

    /**
     * Create payment record in database
     */
    public function recordPayment(
        Invoice $invoice,
        string $razorpayPaymentId,
        string $razorpayOrderId,
        string $status,
        array $paymentDetails = [],
        array $razorpayResponse = []
    ): Payment {
        $payment = Payment::create([
            'id' => Str::uuid(),
            'tenant_id' => $invoice->tenant_id,
            'invoice_id' => $invoice->id,
            'razorpay_payment_id' => $razorpayPaymentId,
            'amount' => $invoice->amount,
            'currency' => config('razorpay.currency', 'INR'),
            'status' => $status,
            'payment_method_details' => $paymentDetails,
            'razorpay_response' => $razorpayResponse,
        ]);

        return $payment;
    }

    /**
     * Handle successful payment
     */
    public function handleSuccessfulPayment(
        Invoice $invoice,
        string $razorpayPaymentId,
        string $razorpayOrderId
    ): Payment {
        // Get payment details from Razorpay
        $paymentDetails = $this->getPaymentDetails($razorpayPaymentId);

        // Record payment
        $payment = $this->recordPayment(
            $invoice,
            $razorpayPaymentId,
            $razorpayOrderId,
            'captured',
            [
                'method' => $paymentDetails['method'] ?? 'unknown',
                'email' => $paymentDetails['email'] ?? null,
            ],
            $paymentDetails
        );

        $payment->markAsCaptured();

        // Update invoice as paid
        $invoice->markAsPaid($razorpayPaymentId);

        // Activate subscription if in trial
        if ($invoice->subscription && $invoice->subscription->isTrial()) {
            $invoice->subscription->markAsActive();
        }

        \Log::info('Payment processed successfully', [
            'invoice_id' => $invoice->id,
            'payment_id' => $payment->id,
            'amount' => $invoice->amount,
        ]);

        return $payment;
    }

    /**
     * Handle failed payment
     */
    public function handleFailedPayment(
        Invoice $invoice,
        string $razorpayPaymentId,
        string $errorMessage = null
    ): Payment {
        $payment = $this->recordPayment(
            $invoice,
            $razorpayPaymentId,
            null,
            'failed',
            [],
            ['error' => $errorMessage]
        );

        $payment->markAsFailed($errorMessage);

        $invoice->markAsFailed();

        \Log::warning('Payment failed', [
            'invoice_id' => $invoice->id,
            'payment_id' => $razorpayPaymentId,
            'error' => $errorMessage,
        ]);

        return $payment;
    }

    /**
     * Get API instance for direct access
     */
    public function getApi(): Api
    {
        return $this->api;
    }
}
