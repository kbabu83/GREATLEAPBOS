import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const INDIAN_STATES = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
    'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
    'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
    'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
    'Delhi','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh',
];

const DEFAULT = {
    pf_applicable: false, pf_registration_number: '', pf_employee_rate: 12, pf_employer_rate: 12,
    pf_wage_ceiling: 15000, pf_on_actual_basic: false,
    esi_applicable: false, esi_registration_number: '', esi_employee_rate: 0.75, esi_employer_rate: 3.25,
    esi_wage_ceiling: 21000,
    pt_applicable: false, pt_state: '', pt_slabs: [],
    tds_applicable: false, tds_regime: 'new',
    lwf_applicable: false, lwf_state: '', lwf_employee_amount: 0, lwf_employer_amount: 0,
    gratuity_applicable: false, gratuity_rate: 4.81,
};

const inp  = 'border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500';
const sel  = inp + ' bg-white';
const ninp = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

function Toggle({ value, onChange, label, description }) {
    return (
        <label className="flex items-start gap-3 cursor-pointer select-none">
            <div onClick={() => onChange(!value)}
                 className={`relative mt-0.5 flex-shrink-0 w-10 h-5 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-gray-200'}`}>
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
            </div>
        </label>
    );
}

function Section({ title, icon, children }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span>{icon}</span> {title}
            </h2>
            {children}
        </div>
    );
}

function Grid2({ children }) {
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">{children}</div>;
}

function Field({ label, children }) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            {children}
        </div>
    );
}

export default function Compliance() {
    const [form, setForm]   = useState(DEFAULT);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [msg, setMsg]         = useState(null);

    const flash = (text, type = 'success') => {
        setMsg({ text, type });
        setTimeout(() => setMsg(null), 4000);
    };

    useEffect(() => {
        api.get('/tenant/compliance')
           .then(res => setForm({ ...DEFAULT, ...(res.data.compliance ?? res.data) }))
           .catch(() => flash('Failed to load compliance settings.', 'error'))
           .finally(() => setLoading(false));
    }, []);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/tenant/compliance', form);
            flash('Compliance settings saved successfully.');
        } catch (err) {
            flash(err.response?.data?.message ?? 'Save failed.', 'error');
        } finally { setSaving(false); }
    };

    // PT Slab helpers
    const addSlab  = () => set('pt_slabs', [...(form.pt_slabs ?? []), { from: 0, to: null, amount: 0 }]);
    const setSlab  = (i, k, v) => set('pt_slabs', form.pt_slabs.map((s, idx) => idx === i ? { ...s, [k]: v } : s));
    const delSlab  = (i) => set('pt_slabs', form.pt_slabs.filter((_, idx) => idx !== i));

    if (loading) return (
        <div className="space-y-4">{[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse h-32" />
        ))}</div>
    );

    return (
        <form onSubmit={handleSave} className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Compliance Settings</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Configure statutory deductions — PF, ESI, PT, TDS, LWF, Gratuity</p>
                </div>
                <button type="submit" disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium">
                    {saving ? 'Saving…' : 'Save Settings'}
                </button>
            </div>

            {msg && (
                <div className={`rounded-lg px-4 py-3 text-sm font-medium ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {msg.text}
                </div>
            )}

            {/* PF */}
            <Section title="Provident Fund (PF)" icon="🏦">
                <Toggle value={form.pf_applicable} onChange={v => set('pf_applicable', v)}
                        label="PF Applicable" description="Employee and employer PF contributions" />
                {form.pf_applicable && (
                    <Grid2>
                        <Field label="PF Registration Number">
                            <input className={inp} value={form.pf_registration_number} onChange={e => set('pf_registration_number', e.target.value)} placeholder="MHBAN123456789" />
                        </Field>
                        <Field label="Wage Ceiling (₹)">
                            <input type="number" className={inp} value={form.pf_wage_ceiling} onChange={e => set('pf_wage_ceiling', +e.target.value)} />
                        </Field>
                        <Field label="Employee Contribution (%)">
                            <input type="number" step="0.01" min={0} max={100} className={inp} value={form.pf_employee_rate} onChange={e => set('pf_employee_rate', +e.target.value)} />
                        </Field>
                        <Field label="Employer Contribution (%)">
                            <input type="number" step="0.01" min={0} max={100} className={inp} value={form.pf_employer_rate} onChange={e => set('pf_employer_rate', +e.target.value)} />
                        </Field>
                        <div className="sm:col-span-2">
                            <Toggle value={form.pf_on_actual_basic} onChange={v => set('pf_on_actual_basic', v)}
                                    label="Apply PF on actual basic (ignore wage ceiling)" />
                        </div>
                    </Grid2>
                )}
            </Section>

            {/* ESI */}
            <Section title="Employees' State Insurance (ESI)" icon="🏥">
                <Toggle value={form.esi_applicable} onChange={v => set('esi_applicable', v)}
                        label="ESI Applicable" description="For employees with gross salary ≤ ESI wage ceiling" />
                {form.esi_applicable && (
                    <Grid2>
                        <Field label="ESI Registration Number">
                            <input className={inp} value={form.esi_registration_number} onChange={e => set('esi_registration_number', e.target.value)} />
                        </Field>
                        <Field label="Wage Ceiling (₹)">
                            <input type="number" className={inp} value={form.esi_wage_ceiling} onChange={e => set('esi_wage_ceiling', +e.target.value)} />
                        </Field>
                        <Field label="Employee Contribution (%)">
                            <input type="number" step="0.01" min={0} max={100} className={inp} value={form.esi_employee_rate} onChange={e => set('esi_employee_rate', +e.target.value)} />
                        </Field>
                        <Field label="Employer Contribution (%)">
                            <input type="number" step="0.01" min={0} max={100} className={inp} value={form.esi_employer_rate} onChange={e => set('esi_employer_rate', +e.target.value)} />
                        </Field>
                    </Grid2>
                )}
            </Section>

            {/* PT */}
            <Section title="Professional Tax (PT)" icon="📋">
                <Toggle value={form.pt_applicable} onChange={v => set('pt_applicable', v)}
                        label="PT Applicable" description="State-specific professional tax on gross salary" />
                {form.pt_applicable && (
                    <div className="mt-4 space-y-4">
                        <Field label="State">
                            <select className={sel} value={form.pt_state} onChange={e => set('pt_state', e.target.value)}>
                                <option value="">Select state</option>
                                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </Field>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">PT Slabs</p>
                                <button type="button" onClick={addSlab} className="text-xs text-blue-600 hover:text-blue-700 font-medium">+ Add Slab</button>
                            </div>
                            {(form.pt_slabs ?? []).length === 0 && (
                                <p className="text-xs text-gray-400 italic">No slabs defined yet. Add slabs above.</p>
                            )}
                            <div className="space-y-2">
                                {(form.pt_slabs ?? []).map((slab, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                                        <span className="text-xs text-gray-500 w-8">#{i + 1}</span>
                                        <div className="flex items-center gap-1 flex-1">
                                            <span className="text-xs text-gray-400">₹</span>
                                            <input type="number" className={ninp + ' w-24'} placeholder="From" value={slab.from} onChange={e => setSlab(i, 'from', +e.target.value)} />
                                            <span className="text-xs text-gray-400 mx-1">–</span>
                                            <input type="number" className={ninp + ' w-24'} placeholder="To (blank=no limit)" value={slab.to ?? ''} onChange={e => setSlab(i, 'to', e.target.value === '' ? null : +e.target.value)} />
                                            <span className="text-xs text-gray-400 ml-2">PT ₹</span>
                                            <input type="number" className={ninp + ' w-24'} placeholder="Amount" value={slab.amount} onChange={e => setSlab(i, 'amount', +e.target.value)} />
                                        </div>
                                        <button type="button" onClick={() => delSlab(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Section>

            {/* TDS */}
            <Section title="Tax Deducted at Source (TDS / Income Tax)" icon="🧾">
                <Toggle value={form.tds_applicable} onChange={v => set('tds_applicable', v)}
                        label="TDS Applicable" description="Deduct income tax at source from employee salaries" />
                {form.tds_applicable && (
                    <div className="mt-4 max-w-xs">
                        <Field label="Tax Regime">
                            <select className={sel} value={form.tds_regime} onChange={e => set('tds_regime', e.target.value)}>
                                <option value="new">New Regime (Default)</option>
                                <option value="old">Old Regime</option>
                            </select>
                        </Field>
                    </div>
                )}
            </Section>

            {/* LWF */}
            <Section title="Labour Welfare Fund (LWF)" icon="⚖️">
                <Toggle value={form.lwf_applicable} onChange={v => set('lwf_applicable', v)}
                        label="LWF Applicable" description="Monthly/bi-annual contribution to state welfare fund" />
                {form.lwf_applicable && (
                    <Grid2>
                        <Field label="State">
                            <select className={sel} value={form.lwf_state} onChange={e => set('lwf_state', e.target.value)}>
                                <option value="">Select state</option>
                                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </Field>
                        <span />
                        <Field label="Employee Contribution (₹)">
                            <input type="number" step="0.01" min={0} className={inp} value={form.lwf_employee_amount} onChange={e => set('lwf_employee_amount', +e.target.value)} />
                        </Field>
                        <Field label="Employer Contribution (₹)">
                            <input type="number" step="0.01" min={0} className={inp} value={form.lwf_employer_amount} onChange={e => set('lwf_employer_amount', +e.target.value)} />
                        </Field>
                    </Grid2>
                )}
            </Section>

            {/* Gratuity */}
            <Section title="Gratuity" icon="🎁">
                <Toggle value={form.gratuity_applicable} onChange={v => set('gratuity_applicable', v)}
                        label="Gratuity Applicable" description="Payable after 5 years of continuous service" />
                {form.gratuity_applicable && (
                    <div className="mt-4 max-w-xs">
                        <Field label="Gratuity Rate (%)">
                            <input type="number" step="0.01" min={0} className={inp} value={form.gratuity_rate} onChange={e => set('gratuity_rate', +e.target.value)} />
                        </Field>
                        <p className="text-xs text-gray-400 mt-1">Standard rate: 4.81% (15/26 days × 1/12). Used for CTC computation.</p>
                    </div>
                )}
            </Section>

            {/* Bottom save */}
            <div className="flex justify-end pb-4">
                <button type="submit" disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-2.5 rounded-lg text-sm font-medium">
                    {saving ? 'Saving…' : 'Save Compliance Settings'}
                </button>
            </div>
        </form>
    );
}
