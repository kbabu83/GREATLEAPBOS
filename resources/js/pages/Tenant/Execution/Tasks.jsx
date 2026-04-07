import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { CreateTaskModal } from './CreateTaskModal';

const PRIORITY_META = {
    urgent: { label: 'Urgent',  cls: 'bg-red-900/30 text-red-400 border border-red-700/50' },
    high:   { label: 'High',    cls: 'bg-orange-900/30 text-orange-400 border border-orange-700/50' },
    medium: { label: 'Medium',  cls: 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50' },
    low:    { label: 'Low',     cls: 'bg-slate-700/30 text-slate-400 border border-slate-600/50' },
};
const STATUS_META = {
    pending:     { label: 'Pending',     cls: 'bg-slate-700/30 text-slate-400 border border-slate-600/50' },
    in_progress: { label: 'In Progress', cls: 'bg-teal-900/30 text-teal-400 border border-teal-700/50' },
    completed:   { label: 'Completed',   cls: 'bg-green-900/30 text-green-400 border border-green-700/50' },
    cancelled:   { label: 'Cancelled',   cls: 'bg-slate-700/30 text-slate-400 border border-slate-600/50' },
};

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';

function Badge({ label, cls }) {
    return <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${cls}`}>{label}</span>;
}

const taskNum = id => `#TASK-${String(id).padStart(4, '0')}`;

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TasksPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [tasks, setTasks]     = useState([]);
    const [meta, setMeta]       = useState({});
    const [roles, setRoles]     = useState([]);
    const [users, setUsers]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage]       = useState(1);
    const [filter, setFilter]   = useState({ status: '', role_id: '', priority: '', assigned_to: '' });
    const [showCreate, setShowCreate] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, per_page: 20 });
            if (filter.status)      params.set('status',      filter.status);
            if (filter.role_id)     params.set('role_id',     filter.role_id);
            if (filter.priority)    params.set('priority',    filter.priority);
            if (filter.assigned_to) params.set('assigned_to', filter.assigned_to);

            const [tasksRes, rolesRes, usersRes] = await Promise.all([
                api.get(`/tenant/execution/tasks?${params}`),
                api.get('/tenant/execution/roles'),
                api.get('/tenant/users?per_page=100'),
            ]);
            setTasks(tasksRes.data.data || []);
            setMeta(tasksRes.data.meta || {});
            setRoles(rolesRes.data || []);
            setUsers(usersRes.data.data || usersRes.data || []);
        } catch {
            //
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => { load(); }, [load]);

    const setF = (k, v) => { setFilter(f => ({ ...f, [k]: v })); setPage(1); };

    return (
        <div className="p-6 max-w-6xl mx-auto min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-white">Tasks</h1>
                    <p className="text-sm text-slate-400 mt-0.5">All tasks across roles and team members</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => navigate('/app/execution/tasks/my')}
                        className="px-4 py-2 text-sm border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/50">
                        My Tasks
                    </button>
                    <button onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        New Task
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
                <select value={filter.status} onChange={e => setF('status', e.target.value)}
                    className="border border-slate-600 bg-slate-900/50 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">All Status</option>
                    {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={filter.role_id} onChange={e => setF('role_id', e.target.value)}
                    className="border border-slate-600 bg-slate-900/50 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">All Roles</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <select value={filter.priority} onChange={e => setF('priority', e.target.value)}
                    className="border border-slate-600 bg-slate-900/50 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">All Priority</option>
                    {Object.entries(PRIORITY_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={filter.assigned_to} onChange={e => setF('assigned_to', e.target.value)}
                    className="border border-slate-600 bg-slate-900/50 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="">All Members</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                {Object.values(filter).some(Boolean) && (
                    <button onClick={() => { setFilter({ status: '', role_id: '', priority: '', assigned_to: '' }); setPage(1); }}
                        className="px-3 py-1.5 text-xs border border-slate-600 text-slate-400 rounded-lg hover:bg-slate-700/30">
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full" />
                </div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-16 bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-700/50">
                    <div className="text-4xl mb-3">📋</div>
                    <h3 className="text-lg font-semibold text-slate-300">No tasks found</h3>
                    <p className="text-sm text-slate-400 mt-1">Try adjusting filters or create a new task</p>
                </div>
            ) : (
                <>
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-700/30 border-b border-slate-700/50">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide w-10">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Task</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Role</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Assigned</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Priority</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Due</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {tasks.map((task, index) => {
                                    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !['completed','cancelled'].includes(task.status);
                                    const serial = (page - 1) * 20 + index + 1;
                                    return (
                                        <tr key={task.id} className="hover:bg-slate-700/20 transition-colors">
                                            <td className="px-4 py-3 text-xs text-slate-500 font-medium">{serial}</td>
                                            <td className="px-4 py-3">
                                                <button onClick={() => navigate(`/app/execution/tasks/${task.id}`)}
                                                    className="text-sm font-medium text-white hover:text-teal-400 text-left line-clamp-1 max-w-xs">
                                                    {task.title}
                                                </button>
                                                <p className="text-xs text-teal-400 font-mono mt-0.5">{taskNum(task.id)}</p>
                                                {task.area?.area_name && (
                                                    <p className="text-xs text-slate-500 mt-0.5">{task.area.area_name}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-300">{task.role?.name || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-300">
                                                {task.assigned_user?.name || <span className="text-slate-500 italic">Unassigned</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge label={PRIORITY_META[task.priority]?.label || task.priority} cls={PRIORITY_META[task.priority]?.cls || ''} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge label={STATUS_META[task.status]?.label || task.status} cls={STATUS_META[task.status]?.cls || ''} />
                                            </td>
                                            <td className={`px-4 py-3 text-sm font-medium ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                                                {fmtDate(task.due_date)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button onClick={() => navigate(`/app/execution/tasks/${task.id}`)}
                                                    className="text-xs text-teal-400 hover:text-teal-300 font-medium whitespace-nowrap">
                                                    View →
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {meta.last_page > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="px-3 py-1.5 text-sm border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/30 disabled:opacity-50">← Prev</button>
                            <span className="px-3 py-1.5 text-sm text-slate-400">Page {page} of {meta.last_page}</span>
                            <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={page === meta.last_page}
                                className="px-3 py-1.5 text-sm border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700/30 disabled:opacity-50">Next →</button>
                        </div>
                    )}
                </>
            )}

            <CreateTaskModal
                open={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={() => load()}
                roles={roles}
                users={users}
            />
        </div>
    );
}
