import React, { useState, useEffect } from 'react';
import api from '../../services/api';

/**
 * Feature Assignment Tool
 * Simple interface to assign features to subscription plans
 */
export default function FeatureAssignment() {
    const [plans, setPlans] = useState([]);
    const [features, setFeatures] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [assignedFeatures, setAssignedFeatures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPlans();
        fetchFeatures();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await api.get('/plans');
            const plansData = response.data.data || response.data;
            setPlans(Array.isArray(plansData) ? plansData : []);
        } catch (err) {
            setError('Failed to load plans');
            console.error(err);
        }
    };

    const fetchFeatures = async () => {
        try {
            const response = await api.get('/features?active_only=true');
            const featuresData = response.data.data || response.data;
            setFeatures(Array.isArray(featuresData) ? featuresData : []);
        } catch (err) {
            setError('Failed to load features');
            console.error(err);
        }
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        // For now, start with empty assigned features
        // In a real scenario, we'd fetch the plan's current features
        setAssignedFeatures([]);
        setSuccess(null);
        setError(null);
    };

    const toggleFeature = (feature) => {
        const isAssigned = assignedFeatures.find(f => f.id === feature.id);

        if (isAssigned) {
            setAssignedFeatures(assignedFeatures.filter(f => f.id !== feature.id));
        } else {
            setAssignedFeatures([...assignedFeatures, feature]);
        }
    };

    const saveAssignment = async () => {
        if (!selectedPlan) {
            setError('Please select a plan first');
            return;
        }

        try {
            setLoading(true);
            const featureIds = assignedFeatures.map(f => f.id);

            await api.post(`/plans/${selectedPlan.id}/features/set`, {
                feature_ids: featureIds,
            });

            setSuccess(`Features for ${selectedPlan.name} updated successfully!`);
            fetchPlans();
            setTimeout(() => setSuccess(null), 4000);
        } catch (err) {
            setError('Failed to save features');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const clearAssignment = () => {
        setAssignedFeatures([]);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        ✨ Feature Assignment Tool
                    </h1>
                    <p className="text-gray-600 dark:text-slate-400">
                        Easily assign features to subscription plans
                    </p>
                </div>

                {/* Alerts */}
                {success && (
                    <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg text-green-700 dark:text-green-300">
                        ✓ {success}
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
                        ✕ {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Plans List */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Plans
                        </h2>
                        <div className="space-y-2">
                            {plans.length === 0 ? (
                                <p className="text-gray-500 dark:text-slate-400 italic">No plans found</p>
                            ) : (
                                plans.map(plan => (
                                    <button
                                        key={plan.id}
                                        onClick={() => handlePlanSelect(plan)}
                                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                            selectedPlan?.id === plan.id
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-300'
                                        }`}
                                    >
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {plan.name}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-slate-400">
                                            ₹{plan.per_user_price}/user
                                        </p>
                                        {plan.max_users && (
                                            <p className="text-xs text-gray-500 dark:text-slate-500">
                                                Max {plan.max_users} users
                                            </p>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Features List */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Available Features
                        </h2>
                        <div className="space-y-2">
                            {features.length === 0 ? (
                                <p className="text-gray-500 dark:text-slate-400 italic">No features found</p>
                            ) : (
                                features.map(feature => (
                                    <button
                                        key={feature.id}
                                        onClick={() => toggleFeature(feature)}
                                        disabled={!selectedPlan}
                                        className={`w-full text-left p-3 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                            assignedFeatures.find(f => f.id === feature.id)
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-green-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">
                                                {assignedFeatures.find(f => f.id === feature.id) ? '✅' : '⬜'}
                                            </span>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                    {feature.icon} {feature.name}
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-slate-400">
                                                    {feature.category}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Assignment Preview & Actions */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Assignment
                        </h2>

                        {!selectedPlan ? (
                            <div className="p-6 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700">
                                <p className="text-gray-600 dark:text-slate-400 text-center">
                                    Select a plan to start assigning features
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                                    <p className="font-semibold text-blue-900 dark:text-blue-300">
                                        {selectedPlan.name}
                                    </p>
                                    <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                                        {assignedFeatures.length} feature{assignedFeatures.length !== 1 ? 's' : ''} assigned
                                    </p>
                                </div>

                                {/* Assigned Features List */}
                                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                                    <p className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
                                        Selected Features:
                                    </p>
                                    {assignedFeatures.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-slate-400 italic">
                                            No features selected
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {assignedFeatures.map(feature => (
                                                <div
                                                    key={feature.id}
                                                    className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-700"
                                                >
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {feature.icon} {feature.name}
                                                    </span>
                                                    <button
                                                        onClick={() => toggleFeature(feature)}
                                                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                    <button
                                        onClick={saveAssignment}
                                        disabled={loading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
                                    >
                                        {loading ? 'Saving...' : '💾 Save Assignment'}
                                    </button>
                                    <button
                                        onClick={clearAssignment}
                                        className="w-full bg-gray-300 dark:bg-slate-700 hover:bg-gray-400 dark:hover:bg-slate-600 text-gray-900 dark:text-white font-semibold py-2 rounded-lg transition-colors"
                                    >
                                        Clear Selection
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-300">
                        <strong>ℹ️ How to use:</strong> Select a plan from the left, click features to assign/unassign them, then click "Save Assignment" to apply the changes.
                    </p>
                </div>
            </div>
        </div>
    );
}
