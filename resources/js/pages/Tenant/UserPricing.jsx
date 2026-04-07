import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

/**
 * UserPricing Component
 *
 * Manage per-user subscription pricing overrides.
 * Features: View, create, update, delete overrides, bulk CSV upload, reporting.
 */
const UserPricing = () => {
    const [users, setUsers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [formData, setFormData] = useState({
        plan_id: '',
        monthly_price: '',
        annual_price: '',
        effective_from: '',
        effective_to: '',
    });
    const [report, setReport] = useState(null);
    const [showReport, setShowReport] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchPlans();
        fetchReport();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/tenant/users');
            setUsers(response.data.data || response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load users');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const response = await axios.get('/api/tenant/pricing/plans');
            setPlans(response.data.data || response.data);
        } catch (err) {
            console.error('Error fetching plans:', err);
        }
    };

    const fetchReport = async () => {
        try {
            const response = await axios.get('/api/tenant/pricing/report');
            setReport(response.data);
        } catch (err) {
            console.error('Error fetching report:', err);
        }
    };

    const handleAddOverride = (user) => {
        setSelectedUser(user);
        setFormData({
            plan_id: '',
            monthly_price: '',
            annual_price: '',
            effective_from: '',
            effective_to: '',
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.plan_id || !formData.monthly_price) {
            alert('Please fill in required fields');
            return;
        }

        try {
            await axios.post(`/api/tenant/users/${selectedUser.id}/pricing`, formData);
            alert('Pricing override created successfully');
            setShowForm(false);
            fetchUsers();
            fetchReport();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create override');
            console.error('Error creating override:', err);
        }
    };

    const handleDeleteOverride = async (userId, overrideId) => {
        if (window.confirm('Are you sure you want to remove this pricing override?')) {
            try {
                await axios.delete(`/api/tenant/users/${userId}/pricing/${overrideId}`);
                alert('Override removed successfully');
                fetchUsers();
                fetchReport();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to remove override');
            }
        }
    };

    const handleBulkUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        try {
            await axios.post('/api/tenant/pricing/bulk-upload', formDataUpload, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert('Bulk upload completed successfully');
            setShowBulkUpload(false);
            fetchUsers();
            fetchReport();
        } catch (err) {
            alert(err.response?.data?.message || 'Bulk upload failed');
        }
    };

    if (loading && users.length === 0) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" viewBox="0 0 24 24">
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                    <p className="mt-4 text-gray-600">Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Pricing Management</h1>
                    <p className="text-gray-600 mt-2">Manage per-user subscription pricing overrides</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowReport(!showReport)}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                    >
                        📊 Report
                    </button>
                    <button
                        onClick={() => setShowBulkUpload(true)}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                        ⬆️ Bulk Upload
                    </button>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Report Section */}
            {showReport && report && (
                <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing Overrides Report</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-blue-600 text-sm font-medium">Total Overrides</p>
                            <p className="text-2xl font-bold text-blue-900 mt-2">{report.total_overrides || 0}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-green-600 text-sm font-medium">Total Savings</p>
                            <p className="text-2xl font-bold text-green-900 mt-2">
                                ₹{(report.total_savings || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <p className="text-purple-600 text-sm font-medium">Active Users with Override</p>
                            <p className="text-2xl font-bold text-purple-900 mt-2">{report.users_with_overrides || 0}</p>
                        </div>
                    </div>

                    {report.overrides && report.overrides.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Standard Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Override Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Savings</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {report.overrides.map((override) => (
                                        <tr key={override.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {override.user_name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{override.plan_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                ₹{parseFloat(override.standard_price).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                                ₹{parseFloat(override.override_price).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700">
                                                ₹{(override.standard_price - override.override_price).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Plan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Overrides</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {user.subscription?.plan?.name || 'No Plan'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {user.subscription_overrides && user.subscription_overrides.length > 0 ? (
                                        <div className="space-y-1">
                                            {user.subscription_overrides.map((override) => (
                                                <div key={override.id} className="flex items-center justify-between bg-yellow-50 p-2 rounded text-xs">
                                                    <span>
                                                        {override.plan?.name}: ₹
                                                        {parseFloat(override.monthly_price).toFixed(2)}/mo
                                                    </span>
                                                    <button
                                                        onClick={() => handleDeleteOverride(user.id, override.id)}
                                                        className="text-red-600 hover:text-red-900 font-medium"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-gray-500 text-xs">None</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <button
                                        onClick={() => handleAddOverride(user)}
                                        className="text-blue-600 hover:text-blue-900 font-medium"
                                    >
                                        + Add Override
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Override Form Modal */}
            {showForm && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                Add Pricing Override for {selectedUser.name}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Plan *</label>
                                <select
                                    value={formData.plan_id}
                                    onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                >
                                    <option value="">Select a plan</option>
                                    {plans.map((plan) => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Price (₹) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.monthly_price}
                                    onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Annual Price (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.annual_price}
                                    onChange={(e) => setFormData({ ...formData, annual_price: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="border-t border-gray-200 pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Create Override
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Upload Modal */}
            {showBulkUpload && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                            <h2 className="text-xl font-bold text-gray-900">Bulk Upload Pricing Overrides</h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                                <p className="font-semibold mb-2">CSV Format:</p>
                                <code className="block bg-white p-2 rounded border border-blue-200 text-xs font-mono">
                                    user_email,plan_slug,monthly_price,annual_price
                                </code>
                                <p className="mt-2 text-xs">Example: john@example.com,professional,999,9999</p>
                            </div>

                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleBulkUpload}
                                    className="hidden"
                                    id="csv-upload"
                                />
                                <label htmlFor="csv-upload" className="cursor-pointer">
                                    <p className="text-gray-600 text-sm">Click to select CSV file</p>
                                    <p className="text-gray-400 text-xs mt-1">or drag and drop</p>
                                </label>
                            </div>

                            <button
                                onClick={() => setShowBulkUpload(false)}
                                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserPricing;
