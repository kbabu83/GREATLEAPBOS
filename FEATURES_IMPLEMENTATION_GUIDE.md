# Feature Control System - Complete Implementation Guide

## Overview

This document explains how the 10 features are created, controlled, and enforced throughout the Great Leap application.

---

## The 10 Features

| # | Feature | Slug | Category | What It Does |
|---|---------|------|----------|--------------|
| 1️⃣ | Advanced Analytics | `advanced-analytics` | Analytics | Analytics dashboard, data visualization, custom metrics |
| 2️⃣ | Custom Reports | `custom-reports` | Analytics | Report builder, scheduled reports, PDF/Excel export |
| 3️⃣ | Audit Logs | `audit-logs` | Security | Activity logs, compliance reports, change tracking |
| 4️⃣ | Team Collaboration | `team-collaboration` | Collaboration | Team workspaces, comments, mentions, shared tasks |
| 5️⃣ | Unlimited Users | `unlimited-users` | Users | Add unlimited team members (vs 5 limit on free plan) |
| 6️⃣ | Advanced Permissions | `advanced-permissions` | Security | Custom roles, granular permissions, department access |
| 7️⃣ | API Access | `api-access` | Integrations | REST API, webhooks, third-party integrations |
| 8️⃣ | SSO Integration | `sso-integration` | Security | SAML, OAuth, enterprise authentication |
| 9️⃣ | Custom Branding | `custom-branding` | Customization | White-label, custom domain, branded emails |
| 🔟 | Mobile App Access | `mobile-app` | Mobile | iOS & Android native apps |

---

## How Features Flow Through the System

```
Step 1: Feature Creation
┌─────────────────┐
│ Create Feature  │ ─→ Slug: "advanced-analytics"
│ in Database     │    Name: "Advanced Analytics"
└─────────────────┘    Icon: "📊"
        ↓
Step 2: Assign to Plans
┌────────────────────┐
│ Subscription Plan  │ ─→ Professional Plan has features: [1, 3, 5, 7]
│ plan_features      │
└────────────────────┘
        ↓
Step 3: User Subscribes
┌──────────────────┐
│ User → Tenant    │ ─→ John's subscription → Professional Plan
│ Subscription     │
└──────────────────┘
        ↓
Step 4: Check Access
┌──────────────────────────────┐
│ Does John have permission    │ ─→ YES ✅ - Render feature
│ for "advanced-analytics"?    │
└──────────────────────────────┘
        ↓
Step 5: Control Access
┌────────────────────────┐
│ Enable/Disable UI      │ ─→ Show analytics dashboard
│ Enable/Disable API     │    Allow /api/analytics requests
│ Enforce Restrictions   │
└────────────────────────┘
```

---

## Implementation Methods

### **Method 1: Backend - Middleware Protection**

Protect entire API endpoints with feature checks:

```php
// routes/api.php
Route::middleware('check-feature:advanced-analytics')->group(function () {
    Route::prefix('analytics')->group(function () {
        Route::get('/dashboard', [AnalyticsController::class, 'dashboard']);
        Route::post('/export', [AnalyticsController::class, 'export']);
    });
});
```

**How it works:**
1. User makes request to `/api/analytics/dashboard`
2. `check-feature:advanced-analytics` middleware runs
3. Middleware calls `$user->hasFeature('advanced-analytics')`
4. If true: Request continues to controller
5. If false: Returns 403 Forbidden

---

### **Method 2: Backend - Controller Logic**

Check features inside controllers:

```php
// app/Http/Controllers/Tenant/AnalyticsController.php
use App\Services\FeatureService;

public function dashboard()
{
    $user = auth()->user();

    // Check if user has feature
    if (!FeatureService::userHasFeature($user, 'advanced-analytics')) {
        return response()->json([
            'error' => 'Feature not available in your plan'
        ], 403);
    }

    // Feature is available, fetch and return data
    $data = Analytics::getData();
    return response()->json($data);
}
```

**Advantages:**
- More granular control
- Can show different messages
- Can implement quotas/limits

---

### **Method 3: Frontend - Conditional Rendering**

Hide/show UI based on features:

#### Using `useFeature` Hook:

```jsx
import { useFeature } from '../../hooks/useFeature';

function AnalyticsPage() {
    const { hasFeature, loading } = useFeature('advanced-analytics');

    if (loading) return <LoadingSpinner />;

    if (!hasFeature) {
        return <UpgradePrompt feature="advanced-analytics" />;
    }

    return <AnalyticsDashboard />;
}
```

#### Using `FeatureGate` Component:

```jsx
import FeatureGate from '../../components/Features/FeatureGate';

function Dashboard() {
    return (
        <div>
            <Header />

            <FeatureGate
                feature="advanced-analytics"
                fallback={<UpgradeBanner />}
            >
                <AnalyticsDashboard />
            </FeatureGate>

            <Footer />
        </div>
    );
}
```

#### Using `useFeatures` Hook:

```jsx
import { useFeatures } from '../../hooks/useFeature';

function Settings() {
    const { features, has } = useFeatures();

    return (
        <div>
            {has('sso-integration') && (
                <SsoSettings />
            )}

            {has('custom-branding') && (
                <BrandingSettings />
            )}

            {has('audit-logs') && (
                <AuditLogSettings />
            )}
        </div>
    );
}
```

---

## Adding a New Feature to the System

### Step 1: Create the Feature in Database

Run the seeder:
```bash
php artisan db:seed FeaturesSeeder
```

Or create manually:
```php
Feature::create([
    'slug' => 'my-new-feature',
    'name' => 'My New Feature',
    'category' => 'Category Name',
    'icon' => '⭐',
    'description' => 'Feature description',
    'is_active' => true,
]);
```

### Step 2: Assign to Plans

In Feature Assignment tool (`/app/assign-features`):
1. Click "Professional" plan
2. Toggle the new feature ON
3. Click "Save Assignment"

### Step 3: Protect the API Endpoint

```php
// routes/api.php
Route::middleware('check-feature:my-new-feature')->group(function () {
    Route::get('/my-endpoint', [MyController::class, 'handler']);
});
```

### Step 4: Update Frontend

Show/hide UI:
```jsx
function MyComponent() {
    const { hasFeature } = useFeature('my-new-feature');

    if (!hasFeature) return null;

    return <MyFeatureUI />;
}
```

### Step 5: Test

1. Create test user with basic plan (no feature)
   - Try accessing `/api/my-endpoint` → Should get 403
   - UI should not render the feature

2. Create test user with professional plan (has feature)
   - Try accessing `/api/my-endpoint` → Should work
   - UI should render the feature

---

## Feature Checking Methods

### In Controllers:

```php
use App\Services\FeatureService;

$user = auth()->user();

// Check single feature
if (FeatureService::userHasFeature($user, 'api-access')) {
    // Allowed
}

// Check any of multiple features
if (FeatureService::userHasAnyFeature($user, ['api-access', 'unlimited-users'])) {
    // User has at least one of these features
}

// Get all user features
$features = FeatureService::getUserFeatures($user);
// Returns: ['advanced-analytics', 'custom-reports', 'api-access']

// Check quota
if (FeatureService::checkQuota($user, 'api-access', $currentUsage, $limit)) {
    // User hasn't exceeded quota
}
```

### In Models:

```php
// In User model methods
if ($user->hasFeature('audit-logs')) {
    // Log this action
}

$features = $user->getFeatures();
// Returns: ['advanced-analytics', 'custom-reports']

if ($user->hasAnyFeature(['sso-integration', 'api-access'])) {
    // Enterprise features
}
```

### In Frontend (React):

```jsx
// Check single feature
const { hasFeature, loading } = useFeature('advanced-analytics');

// Check multiple features
const { features, has, hasAny } = useFeatures();

if (has('advanced-analytics')) { }
if (hasAny(['api-access', 'unlimited-users'])) { }

// List all features
console.log(features); // ['advanced-analytics', 'custom-reports', ...]
```

---

## API Endpoints for Feature Checking

### Get All User Features

```
GET /api/user/features
Response:
{
    "features": ["advanced-analytics", "custom-reports", "api-access"],
    "count": 3
}
```

### Check Single Feature

```
POST /api/user/features/{featureSlug}/check
Response:
{
    "has_feature": true,
    "feature": "advanced-analytics",
    "user_plan": "Professional"
}
```

### Check Multiple Features

```
POST /api/user/features/check-any
Body: { "features": ["api-access", "unlimited-users"] }
Response:
{
    "has_any": true,
    "requested_features": ["api-access", "unlimited-users"],
    "user_features": ["advanced-analytics", "custom-reports", "api-access"]
}
```

### Get Feature Details

```
GET /api/features/{featureSlug}
Response:
{
    "feature": {
        "id": "uuid",
        "slug": "advanced-analytics",
        "name": "Advanced Analytics",
        "description": "...",
        "icon": "📊",
        "category": "Analytics"
    }
}
```

---

## Examples: Implementing Each Feature

### 1️⃣ Advanced Analytics

**Backend:**
```php
Route::middleware('check-feature:advanced-analytics')->group(function () {
    Route::get('/analytics/dashboard', [AnalyticsController::class, 'dashboard']);
    Route::post('/analytics/export', [AnalyticsController::class, 'export']);
});
```

**Frontend:**
```jsx
<FeatureGate feature="advanced-analytics">
    <AnalyticsDashboard />
</FeatureGate>
```

---

### 2️⃣ Unlimited Users

**Backend (In User Creation Controller):**
```php
$currentUserCount = $tenant->users()->count();

if (!$user->hasFeature('unlimited-users')) {
    $limit = 5; // Free plan limit
    if ($currentUserCount >= $limit) {
        return response()->json([
            'error' => 'User limit reached. Upgrade to add more users.',
            'limit' => $limit,
            'current' => $currentUserCount
        ], 422);
    }
}
```

**Frontend (In User Management):**
```jsx
function UserManagement() {
    const { hasFeature } = useFeature('unlimited-users');
    const userCount = users.length;
    const limit = hasFeature ? Infinity : 5;

    return (
        <div>
            <p>Users: {userCount}/{limit === Infinity ? '∞' : limit}</p>
            {!hasFeature && userCount >= limit && (
                <button>Upgrade to Add More Users</button>
            )}
        </div>
    );
}
```

---

### 3️⃣ API Access

**Backend:**
```php
Route::middleware('check-feature:api-access')->group(function () {
    Route::apiResource('/api-keys', ApiKeyController::class);
    Route::apiResource('/webhooks', WebhookController::class);
});
```

**Frontend:**
```jsx
function IntegrationSettings() {
    const { has } = useFeatures();

    return (
        <div>
            {has('api-access') ? (
                <>
                    <ApiKeyManagement />
                    <WebhookSettings />
                </>
            ) : (
                <LockedFeature feature="api-access" />
            )}
        </div>
    );
}
```

---

## Testing Features

### Test Case 1: User WITHOUT Feature

```php
// Create user with FREE plan (no advanced features)
$user = User::factory()->create();
$tenant = Tenant::factory()->create(['user_id' => $user->id]);
$freePlan = SubscriptionPlan::where('slug', 'free')->first();
Subscription::create([
    'tenant_id' => $tenant->id,
    'plan_id' => $freePlan->id,
]);

// Test: Should NOT have advanced-analytics
$this->assertTrue(!$user->hasFeature('advanced-analytics'));

// Test: API request should fail
$this->actingAs($user)
    ->post('/api/analytics/export')
    ->assertStatus(403);
```

### Test Case 2: User WITH Feature

```php
// Create user with PROFESSIONAL plan (has advanced features)
$user = User::factory()->create();
$tenant = Tenant::factory()->create(['user_id' => $user->id]);
$proPlan = SubscriptionPlan::where('slug', 'professional')->first();
Subscription::create([
    'tenant_id' => $tenant->id,
    'plan_id' => $proPlan->id,
]);

// Test: SHOULD have advanced-analytics
$this->assertTrue($user->hasFeature('advanced-analytics'));

// Test: API request should succeed
$this->actingAs($user)
    ->get('/api/analytics/dashboard')
    ->assertStatus(200);
```

---

## Summary

✅ **Created:** 10 features in database (seeder)
✅ **Protected:** API endpoints with middleware
✅ **Checked:** Frontend with hooks and components
✅ **Service:** Feature checking service class
✅ **Documented:** Complete implementation guide

**Usage Flow:**
1. User subscribes to a plan
2. Plan has features assigned
3. System checks: Does user have feature X?
4. If YES: Show UI, allow API access
5. If NO: Hide UI, block API access, show upgrade prompt
