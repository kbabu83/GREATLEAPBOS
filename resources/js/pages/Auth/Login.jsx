import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const isTenant = window.__APP_CONFIG__?.isTenant ?? false;
    const tenantName = window.__APP_CONFIG__?.tenantName;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);

        try {
            await login(form.email, form.password);
            navigate('/app/dashboard');
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setErrors({ email: [err.response?.data?.message || 'Login failed. Please try again.'] });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left panel - branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary-700 flex-col justify-between p-12">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <span className="text-white font-bold text-xl">
                        {isTenant ? tenantName : 'Great Leap App'}
                    </span>
                </div>

                <div>
                    <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                        Welcome back to<br />your workspace
                    </h2>
                    <p className="text-white/70 text-lg">
                        {isTenant
                            ? 'Sign in to manage your team and resources.'
                            : 'Sign in to the admin console to manage tenants and users.'}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Uptime', value: '99.9%' },
                        { label: 'Tenants', value: '500+' },
                        { label: 'Users', value: '10K+' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                            <p className="text-white font-bold text-2xl">{stat.value}</p>
                            <p className="text-white/60 text-sm">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel - login form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <span className="font-bold text-primary text-lg">Great Leap App</span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
                        <p className="text-gray-500 mt-1">
                            {isTenant ? `Sign in to ${tenantName}` : 'Enter your credentials to continue'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="form-label">Email address</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="form-input"
                                placeholder="you@example.com"
                                required
                                autoComplete="email"
                            />
                            {errors.email && <p className="form-error">{errors.email[0]}</p>}
                        </div>

                        <div>
                            <label className="form-label">Password</label>
                            <input
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="form-input"
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                            />
                            {errors.password && <p className="form-error">{errors.password[0]}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-2.5"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4 spinner" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Signing in...
                                </span>
                            ) : 'Sign in'}
                        </button>
                    </form>

                    {!isTenant && (
                        <p className="text-center text-sm text-gray-500 mt-6">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-primary font-medium hover:underline">
                                Create your company
                            </Link>
                        </p>
                    )}

                    {/* Demo credentials */}
                    <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-xs font-medium text-gray-600 mb-2">Demo credentials</p>
                        {isTenant ? (
                            <p className="text-xs text-gray-500">
                                Email: <span className="font-mono text-gray-700">admin@{window.__APP_CONFIG__?.tenantId}.com</span><br />
                                Password: <span className="font-mono text-gray-700">password</span>
                            </p>
                        ) : (
                            <p className="text-xs text-gray-500">
                                Email: <span className="font-mono text-gray-700">admin@greatleap.app</span><br />
                                Password: <span className="font-mono text-gray-700">password</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
