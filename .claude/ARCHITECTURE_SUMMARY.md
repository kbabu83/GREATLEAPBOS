# Architecture Summary: Local vs Server

## Quick Overview

### Local Development (Docker)
- **Setup:** Docker Compose with 4 containers (PHP-FPM, Nginx, MySQL, Node)
- **PHP Version:** 8.3 (in Docker)
- **Database:** MySQL 8.0 in container
- **Database Name:** `greatleap_central`
- **Frontend:** Vite dev server (HMR) + React
- **Entry Point:** http://localhost:8000

### Production Server
- **Setup:** Ubuntu 24.04 LTS with system-wide software
- **PHP Version:** 8.3-fpm (system)
- **Database:** MySQL 8 (system)
- **Database Name:** `greatleap_app` (verify with server)
- **Frontend:** Pre-built Vite assets
- **Entry Point:** https://greatlap.app (or actual domain)

---

## Critical Difference: Database Name

| Aspect | Local | Server | Status |
|--------|-------|--------|--------|
| Database Name | `greatleap_central` | `greatleap_app` | ⚠️ **DIFFERENT** |

**This is the main difference that needs alignment.**

---

## How Multi-Tenancy Works (Same on Both)

```
Central Database (greatleap_central or greatleap_app)
├── tenants table           (stores tenant info)
├── users table             (stores central/super_admin users)
├── domains table           (stores tenant domains)
└── Other central tables    (subscription_plans, etc)

Tenant Databases (one per tenant)
├── tenant_<uuid-1>
│   ├── users table         (stores tenant's users)
│   ├── tasks table         (stores tasks for this tenant)
│   └── Other tenant tables
├── tenant_<uuid-2>
│   ├── users table
│   ├── tasks table
│   └── Other tenant tables
└── tenant_<uuid-n>
    └── ...
```

**Both local and server use same pattern - naming is the only difference.**

---

## File Structure Comparison

### Local (Development)
```
/Users/user1/Desktop/great-leap-app01/
├── app/                    # Laravel code (source)
├── docker/                 # Docker configurations
│   ├── app/Dockerfile
│   ├── nginx/default.conf
│   ├── php/local.ini
│   └── mysql/init.sql
├── database/
│   ├── migrations/         # Central migrations
│   └── migrations/tenant/  # Tenant migrations
├── resources/
│   ├── js/                 # React components
│   └── views/              # Blade templates
├── docker-compose.yml      # Main config file
└── .env                    # Local configuration
```

### Server (Production)
```
/var/www/new-great-leap-app/
├── app/                    # Laravel code (deployed)
├── database/
│   ├── migrations/         # Central migrations (ran)
│   └── migrations/tenant/  # Tenant migrations (ran)
├── resources/              # Source code
├── public/                 # Web root (Nginx serves from here)
│   ├── index.php
│   ├── build/              # Vite build output (JS/CSS)
│   └── ...
├── storage/                # Laravel storage (logs, cache)
├── vendor/                 # Composer dependencies
├── bootstrap/              # Laravel bootstrap
└── .env                    # Server configuration
```

---

## Environment Configuration

### Local .env
```
APP_ENV=local              # Development
APP_DEBUG=true             # Show errors
APP_URL=http://localhost:8000
DB_HOST=db                 # Docker container
DB_DATABASE=greatleap_central
DB_USERNAME=greatleap
DB_PASSWORD=secret
CENTRAL_DOMAIN=localhost
MAIL_MAILER=log            # Dev: logs to file
```

### Server .env (Expected)
```
APP_ENV=production         # Production
APP_DEBUG=false            # Don't show errors
APP_URL=https://greatlap.app
DB_HOST=127.0.0.1          # Direct connection
DB_DATABASE=greatleap_app  # ⚠️ Different name
DB_USERNAME=greatleap_user # ⚠️ Different user
DB_PASSWORD=GreatLeap@2026 # ⚠️ Different password
CENTRAL_DOMAIN=greatlap.app
MAIL_MAILER=ses            # Amazon SES
```

---

## Database Details

### Local MySQL (Docker)
```
Container: greatleap_db
Image: mysql:8.0
Port: 3306
Root Password: secret
Database: greatleap_central
User: greatleap (password: secret)
Initialized: Via docker/mysql/init.sql
```

### Server MySQL (System)
```
Type: System MySQL installation
Version: 8.x
Port: 3306
Database: greatleap_app (verify with: SHOW DATABASES;)
User: greatleap_user (password: GreatLeap@2026)
Host: 127.0.0.1 (localhost only)
```

---

## Web Server Setup

### Local (Docker)
```
Container: greatleap_nginx
Image: nginx:alpine
Port: 8000 (mapped to 80 inside container)
Root: /var/www/public
Config: docker/nginx/default.conf
Backend: http://app:9000 (PHP-FPM container)
Frontend Dev: http://localhost:5173 (Vite server)
```

### Server (System)
```
Service: Nginx
Port: 80/443
Root: /var/www/new-great-leap-app/public
Config: /etc/nginx/sites-available/default
Backend: unix:/var/run/php/php8.3-fpm.sock (PHP-FPM)
Frontend: Pre-built static assets
```

---

## Deployment Process

### Local (Manual during development)
```bash
docker compose up          # Starts all containers
npm run dev               # Starts Vite dev server
# Browser: http://localhost:8000
# Changes auto-reload via HMR
```

### Server (Automatic via GitHub Actions)
```
1. Trigger: Push to main branch
2. GitHub Actions runs deploy.yml workflow
3. SSH into server
4. git pull origin main
5. composer install --no-dev
6. php artisan migrate --force
7. npm install && npm run build
8. systemctl restart php8.3-fpm
9. systemctl restart nginx
10. Server updated with new code
```

---

## Key Differences Explained

### 1. Database Host
- **Local:** `db` (Docker container hostname)
- **Server:** `127.0.0.1` (direct TCP connection)
- **Why:** Docker uses internal networking; server uses system MySQL

### 2. Database Name
- **Local:** `greatleap_central` (central database)
- **Server:** `greatleap_app` (what was set up)
- **Issue:** They must match what's actually in MySQL
- **Fix:** Either update one or the other

### 3. PHP Execution
- **Local:** `php artisan` runs inside docker container
- **Server:** `php artisan` runs on system PHP 8.3
- **Both:** Use PHP 8.3

### 4. Frontend Build
- **Local:** Vite serves dynamically with HMR (npm run dev)
- **Server:** Vite builds once (npm run build) and serves static assets
- **Deployed:** JavaScript files in `public/build/` directory

### 5. Persistent Storage
- **Local:** Docker volumes (auto-removed when container stops)
- **Server:** Regular file system (persists across restarts)
- **Database:** Both use file system (MySQL data directory)

---

## Consistency Checklist

### What Should Be the Same ✅
- [ ] PHP version: 8.3 (both have this)
- [ ] MySQL version: 8.x (both have this)
- [ ] Database structure: Same migrations run on both
- [ ] Tenant DB naming: `tenant_<uuid>` (both use this)
- [ ] Laravel config: Same config/ files on both
- [ ] React components: Same code on both

### What Should Be Different ✅
- [ ] Environment: local vs production
- [ ] Debug mode: true vs false
- [ ] Domain: localhost vs actual domain
- [ ] Mail driver: log vs ses
- [ ] PHP execution: Docker vs system
- [ ] Vite: Dev server vs built assets

### What Might Be Wrong ❌
- [ ] Database name: `greatleap_central` vs `greatleap_app`
- [ ] Database credentials: May not match
- [ ] .env file: May be out of sync
- [ ] PHP version in deployment: May be using 8.2 instead of 8.3
- [ ] Migrations: May not have run on server

---

## How to Align Architecture

### Option 1: Update Server to Match Local (Recommended for consistency)
```
1. Update database name on server from greatleap_app to greatleap_central
2. Update server .env:
   DB_DATABASE=greatleap_central
   (Keep other credentials as-is)
3. Re-run migrations: php artisan migrate --force
4. Restart services
```

### Option 2: Update Local to Match Server
```
1. Update docker-compose.yml:
   MYSQL_DATABASE: greatleap_app (line 45)
2. Update local .env:
   DB_DATABASE=greatleap_app
3. Rebuild: docker compose down && docker compose up --build
4. Run migrations: make artisan CMD="migrate:fresh --seed"
```

### Option 3: Verify & Document What Server Actually Uses
```
1. SSH into server
2. Check: mysql -e "SHOW DATABASES;" | grep greatleap
3. Update this documentation with actual value
4. Ensure .env matches reality
5. Proceed with deployments
```

---

## Troubleshooting Guide

### "Application shows form/page, but no data loads"
- [ ] Check database connection: `php artisan tinker` → `\App\Models\Tenant::count()`
- [ ] Check Laravel logs: `tail -50 storage/logs/laravel.log`
- [ ] Verify database name in .env matches actual MySQL database

### "Registration form shows, but can't create tenant"
- [ ] Check if database exists: `mysql -e "SHOW DATABASES;"`
- [ ] Check if migrations ran: `php artisan migrate:status`
- [ ] Check error logs for details

### "Form changes not appearing after deployment"
- [ ] Check if git pull succeeded: `git log --oneline -5`
- [ ] Check if npm build succeeded: `ls public/build/`
- [ ] Check if nginx is serving correct path: `tail -20 /var/log/nginx/error.log`

### "Connection refused / Can't connect to database"
- [ ] Check MySQL is running: `systemctl status mysql`
- [ ] Check credentials in .env
- [ ] Check database host is correct (127.0.0.1 for server)

---

## Quick Reference Commands

### Local Development
```bash
make start              # Start Docker containers
make shell              # Access PHP container
make artisan CMD="..."  # Run artisan command
make fresh              # Reset database
make logs               # View all logs
npm run dev             # Frontend (separate terminal)
```

### Server Diagnosis
```bash
ssh ubuntu@168.144.67.229
# Check database
mysql -u greatleap_user -p -e "SHOW DATABASES;"

# Check migrations
php artisan migrate:status

# Check logs
tail -50 storage/logs/laravel.log

# Restart services
systemctl restart php8.3-fpm
systemctl restart nginx
```

---

## Documentation Files

For detailed information, see:
- **ARCHITECTURE_COMPARISON.md** - Detailed architectural comparison
- **SERVER_VERIFICATION_CHECKLIST.md** - Step-by-step server verification
- **CONFIGURATION_ALIGNMENT.md** - Database configuration analysis

