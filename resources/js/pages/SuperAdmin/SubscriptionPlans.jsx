import React, { useState, useEffect } from 'react';
import api from '../../services/api';

/**
 * SubscriptionPlans Component
 *
 * Admin interface for managing subscription plans.
 * Features: CRUD operations, feature management, statistics.
 */
const SubscriptionPlans = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        monthly_price: '',
        annual_price: '',
        is_active: true,
        features: {},
    });
    const [newFeatureKey, setNewFeatureKey] = useState('');
    const [newFeatureValue, setNewFeatureValue] = useState('');

    useEffect(() => {
        fetchPlans();
        fetchStatistics();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await api.get('/plans');
            setPlans(response.data.data || response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load plans');
            console.error('Error fetching plans:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await api.get('/plans/admin/statistics');
            setStatistics(response.data);
        } catch (err) {
            console.error('Error fetching statistics:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.slug || !formData.monthly_price) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            // Convert features object to JSON string for API
            const dataToSend = {
                ...formData,
                features: Object.keys(formData.features).length > 0
                    ? JSON.stringify(formData.features)
                    : null,
            };

            if (editingPlan) {
                await api.put(`/plans/${editingPlan.id}`, dataToSend);
                alert('Plan updated successfully');
            } else {
                await api.post('/plans', dataToSend);
                alert('Plan created successfully');
            }

            setShowForm(false);
            setEditingPlan(null);
            setFormData({
                name: '',
                slug: '',
                monthly_price: '',
                annual_price: '',
                is_active: true,
                features: {},
            });
            setNewFeatureKey('');
            setNewFeatureValue('');
            fetchPlans();
            fetchStatistics();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save plan');
            console.error('Error saving plan:', err);
        }
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);

        // Parse features - handle both JSON string and object formats
        let features = {};
        if (plan.features) {
            if (typeof plan.features === 'string') {
                try {
                    features = JSON.parse(plan.features);
                } catch (e) {
                    features = {};
                }
            } else if (typeof plan.features === 'object') {
                features = plan.features;
            }
        }

        setFormData({
            name: plan.name,
            slug: plan.slug,
            monthly_price: plan.monthly_price,
            annual_price: plan.annual_price,
            is_active: plan.is_active,
            features: features,
        });
        setNewFeatureKey('');
        setNewFeatureValue('');
        setShowForm(true);
    };

    const handleDelete = async (planId) => {
        if (window.confirm('Are you sure you want to delete this plan?')) {
            try {
                await api.delete(`/plans/${planId}`);
                alert('Plan deleted successfully');
                fetchPlans();
                fetchStatistics();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete plan');
            }
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingPlan(null);
        setFormData({
            name: '',
            slug: '',
            monthly_price: '',
            annual_price: '',
            is_active: true,
            features: {},
        });
        setNewFeatureKey('');
        setNewFeatureValue('');
    };

    const addFeature = () => {
        if (newFeatureKey.trim() && newFeatureValue.trim()) {
            setFormData(prev => ({
                ...prev,
                features: {
                    ...prev.features,
                    [newFeatureKey]: newFeatureValue,
                },
            }));
            setNewFeatureKey('');
            setNewFeatureValue('');
        }
    };

    const removeFeature = (key) => {
        setFormData(prev => {
            const updatedFeatures = { ...prev.features };
            delete updatedFeatures[key];
            return {
                ...prev,
                features: updatedFeatures,
            };
        });
    };

    if (loading && plans.length === 0) {
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
                    <p className="mt-4 text-gray-600">Loading plans...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
                    <p className="text-gray-600 mt-2">Manage your subscription plans and pricing</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    + New Plan
                </button>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Statistics */}
            {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-600">
                        <p className="text-gray-600 text-sm">Total Plans</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.total_plans || 0}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-600">
                        <p className="text-gray-600 text-sm">Active Subscriptions</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.total_subscriptions || 0}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-600">
                        <p className="text-gray-600 text-sm">Monthly Revenue</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                            ₹{(statistics.monthly_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            )}

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                    <p className="text-sm text-gray-600 mt-1">Slug: {plan.slug}</p>
                                </div>
                                {!plan.deleted_at && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Active
                                    </span>
                                )}
                                {plan.deleted_at && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        Archived
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3 my-4">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                    <span className="text-gray-600">Monthly Price</span>
                                    <span className="font-semibold text-gray-900">₹{parseFloat(plan.monthly_price).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                    <span className="text-gray-600">Annual Price</span>
                                    <span className="font-semibold text-gray-900">
                                        ₹{plan.annual_price ? parseFloat(plan.annual_price).toFixed(2) : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {(plan.plan_features?.length > 0 || plan.features) && (
                                <div className="mb-4">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Features:</p>
                                    <ul className="space-y-1 text-sm text-gray-600">
                                        {/* Show features from JSON field */}
                                        {plan.features && Object.entries(
                                            typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features
                                        ).slice(0, 3).map(([key, value], idx) => (
                                            <li key={`json-${idx}`} className="flex items-center">
                                                <span className="text-green-600 mr-2">✓</span>
                                                {key}: {String(value)}
                                            </li>
                                        ))}
                                        {/* Show features from plan_features table */}
                                        {plan.plan_features && plan.plan_features.slice(0, 3).map((feature, idx) => (
                                            <li key={`db-${idx}`} className="flex items-center">
                                                <span className="text-green-600 mr-2">✓</span>
                                                {feature.feature_key}
                                            </li>
                                        ))}
                                        {/* Show count of additional features */}
                                        {(plan.plan_features?.length || 0) + Object.keys(
                                            plan.features && typeof plan.features === 'string'
                                                ? JSON.parse(plan.features)
                                                : plan.features || {}
                                        ).length > 3 && (
                                            <li className="text-gray-500 italic">
                                                +{(plan.plan_features?.length || 0) + Object.keys(
                                                    plan.features && typeof plan.features === 'string'
                                                        ? JSON.parse(plan.features)
                                                        : plan.features || {}
                                                ).length - 3} more features
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            <div className="border-t border-gray-200 pt-4 flex gap-2">
                                <button
                                    onClick={() => handleEdit(plan)}
                                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded font-medium hover:bg-blue-700 transition-colors text-sm"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(plan.id)}
                                    className="flex-1 bg-red-600 text-white py-2 px-3 rounded font-medium hover:bg-red-700 transition-colors text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                            </h2>
                            <button
                                onClick={handleCancel}
                                className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    placeholder="e.g., Professional"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Slug *</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    placeholder="e.g., professional"
                                />
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

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300 rounded"
                                />
                                <label className="ml-3 block text-sm font-medium text-gray-700">Active</label>
                            </div>

                            {/* Features Section */}
                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Features</h3>

                                {/* Current Features List */}
                                <div className="mb-4 max-h-40 overflow-y-auto space-y-2">
                                    {Object.entries(formData.features || {}).map(([key, value]) => (
                                        <div
                                            key={key}
                                            className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200"
                                        >
                                            <div className="text-sm">
                                                <span className="font-medium text-gray-900">{key}</span>
                                                <span className="text-gray-600 ml-2">: {String(value)}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFeature(key)}
                                                className="text-red-600 hover:text-red-700 font-medium text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Feature Form */}
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={newFeatureKey}
                                        onChange={(e) => setNewFeatureKey(e.target.value)}
                                        placeholder="Feature name (e.g., users, storage)"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={newFeatureValue}
                                        onChange={(e) => setNewFeatureValue(e.target.value)}
                                        placeholder="Feature value (e.g., Unlimited, 10 GB)"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    />
                                    <button
                                        type="button"
                                        onClick={addFeature}
                                        className="w-full bg-green-600 text-white py-2 px-3 rounded font-medium hover:bg-green-700 transition-colors text-sm"
                                    >
                                        + Add Feature
                                    </button>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                >
                                    {editingPlan ? 'Update' : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionPlans;
