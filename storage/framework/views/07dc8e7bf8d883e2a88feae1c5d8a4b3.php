<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        .icon {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .content {
            background-color: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
        }
        .success-box {
            background-color: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 8px;
            padding: 15px;
            color: #155724;
            text-align: center;
            margin: 20px 0;
        }
        .details {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            color: #666;
            font-weight: 500;
        }
        .detail-value {
            color: #333;
            font-weight: 600;
        }
        .amount-section {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .amount-label {
            font-size: 14px;
            opacity: 0.9;
            text-transform: uppercase;
        }
        .amount-value {
            font-size: 36px;
            font-weight: bold;
            margin-top: 10px;
        }
        .next-steps {
            background-color: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .next-steps h3 {
            margin: 0 0 10px 0;
            color: #059669;
            font-size: 14px;
        }
        .next-steps ul {
            margin: 0;
            padding-left: 20px;
        }
        .next-steps li {
            margin: 8px 0;
            font-size: 14px;
            color: #333;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #ddd;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="icon">✅</div>
            <h1>Payment Successful!</h1>
            <p>Your subscription payment has been confirmed</p>
        </div>

        <div class="content">
            <p>Hello,</p>

            <p>Thank you for your payment! Your subscription has been renewed and your account remains active.</p>

            <div class="success-box">
                <strong>✓ Payment Confirmed</strong><br>
                Your payment was successfully processed on <?php echo e(now()->format('M d, Y')); ?>

            </div>

            <div class="details">
                <div class="detail-row">
                    <span class="detail-label">Invoice Number</span>
                    <span class="detail-value">#<?php echo e($invoice->invoice_number); ?></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Subscription Plan</span>
                    <span class="detail-value"><?php echo e($plan->name); ?></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Billing Cycle</span>
                    <span class="detail-value"><?php echo e(ucfirst($invoice->subscription->billing_cycle)); ?></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Billing Period</span>
                    <span class="detail-value"><?php echo e($invoice->billing_period_start->format('M d, Y')); ?> - <?php echo e($invoice->billing_period_end->format('M d, Y')); ?></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Date</span>
                    <span class="detail-value"><?php echo e($invoice->paid_at->format('M d, Y')); ?></span>
                </div>
            </div>

            <div class="amount-section">
                <div class="amount-label">Amount Paid</div>
                <div class="amount-value">₹<?php echo e(number_format($invoice->amount, 2)); ?></div>
            </div>

            <div class="next-steps">
                <h3>What's Next?</h3>
                <ul>
                    <li>Your subscription is now active until <?php echo e($invoice->billing_period_end->format('M d, Y')); ?></li>
                    <li>You'll receive an invoice reminder 15 days before your next billing date</li>
                    <li>All features of <?php echo e($plan->name); ?> are available to your team</li>
                    <li>You can manage your subscription anytime in your account settings</li>
                </ul>
            </div>

            <p style="text-align: center; margin-top: 30px;">
                <a href="<?php echo e(config('app.frontend_url')); ?>/tenant/invoices" style="color: #059669; text-decoration: none; font-weight: 600;">View All Invoices →</a>
            </p>

            <p style="margin-top: 30px; font-size: 13px; color: #666;">
                If you have any questions about your subscription or payment, please contact our support team at <a href="mailto:support@greatleap.com">support@greatleap.com</a>
            </p>
        </div>

        <div class="footer">
            <p>&copy; <?php echo e(date('Y')); ?> Great Leap App. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly to this message.</p>
        </div>
    </div>
</body>
</html>
<?php /**PATH /var/www/new-great-leap-app/resources/views/emails/payment-confirmation.blade.php ENDPATH**/ ?>