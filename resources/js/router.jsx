import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppLayout from './components/Layout/AppLayout';

// ── Auth pages ────────────────────────────────────────────────────────────────
import Landing  from './pages/Landing';
import Login    from './pages/Auth/Login';
import Signup   from './pages/Auth/Signup';
import Register from './pages/Auth/Register';

// ── Super Admin pages ─────────────────────────────────────────────────────────
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import TenantsPage         from './pages/SuperAdmin/Tenants';
import CentralUsersPage    from './pages/SuperAdmin/Users';
import FeaturesManager     from './pages/SuperAdmin/FeaturesManager';
import PlansManager        from './pages/SuperAdmin/PlansManager';
import FeatureAssignment   from './pages/SuperAdmin/FeatureAssignment';
import SettingsPage        from './pages/SuperAdmin/Settings';

// ── Tenant: Overview ──────────────────────────────────────────────────────────
import TenantDashboard from './pages/Tenant/Dashboard';

// ── Tenant: Users ─────────────────────────────────────────────────────────────
import TenantUsersPage from './pages/Tenant/Users';
import UserManagement from './pages/Tenant/Users/UserManagement';

// ── Tenant: Company ───────────────────────────────────────────────────────────
import CompanyOverview   from './pages/Tenant/Company/CompanyOverview';
import ProductsServices  from './pages/Tenant/Company/ProductsServices';
import OurClients        from './pages/Tenant/Company/OurClients';
import QualityStandards  from './pages/Tenant/Company/QualityStandards';

// ── Execution System ──────────────────────────────────────────────────────────
import RolesPage   from './pages/Tenant/Execution/Roles';
import RoleForm    from './pages/Tenant/Execution/RoleForm';
import MyTasksPage  from './pages/Tenant/Execution/MyTasks';
import MyRolesPage  from './pages/Tenant/MyRoles';
import TasksPage   from './pages/Tenant/Execution/Tasks';
import TaskDetail  from './pages/Tenant/Execution/TaskDetail';
import ReportsPage from './pages/Tenant/Execution/Reports';
import UserReports from './pages/Tenant/Execution/UserReports';

// ── Helpers ───────────────────────────────────────────────────────────────────

function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <svg className="w-8 h-8 text-primary spinner" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
                <p className="text-sm text-gray-500">Loading Great Leap…</p>
            </div>
        </div>
    );
}

function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (!user)   return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
    return children;
}

function PublicRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (user)    return <Navigate to="/dashboard" replace />;
    return children;
}

function DashboardPage() {
    const { user } = useAuth();
    if (!user) return null;
    return user.role === 'super_admin' ? <SuperAdminDashboard /> : <TenantDashboard />;
}

function UsersPage() {
    const { user } = useAuth();
    if (!user) return null;
    return user.role === 'super_admin' ? <CentralUsersPage /> : <TenantUsersPage />;
}

// ── Router ────────────────────────────────────────────────────────────────────

export default function AppRouter() {
    return (
        <Routes>
            {/* Landing & Public Auth */}
            <Route path="/"         element={<Landing />} />
            <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup"   element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* Protected shell - app routes */}
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />

                {/* Shared (role-dispatched) */}
                <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="users"     element={<ProtectedRoute allowedRoles={['tenant_admin','super_admin']}><UsersPage /></ProtectedRoute>} />

                {/* Super Admin only */}
                <Route path="tenants" element={<ProtectedRoute allowedRoles={['super_admin']}><TenantsPage /></ProtectedRoute>} />
                <Route path="features" element={<ProtectedRoute allowedRoles={['super_admin']}><FeaturesManager /></ProtectedRoute>} />
                <Route path="plans" element={<ProtectedRoute allowedRoles={['super_admin']}><PlansManager /></ProtectedRoute>} />
                <Route path="assign-features" element={<ProtectedRoute allowedRoles={['super_admin']}><FeatureAssignment /></ProtectedRoute>} />
                <Route path="settings" element={<ProtectedRoute allowedRoles={['super_admin']}><SettingsPage /></ProtectedRoute>} />

                {/* ── Tenant: User Management ───────────────────────────────*/}
                <Route path="team" element={<ProtectedRoute allowedRoles={['tenant_admin','staff']}><UserManagement /></ProtectedRoute>} />

                {/* ── Tenant: Company ───────────────────────────────────── */}
                <Route path="company">
                    <Route path="overview"  element={<ProtectedRoute allowedRoles={['tenant_admin','staff']}><CompanyOverview /></ProtectedRoute>} />
                    <Route path="products"  element={<ProtectedRoute allowedRoles={['tenant_admin','staff']}><ProductsServices /></ProtectedRoute>} />
                    <Route path="clients"   element={<ProtectedRoute allowedRoles={['tenant_admin','staff']}><OurClients /></ProtectedRoute>} />
                    <Route path="standards" element={<ProtectedRoute allowedRoles={['tenant_admin','staff']}><QualityStandards /></ProtectedRoute>} />
                    <Route path="roles"     element={<ProtectedRoute allowedRoles={['tenant_admin']}><RolesPage /></ProtectedRoute>} />
                    <Route path="roles/new" element={<ProtectedRoute allowedRoles={['tenant_admin']}><RoleForm /></ProtectedRoute>} />
                    <Route path="roles/:id" element={<ProtectedRoute allowedRoles={['tenant_admin']}><RoleForm /></ProtectedRoute>} />
                </Route>

                {/* ── My Roles (staff) ─────────────────────────────────── */}
                <Route path="my-roles" element={<ProtectedRoute allowedRoles={['staff']}><MyRolesPage /></ProtectedRoute>} />

                {/* ── Execution System ──────────────────────────────────── */}
                <Route path="execution">
                    <Route path="tasks"        element={<ProtectedRoute allowedRoles={['tenant_admin','staff']}><TasksPage /></ProtectedRoute>} />
                    <Route path="tasks/my"     element={<ProtectedRoute allowedRoles={['tenant_admin','staff']}><MyTasksPage /></ProtectedRoute>} />
                    <Route path="tasks/:id"    element={<ProtectedRoute allowedRoles={['tenant_admin','staff']}><TaskDetail /></ProtectedRoute>} />
                    <Route path="reports"      element={<ProtectedRoute allowedRoles={['tenant_admin','staff']}><ReportsPage /></ProtectedRoute>} />
                    <Route path="my-reports"   element={<ProtectedRoute allowedRoles={['tenant_admin','staff']}><UserReports /></ProtectedRoute>} />
                </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Routes>
    );
}
