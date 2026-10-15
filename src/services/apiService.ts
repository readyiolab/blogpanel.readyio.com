import axios from 'axios';
import type { Article, Category, CommentRecord, ActivityLog, RoleRecord, PaginationMeta } from '@/types';
import axiosRetry from 'axios-retry';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';
const BLOG_SITE_URL = (import.meta.env.VITE_BLOG_SITE_URL ?? 'https://blog.zuvigo.com').replace(/\/$/, '');
export const getApiBaseUrl = () => API_BASE_URL;
export const getBlogSiteUrl = () => BLOG_SITE_URL;
export const getArticleLiveUrl = (slug: string) => `${BLOG_SITE_URL}/${slug}`;

type ApiResponse<T> = {
    success: boolean;
    data: T;
    message?: string;
};

type PaginatedApiResponse<T> = ApiResponse<T> & {
    pagination?: PaginationMeta;
};

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Configure retry mechanism
axiosRetry(api, {
    retries: 3,
    retryDelay: (retryCount) => {
        return retryCount * 1000;
    },
    retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) || (error.response?.status ? error.response.status >= 500 : false);
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('permissions');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authService = {
    login: (credentials: { email: string; password: string }) => api.post('/auth/login', credentials),
    getProfile: () => api.get<ApiResponse<unknown>>('/auth/profile'),
    updateProfile: (data: any) => api.put<ApiResponse<unknown>>('/auth/profile', data),
    logout: () => api.post('/auth/logout'),
};

export const articleService = {
    getAdminList: (params?: { limit?: number; page?: number; status?: string }) =>
        api.get<PaginatedApiResponse<Article[]>>('/articles/manage', { params }),
    getMyArticles: (params?: { limit?: number; page?: number }) =>
        api.get<PaginatedApiResponse<Article[]>>('/articles/my-articles', { params }),
    getById: (id: number) => api.get<ApiResponse<Article>>(`/articles/id/${id}`),
    create: (data: Record<string, unknown>) => api.post('/articles', data),
    update: (id: number, data: Record<string, unknown>) => api.put(`/articles/${id}`, data),
    delete: (id: number) => api.delete(`/articles/${id}`),
    publish: (id: number) => api.put(`/articles/${id}/publish`),
    uploadImage: (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        return api.post<ApiResponse<{ url: string }>>('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

export const commentService = {
    getAll: (params?: { limit?: number; page?: number }) =>
        api.get<PaginatedApiResponse<CommentRecord[]>>('/comments/admin', { params }),
    approve: (id: number) => api.put(`/comments/${id}/approve`),
    reject: (id: number) => api.put(`/comments/${id}/reject`),
    delete: (id: number) => api.delete(`/comments/${id}`),
};

export const categoryService = {
    getAll: () => api.get<ApiResponse<Category[]>>('/categories'),
    create: (data: Record<string, unknown>) => api.post('/categories', data),
    update: (id: number, data: Record<string, unknown>) => api.put(`/categories/${id}`, data),
    delete: (id: number) => api.delete(`/categories/${id}`),
};

export const adminService = {
    getDashboard: () => api.get<ApiResponse<Record<string, number>>>('/admin/dashboard'),
    getAnalytics: () => api.get<ApiResponse<Record<string, number>>>('/admin/analytics'),
    getLogs: (params?: { limit?: number; page?: number }) =>
        api.get<PaginatedApiResponse<ActivityLog[]>>('/admin/logs', { params }),
    getNewsletterSubscribers: (params?: { limit?: number; page?: number }) =>
        api.get<PaginatedApiResponse<any[]>>('/admin/newsletter-subscribers', { params }),
};

export const userService = {
    getAll: (params?: { limit?: number; page?: number }) =>
        api.get<PaginatedApiResponse<Array<Record<string, unknown>>>>('/users', { params }),
    getRoles: () => api.get<ApiResponse<RoleRecord[]>>('/users/roles'),
    create: (data: Record<string, unknown>) => api.post('/users', data),
    update: (id: number, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
    delete: (id: number) => api.delete(`/users/${id}`),
    createRole: (data: Record<string, unknown>) => api.post('/users/roles', data),
    updateRole: (id: number, data: Record<string, unknown>) => api.put(`/users/roles/${id}`, data),
    deleteRole: (id: number) => api.delete(`/users/roles/${id}`),
};

export default api;
