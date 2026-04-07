import React, { useState, useEffect } from 'react';
import api from '../../services/api';

/**
 * FeatureGate Component - Conditionally render content based on user features
 *
 * Usage:
 * <FeatureGate feature="advanced-analytics">
 *     <AnalyticsDashboard />
 * </FeatureGate>
 *
 * With fallback:
 * <FeatureGate feature="advanced-analytics" fallback={<UpgradePrompt />}>
 *     <AnalyticsDashboard />
 * </FeatureGate>
 */
export default function FeatureGate({ feature, fallback, children }) {
    const [hasFeature, setHasFeature] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.post(`/user/features/${feature}/check`)
            .then(res => {
                setHasFeature(res.data.has_feature);
                setLoading(false);
            })
            .catch(() => {
                setHasFeature(false);
                setLoading(false);
            });
    }, [feature]);

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 mb-2">
                    <svg className="w-4 h-4 text-blue-600 spinner" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400">Checking access...</p>
            </div>
        );
    }

    if (!hasFeature) {
        return fallback || <FeatureUnavailable feature={feature} />;
    }

    return children;
}

/**
 * Default fallback component
 */
function FeatureUnavailable({ feature }) {
    return (
        <div className="p-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg">
            <div className="text-center">
                <p className="text-xl font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                    🔒 Feature Not Available
                </p>
                <p className="text-yellow-800 dark:text-yellow-300 mb-4">
                    The feature "<strong>{feature}</strong>" is not included in your current plan.
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                    💳 Upgrade Plan
                </button>
            </div>
        </div>
    );
}
