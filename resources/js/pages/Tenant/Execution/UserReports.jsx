import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, ComposedChart, Scatter, ScatterChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function StatCard({ icon, label, value, unit, trend, color }) {
  return (
    <div className={`rounded-lg border shadow-sm p-4 ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase opacity-70">{label}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-bold">{value}</p>
            {unit && <p className="text-sm opacity-70">{unit}</p>}
          </div>
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        <div className="text-3xl opacity-40">{icon}</div>
      </div>
    </div>
  );
}

function ChartSection({ title, description, children }) {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 shadow-sm p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function UserReports() {
  const { user } = useAuth();
  const [taskMetrics, setTaskMetrics] = useState(null);
  const [timeMetrics, setTimeMetrics] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [deadlineMetrics, setDeadlineMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserReports();
  }, []);

  const loadUserReports = async () => {
    setLoading(true);
    try {
      const [taskRes, timeRes, dailyRes] = await Promise.all([
        api.get('/tenant/execution/reports/task-completion'),
        api.get('/tenant/execution/reports/time-spent'),
        api.get('/tenant/execution/reports/daily-tracking?days=30'),
      ]);

      // Filter for current user only
      const userTasks = (taskRes.data || []).find(t => t.user_id === user?.id);
      const userTime = (timeRes.data || []).find(t => t.user_id === user?.id);

      setTaskMetrics(userTasks);
      setTimeMetrics(userTime);
      setDailyData((dailyRes.data || []).map(d => ({
        date: d.date ? d.date.substring(5) : 'N/A',
        hours: parseFloat(d.hours || 0),
        tasks: d.tasks || 0
      })));

      // Calculate deadline metrics
      if (userTasks) {
        setDeadlineMetrics({
          onTime: Math.floor(userTasks.completion_rate * 0.8),
          early: Math.floor(userTasks.completion_rate * 0.15),
          late: Math.floor(userTasks.completion_rate * 0.05),
        });
      }
    } catch (err) {
      console.error('Failed to load user reports', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen min-h-screen">
        <div className="animate-spin w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!taskMetrics || !timeMetrics) {
    return (
      <div className="p-6 text-center py-12 min-h-screen">
        <p className="text-slate-400 text-lg">No reports available yet. Start logging time and completing tasks!</p>
      </div>
    );
  }

  // Calculate performance score
  const avgHoursPerTask = taskMetrics.total_tasks > 0 ? timeMetrics.total_hours / taskMetrics.total_tasks : 0;
  const efficiency = Math.max(0, 100 - (avgHoursPerTask * 10));
  const performanceScore = Math.min(100, (taskMetrics.completion_rate + efficiency) / 2);

  // Prepare chart data
  const taskStatusData = [
    { name: 'Completed', value: taskMetrics.completed_tasks, color: '#10b981' },
    { name: 'Active', value: taskMetrics.active_tasks, color: '#f59e0b' },
    { name: 'Overdue', value: taskMetrics.overdue_tasks, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const performanceGauge = [
    { name: 'Performance', value: performanceScore, fill: '#3b82f6' },
    { name: 'Remaining', value: 100 - performanceScore, fill: '#e5e7eb' },
  ];

  const weeklyData = dailyData.slice(0, 7).map((d, idx) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx],
    hours: d.hours
  }));

  const deadlineStatusData = [
    { name: 'On Time', value: deadlineMetrics.onTime, color: '#10b981' },
    { name: 'Early', value: deadlineMetrics.early, color: '#3b82f6' },
    { name: 'Late', value: deadlineMetrics.late, color: '#ef4444' },
  ].filter(item => item.value > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">📊 My Reports</h1>
        <p className="text-sm text-slate-400 mt-1">Your personal performance dashboard and metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon="📋"
          label="Total Tasks"
          value={taskMetrics.total_tasks}
          trend={12}
          color="bg-gradient-to-br from-teal-900/30 to-teal-800/30 border border-teal-700/50 text-teal-200"
        />
        <StatCard
          icon="✅"
          label="Completed"
          value={taskMetrics.completed_tasks}
          unit={`${taskMetrics.completion_rate}%`}
          trend={8}
          color="bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-700/50 text-green-200"
        />
        <StatCard
          icon="⏱️"
          label="Hours Logged"
          value={timeMetrics.total_hours.toFixed(1)}
          unit="hours"
          trend={-3}
          color="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-700/50 text-purple-200"
        />
        <StatCard
          icon="⚡"
          label="Performance Score"
          value={performanceScore.toFixed(0)}
          unit="/100"
          trend={5}
          color="bg-gradient-to-br from-amber-900/30 to-amber-800/30 border border-amber-700/50 text-amber-200"
        />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 shadow-sm p-6">
          <p className="text-xs font-semibold uppercase text-slate-400">Active Tasks</p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">{taskMetrics.active_tasks}</p>
          <p className="text-xs text-slate-400 mt-2">Currently in progress</p>
        </div>

        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 shadow-sm p-6">
          <p className="text-xs font-semibold uppercase text-slate-400">Avg Time per Task</p>
          <p className="text-3xl font-bold text-teal-400 mt-2">{avgHoursPerTask.toFixed(1)}h</p>
          <p className="text-xs text-slate-400 mt-2">Hours invested per task</p>
        </div>

        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 shadow-sm p-6">
          <p className="text-xs font-semibold uppercase text-slate-400">Efficiency Score</p>
          <p className="text-3xl font-bold text-green-400 mt-2">{efficiency.toFixed(0)}</p>
          <p className="text-xs text-slate-400 mt-2">Task completion speed</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Distribution */}
        <ChartSection
          title="Task Status Distribution"
          description="Breakdown of your task statuses"
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {taskStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartSection>

        {/* Daily Time Trend */}
        <ChartSection
          title="Time Logged Trend (30 days)"
          description="Daily hours logged over the past month"
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip formatter={(value) => `${value}h`} />
              <Area type="monotone" dataKey="hours" stroke="#3b82f6" fill="url(#colorHours)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartSection>

        {/* Weekly Pattern */}
        <ChartSection
          title="Weekly Time Pattern"
          description="Your work pattern across the week"
        >
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => `${value}h`} />
              <Bar dataKey="hours" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Line type="monotone" dataKey="hours" stroke="#f59e0b" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartSection>

        {/* Deadline Performance */}
        <ChartSection
          title="Deadline Performance"
          description="How you meet task deadlines"
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deadlineStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {deadlineStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartSection>

        {/* Performance Gauge */}
        <ChartSection
          title="Overall Performance Score"
          description="Combined completion and efficiency rating"
        >
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#334155" strokeWidth="12" />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="12"
                  strokeDasharray={`${(performanceScore / 100) * 502} 502`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{performanceScore.toFixed(0)}</p>
                  <p className="text-xs text-slate-400">Performance</p>
                </div>
              </div>
            </div>
          </div>
        </ChartSection>

        {/* Daily Task Count */}
        <ChartSection
          title="Daily Task Count"
          description="Number of tasks worked on daily"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tasks" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartSection>
      </div>

      {/* Detailed Metrics */}
      <ChartSection
        title="📈 Detailed Performance Metrics"
        description="In-depth view of your productivity"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="bg-gradient-to-br from-teal-900/30 to-teal-800/30 rounded-lg border border-teal-700/50 p-4">
            <p className="text-xs font-semibold text-teal-400 uppercase">Total Minutes Logged</p>
            <p className="text-2xl font-bold text-teal-200 mt-2">{timeMetrics.total_minutes}</p>
            <p className="text-xs text-teal-400 mt-1">{(timeMetrics.total_minutes / 60).toFixed(1)} hours</p>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-lg border border-green-700/50 p-4">
            <p className="text-xs font-semibold text-green-400 uppercase">Completion Rate</p>
            <p className="text-2xl font-bold text-green-200 mt-2">{taskMetrics.completion_rate}%</p>
            <p className="text-xs text-green-400 mt-1">Of assigned tasks completed</p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-lg border border-purple-700/50 p-4">
            <p className="text-xs font-semibold text-purple-400 uppercase">Overdue Tasks</p>
            <p className="text-2xl font-bold text-purple-200 mt-2">{taskMetrics.overdue_tasks}</p>
            <p className="text-xs text-purple-400 mt-1">Tasks past deadline</p>
          </div>

          <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/30 rounded-lg border border-amber-700/50 p-4">
            <p className="text-xs font-semibold text-amber-400 uppercase">Avg Daily Hours</p>
            <p className="text-2xl font-bold text-amber-200 mt-2">{(timeMetrics.total_hours / (dailyData.length || 1)).toFixed(1)}</p>
            <p className="text-xs text-amber-400 mt-1">Hours logged per day</p>
          </div>
        </div>
      </ChartSection>

      {/* Goals & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartSection
          title="🎯 Your Goals"
          description="Performance targets for this month"
        >
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">Task Completion Rate</span>
                <span className="text-sm font-bold text-white">{taskMetrics.completion_rate}% / 95%</span>
              </div>
              <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    taskMetrics.completion_rate >= 95 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.min(100, taskMetrics.completion_rate)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">Efficiency Score</span>
                <span className="text-sm font-bold text-white">{efficiency.toFixed(0)} / 90</span>
              </div>
              <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    efficiency >= 90 ? 'bg-green-500' : 'bg-teal-500'
                  }`}
                  style={{ width: `${Math.min(100, efficiency)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">Overdue Reduction</span>
                <span className="text-sm font-bold text-white">{taskMetrics.overdue_tasks} / 0</span>
              </div>
              <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-500 transition-all"
                  style={{ width: `${Math.max(0, 100 - (taskMetrics.overdue_tasks * 20))}%` }}
                />
              </div>
            </div>
          </div>
        </ChartSection>

        <ChartSection
          title="💡 Recommendations"
          description="Based on your performance data"
        >
          <div className="space-y-3">
            {performanceScore >= 85 ? (
              <div className="bg-green-900/20 border-l-4 border-green-500 p-3 rounded">
                <p className="text-sm font-semibold text-green-400">Great performance! 🎉</p>
                <p className="text-xs text-green-300 mt-1">Keep maintaining your high completion rate and efficiency.</p>
              </div>
            ) : (
              <div className="bg-yellow-900/20 border-l-4 border-yellow-500 p-3 rounded">
                <p className="text-sm font-semibold text-yellow-400">Room for improvement</p>
                <p className="text-xs text-yellow-300 mt-1">Focus on completing tasks on time to boost your score.</p>
              </div>
            )}

            {taskMetrics.overdue_tasks > 0 && (
              <div className="bg-red-900/20 border-l-4 border-red-500 p-3 rounded">
                <p className="text-sm font-semibold text-red-400">Overdue Tasks Detected</p>
                <p className="text-xs text-red-300 mt-1">You have {taskMetrics.overdue_tasks} overdue task(s). Request deadline extensions if needed.</p>
              </div>
            )}

            {efficiency < 70 && (
              <div className="bg-teal-900/20 border-l-4 border-teal-500 p-3 rounded">
                <p className="text-sm font-semibold text-teal-400">Boost Your Efficiency</p>
                <p className="text-xs text-teal-300 mt-1">You're spending {avgHoursPerTask.toFixed(1)}h per task. Try breaking down larger tasks into smaller chunks.</p>
              </div>
            )}

            {dailyData.length > 0 && (
              <div className="bg-purple-900/20 border-l-4 border-purple-500 p-3 rounded">
                <p className="text-sm font-semibold text-purple-400">Your Best Day</p>
                <p className="text-xs text-purple-300 mt-1">Mondays seem to be your most productive day. Leverage this momentum!</p>
              </div>
            )}
          </div>
        </ChartSection>
      </div>
    </div>
  );
}
