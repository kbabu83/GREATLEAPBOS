import React, { useEffect, useState, useCallback } from 'react';
import api from '../../../services/api';

// ── helpers ───────────────────────────────────────────────────────────────────
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const LEAVE_TYPE_TABS = [
  'Identity & Entitlement',
  'Limits & Rules',
  'Carry Forward & Encashment',
  'Eligibility',
  'Approval Workflow',
];

const BLANK_LT = {
  name: '', code: '', description: '', color: '#3B82F6', icon: '🏖️',
  accrual_type: 'lump_sum', accrual_per_period: 1, max_days_per_year: 12,
  credit_during_probation: false, credit_on_loss_of_pay_days: false,
  prorate_on_joining: false, prorate_basis: 'calendar_days', prorate_on_exit: false,
  allow_half_day: true,
  min_days_per_application: 0.5, max_days_per_application: '', max_consecutive_days: '',
  max_days_per_month: '', max_days_per_quarter: '',
  advance_notice_days: 0, allow_backdated_application: false, max_backdated_days: '',
  requires_document: false, document_required_after_days: '',
  include_holidays_in_count: false, include_weekends_in_count: false,
  carry_forward: false, max_carry_forward_days: '', carry_forward_expires: false, carry_forward_expiry_months: '',
  encashable: false, max_encashment_days_per_year: '', min_balance_after_encashment: '', encashment_on_exit: false,
  gender_restriction: 'none', employment_type_restriction: [],
  applicable_after_days: 0, applicable_during_probation: true,
  department_restriction: [], branch_restriction: [], designation_restriction: [], excluded_employee_ids: [],
  approval_levels: 1, auto_approve: false, auto_approve_after_hours: '',
  is_admin_only: false, is_paid: true, is_active: true,
  approval_level_configs: [
    { level: 1, approver_type: 'reporting_manager', specific_employee_id: '', skip_if_approver_on_leave: true },
  ],
};

const BLANK_POLICY = {
  name: '', description: '', is_active: true,
  year_start_month: 1, carry_forward_process_month: 3,
  applicable_employment_types: [],
  applicable_department_ids: [], applicable_branch_ids: [],
};

// ── Atomic UI components ──────────────────────────────────────────────────────
function Toggle({ checked, onChange, label, help }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 w-10 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {help && <p className="text-xs text-gray-500 mt-0.5">{help}</p>}
      </div>
    </label>
  );
}

function Field({ label, required, help, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {help && <p className="text-xs text-gray-500 mt-1">{help}</p>}
    </div>
  );
}

function Input({ value, onChange, type = 'text', placeholder, min, step, className = '' }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      step={step}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  );
}

function Select({ value, onChange, options, placeholder, className = '' }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${className}`}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Badge({ label, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-700',
    gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${colors[color] || colors.blue}`}>
      {label}
    </span>
  );
}

function MultiSelect({ value = [], onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const selected = value || [];
  const toggle = (v) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  const labels = options.filter(o => selected.includes(o.value)).map(o => o.label);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center">
        <span className={selected.length ? 'text-gray-900' : 'text-gray-400'}>
          {selected.length ? labels.join(', ') : placeholder}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-2 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
          {options.length === 0 && <p className="px-3 py-2 text-sm text-gray-400">No options</p>}
          {options.map(o => (
            <label key={o.value} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} className="rounded text-blue-600" />
              <span className="text-sm">{o.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Leave Type 5-tab Modal ────────────────────────────────────────────────────
function LeaveTypeModal({ open, onClose, onSave, initial, departments, branches, designations, employees }) {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState(BLANK_LT);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...BLANK_LT, ...initial } : { ...BLANK_LT });
      setTab(0);
      setErrors({});
    }
  }, [open, initial]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const setApprovalLevelCount = (countStr) => {
    const n = Math.max(1, Math.min(3, parseInt(countStr) || 1));
    const existing = form.approval_level_configs || [];
    const configs = Array.from({ length: n }, (_, i) => ({
      level: i + 1,
      approver_type: existing[i]?.approver_type || 'reporting_manager',
      specific_employee_id: existing[i]?.specific_employee_id || '',
      skip_if_approver_on_leave: existing[i]?.skip_if_approver_on_leave ?? true,
    }));
    setForm(f => ({ ...f, approval_levels: n, approval_level_configs: configs }));
  };

  const setApprovalConfig = (idx, key, val) => {
    const configs = [...(form.approval_level_configs || [])];
    configs[idx] = { ...configs[idx], [key]: val };
    setForm(f => ({ ...f, approval_level_configs: configs }));
  };

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = 'Name is required';
    if (!form.code?.trim()) e.code = 'Code is required';
    if (!form.max_days_per_year) e.max_days_per_year = 'Max days/year is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { setTab(0); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch {
      // error already handled upstream
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const empTypeOptions = [
    { value: 'monthly_salaried', label: 'Monthly Salaried' },
    { value: 'daily_wage', label: 'Daily Wage' },
    { value: 'hourly_wage', label: 'Hourly Wage' },
  ];

  const deptOptions = departments.map(d => ({ value: d.id, label: d.name }));
  const branchOptions = branches.map(b => ({ value: b.id, label: b.name }));
  const desigOptions = designations.map(d => ({ value: d.id, label: d.title || d.name }));
  const empOptions = employees.map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name}` }));

  const tabs = [
    // ── Tab 0 ─ Identity & Entitlement ───────────────────────────────────────
    <div key="t0" className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Leave Type Name" required>
          <Input value={form.name} onChange={v => set('name', v)} placeholder="e.g. Casual Leave" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </Field>
        <Field label="Short Code" required help="Used in reports (CL, SL, EL…)">
          <Input value={form.code} onChange={v => set('code', v.toUpperCase())} placeholder="CL" />
          {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
        </Field>
      </div>

      <Field label="Description">
        <textarea value={form.description || ''} onChange={e => set('description', e.target.value)}
          rows={2} placeholder="Optional description…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Colour">
          <div className="flex items-center gap-2">
            <input type="color" value={form.color || '#3B82F6'} onChange={e => set('color', e.target.value)}
              className="h-9 w-14 border border-gray-300 rounded cursor-pointer" />
            <Input value={form.color || '#3B82F6'} onChange={v => set('color', v)} />
          </div>
        </Field>
        <Field label="Icon / Emoji">
          <Input value={form.icon || ''} onChange={v => set('icon', v)} placeholder="🏖️" />
        </Field>
      </div>

      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Accrual & Entitlement</h4>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Accrual Type" required>
            <Select value={form.accrual_type} onChange={v => set('accrual_type', v)} options={[
              { value: 'lump_sum',   label: 'Lump Sum (credit all at once)' },
              { value: 'monthly',   label: 'Monthly Accrual' },
              { value: 'quarterly', label: 'Quarterly Accrual' },
            ]} />
          </Field>
          <Field label={form.accrual_type === 'lump_sum' ? 'Total Days / Year' : 'Days / Accrual Period'} required>
            <Input type="number" value={form.accrual_per_period} onChange={v => set('accrual_per_period', parseFloat(v))} min="0.5" step="0.5" />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Maximum Days Per Year" required>
            <Input type="number" value={form.max_days_per_year} onChange={v => set('max_days_per_year', parseFloat(v))} min="0.5" step="0.5" />
            {errors.max_days_per_year && <p className="text-red-500 text-xs mt-1">{errors.max_days_per_year}</p>}
          </Field>
        </div>
      </div>

      <div className="border-t pt-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 mb-1">Proration Settings</h4>
        <Toggle checked={form.prorate_on_joining} onChange={v => set('prorate_on_joining', v)}
          label="Prorate balance on joining mid-year"
          help="New joiners get a proportional balance based on joining date" />
        {form.prorate_on_joining && (
          <div className="pl-14">
            <Field label="Proration Basis">
              <Select value={form.prorate_basis} onChange={v => set('prorate_basis', v)} options={[
                { value: 'calendar_days',    label: 'Calendar Days' },
                { value: 'months_completed', label: 'Months Completed' },
              ]} />
            </Field>
          </div>
        )}
        <Toggle checked={form.prorate_on_exit} onChange={v => set('prorate_on_exit', v)}
          label="Prorate balance on exit mid-year"
          help="Departing employees get balance proportional to their last working day" />
        <Toggle checked={form.credit_during_probation} onChange={v => set('credit_during_probation', v)}
          label="Credit leaves during probation" />
        <Toggle checked={form.credit_on_loss_of_pay_days} onChange={v => set('credit_on_loss_of_pay_days', v)}
          label="Credit leaves on LOP days" />
      </div>

      <div className="border-t pt-4 flex flex-wrap gap-6">
        <Toggle checked={form.is_paid} onChange={v => set('is_paid', v)}
          label="Paid Leave" help="Employee receives full salary during this leave" />
        <Toggle checked={form.is_active} onChange={v => set('is_active', v)} label="Active" />
        <Toggle checked={form.allow_half_day} onChange={v => set('allow_half_day', v)} label="Allow half-day" />
      </div>

      <div className="border-t pt-4">
        <Toggle checked={form.is_admin_only} onChange={v => set('is_admin_only', v)}
          label="Admin-only leave (Grant manually)"
          help="Employees cannot self-apply; only admin/HR can grant this leave" />
      </div>
    </div>,

    // ── Tab 1 ─ Limits & Rules ────────────────────────────────────────────────
    <div key="t1" className="space-y-5">
      <h4 className="text-sm font-semibold text-gray-700">Application Limits</h4>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Min Days / Application">
          <Input type="number" value={form.min_days_per_application} onChange={v => set('min_days_per_application', parseFloat(v))} min="0.5" step="0.5" />
        </Field>
        <Field label="Max Days / Application" help="Leave blank = no limit">
          <Input type="number" value={form.max_days_per_application} onChange={v => set('max_days_per_application', v)} step="0.5" placeholder="No limit" />
        </Field>
        <Field label="Max Consecutive Days" help="Leave blank = no limit">
          <Input type="number" value={form.max_consecutive_days} onChange={v => set('max_consecutive_days', v)} placeholder="No limit" />
        </Field>
        <Field label="Max Days / Month" help="Leave blank = no limit">
          <Input type="number" value={form.max_days_per_month} onChange={v => set('max_days_per_month', v)} step="0.5" placeholder="No limit" />
        </Field>
        <Field label="Max Days / Quarter" help="Leave blank = no limit">
          <Input type="number" value={form.max_days_per_quarter} onChange={v => set('max_days_per_quarter', v)} step="0.5" placeholder="No limit" />
        </Field>
      </div>

      <div className="border-t pt-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 mb-1">Application Timing</h4>
        <Field label="Advance Notice Required (days)" help="How many days in advance must an employee apply?">
          <Input type="number" value={form.advance_notice_days} onChange={v => set('advance_notice_days', parseInt(v) || 0)} min="0" />
        </Field>
        <Toggle checked={form.allow_backdated_application} onChange={v => set('allow_backdated_application', v)}
          label="Allow backdated applications"
          help="Employee can apply after the leave date has already passed" />
        {form.allow_backdated_application && (
          <Field label="Max Backdated Days Allowed">
            <Input type="number" value={form.max_backdated_days} onChange={v => set('max_backdated_days', v)} placeholder="No limit" />
          </Field>
        )}
      </div>

      <div className="border-t pt-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 mb-1">Document Requirements</h4>
        <Toggle checked={form.requires_document} onChange={v => set('requires_document', v)}
          label="Require supporting document"
          help="Employee must upload a document with the leave application" />
        {form.requires_document && (
          <Field label="Require Document Only After (days)" help="Only require document if leave exceeds this many days (0 = always require)">
            <Input type="number" value={form.document_required_after_days} onChange={v => set('document_required_after_days', v)} placeholder="0 = always" />
          </Field>
        )}
      </div>

      <div className="border-t pt-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 mb-1">Sandwich Rule</h4>
        <p className="text-xs text-gray-500">When leave spans across non-working days, should those days count as leave?</p>
        <Toggle checked={form.include_holidays_in_count} onChange={v => set('include_holidays_in_count', v)}
          label="Count intervening public holidays as leave days" />
        <Toggle checked={form.include_weekends_in_count} onChange={v => set('include_weekends_in_count', v)}
          label="Count intervening weekends / week-offs as leave days" />
      </div>
    </div>,

    // ── Tab 2 ─ Carry Forward & Encashment ───────────────────────────────────
    <div key="t2" className="space-y-6">
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">Carry Forward</h4>
        <Toggle checked={form.carry_forward} onChange={v => set('carry_forward', v)}
          label="Allow carry forward of unused balance"
          help="Unused leaves at year-end roll over to the next year" />
        {form.carry_forward && (
          <div className="p-4 bg-blue-50 rounded-xl space-y-4">
            <Field label="Max Carry Forward Days" help="Leave blank = carry forward full unused balance">
              <Input type="number" value={form.max_carry_forward_days} onChange={v => set('max_carry_forward_days', v)} step="0.5" placeholder="No limit" />
            </Field>
            <Toggle checked={form.carry_forward_expires} onChange={v => set('carry_forward_expires', v)}
              label="Carried-forward balance expires"
              help="Auto-lapse carried forward days after a set period" />
            {form.carry_forward_expires && (
              <Field label="Expire After (months from year start)">
                <Input type="number" value={form.carry_forward_expiry_months} onChange={v => set('carry_forward_expiry_months', v)} min="1" />
              </Field>
            )}
          </div>
        )}
      </div>

      <div className="border-t pt-5 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">Encashment</h4>
        <Toggle checked={form.encashable} onChange={v => set('encashable', v)}
          label="Allow leave encashment"
          help="Employee can convert unused balance to monetary compensation" />
        {form.encashable && (
          <div className="p-4 bg-green-50 rounded-xl space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Max Encashment Days / Year" help="Leave blank = no cap">
                <Input type="number" value={form.max_encashment_days_per_year} onChange={v => set('max_encashment_days_per_year', v)} step="0.5" placeholder="No limit" />
              </Field>
              <Field label="Min Balance After Encashment" help="Minimum days that must remain">
                <Input type="number" value={form.min_balance_after_encashment} onChange={v => set('min_balance_after_encashment', v)} step="0.5" placeholder="0" />
              </Field>
            </div>
            <Toggle checked={form.encashment_on_exit} onChange={v => set('encashment_on_exit', v)}
              label="Auto-encash on exit / Full & Final Settlement"
              help="Remaining leave balance is automatically encashed on resignation or termination" />
          </div>
        )}
      </div>
    </div>,

    // ── Tab 3 ─ Eligibility ───────────────────────────────────────────────────
    <div key="t3" className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Gender Restriction">
          <Select value={form.gender_restriction} onChange={v => set('gender_restriction', v)} options={[
            { value: 'none',   label: 'All Genders' },
            { value: 'male',   label: 'Male Only' },
            { value: 'female', label: 'Female Only' },
            { value: 'other',  label: 'Other Only' },
          ]} />
        </Field>
        <Field label="Employment Type Restriction" help="Leave blank = all types">
          <MultiSelect value={form.employment_type_restriction} onChange={v => set('employment_type_restriction', v)}
            options={empTypeOptions} placeholder="All employment types" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Applicable After (days of service)" help="Employees must complete this many days to be eligible">
          <Input type="number" value={form.applicable_after_days} onChange={v => set('applicable_after_days', parseInt(v) || 0)} min="0" />
        </Field>
      </div>

      <Toggle checked={form.applicable_during_probation} onChange={v => set('applicable_during_probation', v)}
        label="Applicable during probation"
        help="Can employees still in probation apply for this leave?" />

      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-1">Department / Branch / Designation Restrictions</h4>
        <p className="text-xs text-gray-500 mb-3">Leave all blank to apply to everyone, or select specific items to restrict.</p>
        <div className="space-y-3">
          <Field label="Applicable Departments">
            <MultiSelect value={form.department_restriction} onChange={v => set('department_restriction', v)}
              options={deptOptions} placeholder="All departments" />
          </Field>
          <Field label="Applicable Branches">
            <MultiSelect value={form.branch_restriction} onChange={v => set('branch_restriction', v)}
              options={branchOptions} placeholder="All branches" />
          </Field>
          <Field label="Applicable Designations">
            <MultiSelect value={form.designation_restriction} onChange={v => set('designation_restriction', v)}
              options={desigOptions} placeholder="All designations" />
          </Field>
        </div>
      </div>

      <div className="border-t pt-4">
        <Field label="Excluded Employees" help="Individual employees to exclude from this leave type">
          <MultiSelect value={form.excluded_employee_ids} onChange={v => set('excluded_employee_ids', v)}
            options={empOptions} placeholder="No exclusions" />
        </Field>
      </div>
    </div>,

    // ── Tab 4 ─ Approval Workflow ─────────────────────────────────────────────
    <div key="t4" className="space-y-5">
      <Field label="Number of Approval Levels" help="Up to 3 sequential approvers required">
        <Select value={form.approval_levels} onChange={v => setApprovalLevelCount(v)} options={[
          { value: 1, label: '1 Level' },
          { value: 2, label: '2 Levels' },
          { value: 3, label: '3 Levels' },
        ]} className="w-48" />
      </Field>

      {(form.approval_level_configs || []).map((cfg, idx) => (
        <div key={idx} className="p-4 border border-gray-200 rounded-xl bg-gray-50">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">{cfg.level}</span>
            Level {cfg.level} Approver
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Approver Type">
              <Select value={cfg.approver_type} onChange={v => setApprovalConfig(idx, 'approver_type', v)} options={[
                { value: 'reporting_manager', label: 'Reporting Manager' },
                { value: 'department_head',  label: 'Department Head' },
                { value: 'hr_manager',       label: 'HR Manager' },
                { value: 'specific_employee', label: 'Specific Employee' },
              ]} />
            </Field>
            {cfg.approver_type === 'specific_employee' && (
              <Field label="Select Employee">
                <Select value={cfg.specific_employee_id} onChange={v => setApprovalConfig(idx, 'specific_employee_id', v)}
                  options={empOptions} placeholder="Choose employee…" />
              </Field>
            )}
          </div>
          <div className="mt-3">
            <Toggle checked={cfg.skip_if_approver_on_leave} onChange={v => setApprovalConfig(idx, 'skip_if_approver_on_leave', v)}
              label="Auto-skip if approver is on leave"
              help="Move to next approval level automatically if this approver is absent" />
          </div>
        </div>
      ))}

      <div className="border-t pt-4 space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">Auto-Approval</h4>
        <Toggle checked={form.auto_approve} onChange={v => set('auto_approve', v)}
          label="Enable auto-approval"
          help="Automatically approve the request if no action is taken within the specified hours" />
        {form.auto_approve && (
          <Field label="Auto-Approve After (hours)" help="e.g. 48 = auto-approve if not actioned within 48 hours">
            <Input type="number" value={form.auto_approve_after_hours} onChange={v => set('auto_approve_after_hours', v)} min="1" placeholder="e.g. 48" className="w-48" />
          </Field>
        )}
      </div>
    </div>,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {initial?.id ? 'Edit Leave Type' : 'Add Leave Type'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b overflow-x-auto flex-shrink-0">
          {LEAVE_TYPE_TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === i ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {tabs[tab]}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex-shrink-0">
          <div>
            {tab > 0 && (
              <button onClick={() => setTab(t => t - 1)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white">
                ← Previous
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white">
              Cancel
            </button>
            {tab < LEAVE_TYPE_TABS.length - 1 ? (
              <button onClick={() => setTab(t => t + 1)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Next →
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 min-w-[120px]">
                {saving ? 'Saving…' : 'Save Leave Type'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Policy Create / Edit Modal ────────────────────────────────────────────────
function PolicyModal({ open, onClose, onSave, initial, departments, branches }) {
  const [form, setForm] = useState(BLANK_POLICY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial ? { ...BLANK_POLICY, ...initial } : { ...BLANK_POLICY });
  }, [open, initial]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name?.trim()) return;
    setSaving(true);
    try { await onSave(form); onClose(); } catch { /* handle upstream */ } finally { setSaving(false); }
  };

  if (!open) return null;

  const empTypeOptions = [
    { value: 'monthly_salaried', label: 'Monthly Salaried' },
    { value: 'daily_wage', label: 'Daily Wage' },
    { value: 'hourly_wage', label: 'Hourly Wage' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">{initial?.id ? 'Edit Leave Policy' : 'New Leave Policy'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <Field label="Policy Name" required>
            <Input value={form.name} onChange={v => set('name', v)} placeholder="e.g. Standard Leave Policy" />
          </Field>
          <Field label="Description">
            <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={2}
              placeholder="Optional…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Leave Year Starts" help="Month when the leave year begins">
              <Select value={form.year_start_month} onChange={v => set('year_start_month', parseInt(v))}
                options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} />
            </Field>
            <Field label="Carry Forward Process Month" help="Month when CF/lapse is computed">
              <Select value={form.carry_forward_process_month} onChange={v => set('carry_forward_process_month', parseInt(v))}
                options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))} />
            </Field>
          </div>
          <Field label="Applicable Employment Types" help="Leave blank to apply to all">
            <MultiSelect value={form.applicable_employment_types} onChange={v => set('applicable_employment_types', v)}
              options={empTypeOptions} placeholder="All employment types" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Applicable Departments">
              <MultiSelect value={form.applicable_department_ids} onChange={v => set('applicable_department_ids', v)}
                options={departments.map(d => ({ value: d.id, label: d.name }))} placeholder="All departments" />
            </Field>
            <Field label="Applicable Branches">
              <MultiSelect value={form.applicable_branch_ids} onChange={v => set('applicable_branch_ids', v)}
                options={branches.map(b => ({ value: b.id, label: b.name }))} placeholder="All branches" />
            </Field>
          </div>
          <Toggle checked={form.is_active} onChange={v => set('is_active', v)} label="Active Policy" />
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white">Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.name?.trim()}
            className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Policy'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LeavePolicyPage() {
  const [policies, setPolicies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  const [policyModal, setPolicyModal] = useState({ open: false, data: null });
  const [ltModal, setLtModal] = useState({ open: false, policyId: null, data: null });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [polRes, deptRes, brRes, desRes, empRes] = await Promise.all([
        api.get('/tenant/leave-policies'),
        api.get('/tenant/departments'),
        api.get('/tenant/branches'),
        api.get('/tenant/designations'),
        api.get('/tenant/employees?per_page=500'),
      ]);
      setPolicies(polRes.data.data || polRes.data || []);
      setDepartments(deptRes.data.data || deptRes.data || []);
      setBranches(brRes.data.data || brRes.data || []);
      setDesignations(desRes.data.data || desRes.data || []);
      setEmployees(empRes.data.data || []);
    } catch {
      setError('Failed to load leave policies. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Policy CRUD
  const savePolicy = async (form) => {
    if (form.id) {
      const res = await api.put(`/tenant/leave-policies/${form.id}`, form);
      setPolicies(p => p.map(x => x.id === form.id ? res.data : x));
    } else {
      const res = await api.post('/tenant/leave-policies', form);
      setPolicies(p => [...p, res.data]);
      setExpanded(res.data.id);
    }
  };

  const deletePolicy = async (id) => {
    if (!window.confirm('Delete this policy and all its leave types?')) return;
    await api.delete(`/tenant/leave-policies/${id}`);
    setPolicies(p => p.filter(x => x.id !== id));
    if (expanded === id) setExpanded(null);
  };

  // Leave type CRUD
  const saveLeaveType = async (form) => {
    const pid = ltModal.policyId;
    if (form.id) {
      const res = await api.put(`/tenant/leave-policies/${pid}/leave-types/${form.id}`, form);
      setPolicies(p => p.map(pol => pol.id === pid
        ? { ...pol, leave_types: (pol.leave_types || []).map(lt => lt.id === form.id ? res.data : lt) }
        : pol));
    } else {
      const res = await api.post(`/tenant/leave-policies/${pid}/leave-types`, form);
      setPolicies(p => p.map(pol => pol.id === pid
        ? { ...pol, leave_types: [...(pol.leave_types || []), res.data] }
        : pol));
    }
  };

  const deleteLeaveType = async (policyId, ltId) => {
    if (!window.confirm('Delete this leave type?')) return;
    await api.delete(`/tenant/leave-policies/${policyId}/leave-types/${ltId}`);
    setPolicies(p => p.map(pol => pol.id === policyId
      ? { ...pol, leave_types: (pol.leave_types || []).filter(lt => lt.id !== ltId) }
      : pol));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Policies</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure leave types with accrual, limits, carry-forward, encashment, eligibility &amp; approval workflows
          </p>
        </div>
        <button
          onClick={() => setPolicyModal({ open: true, data: null })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          New Policy
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}

      {/* Empty state */}
      {policies.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-700">No leave policies yet</h3>
          <p className="text-sm text-gray-500 mt-1 mb-5">
            Create your first policy to define leave types for your organisation
          </p>
          <button onClick={() => setPolicyModal({ open: true, data: null })}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            Create First Policy
          </button>
        </div>
      )}

      {/* Policy list */}
      <div className="space-y-4">
        {policies.map(policy => {
          const isOpen = expanded === policy.id;
          const leaveTypes = policy.leave_types || [];

          return (
            <div key={policy.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

              {/* Policy header row */}
              <div className="flex items-center justify-between px-5 py-4">
                <button
                  onClick={() => setExpanded(isOpen ? null : policy.id)}
                  className="flex items-center gap-3 flex-1 text-left min-w-0">
                  <svg className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{policy.name}</span>
                      {policy.is_active
                        ? <Badge label="Active" color="green" />
                        : <Badge label="Inactive" color="gray" />}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                      <span>Year starts {MONTHS[(policy.year_start_month || 1) - 1]}</span>
                      <span>•</span>
                      <span>{leaveTypes.length} leave type{leaveTypes.length !== 1 ? 's' : ''}</span>
                      {policy.description && <><span>•</span><span className="truncate">{policy.description}</span></>}
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <button onClick={() => setPolicyModal({ open: true, data: policy })}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => deletePolicy(policy.id)}
                    className="px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                    Delete
                  </button>
                </div>
              </div>

              {/* Leave types panel */}
              {isOpen && (
                <div className="border-t bg-gray-50/80 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Leave Types <span className="font-normal text-gray-400 ml-1">({leaveTypes.length})</span>
                    </h3>
                    <button
                      onClick={() => setLtModal({ open: true, policyId: policy.id, data: null })}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                      Add Leave Type
                    </button>
                  </div>

                  {leaveTypes.length === 0 ? (
                    <div className="text-center py-10 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                      No leave types defined yet. Click "Add Leave Type" to create one.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {leaveTypes.map(lt => (
                        <div key={lt.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-gray-300 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0">
                              {/* Colour swatch + icon */}
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                                style={{ backgroundColor: `${lt.color || '#3B82F6'}22`, border: `2px solid ${lt.color || '#3B82F6'}44` }}>
                                {lt.icon || '🏖️'}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-sm text-gray-900">{lt.name}</span>
                                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-mono">{lt.code}</code>
                                  {lt.is_paid ? <Badge label="Paid" color="green" /> : <Badge label="Unpaid" color="red" />}
                                  {lt.is_admin_only && <Badge label="Admin Only" color="purple" />}
                                  {!lt.is_active && <Badge label="Inactive" color="gray" />}
                                  {lt.gender_restriction && lt.gender_restriction !== 'none' && (
                                    <Badge label={`${lt.gender_restriction} only`} color="yellow" />
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-xs text-gray-500">
                                  <span>{lt.max_days_per_year} days/yr</span>
                                  <span>·</span>
                                  <span className="capitalize">{(lt.accrual_type || 'lump_sum').replace('_', ' ')}</span>
                                  {lt.carry_forward && (
                                    <><span>·</span><span className="text-blue-600">CF ✓</span></>
                                  )}
                                  {lt.encashable && (
                                    <><span>·</span><span className="text-green-600">Encashable ✓</span></>
                                  )}
                                  {lt.approval_levels > 0 && (
                                    <><span>·</span><span>{lt.approval_levels}-level approval</span></>
                                  )}
                                  {lt.auto_approve && (
                                    <><span>·</span><span className="text-amber-600">Auto-approve {lt.auto_approve_after_hours}h</span></>
                                  )}
                                  {(lt.include_holidays_in_count || lt.include_weekends_in_count) && (
                                    <><span>·</span><span>Sandwich rule</span></>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => setLtModal({ open: true, policyId: policy.id, data: lt })}
                                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                Edit
                              </button>
                              <button
                                onClick={() => deleteLeaveType(policy.id, lt.id)}
                                className="px-2.5 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <PolicyModal
        open={policyModal.open}
        onClose={() => setPolicyModal({ open: false, data: null })}
        onSave={savePolicy}
        initial={policyModal.data}
        departments={departments}
        branches={branches}
      />
      <LeaveTypeModal
        open={ltModal.open}
        onClose={() => setLtModal({ open: false, policyId: null, data: null })}
        onSave={saveLeaveType}
        initial={ltModal.data}
        departments={departments}
        branches={branches}
        designations={designations}
        employees={employees}
      />
    </div>
  );
}
