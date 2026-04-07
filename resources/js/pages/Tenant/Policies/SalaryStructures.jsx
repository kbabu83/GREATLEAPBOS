import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const EMPTY_STRUCT = { name: '', description: '', is_active: true };
const EMPTY_COMP   = {
    name: '', code: '', type: 'earning',
    calculation_type: 'fixed', value: 0,
    is_taxable: true, is_pf_applicable: false, is_esi_applicable: false,
    display_order: 0,
};

const CALC_LABELS = {
    fixed: 'Fixed Amount (₹)',
    percentage_of_basic: '% of Basic',
    percentage_of_gross: '% of Gross',
    percentage_of_ctc:   '% of CTC',
};

const TYPE_COLORS = {
    earning:              'bg-green-100 text-green-700',
    deduction:            'bg-red-100 text-red-700',
    employer_contribution:'bg-blue-100 text-blue-700',
};

const inp = 'border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500';
const sel = inp + ' bg-white';

function Toggle({ value, onChange, label }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-700">
            <div onClick={() => onChange(!value)}
                 className={`relative w-9 h-5 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : ''}`} />
            </div>
            {label}
        </label>
    );
}

function Field({ label, children }) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            {children}
        </div>
    );
}

function ComponentRow({ comp, onEdit, onDelete }) {
    return (
        <tr className="hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{comp.name}</td>
            <td className="px-4 py-3 text-xs font-mono text-gray-500">{comp.code}</td>
            <td className="px-4 py-3 text-sm text-gray-600">
                {CALC_LABELS[comp.calculation_type] ?? comp.calculation_type}
            </td>
            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                {comp.calculation_type === 'fixed'
                    ? `₹${Number(comp.value).toLocaleString('en-IN')}`
                    : `${comp.value}%`}
            </td>
            <td className="px-4 py-3">
                <div className="flex gap-1">
                    {comp.is_taxable       && <span className="text-xs bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded">Taxable</span>}
                    {comp.is_pf_applicable && <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">PF</span>}
                    {comp.is_esi_applicable&& <span className="text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">ESI</span>}
                </div>
            </td>
            <td className="px-4 py-3">
                <div className="flex gap-2">
                    <button onClick={() => onEdit(comp)} className="text-xs text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => onDelete(comp.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                </div>
            </td>
        </tr>
    );
}

export default function SalaryStructures() {
    const [structures, setStructures] = useState([]);
    const [expanded, setExpanded]     = useState({});
    const [loading, setLoading]       = useState(true);
    const [msg, setMsg]               = useState(null);

    // Structure modal
    const [showStructModal, setShowStructModal] = useState(false);
    const [structEditId, setStructEditId]       = useState(null);
    const [structForm, setStructForm]           = useState(EMPTY_STRUCT);
    const [structSaving, setStructSaving]       = useState(false);

    // Component modal
    const [showCompModal, setShowCompModal]     = useState(false);
    const [compStructureId, setCompStructureId] = useState(null);
    const [compEditId, setCompEditId]           = useState(null);
    const [compForm, setCompForm]               = useState(EMPTY_COMP);
    const [compSaving, setCompSaving]           = useState(false);

    const flash = (text, type = 'success') => {
        setMsg({ text, type });
        setTimeout(() => setMsg(null), 3500);
    };

    const load = async () => {
        try {
            const res = await api.get('/tenant/salary-structures');
            const list = Array.isArray(res.data.data) ? res.data.data : res.data;
            setStructures(list);
        } catch { flash('Failed to load salary structures.', 'error'); }
        finally { setLoading(false); }
    };

    const loadStructure = async (id) => {
        try {
            const res = await api.get(`/tenant/salary-structures/${id}`);
            setStructures(prev => prev.map(s => s.id === id ? { ...s, ...res.data } : s));
        } catch {}
    };

    useEffect(() => { load(); }, []);

    const toggleExpand = (id) => {
        if (!expanded[id]) loadStructure(id);
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // ── Structure CRUD ────────────────────────────────────────────────────────

    const openAddStruct = () => { setStructEditId(null); setStructForm(EMPTY_STRUCT); setShowStructModal(true); };
    const openEditStruct = (s) => { setStructEditId(s.id); setStructForm({ name: s.name, description: s.description ?? '', is_active: s.is_active }); setShowStructModal(true); };

    const saveStruct = async (e) => {
        e.preventDefault();
        setStructSaving(true);
        try {
            if (structEditId) {
                await api.put(`/tenant/salary-structures/${structEditId}`, structForm);
                flash('Structure updated.');
            } else {
                await api.post('/tenant/salary-structures', structForm);
                flash('Structure created.');
            }
            setShowStructModal(false);
            load();
        } catch (err) { flash(err.response?.data?.message ?? 'Save failed.', 'error'); }
        finally { setStructSaving(false); }
    };

    const deleteStruct = async (id) => {
        if (!window.confirm('Delete this salary structure? All components will be removed.')) return;
        try {
            await api.delete(`/tenant/salary-structures/${id}`);
            flash('Structure deleted.');
            load();
        } catch (err) { flash(err.response?.data?.message ?? 'Delete failed.', 'error'); }
    };

    // ── Component CRUD ────────────────────────────────────────────────────────

    const openAddComp = (structureId) => {
        setCompStructureId(structureId);
        setCompEditId(null);
        setCompForm(EMPTY_COMP);
        setShowCompModal(true);
    };

    const openEditComp = (structureId, comp) => {
        setCompStructureId(structureId);
        setCompEditId(comp.id);
        setCompForm({ ...EMPTY_COMP, ...comp });
        setShowCompModal(true);
    };

    const saveComp = async (e) => {
        e.preventDefault();
        setCompSaving(true);
        try {
            if (compEditId) {
                await api.put(`/tenant/salary-structures/${compStructureId}/components/${compEditId}`, compForm);
                flash('Component updated.');
            } else {
                await api.post(`/tenant/salary-structures/${compStructureId}/components`, compForm);
                flash('Component added.');
            }
            setShowCompModal(false);
            loadStructure(compStructureId);
        } catch (err) { flash(err.response?.data?.message ?? 'Save failed.', 'error'); }
        finally { setCompSaving(false); }
    };

    const deleteComp = async (structureId, compId) => {
        if (!window.confirm('Delete this component?')) return;
        try {
            await api.delete(`/tenant/salary-structures/${structureId}/components/${compId}`);
            flash('Component deleted.');
            loadStructure(structureId);
        } catch (err) { flash(err.response?.data?.message ?? 'Delete failed.', 'error'); }
    };

    const setC = (k, v) => setCompForm(f => ({ ...f, [k]: v }));

    if (loading) return (
        <div className="space-y-4">{[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse h-24" />
        ))}</div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Salary Structures</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Define earning & deduction components for each pay grade</p>
                </div>
                <button onClick={openAddStruct} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    + Add Structure
                </button>
            </div>

            {msg && (
                <div className={`rounded-lg px-4 py-3 text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {msg.text}
                </div>
            )}

            {structures.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
                    No salary structures yet. Click "Add Structure" to create one.
                </div>
            )}

            {/* Structure accordion */}
            <div className="space-y-3">
                {structures.map(s => (
                    <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm">
                        {/* Header row */}
                        <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => toggleExpand(s.id)}>
                            <div className="flex items-center gap-3">
                                <h3 className="font-semibold text-gray-900">{s.name}</h3>
                                {!s.is_active && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
                                <span className="text-xs text-gray-400">
                                    {s.components_count ?? s.components?.length ?? 0} components
                                </span>
                            </div>
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <button onClick={() => openEditStruct(s)} className="text-xs px-3 py-1.5 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50">Edit</button>
                                <button onClick={() => deleteStruct(s.id)} className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">Delete</button>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded[s.id] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Expanded components */}
                        {expanded[s.id] && (
                            <div className="border-t border-gray-100 px-5 py-4">
                                {['earning', 'deduction', 'employer_contribution'].map(type => {
                                    const comps = (s.earnings || s.deductions || s.employer_contributions || s.components || [])
                                        .filter ? (s.components ?? []).filter(c => c.type === type)
                                        : (type === 'earning' ? s.earnings : type === 'deduction' ? s.deductions : s.employer_contributions) ?? [];

                                    const label = { earning: '💰 Earnings', deduction: '➖ Deductions', employer_contribution: '🏢 Employer Contributions' }[type];
                                    return (
                                        <div key={type} className="mb-5">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
                                            </div>
                                            {comps.length === 0
                                                ? <p className="text-xs text-gray-400 italic mb-2">None added yet</p>
                                                : (
                                                    <div className="overflow-x-auto rounded-lg border border-gray-100">
                                                        <table className="w-full text-left">
                                                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                                                                <tr>
                                                                    <th className="px-4 py-2">Name</th>
                                                                    <th className="px-4 py-2">Code</th>
                                                                    <th className="px-4 py-2">Calculation</th>
                                                                    <th className="px-4 py-2">Amount</th>
                                                                    <th className="px-4 py-2">Flags</th>
                                                                    <th className="px-4 py-2">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-gray-50">
                                                                {comps.map(c => (
                                                                    <ComponentRow
                                                                        key={c.id}
                                                                        comp={c}
                                                                        onEdit={comp => openEditComp(s.id, comp)}
                                                                        onDelete={cId => deleteComp(s.id, cId)}
                                                                    />
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )
                                            }
                                        </div>
                                    );
                                })}
                                <button onClick={() => openAddComp(s.id)}
                                        className="mt-1 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                    + Add Component
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Structure Modal */}
            {showStructModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="font-bold text-gray-900">{structEditId ? 'Edit' : 'Add'} Salary Structure</h2>
                            <button onClick={() => setShowStructModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
                        </div>
                        <form onSubmit={saveStruct} className="px-6 py-5 space-y-4">
                            <Field label="Structure Name *">
                                <input required className={inp} value={structForm.name} onChange={e => setStructForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Standard, Senior, Executive" />
                            </Field>
                            <Field label="Description">
                                <textarea rows={2} className={inp} value={structForm.description} onChange={e => setStructForm(f => ({ ...f, description: e.target.value }))} />
                            </Field>
                            <Toggle value={structForm.is_active} onChange={v => setStructForm(f => ({ ...f, is_active: v }))} label="Active" />
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowStructModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={structSaving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium">
                                    {structSaving ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Component Modal */}
            {showCompModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="font-bold text-gray-900">{compEditId ? 'Edit' : 'Add'} Component</h2>
                            <button onClick={() => setShowCompModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
                        </div>
                        <form onSubmit={saveComp} className="px-6 py-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Component Name *">
                                    <input required className={inp} value={compForm.name} onChange={e => setC('name', e.target.value)} placeholder="e.g. Basic Pay" />
                                </Field>
                                <Field label="Code *">
                                    <input required maxLength={20} className={inp} value={compForm.code} onChange={e => setC('code', e.target.value.toUpperCase())} placeholder="BASIC" />
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Type">
                                    <select className={sel} value={compForm.type} onChange={e => setC('type', e.target.value)}>
                                        <option value="earning">Earning</option>
                                        <option value="deduction">Deduction</option>
                                        <option value="employer_contribution">Employer Contribution</option>
                                    </select>
                                </Field>
                                <Field label="Calculation Type">
                                    <select className={sel} value={compForm.calculation_type} onChange={e => setC('calculation_type', e.target.value)}>
                                        {Object.entries(CALC_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                    </select>
                                </Field>
                            </div>
                            <Field label={compForm.calculation_type === 'fixed' ? 'Amount (₹)' : 'Percentage (%)'}>
                                <input type="number" min={0} step="0.01" required className={inp} value={compForm.value} onChange={e => setC('value', e.target.value)} />
                            </Field>
                            <div className="space-y-2">
                                <Toggle value={compForm.is_taxable}        onChange={v => setC('is_taxable', v)}        label="Taxable" />
                                <Toggle value={compForm.is_pf_applicable}  onChange={v => setC('is_pf_applicable', v)}  label="PF Applicable" />
                                <Toggle value={compForm.is_esi_applicable} onChange={v => setC('is_esi_applicable', v)} label="ESI Applicable" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowCompModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={compSaving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium">
                                    {compSaving ? 'Saving…' : 'Save Component'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
