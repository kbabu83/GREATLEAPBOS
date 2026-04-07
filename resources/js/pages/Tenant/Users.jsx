import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../../components/UI/Modal';
import Pagination from '../../components/UI/Pagination';
import { RoleBadge } from '../../components/UI/Badge';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

function PlusIcon() {
    return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function SearchIcon() {
    return <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" /></svg>;
}
function TrashIcon() {
    return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}
function EditIcon() {
    return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
}

const ROLES = ['tenant_admin', 'staff'];
const roleLabels = { tenant_admin: 'Tenant Admin', staff: 'Staff' };

export default function TenantUsersPage() {
    const { user: currentUser, isTenantAdmin } = useAuth();
    const [users, setUsers]           = useState([]);
    const [esRoles, setEsRoles]       = useState([]);
    const [meta, setMeta]             = useState(null);
    const [loading, setLoading]       = useState(true);
    const [filters, setFilters]       = useState({ search: '', role: '', page: 1 });
    const [showModal, setShowModal]   = useState(false);
    const [editUser, setEditUser]     = useState(null);
    const [form, setForm]             = useState({
        name: '', email: '', password: '', role: 'staff',
        phone: '', department: '', es_role_ids: [], is_active: true,
    });
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving]         = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Load ES roles once for the dropdown
    useEffect(() => {
        api.get('/tenant/execution/roles').then(res => setEsRoles(res.data || [])).catch(() => {});
    }, []);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: filters.page };
            if (filters.search) params.search = filters.search;
            if (filters.role)   params.role   = filters.role;
            const res = await api.get('/tenant/users', { params });
            setUsers(Array.isArray(res.data.data) ? res.data.data : []);
            setMeta(res.data.meta ?? null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const timer = setTimeout(fetchUsers, filters.search ? 400 : 0);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const openCreate = () => {
        setEditUser(null);
        setForm({ name: '', email: '', password: '', role: 'staff', phone: '', department: '', es_role_ids: [], is_active: true });
        setFormErrors({});
        setShowModal(true);
    };

    const openEdit = (user) => {
        setEditUser(user);
        setForm({
            name:        user.name,
            email:       user.email,
            password:    '',
            role:        user.role,
            phone:       user.phone      || '',
            department:  user.department || '',
            es_role_ids: (user.es_roles || []).map(r => r.id),
            is_active:   user.is_active,
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormErrors({});
        try {
            const payload = {
                name:        form.name,
                email:       form.email,
                role:        form.role,
                phone:       form.phone,
                department:  form.department,
                es_role_ids: form.es_role_ids,
                is_active:   form.is_active,
            };
            if (!editUser || form.password) payload.password = form.password;

            if (editUser) {
                await api.put(`/tenant/users/${editUser.id}`, payload);
            } else {
                await api.post('/tenant/users', payload);
            }
            setShowModal(false);
            fetchUsers();
        } catch (err) {
            if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/tenant/users/${id}`);
            setDeleteConfirm(null);
            fetchUsers();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6 fade-in min-h-screen">
            <div className="flex items-center justify-between page-header">
                <div>
                    <h1 className="page-title text-white">Users</h1>
                    <p className="page-subtitle text-slate-400">Manage team members and their execution roles</p>
                </div>
                {isTenantAdmin && (
                    <button onClick={openCreate} className="btn-primary gap-2 bg-teal-600 hover:bg-teal-700">
                        <PlusIcon /> Add User
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-card p-4">
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-48">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2"><SearchIcon /></span>
                        <input
                            type="text"
                            value={filters.search}
                            onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
                            placeholder="Search users..."
                            className="form-input pl-9 bg-slate-900/50 border-slate-600 text-white"
                        />
                    </div>
                    <select
                        value={filters.role}
                        onChange={e => setFilters({ ...filters, role: e.target.value, page: 1 })}
                        className="form-input w-44 bg-slate-900/50 border-slate-600 text-white"
                    >
                        <option value="">All roles</option>
                        {ROLES.map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="table-container bg-slate-800/50 shadow-card border border-slate-700/50">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <svg className="w-8 h-8 text-teal-600 spinner" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr className="border-b border-slate-700/50 bg-slate-700/30">
                                    <th className="text-slate-400">User</th>
                                    <th className="text-slate-400">System Role</th>
                                    <th className="text-slate-400">Execution Role</th>
                                    <th className="text-slate-400">Department</th>
                                    <th className="text-slate-400">Status</th>
                                    <th className="text-slate-400">Last Login</th>
                                    {isTenantAdmin && <th className="text-right text-slate-400">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={isTenantAdmin ? 7 : 6} className="text-center text-slate-500 py-12">No users found</td>
                                    </tr>
                                ) : users.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-700/20 transition-colors">
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-teal-600/20 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-teal-400 font-semibold text-sm">{user.name.charAt(0)}</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white flex items-center gap-2">
                                                        {user.name}
                                                        {user.id === currentUser?.id && (
                                                            <span className="badge bg-teal-600/20 text-teal-400 text-xs">You</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td><RoleBadge role={user.role} /></td>
                                        <td>
                                            {user.es_roles?.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {user.es_roles.map(r => (
                                                        <span key={r.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-900/30 text-teal-400 border border-teal-700/50">
                                                            {r.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-slate-500 text-sm">—</span>
                                            )}
                                        </td>
                                        <td className="text-slate-400 text-sm">{user.department || '—'}</td>
                                        <td>
                                            <span className={`badge ${user.is_active ? 'bg-green-900/30 text-green-400 border border-green-700/50' : 'bg-slate-700/30 text-slate-400 border border-slate-600/50'}`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="text-slate-500 text-sm">
                                            {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : '—'}
                                        </td>
                                        {isTenantAdmin && (
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-teal-600/10 transition-colors"><EditIcon /></button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(user)}
                                                        disabled={user.id === currentUser?.id}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-600/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Pagination meta={meta} onPageChange={page => setFilters({ ...filters, page })} />
                    </>
                )}
            </div>

            {/* Create / Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editUser ? 'Edit User' : 'Add User'}
                footer={
                    <>
                        <button onClick={() => setShowModal(false)} className="btn-outline border-slate-600 text-slate-300 hover:bg-slate-700/30">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="btn-primary bg-teal-600 hover:bg-teal-700">
                            {saving ? 'Saving...' : editUser ? 'Save Changes' : 'Add User'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="form-label text-slate-300">Full Name</label>
                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="form-input bg-slate-900/50 border-slate-600 text-white" required />
                            {formErrors.name && <p className="form-error text-red-400">{formErrors.name[0]}</p>}
                        </div>
                        <div className="col-span-2">
                            <label className="form-label text-slate-300">Email</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="form-input bg-slate-900/50 border-slate-600 text-white" required />
                            {formErrors.email && <p className="form-error text-red-400">{formErrors.email[0]}</p>}
                        </div>
                        <div className="col-span-2">
                            <label className="form-label text-slate-300">{editUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
                            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="form-input bg-slate-900/50 border-slate-600 text-white" required={!editUser} minLength={8} />
                            {formErrors.password && <p className="form-error text-red-400">{formErrors.password[0]}</p>}
                        </div>
                        <div>
                            <label className="form-label text-slate-300">System Role</label>
                            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="form-input bg-slate-900/50 border-slate-600 text-white">
                                {ROLES.map(r => <option key={r} value={r}>{roleLabels[r]}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label text-slate-300">Status</label>
                            <select value={form.is_active ? 'active' : 'inactive'} onChange={e => setForm({ ...form, is_active: e.target.value === 'active' })} className="form-input bg-slate-900/50 border-slate-600 text-white">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        {/* Execution Roles — multi-select */}
                        <div className="col-span-2">
                            <label className="form-label text-slate-300">Execution Roles</label>
                            {esRoles.length === 0 ? (
                                <p className="text-sm text-slate-500">No roles defined yet.</p>
                            ) : (
                                <div className="border border-slate-700/50 bg-slate-900/30 rounded-lg divide-y divide-slate-700/30 max-h-44 overflow-y-auto">
                                    {esRoles.map(r => {
                                        const checked = form.es_role_ids.includes(r.id);
                                        return (
                                            <label key={r.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/20 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => {
                                                        const ids = checked
                                                            ? form.es_role_ids.filter(id => id !== r.id)
                                                            : [...form.es_role_ids, r.id];
                                                        setForm({ ...form, es_role_ids: ids });
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-600 text-teal-600 focus:ring-teal-500"
                                                />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-200">{r.name}</p>
                                                    {r.purpose && <p className="text-xs text-slate-500 truncate max-w-xs">{r.purpose}</p>}
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                            <p className="text-xs text-slate-500 mt-1">A person can hold multiple execution roles</p>
                        </div>
                        <div>
                            <label className="form-label text-slate-300">Phone</label>
                            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="form-input bg-slate-900/50 border-slate-600 text-white" placeholder="+1 (555) 000-0000" />
                        </div>
                        <div>
                            <label className="form-label text-slate-300">Department</label>
                            <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="form-input bg-slate-900/50 border-slate-600 text-white" placeholder="Engineering" />
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Delete confirm */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Remove User"
                footer={
                    <>
                        <button onClick={() => setDeleteConfirm(null)} className="btn-outline border-slate-600 text-slate-300 hover:bg-slate-700/30">Cancel</button>
                        <button onClick={() => handleDelete(deleteConfirm?.id)} className="btn-danger bg-red-600 hover:bg-red-700">Remove User</button>
                    </>
                }
            >
                <p className="text-slate-300">
                    Are you sure you want to remove <strong>{deleteConfirm?.name}</strong>?
                </p>
            </Modal>
        </div>
    );
}
