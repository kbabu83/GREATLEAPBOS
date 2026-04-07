import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const inputCls = 'w-full border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-800/50 text-white placeholder-slate-400';
const labelCls = 'block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1';

export default function OurClients() {
    const { user } = useAuth();
    const isAdmin  = user?.role === 'tenant_admin';

    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [clients, setClients] = useState([]);
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState('');

    useEffect(() => {
        api.get('/tenant/organisation').then(res => {
            setData(res.data.organisation || {});
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const startEdit = () => {
        setClients((data?.major_clients || []).map(c => ({ ...c })));
        setEditing(true); setError('');
    };

    const addClient    = () => setClients(c => [...c, { name: '', industry: '', note: '' }]);
    const removeClient = (i) => setClients(c => c.filter((_, j) => j !== i));
    const setClient    = (i, key, val) => setClients(c => {
        const next = [...c]; next[i] = { ...next[i], [key]: val }; return next;
    });

    const save = async () => {
        setSaving(true); setError('');
        try {
            const res = await api.put('/tenant/organisation', { major_clients: clients });
            setData(res.data.organisation);
            setEditing(false);
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to save.');
        } finally { setSaving(false); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" /></div>;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Our Clients</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Key clients and partnerships we serve</p>
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
                    {data?.major_clients?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {data.major_clients.map((c, i) => (
                                <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 shadow-sm hover:border-teal-700/30 transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold text-sm">{c.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-white">{c.name}</p>
                                            {c.industry && <p className="text-xs text-slate-400">{c.industry}</p>}
                                        </div>
                                    </div>
                                    {c.note && <p className="text-xs text-slate-400 leading-relaxed">{c.note}</p>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-slate-500 text-sm">
                            No clients added yet.
                            {isAdmin && <button onClick={startEdit} className="block mx-auto mt-2 text-teal-400 hover:underline">Add clients</button>}
                        </div>
                    )}
                </>
            )}

            {editing && (
                <div className="space-y-4">
                    {error && <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-400 rounded-lg text-sm">{error}</div>}

                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm p-5 space-y-3">
                        <h2 className="font-semibold text-white text-sm">Major Clients</h2>

                        {clients.map((c, i) => (
                            <div key={i} className="grid grid-cols-3 gap-3 p-3 border border-slate-700/50 rounded-lg bg-slate-700/20">
                                <div>
                                    <p className={labelCls}>Client Name</p>
                                    <input value={c.name} onChange={e => setClient(i, 'name', e.target.value)}
                                        placeholder="Company name" className={inputCls} />
                                </div>
                                <div>
                                    <p className={labelCls}>Industry</p>
                                    <input value={c.industry || ''} onChange={e => setClient(i, 'industry', e.target.value)}
                                        placeholder="e.g. Manufacturing" className={inputCls} />
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <p className={labelCls}>Note</p>
                                        <input value={c.note || ''} onChange={e => setClient(i, 'note', e.target.value)}
                                            placeholder="Short description" className={inputCls} />
                                    </div>
                                    <button type="button" onClick={() => removeClient(i)}
                                        className="mt-5 p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button type="button" onClick={addClient}
                            className="flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300 px-1 py-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Client
                        </button>
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
