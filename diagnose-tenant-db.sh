#!/bin/bash

# Diagnostic script to check tenant database state
# This helps identify why password reset is failing for existing tenants

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        Great Leap App - Tenant Database Diagnostic             ║"
echo "║  Checks: Database existence, schema, admin user records         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

DB_USER="greatleap_user"
DB_PASSWORD="GreatLeap@2026"
DB_HOST="127.0.0.1"

echo "Database User: $DB_USER"
echo "Database Host: $DB_HOST"
echo ""

# Step 1: List all tenant databases
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 1: Check What Tenant Databases Exist"
echo "═══════════════════════════════════════════════════════════════"
echo ""

MYSQL_CMD="mysql -u $DB_USER -p$DB_PASSWORD -h $DB_HOST"

echo "Running: SHOW DATABASES LIKE 'tenant_%';"
echo ""

$MYSQL_CMD -e "SHOW DATABASES LIKE 'tenant_%';" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ Failed to connect to MySQL"
    echo "Troubleshooting:"
    echo "1. Check MySQL is running: sudo systemctl status mysql"
    echo "2. Check password is correct"
    echo "3. Check host/user are correct"
    exit 1
fi

echo ""
echo ""

# Step 2: For each tenant database, check schema and admin user
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 2: Check Schema and Admin Users in Each Tenant Database"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Get list of tenant databases
TENANT_DBS=$($MYSQL_CMD -N -e "SHOW DATABASES LIKE 'tenant_%';" 2>/dev/null)

if [ -z "$TENANT_DBS" ]; then
    echo "⚠️  No tenant databases found"
    echo "This means:"
    echo "1. No tenants have been created yet, OR"
    echo "2. Tenant creation failed at database creation step"
    exit 0
fi

echo "Found $(echo "$TENANT_DBS" | wc -l) tenant database(s):"
echo ""

for DB in $TENANT_DBS; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Database: $DB"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Check if users table exists
    echo "Checking: Does 'users' table exist?"
    USERS_TABLE=$($MYSQL_CMD -N -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='$DB' AND TABLE_NAME='users';" 2>/dev/null)

    if [ "$USERS_TABLE" -eq 0 ]; then
        echo "❌ NO - 'users' table does NOT exist in $DB"
        echo "   Problem: Migrations were not run for this tenant"
        echo "   Solution: Run migrations on this tenant database"
    else
        echo "✅ YES - 'users' table exists in $DB"
        echo ""

        # Count users in this database
        USER_COUNT=$($MYSQL_CMD -N -e "USE $DB; SELECT COUNT(*) FROM users;" 2>/dev/null)
        echo "   Total users: $USER_COUNT"

        # Check for admin user
        ADMIN_USER=$($MYSQL_CMD -N -e "USE $DB; SELECT id, name, email, role FROM users WHERE role='tenant_admin' LIMIT 1;" 2>/dev/null)

        if [ -z "$ADMIN_USER" ]; then
            echo "❌ NO admin user found"
            echo "   Problem: Tenant admin was not created in this database"
            echo "   Solution: Check where admin was created (might be in central DB)"
        else
            echo "✅ Admin user found:"
            echo "   $ADMIN_USER"
        fi
    fi

    echo ""
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "STEP 3: Check Central Database for Tenant Records"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "Checking: Central 'tenants' table for all tenant records"
echo ""

CENTRAL_TENANTS=$($MYSQL_CMD greatleap_app -N -e "SELECT id, name, email, status FROM tenants;" 2>/dev/null)

if [ -z "$CENTRAL_TENANTS" ]; then
    echo "❌ No tenant records in central database"
else
    echo "✅ Found tenant records in central database:"
    echo ""
    echo "$CENTRAL_TENANTS" | while read ID NAME EMAIL STATUS; do
        echo "  ID: $ID"
        echo "  Name: $NAME"
        echo "  Email: $EMAIL"
        echo "  Status: $STATUS"

        # Check if corresponding database exists
        DB_NAME="tenant_$ID"
        DB_EXISTS=$($MYSQL_CMD -N -e "SHOW DATABASES LIKE '$DB_NAME';" 2>/dev/null)

        if [ -z "$DB_EXISTS" ]; then
            echo "  Database: ❌ MISSING ($DB_NAME does not exist)"
        else
            echo "  Database: ✅ EXISTS ($DB_NAME)"
        fi

        echo ""
    done
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "DIAGNOSTIC SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Common Issues Found:"
echo ""
echo "1. ❌ Tenant databases exist but 'users' table missing"
echo "   → Migrations were not run during tenant creation"
echo "   → Solution: Run migrations on existing tenant databases"
echo ""
echo "2. ❌ Tenant admin user missing from tenant database"
echo "   → Admin was created in central DB instead of tenant DB"
echo "   → Solution: Check and recreate admin in correct database"
echo ""
echo "3. ✅ All databases and tables exist, admin user present"
echo "   → Issue is likely in code or authentication flow"
echo "   → Solution: Check application logs"
echo ""
