# Cleanup Instructions - Remove Unused Modules

## Overview
This document provides step-by-step instructions to remove unused code identified in the audit.

**WARNING**: Before deleting, ensure these items are truly unused in your production environment.

---

## Step 1: Remove `Domain` Model (SAFE TO DELETE)

### Why Remove?
- Zero references in entire codebase (controllers, routes, services)
- Migration exists but table is not used anywhere
- Appears to be legacy multi-domain feature abandoned

### Files to Delete:

```bash
# Delete model
rm app/Models/Domain.php

# Delete migration
rm database/migrations/2024_01_01_000002_create_domains_table.php
```

### Verification:
```bash
# Verify no references remain
grep -r "Domain" app/Http/Controllers app/Repositories routes --include="*.php"
# Should return empty (unless in comments)
```

### No additional code changes needed
- No controllers import this model
- No routes reference it
- No migrations depend on it

---

## Step 2: Investigate `EmployeeSalaryAssignment` Model

### Status: POTENTIALLY UNUSED (needs verification)

This model has 2 references found, but they may be in seeding/testing only.

### Check References:
```bash
grep -r "EmployeeSalaryAssignment" app/Http/Controllers app/Repositories --include="*.php"
```

### If references are ONLY in:
- `database/seeders/`
- `tests/`
- Comments/documentation

Then it's **SAFE TO DELETE**:
```bash
rm app/Models/EmployeeSalaryAssignment.php
# No migration exists - already handled by SalaryStructure
```

### If references are in actual code:
**DO NOT DELETE** - it's still in use

---

## Step 3: Verify `PasswordResetOtp` Model (KEEP - ACTIVELY USED)

This model is actively used by `PasswordResetController`:

```bash
grep -r "PasswordResetOtp" app/Http/Controllers/Auth/PasswordResetController.php
```

**Result**: This model has 9 references and is CORE to password reset functionality
**Action**: **KEEP THIS MODEL - DO NOT DELETE**

---

## Step 4: Review Other Models (KEEP ALL)

The following models have active references and should be KEPT:

- ✅ `LeaveTypeApprovalLevel` - 5 references (used in leave workflows)
- ✅ `EsRoleIdealProfile` - 3 references (used in role system)
- ✅ `EsRolePerformanceDefinition` - 3 references (used in role system)
- ✅ `EsRoleSkill` - 3 references (used in role system)
- ✅ `SubscriptionPlanFeature` - 3 references (used in subscription system)

All other models are actively used.

---

## Step 5: After Deletion, Run These Commands

```bash
# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Re-optimize autoloader
composer dump-autoload -o

# Rebuild caches
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Step 6: Deploy to Production

If you deleted any migrations or models:

```bash
# On production server
cd /var/www/new-great-leap-app

# Pull latest code
git pull origin main

# The deployment workflow will automatically:
# 1. composer install --no-dev --optimize-autoloader
# 2. php artisan migrate --force (will skip deleted migrations)
# 3. php artisan config:cache
# 4. php artisan route:cache
# 5. npm install && npm run build
# 6. sudo systemctl restart php8.3-fpm
# 7. sudo systemctl restart nginx
```

---

## Recommended Deletion Order

### Phase 1 (SAFE - No Dependencies):
1. Delete `app/Models/Domain.php`
2. Delete `database/migrations/2024_01_01_000002_create_domains_table.php`

### Phase 2 (VERIFY FIRST - Check References):
1. Verify `EmployeeSalaryAssignment` references
2. If only in seeders/tests, delete `app/Models/EmployeeSalaryAssignment.php`

### Phase 3 (NEVER DELETE):
- Keep all other models
- Keep `PasswordResetOtp` model
- Keep all active migrations

---

## Rollback Plan

If something breaks after deletion:

```bash
# 1. Restore from git
git checkout HEAD -- app/Models/Domain.php
git checkout HEAD -- database/migrations/2024_01_01_000002_create_domains_table.php

# 2. Re-run migrations (if deleted migration)
# Note: Deleted migrations can't be re-run with migrate:refresh
# Instead, you may need to restore from database backup

# 3. Restart services
sudo systemctl restart php8.3-fpm
sudo systemctl restart nginx
```

---

## Summary

| Action | Files | Safe? |
|--------|-------|-------|
| Delete Domain model | 2 files | ✅ YES |
| Delete EmployeeSalaryAssignment | 1 file | ⚠️ VERIFY |
| Keep PasswordResetOtp | - | ✅ ACTIVE |
| Keep all others | - | ✅ ALL ACTIVE |

**Recommended First Step**: Delete the Domain model only (safest with zero references).

---

## Questions to Ask Before Cleanup

1. **Are you actively using multi-domain feature?**
   - NO → Safe to delete Domain model

2. **Are you using EmployeeSalaryAssignment?**
   - Check routes, controllers, forms
   - If NO references in actual code (only tests/seeders) → Safe to delete

3. **Have you backed up your database recently?**
   - YES → Proceed with confidence
   - NO → Do it before any deletions

---

**Last Updated**: 2026-04-05
**Auditor**: Claude Code
