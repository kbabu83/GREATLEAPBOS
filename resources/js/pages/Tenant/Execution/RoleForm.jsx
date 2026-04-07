import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../../services/api';

// ── shared atoms ──────────────────────────────────────────────────────────────
const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

function Field({ label, required, help, error, children }) {
    return (
        <div>
            <label className={labelCls}>
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            {children}
            {help  && <p className="text-xs text-gray-500 mt-1">{help}</p>}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

function SectionCard({ title, subtitle, children }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50/50">
                <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
                {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            <div className="px-5 py-4">{children}</div>
        </div>
    );
}

function TagInput({ value = [], onChange, placeholder }) {
    const [input, setInput] = useState('');
    const add = () => {
        const v = input.trim();
        if (v && !value.includes(v)) onChange([...value, v]);
        setInput('');
    };
    return (
        <div>
            <div className="flex gap-2 mb-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    placeholder={placeholder} className={inputCls + ' flex-1'} />
                <button type="button" onClick={add}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Add
                </button>
            </div>
            {value.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {value.map((v, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                            {v}
                            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}
                                className="text-blue-400 hover:text-blue-700 leading-none">&times;</button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Step 0: Basic Info ────────────────────────────────────────────────────────
function StepBasicInfo({ form, onChange, errors, otherRoles }) {
    const set = (key, val) => onChange({ ...form, [key]: val });
    return (
        <SectionCard title="Role Identity" subtitle="Core details that define this execution role">
            <div className="space-y-4">
                <Field label="Role Name" required error={errors.name}>
                    <input value={form.name} onChange={e => set('name', e.target.value)}
                        placeholder="e.g. Account Manager, Field Engineer" className={inputCls} />
                </Field>
                <Field label="Purpose" help="Describe what this role exists to achieve">
                    <textarea value={form.purpose} onChange={e => set('purpose', e.target.value)} rows={3}
                        placeholder="The primary reason this role exists and the value it delivers…"
                        className={inputCls} />
                </Field>
                <Field label="Reports To (Role)" help="The role this position reports into">
                    <select value={form.reporting_role_id ?? ''}
                        onChange={e => set('reporting_role_id', e.target.value ? Number(e.target.value) : null)}
                        className={inputCls}>
                        <option value="">No reporting role</option>
                        {otherRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </Field>
                <label className="flex items-center gap-3 cursor-pointer">
                    <div onClick={() => set('is_active', !form.is_active)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-blue-600' : 'bg-gray-200'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : ''}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Active Role</span>
                </label>
            </div>
        </SectionCard>
    );
}

// ── Step 1: Areas & KPIs ──────────────────────────────────────────────────────
const BLANK_AREA = { area_name: '', description: '', parameters: [] };

function AreaForm({ draft, setDraft, error, onSave, onCancel, saving, isNew }) {
    const addParam    = () => setDraft(d => ({ ...d, parameters: [...d.parameters, { parameter_name: '', description: '' }] }));
    const removeParam = (i) => setDraft(d => ({ ...d, parameters: d.parameters.filter((_, j) => j !== i) }));
    const setParam    = (i, key, val) => setDraft(d => {
        const p = [...d.parameters]; p[i] = { ...p[i], [key]: val }; return { ...d, parameters: p };
    });

    return (
        <div className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50/30">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">
                {isNew ? 'New Area' : 'Edit Area'}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
                <Field label="Area Name" required>
                    <input value={draft.area_name} onChange={e => setDraft(d => ({ ...d, area_name: e.target.value }))}
                        placeholder="e.g. Client Management" className={inputCls} autoFocus />
                </Field>
                <Field label="Description">
                    <input value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                        placeholder="Brief description" className={inputCls} />
                </Field>
            </div>
            <div className="ml-4 border-l-2 border-blue-100 pl-4 space-y-2 mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    KPI / Performance Parameters
                </p>
                {draft.parameters.map((p, i) => (
                    <div key={i} className="flex gap-2 items-start">
                        <input value={p.parameter_name} onChange={e => setParam(i, 'parameter_name', e.target.value)}
                            placeholder="Parameter name" className={inputCls + ' flex-1'} />
                        <input value={p.description || ''} onChange={e => setParam(i, 'description', e.target.value)}
                            placeholder="Description (optional)" className={inputCls + ' flex-1'} />
                        <button type="button" onClick={() => removeParam(i)}
                            className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
                <button type="button" onClick={addParam}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Parameter
                </button>
            </div>
            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
            <div className="flex gap-2 justify-end">
                <button type="button" onClick={onCancel}
                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="button" onClick={onSave} disabled={saving}
                    className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save Area'}
                </button>
            </div>
        </div>
    );
}

function AreaEditor({ roleId, areas, onAreasChange }) {
    const [editingId, setEditingId] = useState(null); // area.id | 'new' | null
    const [draft, setDraft]         = useState(BLANK_AREA);
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState('');

    const openNew  = () => { setDraft({ ...BLANK_AREA, parameters: [] }); setEditingId('new'); setError(''); };
    const openEdit = (area) => {
        setDraft({
            area_name: area.area_name,
            description: area.description || '',
            parameters: (area.parameters || []).map(p => ({
                id: p.id, parameter_name: p.parameter_name, description: p.description || '',
            })),
        });
        setEditingId(area.id);
        setError('');
    };
    const cancel = () => { setEditingId(null); setDraft(BLANK_AREA); setError(''); };

    const save = async () => {
        if (!draft.area_name.trim()) { setError('Area name is required.'); return; }
        setSaving(true); setError('');
        try {
            if (editingId === 'new') {
                const res = await api.post(`/tenant/execution/roles/${roleId}/areas`, draft);
                onAreasChange([...areas, res.data]);
            } else {
                const res = await api.put(`/tenant/execution/roles/${roleId}/areas/${editingId}`, draft);
                onAreasChange(areas.map(a => a.id === editingId ? res.data : a));
            }
            cancel();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to save area.');
        } finally {
            setSaving(false);
        }
    };

    const remove = async (area) => {
        if (!window.confirm(`Delete "${area.area_name}"? Activities linked to it will lose their area reference.`)) return;
        try {
            await api.delete(`/tenant/execution/roles/${roleId}/areas/${area.id}`);
            onAreasChange(areas.filter(a => a.id !== area.id));
            if (editingId === area.id) cancel();
        } catch {
            alert('Failed to delete area.');
        }
    };

    return (
        <div className="space-y-3">
            {areas.length === 0 && editingId !== 'new' && (
                <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed rounded-xl">
                    No areas yet. Add your first area of operation below.
                </div>
            )}

            {areas.map(area => (
                editingId === area.id ? (
                    <AreaForm key={area.id} draft={draft} setDraft={setDraft} error={error}
                        onSave={save} onCancel={cancel} saving={saving} />
                ) : (
                    <div key={area.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-medium text-sm text-gray-800">{area.area_name}</p>
                                {area.description && (
                                    <p className="text-xs text-gray-500 mt-0.5">{area.description}</p>
                                )}
                                {area.parameters?.length > 0 && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        {area.parameters.length} parameter{area.parameters.length !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-1 ml-4">
                                <button type="button" onClick={() => openEdit(area)}
                                    className="px-2 py-1 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
                                    Edit
                                </button>
                                <button type="button" onClick={() => remove(area)}
                                    className="px-2 py-1 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            ))}

            {editingId === 'new' && (
                <AreaForm draft={draft} setDraft={setDraft} error={error}
                    onSave={save} onCancel={cancel} saving={saving} isNew />
            )}

            {editingId !== 'new' && (
                <button type="button" onClick={openNew}
                    className="flex items-center gap-2 px-4 py-2 text-sm border border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 w-full justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Area of Operation
                </button>
            )}
        </div>
    );
}

// ── Step 2: Activities ────────────────────────────────────────────────────────
const FREQ_TYPES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
const BLANK_ACTIVITY = { activity_name: '', description: '', area_id: null, frequency_type: 'daily', frequency_value: '', is_active: true };

function ActivityForm({ draft, setDraft, areas, error, onSave, onCancel, saving, isNew }) {
    const set = (key, val) => setDraft(d => ({ ...d, [key]: val }));
    return (
        <div className="border-2 border-green-200 rounded-xl p-4 bg-green-50/30">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">
                {isNew ? 'New Activity' : 'Edit Activity'}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
                <Field label="Activity Name" required>
                    <input value={draft.activity_name} onChange={e => set('activity_name', e.target.value)}
                        placeholder="e.g. Daily client follow-up" className={inputCls} autoFocus />
                </Field>
                <Field label="Area">
                    <select value={draft.area_id ?? ''}
                        onChange={e => set('area_id', e.target.value ? Number(e.target.value) : null)}
                        className={inputCls}>
                        <option value="">No specific area</option>
                        {areas.map(a => <option key={a.id} value={a.id}>{a.area_name}</option>)}
                    </select>
                </Field>
                <Field label="Frequency">
                    <select value={draft.frequency_type} onChange={e => set('frequency_type', e.target.value)} className={inputCls}>
                        {FREQ_TYPES.map(f => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
                    </select>
                </Field>
                <Field label="Frequency Detail" help='e.g. "every Monday", "1st–5th of month"'>
                    <input value={draft.frequency_value || ''} onChange={e => set('frequency_value', e.target.value)}
                        placeholder="Optional detail" className={inputCls} />
                </Field>
                <Field label="Description">
                    <input value={draft.description || ''} onChange={e => set('description', e.target.value)}
                        placeholder="Brief description" className={inputCls} />
                </Field>
            </div>
            {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
            <div className="flex gap-2 justify-end">
                <button type="button" onClick={onCancel}
                    className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="button" onClick={onSave} disabled={saving}
                    className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                    {saving ? 'Saving…' : 'Save Activity'}
                </button>
            </div>
        </div>
    );
}

function ActivityEditor({ roleId, activities, areas, onActivitiesChange }) {
    const [editingId, setEditingId] = useState(null);
    const [draft, setDraft]         = useState(BLANK_ACTIVITY);
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState('');

    const openNew  = () => { setDraft({ ...BLANK_ACTIVITY }); setEditingId('new'); setError(''); };
    const openEdit = (act) => {
        setDraft({
            activity_name:   act.activity_name,
            description:     act.description || '',
            area_id:         act.area_id ?? null,
            frequency_type:  act.frequency_type || 'daily',
            frequency_value: act.frequency_value || '',
            is_active:       act.is_active ?? true,
        });
        setEditingId(act.id);
        setError('');
    };
    const cancel = () => { setEditingId(null); setDraft(BLANK_ACTIVITY); setError(''); };

    const save = async () => {
        if (!draft.activity_name.trim()) { setError('Activity name is required.'); return; }
        setSaving(true); setError('');
        try {
            const payload = { ...draft, area_id: draft.area_id || null };
            if (editingId === 'new') {
                const res = await api.post(`/tenant/execution/roles/${roleId}/activities`, payload);
                onActivitiesChange([...activities, res.data]);
            } else {
                const res = await api.put(`/tenant/execution/roles/${roleId}/activities/${editingId}`, payload);
                onActivitiesChange(activities.map(a => a.id === editingId ? res.data : a));
            }
            cancel();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to save activity.');
        } finally {
            setSaving(false);
        }
    };

    const remove = async (act) => {
        if (!window.confirm(`Delete activity "${act.activity_name}"?`)) return;
        try {
            await api.delete(`/tenant/execution/roles/${roleId}/activities/${act.id}`);
            onActivitiesChange(activities.filter(a => a.id !== act.id));
            if (editingId === act.id) cancel();
        } catch {
            alert('Failed to delete activity.');
        }
    };

    const areaLabel = (areaId) => areas.find(a => a.id === areaId)?.area_name ?? '—';

    return (
        <div className="space-y-3">
            {activities.length === 0 && editingId !== 'new' && (
                <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed rounded-xl">
                    No activities yet. Add recurring tasks and responsibilities below.
                </div>
            )}

            {activities.map(act => (
                editingId === act.id ? (
                    <ActivityForm key={act.id} draft={draft} setDraft={setDraft} areas={areas}
                        error={error} onSave={save} onCancel={cancel} saving={saving} />
                ) : (
                    <div key={act.id} className="border border-gray-200 rounded-xl p-4 bg-white">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-medium text-sm text-gray-800">{act.activity_name}</p>
                                <div className="flex gap-3 mt-1">
                                    {act.area_id && (
                                        <span className="text-xs text-blue-600">{areaLabel(act.area_id)}</span>
                                    )}
                                    <span className="text-xs text-gray-500 capitalize">
                                        {act.frequency_type}{act.frequency_value ? ` · ${act.frequency_value}` : ''}
                                    </span>
                                </div>
                                {act.description && (
                                    <p className="text-xs text-gray-500 mt-0.5">{act.description}</p>
                                )}
                            </div>
                            <div className="flex gap-1 ml-4">
                                <button type="button" onClick={() => openEdit(act)}
                                    className="px-2 py-1 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
                                    Edit
                                </button>
                                <button type="button" onClick={() => remove(act)}
                                    className="px-2 py-1 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            ))}

            {editingId === 'new' && (
                <ActivityForm draft={draft} setDraft={setDraft} areas={areas}
                    error={error} onSave={save} onCancel={cancel} saving={saving} isNew />
            )}

            {editingId !== 'new' && (
                <button type="button" onClick={openNew}
                    className="flex items-center gap-2 px-4 py-2 text-sm border border-dashed border-green-300 text-green-700 rounded-lg hover:bg-green-50 w-full justify-center">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Major Activity
                </button>
            )}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const STEPS = [
    { label: 'Basic Info' },
    { label: 'Areas & KPIs' },
    { label: 'Activities' },
    { label: 'Skills' },
    { label: 'Ideal Profile' },
    { label: 'Performance' },
];

const BLANK_BASIC = { name: '', purpose: '', reporting_role_id: null, is_active: true };
const BLANK_META  = {
    skills:                 { hard_skills: [], soft_skills: [] },
    ideal_profile:          { education: '', experience_range: '', additional_requirements: '' },
    performance_definition: { excellent_definition: '', average_definition: '', poor_definition: '' },
};

export default function RoleForm() {
    const navigate  = useNavigate();
    const { id }    = useParams();
    const isEdit    = Boolean(id);

    const [step, setStep]               = useState(0);
    // savedRoleId is set after step 0 saves; for edit it's the URL id.
    const [savedRoleId, setSavedRoleId] = useState(isEdit ? Number(id) : null);
    const [basic, setBasic]             = useState(BLANK_BASIC);
    const [areas, setAreas]             = useState([]);
    const [activities, setActivities]   = useState([]);
    const [meta, setMeta]               = useState(BLANK_META);
    const [allRoles, setAllRoles]       = useState([]);
    const [errors, setErrors]           = useState({});
    const [loading, setLoading]         = useState(isEdit);
    const [saving, setSaving]           = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                const rolesRes = await api.get('/tenant/execution/roles');
                setAllRoles(rolesRes.data || []);
                if (isEdit) {
                    const res = await api.get(`/tenant/execution/roles/${id}`);
                    const d   = res.data;
                    setBasic({
                        name:              d.name || '',
                        purpose:           d.purpose || '',
                        reporting_role_id: d.reporting_role_id ?? null,
                        is_active:         d.is_active ?? true,
                    });
                    setAreas((d.areas || []).map(a => ({ ...a, parameters: a.parameters || [] })));
                    setActivities(d.activities || []);
                    setMeta({
                        skills: {
                            hard_skills: d.skills?.hard_skills || [],
                            soft_skills: d.skills?.soft_skills || [],
                        },
                        ideal_profile: {
                            education:               d.ideal_profile?.education || '',
                            experience_range:        d.ideal_profile?.experience_range || '',
                            additional_requirements: d.ideal_profile?.additional_requirements || '',
                        },
                        performance_definition: {
                            excellent_definition: d.performance_definition?.excellent_definition || '',
                            average_definition:   d.performance_definition?.average_definition || '',
                            poor_definition:      d.performance_definition?.poor_definition || '',
                        },
                    });
                }
            } catch { /* silent */ }
            finally { setLoading(false); }
        };
        init();
    }, [id, isEdit]);

    const otherRoles = allRoles.filter(r => String(r.id) !== String(id));

    // ── Step 0 action ─────────────────────────────────────────────────────────
    const saveBasicAndAdvance = async () => {
        const e = {};
        if (!basic.name.trim()) e.name = 'Role name is required';
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        setSaving(true);
        try {
            const payload = {
                name:              basic.name,
                purpose:           basic.purpose || null,
                reporting_role_id: basic.reporting_role_id || null,
                is_active:         basic.is_active,
            };
            if (savedRoleId) {
                await api.put(`/tenant/execution/roles/${savedRoleId}`, payload);
            } else {
                const res = await api.post('/tenant/execution/roles', payload);
                const newId = res.data.id;
                setSavedRoleId(newId);
                // Update URL without reload so back-button works properly
                window.history.replaceState(null, '', `/execution/roles/${newId}`);
            }
            setErrors({});
            setStep(1);
        } catch (err) {
            setErrors({ general: err.response?.data?.message || 'Failed to save role.' });
        } finally {
            setSaving(false);
        }
    };

    // ── Steps 3-5 final save ──────────────────────────────────────────────────
    const saveMetaAndFinish = async () => {
        setSaving(true);
        try {
            await api.put(`/tenant/execution/roles/${savedRoleId}`, {
                skills:                 meta.skills,
                ideal_profile:          meta.ideal_profile,
                performance_definition: meta.performance_definition,
            });
            navigate('/app/execution/roles');
        } catch (err) {
            setErrors({ general: err.response?.data?.message || 'Failed to save.' });
        } finally {
            setSaving(false);
        }
    };

    const setMetaNested = (section, key, val) =>
        setMeta(m => ({ ...m, [section]: { ...m[section], [key]: val } }));

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate('/app/execution/roles')}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Role' : 'Create New Role'}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Define the role's purpose, activities, skills, and performance standards
                    </p>
                </div>
            </div>

            {errors.general && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {errors.general}
                </div>
            )}

            {/* Step indicator */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
                {STEPS.map((s, i) => {
                    const completed = i < step;
                    const active    = i === step;
                    const locked    = i > step;
                    return (
                        <button key={i} type="button"
                            onClick={() => { if (!locked) setStep(i); }}
                            disabled={locked}
                            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                                active    ? 'bg-white shadow-sm text-blue-700' :
                                completed ? 'text-gray-600 hover:text-gray-900' :
                                            'text-gray-400 cursor-not-allowed'
                            }`}>
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${
                                completed ? 'bg-green-500 text-white' :
                                active    ? 'bg-blue-600 text-white' :
                                            'bg-gray-300 text-gray-600'
                            }`}>
                                {completed ? '✓' : i + 1}
                            </span>
                            {s.label}
                        </button>
                    );
                })}
            </div>

            {/* ── Step 0: Basic Info ─────────────────────────────────────────── */}
            {step === 0 && (
                <>
                    <StepBasicInfo form={basic} onChange={setBasic} errors={errors} otherRoles={otherRoles} />
                    <div className="flex justify-end mt-6 pt-4 border-t gap-3">
                        <button type="button" onClick={() => navigate('/app/execution/roles')}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="button" onClick={saveBasicAndAdvance} disabled={saving}
                            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {saving ? 'Saving…' : 'Save & Continue →'}
                        </button>
                    </div>
                </>
            )}

            {/* ── Step 1: Areas & KPIs ──────────────────────────────────────── */}
            {step === 1 && (
                <>
                    <SectionCard title="Areas of Operation"
                        subtitle="Define the operational domains for this role. Each area is saved immediately.">
                        <AreaEditor roleId={savedRoleId} areas={areas} onAreasChange={setAreas} />
                    </SectionCard>
                    <div className="flex justify-between mt-6 pt-4 border-t">
                        <button type="button" onClick={() => setStep(0)}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                            ← Previous
                        </button>
                        <button type="button" onClick={() => setStep(2)}
                            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Continue →
                        </button>
                    </div>
                </>
            )}

            {/* ── Step 2: Activities ────────────────────────────────────────── */}
            {step === 2 && (
                <>
                    <SectionCard title="Major Activities"
                        subtitle="Recurring tasks mapped to areas. Each activity is saved immediately.">
                        <ActivityEditor roleId={savedRoleId} activities={activities}
                            areas={areas} onActivitiesChange={setActivities} />
                    </SectionCard>
                    <div className="flex justify-between mt-6 pt-4 border-t">
                        <button type="button" onClick={() => setStep(1)}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                            ← Previous
                        </button>
                        <button type="button" onClick={() => setStep(3)}
                            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Continue →
                        </button>
                    </div>
                </>
            )}

            {/* ── Steps 3-5: Meta (Skills / Ideal Profile / Performance) ────── */}
            {step >= 3 && (
                <form onSubmit={e => { e.preventDefault(); saveMetaAndFinish(); }}>
                    {/* Step 3: Skills */}
                    {step === 3 && (
                        <SectionCard title="Skills Required"
                            subtitle="Hard and soft skills expected for this role">
                            <div className="space-y-5">
                                <Field label="Hard Skills" help="Press Enter or click Add after each skill">
                                    <TagInput value={meta.skills.hard_skills}
                                        onChange={v => setMetaNested('skills', 'hard_skills', v)}
                                        placeholder="e.g. Salesforce CRM, Excel, Python…" />
                                </Field>
                                <Field label="Soft Skills" help="Press Enter or click Add after each skill">
                                    <TagInput value={meta.skills.soft_skills}
                                        onChange={v => setMetaNested('skills', 'soft_skills', v)}
                                        placeholder="e.g. Communication, Leadership, Problem Solving…" />
                                </Field>
                            </div>
                        </SectionCard>
                    )}

                    {/* Step 4: Ideal Profile */}
                    {step === 4 && (
                        <SectionCard title="Ideal Candidate Profile"
                            subtitle="Education, experience and other requirements">
                            <div className="space-y-4">
                                <Field label="Education">
                                    <input value={meta.ideal_profile.education}
                                        onChange={e => setMetaNested('ideal_profile', 'education', e.target.value)}
                                        placeholder="e.g. Bachelor's in Business Administration or equivalent"
                                        className={inputCls} />
                                </Field>
                                <Field label="Experience Range" help="e.g. 3–5 years">
                                    <input value={meta.ideal_profile.experience_range}
                                        onChange={e => setMetaNested('ideal_profile', 'experience_range', e.target.value)}
                                        placeholder="e.g. 3–5 years in a client-facing role"
                                        className={inputCls} />
                                </Field>
                                <Field label="Additional Requirements">
                                    <textarea value={meta.ideal_profile.additional_requirements}
                                        onChange={e => setMetaNested('ideal_profile', 'additional_requirements', e.target.value)}
                                        rows={3} placeholder="Certifications, tools, languages, travel requirements…"
                                        className={inputCls} />
                                </Field>
                            </div>
                        </SectionCard>
                    )}

                    {/* Step 5: Performance */}
                    {step === 5 && (
                        <SectionCard title="Performance Definitions"
                            subtitle="Define what excellent, average, and poor performance looks like">
                            <div className="space-y-4">
                                <Field label="Excellent Performance">
                                    <textarea value={meta.performance_definition.excellent_definition}
                                        onChange={e => setMetaNested('performance_definition', 'excellent_definition', e.target.value)}
                                        rows={3} placeholder="What does outstanding execution of this role look like?"
                                        className={inputCls + ' border-green-200 focus:ring-green-400'} />
                                </Field>
                                <Field label="Average Performance">
                                    <textarea value={meta.performance_definition.average_definition}
                                        onChange={e => setMetaNested('performance_definition', 'average_definition', e.target.value)}
                                        rows={3} placeholder="What does meeting-expectations performance look like?"
                                        className={inputCls + ' border-yellow-200 focus:ring-yellow-400'} />
                                </Field>
                                <Field label="Poor Performance">
                                    <textarea value={meta.performance_definition.poor_definition}
                                        onChange={e => setMetaNested('performance_definition', 'poor_definition', e.target.value)}
                                        rows={3} placeholder="What does below-expectations performance look like?"
                                        className={inputCls + ' border-red-200 focus:ring-red-400'} />
                                </Field>
                            </div>
                        </SectionCard>
                    )}

                    <div className="flex justify-between mt-6 pt-4 border-t">
                        <button type="button" onClick={() => setStep(s => s - 1)}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                            ← Previous
                        </button>
                        {step < 5 ? (
                            <button type="button" onClick={() => setStep(s => s + 1)}
                                className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Continue →
                            </button>
                        ) : (
                            <button type="submit" disabled={saving}
                                className="px-6 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 min-w-[140px]">
                                {saving ? 'Saving…' : isEdit ? 'Update Role' : 'Complete Role'}
                            </button>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}
