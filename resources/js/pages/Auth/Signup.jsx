import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRightIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import RazorpayCheckout from '../../components/Payments/RazorpayCheckout';

/**
 * Company Signup Page
 *
 * Registration flow:
 * 1. Company details
 * 2. Admin user details
 * 3. Choose plan
 * 4. Confirmation
 */
const Signup = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [paymentInitiated, setPaymentInitiated] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [invoiceId, setInvoiceId] = useState(null);

    const [formData, setFormData] = useState({
        tenant_name: '',
        tenant_email: '',
        admin_name: '',
        admin_email: '',
        admin_password: '',
        admin_password_confirmation: '',
        plan: 'free',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError(null);
    };

    const validateStep = (currentStep) => {
        setError(null);

        if (currentStep === 1) {
            if (!formData.tenant_name) {
                setError('Company name is required');
                return false;
            }
            if (!formData.tenant_email) {
                setError('Company email is required');
                return false;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.tenant_email)) {
                setError('Please enter a valid email');
                return false;
            }
            return true;
        }

        if (currentStep === 2) {
            if (!formData.admin_name) {
                setError('Admin name is required');
                return false;
            }
            if (!formData.admin_email) {
                setError('Admin email is required');
                return false;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
                setError('Please enter a valid email');
                return false;
            }
            if (!formData.admin_password) {
                setError('Password is required');
                return false;
            }
            if (formData.admin_password.length < 8) {
                setError('Password must be at least 8 characters');
                return false;
            }
            if (formData.admin_password !== formData.admin_password_confirmation) {
                setError('Passwords do not match');
                return false;
            }
            return true;
        }

        return true;
    };

    const handleNextStep = () => {
        if (validateStep(step)) {
            setStep(step + 1);
        }
    };

    const handlePrevStep = () => {
        setStep(step - 1);
        setError(null);
    };

    const initiatePayment = async () => {
        setLoading(true);
        setError(null);

        try {
            // Get plan price from server
            const planResponse = await axios.get(`/api/plans/${formData.plan}`);
            const planAmount = planResponse.data.monthly_price;

            // Create order on server
            const orderResponse = await axios.post('/api/tenant/payments/initiate', {
                amount: planAmount,
                plan: formData.plan,
                email: formData.tenant_email,
                name: formData.tenant_name,
            });

            setOrderId(orderResponse.data.orderId);
            setInvoiceId(orderResponse.data.invoiceId);
            setPaymentInitiated(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initiate payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = async (paymentData) => {
        setLoading(true);
        setError(null);

        try {
            // Register tenant with payment ID
            const response = await axios.post('/api/tenants/register', {
                tenant_name: formData.tenant_name,
                tenant_email: formData.tenant_email,
                admin_name: formData.admin_name,
                admin_email: formData.admin_email,
                admin_password: formData.admin_password,
                admin_password_confirmation: formData.admin_password_confirmation,
                plan: formData.plan,
                razorpay_payment_id: paymentData.razorpay_payment_id,
                razorpay_order_id: paymentData.razorpay_order_id,
                razorpay_signature: paymentData.razorpay_signature,
            });

            // Store token
            localStorage.setItem('auth_token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('tenant_id', response.data.tenant_id);

            // Show success
            setStep(5);

            // Redirect after 3 seconds
            setTimeout(() => {
                navigate(`/app/dashboard`);
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
            setPaymentInitiated(false);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentFailure = () => {
        setError('Payment failed. Please try again.');
        setPaymentInitiated(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateStep(step)) {
            return;
        }

        // If free plan, register directly
        if (formData.plan === 'free') {
            setLoading(true);
            setError(null);

            try {
                const response = await axios.post('/api/tenants/register', {
                    tenant_name: formData.tenant_name,
                    tenant_email: formData.tenant_email,
                    admin_name: formData.admin_name,
                    admin_email: formData.admin_email,
                    admin_password: formData.admin_password,
                    admin_password_confirmation: formData.admin_password_confirmation,
                    plan: formData.plan,
                });

                // Store token
                localStorage.setItem('auth_token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                localStorage.setItem('tenant_id', response.data.tenant_id);

                // Show success
                setStep(5);

                // Redirect after 3 seconds
                setTimeout(() => {
                    navigate(`/app/dashboard`);
                }, 3000);
            } catch (err) {
                setError(err.response?.data?.message || 'Registration failed. Please try again.');
            } finally {
                setLoading(false);
            }
        } else {
            // For paid plans, initiate payment
            await initiatePayment();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-block text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                        GREAT LEAP
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">Create Your Company</h1>
                    <p className="text-slate-400">Set up your account in just a few minutes</p>
                </div>

                {/* Progress Indicator */}
                <div className="mb-8 flex justify-between items-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <React.Fragment key={s}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition ${
                                step >= s
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                                    : 'bg-slate-700 text-slate-400'
                            }`}>
                                {s === 5 ? '✓' : s}
                            </div>
                            {s < 5 && (
                                <div className={`flex-1 h-1 mx-1 rounded transition ${
                                    step > s ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-slate-700'
                                }`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Form Card */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 backdrop-blur">
                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-3">
                            <ExclamationCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Company Details */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-white mb-6">Company Details</h2>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="tenant_name"
                                        value={formData.tenant_name}
                                        onChange={handleChange}
                                        placeholder="Acme Corp"
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Company Email *
                                    </label>
                                    <input
                                        type="email"
                                        name="tenant_email"
                                        value={formData.tenant_email}
                                        onChange={handleChange}
                                        placeholder="contact@company.com"
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2: Admin Details */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-white mb-6">Admin Account</h2>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="admin_name"
                                        value={formData.admin_name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        name="admin_email"
                                        value={formData.admin_email}
                                        onChange={handleChange}
                                        placeholder="john@company.com"
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        name="admin_password"
                                        value={formData.admin_password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">At least 8 characters</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Confirm Password *
                                    </label>
                                    <input
                                        type="password"
                                        name="admin_password_confirmation"
                                        value={formData.admin_password_confirmation}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-500"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Plan Selection */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-white mb-6">Choose Your Plan</h2>

                                <div className="space-y-3">
                                    {[
                                        { id: 'free', name: 'Free', desc: '5 team members, basic features', price: 'Free' },
                                        { id: 'starter', name: 'Starter', desc: 'Up to 20 team members, advanced features', price: '$99/mo' },
                                        { id: 'professional', name: 'Professional', desc: 'Unlimited team members, all features', price: '$299/mo' },
                                    ].map(plan => (
                                        <label key={plan.id} className="flex items-center p-4 border rounded-lg cursor-pointer transition" style={{
                                            backgroundColor: formData.plan === plan.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(30, 41, 59, 0.5)',
                                            borderColor: formData.plan === plan.id ? '#3b82f6' : '#475569'
                                        }}>
                                            <input
                                                type="radio"
                                                name="plan"
                                                value={plan.id}
                                                checked={formData.plan === plan.id}
                                                onChange={handleChange}
                                                className="w-4 h-4"
                                            />
                                            <div className="ml-4 flex-1">
                                                <p className="font-medium text-white">{plan.name}</p>
                                                <p className="text-sm text-slate-400">{plan.desc}</p>
                                            </div>
                                            <p className="font-semibold text-white">{plan.price}</p>
                                        </label>
                                    ))}
                                </div>

                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-300">
                                    <p className="font-medium mb-1">✓ 7-day free trial included</p>
                                    <p className="text-xs">No credit card required. Cancel anytime.</p>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Payment (for paid plans) */}
                        {step === 4 && paymentInitiated && (
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-white mb-6">Complete Payment</h2>
                                <p className="text-slate-300 mb-6">You're almost there! Complete the payment to activate your {formData.plan} plan.</p>

                                {orderId && invoiceId && (
                                    <RazorpayCheckout
                                        invoiceId={invoiceId}
                                        amount={formData.plan === 'starter' ? 99 : formData.plan === 'professional' ? 299 : 0}
                                        onSuccess={handlePaymentSuccess}
                                        onFailure={handlePaymentFailure}
                                        onCancel={() => {
                                            setPaymentInitiated(false);
                                            setStep(3);
                                        }}
                                        customerEmail={formData.tenant_email}
                                        customerName={formData.tenant_name}
                                    />
                                )}
                            </div>
                        )}

                        {/* Step 5: Confirmation */}
                        {step === 5 && (
                            <div className="text-center space-y-6">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-cyan-500 flex items-center justify-center">
                                        <CheckCircleIcon className="w-8 h-8 text-white" />
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">You're All Set!</h2>
                                    <p className="text-slate-300">Your company has been created. Redirecting to dashboard...</p>
                                </div>

                                <div className="bg-slate-800/50 rounded-lg p-4 text-sm">
                                    <p className="text-slate-400">Company: <span className="text-white font-medium">{formData.tenant_name}</span></p>
                                    <p className="text-slate-400 mt-1">Admin: <span className="text-white font-medium">{formData.admin_name}</span></p>
                                    <p className="text-slate-400 mt-1">Plan: <span className="text-white font-medium capitalize">{formData.plan}</span></p>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        {step < 5 && !paymentInitiated && (
                            <div className="flex gap-4 mt-8 pt-8 border-t border-slate-700">
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={handlePrevStep}
                                        className="flex-1 px-6 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-800 transition"
                                    >
                                        Back
                                    </button>
                                )}
                                {step < 3 && (
                                    <button
                                        type="button"
                                        onClick={handleNextStep}
                                        className="flex-1 px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:from-blue-600 hover:to-cyan-600 transition flex items-center justify-center gap-2"
                                    >
                                        Next <ArrowRightIcon className="w-4.5 h-4.5" />
                                    </button>
                                )}
                                {step === 3 && (
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:from-blue-600 hover:to-cyan-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? (formData.plan === 'free' ? 'Creating...' : 'Proceeding to payment...') : (formData.plan === 'free' ? 'Create Company' : 'Continue to Payment')} {!loading && <ArrowRightIcon className="w-4.5 h-4.5" />}
                                    </button>
                                )}
                            </div>
                        )}
                    </form>

                    {/* Login Link */}
                    {step < 5 && (
                        <p className="text-center text-slate-400 text-sm mt-6">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                                Log in
                            </Link>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Signup;
