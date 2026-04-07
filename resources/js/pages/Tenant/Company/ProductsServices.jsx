import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const inputCls = 'w-full border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-slate-800/50 text-white placeholder-slate-400';
const labelCls = 'block text-xs font-semibold text-slate-300 uppercase tracking-wide mb-1';

function ItemCard({ name, description, badge }) {
    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 shadow-sm hover:border-teal-700/30 transition-colors">
            {badge && (
                <span className="inline-block text-xs font-medium px-2 py-0.5 bg-teal-600/30 text-teal-300 rounded-full mb-2">
                    {badge}
                </span>
            )}
            <p className="font-semibold text-sm text-white">{name}</p>
            {description && <p className="text-sm text-slate-400 mt-1 leading-relaxed">{description}</p>}
        </div>
    );
}

function ListEditor({ items = [], onChange, fields, addLabel }) {
    const add    = () => onChange([...items, Object.fromEntries(fields.map(f => [f.key, '']))]);
    const remove = (i) => onChange(items.filter((_, j) => j !== i));
    const setItem = (i, key, val) => {
        const next = [...items]; next[i] = { ...next[i], [key]: val }; onChange(next);
    };

    return (
        <div className="space-y-3">
            {items.map((item, i) => (
                <div key={i} className={`grid gap-3 p-3 border border-slate-700/50 rounded-lg bg-slate-700/20 ${fields.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    {fields.map(f => (
                        <div key={f.key} className={f.span ? `col-span-${f.span}` : ''}>
                            <p className={labelCls}>{f.label}</p>
                            {f.textarea
                                ? <textarea value={item[f.key] || ''} onChange={e => setItem(i, f.key, e.target.value)}
                                    placeholder={f.placeholder} rows={2} className={inputCls} />
                                : <input value={item[f.key] || ''} onChange={e => setItem(i, f.key, e.target.value)}
                                    placeholder={f.placeholder} className={inputCls} />
                            }
                        </div>
                    ))}
                    <div className="flex items-end">
                        <button type="button" onClick={() => remove(i)}
                            className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
            <button type="button" onClick={add}
                className="flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300 px-1 py-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                {addLabel}
            </button>
        </div>
    );
}

export default function ProductsServices() {
    const { user } = useAuth();
    const isAdmin  = user?.role === 'tenant_admin';

    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [form, setForm]       = useState({ products: [], services: [] });
    const [saving, setSaving]   = useState(false);
    const [error, setError]     = useState('');

    useEffect(() => {
        api.get('/tenant/organisation').then(res => {
            setData(res.data.organisation || {});
        }).catch(() => {}).finally(() => setLoading(false));
    }, []);

    const startEdit = () => {
        setForm({
            products: data?.products || [],
            services: data?.services || [],
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

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" /></div>;

    const hasContent = (data?.products?.length || 0) + (data?.services?.length || 0) > 0;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Products & Services</h1>
                    <p className="text-sm text-slate-400 mt-0.5">What we offer to our clients and customers</p>
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
                    {data?.products?.length > 0 && (
                        <div>
                            <h2 className="text-base font-semibold text-white mb-3">Products</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {data.products.map((p, i) => (
                                    <ItemCard key={i} name={p.name} description={p.description} badge={p.category} />
                                ))}
                            </div>
                        </div>
                    )}

                    {data?.services?.length > 0 && (
                        <div>
                            <h2 className="text-base font-semibold text-white mb-3">Services</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {data.services.map((s, i) => (
                                    <ItemCard key={i} name={s.name} description={s.description} />
                                ))}
                            </div>
                        </div>
                    )}

                    {!hasContent && (
                        <div className="text-center py-16 text-slate-500 text-sm">
                            No products or services added yet.
                            {isAdmin && <button onClick={startEdit} className="block mx-auto mt-2 text-teal-400 hover:underline">Add details</button>}
                        </div>
                    )}
                </>
            )}

            {editing && (
                <div className="space-y-5">
                    {error && <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-400 rounded-lg text-sm">{error}</div>}

                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm p-5 space-y-3">
                        <h2 className="font-semibold text-white text-sm">Products</h2>
                        <ListEditor
                            items={form.products}
                            onChange={v => setForm(f => ({ ...f, products: v }))}
                            addLabel="Add Product"
                            fields={[
                                { key: 'name', label: 'Product Name', placeholder: 'e.g. CRM Suite' },
                                { key: 'category', label: 'Category', placeholder: 'e.g. Software' },
                                { key: 'description', label: 'Description', placeholder: 'What it does…', textarea: true, span: 2 },
                            ]}
                        />
                    </div>

                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm p-5 space-y-3">
                        <h2 className="font-semibold text-white text-sm">Services</h2>
                        <ListEditor
                            items={form.services}
                            onChange={v => setForm(f => ({ ...f, services: v }))}
                            addLabel="Add Service"
                            fields={[
                                { key: 'name', label: 'Service Name', placeholder: 'e.g. Implementation' },
                                { key: 'description', label: 'Description', placeholder: 'What it includes…', textarea: true },
                            ]}
                        />
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
