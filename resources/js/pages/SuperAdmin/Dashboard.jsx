import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { StatCard, Card } from '../../components/UI/Card';
import { StatusBadge, PlanBadge } from '../../components/UI/Badge';
import api from '../../services/api';

const BRAND_COLORS = ['#1A526D', '#8CC63E', '#0C9345', '#4F96BB', '#7AB036', '#68B17E'];

function BuildingIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
    );
}

function UserGroupIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
    );
}

function CheckCircleIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white rounded-lg shadow-card-hover border border-gray-100 p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
                {payload.map((entry) => (
                    <p key={entry.name} className="text-sm font-semibold" style={{ color: entry.color }}>
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function SuperAdminDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.get('/dashboard')
            .then((res) => setData(res.data))
            .catch((err) => {
                console.error('Dashboard API error:', err);
                setError(err?.response?.data?.message || 'Failed to load dashboard data.');
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="stat-card animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm">
                <strong>Error loading dashboard:</strong> {error}
            </div>
        );
    }

    // Safe stat accessors — double optional chain guards against null data AND null stats
    const stats = data?.stats ?? {};
    const totalTenants      = stats.total_tenants      ?? 0;
    const activeTenants     = stats.active_tenants     ?? 0;
    const trialTenants      = stats.trial_tenants      ?? 0;
    const totalTenantUsers  = stats.total_tenant_users ?? 0;

    const planData = data?.tenants_by_plan
        ? Object.entries(data.tenants_by_plan).map(([plan, count]) => ({
            name: plan.charAt(0).toUpperCase() + plan.slice(1),
            value: count,
        }))
        : [];

    const statusData = data?.tenants_by_status
        ? Object.entries(data.tenants_by_status).map(([status, count]) => ({
            name: status.charAt(0).toUpperCase() + status.slice(1),
            count,
        }))
        : [];

    const monthlyData = data?.monthly_registrations ?? [];
    const recentTenants = data?.recent_tenants ?? [];

    return (
        <div className="space-y-6 fade-in">
            <div className="page-header">
                <h1 className="page-title">Overview</h1>
                <p className="page-subtitle">Platform-wide stats and activity</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Total Tenants"
                    value={totalTenants}
                    subtitle="All registered organizations"
                    icon={<BuildingIcon />}
                    color="primary"
                />
                <StatCard
                    title="Active Tenants"
                    value={activeTenants}
                    subtitle={`${trialTenants} on trial`}
                    icon={<CheckCircleIcon />}
                    color="accent"
                />
                <StatCard
                    title="Total Users"
                    value={totalTenantUsers}
                    subtitle="Across all tenants"
                    icon={<UserGroupIcon />}
                    color="secondary"
                />
                <StatCard
                    title="Trial Tenants"
                    value={trialTenants}
                    subtitle="Conversion opportunities"
                    icon={<ClockIcon />}
                    color="amber"
                />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Registration trend */}
                <Card title="New Registrations" className="lg:col-span-2">
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={monthlyData}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#1A526D" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#1A526D" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="count"
                                name="New Tenants"
                                stroke="#1A526D"
                                strokeWidth={2.5}
                                fill="url(#colorCount)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>

                {/* Tenants by plan */}
                <Card title="Tenants by Plan">
                    {planData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie
                                    data={planData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {planData.map((_, index) => (
                                        <Cell key={index} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [value, name]} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-60 flex items-center justify-center text-gray-400 text-sm">No plan data yet</div>
                    )}
                </Card>
            </div>

            {/* Status bar chart + Recent tenants */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tenants by status */}
                <Card title="Tenants by Status">
                    {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={statusData} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
                                    {statusData.map((entry, index) => (
                                        <Cell key={index} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No status data yet</div>
                    )}
                </Card>

                {/* Recent tenants */}
                <Card title="Recent Tenants" className="lg:col-span-2">
                    <div className="space-y-3">
                        {recentTenants.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">No tenants yet</p>
                        )}
                        {recentTenants.map((tenant) => (
                            <div key={tenant.id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary font-bold text-sm">
                                        {tenant.name?.charAt(0)?.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{tenant.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{tenant.domain}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <PlanBadge plan={tenant.plan} />
                                    <StatusBadge status={tenant.status} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
