import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/UI/Card';
import api from '../../../services/api';

const inputCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

const LEVELS = [
    { value: 1, label: '1 — Junior' },
    { value: 2, label: '2 — Mid-Level' },
    { value: 3, label: '3 — Senior' },
    { value: 4, label: '4 — Lead' },
    { value: 5, label: '5 — Manager' },
    { value: 6, label: '6 — Director' },
    { value: 7, label: '7 — VP' },
    { value: 8, label: '8 — C-Suite' },
];

const LEVEL_LABELS = { 1: 'Junior', 2: 'Mid-Level', 3: 'Senior', 4: 'Lead', 5: 'Manager', 6: 'Director', 7: 'VP', 8: 'C-Suite' };

const defaultForm = {
    title: '', code: '', department_id: '', level: '', description: '', is_active: true,
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

export default function Designations() {
    const [designations, setDesignations] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editDesig, setEditDesig] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [message, setMessage] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [desigRes, deptRes] = await Promise.all([
                api.get('/tenant/designations'),
                api.get('/tenant/departments'),
            ]);
            setDesignations(Array.isArray(desigRes.data.data) ? desigRes.data.data : desigRes.data);
            setDepartments(Array.isArray(deptRes.data.data) ? deptRes.data.data : deptRes.data);
        } catch {
            showMsg('error', 'Failed to load data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const showMsg = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const getDeptName = (deptId) => {
        if (!deptId) return null;
        const dept = departments.find((d) => d.id === parseInt(deptId, 10) || d.id === deptId);
        return dept ? dept.name : null;
    };

    const openCreate = () => {
        setEditDesig(null);
        setForm(defaultForm);
        setShowModal(true);
    };

    const openEdit = (desig) => {
        setEditDesig(desig);
        setForm({
            title: desig.title || '',
            code: desig.code || '',
            department_id: desig.department_id ? String(desig.department_id) : '',
            level: desig.level ? String(desig.level) : '',
            description: desig.description || '',
            is_active: desig.is_active !== false,
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...form,
                department_id: form.department_id ? parseInt(form.department_id, 10) : null,
                level: form.level ? parseInt(form.level, 10) : null,
            };
            if (editDesig) {
                await api.put(`/tenant/designations/${editDesig.id}`, payload);
                showMsg('success', 'Designation updated successfully.');
            } else {
                await api.post('/tenant/designations', payload);
                showMsg('success', 'Designation created successfully.');
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            showMsg('error', err.response?.data?.message || 'Failed to save designation.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/tenant/designations/${deleteConfirm.id}`);
            setDeleteConfirm(null);
            showMsg('success', 'Designation deleted.');
            fetchData();
        } catch {
            showMsg('error', 'Failed to delete designation.');
            setDeleteConfirm(null);
        }
    };

    const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const levelColor = (level) => {
        const num = parseInt(level, 10);
        if (num <= 2) return 'bg-blue-100 text-blue-700';
        if (num <= 4) return 'bg-indigo-100 text-indigo-700';
        if (num <= 6) return 'bg-purple-100 text-purple-700';
        return 'bg-rose-100 text-rose-700';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Designations</h1>
                    <p className="text-sm text-gray-500 mt-1">Define job titles and levels across your organisation</p>
                </div>
                <div className="flex items-center gap-3">
                    {message && (
                        <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {message.text}
                        </span>
                    )}
                    <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <PlusIcon /> Add Designation
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
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Title</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Code</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Department</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Level</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {designations.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center text-gray-400 py-12">No designations found. Add your first designation.</td>
                                    </tr>
                                ) : designations.map((desig) => (
                                    <tr key={desig.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 font-medium text-gray-900">{desig.title}</td>
                                        <td className="py-3 px-4 text-gray-500">{desig.code || '—'}</td>
                                        <td className="py-3 px-4 text-gray-500">
                                            {getDeptName(desig.department_id) || desig.department?.name || '—'}
                                        </td>
                                        <td className="py-3 px-4">
                                            {desig.level ? (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${levelColor(desig.level)}`}>
                                                    {LEVEL_LABELS[desig.level] || `Level ${desig.level}`}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${desig.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {desig.is_active !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(desig)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"><EditIcon /></button>
                                                <button onClick={() => setDeleteConfirm(desig)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><TrashIcon /></button>
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
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-gray-900">{editDesig ? 'Edit Designation' : 'Add Designation'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className={labelCls}>Title <span className="text-red-500">*</span></label>
                                <input type="text" value={form.title} onChange={set('title')} className={inputCls} required placeholder="e.g. Software Engineer" />
                            </div>
                            <div>
                                <label className={labelCls}>Code</label>
                                <input type="text" value={form.code} onChange={set('code')} className={inputCls} placeholder="e.g. SWE" />
                            </div>
                            <div>
                                <label className={labelCls}>Department</label>
                                <select value={form.department_id} onChange={set('department_id')} className={inputCls}>
                                    <option value="">Select department</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Level</label>
                                <select value={form.level} onChange={set('level')} className={inputCls}>
                                    <option value="">Select level</option>
                                    {LEVELS.map((l) => (
                                        <option key={l.value} value={l.value}>{l.label}</option>
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
                                    {saving ? 'Saving...' : editDesig ? 'Save Changes' : 'Add Designation'}
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
                        <h2 className="text-base font-semibold text-gray-900 mb-2">Delete Designation</h2>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{deleteConfirm.title}</strong>? This action cannot be undone.
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
