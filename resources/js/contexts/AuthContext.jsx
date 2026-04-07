import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.get('/auth/me');
            setUser(response.data.user);
        } catch {
            localStorage.removeItem('auth_token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = useCallback(async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { user, token } = response.data;
        localStorage.setItem('auth_token', token);
        setUser(user);
        return user;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // ignore errors on logout
        } finally {
            localStorage.removeItem('auth_token');
            setUser(null);
        }
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data.user);
        } catch {
            // ignore
        }
    }, []);

    // Derived role flags — computed from the user object, not from the subdomain
    const isSuperAdmin  = user?.role === 'super_admin';
    const isTenantAdmin = user?.role === 'tenant_admin';
    const isStaff       = user?.role === 'staff';
    const isTenant      = isTenantAdmin || isStaff;   // any tenant-context user
    const tenantName    = user?.tenant_name ?? null;

    const value = {
        user,
        loading,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isSuperAdmin,
        isTenantAdmin,
        isStaff,
        isTenant,
        tenantName,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
