# Architecture Comparison: Local vs Production Server

## Overview
This document compares the Local development setup with the Production server setup to identify configuration misalignments.

---

## 1. DATABASE ARCHITECTURE

### Local Setup (Docker)
```
DB_CONNECTION=mysql
DB_HOST=db                          # Docker container name
DB_PORT=3306
DB_DATABASE=greatleap_central       # Central database
DB_USERNAME=greatleap
DB_PASSWORD=secret
TENANCY_DB_PREFIX=tenant_           # Tenant DB naming: tenant_<uuid>
```

**Docker Container:** `greatleap_db`
- Image: `mysql:8.0`
- Root Password: `secret`

### Production Server
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1                   # Localhost (direct connection)
DB_PORT=3306
DB_DATABASE=greatleap_app           # ⚠️ CRITICAL: Different name!
DB_USERNAME=greatleap_user          # ⚠️ Different username
DB_PASSWORD=GreatLeap@2026          # ⚠️ Different password
TENANCY_DB_PREFIX=tenant_           # Tenant DB naming: tenant_<uuid>
```

**Server Details:**
- IP: 168.144.67.229
- OS: Ubuntu 24.04 LTS
- MySQL: System-wide installation (not containerized)

### ⚠️ CRITICAL MISMATCH IDENTIFIED

| Parameter | Local | Server | Match |
|-----------|-------|--------|-------|
| Database Name | `greatleap_central` | `greatleap_app` | ❌ NO |
| Username | `greatleap` | `greatleap_user` | ❌ NO |
| Password | `secret` | `GreatLeap@2026` | ❌ NO |
| Host | `db` (Docker) | `127.0.0.1` | ✅ Type OK (both localhost) |
| Tenancy Prefix | `tenant_` | `tenant_` | ✅ YES |

**Impact:** If server .env file uses `greatleap_central`, it must match the server's actual MySQL database created at setup. The database named `greatleap_app` suggests the server was set up with a different name or there's a configuration mismatch.

---

## 2. APPLICATION ENVIRONMENT

### Local
```
APP_ENV=local
APP_DEBUG=true
APP_KEY=base64:3tza1kxJn0pPePxSD8VH52S/DDVUO2L17w8JpzrcnlE=
APP_URL=http://localhost:8000
CENTRAL_DOMAIN=localhost
```

### Production
```
APP_ENV=production
APP_DEBUG=false                     # Should be false in production
APP_KEY=<same or different key>
APP_URL=https://greatlap.app (inferred)
CENTRAL_DOMAIN=greatlap.app (inferred)
```

### Expected Difference
✅ These differences are intentional and correct:
- Debug mode disabled on production
- Different domain
- Production-grade settings

---

## 3. EMAIL CONFIGURATION

### Local
```
MAIL_MAILER=log                     # Development: logs to file
```

### Production (Required)
```
MAIL_MAILER=ses                     # Amazon SES
MAIL_SES_REGION=ap-south-1
AWS_ACCESS_KEY_ID=<key>
AWS_SECRET_ACCESS_KEY=<secret>
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME=Great Leap App
```

**Current Status:** Server .env file should have SES configured. If using `log` driver in production, emails won't be sent.

---

## 4. FILE STRUCTURE

### Local (Docker-based)
```
/Users/user1/Desktop/great-leap-app01/
├── app/                    # Laravel application code
├── database/
│   ├── migrations/        # Central database migrations
│   └── migrations/tenant/ # Tenant database migrations
├── resources/
│   ├── js/               # React components
│   └── views/            # Laravel Blade templates
├── docker/               # Docker configuration
│   ├── app/Dockerfile
│   ├── nginx/
│   ├── php/
│   └── mysql/
├── docker-compose.yml
└── .env
```

### Production Server
```
/var/www/new-great-leap-app/      # Installation directory
├── app/                          # Laravel code
├── database/
├── resources/
├── public/                        # Web root (served by nginx)
│   ├── index.php
│   ├── css/
│   └── js/
├── storage/                       # Laravel storage (logs, cache, etc)
├── bootstrap/                     # Laravel bootstrap files
├── vendor/                        # Composer dependencies
└── .env                          # Server configuration
```

**Key Difference:** Production uses system-wide PHP 8.3, not containerized. Direct file access via Unix user.

---

## 5. WEB SERVER CONFIGURATION

### Local (Docker)
```
Nginx Container: greatleap_nginx
Port: 8000
Root: /var/www/public
Config: docker/nginx/default.conf
HMR Port: 5173 (Vite frontend dev server)
```

### Production
```
Web Server: Nginx (system-wide)
PHP-FPM: php8.3-fpm
PHP Socket: /var/run/php/php8.3-fpm.sock
Port: 80/443 (HTTP/HTTPS)
Root: /var/www/new-great-leap-app/public
Config: /etc/nginx/sites-available/default
Vite Build: Pre-built JavaScript (no HMR)
```

**Note:** Production uses pre-built Vite assets from `npm run build`, not development server.

---

## 6. FRONTEND BUILD

### Local
```
npm run dev              # Development with HMR
Port: 5173              # Vite dev server
Mode: Development
```

### Production
```
npm run build           # Build once during deploy
Output: public/build/
Mode: Production
```

**Docker Compose:** Runs `npm run dev` automatically in node container.

---

## 7. DATABASE INITIALIZATION & MIGRATION

### Local (Docker)
```
On Container Start:
1. MySQL initializes with init.sql script
2. Database: greatleap_central auto-created
3. php artisan migrate runs during app startup
4. Tenant databases created on demand when tenant is created
5. Tenant migrations run automatically via TenantCreated event
```

### Production
```
On Deployment (via GitHub Actions):
1. git pull origin main
2. composer install --no-dev --optimize-autoloader
3. php artisan migrate --force
4. php artisan config:cache
5. php artisan route:cache
6. php artisan view:cache
7. npm install && npm run build
8. systemctl restart php8.3-fpm
9. systemctl restart nginx
```

**Critical:** Production must have database and migrations already in place before `php artisan migrate` runs.

---

## 8. MULTI-TENANCY BEHAVIOR

### Database Naming
Both Local and Production use the same pattern:
```
Central DB: <DB_DATABASE name>
Tenant DBs: tenant_<uuid>
Example: tenant_a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6
```

### Connection Switching
```
Central Database Connection:
- Used for: Tenants table, Domains, Central Users, Subscriptions
- Middleware: None (default connection)

Tenant Database Connection:
- Used for: Tenant-specific users, tasks, records
- Triggered by: TenantMiddleware (routes/tenant.php)
- Initialization: tenancy()->initialize($tenant)
```

---

## 9. CRITICAL ISSUES & VALIDATION POINTS

### ⚠️ Issue #1: Database Name Mismatch
**Local:** `greatleap_central`
**Server:** `greatleap_app` (from memory)

**Resolution needed:**
```bash
# Check server database:
ssh ubuntu@168.144.67.229
mysql -u greatleap_user -p -e "SHOW DATABASES;"

# If it shows 'greatleap_app', the server .env should have:
DB_DATABASE=greatleap_app

# If it shows 'greatleap_central', the server .env should have:
DB_DATABASE=greatleap_central
```

### ⚠️ Issue #2: Database Credentials
**Verify server .env has:**
```
DB_USERNAME=greatleap_user
DB_PASSWORD=GreatLeap@2026
```

### ⚠️ Issue #3: Environment & Debug Mode
**Verify server .env has:**
```
APP_ENV=production
APP_DEBUG=false
CENTRAL_DOMAIN=<actual domain>
```

### ✅ Validated Points
- ✅ TENANCY_DB_PREFIX=tenant_ (correct on both)
- ✅ Tenant database creation via events (working)
- ✅ Multi-tenancy middleware in place
- ✅ Route names for tenant resources (fixed in previous session)
- ✅ PHP version match: 8.3-fpm on server, 8.3 in Docker

---

## 10. DEPLOYMENT FLOW VERIFICATION

### GitHub Actions Workflow
```
Trigger: Push to main branch
Steps:
1. SSH into 168.144.67.229
2. cd /var/www/new-great-leap-app
3. git pull origin main
4. composer install --no-dev --optimize-autoloader
5. php artisan migrate --force
6. Cache configuration/routes/views
7. npm install && npm run build
8. systemctl restart php8.3-fpm
9. systemctl restart nginx
```

**Issue:** If `php artisan migrate` runs and database doesn't exist → ERROR
**Solution:** Database must exist before deployment, migrations create/modify tables.

---

## 11. RECOMMENDED NEXT STEPS

### 1. Verify Server Database
```bash
ssh ubuntu@168.144.67.229
mysql -u root -p
SHOW DATABASES;
# Check which database exists: greatleap_app or greatleap_central?
```

### 2. Check Server .env File
```bash
cat /var/www/new-great-leap-app/.env
# Verify:
# - DB_DATABASE value matches actual MySQL database
# - DB_USERNAME and DB_PASSWORD are correct
# - APP_ENV=production
# - CENTRAL_DOMAIN is set correctly
```

### 3. Verify Migrations Status
```bash
ssh ubuntu@168.144.67.229
cd /var/www/new-great-leap-app
php artisan migrate:status

# Should show all migrations as "Ran"
```

### 4. Test Tenant Creation
```bash
# Via API:
POST /api/tenants
{
    "company_name": "Test Company",
    "admin_name": "John Doe",
    "admin_email": "john@test.com",
    "admin_password": "password123",
    "plan": "free"
}

# Check if tenant_<uuid> database was created
mysql -e "SHOW DATABASES;" | grep tenant_
```

### 5. Check Application Logs
```bash
ssh ubuntu@168.144.67.229
tail -f /var/www/new-great-leap-app/storage/logs/laravel.log
```

---

## 12. CONFIGURATION CHECKLIST

### Local ✅ (Docker)
- [x] Docker Compose configured
- [x] MySQL database: greatleap_central
- [x] PHP 8.3 in Dockerfile
- [x] Nginx configured for SPA
- [x] Vite dev server with HMR
- [x] Node container for build
- [x] Multi-tenancy config in place
- [x] Migrations: central + tenant

### Production ⚠️ (Needs Verification)
- [ ] Verify MySQL database name (greatleap_app or greatleap_central?)
- [ ] Verify .env credentials match MySQL setup
- [ ] Verify PHP 8.3-fpm is running
- [ ] Verify Nginx is configured correctly
- [ ] Verify Git deployment working
- [ ] Verify npm build completed successfully
- [ ] Verify Laravel cache cleared after deployment
- [ ] Verify all migrations have run

---

## Summary

**Key Takeaway:** The architecture is fundamentally sound (Docker local, direct server install), but there's a potential **database name mismatch** between local (`greatleap_central`) and server (possibly `greatleap_app`).

**Action Required:**
1. SSH into production server
2. Check actual MySQL database name
3. Update server .env to match, OR update local to match server
4. Both must use the same naming convention going forward
5. Verify all migrations have been applied successfully

