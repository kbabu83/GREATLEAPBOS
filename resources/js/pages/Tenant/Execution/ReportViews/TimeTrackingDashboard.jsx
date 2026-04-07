import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../services/api';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const USAGE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

function TimeCard({ title, value, unit, icon, color }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-lg border border-opacity-50 p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-opacity-70">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-opacity-70">{unit}</p>
          </div>
        </div>
        <div className="text-3xl opacity-50">{icon}</div>
      </div>
    </div>
  );
}

export default function TimeTrackingDashboard({ teamOnly }) {
  const [timeData, setTimeData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [taskData, setTaskData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [teamOnly]);

  const loadData = async () => {
    setLoading(true);
    try {
      const teamParam = teamOnly ? '&team_only=1' : '';
      const [timeRes, dailyRes, taskRes] = await Promise.all([
        api.get(`/tenant/execution/reports/time-spent?${teamParam}`),
        api.get(`/tenant/execution/reports/daily-tracking?days=30${teamParam}`),
        api.get(`/tenant/execution/reports/task-completion?${teamParam}`),
      ]);

      setTimeData(timeRes.data || []);
      setDailyData(dailyRes.data || []);
      setTaskData(taskRes.data || []);
    } catch (err) {
      console.error('Failed to load time tracking data', err);
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

  if (!timeData.length && !dailyData.length) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No time tracking data available</p>
      </div>
    );
  }

  // Calculate aggregate metrics
  const totalHours = timeData.reduce((sum, u) => sum + u.total_hours, 0);
  const totalMinutes = timeData.reduce((sum, u) => sum + u.total_minutes, 0);
  const avgHoursPerUser = (totalHours / (timeData.length || 1)).toFixed(1);
  const dailyAverage = (totalHours / (dailyData.length || 1)).toFixed(1);
  const maxHoursUser = timeData.reduce((max, u) => u.total_hours > max.total_hours ? u : max, timeData[0]);
  const minHoursUser = timeData.reduce((min, u) => u.total_hours < min.total_hours ? u : min, timeData[0]);

  // Calculate capacity utilization (assuming 40 hours/week = 8 hours/day standard)
  const expectedHours = dailyData.length * 8;
  const utilizationRate = ((totalHours / (expectedHours || 1)) * 100).toFixed(1);

  // Prepare data for charts
  const hoursPerUser = timeData.map(u => ({
    name: u.user_name.split(' ')[0],
    hours: parseFloat(u.total_hours),
    minutes: u.total_minutes,
    tasks: u.task_count
  })).sort((a, b) => b.hours - a.hours);

  // Prepare hourly distribution
  const dailyTrend = (dailyData || []).map(d => ({
    date: d.date ? d.date.substring(5) : 'N/A', // MM-DD format
    hours: parseFloat(d.hours || 0),
    tasks: d.tasks || 0
  }));

  // Calculate capacity bands
  const capacityBands = {
    underUtilized: timeData.filter(u => u.total_hours < 100).length,
    optimal: timeData.filter(u => u.total_hours >= 100 && u.total_hours <= 200).length,
    stretched: timeData.filter(u => u.total_hours > 200).length
  };

  // Create pie data for capacity distribution
  const capacityData = [
    { name: 'Under-utilized (<100h)', value: capacityBands.underUtilized, color: '#3b82f6' },
    { name: 'Optimal (100-200h)', value: capacityBands.optimal, color: '#10b981' },
    { name: 'Stretched (>200h)', value: capacityBands.stretched, color: '#ef4444' }
  ].filter(item => item.value > 0);

  // Task efficiency analysis
  const taskEfficiency = taskData.map(t => {
    const userTime = timeData.find(tu => tu.user_id === t.user_id);
    const avgHoursPerTask = userTime ? (userTime.total_hours / (t.total_tasks || 1)) : 0;
    return {
      name: t.user_name.split(' ')[0],
      hoursPerTask: avgHoursPerTask.toFixed(1),
      taskCount: t.total_tasks,
      completed: t.completed_tasks
    };
  }).sort((a, b) => parseFloat(a.hoursPerTask) - parseFloat(b.hoursPerTask));

  // Weekly pattern (simulate from daily data)
  const weeklyPattern = dailyTrend.slice(0, 7).map((d, idx) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx],
    hours: d.hours
  }));

  return (
    <div className="space-y-6">
      {/* Time Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <TimeCard
          title="Total Hours Logged"
          value={totalHours.toFixed(1)}
          unit="hours"
          icon="⏱️"
          color="from-blue-50 to-blue-100 text-blue-900 border-blue-200"
        />
        <TimeCard
          title="Avg per User"
          value={avgHoursPerUser}
          unit="hours"
          icon="👤"
          color="from-green-50 to-green-100 text-green-900 border-green-200"
        />
        <TimeCard
          title="Daily Average"
          value={dailyAverage}
          unit="hours/day"
          icon="📅"
          color="from-purple-50 to-purple-100 text-purple-900 border-purple-200"
        />
        <TimeCard
          title="Capacity Utilization"
          value={utilizationRate}
          unit="%"
          icon="📊"
          color="from-yellow-50 to-yellow-100 text-yellow-900 border-yellow-200"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Time Trend */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Time Logged Trend (30 days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyTrend}>
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
        </div>

        {/* Hours per User */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Hours Logged by Team Member</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hoursPerUser}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(value) => `${value}h`} />
              <Bar dataKey="hours" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Capacity Utilization Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Team Capacity Utilization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={capacityData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {capacityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Pattern */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Weekly Time Pattern</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={weeklyPattern}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => `${value}h`} />
              <Bar dataKey="hours" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Line type="monotone" dataKey="hours" stroke="#f59e0b" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Task Efficiency (Hours per Task) */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Task Efficiency (Hours per Task)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taskEfficiency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
              <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Bar dataKey="hoursPerTask" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Task Count with Hours */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Daily Hours & Task Count</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Tasks', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="hours" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="tasks" stroke="#ef4444" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Time Metrics Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Detailed Time Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Team Member</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Total Hours</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Total Minutes</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Tasks Worked</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Avg Hours/Task</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {timeData.map((user, idx) => {
                const avgPerTask = (user.total_hours / (user.task_count || 1)).toFixed(1);
                const utilization = ((user.total_hours / (dailyData.length * 8)) * 100).toFixed(0);
                return (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-700 font-medium">{user.user_name}</td>
                    <td className="px-4 py-3 text-gray-700">{user.total_hours.toFixed(1)}h</td>
                    <td className="px-4 py-3 text-gray-700">{user.total_minutes}m</td>
                    <td className="px-4 py-3 text-gray-700">{user.task_count}</td>
                    <td className="px-4 py-3 text-gray-700">{avgPerTask}h</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, utilization)}%`,
                              backgroundColor: utilization >= 80 ? '#ef4444' :
                                              utilization >= 60 ? '#f59e0b' : '#10b981'
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold">{utilization}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-700 font-semibold uppercase">Most Active</p>
          <p className="text-lg font-bold text-green-900 mt-2">{maxHoursUser?.user_name || 'N/A'}</p>
          <p className="text-xs text-green-700 mt-1">{maxHoursUser?.total_hours.toFixed(1) || 0}h logged</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-700 font-semibold uppercase">Total Team Capacity</p>
          <p className="text-lg font-bold text-blue-900 mt-2">{totalHours.toFixed(0)}h</p>
          <p className="text-xs text-blue-700 mt-1">Across {timeData.length} team members</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs text-yellow-700 font-semibold uppercase">Optimal Range</p>
          <p className="text-lg font-bold text-yellow-900 mt-2">{capacityBands.optimal}</p>
          <p className="text-xs text-yellow-700 mt-1">Users in 100-200h range</p>
        </div>
      </div>
    </div>
  );
}
