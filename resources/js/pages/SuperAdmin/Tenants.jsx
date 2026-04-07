import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../../components/UI/Modal';
import Pagination from '../../components/UI/Pagination';
import { StatusBadge, PlanBadge } from '../../components/UI/Badge';
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
function KeyIcon() {
    return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>;
}
function ToggleIcon() {
    return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 4H5a2 2 0 00-2 2v14a2 2 0 002 2h4m0-18v18m0-18l10-3m-10 3l10 3m-10 0h14a2 2 0 012 2v14a2 2 0 01-2 2h-10" /></svg>;
}

const PLANS = ['free', 'starter', 'professional', 'enterprise'];
const STATUSES = ['active', 'inactive', 'suspended', 'trial'];

export default function TenantsPage() {
    const [tenants, setTenants] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: '', status: '', plan: '', page: 1 });
    const [showModal, setShowModal] = useState(false);
    const [editTenant, setEditTenant] = useState(null);
    const [form, setForm] = useState({
        company_name: '',
        admin_name: '',
        admin_email: '',
        admin_password: '',
        plan: 'free',
        status: 'trial',
        name: '',
        email: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [resetPasswordModal, setResetPasswordModal] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetError, setResetError] = useState(null);
    const [resetLoading, setResetLoading] = useState(false);

    const fetchTenants = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: filters.page };
            if (filters.search) params.search = filters.search;
            if (filters.status) params.status = filters.status;
            if (filters.plan) params.plan = filters.plan;

            const res = await api.get('/tenants', { params });
            setTenants(Array.isArray(res.data.data) ? res.data.data : []);
            setMeta(res.data.meta ?? null);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const timer = setTimeout(fetchTenants, filters.search ? 400 : 0);
        return () => clearTimeout(timer);
    }, [fetchTenants]);

    const openCreate = () => {
        setEditTenant(null);
        setForm({
            company_name: '',
            admin_name: '',
            admin_email: '',
            admin_password: '',
            plan: 'free',
            status: 'trial',
            name: '',
            email: ''
        });
        setFormErrors({});
        setShowModal(true);
    };

    const openEdit = (tenant) => {
        setEditTenant(tenant);
        setForm({ name: tenant.name, email: tenant.email, plan: tenant.plan, status: tenant.status, company_name: '', admin_name: '', admin_email: '', admin_password: '' });
        setFormErrors({});
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFormErrors({});

        try {
            if (editTenant) {
                // Edit mode - use basic fields
                await api.put(`/tenants/${editTenant.id}`, {
                    name: form.name,
                    email: form.email,
                    plan: form.plan,
                    status: form.status
                });
            } else {
                // Create mode - use comprehensive fields
                await api.post('/tenants', {
                    company_name: form.company_name,
                    admin_name: form.admin_name,
                    admin_email: form.admin_email,
                    admin_password: form.admin_password,
                    plan: form.plan
                });
            }
            setShowModal(false);
            fetchTenants();
        } catch (err) {
            if (err.response?.data?.errors) setFormErrors(err.response.data.errors);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/tenants/${id}`);
            setDeleteConfirm(null);
            fetchTenants();
        } catch (err) {
            console.error(err);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetError(null);
        setResetLoading(true);

        try {
            await api.post(`/tenants/${resetPasswordModal.id}/reset-password`, {
                new_password: newPassword,
            });
            setResetPasswordModal(null);
            setNewPassword('');
            fetchTenants();
        } catch (err) {
            setResetError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setResetLoading(false);
        }
    };

    const handleToggleStatus = async (tenant) => {
        try {
            await api.post(`/tenants/${tenant.id}/toggle-status`);
            fetchTenants();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between page-header">
                <div>
                    <h1 className="page-title">🏢 Tenants Management</h1>
                    <p className="page-subtitle">✨ Manage all organizations on the platform - Updated Version</p>
                </div>
                <button onClick={openCreate} className="btn-primary gap-2">
                    <PlusIcon /> New Tenant
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
                            placeholder="Search tenants..."
                            className="form-input pl-9"
                        />
                    </div>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                        className="form-input w-40"
                    >
                        <option value="">All statuses</option>
                        {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                    <select
                        value={filters.plan}
                        onChange={(e) => setFilters({ ...filters, plan: e.target.value, page: 1 })}
                        className="form-input w-40"
                    >
                        <option value="">All plans</option>
                        {PLANS.map((p) => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
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
                                    <th>Organization</th>
                                    <th>Domain</th>
                                    <th>Plan</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center text-gray-400 py-12">No tenants found</td>
                                    </tr>
                                ) : tenants.map((tenant) => (
                                    <tr key={tenant.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-primary font-bold text-sm">{tenant.name.charAt(0)}</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{tenant.name}</p>
                                                    <p className="text-xs text-gray-400">{tenant.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="font-mono text-xs text-gray-500">{tenant.domain}</td>
                                        <td><PlanBadge plan={tenant.plan} /></td>
                                        <td><StatusBadge status={tenant.status} /></td>
                                        <td className="text-gray-400 text-sm">
                                            {new Date(tenant.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => openEdit(tenant)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                                    title="Edit"
                                                >
                                                    <EditIcon />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setResetPasswordModal(tenant);
                                                        setNewPassword('');
                                                        setResetError(null);
                                                    }}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    title="Reset Password"
                                                >
                                                    <KeyIcon />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(tenant)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                                                    title="Toggle Status"
                                                >
                                                    <ToggleIcon />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(tenant)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Delete"
                                                >
                                                    <TrashIcon />
                                                </button>
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

            {/* Create/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editTenant ? '✏️ Edit Tenant Details' : '✨ Create New Tenant Account'}
                footer={
                    <>
                        <button onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
                        <button onClick={handleSave} disabled={saving} className="btn-primary">
                            {saving ? 'Saving...' : editTenant ? 'Save changes' : 'Create tenant'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSave} className="space-y-5">
                    {!editTenant && (
                        <>
                            {/* Organization Information */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">🏢 Organization Information</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="form-label">Company Name *</label>
                                        <input type="text" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} placeholder="e.g., Acme Corporation" className="form-input" required />
                                        {formErrors.company_name && <p className="form-error">{formErrors.company_name[0]}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Admin User Information */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">👤 Admin User Information</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="form-label">Admin Full Name *</label>
                                        <input type="text" value={form.admin_name} onChange={(e) => setForm({ ...form, admin_name: e.target.value })} placeholder="e.g., John Smith" className="form-input" required />
                                        {formErrors.admin_name && <p className="form-error">{formErrors.admin_name[0]}</p>}
                                    </div>
                                    <div>
                                        <label className="form-label">Admin Email *</label>
                                        <input type="email" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} placeholder="e.g., admin@company.com" className="form-input" required />
                                        <p className="text-xs text-gray-400 mt-1">✓ Email verification will be automatically skipped</p>
                                        {formErrors.admin_email && <p className="form-error">{formErrors.admin_email[0]}</p>}
                                    </div>
                                    <div>
                                        <label className="form-label">Admin Password *</label>
                                        <input type="password" value={form.admin_password} onChange={(e) => setForm({ ...form, admin_password: e.target.value })} placeholder="Minimum 8 characters" minLength={8} className="form-input" required />
                                        {formErrors.admin_password && <p className="form-error">{formErrors.admin_password[0]}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Plan Selection */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">📦 Subscription Plan</h3>
                                <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className="form-input w-full">
                                    {PLANS.map((p) => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                                </select>
                                {formErrors.plan && <p className="form-error">{formErrors.plan[0]}</p>}
                            </div>
                        </>
                    )}

                    {editTenant && (
                        <>
                            <div>
                                <label className="form-label">Organization name</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" required />
                                {formErrors.name && <p className="form-error">{formErrors.name[0]}</p>}
                            </div>
                            <div>
                                <label className="form-label">Email</label>
                                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-input" required />
                                {formErrors.email && <p className="form-error">{formErrors.email[0]}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Plan</label>
                                    <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className="form-input">
                                        {PLANS.map((p) => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Status</label>
                                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="form-input">
                                        {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                    </select>
                                </div>
                            </div>
                        </>
                    )}
                </form>
            </Modal>

            {/* Reset Password Modal */}
            <Modal
                isOpen={!!resetPasswordModal}
                onClose={() => {
                    setResetPasswordModal(null);
                    setNewPassword('');
                    setResetError(null);
                }}
                title={`Reset Admin Password: ${resetPasswordModal?.name}`}
                footer={
                    <>
                        <button
                            onClick={() => {
                                setResetPasswordModal(null);
                                setNewPassword('');
                                setResetError(null);
                            }}
                            className="btn-outline"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleResetPassword}
                            disabled={resetLoading || !newPassword}
                            className="btn-primary"
                        >
                            {resetLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleResetPassword} className="space-y-4">
                    {resetError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                            {resetError}
                        </div>
                    )}
                    <div>
                        <label className="form-label">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minimum 8 characters"
                            minLength={8}
                            required
                            className="form-input"
                        />
                    </div>
                    <p className="text-sm text-gray-500">
                        Enter a new password for the admin user. The password must be at least 8 characters long.
                    </p>
                </form>
            </Modal>

            {/* Delete confirmation modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Tenant"
                footer={
                    <>
                        <button onClick={() => setDeleteConfirm(null)} className="btn-outline">Cancel</button>
                        <button onClick={() => handleDelete(deleteConfirm?.id)} className="btn-danger">Delete tenant</button>
                    </>
                }
            >
                <p className="text-gray-600">
                    Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This will permanently delete the tenant database and all associated data. This action cannot be undone.
                </p>
            </Modal>
        </div>
    );
}
