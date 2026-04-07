# Quick Start - Authentication Testing

## 🚀 Start Here

This document provides the fastest path to test the rebuilt authentication system.

---

## Step 1: Build Assets (5 minutes)

```bash
cd /Users/user1/Desktop/great-leap-app01

# Clean previous builds
rm -rf public/build

# Install dependencies (if needed)
npm install

# Build React + Vite
npm run build

# Verify build succeeded
ls -la public/build/assets/
```

**Expected**: Should see `.css` and `.js` files in `public/build/assets/`

---

## Step 2: Start Dev Servers (5 minutes)

**Terminal 1 - Laravel Backend**:
```bash
cd /Users/user1/Desktop/great-leap-app01
php artisan serve
```
Expected: `Server running at http://127.0.0.1:8000`

**Terminal 2 - Frontend Dev Server (Optional, for frontend editing)**:
```bash
cd /Users/user1/Desktop/great-leap-app01
npm run dev
```
Expected: `Local: http://localhost:5173/`

---

## Step 3: Reset Database (2 minutes)

**Clear any existing test data**:
```bash
# Access MySQL
mysql -h db -u greatleap -psecret

# Drop and recreate central database
DROP DATABASE IF EXISTS greatleap_central;
CREATE DATABASE greatleap_central;
USE greatleap_central;

# Exit MySQL
exit
```

**Run migrations**:
```bash
php artisan migrate --force
php artisan db:seed
```

---

## Step 4: Run Core Tests (10 minutes each)

### Test 1: Register New Tenant

Open `http://localhost:8000/register` (or `http://localhost:5173` if using Vite dev server)

**Use this test data**:
```
Company Name: Test Corp Ltd
Company Email: testcorp@example.com
Admin Name: Admin User
Admin Email: admin@testcorp.com
Admin Password: SecurePass@123
Confirm Password: SecurePass@123
Plan: Starter
Number of Users: 5
```

**Expected Result**:
- ✅ Registration successful message
- ✅ Can copy auth token
- ✅ User redirected to dashboard

**Database Verification**:
```bash
# Check central DB
mysql -h db -u greatleap -psecret greatleap_central -e \
  "SELECT id, name, email, status FROM tenants WHERE email='testcorp@example.com';"

# Check tenant DB was created
mysql -h db -u greatleap -psecret -e "SHOW DATABASES LIKE 'tenant_%';"

# Check admin user in tenant DB
TENANT_ID=$(mysql -h db -u greatleap -psecret greatleap_central -N -e \
  "SELECT id FROM tenants WHERE email='testcorp@example.com';")

mysql -h db -u greatleap -psecret "tenant_${TENANT_ID}" -e \
  "SELECT id, name, email, role, tenant_id FROM users WHERE email='admin@testcorp.com';"
```

**✅ PASS if**:
- Tenant record exists in central DB
- Tenant database `tenant_<id>` created
- Admin user exists in tenant DB with `tenant_id` set

---

### Test 2: Login as Tenant Admin

Click "Login" on the page

**Use this test data**:
```
Email: admin@testcorp.com
Password: SecurePass@123
```

**Expected Result**:
- ✅ Login successful
- ✅ Dashboard displayed
- ✅ User name shown in top-right
- ✅ Can see "Logout" option

**✅ PASS if**:
- Logged in without errors
- Can access tenant dashboard
- User context shows correct name and tenant

---

### Test 3: Password Reset

Click "Forgot Password?" on login page

**Step 1: Request OTP**
```
Email: admin@testcorp.com
```

**Expected**: "OTP sent successfully" message

**Get OTP from logs**:
```bash
# In another terminal, watch Laravel logs
tail -f storage/logs/laravel.log | grep -i "otp\|mail"
```

Look for 6-digit OTP code in logs.

**Step 2: Verify OTP**
```
OTP: <6-digit code from logs>
```

**Expected**: "OTP verified successfully"

**Step 3: Reset Password**
```
New Password: NewSecurePass@456
Confirm Password: NewSecurePass@456
```

**Password must have**:
- ✅ At least 8 characters
- ✅ Upper and lower case letters
- ✅ At least one number
- ✅ At least one special symbol (!@#$%^&*)

**Expected**: "Password reset successfully" message

---

### Test 4: Login with New Password

**Use this test data**:
```
Email: admin@testcorp.com
Password: NewSecurePass@456
```

**Expected Result**:
- ✅ Login successful with new password
- ✅ Dashboard accessible

**✅ PASS if**: Login works with new password

---

## Step 5: Verify No Regressions

### Test: Super Admin Still Works

Login to `http://localhost:8000/admin` (if available)

**Use these credentials**:
```
Email: admin@greatleap.app
Password: password
Role: super_admin
```

**Expected**: Super admin dashboard accessible

---

## Step 6: Test Edge Cases (Optional)

### Invalid Email Format
**Try registering with**: `invalid-email` (missing @)
**Expected**: Clear error "The email field must be a valid email"

### Duplicate Email
**Try registering second tenant with same admin_email**
**Expected**: Clear error "This email is already in use by another account"

### Wrong Password
**Try login with correct email, wrong password**
**Expected**: Error "Credentials do not match"

### Expired OTP
**Request OTP, wait 16 minutes, try to verify**
**Expected**: Error "OTP has expired. Request a new one"

---

## Troubleshooting

### Problem: "Please enter a valid email" during registration

**Solution**:
1. Check email format is valid (has @ and domain)
2. Verify email not already used in system
3. Check Laravel logs for detailed error

```bash
tail -f storage/logs/laravel.log | grep -i "validation\|email"
```

### Problem: Login fails with "Credentials do not match"

**Solution**:
1. Verify password is exactly as registered
2. Check that user was created in tenant DB (not just central)
3. Verify tenant database exists

```bash
# Find tenant ID
mysql -h db -u greatleap -psecret greatleap_central -e \
  "SELECT id FROM tenants LIMIT 1;"

# Check if tenant database exists
mysql -h db -u greatleap -psecret -e \
  "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME LIKE 'tenant_%';"
```

### Problem: "500 Internal Server Error"

**Solution**:
1. Check Laravel logs:
   ```bash
   tail -f storage/logs/laravel.log
   ```
2. Look for specific error message
3. Verify database connections work:
   ```bash
   mysql -h db -u greatleap -psecret -e "SELECT 1;"
   ```

### Problem: Password reset OTP not received

**Solution**:
1. Check logs for OTP generation:
   ```bash
   tail -f storage/logs/laravel.log | grep -i "otp\|password"
   ```
2. Since MAIL_MAILER=log, check logs instead of email
3. Look for 6-digit code in logs

---

## Success Checklist

- [ ] Test 1: Tenant registration successful
- [ ] Test 1: Tenant database created with admin user
- [ ] Test 1: Admin user has correct tenant_id
- [ ] Test 2: Tenant login works
- [ ] Test 3: OTP requested successfully
- [ ] Test 3: OTP verified successfully
- [ ] Test 3: Password reset works
- [ ] Test 4: Login with new password works
- [ ] Test 5: Super admin still works
- [ ] Test 6: Email validation errors are clear
- [ ] Test 6: Duplicate email rejected
- [ ] Test 6: Wrong password shows error

**If all checks pass**: ✅ **Ready for production deployment**

---

## Next Steps

### If Tests Pass ✅
1. Commit changes:
   ```bash
   git add -A
   git commit -m "Fix: Authentication system rebuild with multi-tenant support"
   ```

2. Push to production:
   ```bash
   git push origin main
   ```

3. Monitor deployment:
   ```bash
   # Watch GitHub Actions
   # SSH to server and check logs:
   tail -f /var/www/new-great-leap-app/storage/logs/laravel.log
   ```

4. Test on production with fresh tenant

### If Tests Fail ❌
1. Check error in logs
2. Refer to troubleshooting section above
3. Review specific fix in `.claude/PHASE1_COMPLETION_REPORT.md`
4. Make corrections and rebuild: `npm run build`

---

## Quick Commands Reference

```bash
# Reset database
php artisan migrate:reset && php artisan migrate

# Watch logs in real-time
tail -f storage/logs/laravel.log

# Check database connection
mysql -h db -u greatleap -psecret -e "SELECT 1;"

# List all tenants
mysql -h db -u greatleap -psecret greatleap_central -e \
  "SELECT id, name, email, status FROM tenants;"

# List all tenant databases
mysql -h db -u greatleap -psecret -e \
  "SHOW DATABASES LIKE 'tenant_%';"

# Rebuild assets
npm run build

# Clear all caches
php artisan cache:clear && php artisan config:cache && php artisan route:cache
```

---

**Estimated Total Time**: 30-45 minutes for full test cycle

Good luck! 🎉
