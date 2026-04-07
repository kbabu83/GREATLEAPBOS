import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import TeamPerformanceDashboard from './ReportViews/TeamPerformanceDashboard';
import UserProductivityDashboard from './ReportViews/UserProductivityDashboard';
import TimeTrackingDashboard from './ReportViews/TimeTrackingDashboard';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#6b7280'];

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
          <p className={`text-3xl font-bold tabular-nums mt-1 ${color}`}>{value}</p>
        </div>
        <div className="text-4xl opacity-20">{icon}</div>
      </div>
    </div>
  );
}

function ChartSection({ title, description, children }) {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-700/30">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Table({ columns, data }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50 bg-slate-700/30">
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-slate-400">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-slate-300">
                  {typeof col.render === 'function' ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [view, setView] = useState('all'); // all | team
  const [dashboard, setDashboard] = useState('overview'); // overview | team | productivity | time-tracking
  const [loading, setLoading] = useState(true);

  // Report data
  const [summary, setSummary] = useState(null);
  const [timeSpent, setTimeSpent] = useState([]);
  const [taskCompletion, setTaskCompletion] = useState([]);
  const [deadlinePerf, setDeadlinePerf] = useState([]);
  const [dailyTracking, setDailyTracking] = useState([]);
  const [taskPriority, setTaskPriority] = useState([]);

  const hasReportees = user?.role === 'tenant_admin' || user?.reporting_users_count > 0;

  useEffect(() => {
    loadReports();
  }, [view]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const teamOnly = view === 'team' ? '&team_only=1' : '';

      const [summRes, timeRes, compRes, deadRes, dailyRes, prioRes] = await Promise.all([
        api.get(`/tenant/execution/reports/team-summary?${teamOnly}`),
        api.get(`/tenant/execution/reports/time-spent?${teamOnly}`),
        api.get(`/tenant/execution/reports/task-completion?${teamOnly}`),
        api.get(`/tenant/execution/reports/deadline-performance?${teamOnly}`),
        api.get(`/tenant/execution/reports/daily-tracking?days=30${teamOnly}`),
        api.get(`/tenant/execution/reports/task-priority?${teamOnly}`),
      ]);

      setSummary(summRes.data);
      setTimeSpent(timeRes.data || []);
      setTaskCompletion(compRes.data || []);
      setDeadlinePerf(deadRes.data || []);
      setDailyTracking(dailyRes.data || []);
      setTaskPriority(prioRes.data || []);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">📊 Reports & Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">Comprehensive view of team performance and time tracking</p>
        </div>
        <div className="flex gap-2 flex-col md:flex-row w-full md:w-auto">
          {hasReportees && (
            <div className="flex gap-2 bg-slate-700/30 rounded-lg p-1 border border-slate-700/50">
              <button onClick={() => setView('all')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  view === 'all'
                    ? 'bg-slate-800/50 shadow-sm text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}>
                Company View
              </button>
              <button onClick={() => setView('team')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  view === 'team'
                    ? 'bg-slate-800/50 shadow-sm text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}>
                My Team
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Selector */}
      <div className="flex gap-2 border-b border-slate-700/50">
        <button
          onClick={() => setDashboard('overview')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            dashboard === 'overview'
              ? 'border-teal-600 text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}>
          📋 Overview
        </button>
        <button
          onClick={() => setDashboard('team')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            dashboard === 'team'
              ? 'border-teal-600 text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}>
          👥 Team Performance
        </button>
        <button
          onClick={() => setDashboard('productivity')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            dashboard === 'productivity'
              ? 'border-teal-600 text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}>
          ⭐ User Productivity
        </button>
        <button
          onClick={() => setDashboard('time-tracking')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            dashboard === 'time-tracking'
              ? 'border-teal-600 text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}>
          ⏱️ Time Tracking
        </button>
      </div>

      {/* Render Dashboard Views */}
      {dashboard === 'overview' && (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard icon="📋" label="Total Tasks" value={summary.total_tasks} color="text-teal-400" />
              <StatCard icon="✅" label="Completed" value={summary.completed_tasks} color="text-green-400" />
              <StatCard icon="⚡" label="Active" value={summary.active_tasks} color="text-yellow-400" />
              <StatCard icon="⚠️" label="Overdue" value={summary.overdue_tasks} color="text-red-400" />
              <StatCard icon="⏱️" label="Total Hours" value={`${summary.total_hours_logged}h`} color="text-purple-400" />
              <StatCard icon="👥" label="Team Members" value={summary.team_member_count} color="text-cyan-400" />
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Time Tracking */}
        <ChartSection title="Daily Time Tracking (30 days)" description="Total hours logged per day">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyTracking}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartSection>

        {/* Task Priority Distribution */}
        <ChartSection title="Task Priority Distribution" description="Breakdown by priority level">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskPriority}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {taskPriority.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartSection>
      </div>

      {/* Time Spent by User */}
      <ChartSection title="⏱️ Time Spent by Team Member" description="Total hours logged per person">
        {timeSpent.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeSpent}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="user_name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_hours" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6">
              <Table
                columns={[
                  { key: 'user_name', label: 'Team Member' },
                  { key: 'total_hours', label: 'Hours', render: (v) => `${v}h` },
                  { key: 'total_minutes', label: 'Minutes', render: (v) => `${v}m` },
                  { key: 'task_count', label: 'Tasks Worked' },
                ]}
                data={timeSpent}
              />
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 py-8">No time tracking data available</p>
        )}
      </ChartSection>

      {/* Task Completion Metrics */}
      <ChartSection title="✅ Task Completion Metrics" description="Performance by team member">
        {taskCompletion.length > 0 ? (
          <Table
            columns={[
              { key: 'user_name', label: 'Team Member' },
              { key: 'completed_tasks', label: 'Completed' },
              { key: 'active_tasks', label: 'Active' },
              { key: 'overdue_tasks', label: 'Overdue' },
              { key: 'total_tasks', label: 'Total' },
              {
                key: 'completion_rate',
                label: 'Completion Rate',
                render: (v) => (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${v}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{v}%</span>
                  </div>
                ),
              },
            ]}
            data={taskCompletion}
          />
        ) : (
          <p className="text-center text-gray-500 py-8">No task data available</p>
        )}
      </ChartSection>

      {/* Deadline Performance */}
      <ChartSection title="📅 Deadline Performance" description="Early, On-time, and Late completions">
        {deadlinePerf.length > 0 ? (
          <Table
            columns={[
              { key: 'user_name', label: 'Team Member' },
              { key: 'early', label: 'Early ✅', render: (v) => <span className="text-green-400 font-medium">{v}</span> },
              { key: 'on_time', label: 'On Time ✓', render: (v) => <span className="text-teal-400 font-medium">{v}</span> },
              { key: 'late', label: 'Late ⚠️', render: (v) => <span className="text-red-400 font-medium">{v}</span> },
            ]}
            data={deadlinePerf}
          />
        ) : (
          <p className="text-center text-gray-500 py-8">No deadline data available</p>
        )}
      </ChartSection>

      {/* Performance Score */}
      {taskCompletion.length > 0 && timeSpent.length > 0 && (
        <ChartSection title="🏆 Performance Score" description="Overall performance ranking">
          <div className="space-y-3">
            {taskCompletion.map((user, idx) => {
              const timeData = timeSpent.find(t => t.user_id === user.user_id);
              const avgHoursPerTask = timeData ? (timeData.total_hours / user.total_tasks).toFixed(1) : 0;
              const score = Math.min(100, (user.completion_rate + (100 - Math.min(100, avgHoursPerTask * 10))) / 2);

              return (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-24">
                    <p className="text-sm font-medium text-slate-300 truncate">{user.user_name}</p>
                  </div>
                  <div className="flex-1">
                    <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-right">
                    <p className="text-sm font-bold text-white">{score.toFixed(0)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ChartSection>
      )}
        </>
      )}

      {/* Team Performance Dashboard */}
      {dashboard === 'team' && (
        <TeamPerformanceDashboard teamOnly={view === 'team'} />
      )}

      {/* User Productivity Dashboard */}
      {dashboard === 'productivity' && (
        <UserProductivityDashboard teamOnly={view === 'team'} />
      )}

      {/* Time Tracking Dashboard */}
      {dashboard === 'time-tracking' && (
        <TimeTrackingDashboard teamOnly={view === 'team'} />
      )}
    </div>
  );
}
