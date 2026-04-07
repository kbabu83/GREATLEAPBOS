#!/bin/bash

# Server Verification Script
# Run this on the production server to verify everything is aligned

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     GREAT LEAP APP - SERVER VERIFICATION SCRIPT                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# 1. Check PHP Version
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. PHP VERSION CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
php -v | head -1
echo ""

# 2. Check MySQL is running
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. MYSQL STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
systemctl status mysql 2>/dev/null || systemctl status mariadb 2>/dev/null || echo "MySQL status: Unknown"
echo ""

# 3. Check .env configuration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. SERVER .ENV CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd /var/www/new-great-leap-app 2>/dev/null || { echo "ERROR: Cannot cd to app directory"; exit 1; }

echo "APP_ENV: $(grep '^APP_ENV=' .env | cut -d= -f2)"
echo "APP_DEBUG: $(grep '^APP_DEBUG=' .env | cut -d= -f2)"
echo "DB_HOST: $(grep '^DB_HOST=' .env | cut -d= -f2)"
echo "DB_PORT: $(grep '^DB_PORT=' .env | cut -d= -f2)"
echo "DB_DATABASE: $(grep '^DB_DATABASE=' .env | cut -d= -f2)"
echo "DB_USERNAME: $(grep '^DB_USERNAME=' .env | cut -d= -f2)"
echo "CENTRAL_DOMAIN: $(grep '^CENTRAL_DOMAIN=' .env | cut -d= -f2)"
echo ""

# 4. Check what databases exist in MySQL
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. MYSQL DATABASES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DB_USER=$(grep '^DB_USERNAME=' .env | cut -d= -f2)
DB_HOST=$(grep '^DB_HOST=' .env | cut -d= -f2)
DB_PASS=$(grep '^DB_PASSWORD=' .env | cut -d= -f2)

mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -e "SHOW DATABASES;" 2>/dev/null | grep -E "greatleap|tenant_"
echo ""

# 5. Check database name from .env vs actual
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. DATABASE ALIGNMENT CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DB_NAME=$(grep '^DB_DATABASE=' .env | cut -d= -f2)
DB_EXISTS=$(mysql -u "$DB_USER" -p"$DB_PASS" -h "$DB_HOST" -e "SHOW DATABASES;" 2>/dev/null | grep "^${DB_NAME}$")

echo ".env says database should be: $DB_NAME"
if [ -z "$DB_EXISTS" ]; then
    echo "Database EXISTS: ❌ NO - DATABASE NOT FOUND!"
else
    echo "Database EXISTS: ✅ YES - ALIGNED!"
fi
echo ""

# 6. Check migrations status
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. MIGRATION STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
php artisan migrate:status 2>/dev/null | head -20
echo ""

# 7. Check PHP-FPM
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. PHP-FPM STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
systemctl status php8.3-fpm 2>&1 | grep -E "active|inactive|running|stopped"
echo ""

# 8. Check Nginx
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. NGINX STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
systemctl status nginx 2>&1 | grep -E "active|inactive|running|stopped"
echo ""

# 9. Check recent git commits
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9. RECENT GIT COMMITS (Latest 5)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
git log --oneline -5
echo ""

# 10. Check for errors in Laravel logs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "10. LARAVEL LOG ERRORS (Last 10)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -i "error\|exception\|failed" storage/logs/laravel.log 2>/dev/null | tail -10 || echo "No errors found in logs ✅"
echo ""

# 11. Test database connection
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "11. TEST DATABASE CONNECTION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
php artisan tinker --execute="\App\Models\Tenant::count();" 2>&1 | grep -E "[0-9]|Error|Exception" || echo "Could not connect to database"
echo ""

# 12. Vite build check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "12. VITE BUILD STATUS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "public/build/manifest.json" ]; then
    echo "✅ Vite build exists: $(ls -lh public/build/manifest.json | awk '{print $5}')"
else
    echo "❌ Vite build NOT FOUND - run: npm install && npm run build"
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    VERIFICATION COMPLETE                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Check if all ✅ marks appear above"
echo "2. If database name is aligned, everything should work"
echo "3. If not, see CONFIGURATION_ALIGNMENT.md for fixes"
echo ""
