import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

/**
 * User Management - Tenant Admin/Staff
 * Create, view, and manage team members
 */
export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        phone: '',
        department: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(null);
    const [resetPasswordModal, setResetPasswordModal] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetError, setResetError] = useState(null);
    const [resetLoading, setResetLoading] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/tenant/users');
            setUsers(response.data.data || []);
            setError(null);
        } catch (err) {
            setError('Failed to load users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(null);

        try {
            const response = await api.post('/tenant/users', formData);
            setSubmitSuccess(response.data.message);

            // Reset form
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'staff',
                phone: '',
                department: '',
            });

            setShowForm(false);

            // Reload users
            await loadUsers();
        } catch (err) {
            setSubmitError(
                err.response?.data?.message ||
                err.response?.data?.errors ||
                'Failed to create user'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetError(null);
        setResetLoading(true);

        try {
            await api.post(`/tenant/users/${resetPasswordModal.id}/reset-password`, {
                new_password: newPassword,
            });
            setResetPasswordModal(null);
            setNewPassword('');
            await loadUsers();
        } catch (err) {
            setResetError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setResetLoading(false);
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            await api.put(`/tenant/users/${user.id}`, {
                is_active: !user.is_active,
            });
            await loadUsers();
        } catch (err) {
            console.error('Failed to toggle user status:', err);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-slate-950 dark:to-slate-900 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                            👥 Team Members Management
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-slate-400">
                            ✨ Manage your organization's users - Enhanced Version
                        </p>
                    </div>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                        >
                            ➕ Add User
                        </button>
                    )}
                </div>

                {/* Create User Form */}
                {showForm && (
                    <div className="mb-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                            ➕ Create New User
                        </h2>

                        {submitError && (
                            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
                                <p className="text-red-800 dark:text-red-200">
                                    {typeof submitError === 'string' ? submitError : JSON.stringify(submitError)}
                                </p>
                            </div>
                        )}

                        {submitSuccess && (
                            <div className="mb-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-4 rounded">
                                <p className="text-green-800 dark:text-green-200">
                                    ✅ {submitSuccess}
                                </p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="John Smith"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white outline-none"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="john@company.com"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white outline-none"
                                    />
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="Minimum 8 characters"
                                        required
                                        minLength={8}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white outline-none"
                                    />
                                </div>

                                {/* Role */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Role *
                                    </label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white outline-none"
                                    >
                                        <option value="staff">Staff Member</option>
                                        <option value="tenant_admin">Admin</option>
                                    </select>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Phone (Optional)
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="+1 (555) 000-0000"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white outline-none"
                                    />
                                </div>

                                {/* Department */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Department (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Sales, Engineering"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white outline-none"
                                    />
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
                                >
                                    {submitting ? '⏳ Creating...' : '✨ Create User'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 bg-gray-300 dark:bg-slate-700 hover:bg-gray-400 dark:hover:bg-slate-600 text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Users List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
                            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400 spinner" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                        <p className="text-gray-600 dark:text-slate-400">Loading users...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6 text-center">
                        <p className="text-red-800 dark:text-red-200">❌ {error}</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-12 text-center">
                        <p className="text-gray-600 dark:text-slate-400 mb-4">No users yet</p>
                        {!showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                            >
                                ➕ Create First User
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 dark:bg-slate-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Name</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Email</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Role</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Department</th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                                                {user.name}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    user.role === 'tenant_admin'
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'
                                                }`}>
                                                    {user.role === 'tenant_admin' ? '👑 Admin' : '👤 Staff'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">
                                                {user.department || '—'}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    user.is_active
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-300'
                                                }`}>
                                                    {user.is_active ? '✅ Active' : '⏸️ Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setResetPasswordModal(user);
                                                            setNewPassword('');
                                                            setResetError(null);
                                                        }}
                                                        className="px-3 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                                        title="Reset Password"
                                                    >
                                                        🔑 Reset
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(user)}
                                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                                            user.is_active
                                                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                                                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                                                        }`}
                                                        title={user.is_active ? 'Deactivate' : 'Activate'}
                                                    >
                                                        {user.is_active ? '🔒 Deactivate' : '✓ Activate'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Reset Password Modal */}
            {resetPasswordModal && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Reset Password: {resetPasswordModal.name}
                            </h2>
                        </div>
                        <form onSubmit={handleResetPassword} className="px-6 py-4 space-y-4">
                            {resetError && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 text-sm text-red-700 dark:text-red-300">
                                    {resetError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    New Password *
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimum 8 characters"
                                    minLength={8}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white outline-none"
                                />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                Enter a new password for this user. The password must be at least 8 characters long.
                            </p>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setResetPasswordModal(null);
                                        setNewPassword('');
                                        setResetError(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetLoading || !newPassword}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                                >
                                    {resetLoading ? '⏳ Resetting...' : '✨ Reset Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
