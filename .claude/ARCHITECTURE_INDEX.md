# Architecture Documentation Index

This folder contains comprehensive documentation analyzing the local development setup versus the production server architecture. These documents will help you understand, verify, and fix any configuration mismatches.

---

## 📋 Quick Start Guide

**Start here if you just want the essentials:**
1. Read: `ARCHITECTURE_SUMMARY.md` (5-10 min)
2. Run: Commands from `SERVER_VERIFICATION_CHECKLIST.md` section 1-3 (5 min)
3. Identify: Which database name your server actually uses
4. Decide: Which alignment option from `CONFIGURATION_ALIGNMENT.md` to use

---

## 📚 Documentation Files

### 1. ARCHITECTURE_SUMMARY.md
**Best for:** Quick reference and overview
**Content:**
- Quick table comparing local vs server
- Key differences explained
- File structure comparison
- Environment configuration
- Multi-tenancy behavior explanation
- Troubleshooting guide
- Quick reference commands

**Time to read:** 10-15 minutes
**Use when:** You need a quick understanding of how local and server differ

---

### 2. ARCHITECTURE_COMPARISON.md
**Best for:** Detailed architectural understanding
**Content:**
- Comprehensive comparison of all infrastructure components
- Database architecture (Docker vs system MySQL)
- Application environment differences
- Email configuration differences
- File structure comparison
- Web server setup comparison
- Database initialization and migration flow
- Multi-tenancy behavior (same on both)
- 11 critical issues and validation points
- Recommended next steps with commands

**Time to read:** 20-30 minutes
**Use when:** You want deep understanding of every difference

---

### 3. SERVER_VERIFICATION_CHECKLIST.md
**Best for:** Step-by-step server verification
**Content:**
- 10 detailed verification sections:
  1. Database verification (check MySQL databases)
  2. Application configuration (verify .env)
  3. Migration status (check if migrations ran)
  4. PHP & Web server (verify services running)
  5. Application health (check logs)
  6. Deployment workflow (verify git, GitHub Actions)
  7. Frontend build verification (check Vite build)
  8. Multi-tenancy verification (test tenant creation)
  9. Critical fixes verification (verify recent changes)
  10. Final checklist
- Troubleshooting section with fixes
- Diagnostic commands

**Time to complete:** 20-30 minutes
**Use when:** Actually verifying the server setup is correct

---

### 4. CONFIGURATION_ALIGNMENT.md
**Best for:** Understanding and fixing database configuration
**Content:**
- Root cause analysis of database name mismatch
- Three scenarios with solutions
- How deployment flow can fail
- Identification process (step-by-step)
- Configuration alignment matrix
- Quick diagnosis script
- Troubleshooting common errors:
  - "Unknown database" error
  - "Connection refused" error
  - "Access denied" error
  - "Base table or view doesn't exist" error
- Verification commands
- Decision tree for problem solving
- What likely happened (scenario analysis)
- Recommendation for fixing

**Time to read:** 15-20 minutes
**Use when:** Dealing with database connection issues

---

### 5. ARCHITECTURE_DIAGRAMS.md
**Best for:** Visual understanding of the system
**Content:**
- 7 detailed ASCII diagrams:
  1. Local development architecture with Docker
  2. Production server architecture with system services
  3. Multi-tenancy database structure
  4. Request flow (registration and login)
  5. Deployment flow (GitHub Actions)
  6. Database name comparison
  7. Component diagram (frontend, backend, database)

**Time to review:** 10-15 minutes
**Use when:** You prefer visual representations

---

## 🎯 How to Use These Documents

### Scenario 1: "Application not showing changes after deployment"
1. Read: ARCHITECTURE_SUMMARY.md sections 4 & 5
2. Check: SERVER_VERIFICATION_CHECKLIST.md sections 6 & 7
3. Verify: GitHub Actions workflow completed successfully
4. Run: `git log --oneline -5` to see if commits are deployed

### Scenario 2: "Can't create tenants / database errors"
1. Read: CONFIGURATION_ALIGNMENT.md (root cause analysis)
2. Run: SERVER_VERIFICATION_CHECKLIST.md section 1 (database check)
3. Run: Diagnosis script from CONFIGURATION_ALIGNMENT.md
4. Decide: Which alignment option to use
5. Follow: Remediation steps

### Scenario 3: "Just want to understand the system"
1. Start: ARCHITECTURE_SUMMARY.md for quick overview
2. Deep dive: ARCHITECTURE_COMPARISON.md for details
3. Review: ARCHITECTURE_DIAGRAMS.md for visual understanding
4. Optional: CONFIGURATION_ALIGNMENT.md if interested in DB details

### Scenario 4: "Verifying server is set up correctly"
1. Start: SERVER_VERIFICATION_CHECKLIST.md
2. Work through all 10 sections systematically
3. Check off each item
4. Review ARCHITECTURE_SUMMARY.md if anything seems wrong

### Scenario 5: "Debugging a production issue"
1. Check: ARCHITECTURE_SUMMARY.md troubleshooting section
2. Run: Verification commands from SERVER_VERIFICATION_CHECKLIST.md
3. Check: Logs using commands from CONFIGURATION_ALIGNMENT.md
4. Compare: Against expected architecture in ARCHITECTURE_COMPARISON.md

---

## 🔍 Key Issue Being Documented

### The Database Name Mismatch

**Local Development:**
```
Database Name: greatleap_central
```

**Production Server:**
```
Database Name: greatleap_app (needs verification!)
```

**Impact:** If they don't match, applications fail with "Unknown database" errors during deployment.

**Solution:** Must align them. See `CONFIGURATION_ALIGNMENT.md` for detailed instructions.

---

## ⚡ Quick Verification Commands

```bash
# 1. Check what database name is in .env
cat /var/www/new-great-leap-app/.env | grep DB_DATABASE

# 2. Check what databases actually exist in MySQL
mysql -u greatleap_user -p -e "SHOW DATABASES;" | grep greatleap

# 3. Check migration status
php artisan migrate:status

# 4. Check application logs
tail -50 /var/www/new-great-leap-app/storage/logs/laravel.log

# 5. Check if PHP-FPM is running
systemctl status php8.3-fpm

# 6. Check if Nginx is running
systemctl status nginx
```

---

## 📊 Documentation Matrix

| Document | Best For | Time | When to Use |
|----------|----------|------|-------------|
| SUMMARY | Quick overview | 10-15 min | Starting point |
| COMPARISON | Deep understanding | 20-30 min | Understanding details |
| CHECKLIST | Server verification | 20-30 min | Verifying setup |
| ALIGNMENT | DB configuration | 15-20 min | Fixing DB issues |
| DIAGRAMS | Visual learning | 10-15 min | Visual understanding |

---

## 🚀 Recommended Reading Order

1. **If you have 10 minutes:** Read ARCHITECTURE_SUMMARY.md
2. **If you have 30 minutes:** Read SUMMARY + review DIAGRAMS.md
3. **If you have 1 hour:** Read SUMMARY + COMPARISON + DIAGRAMS
4. **If you have 2 hours:** Read all docs + run verification checklist
5. **If something is broken:** Jump to CONFIGURATION_ALIGNMENT.md and run diagnostic

---

## ✅ Verification Outcomes

After reading and verifying using these documents, you should be able to answer:

- [ ] What is the name of the central database on the server?
- [ ] Is it "greatleap_app" or "greatleap_central"?
- [ ] Does the .env file match the actual database?
- [ ] Have all migrations been applied?
- [ ] Is PHP 8.3-fpm running (not 8.2)?
- [ ] Is Nginx properly configured?
- [ ] Can you create a test tenant?
- [ ] Do you understand the multi-tenancy architecture?
- [ ] Do you know how to troubleshoot common issues?
- [ ] Can you verify a deployment succeeded?

---

## 📝 Related Documentation

For related information, also check:
- `.claude/CORE_STATUS.md` - Current project status
- `.claude/MEMORY.md` - Project context and history
- `.claude/projects/` - Project-specific information
- `SETUP_CHECKLIST` - Initial setup steps (if not already configured)

---

## 🔗 Quick Links to Sections

### In ARCHITECTURE_SUMMARY.md
- Database Details: Section 7
- Troubleshooting: Section 11
- Quick Commands: Section 12

### In ARCHITECTURE_COMPARISON.md
- Critical Issues: Section 9
- Recommended Next Steps: Section 11
- Verification Commands: Section 12

### In SERVER_VERIFICATION_CHECKLIST.md
- Database Check: Section 1
- Config Verification: Section 2
- Migration Status: Section 3
- Common Errors: "If Issues Found"

### In CONFIGURATION_ALIGNMENT.md
- Root Cause: Section 1-2
- Diagnosis Process: Section 3
- Verification Commands: Section 5
- Common Errors: Section 6

### In ARCHITECTURE_DIAGRAMS.md
- Local Setup: Diagram 1
- Server Setup: Diagram 2
- Database Structure: Diagram 3

---

## 💡 Pro Tips

1. **Use the decision tree** in CONFIGURATION_ALIGNMENT.md to diagnose issues systematically
2. **Run the diagnostic script** from CONFIGURATION_ALIGNMENT.md before spending time troubleshooting
3. **Keep ARCHITECTURE_SUMMARY.md handy** for quick reference during work
4. **Review DIAGRAMS.md** before any major architectural changes
5. **Use CHECKLIST.md section-by-section** rather than all at once

---

## 📞 When These Docs Were Created

- Created: April 6, 2026
- Reason: Identified critical database name mismatch between local and server
- Context: Form fixes deployed, code works locally but not on server
- Focus: Comprehensive architecture analysis and verification procedures

---

## Next Steps

1. **Immediate:** Read ARCHITECTURE_SUMMARY.md (start here!)
2. **Next:** Run section 1-3 of SERVER_VERIFICATION_CHECKLIST.md
3. **Then:** Identify actual database name on server
4. **Finally:** Implement alignment solution from CONFIGURATION_ALIGNMENT.md

