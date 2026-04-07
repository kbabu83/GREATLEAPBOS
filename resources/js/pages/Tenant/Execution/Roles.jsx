import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

const cls = (...a) => a.filter(Boolean).join(' ');

function Badge({ label, color = 'gray' }) {
    const map = {
        green:  'bg-green-900/30 text-green-400 border border-green-700/50',
        blue:   'bg-teal-900/30 text-teal-400 border border-teal-700/50',
        red:    'bg-red-900/30 text-red-400 border border-red-700/50',
        gray:   'bg-slate-700/30 text-slate-400 border border-slate-600/50',
        purple: 'bg-purple-900/30 text-purple-400 border border-purple-700/50',
        orange: 'bg-orange-900/30 text-orange-400 border border-orange-700/50',
    };
    return <span className={cls('inline-flex px-2 py-0.5 text-xs font-medium rounded-full mr-1', map[color])}>{label}</span>;
}

const FREQ_COLORS = { daily: 'blue', weekly: 'green', monthly: 'purple', quarterly: 'orange', yearly: 'red' };

// ── Role detail panel (read-only) ─────────────────────────────────────────────
function RoleDetail({ role }) {
    return (
        <div className="border-t border-slate-700/50 mt-3 pt-4 space-y-4">
            {role.purpose && (
                <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Purpose</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{role.purpose}</p>
                </div>
            )}

            {/* Areas & KPIs */}
            {role.areas?.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Areas of Operation</p>
                    <div className="space-y-2">
                        {role.areas.map(area => (
                            <div key={area.id} className="bg-slate-700/30 rounded-lg p-3 border border-slate-700/50">
                                <p className="font-medium text-sm text-slate-200">{area.area_name}</p>
                                {area.description && (
                                    <p className="text-xs text-slate-400 mt-0.5">{area.description}</p>
                                )}
                                {area.parameters?.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {area.parameters.map(p => (
                                            <span key={p.id}
                                                className="text-xs bg-teal-900/30 text-teal-400 border border-teal-700/50 rounded-full px-2 py-0.5">
                                                {p.parameter_name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Activities */}
            {role.activities?.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Major Activities</p>
                    <div className="space-y-1.5">
                        {role.activities.map(act => (
                            <div key={act.id} className="flex items-center gap-2 py-1 border-b border-slate-700/30 last:border-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                                <span className="text-sm text-slate-300 flex-1">{act.activity_name}</span>
                                {act.frequency_type && (
                                    <Badge label={act.frequency_type} color={FREQ_COLORS[act.frequency_type] || 'gray'} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Skills */}
            {(role.skills?.hard_skills?.length > 0 || role.skills?.soft_skills?.length > 0) && (
                <div className="grid grid-cols-2 gap-4">
                    {role.skills.hard_skills?.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Hard Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                                {role.skills.hard_skills.map((s, i) => (
                                    <span key={i} className="text-xs bg-slate-700/30 text-slate-300 border border-slate-700/50 rounded-full px-2 py-0.5">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {role.skills.soft_skills?.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Soft Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                                {role.skills.soft_skills.map((s, i) => (
                                    <span key={i} className="text-xs bg-purple-900/30 text-purple-400 border border-purple-700/50 rounded-full px-2 py-0.5">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Ideal Profile */}
            {role.ideal_profile && (role.ideal_profile.education || role.ideal_profile.experience_range) && (
                <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Ideal Profile</p>
                    <div className="text-sm text-slate-300 space-y-1">
                        {role.ideal_profile.education && <p><span className="font-medium text-slate-200">Education:</span> {role.ideal_profile.education}</p>}
                        {role.ideal_profile.experience_range && <p><span className="font-medium text-slate-200">Experience:</span> {role.ideal_profile.experience_range}</p>}
                        {role.ideal_profile.additional_requirements && <p>{role.ideal_profile.additional_requirements}</p>}
                    </div>
                </div>
            )}

            {/* Performance */}
            {(role.performance_definition?.excellent_definition ||
              role.performance_definition?.average_definition ||
              role.performance_definition?.poor_definition) && (
                <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Performance Standards</p>
                    <div className="space-y-2">
                        {role.performance_definition.excellent_definition && (
                            <div className="flex gap-2 text-sm">
                                <span className="w-2 h-2 mt-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                <div><span className="font-medium text-slate-200">Excellent: </span><span className="text-slate-400">{role.performance_definition.excellent_definition}</span></div>
                            </div>
                        )}
                        {role.performance_definition.average_definition && (
                            <div className="flex gap-2 text-sm">
                                <span className="w-2 h-2 mt-1.5 rounded-full bg-yellow-400 flex-shrink-0" />
                                <div><span className="font-medium text-slate-200">Average: </span><span className="text-slate-400">{role.performance_definition.average_definition}</span></div>
                            </div>
                        )}
                        {role.performance_definition.poor_definition && (
                            <div className="flex gap-2 text-sm">
                                <span className="w-2 h-2 mt-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                <div><span className="font-medium text-slate-200">Poor: </span><span className="text-slate-400">{role.performance_definition.poor_definition}</span></div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Role card ─────────────────────────────────────────────────────────────────
function RoleCard({ role, isAdmin, onEdit, onDelete, deleting }) {
    const [expanded, setExpanded]       = useState(false);
    const [fullRole, setFullRole]       = useState(null);
    const [loadingFull, setLoadingFull] = useState(false);

    const toggle = async () => {
        if (!expanded && !fullRole) {
            setLoadingFull(true);
            try {
                const res = await api.get(`/tenant/execution/roles/${role.id}`);
                setFullRole(res.data);
            } catch { /* silent */ }
            finally { setLoadingFull(false); }
        }
        setExpanded(e => !e);
    };

    const detail = fullRole || role;

    return (
        <div className={cls(
            'bg-slate-800/50 rounded-xl border shadow-sm transition-all',
            expanded ? 'border-teal-700/50' : 'border-slate-700/50 hover:border-teal-700/30',
        )}>
            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white">{role.name}</span>
                            <Badge label={role.is_active ? 'Active' : 'Inactive'} color={role.is_active ? 'green' : 'gray'} />
                            {role.reporting_role && (
                                <span className="text-xs text-slate-500">
                                    reports to <span className="text-slate-300 font-medium">{role.reporting_role.name}</span>
                                </span>
                            )}
                        </div>
                        {role.purpose && !expanded && (
                            <p className="text-sm text-slate-400 mt-1 line-clamp-1">{role.purpose}</p>
                        )}
                        <div className="flex gap-4 mt-1.5">
                            {role.areas?.length > 0 && (
                                <span className="text-xs text-slate-400">
                                    <span className="font-medium text-slate-300">{role.areas.length}</span> area{role.areas.length !== 1 ? 's' : ''}
                                </span>
                            )}
                            {role.activities?.length > 0 && (
                                <span className="text-xs text-slate-400">
                                    <span className="font-medium text-slate-300">{role.activities.length}</span> activit{role.activities.length !== 1 ? 'ies' : 'y'}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={toggle}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-600 rounded-lg hover:bg-slate-700/30 text-slate-400">
                            {loadingFull
                                ? <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                : <svg className={cls('w-3.5 h-3.5 transition-transform', expanded && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                            }
                            {expanded ? 'Collapse' : 'View Details'}
                        </button>

                        {isAdmin && (
                            <>
                                <button onClick={() => onEdit(role)}
                                    className="px-3 py-1.5 text-xs border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/30">
                                    Edit
                                </button>
                                <button onClick={() => onDelete(role)} disabled={deleting === role.id}
                                    className="px-3 py-1.5 text-xs border border-red-700/50 text-red-400 rounded-lg hover:bg-red-900/20 disabled:opacity-50">
                                    {deleting === role.id ? '…' : 'Delete'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {expanded && <RoleDetail role={detail} />}
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function RolesPage() {
    const navigate      = useNavigate();
    const { user }      = useAuth();
    const isAdmin       = user?.role === 'tenant_admin';

    const [roles, setRoles]       = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [deleting, setDeleting] = useState(null);
    const [search, setSearch]     = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/tenant/execution/roles');
            setRoles(res.data || []);
        } catch {
            setError('Failed to load roles.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (role) => {
        if (!window.confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
        setDeleting(role.id);
        try {
            await api.delete(`/tenant/execution/roles/${role.id}`);
            setRoles(r => r.filter(x => x.id !== role.id));
        } catch {
            alert('Could not delete role.');
        } finally {
            setDeleting(null);
        }
    };

    const filtered = roles.filter(r =>
        !search || r.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center h-64 min-h-screen">
            <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="p-6 max-w-5xl mx-auto min-h-screen">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Execution Roles</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        {isAdmin
                            ? 'Define and manage structured roles for work execution'
                            : 'Company roles and their responsibilities'}
                    </p>
                </div>
                {isAdmin && (
                    <button onClick={() => navigate('/app/execution/roles/new')}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        New Role
                    </button>
                )}
            </div>

            {error && <div className="mb-4 p-3 bg-red-900/20 border border-red-700/50 text-red-400 rounded-lg text-sm">{error}</div>}

            {roles.length > 3 && (
                <div className="mb-4">
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search roles…"
                        className="w-full max-w-sm border border-slate-600 bg-slate-900/50 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
            )}

            {filtered.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-700/50">
                    <div className="text-5xl mb-4">🎯</div>
                    {roles.length === 0 ? (
                        <>
                            <h3 className="text-lg font-semibold text-slate-300">No roles defined yet</h3>
                            <p className="text-sm text-slate-400 mt-1 mb-5">Create your first execution role to start assigning structured work</p>
                            {isAdmin && (
                                <button onClick={() => navigate('/app/execution/roles/new')}
                                    className="px-5 py-2.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700">
                                    Create First Role
                                </button>
                            )}
                        </>
                    ) : (
                        <h3 className="text-lg font-semibold text-slate-300">No roles match "{search}"</h3>
                    )}
                </div>
            ) : (
                <div className="grid gap-3">
                    {filtered.map(role => (
                        <RoleCard
                            key={role.id}
                            role={role}
                            isAdmin={isAdmin}
                            onEdit={r => navigate(`/app/execution/roles/${r.id}`)}
                            onDelete={handleDelete}
                            deleting={deleting}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
