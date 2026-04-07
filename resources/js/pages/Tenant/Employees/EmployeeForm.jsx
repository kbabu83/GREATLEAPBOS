import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../../components/UI/Card';
import api from '../../../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const inputCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

const STEPS = [
    { id: 1, label: 'Personal Info' },
    { id: 2, label: 'Employment' },
    { id: 3, label: 'Address' },
    { id: 4, label: 'Documents & Bank' },
    { id: 5, label: 'Review' },
];

const defaultForm = {
    // Step 1 – Personal
    first_name: '', last_name: '', work_email: '', phone: '',
    date_of_birth: '', gender: '', blood_group: '', marital_status: '', nationality: '',
    // Step 2 – Employment
    department_id: '', designation_id: '', branch_id: '',
    employment_type: '', date_of_joining: '', date_of_confirmation: '',
    reporting_manager_id: '', work_location_type: '', notice_period_days: '',
    // Step 3 – Address
    current_address: { line1: '', line2: '', city: '', state: '', pincode: '', country: '' },
    same_as_current: false,
    permanent_address: { line1: '', line2: '', city: '', state: '', pincode: '', country: '' },
    // Step 4 – Documents & Bank
    pan_number: '', aadhar_number: '', uan_number: '', esi_number: '',
    bank_account_number: '', bank_name: '', bank_ifsc: '', bank_branch: '', bank_account_type: '',
    emergency_contact_name: '', emergency_contact_relation: '', emergency_contact_phone: '',
};

// ── Review helpers ────────────────────────────────────────────────────────────
function ReviewRow({ label, value }) {
    if (!value && value !== 0) return null;
    return (
        <div className="flex py-2 border-b border-gray-50 last:border-0">
            <span className="w-44 text-xs text-gray-500 flex-shrink-0">{label}</span>
            <span className="text-sm text-gray-900 font-medium">{value}</span>
        </div>
    );
}

function ReviewSection({ title, children }) {
    return (
        <div className="mb-6">
            <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">{title}</h3>
            {children}
        </div>
    );
}

// ── Address sub-form ──────────────────────────────────────────────────────────
function AddressFields({ prefix, value, onChange }) {
    const field = key => e => onChange({ ...value, [key]: e.target.value });
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
                <label className={labelCls}>Address Line 1</label>
                <input type="text" value={value.line1} onChange={field('line1')} className={inputCls} placeholder="Street / Building" />
            </div>
            <div className="sm:col-span-2">
                <label className={labelCls}>Address Line 2</label>
                <input type="text" value={value.line2} onChange={field('line2')} className={inputCls} placeholder="Area / Landmark" />
            </div>
            <div>
                <label className={labelCls}>City</label>
                <input type="text" value={value.city} onChange={field('city')} className={inputCls} />
            </div>
            <div>
                <label className={labelCls}>State</label>
                <input type="text" value={value.state} onChange={field('state')} className={inputCls} />
            </div>
            <div>
                <label className={labelCls}>Pincode</label>
                <input type="text" value={value.pincode} onChange={field('pincode')} className={inputCls} />
            </div>
            <div>
                <label className={labelCls}>Country</label>
                <input type="text" value={value.country} onChange={field('country')} className={inputCls} placeholder="India" />
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EmployeeForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [step, setStep] = useState(1);
    const [form, setForm] = useState(defaultForm);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [branches, setBranches] = useState([]);
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const showMsg = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    // Load lookup data
    useEffect(() => {
        const loadLookups = async () => {
            try {
                const [deptRes, desigRes, branchRes, mgrsRes] = await Promise.allSettled([
                    api.get('/tenant/departments'),
                    api.get('/tenant/designations'),
                    api.get('/tenant/branches'),
                    api.get('/tenant/employees', { params: { employment_status: 'active', per_page: 200 } }),
                ]);
                if (deptRes.status === 'fulfilled') setDepartments(deptRes.value.data.data || deptRes.value.data);
                if (desigRes.status === 'fulfilled') setDesignations(desigRes.value.data.data || desigRes.value.data);
                if (branchRes.status === 'fulfilled') setBranches(branchRes.value.data.data || branchRes.value.data);
                if (mgrsRes.status === 'fulfilled') setManagers(mgrsRes.value.data.data || []);
            } catch {
                // non-critical
            }
        };
        loadLookups();
    }, []);

    // Load employee for edit
    useEffect(() => {
        if (!isEdit) return;
        const load = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/tenant/employees/${id}`);
                const e = res.data.data || res.data;
                setForm({
                    first_name: e.first_name || '',
                    last_name: e.last_name || '',
                    work_email: e.work_email || '',
                    phone: e.phone || '',
                    date_of_birth: e.date_of_birth || '',
                    gender: e.gender || '',
                    blood_group: e.blood_group || '',
                    marital_status: e.marital_status || '',
                    nationality: e.nationality || '',
                    department_id: e.department_id ? String(e.department_id) : '',
                    designation_id: e.designation_id ? String(e.designation_id) : '',
                    branch_id: e.branch_id ? String(e.branch_id) : '',
                    employment_type: e.employment_type || '',
                    date_of_joining: e.date_of_joining || '',
                    date_of_confirmation: e.date_of_confirmation || '',
                    reporting_manager_id: e.reporting_manager_id ? String(e.reporting_manager_id) : '',
                    work_location_type: e.work_location_type || '',
                    notice_period_days: e.notice_period_days ?? '',
                    current_address: e.current_address || defaultForm.current_address,
                    same_as_current: false,
                    permanent_address: e.permanent_address || defaultForm.permanent_address,
                    pan_number: e.pan_number || '',
                    aadhar_number: e.aadhar_number || '',
                    uan_number: e.uan_number || '',
                    esi_number: e.esi_number || '',
                    bank_account_number: e.bank_account_number || '',
                    bank_name: e.bank_name || '',
                    bank_ifsc: e.bank_ifsc || '',
                    bank_branch: e.bank_branch || '',
                    bank_account_type: e.bank_account_type || '',
                    emergency_contact_name: e.emergency_contact_name || '',
                    emergency_contact_relation: e.emergency_contact_relation || '',
                    emergency_contact_phone: e.emergency_contact_phone || '',
                });
            } catch {
                showMsg('error', 'Failed to load employee.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, isEdit]);

    const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

    const handleSameAsCurrent = e => {
        const checked = e.target.checked;
        setForm(f => ({
            ...f,
            same_as_current: checked,
            permanent_address: checked ? { ...f.current_address } : defaultForm.permanent_address,
        }));
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const payload = { ...form };
            delete payload.same_as_current;
            if (isEdit) {
                await api.put(`/tenant/employees/${id}`, payload);
            } else {
                await api.post('/tenant/employees', payload);
            }
            navigate('/employees');
        } catch (err) {
            showMsg('error', err.response?.data?.message || 'Failed to save employee.');
        } finally {
            setSaving(false);
        }
    };

    const canProceed = () => {
        if (step === 1) return form.first_name.trim() && form.work_email.trim();
        if (step === 2) return form.department_id && form.designation_id && form.employment_type && form.date_of_joining;
        return true;
    };

    const deptName = departments.find(d => String(d.id) === form.department_id)?.name || '';
    const desigName = designations.find(d => String(d.id) === form.designation_id)?.name || '';
    const branchName = branches.find(b => String(b.id) === form.branch_id)?.name || '';
    const managerEmp = managers.find(m => String(m.id) === form.reporting_manager_id);
    const managerName = managerEmp ? `${managerEmp.first_name} ${managerEmp.last_name || ''}`.trim() : '';

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-48" />
                <div className="h-64 bg-gray-100 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEdit ? 'Edit Employee' : 'Add Employee'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Step {step} of {STEPS.length}: {STEPS[step - 1].label}
                    </p>
                </div>
                {message && (
                    <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {message.text}
                    </span>
                )}
            </div>

            {/* Step Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {STEPS.map((s, idx) => (
                    <React.Fragment key={s.id}>
                        <button
                            onClick={() => setStep(s.id)}
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                step === s.id
                                    ? 'bg-blue-600 text-white'
                                    : step > s.id
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                            }`}
                        >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                step === s.id ? 'bg-white text-blue-600' : step > s.id ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
                            }`}>
                                {step > s.id ? '✓' : s.id}
                            </span>
                            {s.label}
                        </button>
                        {idx < STEPS.length - 1 && (
                            <div className={`flex-shrink-0 h-0.5 w-6 ${step > s.id ? 'bg-green-300' : 'bg-gray-200'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Step Content */}
            <Card>
                {/* ── STEP 1: Personal Info ── */}
                {step === 1 && (
                    <div className="space-y-5">
                        <h2 className="text-base font-semibold text-gray-800 mb-4">Personal Information</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
                                <input type="text" value={form.first_name} onChange={set('first_name')} className={inputCls} required />
                            </div>
                            <div>
                                <label className={labelCls}>Last Name</label>
                                <input type="text" value={form.last_name} onChange={set('last_name')} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Work Email <span className="text-red-500">*</span></label>
                                <input type="email" value={form.work_email} onChange={set('work_email')} className={inputCls} required />
                            </div>
                            <div>
                                <label className={labelCls}>Phone</label>
                                <input type="tel" value={form.phone} onChange={set('phone')} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Date of Birth</label>
                                <input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Gender</label>
                                <select value={form.gender} onChange={set('gender')} className={inputCls}>
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                    <option value="prefer_not_to_say">Prefer not to say</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Blood Group</label>
                                <select value={form.blood_group} onChange={set('blood_group')} className={inputCls}>
                                    <option value="">Select</option>
                                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Marital Status</label>
                                <select value={form.marital_status} onChange={set('marital_status')} className={inputCls}>
                                    <option value="">Select</option>
                                    <option value="single">Single</option>
                                    <option value="married">Married</option>
                                    <option value="divorced">Divorced</option>
                                    <option value="widowed">Widowed</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Nationality</label>
                                <input type="text" value={form.nationality} onChange={set('nationality')} className={inputCls} placeholder="e.g. Indian" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 2: Employment ── */}
                {step === 2 && (
                    <div className="space-y-5">
                        <h2 className="text-base font-semibold text-gray-800 mb-4">Employment Details</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Department <span className="text-red-500">*</span></label>
                                <select value={form.department_id} onChange={set('department_id')} className={inputCls} required>
                                    <option value="">Select department</option>
                                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Designation <span className="text-red-500">*</span></label>
                                <select value={form.designation_id} onChange={set('designation_id')} className={inputCls} required>
                                    <option value="">Select designation</option>
                                    {designations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Branch</label>
                                <select value={form.branch_id} onChange={set('branch_id')} className={inputCls}>
                                    <option value="">Select branch</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Employment Type <span className="text-red-500">*</span></label>
                                <select value={form.employment_type} onChange={set('employment_type')} className={inputCls} required>
                                    <option value="">Select type</option>
                                    <option value="monthly_salaried">Monthly Salaried</option>
                                    <option value="daily_wage">Daily Wage</option>
                                    <option value="hourly_wage">Hourly Wage</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Date of Joining <span className="text-red-500">*</span></label>
                                <input type="date" value={form.date_of_joining} onChange={set('date_of_joining')} className={inputCls} required />
                            </div>
                            <div>
                                <label className={labelCls}>Date of Confirmation</label>
                                <input type="date" value={form.date_of_confirmation} onChange={set('date_of_confirmation')} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Reporting Manager</label>
                                <select value={form.reporting_manager_id} onChange={set('reporting_manager_id')} className={inputCls}>
                                    <option value="">No manager</option>
                                    {managers.map(m => (
                                        <option key={m.id} value={m.id}>
                                            {m.first_name} {m.last_name || ''} {m.employee_code ? `(${m.employee_code})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Work Location Type</label>
                                <select value={form.work_location_type} onChange={set('work_location_type')} className={inputCls}>
                                    <option value="">Select</option>
                                    <option value="office">Office</option>
                                    <option value="remote">Remote</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Notice Period (days)</label>
                                <input type="number" min="0" value={form.notice_period_days} onChange={set('notice_period_days')} className={inputCls} placeholder="e.g. 30" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: Address ── */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-base font-semibold text-gray-800 mb-4">Current Address</h2>
                            <AddressFields
                                prefix="current"
                                value={form.current_address}
                                onChange={val => setForm(f => ({ ...f, current_address: val }))}
                            />
                        </div>
                        <div className="border-t border-gray-100 pt-5">
                            <div className="flex items-center gap-3 mb-4">
                                <h2 className="text-base font-semibold text-gray-800">Permanent Address</h2>
                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer ml-auto">
                                    <input
                                        type="checkbox"
                                        checked={form.same_as_current}
                                        onChange={handleSameAsCurrent}
                                        className="w-4 h-4 accent-blue-600"
                                    />
                                    Same as current address
                                </label>
                            </div>
                            {!form.same_as_current && (
                                <AddressFields
                                    prefix="permanent"
                                    value={form.permanent_address}
                                    onChange={val => setForm(f => ({ ...f, permanent_address: val }))}
                                />
                            )}
                            {form.same_as_current && (
                                <p className="text-sm text-gray-400 italic">Permanent address copied from current address.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* ── STEP 4: Documents & Bank ── */}
                {step === 4 && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-base font-semibold text-gray-800 mb-4">Identity Documents</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>PAN Number</label>
                                    <input type="text" value={form.pan_number} onChange={set('pan_number')} className={inputCls} placeholder="ABCDE1234F" />
                                </div>
                                <div>
                                    <label className={labelCls}>Aadhaar Number</label>
                                    <input type="text" value={form.aadhar_number} onChange={set('aadhar_number')} className={inputCls} placeholder="XXXX XXXX XXXX" />
                                </div>
                                <div>
                                    <label className={labelCls}>UAN Number</label>
                                    <input type="text" value={form.uan_number} onChange={set('uan_number')} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>ESI Number</label>
                                    <input type="text" value={form.esi_number} onChange={set('esi_number')} className={inputCls} />
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-5">
                            <h2 className="text-base font-semibold text-gray-800 mb-4">Bank Details</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Account Number</label>
                                    <input type="text" value={form.bank_account_number} onChange={set('bank_account_number')} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Bank Name</label>
                                    <input type="text" value={form.bank_name} onChange={set('bank_name')} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>IFSC Code</label>
                                    <input type="text" value={form.bank_ifsc} onChange={set('bank_ifsc')} className={inputCls} placeholder="e.g. SBIN0001234" />
                                </div>
                                <div>
                                    <label className={labelCls}>Branch Name</label>
                                    <input type="text" value={form.bank_branch} onChange={set('bank_branch')} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Account Type</label>
                                    <select value={form.bank_account_type} onChange={set('bank_account_type')} className={inputCls}>
                                        <option value="">Select</option>
                                        <option value="savings">Savings</option>
                                        <option value="current">Current</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-5">
                            <h2 className="text-base font-semibold text-gray-800 mb-4">Emergency Contact</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className={labelCls}>Name</label>
                                    <input type="text" value={form.emergency_contact_name} onChange={set('emergency_contact_name')} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Relation</label>
                                    <input type="text" value={form.emergency_contact_relation} onChange={set('emergency_contact_relation')} className={inputCls} placeholder="e.g. Spouse" />
                                </div>
                                <div>
                                    <label className={labelCls}>Phone</label>
                                    <input type="tel" value={form.emergency_contact_phone} onChange={set('emergency_contact_phone')} className={inputCls} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 5: Review ── */}
                {step === 5 && (
                    <div>
                        <h2 className="text-base font-semibold text-gray-800 mb-5">Review & Submit</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 rounded-xl p-5">
                                <ReviewSection title="Personal Info">
                                    <ReviewRow label="First Name" value={form.first_name} />
                                    <ReviewRow label="Last Name" value={form.last_name} />
                                    <ReviewRow label="Work Email" value={form.work_email} />
                                    <ReviewRow label="Phone" value={form.phone} />
                                    <ReviewRow label="Date of Birth" value={form.date_of_birth} />
                                    <ReviewRow label="Gender" value={form.gender} />
                                    <ReviewRow label="Blood Group" value={form.blood_group} />
                                    <ReviewRow label="Marital Status" value={form.marital_status} />
                                    <ReviewRow label="Nationality" value={form.nationality} />
                                </ReviewSection>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-5">
                                <ReviewSection title="Employment">
                                    <ReviewRow label="Department" value={deptName} />
                                    <ReviewRow label="Designation" value={desigName} />
                                    <ReviewRow label="Branch" value={branchName} />
                                    <ReviewRow label="Employment Type" value={form.employment_type?.replace(/_/g, ' ')} />
                                    <ReviewRow label="Date of Joining" value={form.date_of_joining} />
                                    <ReviewRow label="Date of Confirmation" value={form.date_of_confirmation} />
                                    <ReviewRow label="Reporting Manager" value={managerName} />
                                    <ReviewRow label="Work Location" value={form.work_location_type} />
                                    <ReviewRow label="Notice Period" value={form.notice_period_days ? `${form.notice_period_days} days` : ''} />
                                </ReviewSection>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-5">
                                <ReviewSection title="Current Address">
                                    {form.current_address.line1 ? (
                                        <p className="text-sm text-gray-900">
                                            {[form.current_address.line1, form.current_address.line2, form.current_address.city, form.current_address.state, form.current_address.pincode, form.current_address.country].filter(Boolean).join(', ')}
                                        </p>
                                    ) : <p className="text-sm text-gray-400">Not provided</p>}
                                </ReviewSection>
                                <ReviewSection title="Permanent Address">
                                    {form.same_as_current
                                        ? <p className="text-sm text-gray-500">Same as current address</p>
                                        : form.permanent_address.line1
                                        ? <p className="text-sm text-gray-900">
                                            {[form.permanent_address.line1, form.permanent_address.line2, form.permanent_address.city, form.permanent_address.state, form.permanent_address.pincode, form.permanent_address.country].filter(Boolean).join(', ')}
                                          </p>
                                        : <p className="text-sm text-gray-400">Not provided</p>}
                                </ReviewSection>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-5">
                                <ReviewSection title="Documents">
                                    <ReviewRow label="PAN" value={form.pan_number} />
                                    <ReviewRow label="Aadhaar" value={form.aadhar_number} />
                                    <ReviewRow label="UAN" value={form.uan_number} />
                                    <ReviewRow label="ESI" value={form.esi_number} />
                                </ReviewSection>
                                <ReviewSection title="Bank">
                                    <ReviewRow label="Account No." value={form.bank_account_number} />
                                    <ReviewRow label="Bank Name" value={form.bank_name} />
                                    <ReviewRow label="IFSC" value={form.bank_ifsc} />
                                    <ReviewRow label="Account Type" value={form.bank_account_type} />
                                </ReviewSection>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => setStep(s => Math.max(1, s - 1))}
                    disabled={step === 1}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => navigate('/employees')}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    {step < 5 ? (
                        <button
                            type="button"
                            onClick={() => setStep(s => s + 1)}
                            disabled={!canProceed()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 min-w-[100px]"
                        >
                            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Employee'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
