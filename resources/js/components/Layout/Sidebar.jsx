import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// ── Icon components ───────────────────────────────────────────────────────────

const Icon = ({ d, className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);

const icons = {
    dashboard:  'M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z',
    target:     'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
    task:       'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    mytask:     'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    users:      'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    tenants:    'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    reports:    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    chevron:    'M19 9l-7 7-7-7',
    logout:     'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
    // Company section
    overview:   'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    products:   'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    clients:    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    standards:  'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
};

// ── Nav item (leaf) ───────────────────────────────────────────────────────────
function NavItem({ to, icon, label, onClick }) {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                 ${isActive
                    ? 'bg-lime-500/20 text-lime-700 dark:text-lime-300 border-l-2 border-lime-500 dark:border-lime-400'
                    : 'text-gray-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-300 hover:bg-gray-100 dark:hover:bg-slate-800/50'}`
            }
        >
            <Icon d={icons[icon]} />
            <span>{label}</span>
        </NavLink>
    );
}

// ── Collapsible nav group ─────────────────────────────────────────────────────
function NavGroup({ icon, label, children, defaultOpen = false }) {
    const location = useLocation();
    const childPaths = React.Children.map(children, c => c?.props?.to) ?? [];
    const isAnyActive = childPaths.some(p => p && location.pathname.startsWith(p));
    const [open, setOpen] = useState(defaultOpen || isAnyActive);

    return (
        <div>
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium
                           text-gray-700 dark:text-slate-300 hover:text-lime-600 dark:hover:text-lime-300 hover:bg-gray-100 dark:hover:bg-slate-800/50 transition-colors"
            >
                <Icon d={icons[icon]} />
                <span className="flex-1 text-left">{label}</span>
                <Icon
                    d={icons.chevron}
                    className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open && (
                <div className="ml-4 mt-0.5 border-l border-gray-300 dark:border-white/10 pl-3 space-y-0.5">
                    {children}
                </div>
            )}
        </div>
    );
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ label }) {
    return (
        <p className="px-4 pt-4 pb-1 text-[10px] font-semibold text-lime-600 dark:text-lime-400/60 uppercase tracking-widest">
            {label}
        </p>
    );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar({ open, onClose }) {
    const { user, logout, isTenant, tenantName } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <aside className={`
            fixed inset-y-0 left-0 z-30 w-64 flex flex-col
            bg-gradient-to-b from-white to-gray-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950
            transform transition-transform duration-300 ease-in-out
            lg:relative lg:translate-x-0 lg:z-auto
            ${open ? 'translate-x-0' : '-translate-x-full'}
            border-r border-gray-100 dark:border-slate-700/50
        `}>
            {/* Logo / Brand */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-slate-700/50">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-lime-400 to-teal-600 flex items-center justify-center flex-shrink-0 font-bold text-slate-900 text-sm">
                    GL
                </div>
                <div className="min-w-0">
                    <p className="text-gray-900 dark:text-white font-bold text-sm leading-tight truncate">
                        GREAT LEAP
                    </p>
                    <p className="text-gray-600 dark:text-slate-400 text-xs">
                        {isTenant ? tenantName || 'Portal' : 'Admin'}
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">

                {/* ── Super Admin nav ─────────────────────────────────────── */}
                {!isTenant && (
                    <>
                        <SectionLabel label="Overview" />
                        <NavItem to="/app/dashboard" icon="dashboard" label="Dashboard" onClick={onClose} />

                        <SectionLabel label="Management" />
                        <NavItem to="/app/tenants" icon="tenants" label="Tenants" onClick={onClose} />
                        <NavItem to="/app/users"   icon="users"   label="Platform Users" onClick={onClose} />

                        <SectionLabel label="Billing & Features" />
                        <NavItem to="/app/features"   icon="standards"   label="Features" onClick={onClose} />
                        <NavItem to="/app/plans"   icon="products"   label="Subscription Plans" onClick={onClose} />
                        <NavItem to="/app/assign-features"   icon="target"   label="Assign Features" onClick={onClose} />

                        <SectionLabel label="Configuration" />
                        <NavItem to="/app/settings"   icon="standards"   label="Settings" onClick={onClose} />
                    </>
                )}

                {/* ── Tenant nav ──────────────────────────────────────────── */}
                {isTenant && (
                    <>
                        <SectionLabel label="Overview" />
                        <NavItem to="/dashboard" icon="dashboard" label="Dashboard" onClick={onClose} />

                        <SectionLabel label="Company" />
                        <NavItem to="/app/company/overview"   icon="overview"   label="Company Overview"    onClick={onClose} />
                        <NavItem to="/app/company/products"   icon="products"   label="Products & Services"  onClick={onClose} />
                        <NavItem to="/app/company/clients"    icon="clients"    label="Our Clients"          onClick={onClose} />
                        <NavItem to="/app/company/standards"  icon="standards"  label="Standards & Goals"    onClick={onClose} />

                        {user?.role === 'tenant_admin' && (
                            <>
                                <SectionLabel label="People" />
                                <NavItem to="/app/team" icon="users" label="👥 Team Members" onClick={onClose} />
                                <NavItem to="/company/roles" icon="target" label="Roles" onClick={onClose} />
                            </>
                        )}

                        <SectionLabel label="Execution System" />
                        {user?.role === 'staff' && (
                            <>
                                <NavItem to="/app/my-roles"           icon="target" label="My Roles"  onClick={onClose} />
                                <NavItem to="/app/execution/tasks/my" icon="mytask" label="My Tasks"  onClick={onClose} />
                                <NavItem to="/app/execution/my-reports" icon="reports" label="My Reports" onClick={onClose} />
                            </>
                        )}
                        {user?.role === 'tenant_admin' && (
                            <>
                                <NavItem to="/app/execution/tasks/my" icon="mytask" label="My Tasks"  onClick={onClose} />
                                <NavItem to="/app/execution/tasks"    icon="task"   label="All Tasks" onClick={onClose} />
                                <NavItem to="/app/execution/my-reports" icon="reports" label="My Reports" onClick={onClose} />
                                <NavItem to="/app/execution/reports" icon="reports" label="Team Analytics" onClick={onClose} />
                            </>
                        )}
                    </>
                )}
            </nav>

            {/* User footer */}
            <div className="border-t border-gray-100 dark:border-slate-700/50 px-3 py-3">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400 to-teal-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-slate-900 text-xs font-bold">
                            {user?.name?.charAt(0)?.toUpperCase()}
                        </span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-gray-900 dark:text-white text-xs font-medium truncate">{user?.name}</p>
                        <p className="text-gray-500 dark:text-white/45 text-xs truncate">{user?.role_display}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm
                               text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                    <Icon d={icons.logout} />
                    <span>Sign out</span>
                </button>
            </div>
        </aside>
    );
}
