# Quick Start - 10 Features System

## 🚀 Get Started in 5 Minutes

### Step 1: Populate Features (1 minute)
```bash
php artisan db:seed FeaturesSeeder
```
This creates all 10 features in the database.

### Step 2: Assign Features to Plans (2 minutes)
1. Open http://localhost:8000/app/assign-features
2. Click on "Professional" plan
3. Toggle features ON: ✅ for features you want
4. Click "💾 Save Assignment"

### Step 3: View Your Features (1 minute)
1. Open http://localhost:8000/app/features-dashboard
2. See which features you have access to ✓ ACTIVE vs 🔒 LOCKED

### Step 4: Test Protection (1 minute)
Try accessing a protected endpoint:
```bash
# This should work if you assigned the feature
curl http://localhost:8000/api/analytics/dashboard

# This should fail with 403 if you didn't assign it
curl http://localhost:8000/api/custom-reports
```

---

## 📋 The 10 Features Reference

| Slug | Name | API Endpoint | Frontend Page |
|------|------|--------------|---------------|
| `advanced-analytics` | 📊 Advanced Analytics | `/api/analytics/*` | `/app/features-dashboard` |
| `custom-reports` | 📄 Custom Reports | `/api/reports/*` | FeatureGate |
| `audit-logs` | 🔍 Audit Logs | `/api/audit-logs/*` | useFeature hook |
| `team-collaboration` | 👥 Team Collaboration | `/api/collaboration/*` | useFeatures hook |
| `unlimited-users` | ∞ Unlimited Users | Checked in controller | Logic in user create |
| `advanced-permissions` | 🔐 Advanced Permissions | `/api/permissions/*` | Conditional render |
| `api-access` | ⚙️ API Access | `/api/api-keys/*`, `/api/webhooks/*` | Settings page |
| `sso-integration` | 🔑 SSO Integration | `/api/sso/*` | Auth settings |
| `custom-branding` | 🎨 Custom Branding | `/api/branding/*` | Branding page |
| `mobile-app` | 📱 Mobile App Access | `/api/mobile/*` | Mobile config |

---

## 💻 Code Usage Examples

### Check Feature in React
```jsx
// Method 1: Hook
const { hasFeature } = useFeature('advanced-analytics');
if (!hasFeature) return <LockedUI />;

// Method 2: Gate
<FeatureGate feature="advanced-analytics">
    <MyDashboard />
</FeatureGate>

// Method 3: All Features
const { has } = useFeatures();
if (has('api-access')) showApiSettings();
```

### Check Feature in PHP
```php
// Method 1: Service
if (FeatureService::userHasFeature($user, 'advanced-analytics')) {
    // Allow
}

// Method 2: Model
if ($user->hasFeature('api-access')) {
    // Allow
}

// Method 3: Middleware (Automatic)
Route::middleware('check-feature:advanced-analytics')->group(function () {
    // Routes in here are protected
});
```

### Protect API Endpoint
```php
// Automatic protection via middleware
Route::middleware('check-feature:advanced-analytics')->group(function () {
    Route::get('/analytics/dashboard', [AnalyticsController::class, 'dashboard']);
});

// Result:
// - User WITH feature: GET request succeeds (200)
// - User WITHOUT feature: GET request fails (403)
```

---

## 🧪 Testing Scenarios

### Scenario 1: User Has Feature ✅
```
User subscribes to Professional Plan
├─ Professional has "advanced-analytics" feature
├─ User requests /api/analytics/dashboard
└─ Result: 200 OK - Feature works
```

### Scenario 2: User Doesn't Have Feature ❌
```
User subscribes to Free Plan
├─ Free plan doesn't have "advanced-analytics" feature
├─ User requests /api/analytics/dashboard
└─ Result: 403 Forbidden - Feature blocked
```

### Scenario 3: Super Admin Always Has All Features ⭐
```
Super Admin tries to access /api/analytics/dashboard
├─ No subscription check (they're super admin)
├─ Middleware sees: isSuperAdmin() = true
└─ Result: 200 OK - All features available
```

---

## 🔧 Common Implementations

### Hide Button if No Feature
```jsx
function Dashboard() {
    const { has } = useFeatures();

    return (
        <div>
            {has('advanced-analytics') && (
                <button onClick={analyzeData}>📊 Analyze</button>
            )}
        </div>
    );
}
```

### Show Upgrade Prompt
```jsx
<FeatureGate
    feature="api-access"
    fallback={<UpgradePrompt feature="api-access" />}
>
    <ApiSettings />
</FeatureGate>
```

### Limit Users if No Unlimited Feature
```php
public function createUser(CreateUserRequest $request) {
    $userCount = $this->tenant->users()->count();

    if (!$user->hasFeature('unlimited-users') && $userCount >= 5) {
        return response()->json([
            'error' => 'User limit reached. Upgrade for unlimited users.'
        ], 422);
    }
}
```

### Check Before API Call
```jsx
async function exportData() {
    const { hasFeature } = useFeature('custom-reports');

    if (!hasFeature) {
        alert('Feature not available. Please upgrade.');
        return;
    }

    await api.post('/api/reports/export');
}
```

---

## 📁 Files Created/Modified

### Created Files
- ✅ `app/Services/FeatureService.php`
- ✅ `app/Http/Middleware/CheckFeature.php`
- ✅ `app/Http/Controllers/Tenant/FeatureCheckController.php`
- ✅ `resources/js/hooks/useFeature.js`
- ✅ `resources/js/components/Features/FeatureGate.jsx`
- ✅ `resources/js/pages/Features/FeaturesDashboard.jsx`
- ✅ `FEATURES_IMPLEMENTATION_GUIDE.md`

### Modified Files
- ✅ `app/Models/User.php` - Added hasFeature() methods
- ✅ `database/seeders/FeaturesSeeder.php` - Added 10 features
- ✅ `bootstrap/app.php` - Registered middleware
- ✅ `routes/api.php` - Added feature-protected routes + endpoints

---

## ✨ Key Features of This System

✅ **Database-Driven** - Features stored in database, can be created dynamically
✅ **Plan-Based** - Features assigned to plans, users get them via subscriptions
✅ **Dual-Layered Protection** - Backend (middleware) + Frontend (hooks)
✅ **Easy to Extend** - Add new features just by creating them in database
✅ **Super Admin Override** - Super admins bypass all feature checks
✅ **Service-Driven** - Centralized FeatureService for consistency
✅ **React Hooks** - Modern hooks-based approach for components
✅ **Well-Documented** - Complete guide with examples

---

## 🎯 Common Questions

**Q: How do I add a new feature?**
A: Add it to FeaturesSeeder.php and run seeder, then assign to plans in Feature Assignment tool.

**Q: How do I check if a user has a feature?**
A: Use `$user->hasFeature('slug')` in PHP or `useFeature('slug')` in React.

**Q: What happens if user doesn't have feature?**
A: Backend returns 403, Frontend shows locked UI or upgrade prompt.

**Q: Can super admins access all features?**
A: Yes, super admins bypass all checks and get all features.

**Q: Where do I protect new endpoints?**
A: Use `Route::middleware('check-feature:slug')` or check in controller.

**Q: What if user's subscription is inactive?**
A: No features are available - subscription must be active.

---

## 🚦 Status Checklist

- [x] 10 Features created in database
- [x] Seeder ready to populate
- [x] Feature Service ready
- [x] Middleware protection ready
- [x] User model methods ready
- [x] API endpoints ready
- [x] React hooks ready
- [x] React components ready
- [x] Routes protected
- [x] Documentation complete

**Everything is ready to use!** 🎉

---

## Next: Your First Feature Implementation

Pick any feature and implement it:

1. **Assign to a plan** (Feature Assignment tool)
2. **Protect an endpoint** (routes/api.php)
3. **Add UI check** (useFeature hook)
4. **Test it works** (Try accessing it)

Example: Protect Analytics

```php
// routes/api.php
Route::middleware('check-feature:advanced-analytics')->group(function () {
    Route::get('/analytics/dashboard', [AnalyticsController::class, 'dashboard']);
});
```

```jsx
// React component
function Analytics() {
    const { hasFeature } = useFeature('advanced-analytics');
    if (!hasFeature) return <UpgradePrompt />;
    return <Dashboard />;
}
```

That's it! Feature is now protected on both frontend and backend. ✅
