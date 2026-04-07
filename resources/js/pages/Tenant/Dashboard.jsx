import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Legend,
} from 'recharts';
import { StatCard, Card } from '../../components/UI/Card';
import { RoleBadge } from '../../components/UI/Badge';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// ── Shared atoms ──────────────────────────────────────────────────────────────

const PRIORITY_COLOR = { urgent: '#ef4444', high: '#f97316', medium: '#eab308', low: '#94a3b8' };
const PRIORITY_CLS   = { urgent: 'bg-red-950/40 text-red-400', high: 'bg-orange-950/40 text-orange-400', medium: 'bg-yellow-950/40 text-yellow-400', low: 'bg-slate-700/40 text-slate-300' };
const STATUS_CLS     = { pending: 'bg-slate-700/40 text-slate-300', in_progress: 'bg-teal-950/40 text-teal-400', completed: 'bg-green-950/40 text-green-400', cancelled: 'bg-slate-700/40 text-slate-400' };
const STATUS_LABEL   = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' };
const BRAND          = ['#0d9488', '#8CC63E', '#0C9345', '#4F96BB'];
const FREQ_COLOR     = { daily: 'text-teal-400 bg-teal-950/40', weekly: 'text-green-400 bg-green-950/40', monthly: 'text-purple-400 bg-purple-950/40', quarterly: 'text-orange-400 bg-orange-950/40', yearly: 'text-red-400 bg-red-950/40' };

function Chip({ label, cls }) {
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

const CustomTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-slate-800/90 rounded-lg shadow-lg border border-gray-300 dark:border-slate-700/50 p-3 text-xs">
            <p className="font-medium text-gray-700 dark:text-slate-400 mb-1">{label}</p>
            {payload.map(e => (
                <p key={e.name} style={{ color: e.color }} className="font-semibold">
                    {e.name}: {e.value}
                </p>
            ))}
        </div>
    );
};

function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function fmtHours(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ── Stat tile ─────────────────────────────────────────────────────────────────
function Tile({ label, value, sub, color = 'blue', icon, onClick }) {
    const colors = {
        blue:   { bg: 'bg-blue-50 dark:bg-slate-800/50',   icon: 'bg-blue-600',   val: 'text-blue-600 dark:text-blue-400',   border: 'border-blue-200 dark:border-slate-700/50'   },
        green:  { bg: 'bg-green-50 dark:bg-slate-800/50',  icon: 'bg-green-600',  val: 'text-green-600 dark:text-green-400',  border: 'border-green-200 dark:border-slate-700/50'  },
        red:    { bg: 'bg-red-50 dark:bg-slate-800/50',    icon: 'bg-red-600',    val: 'text-red-600 dark:text-red-400',    border: 'border-red-200 dark:border-slate-700/50'    },
        orange: { bg: 'bg-orange-50 dark:bg-slate-800/50', icon: 'bg-orange-600', val: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-slate-700/50' },
        gray:   { bg: 'bg-gray-100 dark:bg-slate-800/50',   icon: 'bg-slate-600',   val: 'text-gray-700 dark:text-slate-300',   border: 'border-gray-300 dark:border-slate-700/50'   },
        teal:   { bg: 'bg-teal-50 dark:bg-slate-800/50',   icon: 'bg-teal-600',   val: 'text-teal-600 dark:text-teal-400',   border: 'border-teal-200 dark:border-slate-700/50'   },
    };
    const c = colors[color] || colors.blue;
    return (
        <div onClick={onClick}
            className={`${c.bg} rounded-xl border ${c.border} p-4 flex items-center gap-3.5 ${onClick ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 hover:border-gray-400 dark:hover:border-slate-600 transition-all' : ''}`}>
            <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <span className="text-white text-base">{icon}</span>
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-gray-700 dark:text-slate-400 uppercase tracking-wider leading-tight">{label}</p>
                <p className={`text-2xl font-bold tabular-nums mt-0.5 ${c.val}`}>{value ?? '—'}</p>
                {onClick && <p className="text-[10px] text-gray-600 dark:text-slate-500 mt-0.5">Click to filter ↗</p>}
            </div>
        </div>
    );
}

// ── STAFF DASHBOARD ───────────────────────────────────────────────────────────

const PERIODS = [
    { value: 'day',   label: 'Today' },
    { value: 'week',  label: 'This Week' },
    { value: 'month', label: 'This Month' },
];

function StaffDashboard() {
    const navigate     = useNavigate();
    const { user: me } = useAuth();
    const [period, setPeriod] = useState('week');
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [roleTab, setRoleTab] = useState('areas');       // areas | activities | skills | performance
    const [activeRoleIdx, setActiveRoleIdx] = useState(0); // which role is selected when multiple

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/tenant/dashboard?period=${period}`);
            setData(res.data);
            setActiveRoleIdx(0);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [period]);

    useEffect(() => { load(); }, [load]);

    const ts    = data?.task_stats || {};
    const roles = data?.es_roles   || [];
    const role  = roles[activeRoleIdx] || null;

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    if (loading && !data) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6 bg-gradient-to-b from-white to-gray-50 dark:from-slate-900 dark:to-slate-900/50 min-h-screen">

            {/* ── Header ──────────────────────────────────────────────── */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {greeting()}, {me?.name?.split(' ')[0]}
                    </h1>
                    <p className="text-sm text-gray-700 dark:text-slate-400 mt-0.5">
                        {fmtDate(new Date().toISOString())}
                        {data?.user?.department && ` · ${data.user.department}`}
                        {me?.last_login_at && ` · Last login ${fmtTime(me.last_login_at)}`}
                    </p>
                </div>
                {/* Period selector */}
                <div className="flex bg-gray-200 dark:bg-slate-800/50 rounded-lg p-1 gap-1 border border-gray-400 dark:border-slate-700/30">
                    {PERIODS.map(p => (
                        <button key={p.value} onClick={() => setPeriod(p.value)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                period === p.value ? 'bg-teal-100 dark:bg-teal-600/30 shadow-sm text-teal-700 dark:text-teal-400 border border-teal-300 dark:border-teal-700/50' : 'text-gray-700 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300 border border-transparent'
                            }`}>
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Task stat tiles ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <Tile label="Total Tasks"   value={ts.total}               icon="📋" color="blue"   onClick={() => navigate('/app/execution/tasks/my')} />
                <Tile label="In Progress"   value={ts.in_progress}         icon="⚡" color="teal"   onClick={() => navigate('/app/execution/tasks/my?status=in_progress')} />
                <Tile label="Pending"       value={ts.pending}             icon="⏳" color="gray"   onClick={() => navigate('/app/execution/tasks/my?status=pending')} />
                <Tile label="Overdue"       value={ts.overdue}             icon="🔴" color="red"    onClick={() => navigate('/app/execution/tasks/my?overdue=1')} />
                <Tile label={`Done · ${PERIODS.find(p=>p.value===period)?.label}`} value={ts.completed_in_period} icon="✅" color="green" onClick={() => navigate('/app/execution/tasks/my?tab=completed')} />
                <Tile label="Hours Logged"  value={`${ts.hours_logged ?? 0}h`} icon="⏱" color="orange" />
            </div>

            {/* ── Charts row ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Time chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-900 dark:text-slate-200 text-sm">Hours Logged — {PERIODS.find(p=>p.value===period)?.label}</h2>
                        {loading && <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />}
                    </div>
                    {data?.time_chart?.some(d => d.minutes > 0) ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={data.time_chart} barSize={period === 'month' ? 8 : 20}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    interval={period === 'month' ? 4 : 0} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit="h" />
                                <Tooltip content={<CustomTip />} formatter={v => [`${v}h`, 'Hours']} />
                                <Bar dataKey="hours" name="Hours" fill="#0d9488" radius={[3, 3, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-gray-600 dark:text-slate-500 text-sm">
                            No time logged {PERIODS.find(p=>p.value===period)?.label.toLowerCase()}
                        </div>
                    )}
                </div>

                {/* Status donut */}
                <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm p-5">
                    <h2 className="font-semibold text-gray-900 dark:text-slate-200 text-sm mb-4">Task Breakdown</h2>
                    {ts.total > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie data={data?.status_breakdown || []} dataKey="count" nameKey="status"
                                        cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2}>
                                        {(data?.status_breakdown || []).map((e, i) => (
                                            <Cell key={i} fill={e.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v, n) => [v, n]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
                                {(data?.status_breakdown || []).filter(e => e.count > 0).map((e, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
                                        <span className="text-xs text-gray-700 dark:text-slate-400 truncate">{e.status}</span>
                                        <span className="text-xs font-semibold text-gray-900 dark:text-slate-200 ml-auto">{e.count}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-gray-600 dark:text-slate-500 text-sm">No tasks yet</div>
                    )}
                </div>
            </div>

            {/* ── Active tasks + login activity ────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Upcoming / active tasks */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700/30 bg-gray-50 dark:bg-slate-800/30">
                        <h2 className="font-semibold text-gray-900 dark:text-slate-200 text-sm">My Active Tasks</h2>
                        <button onClick={() => navigate('/app/execution/tasks/my')}
                            className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline">View all →</button>
                    </div>
                    {data?.upcoming_tasks?.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-slate-700/30">
                            {data.upcoming_tasks.map(task => (
                                <div key={task.id}
                                    onClick={() => navigate(`/app/execution/tasks/${task.id}`)}
                                    className="flex items-start gap-3 px-5 py-3 hover:bg-gray-100 dark:hover:bg-slate-700/30 cursor-pointer transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{task.title}</p>
                                            {task.is_overdue && <Chip label="Overdue" cls="bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400" />}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            {task.area     && <span className="text-xs text-gray-700 dark:text-slate-400">{task.area}</span>}
                                            {task.activity && <span className="text-xs text-gray-700 dark:text-slate-400">· {task.activity}</span>}
                                            {task.due_date && (
                                                <span className={`text-xs ${task.is_overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-700 dark:text-slate-400'}`}>
                                                    Due {fmtDate(task.due_date)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5 flex-shrink-0 items-start pt-0.5">
                                        <Chip label={STATUS_LABEL[task.status] || task.status} cls={STATUS_CLS[task.status] || ''} />
                                        <Chip label={task.priority} cls={PRIORITY_CLS[task.priority] || ''} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32 text-gray-600 dark:text-slate-500 text-sm">
                            No active tasks — great work!
                        </div>
                    )}
                </div>

                {/* Login activity */}
                <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700/30 bg-gray-50 dark:bg-slate-800/30">
                        <h2 className="font-semibold text-gray-900 dark:text-slate-200 text-sm">Login Activity</h2>
                    </div>
                    {data?.login_activity?.length > 0 ? (
                        <div className="divide-y divide-slate-700/30">
                            {data.login_activity.map((ts, i) => (
                                <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i === 0 ? 'bg-green-500' : 'bg-gray-400 dark:bg-slate-700'}`} />
                                    <div>
                                        <p className="text-xs font-medium text-gray-900 dark:text-slate-300">
                                            {new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </p>
                                        <p className="text-xs text-gray-700 dark:text-slate-400">
                                            {new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    {i === 0 && <span className="ml-auto text-xs text-green-400 font-medium">Latest</span>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32 text-gray-600 dark:text-slate-500 text-sm">No login history</div>
                    )}
                </div>
            </div>

            {/* ── My Roles ─────────────────────────────────────────────── */}
            {roles.length > 0 ? (
                <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    {/* Role header */}
                    <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700/30 bg-gradient-to-r from-teal-50 dark:from-teal-900/20 to-transparent">
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-xs font-semibold text-gray-700 dark:text-slate-400 uppercase tracking-wide">
                                My Roles {roles.length > 1 && <span className="ml-1 bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 rounded-full px-1.5 border border-teal-300 dark:border-teal-700/30">{roles.length}</span>}
                            </p>
                        </div>
                        {/* Role selector tabs (when multiple) */}
                        {roles.length > 1 && (
                            <div className="flex gap-2 flex-wrap mb-3">
                                {roles.map((r, i) => (
                                    <button key={r.id} onClick={() => { setActiveRoleIdx(i); setRoleTab('areas'); }}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                            activeRoleIdx === i
                                                ? 'bg-teal-100 dark:bg-teal-600/30 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700/50'
                                                : 'bg-gray-200 dark:bg-slate-700/30 text-gray-700 dark:text-slate-400 border-gray-400 dark:border-slate-600/50 hover:border-teal-400 dark:hover:border-teal-700/50 hover:text-teal-700 dark:hover:text-teal-400'
                                        }`}>
                                        {r.name}
                                    </button>
                                ))}
                            </div>
                        )}
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{role.name}</h2>
                        {role.reporting_role && (
                            <p className="text-xs text-gray-700 dark:text-slate-400 mt-0.5">Reports to: <span className="font-medium text-gray-900 dark:text-slate-300">{role.reporting_role}</span></p>
                        )}
                        {role.purpose && (
                            <p className="text-sm text-gray-800 dark:text-slate-300 mt-2 leading-relaxed max-w-2xl">{role.purpose}</p>
                        )}
                    </div>

                    {/* Tab bar */}
                    <div className="flex border-b border-gray-200 dark:border-slate-700/30 px-5 gap-1">
                        {[
                            { key: 'areas',       label: `Areas (${role.areas?.length || 0})` },
                            { key: 'activities',  label: `Activities (${role.activities?.length || 0})` },
                            { key: 'skills',      label: 'Skills' },
                            { key: 'performance', label: 'Performance' },
                        ].map(t => (
                            <button key={t.key} onClick={() => setRoleTab(t.key)}
                                className={`py-3 px-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                                    roleTab === t.key
                                        ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                                        : 'border-transparent text-gray-700 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300'
                                }`}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-5">
                        {/* Areas */}
                        {roleTab === 'areas' && (
                            role.areas?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {role.areas.map(area => (
                                        <div key={area.id} className="bg-gray-100 dark:bg-slate-700/30 rounded-xl p-4 border border-gray-300 dark:border-slate-700/50">
                                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{area.area_name}</p>
                                            {area.description && <p className="text-xs text-gray-700 dark:text-slate-400 mt-0.5">{area.description}</p>}
                                            {area.parameters?.length > 0 && (
                                                <div className="mt-3">
                                                    <p className="text-xs font-semibold text-gray-600 dark:text-slate-500 uppercase tracking-wide mb-1.5">KPI Parameters</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {area.parameters.map(p => (
                                                            <span key={p.id} className="text-xs bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-300 dark:border-teal-700/30 rounded-full px-2.5 py-0.5">
                                                                {p.parameter_name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-gray-700 dark:text-slate-400">No areas defined for this role.</p>
                        )}

                        {/* Activities */}
                        {roleTab === 'activities' && (
                            role.activities?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {role.activities.map(act => {
                                        const areaName = role.areas?.find(a => a.id === act.area_id)?.area_name;
                                        return (
                                            <div key={act.id} className="flex items-start gap-3 p-3 border border-gray-300 dark:border-slate-700/30 rounded-lg bg-gray-100 dark:bg-slate-700/20">
                                                <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-900 dark:text-white font-medium">{act.activity_name}</p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        {act.frequency_type && (
                                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${FREQ_COLOR[act.frequency_type] || 'bg-gray-200 dark:bg-slate-700/30 text-gray-700 dark:text-slate-400'}`}>
                                                                {act.frequency_value
                                                                    ? `${act.frequency_type} · ${act.frequency_value}`
                                                                    : act.frequency_type}
                                                            </span>
                                                        )}
                                                        {areaName && <span className="text-xs text-gray-700 dark:text-slate-400">{areaName}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : <p className="text-sm text-gray-700 dark:text-slate-400">No activities defined for this role.</p>
                        )}

                        {/* Skills */}
                        {roleTab === 'skills' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 dark:text-slate-500 uppercase tracking-wide mb-2">Hard Skills</p>
                                    {role.skills?.hard_skills?.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {role.skills.hard_skills.map((s, i) => (
                                                <span key={i} className="text-sm bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 rounded-full px-3 py-1 border border-teal-300 dark:border-teal-700/30">{s}</span>
                                            ))}
                                        </div>
                                    ) : <p className="text-sm text-gray-700 dark:text-slate-400">None defined.</p>}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 dark:text-slate-500 uppercase tracking-wide mb-2">Soft Skills</p>
                                    {role.skills?.soft_skills?.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {role.skills.soft_skills.map((s, i) => (
                                                <span key={i} className="text-sm bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 rounded-full px-3 py-1 border border-purple-300 dark:border-purple-700/30">{s}</span>
                                            ))}
                                        </div>
                                    ) : <p className="text-sm text-gray-700 dark:text-slate-400">None defined.</p>}
                                </div>
                            </div>
                        )}

                        {/* Performance */}
                        {roleTab === 'performance' && (
                            role.performance_definition ? (
                                <div className="space-y-4">
                                    {role.performance_definition.excellent_definition && (
                                        <div className="flex gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-300 dark:border-green-700/30">
                                            <div className="w-3 h-3 mt-0.5 rounded-full bg-green-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">Excellent Performance</p>
                                                <p className="text-sm text-gray-800 dark:text-slate-300 leading-relaxed">{role.performance_definition.excellent_definition}</p>
                                            </div>
                                        </div>
                                    )}
                                    {role.performance_definition.average_definition && (
                                        <div className="flex gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-xl border border-yellow-300 dark:border-yellow-700/30">
                                            <div className="w-3 h-3 mt-0.5 rounded-full bg-yellow-400 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Average Performance</p>
                                                <p className="text-sm text-gray-800 dark:text-slate-300 leading-relaxed">{role.performance_definition.average_definition}</p>
                                            </div>
                                        </div>
                                    )}
                                    {role.performance_definition.poor_definition && (
                                        <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-300 dark:border-red-700/30">
                                            <div className="w-3 h-3 mt-0.5 rounded-full bg-red-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Poor Performance</p>
                                                <p className="text-sm text-gray-800 dark:text-slate-300 leading-relaxed">{role.performance_definition.poor_definition}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : <p className="text-sm text-gray-700 dark:text-slate-400">No performance standards defined yet.</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-gray-100 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-400 dark:border-slate-700/50 p-8 text-center">
                    <p className="text-2xl mb-2">🎯</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-300">No execution role assigned yet</p>
                    <p className="text-xs text-gray-700 dark:text-slate-400 mt-1">Ask your admin to assign you an execution role</p>
                </div>
            )}

        </div>
    );
}

// ── ADMIN DASHBOARD ───────────────────────────────────────────────────────────

function AdminDashboard() {
    const navigate = useNavigate();
    const [data, setData]     = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/tenant/dashboard').then(r => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="space-y-6 bg-gradient-to-b from-slate-900 to-slate-900/50 min-h-screen p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="stat-card animate-pulse bg-slate-800/50 rounded-xl p-5">
                        <div className="h-4 bg-slate-700/50 rounded w-1/2 mb-3" />
                        <div className="h-8 bg-slate-700/50 rounded w-1/3" />
                    </div>
                ))}
            </div>
        </div>
    );

    const planLabel = data?.tenant?.plan ? data.tenant.plan.charAt(0).toUpperCase() + data.tenant.plan.slice(1) : '';
    const ts = data?.task_stats || {};

    return (
        <div className="space-y-6 fade-in p-6 max-w-6xl mx-auto bg-gradient-to-b from-slate-900 to-slate-900/50 min-h-screen">
            <div className="page-header">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="page-title text-3xl font-bold text-white">Dashboard</h1>
                        <p className="page-subtitle text-slate-400">{data?.tenant?.name} — {planLabel} Plan</p>
                    </div>
                    {data?.tenant && (
                        <span className={`badge text-sm px-3 py-1 rounded-lg font-medium ${data.tenant.status === 'active' ? 'bg-green-950/40 text-green-400 border border-green-700/30' : 'bg-yellow-950/40 text-yellow-400 border border-yellow-700/30'}`}>
                            {data.tenant.status}
                        </span>
                    )}
                </div>
            </div>

            {/* People stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard title="Total Users"  value={data?.stats?.total_users}  subtitle="All team members"      icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} color="primary" />
                <StatCard title="Active Users" value={data?.stats?.active_users} subtitle="Currently enabled"     icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} color="accent" />
                <StatCard title="Admins"       value={data?.stats?.admin_users}  subtitle="Administrators"        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} color="purple" />
                <StatCard title="Staff"        value={data?.stats?.staff_users}  subtitle="Team members"          icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} color="secondary" />
            </div>

            {/* Task stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <Tile label="Total Tasks"   value={ts.total}       icon="📋" color="blue"   />
                <Tile label="Pending"       value={ts.pending}     icon="⏳" color="gray"   />
                <Tile label="In Progress"   value={ts.in_progress} icon="⚡" color="teal"   />
                <Tile label="Completed"     value={ts.completed}   icon="✅" color="green"  />
                <Tile label="Overdue"       value={ts.overdue}     icon="🔴" color="red"    />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm p-5 lg:col-span-2">
                    <h2 className="font-semibold text-slate-200 text-sm mb-4">User Registrations</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={data?.monthly_registrations || []}>
                            <defs>
                                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8CC63E" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#8CC63E" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <Tooltip content={<CustomTip />} />
                            <Area type="monotone" dataKey="count" name="New Users" stroke="#8CC63E" strokeWidth={2.5} fill="url(#grad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm p-5">
                    <h2 className="font-semibold text-slate-200 text-sm mb-4">Users by Role</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={data?.users_by_role || []} cx="50%" cy="45%" innerRadius={55} outerRadius={85}
                                paddingAngle={3} dataKey="count" nameKey="label">
                                {(data?.users_by_role || []).map((_, i) => (
                                    <Cell key={i} fill={BRAND[i % BRAND.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(v, n) => [v, n]} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#cbd5e1' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent users */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-700/30 bg-slate-800/30 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-200 text-sm">Recent Members</h2>
                    <button onClick={() => navigate('/users')} className="text-xs text-teal-400 hover:text-teal-300 hover:underline">View all →</button>
                </div>
                <div className="divide-y divide-slate-700/30">
                    {data?.recent_users?.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-8">No users yet</p>
                    )}
                    {data?.recent_users?.map(u => (
                        <div key={u.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-700/20 transition-colors">
                            <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-semibold text-sm">{u.name.charAt(0)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{u.name}</p>
                                <p className="text-xs text-slate-400 truncate">{u.email}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <RoleBadge role={u.role} />
                                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-lg ${u.is_active ? 'bg-green-950/40 text-green-400 border border-green-700/30' : 'bg-slate-700/40 text-slate-300 border border-slate-600/30'}`}>
                                    {u.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Root export — auto-selects based on role ──────────────────────────────────

export default function TenantDashboard() {
    const { user } = useAuth();
    if (!user) return null;
    return user.role === 'staff' ? <StaffDashboard /> : <AdminDashboard />;
}
