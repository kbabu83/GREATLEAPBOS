import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * RazorpayCheckout Component
 *
 * Handles Razorpay payment gateway integration for subscription payments.
 *
 * Props:
 * - invoiceId: String - Invoice ID to be paid
 * - amount: Number - Amount in rupees
 * - onSuccess: Function - Callback on successful payment
 * - onFailure: Function - Callback on failed payment
 * - onCancel: Function - Callback when user cancels
 * - customerEmail: String - Customer email for payment receipt
 * - customerName: String - Customer name
 */
const RazorpayCheckout = ({
    invoiceId,
    amount,
    onSuccess,
    onFailure,
    onCancel,
    customerEmail,
    customerName,
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load Razorpay script
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
            console.log('Razorpay script loaded');
        };
        script.onerror = () => {
            setError('Failed to load payment gateway. Please try again.');
            console.error('Failed to load Razorpay script');
        };
        document.body.appendChild(script);

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    const initiatePayment = async () => {
        try {
            setLoading(true);
            setError(null);

            // Create Razorpay order
            const response = await axios.post('/api/tenant/payments/initiate', {
                invoice_id: invoiceId,
            });

            const { order_data } = response.data;

            // Open Razorpay checkout
            openRazorpayCheckout(order_data);
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to initiate payment. Please try again.';
            setError(message);
            if (onFailure) {
                onFailure(message);
            }
            console.error('Payment initiation error:', err);
        } finally {
            setLoading(false);
        }
    };

    const openRazorpayCheckout = (orderData) => {
        const options = {
            key: orderData.key_id,
            amount: Math.round(orderData.amount * 100), // Razorpay expects amount in paise
            currency: orderData.currency,
            name: 'Great Leap App',
            description: `Invoice Payment - Amount: ₹${orderData.amount}`,
            order_id: orderData.order_id,
            customer_notify: 1,
            prefill: {
                email: customerEmail || '',
                contact: '', // Add contact if available
                name: customerName || '',
            },
            theme: {
                color: '#3b82f6',
            },
            notes: {
                invoice_id: invoiceId,
            },
            handler: (response) => {
                verifyPayment(response);
            },
            modal: {
                ondismiss: () => {
                    if (onCancel) {
                        onCancel();
                    }
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

    const verifyPayment = async (response) => {
        try {
            setLoading(true);

            // Verify payment with backend
            const verifyResponse = await axios.post('/api/tenant/payments/verify', {
                invoice_id: invoiceId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
            });

            if (verifyResponse.data) {
                if (onSuccess) {
                    onSuccess(verifyResponse.data);
                }
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Payment verification failed. Please contact support.';
            setError(message);
            if (onFailure) {
                onFailure(message);
            }
            console.error('Payment verification error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
            )}

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <p className="text-gray-600 text-sm">Amount to Pay</p>
                        <p className="text-3xl font-bold text-gray-900">₹{amount.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-600 text-sm">Invoice ID</p>
                        <p className="text-lg font-semibold text-gray-900">{invoiceId.substring(0, 8)}...</p>
                    </div>
                </div>

                <button
                    onClick={initiatePayment}
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                        loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                    }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
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
                            Processing...
                        </span>
                    ) : (
                        'Pay with Razorpay'
                    )}
                </button>

                <p className="text-gray-600 text-xs text-center mt-4">
                    Secure payment powered by Razorpay. Your payment details are encrypted and safe.
                </p>
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
    );
};

export default RazorpayCheckout;
