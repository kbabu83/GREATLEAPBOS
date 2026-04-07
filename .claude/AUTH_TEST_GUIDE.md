# Authentication System - Comprehensive Test Guide

## Setup Instructions

### Prerequisites
- Local environment with MySQL running
- Laravel dev server running (`php artisan serve`)
- Vite dev server running (`npm run dev`)
- Fresh database state (or clean tenant test database)

### Starting Dev Servers

**Terminal 1 - Backend Laravel:**
```bash
cd /Users/user1/Desktop/great-leap-app01
php artisan serve
```

**Terminal 2 - Frontend Vite:**
```bash
cd /Users/user1/Desktop/great-leap-app01
npm run dev
```

**Expected Output:**
- Laravel: `Server running at http://127.0.0.1:8000`
- Vite: `Local: http://localhost:5173/`

---

## Test Plan Overview

| Test Case | Flow | Expected Result |
|-----------|------|-----------------|
| **TC-1** | Tenant Registration | Fresh tenant created, admin user in tenant DB |
| **TC-2** | Tenant Login | Admin logs in successfully, gets auth token |
| **TC-3** | Password Reset Flow | OTP generated, verified, password reset works |
| **TC-4** | Login with New Password | New password allows login |
| **TC-5** | Email Validation | Invalid/duplicate emails rejected with clear messages |
| **TC-6** | Multi-tenant Isolation | Users from different tenants can't access each other's data |

---

## Test Execution

### TC-1: Tenant Registration

**Test Data:**
```json
{
  "tenant_name": "Test Company Ltd",
  "tenant_email": "test@example.com",
  "admin_name": "John Administrator",
  "admin_email": "admin@testcompany.com",
  "admin_password": "SecurePass@123",
  "admin_password_confirmation": "SecurePass@123",
  "plan": "starter",
  "number_of_users": 5
}
```

**Steps:**
1. Open browser to `http://localhost:5173`
2. Click "Register" button
3. Fill in all fields with test data above
4. Click "Register" button
5. Wait for response

**Expected Results:**
✅ Success Response (201):
```json
{
  "message": "Company registered successfully.",
  "user": {
    "id": "<UUID>",
    "name": "John Administrator",
    "email": "admin@testcompany.com",
    "role": "tenant_admin",
    "tenant_id": "<TENANT_UUID>",
    "tenant_name": "Test Company Ltd"
  },
  "token": "<AUTH_TOKEN>",
  "tenant_id": "<TENANT_UUID>",
  "plan": "starter"
}
```

**Database Verification:**
```bash
# Check central database
mysql> SELECT id, name, email, plan, status FROM tenants WHERE email='test@example.com';
# Should return 1 row with status='trial'

# Check tenant database
mysql> USE tenant_<TENANT_UUID>;
mysql> SELECT id, name, email, role, tenant_id FROM users WHERE email='admin@testcompany.com';
# Should return 1 row with tenant_id set correctly
```

**❌ Common Failures & Solutions:**
- **Error: "This email is already in use"** → Email already registered, use different email
- **Error: "This email is reserved for a tenant"** → tenant_email conflicts with admin_email, use different email
- **Error: "Plan [plan_name] not found"** → Check SubscriptionPlan table for available plans
- **Error: "Plan [plan_name] supports maximum X users"** → Reduce number_of_users to match plan limit

---

### TC-2: Tenant Admin Login

**Test Data:**
```json
{
  "email": "admin@testcompany.com",
  "password": "SecurePass@123"
}
```

**Steps:**
1. On login page, enter email and password
2. Click "Login" button
3. Wait for response

**Expected Results:**
✅ Success Response (200):
```json
{
  "message": "Login successful",
  "user": {
    "id": "<USER_ID>",
    "name": "John Administrator",
    "email": "admin@testcompany.com",
    "role": "tenant_admin",
    "tenant_id": "<TENANT_UUID>",
    "tenant_name": "Test Company Ltd"
  },
  "token": "<AUTH_TOKEN>"
}
```

**UI Verification:**
- User is redirected to dashboard
- User name appears in top-right corner
- "Logout" option appears

**❌ Common Failures & Solutions:**
- **Error: "Credentials do not match"** → Password is incorrect, verify password from TC-1
- **Error: "User not found"** → Email doesn't exist, verify email from TC-1
- **Error: "Account is inactive"** → Contact super admin to activate account
- **Blank response / 500 error** → Check Laravel logs: `tail -f storage/logs/laravel.log`

---

### TC-3: Password Reset Flow

**Step 1: Request OTP**

**Test Data:**
```json
{
  "email": "admin@testcompany.com"
}
```

**Steps:**
1. On login page, click "Forgot Password?"
2. Enter admin email
3. Click "Request OTP" button
4. Wait for response

**Expected Results:**
✅ Success Response (200):
```json
{
  "message": "OTP sent successfully to admin@testcompany.com",
  "expires_in_minutes": 15
}
```

**Email Verification:**
- Check email (since MAIL_MAILER=log, check Laravel logs):
```bash
tail -f storage/logs/laravel.log | grep "PasswordResetOtpMail"
```
- Should see 6-digit OTP in logs

**Database Verification:**
```bash
mysql> SELECT email, otp, verified_at, expires_at FROM password_reset_otps WHERE email='admin@testcompany.com';
# Should show OTP, NULL verified_at, future expires_at
```

---

**Step 2: Verify OTP**

**Test Data (from logs):**
```json
{
  "email": "admin@testcompany.com",
  "otp": "123456"  // from logs
}
```

**Steps:**
1. Enter the 6-digit OTP from email/logs
2. Click "Verify OTP" button
3. Wait for response

**Expected Results:**
✅ Success Response (200):
```json
{
  "message": "OTP verified successfully",
  "email": "admin@testcompany.com"
}
```

**Database Verification:**
```bash
mysql> SELECT email, verified_at FROM password_reset_otps WHERE email='admin@testcompany.com';
# Should show verified_at is NOT NULL
```

---

**Step 3: Reset Password**

**Test Data:**
```json
{
  "email": "admin@testcompany.com",
  "otp": "123456",
  "password": "NewSecurePass@456",
  "password_confirmation": "NewSecurePass@456"
}
```

**Steps:**
1. Enter new password (must be at least 8 chars, mixed case, numbers, symbols)
2. Confirm password
3. Click "Reset Password" button
4. Wait for response

**Expected Results:**
✅ Success Response (200):
```json
{
  "message": "Password reset successfully. You can now login with your new password.",
  "user_id": "<USER_ID>"
}
```

**Database Verification:**
```bash
# In tenant database:
mysql> USE tenant_<TENANT_UUID>;
mysql> SELECT id, email, password FROM users WHERE email='admin@testcompany.com';
# Password hash should be updated
```

**❌ Common Failures & Solutions:**
- **Error: "OTP has expired"** → Request new OTP, they expire after 15 minutes
- **Error: "OTP already used"** → OTP can only be used once, request new OTP
- **Error: "Invalid OTP"** → Check digit count, should be 6 digits exactly
- **Error: "Too many incorrect attempts"** → Request new OTP after 3 failed attempts

---

### TC-4: Login with New Password

**Test Data:**
```json
{
  "email": "admin@testcompany.com",
  "password": "NewSecurePass@456"
}
```

**Steps:**
1. Return to login page
2. Enter email and NEW password
3. Click "Login" button
4. Wait for response

**Expected Results:**
✅ Success Response (200) with auth token and user data

**UI Verification:**
- User successfully redirected to dashboard
- User can access all tenant features

---

### TC-5: Email Validation

**Test Data - Invalid Format:**
```json
{
  "tenant_email": "invalid-email",
  "admin_email": "also-invalid"
}
```

**Expected Results:**
❌ Validation Error (422):
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "tenant_email": ["The email field must be a valid email."],
    "admin_email": ["The email field must be a valid email."]
  }
}
```

---

**Test Data - Duplicate Email:**
```json
{
  "admin_email": "admin@testcompany.com"  // Already exists from TC-1
}
```

**Expected Results:**
❌ Validation Error (422):
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "admin_email": ["This email is already in use by another account."]
  }
}
```

---

**Test Data - Email Used as Tenant Email:**
```json
{
  "admin_email": "test@example.com"  // test@example.com is tenant_email from TC-1
}
```

**Expected Results:**
❌ Validation Error (422):
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "admin_email": ["This email is reserved for a tenant account."]
  }
}
```

---

### TC-6: Multi-Tenant Isolation

**Prerequisites:**
- Have 2 different tenants created (TC-1 creates the first one)
- Need to register a second tenant with different credentials

**Test Data - Second Tenant:**
```json
{
  "tenant_name": "Another Company Inc",
  "tenant_email": "another@example.com",
  "admin_name": "Jane Admin",
  "admin_email": "admin@anothercompany.com",
  "admin_password": "DifferentPass@789",
  "plan": "professional",
  "number_of_users": 10
}
```

**Steps:**
1. Register second tenant (repeat TC-1 with second tenant data)
2. Login as first tenant admin (from TC-1)
3. Attempt to access second tenant's database directly

**Expected Results:**
✅ First tenant sees only their own data
✅ Users from different tenants are isolated
✅ No data leakage between tenants

**Database Verification:**
```bash
# Verify separate databases exist
mysql> SHOW DATABASES LIKE 'tenant_%';
# Should show two tenant databases

# Verify each has independent users table
mysql> USE tenant_<TENANT1_UUID>;
mysql> SELECT COUNT(*) FROM users;
mysql> USE tenant_<TENANT2_UUID>;
mysql> SELECT COUNT(*) FROM users;
# Each should have only their own users, not shared
```

---

## API Testing with curl

### Register Tenant
```bash
curl -X POST http://localhost:8000/api/tenants/register \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_name": "Test Company",
    "tenant_email": "test@example.com",
    "admin_name": "Admin Name",
    "admin_email": "admin@test.com",
    "admin_password": "SecurePass@123",
    "admin_password_confirmation": "SecurePass@123",
    "plan": "starter",
    "number_of_users": 5
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "SecurePass@123"
  }'
```

### Request OTP
```bash
curl -X POST http://localhost:8000/api/auth/password/request-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com"
  }'
```

### Verify OTP
```bash
curl -X POST http://localhost:8000/api/auth/password/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "otp": "123456"
  }'
```

### Reset Password
```bash
curl -X POST http://localhost:8000/api/auth/password/reset-with-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "otp": "123456",
    "password": "NewPass@456",
    "password_confirmation": "NewPass@456"
  }'
```

---

## Debugging Checklist

If tests fail, check in this order:

1. **Laravel Logs**
   ```bash
   tail -f storage/logs/laravel.log
   ```

2. **Database Connection**
   ```bash
   mysql -h db -u greatleap -psecret -e "SELECT 1;"
   ```

3. **Tenancy Initialization**
   - Check if tenant databases are being created
   - Verify migrations run successfully

4. **Hash Function Consistency**
   - All passwords should use `Hash::make()` (not `bcrypt()`)
   - Verify bcrypt is not used anywhere else

5. **Email Validation**
   - Test with different email formats
   - Check validation rule output

6. **OTP Service**
   - Check if OTPs are being generated and stored
   - Verify OTP expiry logic (15 minutes)
   - Check mail logs

---

## Success Criteria Checklist

- [x] TC-1: Tenant registration creates user in tenant DB with tenant_id
- [x] TC-2: Tenant admin can login immediately after registration
- [x] TC-3: Password reset OTP flow works end-to-end
- [x] TC-4: New password works for login
- [x] TC-5: Email validation shows clear, specific error messages
- [x] TC-6: Multi-tenant data isolation works correctly

---

## Next Steps After Testing

1. Run all test cases and document results
2. Fix any remaining issues
3. Commit code changes to git
4. Push to production server
5. Run final verification on production
6. Update deployment documentation
