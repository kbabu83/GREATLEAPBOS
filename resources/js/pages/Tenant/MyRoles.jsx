import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const FREQ_COLOR = {
    daily:     'text-teal-400 bg-teal-900/30',
    weekly:    'text-green-400 bg-green-900/30',
    monthly:   'text-purple-400 bg-purple-900/30',
    quarterly: 'text-orange-400 bg-orange-900/30',
    yearly:    'text-red-400 bg-red-900/30',
};

function RoleCard({ role }) {
    const [tab, setTab] = useState('areas');

    const TABS = [
        { key: 'areas',       label: `Areas (${role.areas?.length || 0})` },
        { key: 'activities',  label: `Activities (${role.activities?.length || 0})` },
        { key: 'skills',      label: 'Skills' },
        { key: 'performance', label: 'Performance' },
    ];

    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-teal-900/20 to-transparent border-b border-slate-700/50">
                <h2 className="text-xl font-bold text-white">{role.name}</h2>
                {role.reporting_role && (
                    <p className="text-xs text-slate-400 mt-0.5">
                        Reports to: <span className="font-medium text-slate-300">{role.reporting_role}</span>
                    </p>
                )}
                {role.purpose && (
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed max-w-2xl">{role.purpose}</p>
                )}
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-slate-700/50 px-6 gap-1">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`py-3 px-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                            tab === t.key
                                ? 'border-teal-600 text-teal-400'
                                : 'border-transparent text-slate-400 hover:text-slate-300'
                        }`}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="p-6">
                {/* Areas */}
                {tab === 'areas' && (
                    role.areas?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {role.areas.map(area => (
                                <div key={area.id} className="bg-slate-700/30 rounded-xl p-4 border border-slate-700/50">
                                    <p className="font-semibold text-sm text-slate-200">{area.area_name}</p>
                                    {area.description && <p className="text-xs text-slate-400 mt-0.5">{area.description}</p>}
                                    {area.parameters?.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">KPI Parameters</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {area.parameters.map(p => (
                                                    <span key={p.id} className="text-xs bg-teal-900/30 text-teal-400 border border-teal-700/50 rounded-full px-2.5 py-0.5">
                                                        {p.parameter_name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-slate-500">No areas defined for this role.</p>
                )}

                {/* Activities */}
                {tab === 'activities' && (
                    role.activities?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {role.activities.map(act => {
                                const areaName = role.areas?.find(a => a.id === act.area_id)?.area_name;
                                return (
                                    <div key={act.id} className="flex items-start gap-3 p-3 border border-slate-700/30 rounded-lg bg-slate-700/20">
                                        <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-200 font-medium">{act.activity_name}</p>
                                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                {act.frequency_type && (
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${FREQ_COLOR[act.frequency_type] || 'bg-slate-700/30 text-slate-400'}`}>
                                                        {act.frequency_value ? `${act.frequency_type} · ${act.frequency_value}` : act.frequency_type}
                                                    </span>
                                                )}
                                                {areaName && <span className="text-xs text-slate-500">{areaName}</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : <p className="text-sm text-slate-500">No activities defined for this role.</p>
                )}

                {/* Skills */}
                {tab === 'skills' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Hard Skills</p>
                            {role.skills?.hard_skills?.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {role.skills.hard_skills.map((s, i) => (
                                        <span key={i} className="text-sm bg-slate-700/30 text-slate-300 border border-slate-700/50 rounded-full px-3 py-1">{s}</span>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-slate-500">None defined.</p>}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Soft Skills</p>
                            {role.skills?.soft_skills?.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {role.skills.soft_skills.map((s, i) => (
                                        <span key={i} className="text-sm bg-purple-900/30 text-purple-400 border border-purple-700/50 rounded-full px-3 py-1">{s}</span>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-slate-500">None defined.</p>}
                        </div>
                    </div>
                )}

                {/* Performance */}
                {tab === 'performance' && (
                    role.performance_definition ? (
                        <div className="space-y-4">
                            {role.performance_definition.excellent_definition && (
                                <div className="flex gap-3 p-4 bg-green-900/20 rounded-xl border border-green-700/50">
                                    <div className="w-3 h-3 mt-0.5 rounded-full bg-green-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-green-400 mb-1">Excellent Performance</p>
                                        <p className="text-sm text-slate-300 leading-relaxed">{role.performance_definition.excellent_definition}</p>
                                    </div>
                                </div>
                            )}
                            {role.performance_definition.average_definition && (
                                <div className="flex gap-3 p-4 bg-yellow-900/20 rounded-xl border border-yellow-700/50">
                                    <div className="w-3 h-3 mt-0.5 rounded-full bg-yellow-400 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-yellow-400 mb-1">Average Performance</p>
                                        <p className="text-sm text-slate-300 leading-relaxed">{role.performance_definition.average_definition}</p>
                                    </div>
                                </div>
                            )}
                            {role.performance_definition.poor_definition && (
                                <div className="flex gap-3 p-4 bg-red-900/20 rounded-xl border border-red-700/50">
                                    <div className="w-3 h-3 mt-0.5 rounded-full bg-red-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-red-400 mb-1">Poor Performance</p>
                                        <p className="text-sm text-slate-300 leading-relaxed">{role.performance_definition.poor_definition}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : <p className="text-sm text-slate-500">No performance standards defined yet.</p>
                )}
            </div>
        </div>
    );
}

export default function MyRolesPage() {
    const { user: me } = useAuth();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/tenant/dashboard')
            .then(res => setRoles(res.data.es_roles || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-64 min-h-screen">
            <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 min-h-screen">
            <div className="page-header">
                <h1 className="page-title text-white">My Roles</h1>
                <p className="page-subtitle text-slate-400">
                    {me?.department ? `${me.department} · ` : ''}
                    {roles.length === 0
                        ? 'No execution roles assigned yet'
                        : `${roles.length} execution role${roles.length > 1 ? 's' : ''} assigned`}
                </p>
            </div>

            {roles.length === 0 ? (
                <div className="bg-slate-800/50 rounded-xl border border-dashed border-slate-700/50 p-12 text-center">
                    <p className="text-3xl mb-3">🎯</p>
                    <p className="text-sm font-medium text-slate-300">No execution role assigned yet</p>
                    <p className="text-xs text-slate-400 mt-1">Ask your admin to assign you an execution role</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {roles.map(role => <RoleCard key={role.id} role={role} />)}
                </div>
            )}
        </div>
    );
}
