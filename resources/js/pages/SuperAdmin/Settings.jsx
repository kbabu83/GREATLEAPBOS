import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

/**
 * Settings Management Page - Super Admin
 *
 * Configure Razorpay, Email (AWS SES), and other application settings
 */
const Settings = () => {
    const [activeSection, setActiveSection] = useState('razorpay');
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [formData, setFormData] = useState({});

    const sections = {
        razorpay: {
            title: 'Razorpay Payment Gateway',
            description: 'Configure Razorpay credentials for payment processing',
            icon: '💳',
        },
        email: {
            title: 'Email Configuration (AWS SES)',
            description: 'Configure AWS SES for sending transactional emails',
            icon: '📧',
        },
        general: {
            title: 'General Settings',
            description: 'General application settings',
            icon: '⚙️',
        },
    };

    // Load settings
    useEffect(() => {
        fetchSettings();
    }, []);

    // Update form when active section changes
    useEffect(() => {
        if (settings[activeSection]) {
            const sectionData = {};
            settings[activeSection].forEach(setting => {
                sectionData[setting.key] = setting.value || '';
            });
            setFormData(sectionData);
        }
    }, [activeSection, settings]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/settings');
            console.log('Settings response:', response.data);

            // Handle the response structure
            const settingsData = response.data.settings || response.data || {};

            // Ensure each section is an array
            const normalizedSettings = {};
            Object.keys(settingsData).forEach(key => {
                normalizedSettings[key] = Array.isArray(settingsData[key])
                    ? settingsData[key]
                    : [];
            });

            setSettings(normalizedSettings);
        } catch (err) {
            setError('Failed to load settings');
            console.error('Settings fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            [key]: value,
        }));
        setError(null);
        setSuccess(null);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const settingsToUpdate = Object.entries(formData).map(([key, value]) => ({
                key,
                value,
            }));

            await api.put('/settings', {
                settings: settingsToUpdate,
            });

            setSuccess('Settings saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
            fetchSettings();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const seedDefaults = async () => {
        try {
            setSaving(true);
            await api.post('/settings/seed');
            setSuccess('Default settings created!');
            fetchSettings();
        } catch (err) {
            setError('Failed to seed settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-slate-400">Loading settings...</p>
                </div>
            </div>
        );
    }

    const currentSectionSettings = Array.isArray(settings[activeSection])
        ? settings[activeSection]
        : [];

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        ⚙️ Settings
                    </h1>
                    <p className="text-gray-600 dark:text-slate-400">
                        Manage application configuration, payment gateway, and email settings
                    </p>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg flex gap-3">
                        <ExclamationCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 rounded-lg flex gap-3">
                        <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-green-700 dark:text-green-300">{success}</p>
                    </div>
                )}

                <div className="grid grid-cols-12 gap-8">
                    {/* Sidebar Navigation */}
                    <div className="col-span-3">
                        <div className="sticky top-8 space-y-2">
                            {Object.entries(sections).map(([key, section]) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveSection(key)}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                                        activeSection === key
                                            ? 'bg-blue-500/10 border-l-4 border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800/50'
                                    }`}
                                >
                                    <div className="font-medium">{section.icon} {section.title}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="col-span-9">
                        <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700/50 p-8">
                            {/* Section Header */}
                            <div className="mb-8 pb-6 border-b border-gray-200 dark:border-slate-700">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    {sections[activeSection]?.title}
                                </h2>
                                <p className="text-gray-600 dark:text-slate-400">
                                    {sections[activeSection]?.description}
                                </p>
                            </div>

                            {/* Settings Form */}
                            <form className="space-y-6">
                                {currentSectionSettings.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-gray-600 dark:text-slate-400 mb-4">
                                            No settings found for this section
                                        </p>
                                        <button
                                            type="button"
                                            onClick={seedDefaults}
                                            disabled={saving}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                        >
                                            {saving ? 'Creating...' : 'Create Default Settings'}
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {currentSectionSettings.map(setting => (
                                            <div key={setting.key}>
                                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                                    {setting.label}
                                                    {setting.type === 'password' && ' (Encrypted)'}
                                                </label>
                                                {setting.description && (
                                                    <p className="text-xs text-gray-600 dark:text-slate-400 mb-2">
                                                        {setting.description}
                                                    </p>
                                                )}
                                                {setting.type === 'password' ? (
                                                    <input
                                                        type="password"
                                                        value={formData[setting.key] || ''}
                                                        onChange={(e) => handleChange(setting.key, e.target.value)}
                                                        placeholder={setting.is_encrypted ? '••••••••' : 'Enter value'}
                                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                                    />
                                                ) : setting.type === 'boolean' ? (
                                                    <select
                                                        value={formData[setting.key] || 'false'}
                                                        onChange={(e) => handleChange(setting.key, e.target.value)}
                                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                                    >
                                                        <option value="true">Enabled</option>
                                                        <option value="false">Disabled</option>
                                                    </select>
                                                ) : (
                                                    <input
                                                        type={setting.type === 'number' ? 'number' : 'text'}
                                                        value={formData[setting.key] || ''}
                                                        onChange={(e) => handleChange(setting.key, e.target.value)}
                                                        className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                                                    />
                                                )}
                                            </div>
                                        ))}

                                        {/* Save Button */}
                                        <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-slate-700">
                                            <button
                                                type="button"
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                                            >
                                                {saving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={fetchSettings}
                                                className="px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                Reset
                                            </button>
                                        </div>
                                    </>
                                )}
                            </form>

                            {/* Info Box */}
                            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg">
                                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                                    🔒 Security Note
                                </h4>
                                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                                    <li>✓ Sensitive values (API keys, secrets) are automatically encrypted in the database</li>
                                    <li>✓ Password fields are never displayed - only shown as masked when editing</li>
                                    <li>✓ All settings are only accessible to Super Admin users</li>
                                    <li>✓ Changes take effect immediately (cached for 1 hour)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
