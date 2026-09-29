export type Role = 'Admin' | 'Editor' | 'Reporter' | 'Author' | 'User';

export interface User {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: Role;
    profileImage?: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    permissions: string[];
    isAuthenticated: boolean;
    isLoading: boolean;
}

export interface ArticleTag {
    name: string;
    slug: string;
}

export interface Article {
    id: number;
    title: string;
    slug: string;
    excerpt?: string;
    content?: string;
    featured_image?: string;
    featured_image_alt?: string | null;
    category_id?: number;
    category_name?: string;
    author_id?: number;
    author_name?: string;
    status: 'draft' | 'pending' | 'published' | 'archived';
    views_count?: number;
    created_at?: string;
    updated_at?: string;
    published_at?: string | null;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string | null;
    canonical_url?: string | null;
    is_featured?: boolean;
    tags?: ArticleTag[];
}

export interface Category {
    id: number;
    category_name: string;
    slug: string;
    description?: string;
    article_count?: number;
    status?: 'active' | 'inactive';
}

export interface CommentRecord {
    id: number;
    article_id: number;
    article_title: string;
    user_id: number;
    username: string;
    comment_text: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export interface ActivityLog {
    id: number;
    user_id: number | null;
    username?: string;
    action: string;
    entity_type?: string;
    entity_id?: number;
    description?: string;
    ip_address?: string;
    created_at: string;
}

export interface RoleRecord {
    id: number;
    role_name: Role;
    description?: string;
}

export interface PaginationMeta {
    currentPage: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
}
