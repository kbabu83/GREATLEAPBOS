import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        price: '$0/mo',
        features: ['Up to 5 users', '1 GB storage', 'Email support'],
    },
    {
        id: 'starter',
        name: 'Starter',
        price: '$29/mo',
        features: ['Up to 25 users', '10 GB storage', 'Priority support'],
        popular: true,
    },
    {
        id: 'professional',
        name: 'Professional',
        price: '$99/mo',
        features: ['Unlimited users', '100 GB storage', '24/7 support', 'Advanced analytics'],
    },
];

export default function Register() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        tenant_name: '',
        tenant_email: '',
        subdomain: '',
        plan: 'starter',
        admin_name: '',
        admin_email: '',
        admin_password: '',
        admin_password_confirmation: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);

    const centralDomain = window.__APP_CONFIG__?.centralDomain || 'greatlap.local';

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));

        // Auto-generate subdomain from organization name
        if (field === 'tenant_name') {
            const slug = value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            setForm((prev) => ({ ...prev, tenant_name: value, subdomain: slug }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);

        try {
            const response = await api.post('/tenants/register', form);
            setSuccess(response.data);
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
                if (step === 2 && (err.response.data.errors.tenant_name || err.response.data.errors.tenant_email || err.response.data.errors.subdomain || err.response.data.errors.plan)) {
                    setStep(1);
                }
            } else {
                setErrors({ admin_email: [err.response?.data?.message || 'Registration failed.'] });
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
                <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-10 max-w-md w-full text-center">
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
                    <p className="text-gray-500 mb-6">
                        Your organization has been created. Visit your workspace to get started.
                    </p>
                    <a
                        href={success.login_url}
                        className="btn-primary w-full py-2.5 block text-center"
                    >
                        Go to your workspace →
                    </a>
                    <Link to="/login" className="block text-sm text-gray-500 hover:text-primary mt-4">
                        Back to login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-primary to-primary-700 flex-col p-12">
                <div className="flex items-center gap-3 mb-12">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <span className="text-white font-bold text-xl">Great Leap App</span>
                </div>

                <div className="mb-auto">
                    <h2 className="text-3xl font-bold text-white mb-4">Start your journey</h2>
                    <p className="text-white/70">Set up your organization in minutes. No credit card required for free plan.</p>
                </div>

                {/* Steps indicator */}
                <div className="space-y-3">
                    {[
                        { num: 1, label: 'Organization details' },
                        { num: 2, label: 'Admin account' },
                    ].map((s) => (
                        <div key={s.num} className={`flex items-center gap-3 ${s.num <= step ? 'opacity-100' : 'opacity-40'}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold
                                ${s.num < step ? 'bg-secondary text-white' : s.num === step ? 'bg-white text-primary' : 'bg-white/20 text-white'}`}>
                                {s.num < step ? '✓' : s.num}
                            </div>
                            <span className="text-white text-sm">{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 overflow-y-auto flex items-start justify-center p-8 bg-white">
                <div className="w-full max-w-lg pt-4">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {step === 1 ? 'Create your organization' : 'Set up your admin account'}
                        </h1>
                        <p className="text-gray-500 mt-1">Step {step} of 2</p>
                    </div>

                    <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); setStep(2); }}>
                        {step === 1 ? (
                            <div className="space-y-5">
                                <div>
                                    <label className="form-label">Organization name</label>
                                    <input
                                        type="text"
                                        value={form.tenant_name}
                                        onChange={(e) => handleChange('tenant_name', e.target.value)}
                                        className="form-input"
                                        placeholder="Acme Corporation"
                                        required
                                    />
                                    {errors.tenant_name && <p className="form-error">{errors.tenant_name[0]}</p>}
                                </div>

                                <div>
                                    <label className="form-label">Organization email</label>
                                    <input
                                        type="email"
                                        value={form.tenant_email}
                                        onChange={(e) => handleChange('tenant_email', e.target.value)}
                                        className="form-input"
                                        placeholder="contact@yourcompany.com"
                                        required
                                    />
                                    {errors.tenant_email && <p className="form-error">{errors.tenant_email[0]}</p>}
                                </div>

                                <div>
                                    <label className="form-label">Subdomain</label>
                                    <div className="flex rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary overflow-hidden">
                                        <input
                                            type="text"
                                            value={form.subdomain}
                                            onChange={(e) => handleChange('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                            className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                                            placeholder="yourcompany"
                                            required
                                        />
                                        <span className="px-3 py-2.5 bg-gray-50 text-gray-500 text-sm border-l border-gray-300">
                                            .{centralDomain}
                                        </span>
                                    </div>
                                    {errors.subdomain && <p className="form-error">{errors.subdomain[0]}</p>}
                                </div>

                                {/* Plan selection */}
                                <div>
                                    <label className="form-label">Choose a plan</label>
                                    <div className="grid gap-3">
                                        {PLANS.map((plan) => (
                                            <label
                                                key={plan.id}
                                                className={`relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                                                    ${form.plan === plan.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="plan"
                                                    value={plan.id}
                                                    checked={form.plan === plan.id}
                                                    onChange={() => handleChange('plan', plan.id)}
                                                    className="mt-1 accent-primary"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-900">{plan.name}</span>
                                                        {plan.popular && (
                                                            <span className="badge bg-secondary/10 text-secondary">Popular</span>
                                                        )}
                                                        <span className="ml-auto text-sm font-bold text-primary">{plan.price}</span>
                                                    </div>
                                                    <ul className="mt-1 space-y-0.5">
                                                        {plan.features.map((f) => (
                                                            <li key={f} className="text-xs text-gray-500 flex items-center gap-1.5">
                                                                <span className="text-accent">✓</span> {f}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="btn-primary w-full py-2.5">
                                    Continue →
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div>
                                    <label className="form-label">Your full name</label>
                                    <input
                                        type="text"
                                        value={form.admin_name}
                                        onChange={(e) => handleChange('admin_name', e.target.value)}
                                        className="form-input"
                                        placeholder="Jane Smith"
                                        required
                                    />
                                    {errors.admin_name && <p className="form-error">{errors.admin_name[0]}</p>}
                                </div>

                                <div>
                                    <label className="form-label">Your email address</label>
                                    <input
                                        type="email"
                                        value={form.admin_email}
                                        onChange={(e) => handleChange('admin_email', e.target.value)}
                                        className="form-input"
                                        placeholder="jane@yourcompany.com"
                                        required
                                    />
                                    {errors.admin_email && <p className="form-error">{errors.admin_email[0]}</p>}
                                </div>

                                <div>
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        value={form.admin_password}
                                        onChange={(e) => handleChange('admin_password', e.target.value)}
                                        className="form-input"
                                        placeholder="Min. 8 characters"
                                        required
                                        minLength={8}
                                    />
                                    {errors.admin_password && <p className="form-error">{errors.admin_password[0]}</p>}
                                </div>

                                <div>
                                    <label className="form-label">Confirm password</label>
                                    <input
                                        type="password"
                                        value={form.admin_password_confirmation}
                                        onChange={(e) => handleChange('admin_password_confirmation', e.target.value)}
                                        className="form-input"
                                        placeholder="Repeat password"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="btn-outline flex-1 py-2.5"
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary flex-1 py-2.5"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="w-4 h-4 spinner" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Creating...
                                            </span>
                                        ) : 'Create workspace'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
