import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const TEAM_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

function ScoreGauge({ score, label }) {
  const getColor = () => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="text-center">
      <svg viewBox="0 0 200 120" className="w-24 h-16 mx-auto">
        {/* Background arc */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" stroke="#e5e7eb" strokeWidth="8" fill="none" />
        {/* Score arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          stroke={getColor()}
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${(score / 100) * 160} 160`}
          strokeLinecap="round"
        />
        {/* Score text */}
        <text x="100" y="85" textAnchor="middle" className="text-lg font-bold" fill="#1f2937">
          {score}
        </text>
      </svg>
      <p className="text-xs text-gray-600 mt-2 font-medium">{label}</p>
    </div>
  );
}

function TeamMemberCard({ member, index }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: TEAM_COLORS[index % TEAM_COLORS.length] }}
          >
            {member.user_name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{member.user_name}</p>
            <p className="text-xs text-gray-500">
              {member.completed_tasks} of {member.total_tasks} completed
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-lg font-bold ${
            member.completion_rate >= 80 ? 'text-green-600' :
            member.completion_rate >= 60 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {member.completion_rate}%
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-blue-50 rounded p-2 text-center">
          <p className="text-xs text-gray-600">Hours</p>
          <p className="text-sm font-bold text-blue-600">{member.total_hours || 0}h</p>
        </div>
        <div className="bg-yellow-50 rounded p-2 text-center">
          <p className="text-xs text-gray-600">Active</p>
          <p className="text-sm font-bold text-yellow-600">{member.active_tasks}</p>
        </div>
        <div className="bg-red-50 rounded p-2 text-center">
          <p className="text-xs text-gray-600">Overdue</p>
          <p className="text-sm font-bold text-red-600">{member.overdue_tasks}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-600">Completion</span>
          <span className="text-xs font-semibold text-gray-700">{member.completed_tasks}/{member.total_tasks}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${member.completion_rate}%`,
              backgroundColor: member.completion_rate >= 80 ? '#10b981' :
                                member.completion_rate >= 60 ? '#f59e0b' : '#ef4444'
            }}
          />
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-1">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
          ✅ {member.completed_tasks} Done
        </span>
        {member.active_tasks > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            ⚡ {member.active_tasks} Active
          </span>
        )}
        {member.overdue_tasks > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
            ⚠️ {member.overdue_tasks} Late
          </span>
        )}
      </div>
    </div>
  );
}

export default function TeamPerformanceDashboard({ teamOnly }) {
  const [data, setData] = useState(null);
  const [timeData, setTimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('completion_rate');

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

      // Merge data
      const merged = taskRes.data.map(task => ({
        ...task,
        ...timeRes.data.find(t => t.user_id === task.user_id) || { total_hours: 0 }
      }));

      setData(merged);
      setTimeData(timeRes.data || []);
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
        <p className="text-gray-500">No team data available</p>
      </div>
    );
  }

  // Calculate team metrics
  const avgCompletion = (data.reduce((sum, m) => sum + m.completion_rate, 0) / data.length).toFixed(1);
  const totalCompleted = data.reduce((sum, m) => sum + m.completed_tasks, 0);
  const totalActive = data.reduce((sum, m) => sum + m.active_tasks, 0);
  const totalOverdue = data.reduce((sum, m) => sum + m.overdue_tasks, 0);
  const teamScore = Math.min(100, (avgCompletion + (100 - Math.min(100, totalOverdue * 5))) / 2);

  // Prepare radar chart data
  const radarData = data.map(m => ({
    name: m.user_name.split(' ')[0],
    completion: m.completion_rate,
    efficiency: Math.min(100, 100 - (m.overdue_tasks * 10)),
    capacity: Math.min(100, (m.total_hours / 200) * 100),
  }));

  return (
    <div className="space-y-6">
      {/* Team KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Team Score</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">{teamScore.toFixed(0)}</p>
          <p className="text-xs text-blue-600 mt-1">Overall performance</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">Avg Completion</p>
          <p className="text-3xl font-bold text-green-900 mt-2">{avgCompletion}%</p>
          <p className="text-xs text-green-600 mt-1">Tasks completed</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
          <p className="text-xs text-purple-700 font-semibold uppercase tracking-wide">Team Size</p>
          <p className="text-3xl font-bold text-purple-900 mt-2">{data.length}</p>
          <p className="text-xs text-purple-600 mt-1">Members</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
          <p className="text-xs text-red-700 font-semibold uppercase tracking-wide">Attention</p>
          <p className="text-3xl font-bold text-red-900 mt-2">{totalOverdue}</p>
          <p className="text-xs text-red-600 mt-1">Overdue tasks</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Rate Comparison */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Completion Rate by Team Member</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="user_name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="completion_rate" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hours Logged Comparison */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Total Hours Logged</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="user_name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip formatter={(value) => `${value}h`} />
              <Bar dataKey="total_hours" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Team Radar Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Team Performance Radar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Completion" dataKey="completion" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
              <Radar name="Efficiency" dataKey="efficiency" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Task Distribution Scatter */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Workload Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="total_tasks"
                name="Total Tasks"
                unit=" tasks"
                type="number"
              />
              <YAxis
                dataKey="total_hours"
                name="Hours Logged"
                unit="h"
                type="number"
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter
                name="Team Members"
                data={data}
                fill="#8b5cf6"
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Member Cards */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Individual Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((member, idx) => (
            <TeamMemberCard key={member.user_id} member={member} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}
