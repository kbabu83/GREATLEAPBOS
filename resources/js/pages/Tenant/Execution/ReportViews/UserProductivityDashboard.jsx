import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, Area, AreaChart
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function ProductivityScore({ score, label }) {
  const getColor = () => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="text-center">
      <svg viewBox="0 0 200 120" className="w-24 h-16 mx-auto">
        <path d="M 20 100 A 80 80 0 0 1 180 100" stroke="#e5e7eb" strokeWidth="8" fill="none" />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          stroke={getColor()}
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${(score / 100) * 160} 160`}
          strokeLinecap="round"
        />
        <text x="100" y="85" textAnchor="middle" className="text-lg font-bold" fill="#1f2937">
          {score}
        </text>
      </svg>
      <p className="text-xs text-gray-600 mt-2 font-medium">{label}</p>
    </div>
  );
}

function MetricCard({ title, value, unit, trend, icon }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{unit}</p>
          </div>
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last week
            </p>
          )}
        </div>
        <div className="text-3xl opacity-30">{icon}</div>
      </div>
    </div>
  );
}

export default function UserProductivityDashboard({ teamOnly }) {
  const [data, setData] = useState(null);
  const [timeData, setTimeData] = useState([]);
  const [taskData, setTaskData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [teamOnly]);

  const loadData = async () => {
    setLoading(true);
    try {
      const teamParam = teamOnly ? '&team_only=1' : '';
      const [taskRes, timeRes] = await Promise.all([
        api.get(`/tenant/execution/reports/task-completion?${teamParam}`),
        api.get(`/tenant/execution/reports/time-spent?${teamParam}`),
      ]);

      setTaskData(taskRes.data || []);
      setTimeData(timeRes.data || []);

      // Calculate merged data with productivity metrics
      const merged = (taskRes.data || []).map(task => {
        const timeInfo = (timeRes.data || []).find(t => t.user_id === task.user_id) || { total_hours: 0, task_count: 0 };
        const avgHoursPerTask = task.total_tasks > 0 ? timeInfo.total_hours / task.total_tasks : 0;
        const efficiency = Math.max(0, 100 - (avgHoursPerTask * 10));
        const quality = Math.min(100, (task.completion_rate + efficiency) / 2);

        return {
          ...task,
          ...timeInfo,
          efficiency: efficiency.toFixed(0),
          quality: quality.toFixed(0),
          avgHoursPerTask: avgHoursPerTask.toFixed(1)
        };
      });

      setData(merged);
    } catch (err) {
      console.error('Failed to load dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No user productivity data available</p>
      </div>
    );
  }

  // Calculate overall productivity metrics
  const avgCompletion = (data.reduce((sum, u) => sum + u.completion_rate, 0) / data.length).toFixed(1);
  const avgEfficiency = (data.reduce((sum, u) => sum + parseInt(u.efficiency), 0) / data.length).toFixed(0);
  const topPerformer = data.reduce((max, u) => parseInt(u.quality) > parseInt(max.quality) ? u : max);
  const avgTaskTime = (data.reduce((sum, u) => sum + parseFloat(u.avgHoursPerTask), 0) / data.length).toFixed(1);

  // Prepare data for various charts
  const productivityByUser = data.map(u => ({
    name: u.user_name.split(' ')[0],
    completion: u.completion_rate,
    efficiency: parseInt(u.efficiency),
    quality: parseInt(u.quality)
  }));

  const taskComparisonData = data.map(u => ({
    name: u.user_name.split(' ')[0],
    completed: u.completed_tasks,
    active: u.active_tasks,
    overdue: u.overdue_tasks
  }));

  const hoursVsTasksData = data.map(u => ({
    name: u.user_name.split(' ')[0],
    hours: parseFloat(u.total_hours),
    tasks: u.total_tasks,
    efficiency: parseInt(u.efficiency)
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Avg Completion Rate"
          value={avgCompletion}
          unit="%"
          trend={5}
          icon="📊"
        />
        <MetricCard
          title="Avg Efficiency"
          value={avgEfficiency}
          unit="/100"
          trend={3}
          icon="⚡"
        />
        <MetricCard
          title="Avg Time per Task"
          value={avgTaskTime}
          unit="hours"
          trend={-2}
          icon="⏱️"
        />
        <MetricCard
          title="Top Performer"
          value={topPerformer.user_name.split(' ')[0]}
          unit={`${topPerformer.quality}pts`}
          trend={8}
          icon="🏆"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Score Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Productivity Scores</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productivityByUser}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="quality" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Efficiency vs Completion */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Efficiency vs Completion</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={productivityByUser}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completion" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Line type="monotone" dataKey="efficiency" stroke="#f59e0b" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Task Status Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Task Status by User</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taskComparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="active" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              <Bar dataKey="overdue" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hours vs Tasks Scatter */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Workload Efficiency</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="tasks"
                name="Tasks Completed"
                unit=" tasks"
                type="number"
              />
              <YAxis
                dataKey="hours"
                name="Hours Logged"
                unit="h"
                type="number"
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter
                name="Users"
                data={hoursVsTasksData}
                fill="#8b5cf6"
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed User Performance Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Individual Performance Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Completion %</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Efficiency</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Quality Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Hours</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Tasks</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Avg Time/Task</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((user, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-700 font-medium">{user.user_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${user.completion_rate}%`,
                            backgroundColor: user.completion_rate >= 80 ? '#10b981' :
                                            user.completion_rate >= 60 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold">{user.completion_rate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{user.efficiency}/100</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      user.quality >= 85 ? 'bg-green-100 text-green-800' :
                      user.quality >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.quality}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{user.total_hours}h</td>
                  <td className="px-4 py-3 text-gray-700">{user.total_tasks}</td>
                  <td className="px-4 py-3 text-gray-700">{user.avgHoursPerTask}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Productivity Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-700 font-semibold uppercase">Top Performers</p>
          <ul className="mt-3 space-y-2">
            {data.sort((a, b) => parseInt(b.quality) - parseInt(a.quality)).slice(0, 3).map((user, idx) => (
              <li key={idx} className="text-sm text-green-900">
                <span className="font-semibold">{user.user_name}</span>
                <span className="text-xs text-green-700 ml-2">({user.quality}pts)</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-700 font-semibold uppercase">Most Efficient</p>
          <ul className="mt-3 space-y-2">
            {data.sort((a, b) => parseInt(b.efficiency) - parseInt(a.efficiency)).slice(0, 3).map((user, idx) => (
              <li key={idx} className="text-sm text-blue-900">
                <span className="font-semibold">{user.user_name}</span>
                <span className="text-xs text-blue-700 ml-2">({user.efficiency}/100)</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
          <p className="text-xs text-purple-700 font-semibold uppercase">Busiest Users</p>
          <ul className="mt-3 space-y-2">
            {data.sort((a, b) => b.total_hours - a.total_hours).slice(0, 3).map((user, idx) => (
              <li key={idx} className="text-sm text-purple-900">
                <span className="font-semibold">{user.user_name}</span>
                <span className="text-xs text-purple-700 ml-2">({user.total_hours}h)</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
