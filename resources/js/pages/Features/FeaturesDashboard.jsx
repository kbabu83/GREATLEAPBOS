import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useFeatures } from '../../hooks/useFeature';
import FeatureGate from '../../components/Features/FeatureGate';

const FEATURES = [
    {
        slug: 'advanced-analytics',
        name: '📊 Advanced Analytics',
        category: 'Analytics',
        description: 'Access advanced analytics dashboard, data visualization, and custom metrics',
        icon: '📊',
        examples: ['Analytics Dashboard', 'Custom Metrics', 'Data Visualization'],
    },
    {
        slug: 'custom-reports',
        name: '📄 Custom Reports',
        category: 'Analytics',
        description: 'Build custom reports, schedule automated reports, export to PDF/Excel',
        icon: '📄',
        examples: ['Report Builder', 'Scheduled Reports', 'Export to PDF/Excel'],
    },
    {
        slug: 'audit-logs',
        name: '🔍 Audit Logs',
        category: 'Security',
        description: 'Complete activity logs for compliance, user actions, data changes',
        icon: '🔍',
        examples: ['Activity Logs', 'Compliance Reports', 'Data Change Tracking'],
    },
    {
        slug: 'team-collaboration',
        name: '👥 Team Collaboration',
        category: 'Collaboration',
        description: 'Team workspaces, shared tasks, comments, mentions',
        icon: '👥',
        examples: ['Team Workspaces', 'Comments & Mentions', 'Shared Tasks'],
    },
    {
        slug: 'unlimited-users',
        name: '∞ Unlimited Users',
        category: 'Users',
        description: 'Add unlimited team members (free plan limited to 5 users)',
        icon: '∞',
        examples: ['Add Unlimited Users', 'Team Management'],
    },
    {
        slug: 'advanced-permissions',
        name: '🔐 Advanced Permissions',
        category: 'Security',
        description: 'Create custom roles, granular permissions, department-level access control',
        icon: '🔐',
        examples: ['Custom Roles', 'Granular Permissions', 'Department Access Control'],
    },
    {
        slug: 'api-access',
        name: '⚙️ API Access',
        category: 'Integrations',
        description: 'REST API access, webhook support, integration with third-party tools',
        icon: '⚙️',
        examples: ['REST API', 'Webhooks', 'Third-party Integrations'],
    },
    {
        slug: 'sso-integration',
        name: '🔑 SSO Integration',
        category: 'Security',
        description: 'Single Sign-On (SAML, OAuth), enterprise authentication',
        icon: '🔑',
        examples: ['SAML Configuration', 'OAuth Setup', 'Enterprise Auth'],
    },
    {
        slug: 'custom-branding',
        name: '🎨 Custom Branding',
        category: 'Customization',
        description: 'White-label solution, custom domain, branded emails, custom logo',
        icon: '🎨',
        examples: ['White-label Setup', 'Custom Domain', 'Branded Emails'],
    },
    {
        slug: 'mobile-app',
        name: '📱 Mobile App Access',
        category: 'Mobile',
        description: 'Access Great Leap via native mobile apps (iOS & Android)',
        icon: '📱',
        examples: ['iOS App', 'Android App', 'Mobile Features'],
    },
];

export default function FeaturesDashboard() {
    const { features, loading, has } = useFeatures();
    const [expandedFeature, setExpandedFeature] = useState(null);

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 dark:from-slate-950 dark:to-slate-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                        ✨ Your Features
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-slate-400">
                        {loading ? 'Loading your features...' : `You have access to ${features.length} features`}
                    </p>
                </div>

                {loading ? (
                    <LoadingState />
                ) : (
                    <>
                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <StatCard
                                label="Total Features Unlocked"
                                value={features.length}
                                icon="🔓"
                                color="from-blue-500 to-blue-600"
                            />
                            <StatCard
                                label="Features Available"
                                value={FEATURES.length}
                                icon="⭐"
                                color="from-purple-500 to-purple-600"
                            />
                            <StatCard
                                label="Locked Features"
                                value={FEATURES.length - features.length}
                                icon="🔒"
                                color="from-red-500 to-red-600"
                            />
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {FEATURES.map(feature => (
                                <FeatureCard
                                    key={feature.slug}
                                    feature={feature}
                                    isEnabled={has(feature.slug)}
                                    isExpanded={expandedFeature === feature.slug}
                                    onToggle={() =>
                                        setExpandedFeature(
                                            expandedFeature === feature.slug ? null : feature.slug
                                        )
                                    }
                                />
                            ))}
                        </div>

                        {/* Feature Details Section */}
                        {expandedFeature && (
                            <FeatureDetailsModal
                                feature={FEATURES.find(f => f.slug === expandedFeature)}
                                isEnabled={has(expandedFeature)}
                                onClose={() => setExpandedFeature(null)}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ── Components ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }) {
    return (
        <div className={`bg-gradient-to-br ${color} rounded-lg p-6 text-white shadow-lg`}>
            <div className="text-3xl font-bold mb-2">{icon}</div>
            <p className="text-white/80 text-sm mb-1">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    );
}

function FeatureCard({ feature, isEnabled, isExpanded, onToggle }) {
    return (
        <div
            onClick={onToggle}
            className={`cursor-pointer p-6 rounded-lg border-2 transition-all transform hover:scale-105 ${
                isEnabled
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600'
                    : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 opacity-70'
            }`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{feature.icon}</div>
                {isEnabled ? (
                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        ✓ ACTIVE
                    </span>
                ) : (
                    <span className="bg-gray-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                        🔒 LOCKED
                    </span>
                )}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.name}
            </h3>

            <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
                {feature.description}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-slate-700">
                <span className="text-xs font-medium text-gray-500 dark:text-slate-500">
                    {feature.category}
                </span>
                <span className={`text-sm font-semibold ${isExpanded ? 'rotate-180' : ''} transition-transform`}>
                    ▼
                </span>
            </div>
        </div>
    );
}

function FeatureDetailsModal({ feature, isEnabled, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full p-8 max-h-96 overflow-y-auto">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {feature.name}
                        </h2>
                        <p className="text-gray-600 dark:text-slate-400 mt-1">
                            {feature.category}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                    >
                        ✕
                    </button>
                </div>

                <p className="text-gray-700 dark:text-slate-300 mb-6">
                    {feature.description}
                </p>

                {isEnabled ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-600 rounded-lg p-4 mb-6">
                        <p className="text-green-800 dark:text-green-300 font-semibold">
                            ✓ You have access to this feature
                        </p>
                    </div>
                ) : (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-600 rounded-lg p-4 mb-6">
                        <p className="text-yellow-800 dark:text-yellow-300 font-semibold">
                            🔒 This feature is locked in your current plan
                        </p>
                    </div>
                )}

                <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        What you can do:
                    </h4>
                    <ul className="space-y-2">
                        {feature.examples.map((example, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-gray-700 dark:text-slate-300">
                                <span className="text-blue-500">→</span>
                                {example}
                            </li>
                        ))}
                    </ul>
                </div>

                {!isEnabled && (
                    <button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
                        💳 Upgrade to Unlock
                    </button>
                )}

                <button
                    onClick={onClose}
                    className="w-full mt-3 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-900 dark:text-white font-semibold py-2 rounded-lg transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="flex items-center justify-center h-96">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400 spinner" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
                <p className="text-gray-600 dark:text-slate-400">Loading your features...</p>
            </div>
        </div>
    );
}
