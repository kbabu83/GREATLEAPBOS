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
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
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
        .info-box {
            background-color: #dbeafe;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 15px;
            color: #1e40af;
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
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
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
        .timeline {
            background-color: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .timeline h3 {
            margin: 0 0 10px 0;
            color: #1e40af;
            font-size: 14px;
        }
        .timeline ul {
            margin: 0;
            padding-left: 20px;
        }
        .timeline li {
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
            <div class="icon">💰</div>
            <h1>Refund Processed</h1>
            <p>Your refund has been issued</p>
        </div>

        <div class="content">
            <p>Hello,</p>

            <p>We have processed a refund for your account. Please review the details below.</p>

            <div class="info-box">
                <strong>✓ Refund Confirmed</strong><br>
                Your refund was processed on <?php echo e(now()->format('M d, Y')); ?> and will appear in your account within 5-7 business days
            </div>

            <div class="details">
                <div class="detail-row">
                    <span class="detail-label">Invoice Number</span>
                    <span class="detail-value">#<?php echo e($invoice->invoice_number); ?></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Original Amount</span>
                    <span class="detail-value">₹<?php echo e(number_format($invoice->amount + $refundAmount, 2)); ?></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Refund Amount</span>
                    <span class="detail-value">₹<?php echo e(number_format($refundAmount, 2)); ?></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">New Amount</span>
                    <span class="detail-value">₹<?php echo e(number_format($invoice->amount, 2)); ?></span>
                </div>
            </div>

            <div class="amount-section">
                <div class="amount-label">Refund Amount</div>
                <div class="amount-value">₹<?php echo e(number_format($refundAmount, 2)); ?></div>
            </div>

            <div class="timeline">
                <h3>Refund Timeline</h3>
                <ul>
                    <li><strong>Processing Time:</strong> Immediate</li>
                    <li><strong>Bank Transfer Time:</strong> 5-7 business days</li>
                    <li><strong>Refund Method:</strong> Original payment method</li>
                    <li><strong>Status:</strong> Your refund has been submitted to the payment processor</li>
                </ul>
            </div>

            <p style="background-color: #fff7ed; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0; color: #92400e;">
                <strong>⚠️ Note:</strong> Bank processing times may vary. If you don't see the refund within 7 business days, please contact your bank or reach out to our support team.
            </p>

            <p style="text-align: center; margin-top: 30px;">
                <a href="<?php echo e(config('app.frontend_url')); ?>/tenant/invoices" style="color: #3b82f6; text-decoration: none; font-weight: 600;">View Invoice Details →</a>
            </p>

            <p style="margin-top: 30px; font-size: 13px; color: #666;">
                Questions about your refund? Contact us at <a href="mailto:support@greatleap.com">support@greatleap.com</a> or call our support team.
            </p>
        </div>

        <div class="footer">
            <p>&copy; <?php echo e(date('Y')); ?> Great Leap App. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly to this message.</p>
        </div>
    </div>
</body>
</html>
<?php /**PATH /var/www/new-great-leap-app/resources/views/emails/refund.blade.php ENDPATH**/ ?>