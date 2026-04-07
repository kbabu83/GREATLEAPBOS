import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/UI/Card';
import api from '../../../services/api';

const INDUSTRIES = ['Technology', 'Manufacturing', 'Healthcare', 'Retail', 'Finance', 'Education', 'Hospitality', 'Construction', 'Other'];
const COMPANY_SIZES = [
    { value: 'micro', label: 'Micro (< 10)' },
    { value: 'small', label: 'Small (10–50)' },
    { value: 'medium', label: 'Medium (50–250)' },
    { value: 'large', label: 'Large (250+)' },
];
const MONTHS = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

const inputCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

const defaultForm = {
    legal_name: '', trade_name: '', industry: '', company_size: '', registration_number: '', gst_number: '', pan_number: '',
    phone: '', email: '', website: '', address_line1: '', address_line2: '', city: '', state: '', pincode: '', country: '',
    financial_year_start_month: 4, timezone: 'Asia/Kolkata', currency: 'INR', employee_id_prefix: 'EMP',
};

export default function CompanyProfile() {
    const [form, setForm] = useState(defaultForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/tenant/organisation');
                setForm({ ...defaultForm, ...res.data.data });
            } catch {
                showMessage('error', 'Failed to load organisation settings.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/tenant/organisation', form);
            showMessage('success', 'Organisation settings saved successfully.');
        } catch (err) {
            showMessage('error', err.response?.data?.message || 'Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-48" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[0, 1].map((i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
                            <div className="h-5 bg-gray-200 rounded w-32" />
                            {[...Array(4)].map((_, j) => <div key={j} className="h-9 bg-gray-100 rounded" />)}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Company Profile</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your organisation's identity and settings</p>
                </div>
                <div className="flex items-center gap-3">
                    {message && (
                        <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {message.text}
                        </span>
                    )}
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Identity */}
                <Card title="Company Identity">
                    <div className="space-y-4">
                        <div>
                            <label className={labelCls}>Legal Name <span className="text-red-500">*</span></label>
                            <input type="text" value={form.legal_name} onChange={set('legal_name')} className={inputCls} required />
                        </div>
                        <div>
                            <label className={labelCls}>Trade Name</label>
                            <input type="text" value={form.trade_name} onChange={set('trade_name')} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Industry</label>
                            <select value={form.industry} onChange={set('industry')} className={inputCls}>
                                <option value="">Select industry</option>
                                {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Company Size</label>
                            <select value={form.company_size} onChange={set('company_size')} className={inputCls}>
                                <option value="">Select size</option>
                                {COMPANY_SIZES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Registration Number</label>
                            <input type="text" value={form.registration_number} onChange={set('registration_number')} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>GST Number</label>
                            <input type="text" value={form.gst_number} onChange={set('gst_number')} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>PAN Number</label>
                            <input type="text" value={form.pan_number} onChange={set('pan_number')} className={inputCls} />
                        </div>
                    </div>
                </Card>

                {/* Contact & Address */}
                <Card title="Contact & Address">
                    <div className="space-y-4">
                        <div>
                            <label className={labelCls}>Phone</label>
                            <input type="tel" value={form.phone} onChange={set('phone')} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Email</label>
                            <input type="email" value={form.email} onChange={set('email')} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Website</label>
                            <input type="url" value={form.website} onChange={set('website')} className={inputCls} placeholder="https://" />
                        </div>
                        <div>
                            <label className={labelCls}>Address Line 1</label>
                            <input type="text" value={form.address_line1} onChange={set('address_line1')} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Address Line 2</label>
                            <input type="text" value={form.address_line2} onChange={set('address_line2')} className={inputCls} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>City</label>
                                <input type="text" value={form.city} onChange={set('city')} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>State</label>
                                <input type="text" value={form.state} onChange={set('state')} className={inputCls} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Pincode</label>
                                <input type="text" value={form.pincode} onChange={set('pincode')} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Country</label>
                                <input type="text" value={form.country} onChange={set('country')} className={inputCls} />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* System Settings */}
            <Card title="System Settings">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className={labelCls}>Financial Year Start Month</label>
                        <select value={form.financial_year_start_month} onChange={set('financial_year_start_month')} className={inputCls}>
                            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Timezone</label>
                        <input type="text" value={form.timezone} onChange={set('timezone')} className={inputCls} placeholder="Asia/Kolkata" />
                    </div>
                    <div>
                        <label className={labelCls}>Currency</label>
                        <input type="text" value={form.currency} onChange={set('currency')} className={inputCls} placeholder="INR" maxLength={5} />
                    </div>
                    <div>
                        <label className={labelCls}>Employee ID Prefix</label>
                        <input type="text" value={form.employee_id_prefix} onChange={set('employee_id_prefix')} className={inputCls} placeholder="EMP" maxLength={10} />
                    </div>
                </div>
            </Card>
        </form>
    );
}
