import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ExclamationCircleIcon, CheckCircleIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

/**
 * Features Manager - Create, Edit, Delete Features
 * Features are building blocks that can be assigned to different subscription plans
 */
const FeaturesManager = () => {
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingFeature, setEditingFeature] = useState(null);
    const [filterModule, setFilterModule] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        module: 'task_module',
        category: 'basic',
        icon: '📝',
        description: '',
        is_active: true,
    });

    const modules = ['task_module', 'payroll_module', 'hr_module', 'finance_module'];
    const categories = ['basic', 'advanced', 'enterprise'];

    useEffect(() => {
        fetchFeatures();
    }, [filterModule, filterCategory, searchTerm]);

    const fetchFeatures = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filterModule) params.append('module', filterModule);
            if (filterCategory) params.append('category', filterCategory);
            if (searchTerm) params.append('search', searchTerm);

            const response = await api.get(`/features?${params}`);
            setFeatures(response.data.data || response.data);
        } catch (err) {
            setError('Failed to load features');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.slug || !formData.module) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            if (editingFeature) {
                await api.put(`/features/${editingFeature.id}`, formData);
                setSuccess('Feature updated successfully');
            } else {
                await api.post('/features', formData);
                setSuccess('Feature created successfully');
            }

            setShowForm(false);
            setEditingFeature(null);
            resetForm();
            fetchFeatures();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save feature');
        }
    };

    const handleEdit = (feature) => {
        setEditingFeature(feature);
        setFormData({
            name: feature.name,
            slug: feature.slug,
            module: feature.module,
            category: feature.category,
            icon: feature.icon,
            description: feature.description,
            is_active: feature.is_active,
        });
        setShowForm(true);
    };

    const handleDelete = async (featureId) => {
        if (window.confirm('Are you sure you want to delete this feature?')) {
            try {
                await api.delete(`/features/${featureId}`);
                setSuccess('Feature deleted successfully');
                fetchFeatures();
                setTimeout(() => setSuccess(null), 3000);
            } catch (err) {
                setError('Failed to delete feature');
            }
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingFeature(null);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            module: 'task_module',
            category: 'basic',
            icon: '📝',
            description: '',
            is_active: true,
        });
    };

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    if (loading && features.length === 0) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 text-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-slate-400">Loading features...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📦 Features Manager</h1>
                    <p className="text-gray-600 dark:text-slate-400 mt-2">Create and manage features that can be assigned to plans</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    + New Feature
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

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Search</label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search features..."
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Module</label>
                        <select
                            value={filterModule}
                            onChange={(e) => setFilterModule(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Modules</option>
                            {modules.map(mod => (
                                <option key={mod} value={mod}>{mod}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Category</label>
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Features Table */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Feature</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Module</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Category</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                        {features.map((feature) => (
                            <tr key={feature.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{feature.icon}</span>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{feature.name}</p>
                                            <p className="text-xs text-gray-600 dark:text-slate-400">{feature.slug}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">{feature.module}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                        feature.category === 'basic' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
                                        feature.category === 'advanced' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200' :
                                        'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
                                    }`}>
                                        {feature.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                        feature.is_active
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                                    }`}>
                                        {feature.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(feature)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(feature.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {features.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-slate-400">No features found</p>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full">
                        <div className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingFeature ? 'Edit Feature' : 'Create New Feature'}
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Feature Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, name: e.target.value });
                                        if (!editingFeature) {
                                            setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                                        }
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Create Task"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Slug *</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., create-task"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Module *</label>
                                <select
                                    value={formData.module}
                                    onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                >
                                    {modules.map(mod => (
                                        <option key={mod} value={mod}>{mod}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Icon</label>
                                    <input
                                        type="text"
                                        value={formData.icon}
                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-center text-xl"
                                        maxLength="2"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="Feature description..."
                                    rows="3"
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
                                    {editingFeature ? 'Update' : 'Create'}
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
        </div>
    );
};

export default FeaturesManager;
