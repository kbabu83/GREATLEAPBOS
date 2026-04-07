import React from 'react';

export function StatCard({ title, value, subtitle, icon, color = 'primary', trend }) {
    const colorMap = {
        primary: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary/10 text-secondary',
        accent: 'bg-accent/10 text-accent',
        purple: 'bg-purple-100 text-purple-600',
        amber: 'bg-amber-100 text-amber-600',
        rose: 'bg-rose-100 text-rose-600',
    };

    return (
        <div className="stat-card">
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value?.toLocaleString()}</p>
                    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
                    {trend && (
                        <p className={`text-xs mt-2 font-medium ${trend.positive ? 'text-accent' : 'text-rose-600'}`}>
                            {trend.positive ? '↑' : '↓'} {trend.value}
                        </p>
                    )}
                </div>
                {icon && (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}

export function Card({ title, children, action, className = '' }) {
    return (
        <div className={`bg-white rounded-xl shadow-card border border-gray-100 ${className}`}>
            {(title || action) && (
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
                    {action}
                </div>
            )}
            <div className="p-6">{children}</div>
        </div>
    );
}
