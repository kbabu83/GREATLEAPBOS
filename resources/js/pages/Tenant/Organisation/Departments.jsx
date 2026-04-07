import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/UI/Card';
import api from '../../../services/api';

const inputCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

const defaultForm = {
    name: '', code: '', parent_id: '', description: '', is_active: true,
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

export default function Departments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editDept, setEditDept] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [message, setMessage] = useState(null);

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tenant/departments');
            setDepartments(Array.isArray(res.data.data) ? res.data.data : res.data);
        } catch {
            showMsg('error', 'Failed to load departments.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDepartments(); }, []);

    const showMsg = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const getParentName = (parentId) => {
        if (!parentId) return null;
        const parent = departments.find((d) => d.id === parseInt(parentId, 10) || d.id === parentId);
        return parent ? parent.name : null;
    };

    const openCreate = () => {
        setEditDept(null);
        setForm(defaultForm);
        setShowModal(true);
    };

    const openEdit = (dept) => {
        setEditDept(dept);
        setForm({
            name: dept.name || '',
            code: dept.code || '',
            parent_id: dept.parent_id ? String(dept.parent_id) : '',
            description: dept.description || '',
            is_active: dept.is_active !== false,
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                parent_id: form.parent_id ? parseInt(form.parent_id, 10) : null,
            };
            if (editDept) {
                await api.put(`/tenant/departments/${editDept.id}`, payload);
                showMsg('success', 'Department updated successfully.');
            } else {
                await api.post('/tenant/departments', payload);
                showMsg('success', 'Department created successfully.');
            }
            setShowModal(false);
            fetchDepartments();
        } catch (err) {
            showMsg('error', err.response?.data?.message || 'Failed to save department.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/tenant/departments/${deleteConfirm.id}`);
            setDeleteConfirm(null);
            showMsg('success', 'Department deleted.');
            fetchDepartments();
        } catch {
            showMsg('error', 'Failed to delete department.');
            setDeleteConfirm(null);
        }
    };

    const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    // Departments available as parent options (exclude current dept being edited)
    const parentOptions = departments.filter((d) => !editDept || d.id !== editDept.id);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
                    <p className="text-sm text-gray-500 mt-1">Organise your company structure into departments</p>
                </div>
                <div className="flex items-center gap-3">
                    {message && (
                        <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {message.text}
                        </span>
                    )}
                    <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <PlusIcon /> Add Department
                    </button>
                </div>
            </div>

            <Card>
                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded" />)}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Code</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Parent</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Head</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Employees</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {departments.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center text-gray-400 py-12">No departments found. Create your first department.</td>
                                    </tr>
                                ) : departments.map((dept) => {
                                    const parentName = getParentName(dept.parent_id);
                                    return (
                                        <tr key={dept.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4">
                                                <span className="font-medium text-gray-900">
                                                    {parentName && <span className="text-gray-400 font-normal">{parentName} &rsaquo; </span>}
                                                    {dept.name}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-500">{dept.code || '—'}</td>
                                            <td className="py-3 px-4 text-gray-500">{parentName || '—'}</td>
                                            <td className="py-3 px-4 text-gray-500">{dept.head_name || dept.head?.name || '—'}</td>
                                            <td className="py-3 px-4 text-gray-500">{dept.employees_count ?? dept.employee_count ?? '—'}</td>
                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${dept.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {dept.is_active !== false ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(dept)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><EditIcon /></button>
                                                    <button onClick={() => setDeleteConfirm(dept)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><TrashIcon /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-gray-900">{editDept ? 'Edit Department' : 'Add Department'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className={labelCls}>Department Name <span className="text-red-500">*</span></label>
                                <input type="text" value={form.name} onChange={set('name')} className={inputCls} required />
                            </div>
                            <div>
                                <label className={labelCls}>Code</label>
                                <input type="text" value={form.code} onChange={set('code')} className={inputCls} placeholder="e.g. ENG" />
                            </div>
                            <div>
                                <label className={labelCls}>Parent Department</label>
                                <select value={form.parent_id} onChange={set('parent_id')} className={inputCls}>
                                    <option value="">None (top-level)</option>
                                    {parentOptions.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Description</label>
                                <textarea value={form.description} onChange={set('description')} rows={3} className={inputCls} />
                            </div>
                            <div>
                                <label className={labelCls}>Status</label>
                                <select value={form.is_active ? 'active' : 'inactive'} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.value === 'active' }))} className={inputCls}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                                    {saving ? 'Saving...' : editDept ? 'Save Changes' : 'Add Department'}
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
                        <h2 className="text-base font-semibold text-gray-900 mb-2">Delete Department</h2>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? Sub-departments may be affected.
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
