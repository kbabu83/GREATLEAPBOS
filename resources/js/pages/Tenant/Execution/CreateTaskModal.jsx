import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

const inputCls = 'w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400';

// ── Assignee Role Panel ───────────────────────────────────────────────────────
export function AssigneeRolePanel({ user, roleDetails }) {
    const [activeIdx, setActiveIdx] = useState(0);

    useEffect(() => { setActiveIdx(0); }, [user?.id]);

    if (!user) return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-slate-400 p-6">
            <svg className="w-10 h-10 mb-3 text-gray-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Select an assignee</p>
            <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Their roles will appear here</p>
        </div>
    );

    const allRoles = roleDetails?.length > 0 ? roleDetails : (user.es_roles || []);
    const esRole   = allRoles[activeIdx] || null;

    return (
        <div className="h-full overflow-y-auto">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-teal-100 font-bold text-sm">{user.name.charAt(0)}</span>
                </div>
                <div>
                    <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm">{user.name}</p>
                    <p className="text-xs text-gray-600 dark:text-slate-400">{user.email}</p>
                    {user.department && <p className="text-xs text-gray-500 dark:text-slate-500">{user.department}</p>}
                </div>
            </div>

            {allRoles.length > 1 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                    {allRoles.map((r, i) => (
                        <button key={r.id} onClick={() => setActiveIdx(i)}
                            className={`px-2 py-1 text-xs rounded-lg border font-medium transition-colors ${
                                activeIdx === i
                                    ? 'bg-teal-600 text-white border-teal-600'
                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-600 hover:border-teal-500'
                            }`}>
                            {r.name}
                        </button>
                    ))}
                </div>
            )}

            {esRole ? (
                <div className="space-y-3">
                    {allRoles.length === 1 && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-600 text-white">
                            {esRole.name}
                        </span>
                    )}

                    {esRole.purpose && (
                        <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed border-l-2 border-teal-600 pl-2">
                            {esRole.purpose}
                        </p>
                    )}

                    {esRole.areas?.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">Areas</p>
                            <div className="space-y-1">
                                {esRole.areas.map(a => (
                                    <div key={a.id} className="text-xs text-gray-600 dark:text-slate-400 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-teal-500 flex-shrink-0" />
                                        {a.area_name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {esRole.activities?.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                                Activities ({esRole.activities.length})
                            </p>
                            <div className="space-y-1">
                                {esRole.activities.slice(0, 5).map(a => (
                                    <div key={a.id} className="text-xs text-gray-600 dark:text-slate-400 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-lime-400 flex-shrink-0" />
                                        {a.activity_name}
                                        {a.frequency_type && <span className="text-gray-500 dark:text-slate-500 capitalize">({a.frequency_type})</span>}
                                    </div>
                                ))}
                                {esRole.activities.length > 5 && (
                                    <p className="text-xs text-gray-500 dark:text-slate-500 pl-2.5">+{esRole.activities.length - 5} more</p>
                                )}
                            </div>
                        </div>
                    )}

                    {esRole.skills?.hard_skills?.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Key Skills</p>
                            <div className="flex flex-wrap gap-1">
                                {[...(esRole.skills.hard_skills || []), ...(esRole.skills.soft_skills || [])].slice(0, 6).map((s, i) => (
                                    <span key={i} className="text-xs bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-full px-2 py-0.5">{s}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-4 text-gray-600 dark:text-slate-400">
                    <p className="text-xs">No execution roles assigned to this user</p>
                </div>
            )}
        </div>
    );
}

// ── Create Task Modal ─────────────────────────────────────────────────────────
export function CreateTaskModal({ open, onClose, onCreated, roles, users }) {
    const { user } = useAuth();
    const BLANK = {
        title: '', description: '', role_id: '', assigned_user_id: user?.id || '',
        area_id: '', activity_id: '', priority: 'medium', due_date: '',
    };
    const [form, setForm]             = useState(BLANK);
    const [areas, setAreas]           = useState([]);
    const [activities, setActivities] = useState([]);
    const [assigneeRoles, setAssigneeRoles] = useState([]);
    const [loadingRole, setLoadingRole]     = useState(false);
    const [saving, setSaving]         = useState(false);
    const [errors, setErrors]         = useState({});

    useEffect(() => {
        if (open) {
            setForm({ ...BLANK, assigned_user_id: user?.id || '' });
            setErrors({});
            setAreas([]);
            setActivities([]);
            setAssigneeRoles([]);
        }
    }, [open]);

    useEffect(() => {
        if (!form.role_id) { setAreas([]); setActivities([]); return; }
        api.get(`/tenant/execution/roles/${form.role_id}`).then(res => {
            setAreas(res.data.areas || []);
            setActivities(res.data.activities || []);
        }).catch(() => {});
    }, [form.role_id]);

    useEffect(() => {
        const selectedUser = users.find(u => String(u.id) === String(form.assigned_user_id));
        if (!selectedUser?.es_roles?.length) { setAssigneeRoles([]); return; }
        setLoadingRole(true);
        Promise.all(
            selectedUser.es_roles.map(r => api.get(`/tenant/execution/roles/${r.id}`).then(res => res.data).catch(() => r))
        ).then(details => setAssigneeRoles(details))
         .finally(() => setLoadingRole(false));
    }, [form.assigned_user_id, users]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const selectedUser = users.find(u => String(u.id) === String(form.assigned_user_id)) || null;

    const handleSave = async () => {
        const e = {};
        if (!form.title.trim()) e.title = 'Title required';
        if (!form.role_id)      e.role_id = 'Role required';
        setErrors(e);
        if (Object.keys(e).length) return;
        setSaving(true);
        try {
            const res = await api.post('/tenant/execution/tasks', {
                ...form,
                assigned_user_id: form.assigned_user_id || null,
                area_id:          form.area_id           || null,
                activity_id:      form.activity_id       || null,
                due_date:         form.due_date           || null,
            });
            onCreated(res.data);
            onClose();
        } catch (err) {
            setErrors({ general: err.response?.data?.message || 'Failed to create task' });
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Create Task</h2>
                    <button onClick={onClose} className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300 text-2xl leading-none">&times;</button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left: Form */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-w-0">
                        {errors.general && (
                            <div className="p-3 bg-red-900/20 border border-red-800 text-red-400 text-sm rounded-lg">{errors.general}</div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-slate-200 mb-1">
                                Task Title <span className="text-red-400">*</span>
                            </label>
                            <input value={form.title} onChange={e => set('title', e.target.value)}
                                placeholder="What needs to be done?" className={inputCls} autoFocus />
                            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-slate-200 mb-1">Description</label>
                            <textarea value={form.description} onChange={e => set('description', e.target.value)}
                                rows={2} placeholder="Additional context…" className={inputCls} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-slate-200 mb-1">
                                    Role <span className="text-red-400">*</span>
                                </label>
                                <select value={form.role_id}
                                    onChange={e => { set('role_id', e.target.value); set('area_id', ''); set('activity_id', ''); }}
                                    className={inputCls}>
                                    <option value="">Select role…</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                                {errors.role_id && <p className="text-red-400 text-xs mt-1">{errors.role_id}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-slate-200 mb-1">Assign To</label>
                                <select value={form.assigned_user_id} onChange={e => set('assigned_user_id', e.target.value)} className={inputCls}>
                                    <option value="">Unassigned</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.name}{u.es_roles?.length ? ` · ${u.es_roles.map(r => r.name).join(', ')}` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {(areas.length > 0 || activities.length > 0) && (
                            <div className="grid grid-cols-2 gap-3">
                                {areas.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 dark:text-slate-200 mb-1">Area of Operation</label>
                                        <select value={form.area_id} onChange={e => set('area_id', e.target.value)} className={inputCls}>
                                            <option value="">None</option>
                                            {areas.map(a => <option key={a.id} value={a.id}>{a.area_name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {activities.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-900 dark:text-slate-200 mb-1">Activity</label>
                                        <select value={form.activity_id} onChange={e => set('activity_id', e.target.value)} className={inputCls}>
                                            <option value="">None</option>
                                            {activities.map(a => <option key={a.id} value={a.id}>{a.activity_name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-slate-200 mb-1">Priority</label>
                                <select value={form.priority} onChange={e => set('priority', e.target.value)} className={inputCls}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-slate-200 mb-1">Due Date</label>
                                <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className={inputCls} />
                            </div>
                        </div>
                    </div>

                    {/* Right: Assignee role panel */}
                    <div className="w-64 flex-shrink-0 border-l border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-5 overflow-y-auto">
                        <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wide mb-3">
                            Assignee Roles
                        </p>
                        {loadingRole ? (
                            <div className="flex justify-center pt-8">
                                <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <AssigneeRolePanel user={selectedUser} roleDetails={assigneeRoles} />
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        className="px-5 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors">
                        {saving ? 'Creating…' : 'Create Task'}
                    </button>
                </div>
            </div>
        </div>
    );
}
