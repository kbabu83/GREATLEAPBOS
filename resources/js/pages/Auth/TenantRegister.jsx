import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/**
 * TenantRegister Component
 *
 * Multi-step tenant registration flow:
 * 1. Organization details
 * 2. Admin user details
 * 3. Plan selection
 * 4. Payment (if paid plan)
 * 5. Success confirmation
 */
const TenantRegister = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [plans, setPlans] = useState([]);
    const [billingCycle, setBillingCycle] = useState('monthly');

    const [formData, setFormData] = useState({
        // Step 1: Organization
        tenant_name: '',
        tenant_email: '',

        // Step 2: Admin User
        admin_name: '',
        admin_email: '',
        admin_password: '',
        admin_password_confirmation: '',

        // Step 3: Plan
        plan: '',
        number_of_users: 1,
    });

    const [paymentData, setPaymentData] = useState({
        plan_id: '',
        billing_cycle: 'monthly',
        order_id: null,
        razorpay_payment_id: null,
        razorpay_order_id: null,
        razorpay_signature: null,
    });

    useEffect(() => {
        if (step === 3) {
            fetchPlans();
        }
    }, [step]);

    const fetchPlans = async () => {
        try {
            const response = await axios.get('/api/plans');
            setPlans(response.data.data || response.data);
        } catch (err) {
            console.error('Error fetching plans:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError(null);
    };

    const validateStep1 = () => {
        if (!formData.tenant_name || !formData.tenant_email) {
            setError('Please fill in all organization details');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.admin_name || !formData.admin_email || !formData.admin_password) {
            setError('Please fill in all admin user details');
            return false;
        }
        if (formData.admin_password !== formData.admin_password_confirmation) {
            setError('Passwords do not match');
            return false;
        }
        if (formData.admin_password.length < 8) {
            setError('Password must be at least 8 characters');
            return false;
        }
        return true;
    };

    const validateStep3 = () => {
        if (!formData.plan) {
            setError('Please select a plan');
            return false;
        }
        return true;
    };

    const handleNextStep = () => {
        setError(null);

        if (step === 1 && !validateStep1()) return;
        if (step === 2 && !validateStep2()) return;
        if (step === 3 && !validateStep3()) return;

        if (step === 3) {
            const selectedPlan = plans.find((p) => p.slug === formData.plan);
            if (selectedPlan && selectedPlan.slug !== 'free') {
                setPaymentData({
                    ...paymentData,
                    plan_id: selectedPlan.id,
                    billing_cycle: billingCycle,
                });
                setStep(4);
            } else {
                // Free plan - proceed to registration
                submitRegistration();
            }
        } else {
            setStep(step + 1);
        }
    };

    const initiatePayment = async () => {
        const selectedPlan = plans.find((p) => p.slug === formData.plan);
        if (!selectedPlan) {
            setError('Invalid plan selected');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const amount = billingCycle === 'monthly' ? selectedPlan.monthly_price : selectedPlan.annual_price;

            const response = await axios.post('/api/tenant/payments/initiate', {
                tenant_name: formData.tenant_name,
                tenant_email: formData.tenant_email,
                plan_id: selectedPlan.id,
                amount: amount,
                billing_cycle: billingCycle,
            });

            const { order_data } = response.data;
            openRazorpayCheckout(order_data, selectedPlan);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to initiate payment');
            console.error('Payment initiation error:', err);
        } finally {
            setLoading(false);
        }
    };

    const openRazorpayCheckout = (orderData, plan) => {
        const options = {
            key: orderData.key_id,
            amount: Math.round(orderData.amount * 100),
            currency: orderData.currency,
            name: 'Great Leap App',
            description: `${plan.name} subscription`,
            order_id: orderData.order_id,
            prefill: {
                email: formData.tenant_email,
                name: formData.admin_name,
            },
            theme: {
                color: '#3b82f6',
            },
            handler: (response) => {
                setPaymentData({
                    ...paymentData,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                });
                submitRegistration(response);
            },
            modal: {
                ondismiss: () => {
                    setError('Payment cancelled. Please try again.');
                },
            },
        };

        if (window.Razorpay) {
            const rzp = new window.Razorpay(options);
            rzp.open();
        } else {
            setError('Payment gateway not loaded. Please refresh and try again.');
        }
    };

    const submitRegistration = async (paymentResponse = null) => {
        try {
            setLoading(true);
            setError(null);

            const registrationData = {
                tenant_name: formData.tenant_name,
                tenant_email: formData.tenant_email,
                admin_name: formData.admin_name,
                admin_email: formData.admin_email,
                admin_password: formData.admin_password,
                admin_password_confirmation: formData.admin_password_confirmation,
                plan: formData.plan,
                number_of_users: formData.number_of_users,
            };

            if (paymentResponse) {
                registrationData.razorpay_payment_id = paymentResponse.razorpay_payment_id;
                registrationData.razorpay_order_id = paymentResponse.razorpay_order_id;
                registrationData.razorpay_signature = paymentResponse.razorpay_signature;
            }

            const response = await axios.post('/api/tenants/register', registrationData);

            setStep(5); // Success step
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
            console.error('Registration error:', err);
        } finally {
            setLoading(false);
        }
    };

    const selectedPlan = plans.find((p) => p.slug === formData.plan);
    const amount = selectedPlan
        ? billingCycle === 'monthly'
            ? selectedPlan.monthly_price
            : selectedPlan.annual_price
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">Great Leap App</h1>
                    <p className="text-gray-600 mt-2">Create your account in just a few steps</p>
                </div>

                {/* Step Indicator */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <React.Fragment key={s}>
                                <div
                                    className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                                        step >= s
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-300 text-gray-700'
                                    }`}
                                >
                                    {s === 5 ? '✓' : s}
                                </div>
                                {s < 5 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-300'}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                        <span>Organization</span>
                        <span>Admin</span>
                        <span>Plan</span>
                        <span>Payment</span>
                        <span>Success</span>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* Step 1: Organization */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Organization Details</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Organization Name *
                                </label>
                                <input
                                    type="text"
                                    name="tenant_name"
                                    value={formData.tenant_name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    placeholder="Acme Corp"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Organization Email *
                                </label>
                                <input
                                    type="email"
                                    name="tenant_email"
                                    value={formData.tenant_email}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    placeholder="company@example.com"
                                />
                            </div>

                        </div>
                    )}

                    {/* Step 2: Admin User */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Account Details</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    name="admin_name"
                                    value={formData.admin_name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    name="admin_email"
                                    value={formData.admin_email}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    name="admin_password"
                                    value={formData.admin_password}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    placeholder="••••••••"
                                />
                                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password *
                                </label>
                                <input
                                    type="password"
                                    name="admin_password_confirmation"
                                    value={formData.admin_password_confirmation}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Plan Selection */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Plan</h2>

                            <div className="flex gap-4 mb-6">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                        billingCycle === 'monthly'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                    }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setBillingCycle('annual')}
                                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                        billingCycle === 'annual'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                    }`}
                                >
                                    Annual (Save 20%)
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4 mb-6">
                                {plans.map((plan) => {
                                    const price = billingCycle === 'monthly' ? plan.monthly_price : plan.annual_price;
                                    const isSelected = formData.plan === plan.slug;

                                    return (
                                        <div
                                            key={plan.id}
                                            onClick={() => setFormData({ ...formData, plan: plan.slug })}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                                                isSelected
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : 'border-gray-200 bg-white hover:border-blue-400'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-gray-900">{plan.name}</h3>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {plan.plan_features?.length || 0} features included
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-gray-900">
                                                        ₹{parseFloat(price || 0).toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-gray-600">
                                                        {billingCycle === 'monthly' ? '/month' : '/year'}
                                                    </p>
                                                </div>
                                            </div>

                                            {plan.plan_features && plan.plan_features.length > 0 && (
                                                <ul className="mt-3 space-y-1">
                                                    {plan.plan_features.slice(0, 3).map((feature, idx) => (
                                                        <li key={idx} className="text-xs text-gray-600 flex items-center">
                                                            <span className="text-green-600 mr-2">✓</span>
                                                            {feature.feature_key}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Number of Users *
                                </label>
                                <input
                                    type="number"
                                    name="number_of_users"
                                    value={formData.number_of_users}
                                    onChange={handleInputChange}
                                    min="1"
                                    max="10000"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    placeholder="Enter number of users"
                                />
                                <p className="text-xs text-gray-500 mt-1">How many users do you need? (1-10000)</p>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Payment */}
                    {step === 4 && selectedPlan && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirm Payment</h2>

                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <p className="text-gray-600 text-sm">Plan</p>
                                        <p className="text-xl font-bold text-gray-900">{selectedPlan.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-600 text-sm">
                                            {billingCycle === 'monthly' ? 'Monthly' : 'Annual'}
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900">₹{amount.toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-300 pt-4 mt-4">
                                    <p className="text-sm text-gray-600">
                                        Your organization will be set up immediately after successful payment.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-900 mb-2">Accepted Payment Methods</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>✓ Credit & Debit Cards</li>
                                    <li>✓ UPI (Google Pay, PhonePe, Paytm)</li>
                                    <li>✓ Net Banking</li>
                                    <li>✓ Wallets</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Success */}
                    {step === 5 && (
                        <div className="text-center space-y-6">
                            <div className="text-6xl">✓</div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Welcome to Great Leap!</h2>
                                <p className="text-gray-600 mt-2">Your organization has been created successfully.</p>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-lg space-y-2">
                                <p className="text-sm text-gray-600">A welcome email has been sent to:</p>
                                <p className="font-bold text-gray-900">{formData.admin_email}</p>
                            </div>

                            <button
                                onClick={() => navigate('/auth/login')}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                            >
                                Go to Login
                            </button>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    {step < 5 && (
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => setStep(Math.max(1, step - 1))}
                                disabled={step === 1}
                                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => {
                                    if (step === 4) {
                                        initiatePayment();
                                    } else {
                                        handleNextStep();
                                    }
                                }}
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {loading && (
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                                )}
                                {step === 4
                                    ? loading
                                        ? 'Processing...'
                                        : 'Pay Now'
                                    : step === 3
                                    ? 'Continue'
                                    : 'Next'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Links */}
                <div className="text-center mt-6 space-y-2">
                    <p className="text-gray-600 text-sm">
                        Already have an account?{' '}
                        <a href="/auth/login" className="text-blue-600 font-semibold hover:text-blue-700">
                            Sign in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TenantRegister;
