import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../../components/UI/Modal';
import Pagination from '../../components/UI/Pagination';
import { RoleBadge } from '../../components/UI/Badge';
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

const ROLES = ['super_admin', 'tenant_admin', 'staff'];
const roleLabels = { super_admin: 'Super Admin', tenant_admin: 'Tenant Admin', staff: 'Staff' };

export default function CentralUsersPage() {
    const [users, setUsers] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: '', role: '', page: 1 });
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff', is_active: true });
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: filters.page };
            if (filters.search) params.search = filters.search;
            if (filters.role) params.role = filters.role;
            const res = await api.get('/users', { params });
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
        setForm({ name: '', email: '', password: '', role: 'staff', is_active: true });
        setFormErrors({});
        setShowModal(true);
    };

    const openEdit = (user) => {
        setEditUser(user);
        setForm({ name: user.name, email: user.email, password: '', role: user.role, is_active: user.is_active });
        setFormErrors({});
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormErrors({});
        try {
            const payload = { name: form.name, email: form.email, role: form.role, is_active: form.is_active };
            if (!editUser || form.password) payload.password = form.password;

            if (editUser) {
                await api.put(`/users/${editUser.id}`, payload);
            } else {
                await api.post('/users', { ...payload, password: form.password });
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
            await api.delete(`/users/${id}`);
            setDeleteConfirm(null);
            fetchUsers();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between page-header">
                <div>
                    <h1 className="page-title">Users</h1>
                    <p className="page-subtitle">Manage central platform users</p>
                </div>
                <button onClick={openCreate} className="btn-primary gap-2">
                    <PlusIcon /> New User
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-4">
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-48">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2"><SearchIcon /></span>
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                            placeholder="Search users..."
                            className="form-input pl-9"
                        />
                    </div>
                    <select
                        value={filters.role}
                        onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
                        className="form-input w-44"
                    >
                        <option value="">All roles</option>
                        {ROLES.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="table-container bg-white shadow-card">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <svg className="w-8 h-8 text-primary spinner" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Last Login</th>
                                    <th>Joined</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center text-gray-400 py-12">No users found</td>
                                    </tr>
                                ) : users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white font-semibold text-sm">{user.name.charAt(0)}</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.name}</p>
                                                    <p className="text-xs text-gray-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td><RoleBadge role={user.role} /></td>
                                        <td>
                                            <span className={`badge ${user.is_active ? 'badge-active' : 'badge-inactive'}`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="text-gray-400 text-sm">
                                            {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="text-gray-400 text-sm">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"><EditIcon /></button>
                                                <button onClick={() => setDeleteConfirm(user)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><TrashIcon /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <Pagination meta={meta} onPageChange={(page) => setFilters({ ...filters, page })} />
                    </>
                )}
            </div>

            {/* Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editUser ? 'Edit User' : 'New User'}
                footer={
                    <>
                        <button onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="btn-primary">
                            {saving ? 'Saving...' : editUser ? 'Save changes' : 'Create user'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="form-label">Full name</label>
                        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" required />
                        {formErrors.name && <p className="form-error">{formErrors.name[0]}</p>}
                    </div>
                    <div>
                        <label className="form-label">Email</label>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-input" required />
                        {formErrors.email && <p className="form-error">{formErrors.email[0]}</p>}
                    </div>
                    <div>
                        <label className="form-label">{editUser ? 'New password (leave blank to keep current)' : 'Password'}</label>
                        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="form-input" required={!editUser} minLength={8} />
                        {formErrors.password && <p className="form-error">{formErrors.password[0]}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Role</label>
                            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="form-input">
                                {ROLES.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">Status</label>
                            <select value={form.is_active ? 'active' : 'inactive'} onChange={(e) => setForm({ ...form, is_active: e.target.value === 'active' })} className="form-input">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Delete confirm */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete User"
                footer={
                    <>
                        <button onClick={() => setDeleteConfirm(null)} className="btn-outline">Cancel</button>
                        <button onClick={() => handleDelete(deleteConfirm?.id)} className="btn-danger">Delete user</button>
                    </>
                }
            >
                <p className="text-gray-600">
                    Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
                </p>
            </Modal>
        </div>
    );
}
