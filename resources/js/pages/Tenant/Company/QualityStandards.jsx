import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const inputCls = 'w-full border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-800/50 text-white placeholder-slate-400';
const labelCls = 'block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1';

function Section({ icon, color, title, children }) {
    return (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm p-5 hover:border-teal-700/30 transition-colors">
            <div className="flex items-center gap-2 mb-4">
                <span className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}>
                    {icon}
                </span>
                <h2 className="font-semibold text-white">{title}</h2>
            </div>
            {children}
        </div>
    );
}

export default function QualityStandards() {
    const { user } = useAuth();
    const isAdmin  = user?.role === 'tenant_admin';

    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm]       = useState({});
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState('');

    useEffect(() => {
        api.get('/tenant/organisation').then(res => {
            setData(res.data.organisation || {});
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const startEdit = () => {
        setForm({
            quality_policy: data?.quality_policy || '',
            company_goals:  (data?.company_goals  || []).map(g => ({ ...g })),
            key_processes:  (data?.key_processes   || []).map(p => ({ ...p })),
        });
        setEditing(true); setError('');
    };

    const save = async () => {
        setSaving(true); setError('');
        try {
            const res = await api.put('/tenant/organisation', form);
            setData(res.data.organisation);
            setEditing(false);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to save.');
        } finally { setSaving(false); }
    };

    const setVal = (key, val) => setForm(f => ({ ...f, [key]: val }));

    // Goals helpers
    const addGoal    = () => setForm(f => ({ ...f, company_goals: [...(f.company_goals || []), { goal: '', target: '', timeframe: '' }] }));
    const removeGoal = (i) => setForm(f => ({ ...f, company_goals: f.company_goals.filter((_, j) => j !== i) }));
    const setGoal    = (i, key, val) => setForm(f => {
        const g = [...f.company_goals]; g[i] = { ...g[i], [key]: val }; return { ...f, company_goals: g };
    });

    // Process helpers
    const addProcess    = () => setForm(f => ({ ...f, key_processes: [...(f.key_processes || []), { title: '', description: '' }] }));
    const removeProcess = (i) => setForm(f => ({ ...f, key_processes: f.key_processes.filter((_, j) => j !== i) }));
    const setProcess    = (i, key, val) => setForm(f => {
        const p = [...f.key_processes]; p[i] = { ...p[i], [key]: val }; return { ...f, key_processes: p };
    });

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" /></div>;

    const hasContent = data?.quality_policy || data?.company_goals?.length || data?.key_processes?.length;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Standards & Goals</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Quality policy, company goals, and key processes</p>
                </div>
                {isAdmin && !editing && (
                    <button onClick={startEdit}
                        className="px-4 py-2 text-sm border border-slate-600 rounded-lg hover:bg-slate-700/40 hover:border-teal-700/30 text-slate-300 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                    </button>
                )}
            </div>

            {!editing && (
                <>
                    {data?.quality_policy && (
                        <Section
                            title="Quality Policy"
                            color="bg-teal-600/30"
                            icon={<svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}>
                            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-line">{data.quality_policy}</p>
                        </Section>
                    )}

                    {data?.company_goals?.length > 0 && (
                        <Section
                            title="Company Goals"
                            color="bg-teal-600/30"
                            icon={<svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}>
                            <div className="space-y-3">
                                {data.company_goals.map((g, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-teal-600/20 rounded-lg border border-teal-700/30">
                                        <span className="mt-0.5 w-6 h-6 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-white">{g.goal}</p>
                                            <div className="flex gap-4 mt-1">
                                                {g.target    && <span className="text-xs text-slate-400">Target: {g.target}</span>}
                                                {g.timeframe && <span className="text-xs text-teal-400">{g.timeframe}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                    {data?.key_processes?.length > 0 && (
                        <Section
                            title="Key Processes"
                            color="bg-lime-600/30"
                            icon={<svg className="w-4 h-4 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}>
                            <div className="space-y-3">
                                {data.key_processes.map((p, i) => (
                                    <div key={i} className="p-3 border border-slate-700/50 rounded-lg bg-slate-700/20">
                                        <p className="font-medium text-sm text-white">{p.title}</p>
                                        {p.description && <p className="text-sm text-slate-400 mt-1 leading-relaxed">{p.description}</p>}
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                    {!hasContent && (
                        <div className="text-center py-16 text-slate-500 text-sm">
                            No standards or goals defined yet.
                            {isAdmin && <button onClick={startEdit} className="block mx-auto mt-2 text-teal-400 hover:underline">Add details</button>}
                        </div>
                    )}
                </>
            )}

            {editing && (
                <div className="space-y-5">
                    {error && <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-400 rounded-lg text-sm">{error}</div>}

                    {/* Quality Policy */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm p-5">
                        <h2 className="font-semibold text-white text-sm mb-3">Quality Policy</h2>
                        <textarea value={form.quality_policy || ''} onChange={e => setVal('quality_policy', e.target.value)}
                            rows={5} placeholder="Our commitment to quality: describe the standards, certifications, and principles that guide how we work…"
                            className={inputCls} />
                    </div>

                    {/* Company Goals */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-white text-sm">Company Goals</h2>
                            <button type="button" onClick={addGoal} className="text-xs text-teal-400 hover:text-teal-300">+ Add Goal</button>
                        </div>
                        {(form.company_goals || []).map((g, i) => (
                            <div key={i} className="grid grid-cols-3 gap-3 p-3 border border-slate-700/50 rounded-lg bg-slate-700/20">
                                <div className="col-span-3 sm:col-span-1">
                                    <p className={labelCls}>Goal</p>
                                    <input value={g.goal} onChange={e => setGoal(i, 'goal', e.target.value)}
                                        placeholder="e.g. Reach 100 clients" className={inputCls} />
                                </div>
                                <div>
                                    <p className={labelCls}>Target / KPI</p>
                                    <input value={g.target || ''} onChange={e => setGoal(i, 'target', e.target.value)}
                                        placeholder="e.g. Revenue ₹5Cr" className={inputCls} />
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <p className={labelCls}>Timeframe</p>
                                        <input value={g.timeframe || ''} onChange={e => setGoal(i, 'timeframe', e.target.value)}
                                            placeholder="e.g. FY 2025-26" className={inputCls} />
                                    </div>
                                    <button type="button" onClick={() => removeGoal(i)}
                                        className="mt-5 p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Key Processes */}
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-white text-sm">Key Processes</h2>
                            <button type="button" onClick={addProcess} className="text-xs text-lime-400 hover:text-lime-300">+ Add Process</button>
                        </div>
                        {(form.key_processes || []).map((p, i) => (
                            <div key={i} className="grid grid-cols-2 gap-3 p-3 border border-slate-700/50 rounded-lg bg-slate-700/20">
                                <div>
                                    <p className={labelCls}>Process Title</p>
                                    <input value={p.title} onChange={e => setProcess(i, 'title', e.target.value)}
                                        placeholder="e.g. Client Onboarding" className={inputCls} />
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <p className={labelCls}>Description</p>
                                        <input value={p.description || ''} onChange={e => setProcess(i, 'description', e.target.value)}
                                            placeholder="How it works…" className={inputCls} />
                                    </div>
                                    <button type="button" onClick={() => removeProcess(i)}
                                        className="mt-5 p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={() => setEditing(false)}
                            className="px-4 py-2 text-sm border border-slate-600 rounded-lg hover:bg-slate-700/40 text-slate-300">Cancel</button>
                        <button type="button" onClick={save} disabled={saving}
                            className="px-6 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
