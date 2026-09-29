import { useState, useEffect } from 'react';
import { commentService } from '@/services/apiService';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, CheckCircle, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import type { CommentRecord, PaginationMeta } from '@/types';

const CommentList = () => {
    const [comments, setComments] = useState<CommentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const response = await commentService.getAll({ limit: 20, page });
            setComments(response.data.data);
            setPagination(response.data.pagination ?? null);
        } catch {
            toast.error('Failed to load comments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchComments();
    }, [page]);

    const handleApprove = async (id: number) => {
        try {
            await commentService.approve(id);
            setComments((current) =>
                current.map((comment) =>
                    comment.id === id ? { ...comment, status: 'approved' } : comment
                )
            );
            toast.success('Comment approved');
        } catch {
            toast.error('Failed to approve comment');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            await commentService.delete(id);
            setComments((current) => current.filter((comment) => comment.id !== id));
            setPagination((current) =>
                current
                    ? {
                        ...current,
                        totalRecords: Math.max(current.totalRecords - 1, 0),
                        totalPages: Math.max(Math.ceil(Math.max(current.totalRecords - 1, 0) / current.limit), 1),
                    }
                    : current
            );
            toast.success('Comment deleted');
        } catch {
            toast.error('Failed to delete comment');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Comment Moderation</h1>
                <p className="text-muted-foreground underline decoration-primary/30">
                    Review and moderate audience discussions.
                </p>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Commenter</TableHead>
                            <TableHead className="max-w-md">Content</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-20">
                                    <MessageSquare className="h-8 w-8 animate-pulse mx-auto text-muted-foreground mb-2" />
                                    Fetching comments...
                                </TableCell>
                            </TableRow>
                        ) : comments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                                    No comments awaiting moderation.
                                </TableCell>
                            </TableRow>
                        ) : (
                            comments.map((comment) => (
                                <TableRow key={comment.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium text-sm">{comment.username || 'Anonymous'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-md">
                                        <p className="text-sm line-clamp-3">{comment.comment_text}</p>
                                        <span className="text-[10px] text-muted-foreground">Article: {comment.article_title}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={comment.status === 'approved' ? 'default' : 'secondary'}>
                                            {comment.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {comment.status !== 'approved' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-green-600"
                                                    onClick={() => handleApprove(comment.id)}
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-destructive"
                                                onClick={() => handleDelete(comment.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                    Page {pagination?.currentPage ?? page} of {pagination?.totalPages ?? 1}
                </span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(current - 1, 1))} disabled={page === 1}>
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((current) => current + 1)}
                        disabled={Boolean(pagination && page >= pagination.totalPages)}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CommentList;
