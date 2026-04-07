import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ExclamationCircleIcon, CheckCircleIcon, TrashIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * Plans Manager - Create, Edit, Delete Plans with Features
 * Features can be assigned via drag-and-drop
 */
const PlansManager = () => {
    const [plans, setPlans] = useState([]);
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [activeTab, setActiveTab] = useState('cards'); // 'cards' or 'table'

    // Feature assignment modal state
    const [showFeatureModal, setShowFeatureModal] = useState(false);
    const [selectedPlanForFeatures, setSelectedPlanForFeatures] = useState(null);
    const [availableFeatures, setAvailableFeatures] = useState([]);
    const [assignedFeatures, setAssignedFeatures] = useState([]);
    const [draggedFeature, setDraggedFeature] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        per_user_price: '',
        max_users: '',
        is_active: true,
    });

    useEffect(() => {
        fetchPlans();
        fetchFeatures();
        fetchStatistics();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await api.get('/plans');
            const plansData = response.data.data || response.data;
            setPlans(Array.isArray(plansData) ? plansData : []);
        } catch (err) {
            setError('Failed to load plans');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchFeatures = async () => {
        try {
            const response = await api.get('/features?active_only=true');
            const featuresData = response.data.data || response.data;
            setFeatures(Array.isArray(featuresData) ? featuresData : []);
        } catch (err) {
            console.error('Failed to load features:', err);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await api.get('/plans/admin/statistics');
            setStatistics(response.data);
        } catch (err) {
            console.error('Failed to load statistics:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.slug || formData.per_user_price === '') {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const dataToSend = {
                ...formData,
                per_user_price: parseFloat(formData.per_user_price),
                max_users: formData.max_users ? parseInt(formData.max_users) : null,
            };

            if (editingPlan) {
                await api.put(`/plans/${editingPlan.id}`, dataToSend);
                setSuccess('Plan updated successfully');
            } else {
                await api.post('/plans', dataToSend);
                setSuccess('Plan created successfully');
            }

            setShowForm(false);
            setEditingPlan(null);
            resetForm();
            fetchPlans();
            fetchStatistics();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save plan');
        }
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            slug: plan.slug,
            description: plan.description || '',
            per_user_price: plan.per_user_price,
            max_users: plan.max_users || '',
            is_active: plan.is_active,
        });
        setShowForm(true);
    };

    const handleDelete = async (planId) => {
        if (window.confirm('Are you sure you want to delete this plan?')) {
            try {
                await api.delete(`/plans/${planId}`);
                setSuccess('Plan deleted successfully');
                fetchPlans();
                fetchStatistics();
                setTimeout(() => setSuccess(null), 3000);
            } catch (err) {
                setError('Failed to delete plan');
            }
        }
    };

    const openFeatureManager = (plan) => {
        setSelectedPlanForFeatures(plan);
        setAssignedFeatures(plan.features || []);

        // Get unassigned features
        const assignedIds = (plan.features || []).map(f => f.id);
        setAvailableFeatures(features.filter(f => !assignedIds.includes(f.id)));

        setShowFeatureModal(true);
    };

    const saveFeatures = async () => {
        if (!selectedPlanForFeatures) return;

        try {
            const featureIds = assignedFeatures.map(f => f.id);
            await api.post(`/plans/${selectedPlanForFeatures.id}/features/set`, {
                feature_ids: featureIds,
            });

            setSuccess('Plan features updated successfully');
            setShowFeatureModal(false);
            setSelectedPlanForFeatures(null);
            fetchPlans();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to update features');
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingPlan(null);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            description: '',
            per_user_price: '',
            max_users: '',
            is_active: true,
        });
    };

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    // Drag and drop handlers
    const handleDragStart = (e, feature, source) => {
        setDraggedFeature({ feature, source }); // 'available' or 'assigned'
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDropToAssigned = (e) => {
        e.preventDefault();
        if (draggedFeature?.source === 'available') {
            const feature = draggedFeature.feature;
            if (!assignedFeatures.find(f => f.id === feature.id)) {
                setAssignedFeatures([...assignedFeatures, feature]);
                setAvailableFeatures(availableFeatures.filter(f => f.id !== feature.id));
            }
        }
        setDraggedFeature(null);
    };

    const handleDropToAvailable = (e) => {
        e.preventDefault();
        if (draggedFeature?.source === 'assigned') {
            const feature = draggedFeature.feature;
            setAvailableFeatures([...availableFeatures, feature]);
            setAssignedFeatures(assignedFeatures.filter(f => f.id !== feature.id));
        }
        setDraggedFeature(null);
    };

    const removeFeature = (featureId) => {
        const feature = assignedFeatures.find(f => f.id === featureId);
        setAvailableFeatures([...availableFeatures, feature]);
        setAssignedFeatures(assignedFeatures.filter(f => f.id !== featureId));
    };

    if (loading && plans.length === 0) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 text-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-slate-400">Loading plans...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">💳 Plans Manager</h1>
                    <p className="text-gray-600 dark:text-slate-400 mt-2">Create and manage subscription plans with features</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    + New Plan
                </button>
            </div>

            {/* Alerts */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg flex gap-3">
                    <ExclamationCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            {success && (
                <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-lg flex gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-green-700 dark:text-green-300">{success}</p>
                </div>
            )}

            {/* Statistics */}
            {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border-l-4 border-blue-600 dark:border-blue-400">
                        <p className="text-gray-600 dark:text-slate-400 text-sm">Total Plans</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{statistics.total_plans || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border-l-4 border-green-600 dark:border-green-400">
                        <p className="text-gray-600 dark:text-slate-400 text-sm">Active Subscriptions</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{statistics.total_subscriptions || 0}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border-l-4 border-purple-600 dark:border-purple-400">
                        <p className="text-gray-600 dark:text-slate-400 text-sm">Monthly Revenue</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                            ₹{(statistics.monthly_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </p>
                    </div>
                </div>
            )}

            {/* View Toggle */}
            <div className="flex gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-200 dark:border-slate-700 w-fit">
                <button
                    onClick={() => setActiveTab('cards')}
                    className={`px-4 py-2 rounded font-medium transition-colors ${
                        activeTab === 'cards'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                >
                    📇 Card View
                </button>
                <button
                    onClick={() => setActiveTab('table')}
                    className={`px-4 py-2 rounded font-medium transition-colors ${
                        activeTab === 'table'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                >
                    📊 Table View
                </button>
            </div>

            {/* Plans Grid - Card View */}
            {activeTab === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className="bg-white dark:bg-slate-900 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col"
                        >
                            {/* Plan Header */}
                            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                                        <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">Slug: {plan.slug}</p>
                                    </div>
                                    {plan.is_active && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                                            Active
                                        </span>
                                    )}
                                </div>

                                {plan.description && (
                                    <p className="text-xs text-gray-600 dark:text-slate-400 mb-4">{plan.description}</p>
                                )}

                                {/* Pricing */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-800 rounded">
                                        <span className="text-sm text-gray-600 dark:text-slate-400">Per-User Price</span>
                                        <span className="font-bold text-gray-900 dark:text-white">₹{parseFloat(plan.per_user_price).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-800 rounded">
                                        <span className="text-sm text-gray-600 dark:text-slate-400">Max Users</span>
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {plan.max_users ? `${plan.max_users} users` : 'Unlimited'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex-1">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Features ({(plan.features || []).length})</p>
                                {plan.features && plan.features.length > 0 ? (
                                    <div className="space-y-2">
                                        {plan.features.slice(0, 4).map((feature) => (
                                            <div key={feature.id} className="flex items-center gap-2">
                                                <span className="text-lg">{feature.icon || '✓'}</span>
                                                <span className="text-xs text-gray-700 dark:text-slate-300">{feature.name}</span>
                                            </div>
                                        ))}
                                        {plan.features.length > 4 && (
                                            <p className="text-xs text-gray-500 dark:text-slate-500 italic">
                                                +{plan.features.length - 4} more features
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500 dark:text-slate-500 italic">No features assigned</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-4 bg-gray-50 dark:bg-slate-800 flex gap-2">
                                <button
                                    onClick={() => openFeatureManager(plan)}
                                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded font-medium hover:bg-blue-700 transition-colors text-sm"
                                >
                                    🎯 Features
                                </button>
                                <button
                                    onClick={() => handleEdit(plan)}
                                    className="flex-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 py-2 px-3 rounded font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm"
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(plan.id)}
                                    className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 py-2 px-3 rounded font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Plans Table - Table View */}
            {activeTab === 'table' && (
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Plan</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Price/User</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Max Users</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Features</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {plans.map((plan) => (
                                <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{plan.name}</p>
                                            <p className="text-xs text-gray-600 dark:text-slate-400">{plan.slug}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                                        ₹{parseFloat(plan.per_user_price).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">
                                        {plan.max_users ? `${plan.max_users} users` : 'Unlimited'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">
                                        {(plan.features || []).length} features
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                            plan.is_active
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                                        }`}>
                                            {plan.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openFeatureManager(plan)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors text-sm"
                                                title="Manage Features"
                                            >
                                                🎯
                                            </button>
                                            <button
                                                onClick={() => handleEdit(plan)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                title="Edit Plan"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(plan.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                title="Delete Plan"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {plans.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-600 dark:text-slate-400">No plans found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Plan Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full">
                        <div className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                            </h2>
                            <button
                                onClick={handleCancel}
                                className="text-gray-500 hover:text-gray-700 dark:hover:text-slate-300 text-2xl font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Plan Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, name: e.target.value });
                                        if (!editingPlan) {
                                            setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                                        }
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Professional"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Slug *</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., professional"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="Plan description..."
                                    rows="2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Per-User Price (₹) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.per_user_price}
                                    onChange={(e) => setFormData({ ...formData, per_user_price: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="199.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Max Users (Leave blank for unlimited)</label>
                                <input
                                    type="number"
                                    value={formData.max_users}
                                    onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="5"
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-slate-600"
                                />
                                <label className="ml-3 block text-sm font-medium text-gray-700 dark:text-slate-300">Active</label>
                            </div>

                            <div className="border-t border-gray-200 dark:border-slate-700 pt-4 flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                >
                                    {editingPlan ? 'Update' : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Feature Assignment Modal */}
            {showFeatureModal && selectedPlanForFeatures && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center sticky top-0">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Manage Features - {selectedPlanForFeatures.name}
                            </h2>
                            <button
                                onClick={() => setShowFeatureModal(false)}
                                className="text-gray-500 hover:text-gray-700 dark:hover:text-slate-300 text-2xl font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                {/* Available Features */}
                                <div
                                    onDragOver={handleDragOver}
                                    onDrop={handleDropToAssigned}
                                    className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4 min-h-96 bg-gray-50 dark:bg-slate-800/50"
                                >
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">📦 Available Features</h3>
                                    <p className="text-xs text-gray-600 dark:text-slate-400 mb-4">Drag features here to remove from plan</p>
                                    <div className="space-y-2">
                                        {availableFeatures.length === 0 ? (
                                            <p className="text-sm text-gray-500 dark:text-slate-500 italic">All features assigned</p>
                                        ) : (
                                            availableFeatures.map((feature) => (
                                                <div
                                                    key={feature.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, feature, 'available')}
                                                    className="p-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded cursor-move hover:shadow-md transition-all hover:bg-gray-50 dark:hover:bg-slate-600"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{feature.icon || '✓'}</span>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{feature.name}</p>
                                                            <p className="text-xs text-gray-600 dark:text-slate-400">{feature.category}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Assigned Features */}
                                <div
                                    onDragOver={handleDragOver}
                                    onDrop={handleDropToAvailable}
                                    className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-4 min-h-96 bg-blue-50 dark:bg-blue-900/20"
                                >
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">✅ Plan Features ({assignedFeatures.length})</h3>
                                    <p className="text-xs text-gray-600 dark:text-slate-400 mb-4">Drag features here to add to plan</p>
                                    <div className="space-y-2">
                                        {assignedFeatures.length === 0 ? (
                                            <p className="text-sm text-gray-500 dark:text-slate-500 italic">No features assigned yet</p>
                                        ) : (
                                            assignedFeatures.map((feature) => (
                                                <div
                                                    key={feature.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, feature, 'assigned')}
                                                    className="p-3 bg-white dark:bg-slate-700 border border-blue-200 dark:border-blue-600 rounded cursor-move hover:shadow-md transition-all bg-blue-50 dark:bg-slate-600 flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <span className="text-lg">{feature.icon || '✓'}</span>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{feature.name}</p>
                                                            <p className="text-xs text-gray-600 dark:text-slate-400">{feature.category}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFeature(feature.id)}
                                                        className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                                        title="Remove Feature"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="border-t border-gray-200 dark:border-slate-700 pt-4 flex gap-3">
                                <button
                                    onClick={saveFeatures}
                                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                >
                                    💾 Save Features
                                </button>
                                <button
                                    onClick={() => setShowFeatureModal(false)}
                                    className="flex-1 bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-200 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlansManager;
