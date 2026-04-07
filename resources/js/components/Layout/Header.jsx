import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

function MenuIcon() {
    return (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );
}

const pageTitles = {
    '/dashboard': 'Dashboard',
    '/tenants': 'Tenants',
    '/users': 'Users',
};

export default function Header({ onMenuClick }) {
    const { user } = useAuth();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();

    const title = pageTitles[location.pathname] || 'GREAT LEAP WORK';

    return (
        <header className="bg-gradient-to-r from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 border-b border-gray-200 dark:border-slate-700/50 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
                {/* Mobile menu button */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-1.5 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/50 transition-colors"
                >
                    <MenuIcon />
                </button>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
            </div>

            <div className="flex items-center gap-3">
                {/* Tenant badge */}
                {window.__APP_CONFIG__?.isTenant && (
                    <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-500/20 text-lime-700 dark:text-lime-300 text-xs font-medium border border-lime-400/50 dark:border-lime-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-lime-500 dark:bg-lime-400"></span>
                        {window.__APP_CONFIG__?.tenantName}
                    </span>
                )}

                {/* Theme toggle button */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/50 transition-colors"
                    title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
                >
                    {theme === 'dark' ? '☀️' : '🌙'}
                </button>

                {/* User avatar */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-400 to-teal-600 flex items-center justify-center">
                        <span className="text-slate-900 text-sm font-semibold">
                            {user?.name?.charAt(0)?.toUpperCase()}
                        </span>
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{user?.name}</p>
                        <p className="text-xs text-gray-600 dark:text-slate-400">{user?.role_display}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
