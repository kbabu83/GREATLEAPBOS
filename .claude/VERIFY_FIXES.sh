#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "════════════════════════════════════════════════════════════"
echo "  Authentication System - Fix Verification Script"
echo "════════════════════════════════════════════════════════════"
echo ""

FIXES_VERIFIED=0
TOTAL_FIXES=4

# Fix #1: Check tenant_id in TenantController.store()
echo "Checking Fix #1: tenant_id in TenantController.store()..."
if grep -q "'tenant_id' => \$tenant->id" "app/Http/Controllers/Central/TenantController.php"; then
    echo -e "${GREEN}✓ PASS${NC}: tenant_id assignment found in store() method"
    ((FIXES_VERIFIED++))
else
    echo -e "${RED}✗ FAIL${NC}: tenant_id assignment NOT found in store() method"
    echo "  Location: app/Http/Controllers/Central/TenantController.php line 92"
fi
echo ""

# Fix #2: Check Hash::make() instead of bcrypt() in OtpService
echo "Checking Fix #2: Hash::make() in OtpService.resetPassword()..."
if grep -q "Hash::make(\$newPassword)" "app/Services/OtpService.php"; then
    echo -e "${GREEN}✓ PASS${NC}: Hash::make() found in password reset"
    ((FIXES_VERIFIED++))
else
    echo -e "${RED}✗ FAIL${NC}: Hash::make() NOT found in password reset"
    echo "  Location: app/Services/OtpService.php line 144"
fi

if grep -q "use Illuminate\\\\Support\\\\Facades\\\\Hash;" "app/Services/OtpService.php"; then
    echo -e "${GREEN}✓ PASS${NC}: Hash facade import found"
    ((FIXES_VERIFIED++))
else
    echo -e "${RED}✗ FAIL${NC}: Hash facade import NOT found"
    echo "  Need to add: use Illuminate\\Support\\Facades\\Hash;"
fi
echo ""

# Fix #3: Check enhanced email validation in TenantController.register()
echo "Checking Fix #3: Enhanced email validation in register() method..."
if grep -q "Manual validation for admin_email uniqueness" "app/Http/Controllers/Central/TenantController.php"; then
    echo -e "${GREEN}✓ PASS${NC}: Enhanced email validation comment found"
    ((FIXES_VERIFIED++))
else
    echo -e "${YELLOW}⚠ WARN${NC}: Enhanced email validation comment not found"
    echo "  Location: app/Http/Controllers/Central/TenantController.php line ~278"
fi

if grep -q "This email is already in use by another account" "app/Http/Controllers/Central/TenantController.php"; then
    echo -e "${GREEN}✓ PASS${NC}: Email uniqueness validation message found"
    ((FIXES_VERIFIED++))
else
    echo -e "${RED}✗ FAIL${NC}: Email uniqueness validation NOT implemented"
fi
echo ""

# Fix #4: Check multi-tenant password reset in OtpService
echo "Checking Fix #4: Multi-tenant password reset in OtpService..."
if grep -q "Search for user in central database first" "app/Services/OtpService.php"; then
    echo -e "${GREEN}✓ PASS${NC}: Multi-tenancy search comment found"
    ((FIXES_VERIFIED++))
else
    echo -e "${YELLOW}⚠ WARN${NC}: Multi-tenancy search comment not found"
fi

if grep -q "foundInTenant" "app/Services/OtpService.php"; then
    echo -e "${GREEN}✓ PASS${NC}: Tenant detection logic found"
    ((FIXES_VERIFIED++))
else
    echo -e "${RED}✗ FAIL${NC}: Tenant detection logic NOT implemented"
fi

if grep -q "Search all tenant databases" "app/Services/OtpService.php"; then
    echo -e "${GREEN}✓ PASS${NC}: Tenant database search implemented"
    ((FIXES_VERIFIED++))
else
    echo -e "${RED}✗ FAIL${NC}: Tenant database search NOT implemented"
fi
echo ""

# Verify ValidationException is imported in TenantController
echo "Checking ValidationException imports..."
if grep -q "use Illuminate\\\\Validation\\\\ValidationException;" "app/Http/Controllers/Central/TenantController.php"; then
    echo -e "${GREEN}✓ PASS${NC}: ValidationException imported in TenantController"
    ((FIXES_VERIFIED++))
else
    echo -e "${RED}✗ FAIL${NC}: ValidationException NOT imported in TenantController"
fi
echo ""

# Summary
echo "════════════════════════════════════════════════════════════"
echo "  Verification Summary"
echo "════════════════════════════════════════════════════════════"

if [ $FIXES_VERIFIED -ge 10 ]; then
    echo -e "${GREEN}✓ All critical fixes verified!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run: npm run build"
    echo "  2. Test the application thoroughly"
    echo "  3. Commit changes to git"
    echo "  4. Deploy to production"
else
    echo -e "${RED}✗ Some fixes are missing!${NC}"
    echo ""
    echo "Please review the failing checks above and implement the required fixes."
fi

echo ""
echo "Fixes Verified: $FIXES_VERIFIED / 10+"
echo ""
