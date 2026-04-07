# Implementation Checklist - User Management, Plans & Razorpay Integration

This document tracks the implementation of all phases for user management, subscription billing, and payment processing.

---

## Phase 1: Email OTP Password Reset System

### ✅ Completed

- [x] **Database Migrations**
  - [x] `database/migrations/2024_01_11_100001_create_password_reset_otps_table.php` (Central)
  - [x] `database/migrations/tenant/2024_01_11_100001_create_password_reset_otps_table.php` (Tenant)
  - [x] Table fields: email, otp, attempts, last_sent_at, verified_at, expires_at
  - [x] Indexes on email and expires_at

- [x] **Models**
  - [x] `app/Models/PasswordResetOtp.php`
  - [x] Methods: generateOtp(), isExpired(), isVerified(), markAsVerified(), incrementAttempts(), canRequestOtp(), getLatestForEmail(), cleanupExpired()

- [x] **Services**
  - [x] `app/Services/OtpService.php`
  - [x] Methods: generateAndSendOtp(), verifyOtp(), resetPassword(), resendOtp(), checkOtpStatus()
  - [x] Rate limiting: 5 OTP requests/hour, 3 verification attempts max

- [x] **Controllers**
  - [x] `app/Http/Controllers/Auth/PasswordResetController.php`
  - [x] Endpoints:
    - [x] POST `/auth/password/request-otp`
    - [x] POST `/auth/password/verify-otp`
    - [x] POST `/auth/password/reset-with-otp`
    - [x] POST `/auth/password/resend-otp`
    - [x] GET `/auth/password/check-otp-status`

- [x] **Email Templates**
  - [x] `app/Mail/PasswordResetOtpMail.php`
  - [x] `resources/views/emails/password-reset-otp.blade.php`
  - [x] Shows 6-digit OTP, 15-minute expiry warning

- [x] **Frontend Component**
  - [x] `resources/js/pages/Auth/ForgotPassword.jsx`
  - [x] 3-step flow: Email → OTP Verification → Password Reset
  - [x] Error handling for expired/invalid OTP

---

## Phase 2: Subscription Plans System

### ✅ Completed

- [x] **Database Migrations**
  - [x] Central DB:
    - [x] `database/migrations/2024_01_11_100002_create_subscription_plans_table.php`
    - [x] Tables: subscription_plans, plan_features
    - [x] Fields: id, slug, name, monthly_price, annual_price, features (JSON), is_active, timestamps

  - [x] Tenant DB:
    - [x] `database/migrations/tenant/2024_01_11_100002_create_subscriptions_table.php`
    - [x] Tables: subscriptions, user_subscription_overrides, invoices, payments
    - [x] Relationships with tenant_id, foreign keys, indexes

  - [x] Updated migrations:
    - [x] `users` table: Added subscription_id FK

- [x] **Models**
  - [x] Central Models:
    - [x] `app/Models/Central/SubscriptionPlan.php` with relationships
    - [x] `app/Models/Central/SubscriptionPlanFeature.php`

  - [x] Tenant Models:
    - [x] `app/Models/Tenant/Subscription.php`
    - [x] `app/Models/Tenant/UserSubscriptionOverride.php`
    - [x] `app/Models/Tenant/Invoice.php`
    - [x] `app/Models/Tenant/Payment.php`

  - [x] Updated Models:
    - [x] `app/Models/User.php`: Added subscriptionOverrides() relationship, getEffectivePrice() method
    - [x] `app/Models/Tenant.php`: Added subscription(), invoices(), payments() relationships

- [x] **Services**
  - [x] `app/Services/SubscriptionService.php` (11 methods)
    - [x] createSubscription()
    - [x] upgradeSubscription()
    - [x] downgradeSubscription()
    - [x] cancelSubscription()
    - [x] renewSubscription()
    - [x] applyUserOverride()
    - [x] removeUserOverride()
    - [x] calculateProRataAmount()
    - [x] isUserWithinPlanLimits()
    - [x] getActiveSubscriptions()
    - [x] getExpiringSubscriptions()
    - [x] getTrialsEndingSoon()

  - [x] `app/Services/BillingService.php` (10 methods)
    - [x] generateInvoice()
    - [x] getUpcomingInvoices()
    - [x] getUnpaidInvoices()
    - [x] sendInvoiceEmail()
    - [x] markInvoiceAsPaid()
    - [x] sendPaymentConfirmationEmail()
    - [x] applyCredits()
    - [x] createRefund()
    - [x] sendRefundEmail()
    - [x] getInvoiceSummary()

- [x] **Controllers**
  - [x] `app/Http/Controllers/Central/SubscriptionPlanController.php`
    - [x] index(), store(), show(), update(), destroy()
    - [x] updateFeatures()
    - [x] statistics()
    - [x] restore() (for soft-deleted plans)

  - [x] `app/Http/Controllers/Tenant/UserPricingController.php`
    - [x] show(), store(), update(), destroy()
    - [x] report()
    - [x] getPlans()
    - [x] bulkUpload()

- [x] **Email Templates**
  - [x] `app/Mail/InvoiceMail.php`
  - [x] `app/Mail/PaymentConfirmationMail.php`
  - [x] `app/Mail/RefundMail.php`
  - [x] `resources/views/emails/invoice.blade.php`
  - [x] `resources/views/emails/payment-confirmation.blade.php`
  - [x] `resources/views/emails/refund.blade.php`

- [x] **Routes**
  - [x] Plan management routes (admin)
  - [x] User pricing override routes (tenant admin)

---

## Phase 3: Razorpay Integration

### ✅ Completed

- [x] **Configuration**
  - [x] `config/razorpay.php` - Complete configuration file with all settings
  - [x] Environment variables in `.env.example`

- [x] **Services**
  - [x] `app/Services/RazorpayService.php` (8 methods)
    - [x] createOrder() - Create Razorpay order
    - [x] verifyPayment() - Signature verification
    - [x] getPaymentDetails() - Fetch from API
    - [x] capturePayment() - Capture authorized payments
    - [x] refundPayment() - Process refunds
    - [x] recordPayment() - Store in database
    - [x] handleSuccessfulPayment() - Mark paid, activate subscription
    - [x] handleFailedPayment() - Mark failed, log error

- [x] **Controllers**
  - [x] `app/Http/Controllers/Tenant/PaymentController.php`
    - [x] initiate() - Create order
    - [x] verify() - Verify payment
    - [x] webhook() - Webhook handler
    - [x] listInvoices() - List user invoices
    - [x] showInvoice() - View invoice details
    - [x] resendInvoice() - Resend invoice email
    - [x] downloadInvoice() - Download PDF (placeholder)

  - [x] Webhook handlers:
    - [x] handlePaymentAuthorized()
    - [x] handlePaymentCaptured()
    - [x] handlePaymentFailed()
    - [x] handleRefundCreated()

- [x] **Routes**
  - [x] POST `/webhooks/razorpay` - Public webhook endpoint (signature verified)
  - [x] POST `/tenant/payments/initiate` - Create order
  - [x] POST `/tenant/payments/verify` - Verify payment
  - [x] GET `/tenant/payments/history` - List payments
  - [x] GET `/tenant/payments/{id}` - View payment details
  - [x] GET `/tenant/invoices` - List invoices
  - [x] GET `/tenant/invoices/{id}` - View invoice
  - [x] POST `/tenant/invoices/{id}/send` - Resend email
  - [x] GET `/tenant/invoices/{id}/download` - Download PDF

---

## Phase 4: Plan Management Admin Panel

### ✅ Completed

- [x] **Frontend Components**
  - [x] `resources/js/pages/SuperAdmin/SubscriptionPlans.jsx`
    - [x] List plans with pricing and features
    - [x] Create new plan form
    - [x] Edit plan details
    - [x] Delete plan (soft delete)
    - [x] Display statistics: total plans, active subscriptions, monthly revenue
    - [x] Feature preview in cards

  - [x] `resources/js/pages/Tenant/UserPricing.jsx`
    - [x] Users table with current plan and overrides
    - [x] Add pricing override form
    - [x] Delete override
    - [x] Bulk CSV upload
    - [x] Pricing overrides report with savings calculation
    - [x] Statistics: total overrides, total savings, users with overrides

---

## Phase 5: Tenant Registration Flow with Payment

### ✅ Completed

- [x] **Backend Updates**
  - [x] `app/Http/Controllers/Central/TenantController.php`
    - [x] Updated register() endpoint to handle payment flow
    - [x] Validate plan selection
    - [x] Create Tenant, Domain, User
    - [x] Initialize subscription
    - [x] Generate and send invoice
    - [x] Send welcome email

- [x] **Frontend Component**
  - [x] `resources/js/pages/Auth/TenantRegister.jsx`
    - [x] 5-step wizard: Organization → Admin → Plan → Payment → Success
    - [x] Organization details: name, email, subdomain availability check
    - [x] Admin user details with password confirmation
    - [x] Plan selection with monthly/annual toggle
    - [x] Payment integration: Razorpay checkout
    - [x] Success confirmation with login link
    - [x] Step indicator with progress tracking
    - [x] Form validation at each step
    - [x] Error handling and user feedback

---

## Phase 6: Amazon SES & Email Configuration

### ✅ Completed

- [x] **Configuration**
  - [x] Added Amazon SES variables to `.env.example`:
    - [x] MAIL_MAILER=ses
    - [x] MAIL_SES_REGION
    - [x] AWS_ACCESS_KEY_ID
    - [x] AWS_SECRET_ACCESS_KEY
    - [x] MAIL_FROM_ADDRESS
    - [x] MAIL_FROM_NAME

- [x] **Email Templates** (Already created in Phase 2)
  - [x] PasswordResetOtpMail
  - [x] InvoiceMail
  - [x] PaymentConfirmationMail
  - [x] RefundMail

- [x] **Documentation**
  - [x] `PAYMENT_AND_EMAIL_SETUP.md` - Complete setup guide for:
    - [x] Razorpay integration steps
    - [x] Amazon SES configuration steps
    - [x] Environment variables reference
    - [x] Testing procedures
    - [x] Webhook setup
    - [x] Troubleshooting

---

## Additional Components Completed

- [x] **Payment Components**
  - [x] `resources/js/components/Payments/RazorpayCheckout.jsx`
    - [x] Payment modal with Razorpay SDK integration
    - [x] Order creation and signature verification
    - [x] Success/failure callbacks
    - [x] Accepted payment methods display
    - [x] Loading and error states

- [x] **Invoice Management**
  - [x] `resources/js/pages/Tenant/InvoiceList.jsx`
    - [x] List invoices with pagination
    - [x] View invoice details modal
    - [x] Pay invoice integration
    - [x] Resend invoice email
    - [x] Download invoice (PDF)
    - [x] Status badges and filtering
    - [x] Payment status tracking

---

## Configuration Files Created

- [x] `config/razorpay.php` - Complete Razorpay configuration
- [x] `.env.example` - Updated with payment and email variables
- [x] `PAYMENT_AND_EMAIL_SETUP.md` - Comprehensive setup guide
- [x] `IMPLEMENTATION_CHECKLIST.md` - This file

---

## Routes Summary

### Public Routes
```
POST   /auth/login
POST   /auth/password/request-otp
POST   /auth/password/verify-otp
POST   /auth/password/reset-with-otp
POST   /auth/password/resend-otp
GET    /auth/password/check-otp-status
POST   /tenants/register
POST   /webhooks/razorpay  (signature verified)
```

### Super Admin Routes
```
GET    /plans
POST   /plans
GET    /plans/{id}
PUT    /plans/{id}
DELETE /plans/{id}
POST   /plans/{id}/features
POST   /plans/{id}/restore
GET    /plans/admin/statistics
```

### Tenant Routes
```
GET    /tenant/users
POST   /tenant/users
GET    /tenant/users/{id}
PUT    /tenant/users/{id}
DELETE /tenant/users/{id}

GET    /tenant/users/{user}/pricing
POST   /tenant/users/{user}/pricing
PUT    /tenant/users/{user}/pricing/{override}
DELETE /tenant/users/{user}/pricing/{override}
GET    /tenant/pricing/report
GET    /tenant/pricing/plans
POST   /tenant/pricing/bulk-upload

POST   /tenant/payments/initiate
POST   /tenant/payments/verify
GET    /tenant/payments/history
GET    /tenant/payments/{id}

GET    /tenant/invoices
GET    /tenant/invoices/{id}
POST   /tenant/invoices/{id}/send
GET    /tenant/invoices/{id}/download
```

---

## Database Tables Summary

### Central Database
- `subscription_plans` - Plans with pricing
- `plan_features` - Features for each plan

### Tenant Database
- `subscriptions` - Tenant subscriptions
- `user_subscription_overrides` - Per-user pricing
- `invoices` - Generated invoices
- `payments` - Payment records

---

## Next Steps (Optional Enhancements)

- [ ] Add subscription upgrade/downgrade UI
- [ ] Add payment retry mechanism
- [ ] Add usage-based billing
- [ ] Add trial period management
- [ ] Add custom branding for emails
- [ ] Add payment history analytics
- [ ] Add subscription cancellation flow
- [ ] Add coupon/discount system
- [ ] Add multiple payment methods (Apple Pay, Google Pay)
- [ ] Add webhook retry mechanism

---

## Testing Checklist

### OTP Password Reset
- [ ] Request OTP → Email received within 10s
- [ ] Invalid OTP → Error message + rate limited after 3 attempts
- [ ] Valid OTP → Can reset password
- [ ] OTP expires after 15 minutes

### Plans & Subscriptions
- [ ] Create plan → Appears in registration
- [ ] Update plan → Changes for new signups
- [ ] User override → Shows custom price
- [ ] Plan limits enforced

### Payment Flow
- [ ] Initiate order → Razorpay order created
- [ ] Successful payment → Subscription active, invoice paid
- [ ] Failed payment → Clear error message, retry option
- [ ] Webhook verification → Signature validated

### Tenant Registration
- [ ] Free plan → Immediate tenant creation
- [ ] Paid plan → Payment required, tenant created after
- [ ] Email confirmations → Welcome email + invoice sent
- [ ] Admin login → Works immediately after registration

---

## Security Checklist

- [ ] RAZORPAY_KEY_SECRET not exposed in frontend
- [ ] Webhook signatures verified on every request
- [ ] Tenant isolation enforced with tenant_id filtering
- [ ] Payment verification required before marking as paid
- [ ] Admin operations behind role middleware
- [ ] Rate limiting on OTP requests
- [ ] API keys rotated periodically
- [ ] HTTPS enforced for all payment endpoints
- [ ] Sensitive data not logged

---

## File Structure

```
app/
├── Http/Controllers/
│   ├── Auth/PasswordResetController.php
│   ├── Central/SubscriptionPlanController.php
│   ├── Central/TenantController.php (updated)
│   └── Tenant/
│       ├── PaymentController.php
│       └── UserPricingController.php
├── Mail/
│   ├── PasswordResetOtpMail.php
│   ├── InvoiceMail.php
│   ├── PaymentConfirmationMail.php
│   └── RefundMail.php
├── Models/
│   ├── PasswordResetOtp.php
│   ├── User.php (updated)
│   ├── Tenant.php (updated)
│   ├── Central/
│   │   ├── SubscriptionPlan.php
│   │   └── SubscriptionPlanFeature.php
│   └── Tenant/
│       ├── Subscription.php
│       ├── UserSubscriptionOverride.php
│       ├── Invoice.php
│       └── Payment.php
└── Services/
    ├── OtpService.php
    ├── SubscriptionService.php
    ├── BillingService.php
    └── RazorpayService.php

config/
└── razorpay.php

database/
├── migrations/
│   └── 2024_01_11_100001_create_password_reset_otps_table.php
├── migrations/tenant/
│   ├── 2024_01_11_100001_create_password_reset_otps_table.php
│   └── 2024_01_11_100002_create_subscriptions_table.php
└── seeders/ (optional)

resources/
├── views/emails/
│   ├── password-reset-otp.blade.php
│   ├── invoice.blade.php
│   ├── payment-confirmation.blade.php
│   └── refund.blade.php
└── js/
    ├── components/Payments/
    │   └── RazorpayCheckout.jsx
    └── pages/
        ├── Auth/
        │   ├── ForgotPassword.jsx
        │   └── TenantRegister.jsx
        ├── SuperAdmin/
        │   └── SubscriptionPlans.jsx
        └── Tenant/
            ├── InvoiceList.jsx
            └── UserPricing.jsx

routes/
└── api.php (updated)

Documentation/
├── PAYMENT_AND_EMAIL_SETUP.md
└── IMPLEMENTATION_CHECKLIST.md
```

---

**Last Updated**: 2024-01-12
**Status**: All Phases Complete ✅
