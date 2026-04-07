import React from 'react';

const statusClasses = {
    active: 'badge-active',
    inactive: 'badge-inactive',
    suspended: 'badge-suspended',
    trial: 'badge-trial',
};

const roleClasses = {
    super_admin: 'badge-super-admin',
    tenant_admin: 'badge-tenant-admin',
    staff: 'badge-staff',
};

const planClasses = {
    free: 'bg-gray-100 text-gray-700',
    starter: 'bg-blue-100 text-blue-700',
    professional: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-amber-100 text-amber-700',
};

export function StatusBadge({ status }) {
    const cls = statusClasses[status] || 'badge-inactive';
    return (
        <span className={`badge ${cls}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
            {status?.charAt(0).toUpperCase() + status?.slice(1)}
        </span>
    );
}

export function RoleBadge({ role }) {
    const cls = roleClasses[role] || 'badge-inactive';
    const labels = {
        super_admin: 'Super Admin',
        tenant_admin: 'Tenant Admin',
        staff: 'Staff',
    };
    return (
        <span className={`badge ${cls}`}>
            {labels[role] || role}
        </span>
    );
}

export function PlanBadge({ plan }) {
    const cls = planClasses[plan] || 'bg-gray-100 text-gray-700';
    return (
        <span className={`badge ${cls} capitalize`}>
            {plan}
        </span>
    );
}
