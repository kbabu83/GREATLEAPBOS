import React, { useState } from 'react';
import api from '../../services/api';

/**
 * Create Tenant Form - Super Admin Only
 * Creates a new tenant account with admin user
 * Skips email verification automatically
 */
export default function CreateTenant() {
    const [formData, setFormData] = useState({
        company_name: '',
        admin_name: '',
        admin_email: '',
        admin_password: '',
        slug: '',
        plan: 'free',
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        // Auto-generate slug from company name
        if (name === 'company_name') {
            const autoSlug = value
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .substring(0, 50);
            setFormData(prev => ({
                ...prev,
                slug: autoSlug,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(null);
        setError(null);

        try {
            const response = await api.post('/tenants', formData);

            setSuccess({
                message: response.data.message,
                tenant: response.data.tenant,
                admin: response.data.admin,
                login_url: response.data.login_url,
            });

            // Reset form
            setFormData({
                company_name: '',
                admin_name: '',
                admin_email: '',
                admin_password: '',
                slug: '',
                plan: 'free',
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.errors ||
                'Failed to create tenant'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-slate-950 dark:to-slate-900 p-6">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        ➕ Create New Tenant Account
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-slate-400">
                        Set up a new organization with admin credentials (email verification skipped)
                    </p>
                </div>

                {/* Success Alert */}
                {success && (
                    <div className="mb-8 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-3">
                            ✅ {success.message}
                        </h3>
                        <div className="space-y-2 text-green-800 dark:text-green-200 text-sm mb-4">
                            <p><strong>Organization:</strong> {success.tenant.name}</p>
                            <p><strong>Domain:</strong> {success.tenant.domains[0]?.domain}</p>
                            <p><strong>Admin:</strong> {success.admin.name} ({success.admin.email})</p>
                            <p><strong>Plan:</strong> {success.tenant.plan.toUpperCase()}</p>
                        </div>
                        <p className="text-sm text-green-800 dark:text-green-200">
                            Admin can now login at <code className="bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded">{success.login_url}</code>
                        </p>
                        <button
                            onClick={() => setSuccess(null)}
                            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                        >
                            Create Another
                        </button>
                    </div>
                )}

                {/* Error Alert */}
                {error && (
                    <div className="mb-8 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
                            ❌ Error
                        </h3>
                        <p className="text-red-800 dark:text-red-200">
                            {typeof error === 'string' ? error : JSON.stringify(error)}
                        </p>
                    </div>
                )}

                {/* Form */}
                {!success ? (
                    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8">
                        {/* Company Information */}
                        <div className="mb-8 pb-8 border-b border-gray-200 dark:border-slate-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                                🏢 Company Information
                            </h2>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="company_name"
                                        value={formData.company_name}
                                        onChange={handleChange}
                                        placeholder="e.g., Acme Corporation"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Organization Slug (URL-friendly) *
                                    </label>
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleChange}
                                        placeholder="auto-generated from company name"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white outline-none"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                        Will be used in domain: {formData.slug || 'slug'}.greatlap.local
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Subscription Plan *
                                    </label>
                                    <select
                                        name="plan"
                                        value={formData.plan}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white outline-none"
                                    >
                                        <option value="free">Free - Limited features</option>
                                        <option value="starter">Starter - Basic features</option>
                                        <option value="professional">Professional - Most features</option>
                                        <option value="enterprise">Enterprise - All features</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Admin User Information */}
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                                👤 Admin User Information
                            </h2>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Admin Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="admin_name"
                                        value={formData.admin_name}
                                        onChange={handleChange}
                                        placeholder="e.g., John Smith"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Admin Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="admin_email"
                                        value={formData.admin_email}
                                        onChange={handleChange}
                                        placeholder="e.g., admin@company.com"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white outline-none"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                        ✓ Email verification will be skipped (auto-verified)
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                        Admin Password *
                                    </label>
                                    <input
                                        type="password"
                                        name="admin_password"
                                        value={formData.admin_password}
                                        onChange={handleChange}
                                        placeholder="Minimum 8 characters"
                                        required
                                        minLength={8}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white outline-none"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                        At least 8 characters recommended
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
                            >
                                {loading ? '⏳ Creating...' : '✨ Create Tenant Account'}
                            </button>
                        </div>

                        {/* Info Box */}
                        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                            <p className="text-sm text-blue-900 dark:text-blue-300">
                                <strong>ℹ️ Note:</strong> This creates a complete tenant account with admin user. Email verification is automatically skipped. The admin can login immediately at the login page.
                            </p>
                        </div>
                    </form>
                ) : null}
            </div>
        </div>
    );
}
