import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = d => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtMins = m => {
  if (!m) return '0m';
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
};

const PRIORITY_META = {
  urgent: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700/50',
  high:   'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-700/50',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700/50',
  low:    'bg-gray-200 dark:bg-slate-700/30 text-gray-600 dark:text-slate-400 border border-gray-400 dark:border-slate-600/50',
};
const STATUS_META = {
  pending:     'bg-gray-100 dark:bg-slate-700/30 text-gray-600 dark:text-slate-400 border border-gray-300 dark:border-slate-600/50',
  in_progress: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border border-teal-300 dark:border-teal-700/50',
  completed:   'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-300 dark:border-green-700/50',
  cancelled:   'bg-gray-100 dark:bg-slate-700/30 text-gray-600 dark:text-slate-400 border border-gray-300 dark:border-slate-600/50',
};

function Badge({ label, cls }) {
  return <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${cls}`}>{label}</span>;
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-200 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-700/30">
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-200">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// ── Note input ────────────────────────────────────────────────────────────────
function NoteInput({ taskId, onAdded }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const res = await api.post(`/tenant/execution/tasks/${taskId}/notes`, { note: text.trim() });
      onAdded(res.data);
      setText('');
    } catch { alert('Failed to add note'); }
    finally { setSaving(false); }
  };
  return (
    <div className="flex gap-2 mt-3">
      <textarea value={text} onChange={e => setText(e.target.value)} rows={2} placeholder="Add a note…"
        onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submit(); }}
        className="flex-1 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
      <button onClick={submit} disabled={saving || !text.trim()}
        className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 self-end">
        {saving ? '…' : 'Add'}
      </button>
    </div>
  );
}

// ── Time Log Form ─────────────────────────────────────────────────────────────
function TimeLogForm({ taskId, onLogged }) {
  const pad = n => String(n).padStart(2, '0');
  const toLocalDT = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const localNow = toLocalDT(new Date());

  const [form, setForm] = useState({ start_time: '', end_time: '', notes: '' });
  const [endError, setEndError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleStartChange = (val) => {
    setEndError('');
    if (val) {
      const start = new Date(val);
      const defaultEnd = new Date(start.getTime() + 15 * 60 * 1000);
      const maxEnd = new Date(localNow);
      // If 15-min default would exceed now, cap at now
      const endVal = defaultEnd <= maxEnd ? toLocalDT(defaultEnd) : localNow;
      setForm(f => ({ ...f, start_time: val, end_time: endVal }));
    } else {
      setForm(f => ({ ...f, start_time: val, end_time: '' }));
    }
  };

  const handleEndChange = (val) => {
    if (form.start_time && val && val <= form.start_time) {
      setEndError('End time must be after start time');
    } else {
      setEndError('');
    }
    setForm(f => ({ ...f, end_time: val }));
  };

  const isValid = form.start_time && form.end_time && !endError && form.end_time > form.start_time;

  const submit = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const res = await api.post(`/tenant/execution/tasks/${taskId}/time-logs`, {
        ...form,
        start_time: new Date(form.start_time).toISOString(),
        end_time:   new Date(form.end_time).toISOString(),
      });
      onLogged(res.data);
      setForm({ start_time: '', end_time: '', notes: '' });
      setEndError('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to log time');
    } finally { setSaving(false); }
  };

  return (
    <div className="p-4 border border-teal-700/50 bg-teal-900/20 rounded-xl mt-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Start Time</label>
          <input type="datetime-local" value={form.start_time}
            onChange={e => handleStartChange(e.target.value)}
            max={localNow}
            className="w-full border border-slate-600 bg-slate-900/50 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">End Time</label>
          <input type="datetime-local" value={form.end_time}
            onChange={e => handleEndChange(e.target.value)}
            min={form.start_time || undefined}
            max={localNow}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-slate-900/50 text-white ${
              endError ? 'border-red-600 focus:ring-red-500' : 'border-slate-600 focus:ring-teal-500'
            }`} />
          {endError && <p className="text-red-400 text-xs mt-1">{endError}</p>}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Notes (optional)</label>
        <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="What was worked on?"
          className="w-full border border-slate-600 bg-slate-900/50 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>
      <button onClick={submit} disabled={saving || !isValid}
        className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
        {saving ? 'Logging…' : 'Log Time'}
      </button>
    </div>
  );
}

// ── Review Form ───────────────────────────────────────────────────────────────
function ReviewForm({ taskId, onSubmitted }) {
  const [form, setForm] = useState({ status: 'approved', quality_score: 8, remarks: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = async () => {
    setSaving(true);
    try {
      const res = await api.post(`/tenant/execution/tasks/${taskId}/reviews`, form);
      onSubmitted(res.data);
      setForm({ status: 'approved', quality_score: 8, remarks: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally { setSaving(false); }
  };
  const scoreColors = { approved: 'bg-green-500', rework: 'bg-red-500', pending: 'bg-yellow-500' };

  return (
    <div className="p-4 border border-purple-300 dark:border-purple-700/50 bg-purple-50 dark:bg-purple-900/20 rounded-xl mt-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Review Decision</label>
          <select value={form.status} onChange={e => set('status', e.target.value)}
            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="approved">✅ Approved</option>
            <option value="rework">🔁 Needs Rework</option>
            <option value="pending">⏳ Pending Review</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Quality Score (1–10): <strong>{form.quality_score}</strong></label>
          <input type="range" min="1" max="10" value={form.quality_score} onChange={e => set('quality_score', parseInt(e.target.value))}
            className="w-full mt-2 accent-purple-600" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Remarks</label>
        <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)} rows={2}
          placeholder="Feedback or reason for decision…"
          className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
      </div>
      <button onClick={submit} disabled={saving}
        className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
        {saving ? 'Submitting…' : 'Submit Review'}
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TaskDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [task, setTask]       = useState(null);
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showTimeForm, setShowTimeForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const [showDeadlineChangeModal, setShowDeadlineChangeModal] = useState(false);
  const [deadlineChangeForm, setDeadlineChangeForm] = useState({ newDueDate: '', reason: '' });
  const [savingDeadlineChange, setSavingDeadlineChange] = useState(false);
  const [approvingDeadlineChange, setApprovingDeadlineChange] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [taskRes, logsRes] = await Promise.all([
        api.get(`/tenant/execution/tasks/${id}`),
        api.get(`/tenant/execution/tasks/${id}/activity-log`),
      ]);
      setTask(taskRes.data);
      setLogs(logsRes.data || []);
    } catch {
      navigate('/app/execution/tasks');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (status, action = null) => {
    setUpdating(true);
    try {
      if (status === 'completed') {
        const res = await api.post(`/tenant/execution/tasks/${id}/complete`, { action: action || 'completed' });
        setTask(res.data);
      } else if (status === 'cancelled') {
        const res = await api.put(`/tenant/execution/tasks/${id}`, { status, action: 'cancelled' });
        setTask(res.data);
      } else if (status === 'reopen') {
        // Reopen task back to pending
        const res = await api.put(`/tenant/execution/tasks/${id}`, { status: 'pending', action: 'reopened' });
        setTask(res.data);
      } else {
        const res = await api.put(`/tenant/execution/tasks/${id}`, { status });
        setTask(res.data);
      }
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full" />
    </div>
  );
  if (!task) return null;

  const totalMinutes = (task.time_logs || []).reduce((s, l) => s + (l.duration_minutes || 0), 0);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !['completed','cancelled'].includes(task.status);
  const canEdit = user?.role === 'tenant_admin' || task.assigned_user?.id === user?.id || task.created_by?.id === user?.id;
  const isTaskCreator = task.created_by?.id === user?.id;

  // Deadline comparison
  const getDeadlineStatus = () => {
    if (!task.due_date || !task.completed_at) return null;
    const dueDate = new Date(task.due_date);
    const completedDate = new Date(task.completed_at);
    const diffDays = Math.floor((completedDate - dueDate) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { status: 'early', days: Math.abs(diffDays), label: `✅ Completed ${Math.abs(diffDays)} days early` };
    } else if (diffDays === 0) {
      return { status: 'ontime', days: 0, label: '✅ Completed on time' };
    } else {
      return { status: 'late', days: diffDays, label: `⚠️ Completed ${diffDays} days late` };
    }
  };

  const handleDeadlineChangeRequest = async () => {
    if (!deadlineChangeForm.newDueDate || !deadlineChangeForm.reason.trim()) {
      alert('Please fill in all fields');
      return;
    }
    setSavingDeadlineChange(true);
    try {
      const res = await api.post(`/tenant/execution/tasks/${task.id}/request-deadline-change`, {
        new_due_date: deadlineChangeForm.newDueDate,
        reason: deadlineChangeForm.reason,
      });
      setTask(res.data);
      setShowDeadlineChangeModal(false);
      setDeadlineChangeForm({ newDueDate: '', reason: '' });
      alert('Deadline change request sent to your manager');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request deadline change');
    } finally {
      setSavingDeadlineChange(false);
    }
  };

  const handleApproveDeadlineChange = async (approved) => {
    setApprovingDeadlineChange(true);
    try {
      const res = await api.post(`/tenant/execution/tasks/${task.id}/approve-deadline-change`, { approved });
      setTask(res.data);
      alert(approved ? 'Deadline change approved' : 'Deadline change rejected');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process deadline change');
    } finally {
      setApprovingDeadlineChange(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen">
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 mb-4">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back
      </button>

      {/* Title row */}
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700/50 shadow-sm p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{task.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge label={task.status?.replace('_', ' ')} cls={STATUS_META[task.status] || ''} />
              <Badge label={task.priority} cls={PRIORITY_META[task.priority] || ''} />
              {isOverdue && <Badge label="⚠ Overdue" cls="bg-red-100 text-red-700" />}
            </div>
          </div>
          {/* Status actions */}
          {canEdit && (
            <div className="flex gap-2 flex-shrink-0">
              {!['completed','cancelled'].includes(task.status) && (
                <>
                  {task.status === 'pending' && (
                    <button onClick={() => updateStatus('in_progress')} disabled={updating}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                      Start
                    </button>
                  )}
                  <button onClick={() => updateStatus('completed')} disabled={updating}
                    className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                    Complete
                  </button>
                  <button onClick={() => setConfirmCancel(true)} disabled={updating}
                    className="px-3 py-1.5 text-xs border border-red-200 text-red-400 rounded-lg hover:bg-red-50 disabled:opacity-50">
                    Cancel
                  </button>
                </>
              )}
              {['completed','cancelled'].includes(task.status) && (
                <>
                  {(task.created_by?.id === user?.id || task.created_by_user_id === user?.id) && !task.reviews?.some(r => r.reviewer_id === user?.id) && (
                    <button onClick={async () => {
                      try {
                        setUpdating(true);
                        await api.post(`/tenant/execution/tasks/${id}/reviews`, { status: 'approved', quality_score: 8, remarks: 'Reviewed' });
                        alert('Task marked as reviewed! Redirecting...');
                        navigate(-1);
                      } catch (err) {
                        alert('Failed to mark as reviewed: ' + (err.response?.data?.message || err.message));
                      } finally {
                        setUpdating(false);
                      }
                    }} disabled={updating}
                      className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                      Mark Reviewed
                    </button>
                  )}
                  <button onClick={() => setConfirmReopen(true)} disabled={updating}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    Reopen Task
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {task.description && (
          <p className="text-sm text-gray-700 dark:text-slate-300 mt-3 leading-relaxed">{task.description}</p>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-700/30">
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-500 font-medium mb-0.5">Role</p>
            <p className="text-sm text-gray-900 dark:text-slate-200 font-medium">{task.role?.name || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-500 font-medium mb-0.5">Assigned To</p>
            <p className="text-sm text-gray-900 dark:text-slate-200 font-medium">{task.assigned_user?.name || <span className="text-gray-500 dark:text-slate-500 italic">Unassigned</span>}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-500 font-medium mb-0.5">Due Date</p>
            <p className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-slate-200'}`}>{fmtDate(task.due_date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-500 font-medium mb-0.5">Time Logged</p>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{fmtMins(totalMinutes)}</p>
          </div>
          {task.area && (
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-500 font-medium mb-0.5">Area</p>
              <p className="text-sm text-gray-900 dark:text-slate-200">{task.area.area_name}</p>
            </div>
          )}
          {task.activity && (
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-500 font-medium mb-0.5">Activity</p>
              <p className="text-sm text-gray-900 dark:text-slate-200">{task.activity.activity_name}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-500 font-medium mb-0.5">Created By</p>
            <p className="text-sm text-gray-900 dark:text-slate-200">{task.created_by?.name || '—'}</p>
          </div>
          {task.completed_at && getDeadlineStatus() && (
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-500 font-medium mb-0.5">Completion Status</p>
              <p className="text-sm font-medium text-gray-900 dark:text-slate-200">{getDeadlineStatus().label}</p>
            </div>
          )}
          {task.deadline_change_status && (
            <div>
              <p className="text-xs text-gray-500 dark:text-slate-500 font-medium mb-0.5">Deadline Change</p>
              <p className={`text-sm font-medium ${
                task.deadline_change_status === 'pending' ? 'text-yellow-600 dark:text-yellow-500' :
                task.deadline_change_status === 'approved' ? 'text-green-600 dark:text-green-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {task.deadline_change_status === 'pending' ? '⏳ Pending' :
                 task.deadline_change_status === 'approved' ? '✅ Approved' :
                 '❌ Rejected'}
              </p>
            </div>
          )}
        </div>

        {/* Deadline Change Request Button (for assigned user) */}
        {task.assigned_user?.id === user?.id && !['completed','cancelled'].includes(task.status) && !['pending', 'approved'].includes(task.deadline_change_status) && (
          <div className="mt-4">
            <button onClick={() => setShowDeadlineChangeModal(true)}
              className="px-4 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-50 border border-orange-200">
              📅 Request Deadline Extension
            </button>
          </div>
        )}

        {/* Deadline Change Approval Section (for task creator) */}
        {task.deadline_change_status === 'pending' && isTaskCreator && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-900 mb-3">Deadline Extension Request</h3>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Requested by:</span>
                <span className="text-sm font-medium text-gray-800">{task.assigned_user?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Current due date:</span>
                <span className="text-sm font-medium text-gray-800">{fmtDate(task.due_date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Requested due date:</span>
                <span className="text-sm font-medium text-gray-800">{fmtDate(task.requested_new_due_date)}</span>
              </div>
              <div className="mt-3">
                <p className="text-sm text-slate-300 mb-1">Reason:</p>
                <p className="text-sm text-slate-200 italic border-l-2 border-yellow-300 pl-3">{task.deadline_change_reason}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleApproveDeadlineChange(true)} disabled={approvingDeadlineChange}
                className="flex-1 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                {approvingDeadlineChange ? '⏳ Processing…' : '✅ Approve'}
              </button>
              <button onClick={() => handleApproveDeadlineChange(false)} disabled={approvingDeadlineChange}
                className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                {approvingDeadlineChange ? '⏳ Processing…' : '❌ Reject'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left col: Notes + Time Logs */}
        <div className="lg:col-span-2 space-y-4">

          {/* Notes */}
          <Section title="Notes" icon="📝">
            {(task.notes || []).length === 0 && (
              <p className="text-sm text-gray-500 dark:text-slate-500 italic">No notes yet.</p>
            )}
            <div className="space-y-3">
              {(task.notes || []).map(note => (
                <div key={note.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-700">
                    {note.user?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 bg-gray-100 dark:bg-slate-700/30 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-900 dark:text-slate-200">{note.user?.name}</span>
                      <span className="text-xs text-gray-500 dark:text-slate-500">{fmtDateTime(note.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-slate-200 whitespace-pre-wrap">{note.note}</p>
                  </div>
                </div>
              ))}
            </div>
            <NoteInput taskId={task.id} onAdded={n => setTask(t => ({ ...t, notes: [n, ...(t.notes || [])] }))} />
          </Section>

          {/* Time Logs */}
          <Section title={`Time Logs · ${fmtMins(totalMinutes)} total`} icon="⏱️">
            {(task.time_logs || []).length === 0 && (
              <p className="text-sm text-slate-500 italic">No time logged yet.</p>
            )}
            <div className="space-y-2">
              {(task.time_logs || []).map(log => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-green-700">
                      {log.user?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{fmtMins(log.duration_minutes)}</p>
                      <p className="text-xs text-slate-400">{log.user?.name} · {fmtDateTime(log.start_time)} → {fmtDateTime(log.end_time)}</p>
                      {log.notes && <p className="text-xs text-slate-500 italic mt-0.5">{log.notes}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <button onClick={() => setShowTimeForm(v => !v)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                {showTimeForm ? 'Cancel' : 'Log Time'}
              </button>
              {showTimeForm && (
                <TimeLogForm taskId={task.id} onLogged={log => {
                  setTask(t => ({ ...t, time_logs: [log, ...(t.time_logs || [])] }));
                  setShowTimeForm(false);
                }} />
              )}
            </div>
          </Section>

          {/* Reviews */}
          <Section title="Quality Reviews" icon="✅">
            {(task.reviews || []).length === 0 && (
              <p className="text-sm text-gray-500 dark:text-slate-500 italic">No reviews submitted yet.</p>
            )}
            <div className="space-y-3">
              {(task.reviews || []).map(review => (
                <div key={review.id} className={`p-3 rounded-xl border ${
                  review.status === 'approved' ? 'border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30' :
                  review.status === 'rework'   ? 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30' :
                  'border-gray-200 dark:border-slate-700/50 bg-gray-50 dark:bg-slate-800/30'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-900 dark:text-slate-200">{review.reviewer?.name}</span>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                        review.status === 'approved' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' :
                        review.status === 'rework'   ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
                        'bg-gray-100 dark:bg-slate-700/40 text-gray-700 dark:text-slate-300'
                      }`}>{review.status === 'rework' ? 'Needs Rework' : review.status.charAt(0).toUpperCase() + review.status.slice(1)}</span>
                      {review.quality_score && (
                        <span className="text-xs text-gray-600 dark:text-slate-400">Score: <strong>{review.quality_score}/10</strong></span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-slate-500">{fmtDateTime(review.reviewed_at)}</span>
                  </div>
                  {review.remarks && <p className="text-sm text-gray-900 dark:text-slate-300 italic">"{review.remarks}"</p>}
                </div>
              ))}
            </div>
            {user?.role === 'tenant_admin' && (
              <div className="mt-3">
                <button onClick={() => setShowReviewForm(v => !v)}
                  className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  {showReviewForm ? 'Cancel' : 'Add Review'}
                </button>
                {showReviewForm && (
                  <ReviewForm taskId={task.id} onSubmitted={review => {
                    setTask(t => ({ ...t, reviews: [review, ...(t.reviews || [])] }));
                    setShowReviewForm(false);
                  }} />
                )}
              </div>
            )}
          </Section>
        </div>

        {/* Right col: Sidebar info */}
        <div className="space-y-4">
          {/* Observers */}
          <Section title="Observers" icon="👁️">
            {(task.observers || []).length === 0 ? (
              <p className="text-sm text-slate-500 italic">No observers</p>
            ) : (
              <div className="space-y-2">
                {(task.observers || []).map(obs => (
                  <div key={obs.id} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-slate-300">
                      {obs.user?.name?.charAt(0)}
                    </div>
                    <span className="text-sm text-slate-200">{obs.user?.name}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Assignment History */}
          {(task.assignments || []).length > 0 && (
            <Section title="Assignment History" icon="🔄">
              <div className="space-y-2">
                {(task.assignments || []).map((asgn, i) => (
                  <div key={i} className="text-xs text-slate-300 border-l-2 border-blue-100 pl-2">
                    <p>
                      {asgn.previous_user ? <><span className="font-medium">{asgn.previous_user.name}</span> →&nbsp;</> : 'Assigned to '}
                      <span className="font-medium">{asgn.new_user?.name || 'Unassigned'}</span>
                    </p>
                    <p className="text-slate-500 mt-0.5">by {asgn.assigned_by?.name} · {fmtDateTime(asgn.created_at)}</p>
                    {asgn.reason && <p className="text-slate-500 italic">{asgn.reason}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Activity Log */}
          {logs.length > 0 && (
            <Section title="Activity Log" icon="📋">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.map(log => {
                  // Determine the action description based on action_type
                  let actionDesc = log.action_type?.replace(/_/g, ' ');

                  const actionTypeMap = {
                    task_created: '📝 Task Created',
                    task_completed: '✅ Task Completed',
                    task_cancelled: '❌ Task Cancelled',
                    task_reopened: '🔄 Task Reopened',
                    task_updated: '📊 Task Updated',
                    task_assigned: '👤 Task Assigned',
                    note_added: '💬 Note Added',
                    review_added: '✔️ Review Submitted',
                    time_logged: '⏱️ Time Logged',
                  };

                  actionDesc = actionTypeMap[log.action_type] || log.action_type?.replace(/_/g, ' ');

                  return (
                    <div key={log.id} className="text-xs border-l-2 border-slate-700/30 pl-2">
                      <p className="text-slate-200 font-medium">{actionDesc}</p>
                      <p className="text-slate-500">{log.user?.name} · {fmtDateTime(log.created_at)}</p>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/30">
              <h2 className="text-base font-semibold text-white">Cancel Task?</h2>
              <button onClick={() => setConfirmCancel(false)} className="text-slate-500 hover:text-slate-300 text-2xl">&times;</button>
            </div>
            <div className="px-6 py-4 bg-red-50/50 border-b border-red-100">
              <p className="text-sm text-slate-200 mb-2">
                Are you sure you want to cancel <strong>{task.title}</strong>?
              </p>
              <p className="text-xs text-slate-400">
                This action will mark the task as cancelled and move it to the completed list. This action can be reversed.
              </p>
            </div>
            <div className="flex gap-3 px-6 py-4">
              <button onClick={() => setConfirmCancel(false)}
                className="flex-1 px-4 py-2 text-sm font-medium border border-slate-700/50 text-slate-200 rounded-lg hover:bg-slate-700/30 transition-colors">
                Keep Task
              </button>
              <button onClick={() => { updateStatus('cancelled'); setConfirmCancel(false); }} disabled={updating}
                className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                {updating ? 'Cancelling…' : 'Cancel Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reopen Confirmation Modal */}
      {confirmReopen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/30">
              <h2 className="text-base font-semibold text-white">Reopen Task?</h2>
              <button onClick={() => setConfirmReopen(false)} className="text-slate-500 hover:text-slate-300 text-2xl">&times;</button>
            </div>
            <div className="px-6 py-4 bg-blue-50/50 border-b border-blue-100">
              <p className="text-sm text-slate-200 mb-2">
                Reopen <strong>{task.title}</strong>?
              </p>
              <p className="text-xs text-slate-400">
                This will move the task back to "Pending" status and remove it from the completed list. You can then continue working on it.
              </p>
            </div>
            <div className="flex gap-3 px-6 py-4">
              <button onClick={() => setConfirmReopen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium border border-slate-700/50 text-slate-200 rounded-lg hover:bg-slate-700/30 transition-colors">
                Keep as is
              </button>
              <button onClick={() => { updateStatus('reopen'); setConfirmReopen(false); }} disabled={updating}
                className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {updating ? 'Reopening…' : 'Reopen Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deadline Change Request Modal */}
      {showDeadlineChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/30">
              <h2 className="text-base font-semibold text-white">Request Deadline Extension</h2>
              <button onClick={() => setShowDeadlineChangeModal(false)} className="text-slate-500 hover:text-slate-300 text-2xl">&times;</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Current Due Date</label>
                <p className="text-sm font-medium text-slate-200">{fmtDate(task.due_date)}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">New Due Date *</label>
                <input type="date" value={deadlineChangeForm.newDueDate}
                  onChange={e => setDeadlineChangeForm(f => ({ ...f, newDueDate: e.target.value }))}
                  min={fmtDate(new Date(new Date().getTime() + 24*60*60*1000))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Reason for Extension *</label>
                <textarea value={deadlineChangeForm.reason}
                  onChange={e => setDeadlineChangeForm(f => ({ ...f, reason: e.target.value }))}
                  rows={3}
                  placeholder="Explain why you need more time..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-slate-700/30">
              <button onClick={() => setShowDeadlineChangeModal(false)}
                className="flex-1 px-4 py-2 text-sm font-medium border border-slate-700/50 text-slate-200 rounded-lg hover:bg-slate-700/30 transition-colors">
                Cancel
              </button>
              <button onClick={handleDeadlineChangeRequest} disabled={savingDeadlineChange || !deadlineChangeForm.newDueDate || !deadlineChangeForm.reason.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors">
                {savingDeadlineChange ? 'Sending…' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
