# Payment & Email Setup Guide

This guide covers the setup of Razorpay payments and Amazon SES email integration for Great Leap App.

---

## Table of Contents

1. [Razorpay Integration](#razorpay-integration)
2. [Amazon SES Setup](#amazon-ses-setup)
3. [Environment Variables](#environment-variables)
4. [Testing](#testing)
5. [Webhook Setup](#webhook-setup)

---

## Razorpay Integration

### Prerequisites

- Razorpay business account (https://dashboard.razorpay.com)
- API Keys from Razorpay Dashboard

### Step 1: Get Your API Keys

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to **Settings** → **API Keys**
3. Copy your **Key ID** (public) and **Key Secret** (keep secure)
4. For webhook signature verification, go to **Webhooks** section and copy the **Webhook Secret**

### Step 2: Configure Environment Variables

Add the following to your `.env` file:

```env
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
RAZORPAY_CURRENCY=INR
RAZORPAY_TEST_MODE=false  # Set to true for testing
RAZORPAY_WEBHOOK_ENABLED=true
RAZORPAY_WEBHOOK_URL=/webhooks/razorpay
```

### Step 3: Webhook Configuration

1. In Razorpay Dashboard, go to **Webhooks** section
2. Add a new webhook with:
   - **URL**: `https://yourdomain.com/api/webhooks/razorpay`
   - **Events to listen to**:
     - `payment.authorized`
     - `payment.captured`
     - `payment.failed`
     - `refund.created`
3. Copy the **Webhook Secret** and add to `.env` as `RAZORPAY_WEBHOOK_SECRET`

### Step 4: Test Mode

During development, use test credentials:

```env
RAZORPAY_TEST_MODE=true
```

**Test Card Numbers:**
- **Success**: `4111 1111 1111 1111`
- **Failure**: `4444 4444 4444 4448`
- **OTP**: Any 6-digit number (e.g., 123456)

---

## Amazon SES Setup

### Prerequisites

- AWS Account (https://aws.amazon.com)
- AWS CLI installed (optional, for verification)

### Step 1: Create IAM User

1. Log in to [AWS Console](https://console.aws.amazon.com)
2. Go to **IAM** → **Users** → **Create User**
3. Give it a name (e.g., `great-leap-ses-user`)
4. Select **Programmatic access**
5. Click **Next: Permissions**

### Step 2: Attach SES Policy

1. Select **Attach policies directly**
2. Search for and select `AmazonSESFullAccess`
3. Review and create the user
4. Copy the **Access Key ID** and **Secret Access Key**

### Step 3: Verify Email Address

1. Go to **SES** → **Email Addresses** (in your region)
2. Click **Verify a New Email Address**
3. Enter your sender email (e.g., `noreply@yourdomain.com`)
4. Check email and click verification link

**Important**: In sandbox mode, you must verify both sender AND recipient emails.

### Step 4: Request Production Access

1. In SES Dashboard, click **Edit Account Details**
2. Choose **Enable sending for this account**
3. Request production access (email review by AWS)

### Step 5: Configure Environment Variables

Add to `.env`:

```env
MAIL_MAILER=ses
MAIL_SES_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="Great Leap App"
```

---

## Environment Variables

### Complete Configuration

```env
# ===== RAZORPAY =====
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxx
RAZORPAY_CURRENCY=INR
RAZORPAY_TIMEOUT=30
RAZORPAY_TEST_MODE=false
RAZORPAY_WEBHOOK_ENABLED=true

# ===== EMAIL: Amazon SES =====
MAIL_MAILER=ses
MAIL_SES_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJal...
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="Great Leap App"

# ===== EMAIL: SMTP (Alternative) =====
# MAIL_MAILER=smtp
# MAIL_HOST=smtp.gmail.com
# MAIL_PORT=587
# MAIL_USERNAME=your-email@gmail.com
# MAIL_PASSWORD=your-app-password
# MAIL_ENCRYPTION=tls
```

---

## Testing

### Test Payment Flow

1. **Create Order**: POST `/api/tenant/payments/initiate`
   ```json
   {
       "invoice_id": "uuid-of-invoice"
   }
   ```

2. **Verify Payment**: POST `/api/tenant/payments/verify`
   ```json
   {
       "invoice_id": "uuid",
       "razorpay_payment_id": "pay_xxx",
       "razorpay_order_id": "order_xxx",
       "razorpay_signature": "signature"
   }
   ```

### Test Email Sending

```php
// In Laravel tinker or controller
Mail::send(new \App\Mail\PaymentConfirmationMail($invoice));
```

### Test Webhook

Use Razorpay Dashboard's webhook tester:
1. Go to **Webhooks** section
2. Click **Test Webhook** next to your webhook URL
3. Select an event and send test payload

---

## Email Templates

### Included Email Templates

1. **Invoice Mail** (`resources/views/emails/invoice.blade.php`)
   - Sent when invoice is created
   - Contains payment link

2. **Payment Confirmation** (`resources/views/emails/payment-confirmation.blade.php`)
   - Sent after successful payment
   - Shows payment details and subscription info

3. **Refund Notification** (`resources/views/emails/refund.blade.php`)
   - Sent when refund is processed
   - Includes refund timeline

4. **Password Reset OTP** (`resources/views/emails/password-reset-otp.blade.php`)
   - Sent for OTP-based password reset
   - Contains 6-digit OTP with 15-minute expiry

### Customizing Email Templates

All email templates use Blade syntax:

```blade
<p>{{ $invoice->invoice_number }}</p>
<p>₹{{ number_format($invoice->amount, 2) }}</p>
<p>{{ $invoice->billing_period_start->format('M d, Y') }}</p>
```

---

## Queue Configuration (Optional)

For production, use a queue to send emails asynchronously:

```env
QUEUE_CONNECTION=redis
```

In `config/queue.php`, emails use `Mail::queue()` automatically.

---

## Security Considerations

### Never Expose

- ❌ RAZORPAY_KEY_SECRET
- ❌ AWS_SECRET_ACCESS_KEY
- ❌ API Keys

### Always

- ✅ Verify webhook signatures (done automatically)
- ✅ Use HTTPS for webhook URLs
- ✅ Keep `.env` file out of version control
- ✅ Rotate API keys periodically

### Database

- Store `razorpay_order_id` and `razorpay_payment_id` in `payments` table
- Store webhook responses for audit trail
- Never store `RAZORPAY_KEY_SECRET` in database

---

## Troubleshooting

### Payment Not Processing

**Issue**: Order created but payment fails

**Solutions**:
1. Check webhook signature in logs
2. Verify Razorpay credentials in `.env`
3. Check browser console for JavaScript errors
4. Verify webhook URL is accessible

### Emails Not Sending

**Issue**: Emails stuck in queue or not delivered

**Solutions**:
1. Check Laravel logs: `storage/logs/laravel.log`
2. Verify AWS IAM permissions
3. Check if sender email is verified in SES
4. Test SMTP connectivity if using SMTP

### Webhook Not Triggering

**Issue**: Payment is made but webhook doesn't fire

**Solutions**:
1. Check webhook URL is publicly accessible
2. Verify webhook secret matches in Razorpay dashboard
3. Check server logs for 404/500 errors
4. Test webhook manually in Razorpay dashboard

---

## Additional Resources

- [Razorpay API Documentation](https://razorpay.com/docs/api/)
- [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Laravel Mail Documentation](https://laravel.com/docs/mail)

---

## Support

For issues related to:
- **Razorpay**: Contact Razorpay support (https://support.razorpay.com)
- **AWS SES**: Contact AWS support (https://aws.amazon.com/contact-us/)
- **Great Leap App**: Open an issue on GitHub or contact support
