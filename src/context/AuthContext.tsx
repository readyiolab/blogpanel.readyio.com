import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthState, Role } from '../types';
import { authService } from '../services/apiService';

interface AuthContextType extends AuthState {
    login: (credentials: { email: string; password: string }) => Promise<void>;
    logout: () => Promise<void>;
    updateUserInfo: (userData: any) => void;
    hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeRole = (value: unknown): Role | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim().toLowerCase();
    const roleMap: Record<string, Role> = {
        admin: 'Admin',
        editor: 'Editor',
        reporter: 'Reporter',
        author: 'Author',
        user: 'User',
    };

    return roleMap[normalized] ?? null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        token: null,
        permissions: [],
        isAuthenticated: false,
        isLoading: true,
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userJson = localStorage.getItem('user');
        const permissionsJson = localStorage.getItem('permissions');

        if (token && userJson) {
            try {
                const user = JSON.parse(userJson);
                const permissions = permissionsJson ? JSON.parse(permissionsJson) : [];
                const normalizedRole = normalizeRole(user?.role) || normalizeRole(user?.role_name);

                if (user && normalizedRole) {
                    user.role = normalizedRole;
                }

                setState({
                    token,
                    user,
                    permissions,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } catch {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('permissions');
                setState(prev => ({ ...prev, isLoading: false }));
            }
        } else {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, []);

    const login = async (credentials: { email: string; password: string }) => {
        try {
            const response = await authService.login(credentials);
            const { token, user, permissions = [] } = response.data.data;
            const normalizedUser = {
                ...user,
                role: normalizeRole(user?.role) || normalizeRole(user?.role_name) || 'User',
            };

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(normalizedUser));
            localStorage.setItem('permissions', JSON.stringify(permissions));

            setState({
                user: normalizedUser,
                token,
                permissions,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error: unknown) {
            const message =
                typeof error === 'object' &&
                    error !== null &&
                    'response' in error &&
                    typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
                    ? (error as { response: { data: { message: string } } }).response.data.message
                    : 'Login failed';
            throw new Error(message);
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error', error);
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('permissions');
            setState({
                user: null,
                token: null,
                permissions: [],
                isAuthenticated: false,
                isLoading: false,
            });
        }
    };

    const updateUserInfo = (userData: any) => {
        const newUser = { ...state.user, ...userData };
        localStorage.setItem('user', JSON.stringify(newUser));
        setState(prev => ({ ...prev, user: newUser }));
    };

    const hasPermission = (permission: string) => state.permissions.includes(permission);

    return (
        <AuthContext.Provider value={{ ...state, login, logout, updateUserInfo, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
