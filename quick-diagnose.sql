-- Quick Tenant Database Diagnostic
-- Paste this into: mysql -u greatleap_user -p -h 127.0.0.1
-- OR use DigitalOcean console: sudo mysql -u root

-- STEP 1: List all tenant databases
SHOW DATABASES LIKE 'tenant_%';

-- STEP 2: For each tenant database found, run this to check tables
-- (Replace tenant_abc123 with actual database name from step 1)

-- STEP 2A: Check if 'users' table exists (pick ONE tenant DB from step 1)
-- SELECT COUNT(*) as 'users_table_exists' FROM information_schema.TABLES
-- WHERE TABLE_SCHEMA='tenant_abc123' AND TABLE_NAME='users';

-- STEP 2B: Count users in tenant database
-- USE tenant_abc123;
-- SELECT COUNT(*) as 'total_users' FROM users;

-- STEP 2C: Check for tenant_admin user
-- SELECT id, name, email, role FROM users WHERE role='tenant_admin';

-- STEP 3: Check central database for tenant records
USE greatleap_app;
SELECT id, name, email, status, created_at FROM tenants;

-- STEP 4: For each tenant ID above, verify database exists
-- (Run this in MySQL for each tenant ID)
-- SHOW DATABASES LIKE 'tenant_<id_from_step_3>%';
