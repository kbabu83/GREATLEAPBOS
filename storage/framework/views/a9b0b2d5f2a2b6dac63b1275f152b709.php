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
            background-color: #1A526D;
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        .content {
            background-color: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
        }
        .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
            padding: 20px;
            background-color: white;
            border-radius: 8px;
        }
        .detail-group {
            margin-bottom: 15px;
        }
        .detail-label {
            font-size: 12px;
            color: #999;
            text-transform: uppercase;
            font-weight: bold;
        }
        .detail-value {
            font-size: 16px;
            color: #333;
            margin-top: 5px;
        }
        .amount-box {
            background-color: #8CC63E;
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .amount-label {
            font-size: 12px;
            text-transform: uppercase;
            opacity: 0.9;
        }
        .amount-value {
            font-size: 32px;
            font-weight: bold;
            margin-top: 10px;
        }
        .plan-info {
            background-color: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #8CC63E;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #ddd;
        }
        .payment-button {
            display: inline-block;
            background-color: #8CC63E;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f0f0f0;
            font-weight: bold;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Invoice #<?php echo e($invoice->invoice_number); ?></h1>
            <p><?php echo e($tenant->name); ?></p>
        </div>

        <div class="content">
            <p>Hello,</p>

            <p>This is your subscription invoice for <?php echo e($plan->name); ?>. Please review the details below and make the payment by the due date to avoid service interruptions.</p>

            <div class="invoice-details">
                <div class="detail-group">
                    <div class="detail-label">Invoice Date</div>
                    <div class="detail-value"><?php echo e($invoice->created_at->format('M d, Y')); ?></div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Due Date</div>
                    <div class="detail-value"><?php echo e($invoice->due_date->format('M d, Y')); ?></div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Billing Period</div>
                    <div class="detail-value"><?php echo e($invoice->billing_period_start->format('M d')); ?> - <?php echo e($invoice->billing_period_end->format('M d, Y')); ?></div>
                </div>
                <div class="detail-group">
                    <div class="detail-label">Subscription Plan</div>
                    <div class="detail-value"><?php echo e($plan->name); ?></div>
                </div>
            </div>

            <div class="amount-box">
                <div class="amount-label">Amount Due</div>
                <div class="amount-value">₹<?php echo e(number_format($invoice->amount, 2)); ?></div>
            </div>

            <div class="plan-info">
                <p><strong>Plan Details:</strong></p>
                <p><?php echo e($plan->description); ?></p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><?php echo e($plan->name); ?> (<?php echo e(ucfirst($invoice->subscription->billing_cycle)); ?>)</td>
                        <td style="text-align: right;">₹<?php echo e(number_format($invoice->amount, 2)); ?></td>
                    </tr>
                    <tr style="font-weight: bold; background-color: #f0f0f0;">
                        <td>Total</td>
                        <td style="text-align: right;">₹<?php echo e(number_format($invoice->amount, 2)); ?></td>
                    </tr>
                </tbody>
            </table>

            <?php if($invoice->status !== 'paid'): ?>
                <center>
                    <a href="<?php echo e(config('app.frontend_url')); ?>/tenant/invoices/<?php echo e($invoice->id); ?>" class="payment-button">Pay Invoice Now</a>
                </center>

                <p style="text-align: center; color: #666; font-size: 12px;">
                    Click the button above to securely pay your invoice using Razorpay
                </p>
            <?php else: ?>
                <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; text-align: center; color: #155724; margin: 20px 0;">
                    <strong>✓ This invoice has been paid</strong>
                </div>
            <?php endif; ?>

            <p style="margin-top: 30px; font-size: 13px; color: #666;">
                If you have any questions about this invoice, please contact our billing team at <a href="mailto:billing@greatleap.com">billing@greatleap.com</a>
            </p>
        </div>

        <div class="footer">
            <p>&copy; <?php echo e(date('Y')); ?> Great Leap App. All rights reserved.</p>
            <p>This is an automated email. Please do not reply directly to this message.</p>
        </div>
    </div>
</body>
</html>
<?php /**PATH /var/www/new-great-leap-app/resources/views/emails/invoice.blade.php ENDPATH**/ ?>