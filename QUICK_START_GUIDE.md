# Quick Start Guide - Payment & Subscription System

A quick reference guide to using the newly implemented user management, subscription billing, and payment processing system.

---

## 🚀 Getting Started (5 Minutes)

### 1. Environment Setup

Copy and update your `.env` file with Razorpay credentials:

```bash
cp .env.example .env

# Edit .env and add:
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxx
MAIL_MAILER=ses
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
```

### 2. Run Migrations

```bash
# Central database
php artisan migrate

# Tenant databases (for each tenant)
php artisan migrate --path=database/migrations/tenant
```

### 3. Seed Plans (Optional)

```bash
php artisan db:seed --class=SubscriptionPlanSeeder
```

---

## 👤 User Registration Flow

### For Customers

1. **Navigate to Registration**: `/register/tenant`
2. **Step 1**: Enter organization details and check subdomain availability
3. **Step 2**: Enter admin user details
4. **Step 3**: Select plan (Free, Starter, Professional, Enterprise)
5. **Step 4**: Complete Razorpay payment (if paid plan)
6. **Step 5**: Confirmation with login link

### API Endpoint

```bash
POST /api/tenants/register
Content-Type: application/json

{
  "tenant_name": "Acme Corp",
  "tenant_email": "contact@acmecorp.com",
  "subdomain": "acmecorp",
  "admin_name": "John Doe",
  "admin_email": "john@acmecorp.com",
  "admin_password": "SecurePassword123",
  "plan_id": "uuid-of-plan",
  "billing_cycle": "monthly"
}
```

---

## 🔐 Password Reset via OTP

### For Users

1. **Go to**: `/forgot-password`
2. **Enter email** to receive OTP
3. **Enter 6-digit OTP** from email
4. **Set new password**
5. **Login with new password**

### API Endpoints

```bash
# Request OTP
POST /api/auth/password/request-otp
{ "email": "user@example.com" }

# Verify OTP
POST /api/auth/password/verify-otp
{ "email": "user@example.com", "otp": "123456" }

# Reset Password
POST /api/auth/password/reset-with-otp
{
  "email": "user@example.com",
  "otp": "123456",
  "password": "NewPassword123",
  "password_confirmation": "NewPassword123"
}
```

---

## 💰 Payment Management (Admin)

### View Plans

Navigate to **Admin → Plans** to see all subscription plans.

```bash
GET /api/plans
```

### Create New Plan

1. Click **+ New Plan**
2. Enter plan details:
   - Name: "Professional"
   - Slug: "professional"
   - Monthly Price: ₹999
   - Annual Price: ₹9,999
   - Active: Yes
3. Click **Create**

```bash
POST /api/plans
{
  "name": "Professional",
  "slug": "professional",
  "monthly_price": 999,
  "annual_price": 9999,
  "is_active": true
}
```

### Manage Plan Features

Features are managed through the plan detail page or API:

```bash
POST /api/plans/{planId}/features
{
  "feature_key": "max_users",
  "feature_value": "50",
  "description": "Maximum 50 team members"
}
```

---

## 📊 User Pricing Management

### For Tenant Admins

Navigate to **Settings → User Pricing** to manage per-user pricing.

#### Add Individual Override

1. Click **+ Add Override** next to user
2. Select plan
3. Set monthly and annual prices
4. Click **Create Override**

#### Bulk Upload

1. Click **⬆️ Bulk Upload**
2. Prepare CSV with format:
   ```
   user_email,plan_slug,monthly_price,annual_price
   john@example.com,professional,799,7999
   jane@example.com,enterprise,1999,19999
   ```
3. Upload CSV file

#### View Report

Click **📊 Report** to see:
- Total savings from overrides
- Per-user override details
- Revenue impact analysis

---

## 💳 Invoice & Payment Management

### For Customers

Navigate to **Invoices** to manage billing.

#### View Invoices

- See all invoices with status (Paid, Unpaid, Draft)
- Filter by date range
- View invoice details

#### Pay Invoice

1. Click **Pay** button next to unpaid invoice
2. Click **Proceed to Payment**
3. Complete Razorpay payment
4. Confirmation email received

#### Other Actions

- **Email**: Resend invoice via email
- **Download**: Download PDF (after payment)

### API Endpoints

```bash
# List invoices
GET /api/tenant/invoices?per_page=15

# View invoice
GET /api/tenant/invoices/{invoiceId}

# Initiate payment
POST /api/tenant/payments/initiate
{ "invoice_id": "uuid" }

# Verify payment
POST /api/tenant/payments/verify
{
  "invoice_id": "uuid",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_order_id": "order_xxx",
  "razorpay_signature": "signature"
}

# Resend invoice email
POST /api/tenant/invoices/{invoiceId}/send

# Download invoice PDF
GET /api/tenant/invoices/{invoiceId}/download
```

---

## 📧 Email Integration

### Emails Sent By System

1. **Password Reset OTP**
   - Triggered: User requests password reset
   - Contains: 6-digit OTP, 15-minute timer
   - Template: `resources/views/emails/password-reset-otp.blade.php`

2. **Invoice Email**
   - Triggered: Invoice created or manual resend
   - Contains: Invoice details, payment link
   - Template: `resources/views/emails/invoice.blade.php`

3. **Payment Confirmation**
   - Triggered: Payment successful
   - Contains: Payment details, subscription info
   - Template: `resources/views/emails/payment-confirmation.blade.php`

4. **Refund Notification**
   - Triggered: Refund processed
   - Contains: Refund amount, timeline
   - Template: `resources/views/emails/refund.blade.php`

### Test Email Sending

```php
// In Laravel Tinker
Mail::send(new \App\Mail\InvoiceMail($invoice));
```

---

## 🔗 Important Endpoints Reference

### Public (No Auth Required)
```
POST   /api/auth/login
POST   /api/tenants/register
POST   /api/auth/password/request-otp
POST   /api/auth/password/verify-otp
POST   /api/auth/password/reset-with-otp
POST   /api/webhooks/razorpay
```

### Admin Only
```
GET    /api/plans
POST   /api/plans
GET    /api/plans/{id}
PUT    /api/plans/{id}
DELETE /api/plans/{id}
POST   /api/plans/{id}/features
GET    /api/plans/admin/statistics
```

### Tenant Admin
```
GET    /api/tenant/users/{id}/pricing
POST   /api/tenant/users/{id}/pricing
PUT    /api/tenant/users/{id}/pricing/{override}
DELETE /api/tenant/users/{id}/pricing/{override}
GET    /api/tenant/pricing/report
POST   /api/tenant/pricing/bulk-upload
```

### All Authenticated Users
```
POST   /api/tenant/payments/initiate
POST   /api/tenant/payments/verify
GET    /api/tenant/invoices
GET    /api/tenant/invoices/{id}
POST   /api/tenant/invoices/{id}/send
GET    /api/tenant/invoices/{id}/download
```

---

## 🧪 Testing

### Test Razorpay Payment

Use test credentials in `.env`:

```env
RAZORPAY_TEST_MODE=true
```

Test Cards:
- **Success**: 4111 1111 1111 1111
- **Failure**: 4444 4444 4444 4448
- **OTP**: Any 6-digit number (e.g., 123456)

### Test OTP

1. Request OTP: Received in 5-10 seconds
2. Verify with test OTP: `123456`
3. Valid for 15 minutes

### Test Webhook

In Razorpay Dashboard:
1. Go to **Webhooks** section
2. Click **Test Webhook** next to your webhook
3. Select event: `payment.captured`
4. Send test payload

---

## 🛠️ Troubleshooting

### Payment Fails

```
✓ Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env
✓ Verify Razorpay webhook URL is publicly accessible
✓ Check browser console for JavaScript errors
✓ Verify test card numbers are correct
```

### Emails Not Sent

```
✓ Check Laravel logs: storage/logs/laravel.log
✓ Verify AWS IAM user has SES permissions
✓ Check if sender email is verified in AWS SES
✓ Test with: Mail::send(new TestMail())
```

### OTP Not Received

```
✓ Check email configuration in .env
✓ Verify MAIL_FROM_ADDRESS is correct
✓ Check spam/junk folder
✓ Check Laravel logs for errors
```

### Webhook Not Triggering

```
✓ Verify webhook URL is https:// (not http://)
✓ Check webhook URL is publicly accessible
✓ Verify webhook secret in Razorpay dashboard
✓ Check server logs for 404/500 errors
```

---

## 📚 Full Documentation

For complete information, see:
- **Payment Setup**: `PAYMENT_AND_EMAIL_SETUP.md`
- **Implementation Details**: `IMPLEMENTATION_CHECKLIST.md`
- **API Documentation**: `docs/api/`

---

## 🎯 Common Tasks

### Create a New Subscription Plan

```bash
curl -X POST http://localhost:8000/api/plans \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Startup",
    "slug": "startup",
    "monthly_price": 499,
    "annual_price": 4999,
    "is_active": true
  }'
```

### Send Invoice to Customer

```bash
curl -X POST http://localhost:8000/api/tenant/invoices/{invoiceId}/send \
  -H "Authorization: Bearer {token}"
```

### Create User Price Override

```bash
curl -X POST http://localhost:8000/api/tenant/users/{userId}/pricing \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "{planId}",
    "monthly_price": 799,
    "annual_price": 7999
  }'
```

### Process Refund

```php
$refund = $razorpayService->refundPayment(
    paymentId: 'pay_xxx',
    amount: 999,
    reason: 'Customer request'
);
```

---

## 💡 Best Practices

### Security
- ✅ Never expose `RAZORPAY_KEY_SECRET` in frontend
- ✅ Always verify webhook signatures
- ✅ Use HTTPS for all payment requests
- ✅ Rotate API keys regularly

### Operations
- ✅ Monitor webhook logs regularly
- ✅ Set up alerts for failed payments
- ✅ Review usage metrics in pricing report
- ✅ Test payment flow in staging before production

### Customer Experience
- ✅ Send invoice reminders before due date
- ✅ Send payment confirmation immediately
- ✅ Provide easy invoice download
- ✅ Clear error messages on payment failure

---

**Version**: 1.0.0
**Last Updated**: 2024-01-12
**Status**: Production Ready ✅
