# MySQL Permissions Setup Guide

**Purpose:** Grant `greatleap_user` permission to create tenant databases
**Server:** 168.144.67.229
**Time Required:** 2-3 minutes
**Difficulty:** Easy

---

## ⚠️ CRITICAL: This MUST be done once before tenant creation works!

---

## Step-by-Step Instructions

### Step 1: SSH into the Server

**Open your terminal/command prompt and run:**

```bash
ssh ubuntu@168.144.67.229
```

**Expected output:**
```
ubuntu@168.144.67.229's password:
# or if using SSH key, you'll be automatically logged in
```

**What to do:**
- If asked for password, enter your SSH password
- If using SSH key, it will connect automatically
- You should see a prompt like: `ubuntu@ip-xxx:~$`

---

### Step 2: Run the MySQL Permission Grant

**Once logged into the server, paste this entire command:**

```bash
mysql -u root -p << EOF
GRANT ALL PRIVILEGES ON `tenant_%`.* TO 'greatleap_user'@'localhost';
FLUSH PRIVILEGES;
SHOW GRANTS FOR 'greatleap_user'@'localhost';
EOF
```

**What happens:**
1. `mysql -u root -p` - Connects to MySQL as root
2. You'll be prompted: `Enter password:` - **Enter the MySQL root password**
3. The three commands will execute automatically

**Expected output:**
```
Enter password: ••••••••

+----------------------------------------------+
| Grants for greatleap_user@localhost          |
+----------------------------------------------+
| GRANT ALL PRIVILEGES ON `tenant_%`.* TO ...  |
+----------------------------------------------+
1 row in set (0.00 sec)
```

---

## Alternative: If You Don't Know Root Password

If you don't have the MySQL root password, use `sudo`:

```bash
sudo mysql -u root << EOF
GRANT ALL PRIVILEGES ON `tenant_%`.* TO 'greatleap_user'@'localhost';
FLUSH PRIVILEGES;
SHOW GRANTS FOR 'greatleap_user'@'localhost';
EOF
```

**Expected prompt:**
```
[sudo] password for ubuntu: ••••••••
```

Enter your **Ubuntu** password (the SSH password).

---

## Step 3: Verify the Permission Was Granted

**Run this command to verify:**

```bash
mysql -u greatleap_user -p -h 127.0.0.1 << EOF
SELECT 1;
EOF
```

**Expected output:**
```
Enter password: ••••••••
+---+
| 1 |
+---+
| 1 |
+---+
```

This confirms `greatleap_user` can connect to MySQL.

---

## Step 4: Test Tenant Database Creation

**Option A: Using curl (from your local machine)**

```bash
# Get an auth token first
curl -X POST http://168.144.67.229/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@greatleap.app","password":"password"}'

# Response will include a token, copy it

# Then create a test tenant
curl -X POST http://168.144.67.229/api/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <paste-token-here>" \
  -d '{
    "company_name": "Test Company",
    "admin_name": "Test Admin",
    "admin_email": "testadmin@testcompany.com",
    "admin_password": "TestPassword123",
    "plan": "free"
  }'
```

**Option B: Check if database was created (from server)**

```bash
# SSH into server first
ssh ubuntu@168.144.67.229

# Then check for tenant databases
mysql -u greatleap_user -p -h 127.0.0.1 -e "SHOW DATABASES LIKE 'tenant_%';"
```

**Expected output:**
```
Enter password: ••••••••
+--------------------+
| Database           |
+--------------------+
| tenant_abc123def.. |
| tenant_xyz789uvw.. |
+--------------------+
```

If you see `tenant_` prefixed databases, the setup is successful! ✅

---

## Troubleshooting

### Error: "Access denied for user 'root'@'localhost'"

**Cause:** Wrong MySQL root password

**Solution:**
```bash
# Try with sudo instead
sudo mysql -u root << EOF
GRANT ALL PRIVILEGES ON `tenant_%`.* TO 'greatleap_user'@'localhost';
FLUSH PRIVILEGES;
EOF
```

---

### Error: "User 'greatleap_user'@'localhost' is not defined"

**Cause:** User doesn't exist yet

**Solution:** Create the user first:
```bash
sudo mysql -u root << EOF
CREATE USER 'greatleap_user'@'localhost' IDENTIFIED BY 'GreatLeap@2026';
GRANT ALL PRIVILEGES ON `tenant_%`.* TO 'greatleap_user'@'localhost';
FLUSH PRIVILEGES;
EOF
```

---

### Error: "Can't connect to MySQL server on '127.0.0.1'"

**Cause:** MySQL service not running

**Solution:**
```bash
# Check if MySQL is running
sudo systemctl status mysql

# If not running, start it
sudo systemctl start mysql
```

---

### Error: "tenant database still not created after grant"

**Cause:** PHP-FPM doesn't have execute permissions

**Solution:**
```bash
# Restart PHP-FPM
sudo systemctl restart php8.3-fpm

# Then try creating tenant again via API
```

---

## Quick Copy-Paste Commands

### For MySQL with root password:
```bash
ssh ubuntu@168.144.67.229
mysql -u root -p << EOF
GRANT ALL PRIVILEGES ON `tenant_%`.* TO 'greatleap_user'@'localhost';
FLUSH PRIVILEGES;
SHOW GRANTS FOR 'greatleap_user'@'localhost';
EOF
```

### For MySQL with sudo:
```bash
ssh ubuntu@168.144.67.229
sudo mysql -u root << EOF
GRANT ALL PRIVILEGES ON `tenant_%`.* TO 'greatleap_user'@'localhost';
FLUSH PRIVILEGES;
SHOW GRANTS FOR 'greatleap_user'@'localhost';
EOF
```

### To verify setup works:
```bash
ssh ubuntu@168.144.67.229
mysql -u greatleap_user -p -h 127.0.0.1 -e "SELECT 1;"
```

---

## What This Permission Does

**Before:**
```
greatleap_user can create: greatleap_app database ✅
greatleap_user can create: tenant_* databases ❌
Result: Tenant creation fails!
```

**After:**
```
greatleap_user can create: greatleap_app database ✅
greatleap_user can create: tenant_* databases ✅
Result: Tenant creation succeeds!
```

---

## Verification Checklist

- [ ] SSH into server successfully
- [ ] Ran MySQL permission grant command
- [ ] Saw output showing grant was applied
- [ ] Verified `greatleap_user` can connect
- [ ] (Optional) Created a test tenant and verified database exists

---

## Next Steps After Setup

1. ✅ MySQL permissions granted
2. Test tenant creation via API
3. Verify tenant database auto-created
4. Verify tenant user can log in
5. Create tasks in tenant database
6. Verify execution system works in tenant

---

## Questions?

If you get stuck:
1. Check the Troubleshooting section above
2. Verify server is reachable: `ping 168.144.67.229`
3. Check MySQL is running: `sudo systemctl status mysql`
4. Check Laravel logs: `tail -50 /var/www/new-great-leap-app/storage/logs/laravel.log`

