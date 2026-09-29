import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { AuthProvider } from '@/context/AuthContext';

const ArticleEditor = lazy(() => import('@/pages/ArticleEditor'));
const ArticleList = lazy(() => import('@/pages/ArticleList'));
const AuditLogs = lazy(() => import('@/pages/AuditLogs'));
const CategoryList = lazy(() => import('@/pages/CategoryList'));
const CommentList = lazy(() => import('@/pages/CommentList'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const UserList = lazy(() => import('@/pages/UserList'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const RoleList = lazy(() => import('@/pages/RoleList'));
const NewsletterList = lazy(() => import('@/pages/NewsletterList'));

const LoadingFallback = () => (
    <div className="flex h-screen items-center justify-center">Loading...</div>
);


function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route
                            path="/unauthorized"
                            element={
                                <div className="flex h-screen items-center justify-center font-bold text-destructive">
                                    403 - Unauthorized Access
                                </div>
                            }
                        />
                        <Route
                            element={
                                <ProtectedRoute>
                                    <DashboardLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route
                                path="/articles"
                                element={
                                    <ProtectedRoute allowedRoles={['Admin', 'Editor']}>
                                        <ArticleList />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/articles/pending"
                                element={
                                    <ProtectedRoute allowedRoles={['Admin', 'Editor']}>
                                        <ArticleList status="pending" />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/my-articles"
                                element={
                                    <ProtectedRoute allowedRoles={['Reporter', 'Author']}>
                                        <ArticleList ownOnly />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/articles/create"
                                element={
                                    <ProtectedRoute allowedRoles={['Admin', 'Editor', 'Reporter', 'Author']}>
                                        <ArticleEditor />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/articles/edit/:id"
                                element={
                                    <ProtectedRoute allowedRoles={['Admin', 'Editor', 'Reporter', 'Author']}>
                                        <ArticleEditor />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/categories"
                                element={
                                    <ProtectedRoute allowedRoles={['Admin', 'Editor']}>
                                        <CategoryList />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/comments"
                                element={
                                    <ProtectedRoute allowedRoles={['Admin', 'Editor']}>
                                        <CommentList />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/newsletter"
                                element={
                                    <ProtectedRoute allowedRoles={['Admin', 'Editor']}>
                                        <NewsletterList />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/users"
                                element={
                                    <ProtectedRoute allowedRoles={['Admin', 'Editor']}>
                                        <UserList />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/roles"
                                element={
                                    <ProtectedRoute allowedRoles={['Admin']}>
                                        <RoleList />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/logs"
                                element={
                                    <ProtectedRoute allowedRoles={['Admin']}>
                                        <AuditLogs />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route
                                path="/settings"
                                element={
                                    <ProtectedRoute allowedRoles={['Admin']}>
                                        <div className="rounded-lg border-2 border-dashed p-6 text-center">
                                            <h2 className="text-xl font-bold">System Settings</h2>
                                            <p className="mt-2 text-muted-foreground">
                                                Global CMS configuration belongs here once those APIs are added.
                                            </p>
                                        </div>
                                    </ProtectedRoute>
                                }
                            />
                        </Route>
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
            <Toaster position="top-right" />
        </AuthProvider>
    );
}

export default App;
