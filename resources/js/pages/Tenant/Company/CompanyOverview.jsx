import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const inputCls   = 'w-full border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-800/50 text-white placeholder-slate-400';
const labelCls   = 'block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1';

function Field({ label, children }) {
    return <div><p className={labelCls}>{label}</p>{children}</div>;
}

function ValueCard({ title, description }) {
    return (
        <div className="bg-gradient-to-br from-slate-700/40 to-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <p className="font-semibold text-teal-400 text-sm">{title}</p>
            {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
        </div>
    );
}

export default function CompanyOverview() {
    const { user } = useAuth();
    const isAdmin  = user?.role === 'tenant_admin';

    const [data, setData]     = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm]     = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState('');

    const load = async () => {
        try {
            const res = await api.get('/tenant/organisation');
            setData(res.data.organisation || {});
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const startEdit = () => {
        setForm({
            legal_name:   data?.legal_name  || '',
            trade_name:   data?.trade_name  || '',
            tagline:      data?.tagline     || '',
            about:        data?.about       || '',
            vision:       data?.vision      || '',
            mission:      data?.mission     || '',
            core_values:  data?.core_values || [],
            phone:        data?.phone       || '',
            email:        data?.email       || '',
            website:      data?.website     || '',
        });
        setEditing(true);
        setError('');
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

    const addValue     = () => setForm(f => ({ ...f, core_values: [...(f.core_values || []), { title: '', description: '' }] }));
    const removeValue  = (i) => setForm(f => ({ ...f, core_values: f.core_values.filter((_, j) => j !== i) }));
    const setValueItem = (i, key, val) => setForm(f => {
        const v = [...f.core_values]; v[i] = { ...v[i], [key]: val }; return { ...f, core_values: v };
    });

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        {data?.legal_name || data?.trade_name || 'Company Overview'}
                    </h1>
                    {data?.tagline && <p className="text-slate-400 mt-1 italic">{data.tagline}</p>}
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

            {/* ── View Mode ──────────────────────────────────────────────────── */}
            {!editing && (
                <>
                    {/* About */}
                    {data?.about && (
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm p-5 hover:border-teal-700/30 transition-colors">
                            <h2 className="font-semibold text-white mb-2">About Us</h2>
                            <p className="text-sm text-slate-400 leading-relaxed">{data.about}</p>
                        </div>
                    )}

                    {/* Vision & Mission */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data?.vision && (
                            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm p-5 hover:border-teal-700/30 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-7 h-7 rounded-lg bg-teal-600/30 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </span>
                                    <h2 className="font-semibold text-white">Our Vision</h2>
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed">{data.vision}</p>
                            </div>
                        )}
                        {data?.mission && (
                            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm p-5 hover:border-teal-700/30 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-7 h-7 rounded-lg bg-teal-600/30 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                        </svg>
                                    </span>
                                    <h2 className="font-semibold text-white">Our Mission</h2>
                                </div>
                                <p className="text-sm text-slate-400 leading-relaxed">{data.mission}</p>
                            </div>
                        )}
                    </div>

                    {/* Core Values */}
                    {data?.core_values?.length > 0 && (
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm p-5 hover:border-teal-700/30 transition-colors">
                            <h2 className="font-semibold text-white mb-3">Core Values</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {data.core_values.map((v, i) => (
                                    <ValueCard key={i} title={v.title} description={v.description} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Contact */}
                    {(data?.phone || data?.email || data?.website) && (
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm p-5 hover:border-teal-700/30 transition-colors">
                            <h2 className="font-semibold text-white mb-3">Contact</h2>
                            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                                {data.phone   && <span>{data.phone}</span>}
                                {data.email   && <span>{data.email}</span>}
                                {data.website && <a href={data.website} target="_blank" rel="noreferrer" className="text-teal-400 hover:underline">{data.website}</a>}
                            </div>
                        </div>
                    )}

                    {!data?.about && !data?.vision && !data?.mission && (
                        <div className="text-center py-16 text-slate-500">
                            <p className="text-sm">No company information added yet.</p>
                            {isAdmin && <button onClick={startEdit} className="mt-2 text-teal-400 text-sm hover:underline">Add company details</button>}
                        </div>
                    )}
                </>
            )}

            {/* ── Edit Mode ──────────────────────────────────────────────────── */}
            {editing && (
                <div className="space-y-5">
                    {error && <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-400 rounded-lg text-sm">{error}</div>}

                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm p-5 space-y-4">
                        <h2 className="font-semibold text-white text-sm">Identity</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className={labelCls}>Company Name</p>
                                <input value={form.legal_name} onChange={e => setVal('legal_name', e.target.value)} placeholder="Legal company name" className={inputCls} />
                            </div>
                            <div><p className={labelCls}>Brand / Trade Name</p>
                                <input value={form.trade_name} onChange={e => setVal('trade_name', e.target.value)} placeholder="Brand name" className={inputCls} />
                            </div>
                            <div className="col-span-2"><p className={labelCls}>Tagline</p>
                                <input value={form.tagline} onChange={e => setVal('tagline', e.target.value)} placeholder="e.g. Building tomorrow, today" className={inputCls} />
                            </div>
                            <div className="col-span-2"><p className={labelCls}>About</p>
                                <textarea value={form.about} onChange={e => setVal('about', e.target.value)} rows={3} placeholder="Brief description of the company" className={inputCls} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm p-5 space-y-4">
                        <h2 className="font-semibold text-white text-sm">Vision & Mission</h2>
                        <div><p className={labelCls}>Vision</p>
                            <textarea value={form.vision} onChange={e => setVal('vision', e.target.value)} rows={3} placeholder="Where we want to be in the long run" className={inputCls} />
                        </div>
                        <div><p className={labelCls}>Mission</p>
                            <textarea value={form.mission} onChange={e => setVal('mission', e.target.value)} rows={3} placeholder="What we do and for whom" className={inputCls} />
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-white text-sm">Core Values</h2>
                            <button type="button" onClick={addValue}
                                className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                                + Add Value
                            </button>
                        </div>
                        {(form.core_values || []).map((v, i) => (
                            <div key={i} className="grid grid-cols-2 gap-3 p-3 border border-slate-700/50 rounded-lg bg-slate-700/20">
                                <div><p className={labelCls}>Title</p>
                                    <input value={v.title} onChange={e => setValueItem(i, 'title', e.target.value)} placeholder="e.g. Integrity" className={inputCls} />
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1"><p className={labelCls}>Description</p>
                                        <input value={v.description || ''} onChange={e => setValueItem(i, 'description', e.target.value)} placeholder="Brief description" className={inputCls} />
                                    </div>
                                    <button type="button" onClick={() => removeValue(i)} className="mt-5 p-1.5 text-red-400 hover:text-red-600 rounded">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm p-5 space-y-4">
                        <h2 className="font-semibold text-white text-sm">Contact</h2>
                        <div className="grid grid-cols-3 gap-4">
                            <div><p className={labelCls}>Phone</p>
                                <input value={form.phone} onChange={e => setVal('phone', e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
                            </div>
                            <div><p className={labelCls}>Email</p>
                                <input value={form.email} onChange={e => setVal('email', e.target.value)} placeholder="info@company.com" className={inputCls} />
                            </div>
                            <div><p className={labelCls}>Website</p>
                                <input value={form.website} onChange={e => setVal('website', e.target.value)} placeholder="https://company.com" className={inputCls} />
                            </div>
                        </div>
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
