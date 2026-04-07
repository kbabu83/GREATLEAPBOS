import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, StatCard } from '../../../components/UI/Card';
import api from '../../../services/api';

// ── Icons ────────────────────────────────────────────────────────────────────
function PlusIcon() {
    return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function EyeIcon() {
    return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
}
function EditIcon() {
    return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
}
function UsersIcon() {
    return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function CheckCircleIcon() {
    return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function ClockIcon() {
    return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function BellIcon() {
    return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
}
function SearchIcon() {
    return <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
}

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_CLASSES = {
    active: 'bg-green-100 text-green-700',
    probation: 'bg-blue-100 text-blue-700',
    notice_period: 'bg-orange-100 text-orange-700',
    resigned: 'bg-red-100 text-red-700',
    terminated: 'bg-red-100 text-red-700',
    absconded: 'bg-red-100 text-red-700',
    inactive: 'bg-gray-100 text-gray-600',
};
const STATUS_LABELS = {
    active: 'Active',
    probation: 'Probation',
    notice_period: 'Notice Period',
    resigned: 'Resigned',
    terminated: 'Terminated',
    absconded: 'Absconded',
    inactive: 'Inactive',
};

function StatusBadge({ status }) {
    const cls = STATUS_CLASSES[status] || 'bg-gray-100 text-gray-600';
    const label = STATUS_LABELS[status] || status;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
            {label}
        </span>
    );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, photo }) {
    if (photo) return <img src={photo} alt={name} className="w-9 h-9 rounded-full object-cover" />;
    const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500'];
    const color = colors[(name || '').charCodeAt(0) % colors.length];
    return (
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold ${color}`}>
            {initials}
        </div>
    );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────
function SkeletonRows() {
    return (
        <tbody className="animate-pulse">
            {[...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                    <td className="py-3 px-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-gray-200 rounded-full" /><div className="space-y-1.5"><div className="h-3.5 bg-gray-200 rounded w-28" /><div className="h-3 bg-gray-100 rounded w-20" /></div></div></td>
                    <td className="py-3 px-4"><div className="h-3.5 bg-gray-200 rounded w-24" /></td>
                    <td className="py-3 px-4"><div className="h-3.5 bg-gray-200 rounded w-20" /></td>
                    <td className="py-3 px-4"><div className="h-3.5 bg-gray-200 rounded w-16" /></td>
                    <td className="py-3 px-4"><div className="h-5 bg-gray-200 rounded-full w-16" /></td>
                    <td className="py-3 px-4"><div className="flex gap-2 justify-end"><div className="h-7 w-7 bg-gray-200 rounded" /><div className="h-7 w-7 bg-gray-200 rounded" /></div></td>
                </tr>
            ))}
        </tbody>
    );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function EmployeeList() {
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0, probation: 0, notice: 0 });
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [message, setMessage] = useState(null);

    const [filters, setFilters] = useState({
        search: '',
        department_id: '',
        employment_type: '',
        employment_status: '',
    });
    const [page, setPage] = useState(1);

    const showMsg = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const fetchEmployees = useCallback(async (currentPage, currentFilters) => {
        setLoading(true);
        try {
            const params = { page: currentPage, ...currentFilters };
            const res = await api.get('/tenant/employees', { params });
            const data = res.data;
            setEmployees(data.data || []);
            setPagination({
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                total: data.total || 0,
            });
            // Compute stats from response meta or from data
            if (data.stats) {
                setStats(data.stats);
            } else {
                // Fallback: count from full list if stats not in response
                const all = data.data || [];
                setStats({
                    total: data.total || all.length,
                    active: all.filter(e => e.employment_status === 'active').length,
                    probation: all.filter(e => e.employment_status === 'probation').length,
                    notice: all.filter(e => e.employment_status === 'notice_period').length,
                });
            }
        } catch {
            showMsg('error', 'Failed to load employees.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/tenant/departments');
            setDepartments(Array.isArray(res.data.data) ? res.data.data : res.data);
        } catch {
            // non-blocking
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    useEffect(() => {
        fetchEmployees(page, filters);
    }, [page, filters, fetchEmployees]);

    const handleFilterChange = (field, value) => {
        setFilters(f => ({ ...f, [field]: value }));
        setPage(1);
    };

    const inputCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                        {pagination.total}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    {message && (
                        <span className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {message.text}
                        </span>
                    )}
                    <Link
                        to="/employees/new"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                        <PlusIcon /> Add Employee
                    </Link>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Employees" value={stats.total} icon={<UsersIcon />} color="primary" />
                <StatCard title="Active" value={stats.active} icon={<CheckCircleIcon />} color="accent" />
                <StatCard title="On Probation" value={stats.probation} icon={<ClockIcon />} color="amber" />
                <StatCard title="On Notice" value={stats.notice} icon={<BellIcon />} color="rose" />
            </div>

            {/* Filters */}
            <Card>
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            placeholder="Search name, code, email…"
                            value={filters.search}
                            onChange={e => handleFilterChange('search', e.target.value)}
                            className={`${inputCls} pl-9 w-full`}
                        />
                    </div>
                    <select
                        value={filters.department_id}
                        onChange={e => handleFilterChange('department_id', e.target.value)}
                        className={`${inputCls} min-w-[160px]`}
                    >
                        <option value="">All Departments</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                    <select
                        value={filters.employment_type}
                        onChange={e => handleFilterChange('employment_type', e.target.value)}
                        className={`${inputCls} min-w-[160px]`}
                    >
                        <option value="">All Types</option>
                        <option value="monthly_salaried">Monthly Salaried</option>
                        <option value="daily_wage">Daily Wage</option>
                        <option value="hourly_wage">Hourly Wage</option>
                    </select>
                    <select
                        value={filters.employment_status}
                        onChange={e => handleFilterChange('employment_status', e.target.value)}
                        className={`${inputCls} min-w-[160px]`}
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="probation">Probation</option>
                        <option value="notice_period">Notice Period</option>
                        <option value="resigned">Resigned</option>
                        <option value="terminated">Terminated</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </Card>

            {/* Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left py-3 px-4 font-semibold text-gray-600">Employee</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-600">Department</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-600">Designation</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-600">Type</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                                <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        {loading ? (
                            <SkeletonRows />
                        ) : (
                            <tbody>
                                {employees.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center text-gray-400 py-16">
                                            No employees found. Adjust your filters or add an employee.
                                        </td>
                                    </tr>
                                ) : employees.map(emp => (
                                    <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={`${emp.first_name} ${emp.last_name || ''}`}
                                                    photo={emp.profile_photo_url || emp.photo}
                                                />
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {emp.first_name} {emp.last_name}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {emp.employee_code && <span className="mr-2">{emp.employee_code}</span>}
                                                        {emp.work_email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">
                                            {emp.department?.name || emp.department_name || '—'}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">
                                            {emp.designation?.name || emp.designation_name || '—'}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600 capitalize">
                                            {emp.employment_type
                                                ? emp.employment_type.replace(/_/g, ' ')
                                                : '—'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <StatusBadge status={emp.employment_status} />
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    to={`/employees/${emp.id}`}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    title="View"
                                                >
                                                    <EyeIcon />
                                                </Link>
                                                <Link
                                                    to={`/employees/${emp.id}/edit`}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    title="Edit"
                                                >
                                                    <EditIcon />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        )}
                    </table>
                </div>

                {/* Pagination */}
                {!loading && pagination.last_page > 1 && (
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            Page {pagination.current_page} of {pagination.last_page} &mdash; {pagination.total} employees
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={pagination.current_page === 1}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))}
                                disabled={pagination.current_page === pagination.last_page}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
