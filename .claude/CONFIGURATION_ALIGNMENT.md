# Configuration Alignment Analysis

This document identifies the exact configuration mismatch between local development and production server.

---

## DATABASE CONFIGURATION MISMATCH

### Local .env (Docker)
```
DB_HOST=db
DB_PORT=3306
DB_DATABASE=greatleap_central
DB_USERNAME=greatleap
DB_PASSWORD=secret
```

### Server .env (Expected from credentials)
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=greatleap_app          ⚠️ DIFFERENT FROM LOCAL
DB_USERNAME=greatleap_user          ⚠️ DIFFERENT FROM LOCAL
DB_PASSWORD=GreatLeap@2026          ⚠️ DIFFERENT FROM LOCAL
```

### The Problem

When the server was set up, it may have been initialized with database name **`greatleap_app`**, but:

1. **Local uses:** `greatleap_central` (by convention, to indicate it's the central multi-tenancy database)
2. **Server uses:** `greatleap_app` (possibly auto-created by initial setup)

Both are valid names, but they must be **consistent** between what's in `.env` and what actually exists in MySQL.

---

## ROOT CAUSE ANALYSIS

### Scenario 1: Server Database is Named `greatleap_app`
```
✅ Database exists: greatleap_app
❌ Server .env file says: greatleap_central (MISMATCH)
Result: "Unknown database 'greatleap_central'" error
Fix: Change server .env to DB_DATABASE=greatleap_app
```

### Scenario 2: Server Database is Named `greatleap_central`
```
✅ Database exists: greatleap_central
✅ Server .env says: greatleap_central (MATCH)
Result: Application works correctly
Fix: None needed, but update local to match (optional)
```

### Scenario 3: Server Database Never Created
```
❌ Database doesn't exist in MySQL
Result: `php artisan migrate` will fail during deployment
Fix: Create database first:
     mysql> CREATE DATABASE greatleap_app;
     Then run: php artisan migrate --force
```

---

## DEPLOYMENT FLOW ISSUE

The deployment workflow does this:
```bash
1. git pull origin main        ✅ Works
2. composer install            ✅ Works
3. php artisan migrate --force ❌ FAILS if DB doesn't exist or name is wrong
4. Subsequent steps never run
```

If step 3 fails, the app is left in a broken state.

---

## HOW TO IDENTIFY THE ISSUE

### Step 1: SSH into Server
```bash
ssh ubuntu@168.144.67.229
```

### Step 2: Check Actual MySQL Database
```bash
mysql -u greatleap_user -p
# Password: GreatLeap@2026

# Inside MySQL:
SHOW DATABASES;
```

**Look for:**
- Is there a database called `greatleap_app`?
- Is there a database called `greatleap_central`?
- Is there any database starting with `greatleap_`?

### Step 3: Check Server .env
```bash
grep "DB_DATABASE" /var/www/new-great-leap-app/.env
```

**Compare:**
- What does .env say? (`greatleap_central` or `greatleap_app`?)
- Does it match what's actually in MySQL?

### Step 4: Check Migration Status
```bash
cd /var/www/new-great-leap-app
php artisan migrate:status
```

**Expected output:**
- All migrations show "Ran" status
- No errors or exceptions

**If error:** "Unknown database" → database name mismatch

---

## CONFIGURATION ALIGNMENT MATRIX

| Component | Local | Server (Expected) | Server (Actual?) | Match | Priority |
|-----------|-------|-------------------|------------------|-------|----------|
| DB Host | db (Docker) | 127.0.0.1 | 127.0.0.1 | ✅ | HIGH |
| DB Port | 3306 | 3306 | ? | Should be ✅ | HIGH |
| **DB Name** | greatleap_central | **greatleap_app** | **?** | ❌ VERIFY | **CRITICAL** |
| **DB User** | greatleap | **greatleap_user** | **?** | ❌ VERIFY | **CRITICAL** |
| **DB Pass** | secret | **GreatLeap@2026** | **?** | ❌ VERIFY | **CRITICAL** |
| Tenancy Prefix | tenant_ | tenant_ | ? | Should be ✅ | MEDIUM |
| APP_ENV | local | production | ? | Should be ✅ | HIGH |
| APP_DEBUG | true | false | ? | Should be ✅ | HIGH |
| CENTRAL_DOMAIN | localhost | actual domain | ? | Should be ✅ | MEDIUM |

---

## QUICK DIAGNOSIS SCRIPT

Run this command to diagnose the issue:

```bash
#!/bin/bash

echo "=== GREAT LEAP APP CONFIGURATION DIAGNOSIS ==="
echo ""

# Check if in the right directory
if [ ! -f "/var/www/new-great-leap-app/.env" ]; then
    echo "❌ ERROR: .env file not found at /var/www/new-great-leap-app/.env"
    exit 1
fi

# Extract .env values
DB_HOST=$(grep "^DB_HOST=" /var/www/new-great-leap-app/.env | cut -d= -f2)
DB_USER=$(grep "^DB_USERNAME=" /var/www/new-great-leap-app/.env | cut -d= -f2)
DB_PASS=$(grep "^DB_PASSWORD=" /var/www/new-great-leap-app/.env | cut -d= -f2)
DB_NAME=$(grep "^DB_DATABASE=" /var/www/new-great-leap-app/.env | cut -d= -f2)

echo ".env Configuration:"
echo "  DB_HOST: $DB_HOST"
echo "  DB_DATABASE: $DB_NAME"
echo "  DB_USERNAME: $DB_USER"
echo "  DB_PASSWORD: (hidden, length: ${#DB_PASS})"
echo ""

# Check MySQL
echo "Checking MySQL..."
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS -e "SHOW DATABASES;" 2>/dev/null | grep -E "greatleap|tenant_" || echo "❌ Cannot connect to MySQL or no databases found"

echo ""
echo "Migration Status:"
cd /var/www/new-great-leap-app
php artisan migrate:status 2>&1 | head -20

echo ""
echo "If .env DB_DATABASE doesn't match actual MySQL database → THIS IS THE ISSUE"
echo ""
```

Save as `/tmp/diagnose.sh` and run:
```bash
bash /tmp/diagnose.sh
```

---

## COMMON DEPLOYMENT ERRORS

### Error: "Unknown database 'greatleap_central'"
```
Root Cause: Server .env says "greatleap_central" but MySQL has "greatleap_app"
Solution:
  1. Check: grep DB_DATABASE /var/www/new-great-leap-app/.env
  2. Check: mysql -e "SHOW DATABASES;" | grep greatleap
  3. Align them by updating .env or creating correct database
```

### Error: "Connection refused"
```
Root Cause: MySQL service not running or wrong host/port
Solution:
  systemctl status mysql
  systemctl status mariadb
  # If not running, start it:
  systemctl start mysql
```

### Error: "Access denied for user"
```
Root Cause: Wrong username or password in .env
Solution:
  1. Verify credentials: grep DB_USER /var/www/new-great-leap-app/.env
  2. Test: mysql -u greatleap_user -p -h 127.0.0.1
  3. If password wrong, reset it:
     mysql -u root -p
     ALTER USER 'greatleap_user'@'localhost' IDENTIFIED BY 'GreatLeap@2026';
```

### Error: "Base table or view doesn't exist"
```
Root Cause: Migrations didn't run
Solution:
  php artisan migrate:status
  php artisan migrate --force
```

---

## VERIFICATION COMMANDS

Run these commands on the server to diagnose:

```bash
# 1. Check .env configuration
cat /var/www/new-great-leap-app/.env | grep "DB_"

# 2. Verify MySQL credentials work
mysql -u greatleap_user -p -h 127.0.0.1 -e "SELECT 1;"

# 3. List all databases
mysql -u greatleap_user -p -h 127.0.0.1 -e "SHOW DATABASES;"

# 4. Check tables in the database
# Replace 'greatleap_app' with actual database name
mysql -u greatleap_user -p -h 127.0.0.1 -e "USE greatleap_app; SHOW TABLES;"

# 5. Check migration status
cd /var/www/new-great-leap-app
php artisan migrate:status

# 6. Check latest deployments
git -C /var/www/new-great-leap-app log --oneline -5

# 7. Check Laravel logs
tail -50 /var/www/new-great-leap-app/storage/logs/laravel.log

# 8. Check for errors
grep -i "error\|exception" /var/www/new-great-leap-app/storage/logs/laravel.log | tail -10
```

---

## ALIGNMENT DECISION TREE

```
Start: Application not working on server

    ↓
Check: Does .env exist?
    ├─ NO: Deploy failed, check GitHub Actions logs
    └─ YES: Continue

    ↓
Check: Can connect to MySQL?
    mysql -u $(grep DB_USERNAME .env | cut -d= -f2) \
          -p$(grep DB_PASSWORD .env | cut -d= -f2) \
          -h $(grep DB_HOST .env | cut -d= -f2)

    ├─ NO (Connection refused): MySQL not running
    │   └─ Solution: systemctl start mysql
    │
    ├─ NO (Access denied): Wrong credentials
    │   └─ Solution: Reset MySQL password or update .env
    │
    └─ YES: Continue

    ↓
Check: Does database in .env exist in MySQL?
    mysql -e "SHOW DATABASES;" | grep $(grep DB_DATABASE .env | cut -d= -f2)

    ├─ NO: Database doesn't exist
    │   └─ Solution: Create it:
    │       mysql -e "CREATE DATABASE $(grep DB_DATABASE .env | cut -d= -f2);"
    │       Then: php artisan migrate --force
    │
    └─ YES: Continue

    ↓
Check: Have migrations run?
    php artisan migrate:status | grep -c "Ran"

    ├─ 0 (No migrations run):
    │   └─ Solution: php artisan migrate --force
    │
    └─ > 0: Continue

    ↓
Check: Are there any errors in logs?
    grep -i "error\|exception" storage/logs/laravel.log

    ├─ YES: Review errors and fix
    └─ NO: Application should be working!
```

---

## WHAT LIKELY HAPPENED

### Scenario Most Likely

1. **Initial Server Setup:**
   - Someone ran deployment script
   - MySQL was installed and initialized with database name `greatleap_app`
   - Server .env was created with DB_DATABASE=greatleap_app

2. **Local Development:**
   - You set up Docker with database name `greatleap_central`
   - This is a reasonable name for the "central" database in multi-tenancy
   - Works fine locally

3. **Recent Deployments:**
   - You've been making changes locally (fixing tenant forms, etc.)
   - Changes pushed to GitHub
   - Deployment ran, but...

4. **The Disconnect:**
   - If server .env was left with `DB_DATABASE=greatleap_app` (correct) → Everything works
   - If server .env was accidentally changed to `greatleap_central` → Everything fails
   - If server .env matches actual DB → App works
   - If server .env doesn't match actual DB → App breaks

---

## RECOMMENDATION

### For Immediate Fix:

1. **SSH into server and verify:**
   ```bash
   ssh ubuntu@168.144.67.229

   # Check what database actually exists
   mysql -u root -p -e "SHOW DATABASES;" | grep greatleap

   # Check what .env says
   grep DB_DATABASE /var/www/new-great-leap-app/.env
   ```

2. **Align them:**
   - If database is `greatleap_app`, ensure .env says `DB_DATABASE=greatleap_app`
   - If database is `greatleap_central`, ensure .env says `DB_DATABASE=greatleap_central`

3. **Run migrations:**
   ```bash
   cd /var/www/new-great-leap-app
   php artisan migrate --force
   php artisan cache:clear
   ```

4. **Restart services:**
   ```bash
   systemctl restart php8.3-fpm
   systemctl restart nginx
   ```

### For Long-Term Consistency:

**Use `greatleap_app` everywhere** (server already uses this):
1. Update local `docker-compose.yml` to use `greatleap_app` instead of `greatleap_central`
2. Update local `.env` to use `greatleap_app`
3. Local and server will then be perfectly aligned

OR

**Use `greatleap_central` everywhere** (more semantically correct):
1. Rename server database or create new one
2. Update server `.env` to use `greatleap_central`
3. Both will then be aligned

---

## VERIFICATION AFTER FIX

After aligning configuration, verify:

```bash
# 1. Migrations ran successfully
php artisan migrate:status

# 2. Can access database
php artisan tinker
>>> \App\Models\Tenant::count()
# Should return 0 or more, not an error

# 3. Can create a test user
>>> User::create(['name' => 'Test', 'email' => 'test@test.com', 'password' => bcrypt('test')])

# 4. Check logs are clean
tail -10 storage/logs/laravel.log
# Should show INFO or DEBUG, not ERROR

# 5. API endpoints respond
curl http://168.144.67.229/api/tenants
# Should return JSON, not error
```

