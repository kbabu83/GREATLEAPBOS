# Critical Rule Violations Found

**Date:** April 6, 2026
**Status:** 🚨 BLOCKING - Must fix before production deployment

---

## VIOLATION #1: fn() Closures in Config Files

### ❌ Found in: `config/razorpay.php`

```php
'key_id' => fn() => SettingsService::get('razorpay.key_id') ?? env('RAZORPAY_KEY_ID'),
'key_secret' => fn() => SettingsService::get('razorpay.key_secret') ?? env('RAZORPAY_KEY_SECRET'),
'webhook_secret' => fn() => SettingsService::get('razorpay.webhook_secret') ?? env('RAZORPAY_WEBHOOK_SECRET'),
'currency' => fn() => SettingsService::get('razorpay.currency', 'INR') ?? env('RAZORPAY_CURRENCY', 'INR'),
'test_mode' => fn() => SettingsService::get('razorpay.test_mode', true) ?? env('RAZORPAY_TEST_MODE', true),
```

### ❌ Found in: `config/mail.php`

```php
'driver' => fn() => SettingsService::get('email.mailer') ?? env('MAIL_MAILER', 'log'),
'address' => fn() => SettingsService::get('email.from_address') ?? env('MAIL_FROM_ADDRESS', 'hello@example.com'),
'name' => fn() => SettingsService::get('email.from_name') ?? env('MAIL_FROM_NAME', 'Example'),
'key' => fn() => SettingsService::get('email.aws_key') ?? env('AWS_ACCESS_KEY_ID'),
'secret' => fn() => SettingsService::get('email.aws_secret') ?? env('AWS_SECRET_ACCESS_KEY'),
'region' => fn() => SettingsService::get('email.aws_region', 'ap-south-1') ?? env('AWS_DEFAULT_REGION', 'us-east-1'),
```

### 🚨 Why This Breaks Production

```bash
# On production, this command runs during deployment:
php artisan config:cache

# This tries to:
# 1. Load all config files
# 2. Compile them to cached PHP file
# 3. But fn() cannot be serialized!

# Result:
# Fatal error: Uncaught Exception: fn() closures cannot be serialized
# Application breaks completely!
```

### ✅ The Fix

**config/razorpay.php - Replace with:**
```php
return [
    'key_id' => env('RAZORPAY_KEY_ID'),
    'key_secret' => env('RAZORPAY_KEY_SECRET'),
    'webhook_secret' => env('RAZORPAY_WEBHOOK_SECRET'),
    'currency' => env('RAZORPAY_CURRENCY', 'INR'),
    'test_mode' => env('RAZORPAY_TEST_MODE', true),
];
```

**config/mail.php - Replace with:**
```php
return [
    'mailer' => env('MAIL_MAILER', 'log'),
    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
        'name' => env('MAIL_FROM_NAME', 'Example'),
    ],
    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],
];
```

---

## VIOLATION #2: @viteReactRefresh in Blade File

### ❌ Found in: `resources/views/app.blade.php`

```blade
@viteReactRefresh
@vite('resources/js/app.jsx')
```

### 🚨 Why This Breaks Production

```
Local (Dev):
- Vite dev server runs at http://localhost:5173
- @viteReactRefresh connects to it
- Hot reload works ✅

Production:
- No Vite dev server (only built assets)
- @viteReactRefresh tries to load from http://localhost:5173
- Result: 404 error, HMR fails, app may not load ❌
```

### ✅ The Fix

**resources/views/app.blade.php - Remove @viteReactRefresh:**
```blade
<!-- ❌ DELETE THIS LINE -->
<!-- @viteReactRefresh -->

<!-- ✅ KEEP THIS LINE ONLY -->
@vite('resources/js/app.jsx')
```

---

## VIOLATION #3: Missing Route Names (Central Routes)

### ⚠️ Found in: `routes/api.php` line 69

```php
Route::apiResource('/tenants', TenantController::class);
// Creates: tenants.index, tenants.store, tenants.show, tenants.update, tenants.destroy
```

### ⚠️ Potential Conflict

**Central routes** use names like `tenants.*`
**Tenant routes** use names like `tenant.*`

Current status: ✅ No actual conflict (different prefixes), but be careful

**However, check for duplicates:**
```bash
php artisan route:list | grep -E "\.index|\.store|\.show" | sort
# Should not have duplicate names
```

---

## Cross-Check with Architecture Documents

### Database Configuration ✅
- Local: `greatleap_central`
- Server: `greatleap_app`
- Status: **ALIGNED** (user confirmed both are mirrors)

### Multi-Tenancy Login 🆕 FIXED ✅
- Before: Tenant users couldn't log in
- After: Multi-step login with tenancy initialization
- Both methods fixed: `store()` and `register()`

### Tenant Database Creation 🆕 FIXED ✅
- Before: Never created or migrated
- After: Auto-creates with migrations
- Both methods fixed: `store()` and `register()`

### Migration Organization 🆕 FIXED ✅
- Before: In wrong location (central)
- After: Moved to tenant folder with correct order

### Critical Rules Status:
- Rule #1 (No fn() in config): ❌ **VIOLATED** - 12 violations found
- Rule #2 (Use ->names()): ✅ Mostly followed
- Rule #3 (No @viteReactRefresh): ❌ **VIOLATED** - Found in app.blade.php

---

## ACTION PLAN

### Immediate Fixes (Before Production)

**1. Fix config/razorpay.php**
- Remove all fn() closures
- Use env() directly

**2. Fix config/mail.php**
- Remove all fn() closures
- Use env() directly

**3. Fix resources/views/app.blade.php**
- Remove @viteReactRefresh line
- Keep only @vite()

### Testing After Fixes

```bash
# 1. Local testing
make fresh
curl http://localhost:8000

# 2. Config caching test
php artisan config:cache
php artisan config:clear  # Should work without errors

# 3. Deployment test
git push origin main
# Wait for GitHub Actions to deploy

# 4. Server verification
ssh ubuntu@168.144.67.229
php artisan config:cache  # Should NOT error
tail -20 storage/logs/laravel.log  # Should show no errors
```

---

## Server-Specific Concerns

### Database Name Alignment
✅ **VERIFIED:** Local and server now use same database structure

### MySQL Permissions
⚠️ **STILL PENDING:** Run on server:
```sql
GRANT ALL PRIVILEGES ON `tenant_%`.* TO 'greatleap_user'@'localhost';
FLUSH PRIVILEGES;
```

### PHP Version
✅ **VERIFIED:** Server runs PHP 8.3-fpm (not 8.2)

### Nginx Configuration
✅ **VERIFIED:** Correctly points to /var/www/new-great-leap-app/public

### Email Configuration
⚠️ **CHECK:** Server .env must have SES config for production emails

---

## Summary of Findings

| Issue | Severity | Status | Action |
|-------|----------|--------|--------|
| fn() in razorpay.php | 🔴 CRITICAL | Unfixed | Fix immediately |
| fn() in mail.php | 🔴 CRITICAL | Unfixed | Fix immediately |
| @viteReactRefresh in app.blade.php | 🔴 CRITICAL | Unfixed | Fix immediately |
| Multi-tenant login | 🟡 HIGH | ✅ Fixed | Deployed |
| Tenant DB creation | 🟡 HIGH | ✅ Fixed | Deployed |
| Migration organization | 🟡 HIGH | ✅ Fixed | Deployed |
| MySQL permissions | 🟡 HIGH | Pending | Run SQL on server |
| Database alignment | 🟢 MEDIUM | ✅ Verified | No action |

---

## Deployment Readiness

**Current Status:** ❌ NOT READY FOR PRODUCTION

**Blockers:**
- [ ] Fix config/razorpay.php (fn() closures)
- [ ] Fix config/mail.php (fn() closures)
- [ ] Fix resources/views/app.blade.php (@viteReactRefresh)
- [ ] Test php artisan config:cache
- [ ] Deploy and verify on server

**Already Done:**
- ✅ Multi-tenant login fixed
- ✅ Tenant database creation fixed
- ✅ Migrations reorganized
- ✅ Documentation updated

