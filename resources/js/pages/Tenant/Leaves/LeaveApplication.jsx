import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtNum  = n => n != null ? parseFloat(n).toFixed(1) : '—';

const STATUS_META = {
  draft:        { label: 'Draft',        color: 'bg-gray-100 text-gray-600' },
  pending:      { label: 'Pending',      color: 'bg-yellow-100 text-yellow-700' },
  approved:     { label: 'Approved',     color: 'bg-green-100 text-green-700' },
  auto_approved:{ label: 'Auto Approved',color: 'bg-teal-100 text-teal-700' },
  rejected:     { label: 'Rejected',     color: 'bg-red-100 text-red-700' },
  cancelled:    { label: 'Cancelled',    color: 'bg-gray-100 text-gray-500' },
  withdrawn:    { label: 'Withdrawn',    color: 'bg-orange-100 text-orange-600' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${m.color}`}>{m.label}</span>;
}

// ── Apply Leave Modal ─────────────────────────────────────────────────────────
function ApplyModal({ open, onClose, onSubmit, leaveTypes }) {
  const BLANK = {
    leave_type_id: '', from_date: '', to_date: '',
    is_half_day: false, half_day_session: 'first_half',
    reason: '', contact_during_leave: '',
  };
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setForm(BLANK); setErrors({}); }
  }, [open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (asDraft) => {
    const e = {};
    if (!form.leave_type_id) e.leave_type_id = 'Select a leave type';
    if (!form.from_date)     e.from_date     = 'From date required';
    if (!form.to_date)       e.to_date       = 'To date required';
    if (!form.reason?.trim()) e.reason       = 'Reason required';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      await onSubmit({ ...form, submit: !asDraft });
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to apply.';
      setErrors({ general: msg });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-semibold">Apply for Leave</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{errors.general}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type <span className="text-red-500">*</span></label>
            <select value={form.leave_type_id} onChange={e => set('leave_type_id', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">Select leave type…</option>
              {leaveTypes.map(lt => (
                <option key={lt.id} value={lt.id}>{lt.name} ({lt.code})</option>
              ))}
            </select>
            {errors.leave_type_id && <p className="text-red-500 text-xs mt-1">{errors.leave_type_id}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.from_date} onChange={e => set('from_date', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.from_date && <p className="text-red-500 text-xs mt-1">{errors.from_date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.to_date} onChange={e => set('to_date', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.to_date && <p className="text-red-500 text-xs mt-1">{errors.to_date}</p>}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => set('is_half_day', !form.is_half_day)}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.is_half_day ? 'bg-blue-600' : 'bg-gray-200'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_half_day ? 'translate-x-5' : ''}`} />
            </div>
            <span className="text-sm font-medium text-gray-700">Half Day</span>
          </label>

          {form.is_half_day && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
              <select value={form.half_day_session} onChange={e => set('half_day_session', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="first_half">First Half</option>
                <option value="second_half">Second Half</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
            <textarea value={form.reason} onChange={e => set('reason', e.target.value)} rows={3}
              placeholder="Briefly describe the reason for your leave…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact During Leave</label>
            <input type="text" value={form.contact_during_leave} onChange={e => set('contact_during_leave', e.target.value)}
              placeholder="Phone number or email reachable during leave"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white">Cancel</button>
          <button onClick={() => handleSubmit(true)} disabled={saving}
            className="px-4 py-2 text-sm border border-gray-300 bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50">
            Save as Draft
          </button>
          <button onClick={() => handleSubmit(false)} disabled={saving}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Submitting…' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Review / Action Modal ─────────────────────────────────────────────────────
function ActionModal({ open, onClose, application, action, onAction }) {
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setComments(''); }, [open]);

  const handle = async () => {
    setSaving(true);
    try {
      await onAction(application.id, action, comments);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  if (!open || !application) return null;

  const actionMeta = {
    approve:  { title: 'Approve Leave',    btn: 'Approve',  cls: 'bg-green-600 hover:bg-green-700', commentsRequired: false },
    reject:   { title: 'Reject Leave',     btn: 'Reject',   cls: 'bg-red-600 hover:bg-red-700',   commentsRequired: true  },
    cancel:   { title: 'Cancel Application',btn:'Cancel Leave', cls: 'bg-orange-600 hover:bg-orange-700', commentsRequired: false },
    withdraw: { title: 'Withdraw Leave',   btn: 'Withdraw', cls: 'bg-orange-600 hover:bg-orange-700', commentsRequired: false },
  };
  const meta = actionMeta[action] || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">{meta.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Summary card */}
          <div className="p-4 bg-gray-50 rounded-xl text-sm space-y-1">
            <div className="font-semibold text-gray-800">{application.employee_name || 'Employee'}</div>
            <div className="text-gray-600">{application.leave_type_name} · {application.application_number}</div>
            <div className="text-gray-600">{fmtDate(application.from_date)} → {fmtDate(application.to_date)} · <strong>{fmtNum(application.total_days)} days</strong></div>
            {application.reason && <div className="text-gray-500 italic mt-2">"{application.reason}"</div>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comments {meta.commentsRequired && <span className="text-red-500">*</span>}
            </label>
            <textarea value={comments} onChange={e => setComments(e.target.value)} rows={3}
              placeholder={action === 'reject' ? 'Reason for rejection…' : 'Optional comments…'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-white">Cancel</button>
          <button onClick={handle}
            disabled={saving || (meta.commentsRequired && !comments.trim())}
            className={`px-5 py-2 text-sm text-white rounded-lg disabled:opacity-50 ${meta.cls}`}>
            {saving ? 'Processing…' : meta.btn}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LeaveApplicationPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'tenant_admin';

  const [applications, setApplications] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'pending' | 'all'
  const [filter, setFilter] = useState({ status: '', leave_type_id: '' });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({});

  const [applyModal, setApplyModal] = useState(false);
  const [actionModal, setActionModal] = useState({ open: false, application: null, action: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch leave types for apply modal
      const ltRes = await api.get('/tenant/leave-policies');
      const allLTs = (ltRes.data.data || ltRes.data || []).flatMap(p => p.leave_types || []).filter(lt => lt.is_active && !lt.is_admin_only);
      setLeaveTypes(allLTs);

      // Fetch applications
      const params = new URLSearchParams({ page, per_page: 15 });
      if (filter.status) params.set('status', filter.status);
      if (filter.leave_type_id) params.set('leave_type_id', filter.leave_type_id);
      if (activeTab === 'all' && isAdmin) params.set('all', '1');

      const [appRes, pendRes] = await Promise.all([
        api.get(`/tenant/leave-applications?${params}`),
        api.get('/tenant/leave-applications/pending-my-approval'),
      ]);

      setApplications(appRes.data.data || []);
      setMeta(appRes.data.meta || {});
      setPendingApprovals(pendRes.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [activeTab, filter, page, isAdmin]);

  useEffect(() => { load(); }, [load]);

  const handleApply = async (form) => {
    const res = await api.post('/tenant/leave-applications', form);
    setApplications(a => [res.data, ...a]);
    load();
  };

  const handleAction = async (id, action, comments) => {
    await api.patch(`/tenant/leave-applications/${id}/${action}`, { comments });
    load();
  };

  const displayList = activeTab === 'pending' ? pendingApprovals : applications;

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Applications</h1>
          <p className="text-sm text-gray-500 mt-1">Apply for leave, track status, and manage approvals</p>
        </div>
        <button onClick={() => setApplyModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Apply Leave
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { key: 'my',      label: 'My Applications' },
          { key: 'pending', label: `Pending My Approval${pendingApprovals.length ? ` (${pendingApprovals.length})` : ''}` },
          ...(isAdmin ? [{ key: 'all', label: 'All Employees' }] : []),
        ].map(t => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === t.key ? 'bg-white shadow-sm text-blue-700' : 'text-gray-600 hover:text-gray-900'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {activeTab !== 'pending' && (
        <div className="flex gap-3 mb-4">
          <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Status</option>
            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filter.leave_type_id} onChange={e => setFilter(f => ({ ...f, leave_type_id: e.target.value }))}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Leave Types</option>
            {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
          </select>
        </div>
      )}

      {/* Applications list */}
      {displayList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-3">🗓️</div>
          <h3 className="text-lg font-semibold text-gray-700">No applications found</h3>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === 'pending' ? "You have no pending approvals." : "No leave applications yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayList.map(app => (
            <ApplicationCard
              key={app.id}
              app={app}
              currentUserId={user?.employee_id}
              isAdmin={isAdmin}
              activeTab={activeTab}
              onAction={(action) => setActionModal({ open: true, application: app, action })}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {activeTab !== 'pending' && meta.last_page > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">← Prev</button>
          <span className="px-3 py-1.5 text-sm text-gray-600">Page {page} of {meta.last_page}</span>
          <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">Next →</button>
        </div>
      )}

      {/* Modals */}
      <ApplyModal
        open={applyModal}
        onClose={() => setApplyModal(false)}
        onSubmit={handleApply}
        leaveTypes={leaveTypes}
      />
      <ActionModal
        open={actionModal.open}
        onClose={() => setActionModal({ open: false, application: null, action: '' })}
        application={actionModal.application}
        action={actionModal.action}
        onAction={handleAction}
      />
    </div>
  );
}

// ── Application Card ──────────────────────────────────────────────────────────
function ApplicationCard({ app, currentUserId, isAdmin, activeTab, onAction }) {
  const [expanded, setExpanded] = useState(false);

  const canApprove  = activeTab === 'pending' || (isAdmin && ['pending'].includes(app.status));
  const canReject   = canApprove;
  const canCancel   = ['draft', 'pending'].includes(app.status) && (app.employee_id === currentUserId || isAdmin);
  const canWithdraw = ['approved', 'auto_approved'].includes(app.status) && (app.employee_id === currentUserId || isAdmin);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 gap-4">
        {/* Left: info */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 flex flex-col items-center justify-center text-center">
            <span className="text-lg font-bold text-blue-700 leading-none">
              {fmtNum(app.total_days)}
            </span>
            <span className="text-[10px] text-blue-500 mt-0.5">days</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 text-sm">{app.leave_type_name || 'Leave'}</span>
              <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-500">{app.application_number}</code>
              <StatusBadge status={app.status} />
            </div>
            {(isAdmin || activeTab === 'all') && app.employee_name && (
              <div className="text-xs text-blue-600 font-medium mt-0.5">{app.employee_name}</div>
            )}
            <div className="text-sm text-gray-600 mt-1">
              {fmtDate(app.from_date)}
              {app.from_date !== app.to_date && <> &rarr; {fmtDate(app.to_date)}</>}
              {app.is_half_day && <span className="ml-1 text-xs text-gray-400">({app.half_day_session?.replace('_', ' ')})</span>}
            </div>
            {app.reason && (
              <p className="text-xs text-gray-500 mt-1 truncate max-w-md">{app.reason}</p>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {canApprove && (
            <button onClick={() => onAction('approve')}
              className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
              Approve
            </button>
          )}
          {canReject && (
            <button onClick={() => onAction('reject')}
              className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">
              Reject
            </button>
          )}
          {canCancel && (
            <button onClick={() => onAction('cancel')}
              className="px-3 py-1.5 text-xs border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50">
              Cancel
            </button>
          )}
          {canWithdraw && (
            <button onClick={() => onAction('withdraw')}
              className="px-3 py-1.5 text-xs border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50">
              Withdraw
            </button>
          )}
          <button onClick={() => setExpanded(e => !e)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded: approval timeline */}
      {expanded && app.approvals && app.approvals.length > 0 && (
        <div className="border-t bg-gray-50 px-5 py-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Approval History</h4>
          <div className="space-y-2">
            {app.approvals.map((appr, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  appr.status === 'approved' || appr.status === 'auto_approved' ? 'bg-green-100 text-green-700' :
                  appr.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  appr.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{appr.level}</div>
                <div className="flex-1">
                  <span className="capitalize text-gray-700">{appr.approver_type?.replace(/_/g, ' ')}</span>
                  {appr.actioned_by_name && <span className="text-gray-500 ml-1">— {appr.actioned_by_name}</span>}
                  {appr.comments && <span className="text-gray-400 ml-2 italic text-xs">"{appr.comments}"</span>}
                </div>
                <StatusBadge status={appr.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
