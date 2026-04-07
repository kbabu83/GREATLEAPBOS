import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const EMPTY_FORM = {
    name: '',
    attendance_cycle_type: 'calendar_month',
    attendance_cycle_start_day: 25,
    payroll_cycle_type: 'calendar_month',
    payroll_cycle_start_day: 1,
    payment_frequency: 'monthly',
    payment_day: 28,
    working_days_basis: 'fixed_26',
    lop_applicable: true,
    lop_deduction_basis: 'per_day',
    block_on_missing_attendance: false,
    block_on_missing_pan: false,
    block_on_missing_bank_details: true,
    block_on_missing_uan: false,
    include_arrears: true,
    is_active: true,
};

const FREQ_LABELS = { monthly: 'Monthly', weekly: 'Weekly', daily: 'Daily', adhoc: 'Ad-hoc' };
const BASIS_LABELS = {
    calendar_days: 'Calendar Days (÷ days in month)',
    fixed_26: 'Fixed 26 Days',
    fixed_30: 'Fixed 30 Days',
    actual_working_days: 'Actual Working Days',
};

function Badge({ label, color = 'blue' }) {
    const colors = {
        blue:  'bg-blue-100 text-blue-700',
        green: 'bg-green-100 text-green-700',
        amber: 'bg-amber-100 text-amber-700',
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
            {label}
        </span>
    );
}

function Toggle({ value, onChange, label }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
                onClick={() => onChange(!value)}
                className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
            </div>
            <span className="text-sm text-gray-700">{label}</span>
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

const inp = 'border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500';
const sel = inp + ' bg-white';

export default function PayrollPolicy() {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId]     = useState(null);
    const [form, setForm]         = useState(EMPTY_FORM);
    const [saving, setSaving]     = useState(false);
    const [msg, setMsg]           = useState(null);

    const flash = (text, type = 'success') => {
        setMsg({ text, type });
        setTimeout(() => setMsg(null), 3500);
    };

    const load = async () => {
        try {
            const res = await api.get('/tenant/payroll-policies');
            setPolicies(Array.isArray(res.data.data) ? res.data.data : res.data);
        } catch { flash('Failed to load payroll policies.', 'error'); }
        finally  { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const openAdd = () => {
        setEditId(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const openEdit = (p) => {
        setEditId(p.id);
        setForm({ ...EMPTY_FORM, ...p });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editId) {
                await api.put(`/tenant/payroll-policies/${editId}`, form);
                flash('Policy updated.');
            } else {
                await api.post('/tenant/payroll-policies', form);
                flash('Policy created.');
            }
            setShowModal(false);
            load();
        } catch (err) {
            flash(err.response?.data?.message ?? 'Save failed.', 'error');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this payroll policy?')) return;
        try {
            await api.delete(`/tenant/payroll-policies/${id}`);
            flash('Policy deleted.');
            load();
        } catch (err) { flash(err.response?.data?.message ?? 'Delete failed.', 'error'); }
    };

    const setDefault = async (id) => {
        try {
            await api.patch(`/tenant/payroll-policies/${id}/set-default`);
            flash('Default updated.');
            load();
        } catch { flash('Failed to set default.', 'error'); }
    };

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    if (loading) return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse h-28" />
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Payroll Policies</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Configure payroll & attendance cycles, payment rules</p>
                </div>
                <button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    + Add Policy
                </button>
            </div>

            {msg && (
                <div className={`rounded-lg px-4 py-3 text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {msg.text}
                </div>
            )}

            {policies.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
                    No payroll policies yet. Click "Add Policy" to create one.
                </div>
            )}

            {/* Policy Cards */}
            <div className="grid gap-4">
                {policies.map(p => (
                    <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="font-semibold text-gray-900">{p.name}</h3>
                                {p.is_default && <Badge label="Default" color="green" />}
                                {!p.is_active  && <Badge label="Inactive" color="amber" />}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {!p.is_default && (
                                    <button onClick={() => setDefault(p.id)}
                                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
                                        Set Default
                                    </button>
                                )}
                                <button onClick={() => openEdit(p)}
                                        className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50">
                                    Edit
                                </button>
                                <button onClick={() => handleDelete(p.id)}
                                        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                                    Delete
                                </button>
                            </div>
                        </div>

                        {/* Summary grid */}
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Attendance Cycle</p>
                                <p className="font-medium text-gray-800 mt-0.5">
                                    {p.attendance_cycle_type === 'calendar_month'
                                        ? 'Calendar Month'
                                        : `${p.attendance_cycle_start_day}th – ${p.attendance_cycle_start_day - 1}th`}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Payroll Cycle</p>
                                <p className="font-medium text-gray-800 mt-0.5">
                                    {p.payroll_cycle_type === 'calendar_month'
                                        ? 'Calendar Month'
                                        : `${p.payroll_cycle_start_day}th – ${p.payroll_cycle_start_day - 1}th`}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Payment</p>
                                <p className="font-medium text-gray-800 mt-0.5">
                                    {FREQ_LABELS[p.payment_frequency]} (Day {p.payment_day})
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Salary Basis</p>
                                <p className="font-medium text-gray-800 mt-0.5">{BASIS_LABELS[p.working_days_basis]?.split(' ')[0] ?? p.working_days_basis}</p>
                            </div>
                        </div>

                        {/* Block flags */}
                        <div className="mt-3 flex flex-wrap gap-2">
                            {p.block_on_missing_attendance  && <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">Block: Missing Attendance</span>}
                            {p.block_on_missing_bank_details && <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">Block: Missing Bank Details</span>}
                            {p.block_on_missing_pan          && <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">Block: Missing PAN</span>}
                            {p.block_on_missing_uan          && <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">Block: Missing UAN</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-base font-bold text-gray-900">{editId ? 'Edit' : 'Add'} Payroll Policy</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                        </div>

                        <form onSubmit={handleSave} className="px-6 py-5 space-y-6">
                            <Field label="Policy Name *">
                                <input required className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Standard Monthly" />
                            </Field>

                            {/* Attendance Cycle */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Attendance Cycle</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Cycle Type">
                                        <select className={sel} value={form.attendance_cycle_type} onChange={e => set('attendance_cycle_type', e.target.value)}>
                                            <option value="calendar_month">Calendar Month (1st–Last)</option>
                                            <option value="custom">Custom Start Day</option>
                                        </select>
                                    </Field>
                                    {form.attendance_cycle_type === 'custom' && (
                                        <Field label="Start Day (1–28)">
                                            <input type="number" min={1} max={28} className={inp} value={form.attendance_cycle_start_day} onChange={e => set('attendance_cycle_start_day', +e.target.value)} />
                                        </Field>
                                    )}
                                </div>
                            </div>

                            {/* Payroll Cycle */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Payroll Cycle</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Cycle Type">
                                        <select className={sel} value={form.payroll_cycle_type} onChange={e => set('payroll_cycle_type', e.target.value)}>
                                            <option value="calendar_month">Calendar Month (1st–Last)</option>
                                            <option value="custom">Custom Start Day</option>
                                        </select>
                                    </Field>
                                    {form.payroll_cycle_type === 'custom' && (
                                        <Field label="Start Day (1–28)">
                                            <input type="number" min={1} max={28} className={inp} value={form.payroll_cycle_start_day} onChange={e => set('payroll_cycle_start_day', +e.target.value)} />
                                        </Field>
                                    )}
                                </div>
                            </div>

                            {/* Payment */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Payment</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Payment Frequency">
                                        <select className={sel} value={form.payment_frequency} onChange={e => set('payment_frequency', e.target.value)}>
                                            {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Payment Day of Month">
                                        <input type="number" min={1} max={31} className={inp} value={form.payment_day} onChange={e => set('payment_day', +e.target.value)} />
                                    </Field>
                                </div>
                            </div>

                            {/* Salary Calc */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Salary Calculation</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Working Days Basis">
                                        <select className={sel} value={form.working_days_basis} onChange={e => set('working_days_basis', e.target.value)}>
                                            {Object.entries(BASIS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="LOP Deduction">
                                        <select className={sel} value={form.lop_deduction_basis} onChange={e => set('lop_deduction_basis', e.target.value)}>
                                            <option value="per_day">Per Day</option>
                                            <option value="per_half_day">Per Half Day</option>
                                        </select>
                                    </Field>
                                </div>
                            </div>

                            {/* Payroll Blocks */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Block Payroll If Missing</p>
                                <div className="space-y-3">
                                    <Toggle value={form.block_on_missing_attendance}   onChange={v => set('block_on_missing_attendance', v)}   label="Missing attendance data" />
                                    <Toggle value={form.block_on_missing_bank_details} onChange={v => set('block_on_missing_bank_details', v)} label="Missing bank details" />
                                    <Toggle value={form.block_on_missing_pan}          onChange={v => set('block_on_missing_pan', v)}          label="Missing PAN number" />
                                    <Toggle value={form.block_on_missing_uan}          onChange={v => set('block_on_missing_uan', v)}          label="Missing UAN number" />
                                </div>
                            </div>

                            <Toggle value={form.is_active} onChange={v => set('is_active', v)} label="Policy is active" />

                            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium">
                                    {saving ? 'Saving…' : 'Save Policy'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
