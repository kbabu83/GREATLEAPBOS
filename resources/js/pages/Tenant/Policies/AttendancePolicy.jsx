import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/UI/Card';
import api from '../../../services/api';

// ── Icons ─────────────────────────────────────────────────────────────────────
function PlusIcon() {
    return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function EditIcon() {
    return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
}
function TrashIcon() {
    return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
function StarIcon() {
    return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const inputCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const defaultForm = {
    name: '',
    work_hours_per_day: '',
    work_days_per_week: '',
    work_start_time: '',
    work_end_time: '',
    grace_period_minutes: '',
    half_day_hours: '',
    cycle_type: 'calendar_month',
    cycle_start_day: '',
    week_off_days: [],
    late_deduction_applicable: false,
    late_deduction_type: 'none',
    overtime_applicable: false,
};

function Toggle({ checked, onChange, label }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer">
            <div
                onClick={() => onChange(!checked)}
                className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-gray-700">{label}</span>
        </label>
    );
}

function PolicyCard({ policy, onEdit, onDelete, onSetDefault }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900">{policy.name}</h3>
                        {policy.is_default && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                                <StarIcon /> Default
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {!policy.is_default && (
                        <button onClick={() => onSetDefault(policy)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Set as Default">
                            <StarIcon />
                        </button>
                    )}
                    <button onClick={() => onEdit(policy)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <EditIcon />
                    </button>
                    <button onClick={() => onDelete(policy)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <TrashIcon />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Work Hours/Day</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{policy.work_hours_per_day ?? '—'} hrs</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Days/Week</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{policy.work_days_per_week ?? '—'} days</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Shift Time</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                        {policy.work_start_time && policy.work_end_time
                            ? `${policy.work_start_time} – ${policy.work_end_time}`
                            : '—'}
                    </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Cycle Type</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5 capitalize">{policy.cycle_type?.replace(/_/g, ' ') ?? '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Grace Period</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{policy.grace_period_minutes ?? '0'} min</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Week Offs</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">
                        {(policy.week_off_days || []).length > 0
                            ? policy.week_off_days.map(d => WEEK_DAYS[d]?.slice(0, 3)).join(', ')
                            : '—'}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AttendancePolicy() {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editPolicy, setEditPolicy] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [message, setMessage] = useState(null);

    const showMsg = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const fetchPolicies = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tenant/attendance-policies');
            setPolicies(Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
        } catch {
            showMsg('error', 'Failed to load attendance policies.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPolicies(); }, []);

    const openCreate = () => {
        setEditPolicy(null);
        setForm(defaultForm);
        setShowModal(true);
    };

    const openEdit = (policy) => {
        setEditPolicy(policy);
        setForm({
            name: policy.name || '',
            work_hours_per_day: policy.work_hours_per_day ?? '',
            work_days_per_week: policy.work_days_per_week ?? '',
            work_start_time: policy.work_start_time || '',
            work_end_time: policy.work_end_time || '',
            grace_period_minutes: policy.grace_period_minutes ?? '',
            half_day_hours: policy.half_day_hours ?? '',
            cycle_type: policy.cycle_type || 'calendar_month',
            cycle_start_day: policy.cycle_start_day ?? '',
            week_off_days: policy.week_off_days || [],
            late_deduction_applicable: Boolean(policy.late_deduction_applicable),
            late_deduction_type: policy.late_deduction_type || 'none',
            overtime_applicable: Boolean(policy.overtime_applicable),
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                cycle_start_day: form.cycle_type === 'custom' ? form.cycle_start_day : null,
                late_deduction_type: form.late_deduction_applicable ? form.late_deduction_type : 'none',
            };
            if (editPolicy) {
                await api.put(`/tenant/attendance-policies/${editPolicy.id}`, payload);
                showMsg('success', 'Policy updated.');
            } else {
                await api.post('/tenant/attendance-policies', payload);
                showMsg('success', 'Policy created.');
            }
            setShowModal(false);
            fetchPolicies();
        } catch (err) {
            showMsg('error', err.response?.data?.message || 'Failed to save policy.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/tenant/attendance-policies/${deleteConfirm.id}`);
            setDeleteConfirm(null);
            showMsg('success', 'Policy deleted.');
            fetchPolicies();
        } catch {
            showMsg('error', 'Failed to delete policy.');
            setDeleteConfirm(null);
        }
    };

    const handleSetDefault = async (policy) => {
        try {
            await api.patch(`/tenant/attendance-policies/${policy.id}/set-default`);
            showMsg('success', `"${policy.name}" set as default.`);
            fetchPolicies();
        } catch {
            showMsg('error', 'Failed to set default policy.');
        }
    };

    const toggleWeekOff = (dayIdx) => {
        setForm(f => ({
            ...f,
            week_off_days: f.week_off_days.includes(dayIdx)
                ? f.week_off_days.filter(d => d !== dayIdx)
                : [...f.week_off_days, dayIdx],
        }));
    };

    const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendance Policies</h1>
                    <p className="text-sm text-gray-500 mt-1">Define work schedules, cycles, and deduction rules</p>
                </div>
                <div className="flex items-center gap-3">
                    {message && (
                        <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {message.text}
                        </span>
                    )}
                    <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <PlusIcon /> Add Policy
                    </button>
                </div>
            </div>

            {/* Policy cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                            <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
                            <div className="grid grid-cols-3 gap-3">
                                {[...Array(6)].map((_, j) => <div key={j} className="h-14 bg-gray-100 rounded-lg" />)}
                            </div>
                        </div>
                    ))}
                </div>
            ) : policies.length === 0 ? (
                <Card>
                    <div className="text-center py-16 text-gray-400">
                        <p className="text-lg font-medium">No attendance policies yet</p>
                        <p className="text-sm mt-1">Create your first policy to get started.</p>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {policies.map(p => (
                        <PolicyCard
                            key={p.id}
                            policy={p}
                            onEdit={openEdit}
                            onDelete={setDeleteConfirm}
                            onSetDefault={handleSetDefault}
                        />
                    ))}
                </div>
            )}

            {/* Add / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
                            <h2 className="text-base font-semibold text-gray-900">
                                {editPolicy ? 'Edit Attendance Policy' : 'Add Attendance Policy'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            {/* Name */}
                            <div>
                                <label className={labelCls}>Policy Name <span className="text-red-500">*</span></label>
                                <input type="text" value={form.name} onChange={set('name')} className={inputCls} required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Work Hours / Day</label>
                                    <input type="number" step="0.5" min="0" max="24" value={form.work_hours_per_day} onChange={set('work_hours_per_day')} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Work Days / Week</label>
                                    <input type="number" min="1" max="7" value={form.work_days_per_week} onChange={set('work_days_per_week')} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Work Start Time</label>
                                    <input type="time" value={form.work_start_time} onChange={set('work_start_time')} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Work End Time</label>
                                    <input type="time" value={form.work_end_time} onChange={set('work_end_time')} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Grace Period (minutes)</label>
                                    <input type="number" min="0" value={form.grace_period_minutes} onChange={set('grace_period_minutes')} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Half Day Hours</label>
                                    <input type="number" step="0.5" min="0" value={form.half_day_hours} onChange={set('half_day_hours')} className={inputCls} />
                                </div>
                            </div>

                            {/* Cycle */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Cycle Type</label>
                                    <select value={form.cycle_type} onChange={set('cycle_type')} className={inputCls}>
                                        <option value="calendar_month">Calendar Month</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                </div>
                                {form.cycle_type === 'custom' && (
                                    <div>
                                        <label className={labelCls}>Cycle Start Day</label>
                                        <input type="number" min="1" max="28" value={form.cycle_start_day} onChange={set('cycle_start_day')} className={inputCls} placeholder="e.g. 25" />
                                    </div>
                                )}
                            </div>

                            {/* Week Off Days */}
                            <div>
                                <label className={labelCls}>Week Off Days</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {WEEK_DAYS.map((day, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => toggleWeekOff(idx)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                                form.week_off_days.includes(idx)
                                                    ? 'bg-blue-600 border-blue-600 text-white'
                                                    : 'border-gray-200 text-gray-600 hover:border-blue-300'
                                            }`}
                                        >
                                            {day.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Late Deduction */}
                            <div className="space-y-3">
                                <Toggle
                                    checked={form.late_deduction_applicable}
                                    onChange={v => setForm(f => ({ ...f, late_deduction_applicable: v }))}
                                    label="Late Deduction Applicable"
                                />
                                {form.late_deduction_applicable && (
                                    <div>
                                        <label className={labelCls}>Late Deduction Type</label>
                                        <select value={form.late_deduction_type} onChange={set('late_deduction_type')} className={inputCls}>
                                            <option value="none">None</option>
                                            <option value="half_day">Half Day</option>
                                            <option value="full_day">Full Day</option>
                                            <option value="per_minute">Per Minute</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Overtime */}
                            <Toggle
                                checked={form.overtime_applicable}
                                onChange={v => setForm(f => ({ ...f, overtime_applicable: v }))}
                                label="Overtime Applicable"
                            />

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                                    {saving ? 'Saving...' : editPolicy ? 'Save Changes' : 'Create Policy'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-2">Delete Policy</h2>
                        <p className="text-sm text-gray-600 mb-6">
                            Delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
