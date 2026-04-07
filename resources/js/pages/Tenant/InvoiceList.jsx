import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

/**
 * InvoiceList Component
 *
 * Displays a list of invoices for the current tenant.
 * Users can view, download, and pay for unpaid invoices.
 */
const InvoiceList = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    useEffect(() => {
        fetchInvoices();
    }, [page, perPage]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get('/api/tenant/invoices', {
                params: {
                    page,
                    per_page: perPage,
                },
            });

            setInvoices(response.data.data || []);
            setTotalPages(Math.ceil(response.data.total / perPage) || 1);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load invoices');
            console.error('Error fetching invoices:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePayClick = (invoice) => {
        setSelectedInvoice(invoice);
        setShowPaymentModal(true);
    };

    const handleResendEmail = async (invoiceId) => {
        try {
            await axios.post(`/api/tenant/invoices/${invoiceId}/send`);
            alert('Invoice email sent successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send invoice email');
        }
    };

    const handleDownload = async (invoiceId) => {
        try {
            const response = await axios.get(`/api/tenant/invoices/${invoiceId}/download`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${invoiceId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to download invoice');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' },
            unpaid: { bg: 'bg-red-100', text: 'text-red-800', label: 'Unpaid' },
            draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
            sent: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sent' },
            failed: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Failed' },
        };

        const config = statusConfig[status] || statusConfig.draft;

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    if (loading && invoices.length === 0) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" viewBox="0 0 24 24">
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
                    <p className="mt-4 text-gray-600">Loading invoices...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
                <p className="text-gray-600 mt-2">View and manage your invoices</p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Invoices Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Invoice
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Period
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Due Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {invoices.length > 0 ? (
                            invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        #{invoice.invoice_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                        ₹{parseFloat(invoice.amount).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {format(new Date(invoice.billing_period_start), 'MMM d')} -{' '}
                                        {format(new Date(invoice.billing_period_end), 'MMM d, yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(invoice.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                        <button
                                            onClick={() => setSelectedInvoice(invoice)}
                                            className="text-blue-600 hover:text-blue-900 font-medium"
                                        >
                                            View
                                        </button>
                                        {invoice.status === 'unpaid' && (
                                            <button
                                                onClick={() => handlePayClick(invoice)}
                                                className="text-green-600 hover:text-green-900 font-medium"
                                            >
                                                Pay
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleResendEmail(invoice.id)}
                                            className="text-gray-600 hover:text-gray-900 font-medium"
                                        >
                                            Email
                                        </button>
                                        {invoice.status === 'paid' && (
                                            <button
                                                onClick={() => handleDownload(invoice.id)}
                                                className="text-purple-600 hover:text-purple-900 font-medium"
                                            >
                                                Download
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center">
                                    <p className="text-gray-500 text-sm">No invoices found</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing page {page} of {totalPages}
                    </p>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Invoice Detail Modal */}
            {selectedInvoice && !showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
                        <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Invoice #{selectedInvoice.invoice_number}</h2>
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Amount</p>
                                    <p className="text-2xl font-bold text-gray-900">₹{parseFloat(selectedInvoice.amount).toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Status</p>
                                    <p className="mt-2">{getStatusBadge(selectedInvoice.status)}</p>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Invoice Details</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Invoice Date:</span>
                                        <span className="font-medium">{format(new Date(selectedInvoice.created_at), 'MMM d, yyyy')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Due Date:</span>
                                        <span className="font-medium">{format(new Date(selectedInvoice.due_date), 'MMM d, yyyy')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Billing Period:</span>
                                        <span className="font-medium">
                                            {format(new Date(selectedInvoice.billing_period_start), 'MMM d')} -{' '}
                                            {format(new Date(selectedInvoice.billing_period_end), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                    {selectedInvoice.paid_at && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Paid Date:</span>
                                            <span className="font-medium">{format(new Date(selectedInvoice.paid_at), 'MMM d, yyyy')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4 flex gap-3">
                                {selectedInvoice.status === 'unpaid' && (
                                    <button
                                        onClick={() => {
                                            setShowPaymentModal(true);
                                        }}
                                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                                    >
                                        Pay Now
                                    </button>
                                )}
                                <button
                                    onClick={() => handleResendEmail(selectedInvoice.id)}
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Send Email
                                </button>
                                <button
                                    onClick={() => setSelectedInvoice(null)}
                                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Pay Invoice</h2>
                            <button
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setSelectedInvoice(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6">
                            {/* RazorpayCheckout component would be imported and used here */}
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-4">
                                <div className="text-center">
                                    <p className="text-gray-600 text-sm mb-2">Amount to Pay</p>
                                    <p className="text-3xl font-bold text-gray-900">₹{parseFloat(selectedInvoice.amount).toFixed(2)}</p>
                                </div>
                            </div>

                            <button
                                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                onClick={() => {
                                    // Payment component would be triggered here
                                    alert('Payment component integration needed');
                                }}
                            >
                                Proceed to Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceList;
