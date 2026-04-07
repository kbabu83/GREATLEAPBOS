<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Central\DashboardController;
use App\Http\Controllers\Central\FeatureController;
use App\Http\Controllers\Central\SettingsController;
use App\Http\Controllers\Central\SubscriptionPlanController;
use App\Http\Controllers\Central\TenantController;
use App\Http\Controllers\Central\UserController;
use App\Http\Controllers\Central\DebugController;
use App\Http\Controllers\Tenant\UserPricingController;
use App\Http\Controllers\Tenant\PaymentController;
use App\Http\Controllers\Tenant\AttendancePolicyController;
use App\Http\Controllers\Tenant\BranchController;
use App\Http\Controllers\Tenant\ComplianceController;
use App\Http\Controllers\Tenant\DashboardController as TenantDashboardController;
use App\Http\Controllers\Tenant\DepartmentController;
use App\Http\Controllers\Tenant\DesignationController;
use App\Http\Controllers\Tenant\EmployeeController;
use App\Http\Controllers\Tenant\LeaveApplicationController;
use App\Http\Controllers\Tenant\LeavePolicyController;
use App\Http\Controllers\Tenant\OrganisationController;
use App\Http\Controllers\Tenant\PayrollPolicyController;
use App\Http\Controllers\Tenant\SalaryStructureController;
use App\Http\Controllers\Tenant\UserController as TenantUserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — single domain serves all user types
|--------------------------------------------------------------------------
| Central:  /api/*           → super_admin only
| Tenant:   /api/tenant/*    → tenant_admin / staff
|--------------------------------------------------------------------------
*/

// ── Public ────────────────────────────────────────────────────────────────────
Route::post('/auth/login',                    [AuthController::class, 'login']);

Route::get('/ping', [DebugController::class, 'ping']);

Route::post('/tenants/register',              [TenantController::class, 'register']);

// Password Reset via OTP
Route::post('/auth/password/request-otp',     [PasswordResetController::class, 'requestOtp']);
Route::post('/auth/password/verify-otp',      [PasswordResetController::class, 'verifyOtp']);
Route::post('/auth/password/reset-with-otp',  [PasswordResetController::class, 'resetPassword']);
Route::post('/auth/password/resend-otp',      [PasswordResetController::class, 'resendOtp']);
Route::get('/auth/password/check-otp-status',  [PasswordResetController::class, 'checkOtpStatus']);

// Razorpay Webhook (public, signature verified)
Route::post('/webhooks/razorpay', [PaymentController::class, 'webhook']);

// ── Authenticated ─────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Shared auth (all roles)
    Route::post('/auth/logout',          [AuthController::class, 'logout']);
    Route::get('/auth/me',               [AuthController::class, 'me']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

    // User/Tenant Features (all authenticated users)
    Route::get('/user/features', [\App\Http\Controllers\Tenant\FeatureCheckController::class, 'getUserFeatures']);
    Route::post('/user/features/{featureSlug}/check', [\App\Http\Controllers\Tenant\FeatureCheckController::class, 'checkFeature']);
    Route::post('/user/features/check-any', [\App\Http\Controllers\Tenant\FeatureCheckController::class, 'checkAnyFeature']);
    Route::get('/features/{featureSlug}', [\App\Http\Controllers\Tenant\FeatureCheckController::class, 'getFeatureDetails']);
    Route::get('/features', [\App\Http\Controllers\Tenant\FeatureCheckController::class, 'getAllFeatures']);

    // ── Super Admin ───────────────────────────────────────────────────────────
    Route::middleware('role:super_admin')->group(function () {
        Route::get('/dashboard',           [DashboardController::class, 'index']);
        Route::apiResource('/tenants',     TenantController::class);
        Route::post('/tenants/{id}/reset-password', [TenantController::class, 'resetAdminPassword']);
        Route::post('/tenants/{id}/toggle-status', [TenantController::class, 'toggleStatus']);
        Route::apiResource('/users',       UserController::class);

        // Features Management
        Route::prefix('features')->group(function () {
            Route::get('/', [FeatureController::class, 'index']);
            Route::post('/', [FeatureController::class, 'store']);
            Route::get('{feature}', [FeatureController::class, 'show']);
            Route::put('{feature}', [FeatureController::class, 'update']);
            Route::delete('{feature}', [FeatureController::class, 'destroy']);
            Route::get('by-module/{module}', [FeatureController::class, 'byModule']);
        });

        // Subscription Plans Management
        Route::prefix('plans')->group(function () {
            Route::get('/', [SubscriptionPlanController::class, 'index']);
            Route::post('/', [SubscriptionPlanController::class, 'store']);
            Route::get('{subscriptionPlan}', [SubscriptionPlanController::class, 'show']);
            Route::put('{subscriptionPlan}', [SubscriptionPlanController::class, 'update']);
            Route::delete('{subscriptionPlan}', [SubscriptionPlanController::class, 'destroy']);
            Route::post('{subscriptionPlan}/features/add', [SubscriptionPlanController::class, 'addFeature']);
            Route::post('{subscriptionPlan}/features/remove', [SubscriptionPlanController::class, 'removeFeature']);
            Route::post('{subscriptionPlan}/features/set', [SubscriptionPlanController::class, 'setFeatures']);
            Route::get('admin/statistics', [SubscriptionPlanController::class, 'statistics']);
            Route::post('{subscriptionPlan}/restore', [SubscriptionPlanController::class, 'restore']);
        });

        // Settings Management
        Route::prefix('settings')->group(function () {
            Route::get('/', [SettingsController::class, 'index']);
            Route::get('/section/{section}', [SettingsController::class, 'getSection']);
            Route::put('/', [SettingsController::class, 'update']);
            Route::put('/{key}', [SettingsController::class, 'updateSingle']);
            Route::post('/seed', [SettingsController::class, 'seed']);
        });
    });

    // ── Tenant (tenant_admin + staff) ─────────────────────────────────────────
    Route::prefix('tenant')->middleware('role:tenant_admin,staff')->group(function () {

        // Dashboard
        Route::get('/dashboard', [TenantDashboardController::class, 'index']);

        // Team members (portal users)
        Route::apiResource('/users', TenantUserController::class)->names('tenant.users');
        Route::post('/users/{user}/reset-password', [TenantUserController::class, 'resetPassword']);

        // User Subscription Pricing (Tenant Admin only)
        Route::middleware('role:tenant_admin')->group(function () {
            Route::get('/users/{user}/pricing', [UserPricingController::class, 'show']);
            Route::post('/users/{user}/pricing', [UserPricingController::class, 'store']);
            Route::put('/users/{user}/pricing/{userSubscriptionOverride}', [UserPricingController::class, 'update']);
            Route::delete('/users/{user}/pricing/{userSubscriptionOverride}', [UserPricingController::class, 'destroy']);
            Route::get('/pricing/report', [UserPricingController::class, 'report']);
            Route::get('/pricing/plans', [UserPricingController::class, 'getPlans']);
            Route::post('/pricing/bulk-upload', [UserPricingController::class, 'bulkUpload']);
        });

        // Payments & Invoices
        Route::prefix('payments')->group(function () {
            Route::post('/initiate', [PaymentController::class, 'initiate']);
            Route::post('/verify', [PaymentController::class, 'verify']);
            Route::get('/history', [PaymentController::class, 'listPayments']);
            Route::get('/{payment}', [PaymentController::class, 'showPayment']);
        });

        // Invoices
        Route::prefix('invoices')->group(function () {
            Route::get('/', [PaymentController::class, 'listInvoices']);
            Route::get('/{invoice}', [PaymentController::class, 'showInvoice']);
            Route::post('/{invoice}/send', [PaymentController::class, 'resendInvoice']);
            Route::get('/{invoice}/download', [PaymentController::class, 'downloadInvoice']);
        });

        // ── FEATURE-PROTECTED ROUTES ──────────────────────────────────────────
        // Feature checks are performed by middleware before reaching the controller

        // 1️⃣ Advanced Analytics (advanced-analytics)
        Route::middleware('check-feature:advanced-analytics')->group(function () {
            Route::prefix('analytics')->group(function () {
                Route::get('/dashboard', [\App\Http\Controllers\Tenant\AnalyticsController::class, 'dashboard']);
                Route::get('/data', [\App\Http\Controllers\Tenant\AnalyticsController::class, 'getData']);
                Route::post('/export', [\App\Http\Controllers\Tenant\AnalyticsController::class, 'export']);
            });
        });

        // 2️⃣ Custom Reports (custom-reports)
        Route::middleware('check-feature:custom-reports')->group(function () {
            Route::prefix('reports')->group(function () {
                Route::get('/', [\App\Http\Controllers\Tenant\ReportController::class, 'index']);
                Route::post('/', [\App\Http\Controllers\Tenant\ReportController::class, 'create']);
                Route::get('/{report}', [\App\Http\Controllers\Tenant\ReportController::class, 'show']);
                Route::post('/{report}/schedule', [\App\Http\Controllers\Tenant\ReportController::class, 'schedule']);
                Route::post('/{report}/export', [\App\Http\Controllers\Tenant\ReportController::class, 'exportReport']);
            });
        });

        // 3️⃣ Audit Logs (audit-logs)
        Route::middleware('check-feature:audit-logs')->group(function () {
            Route::prefix('audit-logs')->group(function () {
                Route::get('/', [\App\Http\Controllers\Tenant\AuditLogController::class, 'index']);
                Route::get('/{log}', [\App\Http\Controllers\Tenant\AuditLogController::class, 'show']);
                Route::post('/export', [\App\Http\Controllers\Tenant\AuditLogController::class, 'export']);
            });
        });

        // 4️⃣ Team Collaboration (team-collaboration)
        Route::middleware('check-feature:team-collaboration')->group(function () {
            Route::prefix('collaboration')->group(function () {
                Route::get('/workspaces', [\App\Http\Controllers\Tenant\CollaborationController::class, 'workspaces']);
                Route::post('/workspaces', [\App\Http\Controllers\Tenant\CollaborationController::class, 'createWorkspace']);
                Route::post('/{task}/comments', [\App\Http\Controllers\Tenant\CollaborationController::class, 'addComment']);
                Route::post('/{comment}/reply', [\App\Http\Controllers\Tenant\CollaborationController::class, 'replyComment']);
            });
        });

        // 5️⃣ API Access (api-access)
        Route::middleware('check-feature:api-access')->group(function () {
            Route::prefix('api-keys')->group(function () {
                Route::get('/', [\App\Http\Controllers\Tenant\ApiKeyController::class, 'index']);
                Route::post('/', [\App\Http\Controllers\Tenant\ApiKeyController::class, 'create']);
                Route::delete('/{apiKey}', [\App\Http\Controllers\Tenant\ApiKeyController::class, 'revoke']);
            });
            Route::prefix('webhooks')->group(function () {
                Route::get('/', [\App\Http\Controllers\Tenant\WebhookController::class, 'index']);
                Route::post('/', [\App\Http\Controllers\Tenant\WebhookController::class, 'create']);
                Route::get('/{webhook}/events', [\App\Http\Controllers\Tenant\WebhookController::class, 'events']);
            });
        });

        // 6️⃣ Advanced Permissions (advanced-permissions)
        Route::middleware('check-feature:advanced-permissions')->group(function () {
            Route::prefix('permissions')->group(function () {
                Route::get('/custom-roles', [\App\Http\Controllers\Tenant\PermissionController::class, 'customRoles']);
                Route::post('/custom-roles', [\App\Http\Controllers\Tenant\PermissionController::class, 'createRole']);
                Route::put('/custom-roles/{role}', [\App\Http\Controllers\Tenant\PermissionController::class, 'updateRole']);
                Route::post('/{user}/assign-role', [\App\Http\Controllers\Tenant\PermissionController::class, 'assignRole']);
            });
        });

        // 7️⃣ SSO Integration (sso-integration)
        Route::middleware('check-feature:sso-integration')->group(function () {
            Route::prefix('sso')->group(function () {
                Route::get('/settings', [\App\Http\Controllers\Tenant\SsoController::class, 'settings']);
                Route::post('/settings', [\App\Http\Controllers\Tenant\SsoController::class, 'updateSettings']);
                Route::get('/saml/metadata', [\App\Http\Controllers\Tenant\SsoController::class, 'samlMetadata']);
            });
        });

        // 8️⃣ Custom Branding (custom-branding)
        Route::middleware('check-feature:custom-branding')->group(function () {
            Route::prefix('branding')->group(function () {
                Route::get('/settings', [\App\Http\Controllers\Tenant\BrandingController::class, 'settings']);
                Route::post('/settings', [\App\Http\Controllers\Tenant\BrandingController::class, 'updateSettings']);
                Route::post('/logo', [\App\Http\Controllers\Tenant\BrandingController::class, 'uploadLogo']);
                Route::post('/custom-domain', [\App\Http\Controllers\Tenant\BrandingController::class, 'setDomain']);
            });
        });

        // 9️⃣ Mobile App Access (mobile-app) - Simple feature check
        Route::middleware('check-feature:mobile-app')->group(function () {
            Route::prefix('mobile')->group(function () {
                Route::get('/config', [\App\Http\Controllers\Tenant\MobileController::class, 'config']);
                Route::post('/device-token', [\App\Http\Controllers\Tenant\MobileController::class, 'registerDevice']);
            });
        });

        // 🔟 Unlimited Users (unlimited-users) - Checked in controller logic
        // No separate routes, but checked in user creation controller

        // ── Phase 1: Organisation Setup ───────────────────────────────────────

        // Organisation profile
        Route::get('/organisation',    [OrganisationController::class, 'show']);
        Route::put('/organisation',    [OrganisationController::class, 'update']);

        // Branches
        Route::apiResource('/branches', BranchController::class)->names('tenant.branches');

        // Departments
        Route::apiResource('/departments', DepartmentController::class)->names('tenant.departments');

        // Designations
        Route::apiResource('/designations', DesignationController::class)->names('tenant.designations');

        // Employees
        Route::apiResource('/employees', EmployeeController::class)->names('tenant.employees');
        Route::patch('/employees/{employee}/status', [EmployeeController::class, 'updateStatus']);

        // ── Policies ──────────────────────────────────────────────────────────

        // Attendance Policies
        Route::apiResource('/attendance-policies', AttendancePolicyController::class)->names('tenant.attendance-policies');
        Route::patch('/attendance-policies/{attendancePolicy}/set-default',
                     [AttendancePolicyController::class, 'setDefault']);

        // Leave Policies + nested Leave Types
        Route::apiResource('/leave-policies', LeavePolicyController::class)->names('tenant.leave-policies');
        Route::post(  '/leave-policies/{leavePolicy}/leave-types',
                      [LeavePolicyController::class, 'storeLeaveType']);
        Route::put(   '/leave-policies/{leavePolicy}/leave-types/{leaveType}',
                      [LeavePolicyController::class, 'updateLeaveType']);
        Route::delete('/leave-policies/{leavePolicy}/leave-types/{leaveType}',
                      [LeavePolicyController::class, 'destroyLeaveType']);

        // Payroll Policies
        Route::apiResource('/payroll-policies', PayrollPolicyController::class)->names('tenant.payroll-policies');
        Route::patch('/payroll-policies/{payrollPolicy}/set-default',
                     [PayrollPolicyController::class, 'setDefault']);

        // Salary Structures + nested Components
        Route::apiResource('/salary-structures', SalaryStructureController::class)->names('tenant.salary-structures');
        Route::post(  '/salary-structures/{salaryStructure}/components',
                      [SalaryStructureController::class, 'storeComponent']);
        Route::put(   '/salary-structures/{salaryStructure}/components/{salaryComponent}',
                      [SalaryStructureController::class, 'updateComponent']);
        Route::delete('/salary-structures/{salaryStructure}/components/{salaryComponent}',
                      [SalaryStructureController::class, 'destroyComponent']);
        Route::patch( '/salary-structures/{salaryStructure}/reorder',
                      [SalaryStructureController::class, 'reorderComponents']);

        // Compliance Settings (single record per tenant)
        Route::get('/compliance', [ComplianceController::class, 'show']);
        Route::put('/compliance', [ComplianceController::class, 'update']);

        // ── Leave Applications ────────────────────────────────────────────────

        // Specific named routes before the parameterised ones
        Route::get( '/leave-applications/pending-my-approval',  [LeaveApplicationController::class, 'pendingMyApproval']);
        Route::get( '/leave-applications/balance-summary',      [LeaveApplicationController::class, 'balanceSummary']);

        Route::get(   '/leave-applications',                                [LeaveApplicationController::class, 'index']);
        Route::post(  '/leave-applications',                                [LeaveApplicationController::class, 'store']);
        Route::get(   '/leave-applications/{leaveApplication}',             [LeaveApplicationController::class, 'show']);
        Route::patch( '/leave-applications/{leaveApplication}/approve',     [LeaveApplicationController::class, 'approve']);
        Route::patch( '/leave-applications/{leaveApplication}/reject',      [LeaveApplicationController::class, 'reject']);
        Route::patch( '/leave-applications/{leaveApplication}/cancel',      [LeaveApplicationController::class, 'cancel']);
        Route::patch( '/leave-applications/{leaveApplication}/withdraw',    [LeaveApplicationController::class, 'withdraw']);

        // ── Execution System ──────────────────────────────────────────────────────

        // Roles
        Route::get( '/execution/roles',                                              [\App\Http\Controllers\Execution\RoleController::class, 'index']);
        Route::post('/execution/roles',                                              [\App\Http\Controllers\Execution\RoleController::class, 'store']);
        Route::get( '/execution/roles/{esRole}',                                     [\App\Http\Controllers\Execution\RoleController::class, 'show']);
        Route::put( '/execution/roles/{esRole}',                                     [\App\Http\Controllers\Execution\RoleController::class, 'update']);
        Route::delete('/execution/roles/{esRole}',                                   [\App\Http\Controllers\Execution\RoleController::class, 'destroy']);

        // Role → Areas (individual CRUD)
        Route::post(  '/execution/roles/{esRole}/areas',                             [\App\Http\Controllers\Execution\RoleController::class, 'storeArea']);
        Route::put(   '/execution/roles/{esRole}/areas/{area}',                      [\App\Http\Controllers\Execution\RoleController::class, 'updateArea']);
        Route::delete('/execution/roles/{esRole}/areas/{area}',                      [\App\Http\Controllers\Execution\RoleController::class, 'destroyArea']);

        // Role → Activities (individual CRUD)
        Route::post(  '/execution/roles/{esRole}/activities',                        [\App\Http\Controllers\Execution\RoleController::class, 'storeActivity']);
        Route::put(   '/execution/roles/{esRole}/activities/{activity}',             [\App\Http\Controllers\Execution\RoleController::class, 'updateActivity']);
        Route::delete('/execution/roles/{esRole}/activities/{activity}',             [\App\Http\Controllers\Execution\RoleController::class, 'destroyActivity']);

        // Tasks – special routes before {esTask}
        Route::get('/execution/tasks/my',    [\App\Http\Controllers\Execution\TaskController::class, 'myTasks']);
        Route::get('/execution/tasks/staff', [\App\Http\Controllers\Execution\TaskController::class, 'staffTasks']);
        Route::get('/execution/tasks/team',  [\App\Http\Controllers\Execution\TaskController::class, 'teamTasks']);

        // Tasks CRUD
        Route::get( '/execution/tasks',                          [\App\Http\Controllers\Execution\TaskController::class, 'index']);
        Route::post('/execution/tasks',                          [\App\Http\Controllers\Execution\TaskController::class, 'store']);
        Route::get( '/execution/tasks/{esTask}',                 [\App\Http\Controllers\Execution\TaskController::class, 'show']);
        Route::put( '/execution/tasks/{esTask}',                 [\App\Http\Controllers\Execution\TaskController::class, 'update']);
        Route::delete('/execution/tasks/{esTask}',               [\App\Http\Controllers\Execution\TaskController::class, 'destroy']);

        // Task actions
        Route::post('/execution/tasks/{esTask}/complete',        [\App\Http\Controllers\Execution\TaskController::class, 'complete']);
        Route::post('/execution/tasks/{esTask}/notes',           [\App\Http\Controllers\Execution\TaskController::class, 'addNote']);
        Route::post('/execution/tasks/{esTask}/time-logs',       [\App\Http\Controllers\Execution\TaskController::class, 'logTime']);
        Route::patch('/execution/tasks/{esTask}/time-logs/{logId}/stop', [\App\Http\Controllers\Execution\TaskController::class, 'stopTimer']);
        Route::post('/execution/tasks/{esTask}/reviews',         [\App\Http\Controllers\Execution\TaskController::class, 'addReview']);
        Route::post('/execution/tasks/{esTask}/observers',       [\App\Http\Controllers\Execution\TaskController::class, 'addObserver']);
        Route::delete('/execution/tasks/{esTask}/observers/{userId}', [\App\Http\Controllers\Execution\TaskController::class, 'removeObserver']);
        Route::get('/execution/tasks/{esTask}/activity-log',     [\App\Http\Controllers\Execution\TaskController::class, 'activityLog']);

        // Deadline change requests
        Route::post('/execution/tasks/{esTask}/request-deadline-change', [\App\Http\Controllers\Execution\TaskController::class, 'requestDeadlineChange']);
        Route::get('/execution/deadline-changes/pending',        [\App\Http\Controllers\Execution\TaskController::class, 'managerDeadlineChanges']);
        Route::post('/execution/tasks/{esTask}/approve-deadline-change', [\App\Http\Controllers\Execution\TaskController::class, 'approveDeadlineChange']);

        // Reports & Analytics
        Route::get('/execution/reports/time-spent',              [\App\Http\Controllers\Execution\ReportController::class, 'timeSpentByUser']);
        Route::get('/execution/reports/task-completion',         [\App\Http\Controllers\Execution\ReportController::class, 'taskCompletionByUser']);
        Route::get('/execution/reports/deadline-performance',    [\App\Http\Controllers\Execution\ReportController::class, 'deadlinePerformance']);
        Route::get('/execution/reports/team-summary',            [\App\Http\Controllers\Execution\ReportController::class, 'teamSummary']);
        Route::get('/execution/reports/daily-tracking',          [\App\Http\Controllers\Execution\ReportController::class, 'dailyTimeTracking']);
        Route::get('/execution/reports/task-priority',           [\App\Http\Controllers\Execution\ReportController::class, 'taskPriority']);
    });
});
