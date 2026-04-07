import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/UI/Card';
import api from '../../../services/api';

const inputCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

const defaultForm = {
    name: '', code: '', is_head_office: false,
    address_line1: '', city: '', state: '', pincode: '',
    phone: '', email: '', is_active: true,
};

function PlusIcon() {
    return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function EditIcon() {
    return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
}
function TrashIcon() {
    return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
}

export default function Branches() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editBranch, setEditBranch] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [message, setMessage] = useState(null);

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tenant/branches');
            setBranches(Array.isArray(res.data.data) ? res.data.data : res.data);
        } catch {
            showMsg('error', 'Failed to load branches.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBranches(); }, []);

    const showMsg = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const openCreate = () => {
        setEditBranch(null);
        setForm(defaultForm);
        setShowModal(true);
    };

    const openEdit = (branch) => {
        setEditBranch(branch);
        setForm({
            name: branch.name || '', code: branch.code || '',
            is_head_office: !!branch.is_head_office,
            address_line1: branch.address_line1 || '', city: branch.city || '',
            state: branch.state || '', pincode: branch.pincode || '',
            phone: branch.phone || '', email: branch.email || '',
            is_active: branch.is_active !== false,
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editBranch) {
                await api.put(`/tenant/branches/${editBranch.id}`, form);
                showMsg('success', 'Branch updated successfully.');
            } else {
                await api.post('/tenant/branches', form);
                showMsg('success', 'Branch created successfully.');
            }
            setShowModal(false);
            fetchBranches();
        } catch (err) {
            showMsg('error', err.response?.data?.message || 'Failed to save branch.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/tenant/branches/${deleteConfirm.id}`);
            setDeleteConfirm(null);
            showMsg('success', 'Branch deleted.');
            fetchBranches();
        } catch {
            showMsg('error', 'Failed to delete branch.');
            setDeleteConfirm(null);
        }
    };

    const set = (field) => (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm((f) => ({ ...f, [field]: val }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your organisation's branch offices</p>
                </div>
                <div className="flex items-center gap-3">
                    {message && (
                        <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {message.text}
                        </span>
                    )}
                    <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <PlusIcon /> Add Branch
                    </button>
                </div>
            </div>

            <Card>
                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded" />)}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Code</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">City</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Head Office</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {branches.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center text-gray-400 py-12">No branches found. Add your first branch.</td>
                                    </tr>
                                ) : branches.map((branch) => (
                                    <tr key={branch.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 font-medium text-gray-900">{branch.name}</td>
                                        <td className="py-3 px-4 text-gray-500">{branch.code || '—'}</td>
                                        <td className="py-3 px-4 text-gray-500">{branch.city || '—'}</td>
                                        <td className="py-3 px-4">
                                            {branch.is_head_office ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">HQ</span>
                                            ) : '—'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${branch.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {branch.is_active !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(branch)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><EditIcon /></button>
                                                <button onClick={() => setDeleteConfirm(branch)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><TrashIcon /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-gray-900">{editBranch ? 'Edit Branch' : 'Add Branch'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className={labelCls}>Branch Name <span className="text-red-500">*</span></label>
                                    <input type="text" value={form.name} onChange={set('name')} className={inputCls} required />
                                </div>
                                <div>
                                    <label className={labelCls}>Branch Code</label>
                                    <input type="text" value={form.code} onChange={set('code')} className={inputCls} placeholder="e.g. MUM-01" />
                                </div>
                                <div className="flex items-center gap-3 pt-5">
                                    <input type="checkbox" id="is_head_office" checked={form.is_head_office} onChange={set('is_head_office')} className="w-4 h-4 rounded text-blue-600" />
                                    <label htmlFor="is_head_office" className="text-sm font-medium text-gray-700">Head Office</label>
                                </div>
                                <div className="col-span-2">
                                    <label className={labelCls}>Address Line 1</label>
                                    <input type="text" value={form.address_line1} onChange={set('address_line1')} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>City</label>
                                    <input type="text" value={form.city} onChange={set('city')} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>State</label>
                                    <input type="text" value={form.state} onChange={set('state')} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Pincode</label>
                                    <input type="text" value={form.pincode} onChange={set('pincode')} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Phone</label>
                                    <input type="tel" value={form.phone} onChange={set('phone')} className={inputCls} />
                                </div>
                                <div className="col-span-2">
                                    <label className={labelCls}>Email</label>
                                    <input type="email" value={form.email} onChange={set('email')} className={inputCls} />
                                </div>
                                <div className="col-span-2">
                                    <label className={labelCls}>Status</label>
                                    <select value={form.is_active ? 'active' : 'inactive'} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === 'active' }))} className={inputCls}>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                                    {saving ? 'Saving...' : editBranch ? 'Save Changes' : 'Add Branch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-2">Delete Branch</h2>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
