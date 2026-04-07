# Production Server Verification Checklist

**Server IP:** 168.144.67.229
**App Path:** /var/www/new-great-leap-app
**OS:** Ubuntu 24.04 LTS
**PHP Version:** 8.3-fpm (CRITICAL - not 8.2)

---

## 1. DATABASE VERIFICATION

### Check MySQL Databases
```bash
ssh ubuntu@168.144.67.229
mysql -u greatleap_user -p (password: GreatLeap@2026)

# Command in MySQL:
SHOW DATABASES;
```

**Expected Output:**
```
Information_schema
mysql
performance_schema
sys
greatleap_app              ← Central database (verify exact name!)
tenant_*                   ← Tenant databases (created on demand)
```

### Current Database Status
- [ ] Check if `greatleap_app` exists
- [ ] Check if `greatleap_central` exists (if using different name locally)
- [ ] Verify `greatleap_user` can access the database
- [ ] Check MySQL version: `SELECT VERSION();`

---

## 2. APPLICATION CONFIGURATION

### Check .env File
```bash
ssh ubuntu@168.144.67.229
cat /var/www/new-great-leap-app/.env
```

**Critical fields to verify:**
```
APP_ENV=production                    ← Should be "production"
APP_DEBUG=false                       ← Should be "false" (not "true")
APP_KEY=base64:...                    ← Should be set (if blank, app won't work)

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=greatleap_app             ← Must match actual MySQL database name
DB_USERNAME=greatleap_user
DB_PASSWORD=GreatLeap@2026

CENTRAL_DOMAIN=?                      ← Should be set to actual domain (not localhost)

MAIL_MAILER=ses                       ← Should be 'ses' (not 'log')
MAIL_SES_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...                 ← Should be configured
AWS_SECRET_ACCESS_KEY=...             ← Should be configured

RAZORPAY_KEY_ID=...                   ← Should be configured
RAZORPAY_KEY_SECRET=...               ← Should be configured
RAZORPAY_TEST_MODE=true or false      ← Verify correct mode
```

### Verification Checklist
- [ ] APP_ENV is "production"
- [ ] APP_DEBUG is "false"
- [ ] APP_KEY is set and not blank
- [ ] DB_DATABASE matches actual MySQL database
- [ ] DB_USERNAME and DB_PASSWORD are correct
- [ ] CENTRAL_DOMAIN is set (not localhost or 127.0.0.1)
- [ ] Email configuration (SES or alternative) is set up
- [ ] Razorpay keys are configured

---

## 3. MIGRATION STATUS

### Check if Migrations Have Run
```bash
ssh ubuntu@168.144.67.229
cd /var/www/new-great-leap-app
php artisan migrate:status
```

**Expected Output:**
All migrations should show "Ran" status:
```
Migration Name                                              Batch  Status
2024_01_01_000001_create_tenants_table                    1      Ran
2024_01_01_000002_create_domains_table                    1      Ran
2024_01_01_000003_create_central_users_table              1      Ran
2024_01_02_000001_create_organisation_settings_table      1      Ran
... (more migrations)
```

### Key Tables to Verify
```bash
# Check if these tables exist in central database:
mysql -u greatleap_user -p greatleap_app -e "SHOW TABLES;"
```

**Must include:**
- tenants
- users (central users)
- domains
- personal_access_tokens
- migrations
- subscription_plans
- password_reset_otps

### Verification Checklist
- [ ] All migrations show "Ran" status
- [ ] No migration errors in recent deployments
- [ ] Central database tables exist: tenants, users, domains
- [ ] Check `migrations` table: `SELECT * FROM migrations;`

---

## 4. PHP & WEB SERVER

### Check PHP-FPM
```bash
ssh ubuntu@168.144.67.229
systemctl status php8.3-fpm
```

**Expected:** Status should be "active (running)"

```bash
# Check PHP version
php -v
# Should show: PHP 8.3.x
```

### Verify Correct PHP Socket
```bash
# Check if socket exists:
ls -la /var/run/php/php8.3-fpm.sock

# Should show something like:
# srw-rw---- 1 www-data www-data 0 Apr 6 10:00 /var/run/php/php8.3-fpm.sock
```

### Check Nginx
```bash
systemctl status nginx
```

**Expected:** Status should be "active (running)"

### Verify Nginx Config
```bash
# Check default config:
cat /etc/nginx/sites-available/default

# Should include:
# - fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
# - root /var/www/new-great-leap-app/public;
```

### Verification Checklist
- [ ] PHP 8.3-fpm is running
- [ ] Nginx is running
- [ ] PHP socket exists: /var/run/php/php8.3-fpm.sock
- [ ] Nginx configured to use php8.3-fpm (not php8.2-fpm)
- [ ] Web root points to /var/www/new-great-leap-app/public

---

## 5. APPLICATION HEALTH

### Check Laravel Cache
```bash
ssh ubuntu@168.144.67.229
cd /var/www/new-great-leap-app
php artisan optimize:clear
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Check Application Logs
```bash
tail -f /var/www/new-great-leap-app/storage/logs/laravel.log
```

**Look for:**
- ✅ No "ERROR" entries
- ✅ No "CRITICAL" entries
- ✅ Recent timestamp showing app is running

### Check Artisan Tinker (Optional)
```bash
cd /var/www/new-great-leap-app
php artisan tinker

# In tinker shell:
>>> \App\Models\Tenant::count()
# Should return a number (number of tenants)

>>> \App\Models\User::count()
# Should return central users count
```

### Verification Checklist
- [ ] No errors in Laravel logs
- [ ] Cache cleared and rebuilt successfully
- [ ] Can connect to database via artisan
- [ ] Application loads without errors

---

## 6. DEPLOYMENT WORKFLOW

### Check Git History
```bash
cd /var/www/new-great-leap-app
git log --oneline -10
```

**Should show recent commits, e.g.:**
```
bfdbc7f Fix Tenants.jsx openEdit to not set removed slug field
5297ff2 Fix TenantRegister form field names to match backend expectations
944e918 Tenant sub domain removal
17c8109 Fix: Update deploy workflow to restart php8.3-fpm instead of php8.2-fpm
```

### Check GitHub Actions Deployment
```bash
# Go to GitHub repository:
# https://github.com/kbabu83/GREATLEAPBOS

# Check Actions tab:
# - Look for recent workflow runs
# - Check if latest deployment succeeded
# - Review any failed deployments
```

### Check Deploy Log
```bash
# The deploy workflow logs should show:
# ✅ git pull completed
# ✅ composer install completed
# ✅ php artisan migrate completed
# ✅ npm build completed
# ✅ php8.3-fpm restarted
# ✅ nginx restarted
```

### Verification Checklist
- [ ] Latest commits are deployed to server
- [ ] GitHub Actions workflow ran successfully
- [ ] No failed deployments in recent history
- [ ] All deployment steps completed without errors

---

## 7. FRONTEND BUILD VERIFICATION

### Check Vite Build Output
```bash
ls -la /var/www/new-great-leap-app/public/build/
```

**Should contain:**
```
app-HASH.js
app-HASH.css
manifest.json
```

### Check if React Components Loaded
```bash
# In browser, visit the application and check:
# 1. Open Developer Console (F12)
# 2. Check for JavaScript errors
# 3. Verify assets are loaded from /public/build/
# 4. Check if React components render
```

### Verification Checklist
- [ ] Vite build directory exists and has files
- [ ] manifest.json is present
- [ ] No JavaScript errors in browser console
- [ ] React components render without errors
- [ ] Assets load from correct path

---

## 8. MULTI-TENANCY VERIFICATION

### Test Tenant Creation
```bash
# Use curl or API client to test:
curl -X POST http://168.144.67.229/api/tenants/register \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_name": "Test Company",
    "tenant_email": "test@company.com",
    "admin_name": "John Doe",
    "admin_email": "john@company.com",
    "admin_password": "password123",
    "admin_password_confirmation": "password123",
    "plan": "free",
    "number_of_users": 5
  }'
```

**Expected Response:**
```json
{
  "message": "Company registered successfully.",
  "user": {
    "id": "...",
    "email": "john@company.com",
    "role": "tenant_admin"
  },
  "token": "...",
  "tenant_id": "...",
  "plan": "free"
}
```

### Verify Tenant Database Created
```bash
mysql -u greatleap_user -p
SHOW DATABASES;
# Should see: tenant_<uuid>
```

### Verification Checklist
- [ ] Can create a new tenant via API
- [ ] Tenant database is created automatically
- [ ] Admin user can log in with provided credentials
- [ ] Tenant has access to their own database

---

## 9. CRITICAL DEPLOYMENT FIXES VERIFICATION

### Verify PHP 8.3-FPM Fix
```bash
# The deploy.yml should have been fixed to use php8.3-fpm
grep "php8.3-fpm" /var/www/new-great-leap-app/.github/workflows/deploy.yml

# Should show:
# sudo systemctl restart php8.3-fpm
# sudo systemctl restart nginx
```

### Verify Tenant Form Changes
```bash
# Visit: http://168.144.67.229/auth/register
# Check:
# - [ ] Step 1: Organization name & email (NO subdomain field)
# - [ ] Step 2: Admin name, email, password confirmation
# - [ ] Step 3: Plan selection with "Number of Users" field
# - [ ] Step 4: Payment (if paid plan selected)
# - [ ] Step 5: Success confirmation
```

### Verify Tenants Admin Panel
```bash
# As super_admin, visit: http://168.144.67.229/app/tenants
# Check:
# - [ ] Create Tenant button opens form
# - [ ] Form has fields for company, admin, plan (NO subdomain)
# - [ ] Can edit existing tenant
# - [ ] Can reset admin password
# - [ ] Can toggle tenant status (active/inactive)
```

### Verification Checklist
- [ ] deploy.yml uses php8.3-fpm (not php8.2-fpm)
- [ ] Tenant registration form shows correct fields
- [ ] Admin panel allows password reset
- [ ] Admin panel allows status toggle
- [ ] No subdomain fields visible anywhere

---

## 10. FINAL CHECKLIST

### Database
- [ ] Correct database exists (verify name)
- [ ] Migrations have run
- [ ] Central tables present
- [ ] Can create test tenant and database

### Application
- [ ] .env is properly configured
- [ ] APP_ENV=production
- [ ] APP_DEBUG=false
- [ ] All required variables set

### Infrastructure
- [ ] PHP 8.3-fpm running
- [ ] Nginx running
- [ ] Correct PHP socket configured
- [ ] No error logs

### Frontend
- [ ] Vite build completed
- [ ] Assets loading correctly
- [ ] No JavaScript errors

### Deployment
- [ ] Latest commits deployed
- [ ] GitHub Actions succeeded
- [ ] All workflow steps completed

### Features
- [ ] Tenant registration works
- [ ] Admin panel functions
- [ ] Password reset works
- [ ] Status toggle works

---

## If Issues Found

### Database Name Mismatch
```bash
# If database is "greatleap_app" but .env says "greatleap_central":

# Option 1: Update .env
sed -i 's/DB_DATABASE=.*/DB_DATABASE=greatleap_app/' /var/www/new-great-leap-app/.env

# Option 2: Or create correct database
mysql -e "CREATE DATABASE greatleap_central;"
mysql -e "GRANT ALL PRIVILEGES ON greatleap_central.* TO 'greatleap_user'@'localhost';"

# Then run migrations
php artisan migrate --force
```

### PHP Version Mismatch
```bash
# Verify PHP 8.3 is installed:
php -v
php8.3 -v

# Check if 8.2 is still running:
systemctl status php8.2-fpm
# If running, disable it:
systemctl disable php8.2-fpm
systemctl stop php8.2-fpm
```

### Nginx Configuration Issue
```bash
# Test nginx config:
nginx -t

# If error, check:
cat /etc/nginx/sites-available/default

# Ensure it has:
# fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
# root /var/www/new-great-leap-app/public;
```

### GitHub Actions Deployment Failure
```bash
# Check Actions tab on GitHub for error logs
# Common issues:
# 1. Migration failure → DB doesn't exist
# 2. PHP version → php8.2 instead of 8.3
# 3. npm build failure → check node version
# 4. Permission denied → check file ownership
```

---

## Next Steps

1. **Immediate:** SSH into server and run verification checks 1-3
2. **Critical:** Verify database name and .env configuration
3. **Validation:** Test migrations and application health
4. **Feature Test:** Verify tenant creation and admin features
5. **Final:** Confirm all recent fixes are deployed and working

