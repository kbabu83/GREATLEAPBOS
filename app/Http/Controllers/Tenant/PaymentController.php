<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\Invoice;
use App\Models\Tenant\Payment;
use App\Services\BillingService;
use App\Services\RazorpayService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    public function __construct(
        private RazorpayService $razorpayService,
        private BillingService $billingService,
    ) {}

    /**
     * Initiate payment - create Razorpay order
     */
    public function initiate(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => ['required', 'string', 'exists:invoices,id'],
        ]);

        // Get invoice
        $invoice = Invoice::where('id', $validated['invoice_id'])
            ->where('tenant_id', $request->user()->tenant_id)
            ->firstOrFail();

        // Check if already paid
        if ($invoice->isPaid()) {
            return response()->json([
                'message' => 'This invoice is already paid.',
            ], 400);
        }

        try {
            // Create Razorpay order
            $orderData = $this->razorpayService->createOrder(
                $invoice,
                $request->user()->email,
                $request->user()->name
            );

            return response()->json([
                'message' => 'Payment order created',
                'order_data' => $orderData,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create payment order: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Verify and process payment
     */
    public function verify(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => ['required', 'string', 'exists:invoices,id'],
            'razorpay_payment_id' => ['required', 'string'],
            'razorpay_order_id' => ['required', 'string'],
            'razorpay_signature' => ['required', 'string'],
        ]);

        // Get invoice
        $invoice = Invoice::where('id', $validated['invoice_id'])
            ->where('tenant_id', $request->user()->tenant_id)
            ->firstOrFail();

        try {
            // Verify signature
            $isValid = $this->razorpayService->verifyPayment(
                $validated['razorpay_payment_id'],
                $validated['razorpay_order_id'],
                $validated['razorpay_signature']
            );

            if (!$isValid) {
                throw ValidationException::withMessages([
                    'payment' => ['Payment verification failed. Invalid signature.'],
                ]);
            }

            // Process successful payment
            $payment = $this->razorpayService->handleSuccessfulPayment(
                $invoice,
                $validated['razorpay_payment_id'],
                $validated['razorpay_order_id']
            );

            // Send confirmation email
            $this->billingService->sendPaymentConfirmationEmail($invoice);

            return response()->json([
                'message' => 'Payment processed successfully',
                'payment_id' => $payment->id,
                'invoice_id' => $invoice->id,
                'amount' => $invoice->amount,
            ]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to process payment: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Webhook handler for Razorpay events
     */
    public function webhook(Request $request)
    {
        $input = $request->all();

        // Verify webhook signature
        $webhookSecret = config('razorpay.webhook_secret');

        $signature = $request->header('X-Razorpay-Signature');
        $body = $request->getContent();

        try {
            $expectedSignature = hash_hmac('sha256', $body, $webhookSecret);

            if ($signature !== $expectedSignature) {
                \Log::warning('Invalid webhook signature', [
                    'signature' => $signature,
                    'expected' => $expectedSignature,
                ]);

                return response()->json(['message' => 'Invalid signature'], 400);
            }

            $event = $input['event'] ?? null;

            match ($event) {
                'payment.authorized' => $this->handlePaymentAuthorized($input),
                'payment.captured' => $this->handlePaymentCaptured($input),
                'payment.failed' => $this->handlePaymentFailed($input),
                'refund.created' => $this->handleRefundCreated($input),
                default => \Log::info('Unhandled webhook event', ['event' => $event]),
            };

            return response()->json(['status' => 'ok']);
        } catch (\Exception $e) {
            \Log::error('Webhook processing error', [
                'error' => $e->getMessage(),
                'event' => $event ?? null,
            ]);

            return response()->json(['message' => 'Error processing webhook'], 500);
        }
    }

    /**
     * Handle payment authorized event
     */
    private function handlePaymentAuthorized(array $data): void
    {
        $paymentId = $data['payload']['payment']['entity']['id'] ?? null;
        $orderId = $data['payload']['payment']['entity']['order_id'] ?? null;

        if (!$paymentId || !$orderId) {
            return;
        }

        $invoice = Invoice::where('razorpay_order_id', $orderId)->first();

        if (!$invoice) {
            return;
        }

        $payment = $this->razorpayService->recordPayment(
            $invoice,
            $paymentId,
            $orderId,
            'authorized',
            [],
            $data['payload']['payment']['entity']
        );

        $payment->markAsAuthorized();

        \Log::info('Webhook: Payment authorized', [
            'invoice_id' => $invoice->id,
            'payment_id' => $paymentId,
        ]);
    }

    /**
     * Handle payment captured event
     */
    private function handlePaymentCaptured(array $data): void
    {
        $paymentId = $data['payload']['payment']['entity']['id'] ?? null;
        $orderId = $data['payload']['payment']['entity']['order_id'] ?? null;

        if (!$paymentId || !$orderId) {
            return;
        }

        $invoice = Invoice::where('razorpay_order_id', $orderId)->first();

        if (!$invoice) {
            return;
        }

        // Use the service method to handle successful payment
        $this->razorpayService->handleSuccessfulPayment(
            $invoice,
            $paymentId,
            $orderId
        );

        $this->billingService->sendPaymentConfirmationEmail($invoice);

        \Log::info('Webhook: Payment captured', [
            'invoice_id' => $invoice->id,
            'payment_id' => $paymentId,
        ]);
    }

    /**
     * Handle payment failed event
     */
    private function handlePaymentFailed(array $data): void
    {
        $paymentId = $data['payload']['payment']['entity']['id'] ?? null;
        $orderId = $data['payload']['payment']['entity']['order_id'] ?? null;
        $errorCode = $data['payload']['payment']['entity']['error_code'] ?? null;
        $errorDesc = $data['payload']['payment']['entity']['error_description'] ?? null;

        if (!$paymentId || !$orderId) {
            return;
        }

        $invoice = Invoice::where('razorpay_order_id', $orderId)->first();

        if (!$invoice) {
            return;
        }

        $this->razorpayService->handleFailedPayment(
            $invoice,
            $paymentId,
            "{$errorCode}: {$errorDesc}"
        );

        \Log::warning('Webhook: Payment failed', [
            'invoice_id' => $invoice->id,
            'payment_id' => $paymentId,
            'error' => $errorCode,
        ]);
    }

    /**
     * Handle refund created event
     */
    private function handleRefundCreated(array $data): void
    {
        $refundId = $data['payload']['refund']['entity']['id'] ?? null;
        $paymentId = $data['payload']['refund']['entity']['payment_id'] ?? null;

        if (!$refundId || !$paymentId) {
            return;
        }

        $payment = Payment::where('razorpay_payment_id', $paymentId)->first();

        if (!$payment) {
            return;
        }

        $payment->markAsRefunded();

        if ($payment->invoice) {
            $payment->invoice->markAsRefunded();
        }

        \Log::info('Webhook: Refund created', [
            'refund_id' => $refundId,
            'payment_id' => $paymentId,
        ]);
    }

    /**
     * Get list of invoices for user
     */
    public function listInvoices(Request $request)
    {
        $invoices = Invoice::where('tenant_id', $request->user()->tenant_id)
            ->with('subscription.plan')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($invoices);
    }

    /**
     * Get invoice details
     */
    public function showInvoice(Request $request, Invoice $invoice)
    {
        // Verify tenant access
        if ($invoice->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($invoice->load(['subscription.plan', 'payments']));
    }

    /**
     * Resend invoice email
     */
    public function resendInvoice(Request $request, Invoice $invoice)
    {
        // Verify tenant access
        if ($invoice->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $this->billingService->sendInvoiceEmail($invoice);

            return response()->json([
                'message' => 'Invoice sent to your email address',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send invoice: ' . $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Download invoice as PDF (placeholder)
     */
    public function downloadInvoice(Request $request, Invoice $invoice)
    {
        // Verify tenant access
        if ($invoice->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // TODO: Implement PDF generation with dompdf or similar
        return response()->json([
            'message' => 'PDF download available in future release',
        ]);
    }
}
