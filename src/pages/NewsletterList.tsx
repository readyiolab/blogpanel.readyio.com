import { useState, useEffect } from 'react';
import { adminService } from '@/services/apiService';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Mail, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import type { PaginationMeta } from '@/types';

interface Subscriber {
    id: number;
    email: string;
    first_name: string;
    status: string;
    is_verified: boolean;
    created_at: string;
}

const NewsletterList = () => {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);

    const fetchSubscribers = async () => {
        setLoading(true);
        try {
            const response = await adminService.getNewsletterSubscribers({ limit: 20, page });
            setSubscribers(response.data.data);
            setPagination(response.data.pagination ?? null);
        } catch {
            toast.error('Failed to load newsletter subscribers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchSubscribers();
    }, [page]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Newsletter Subscribers</h1>
                <p className="text-muted-foreground underline decoration-primary/30">
                    Manage your email audience and newsletter signups.
                </p>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Subscriber</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-20">
                                    <Mail className="h-8 w-8 animate-pulse mx-auto text-muted-foreground mb-2" />
                                    Fetching subscribers...
                                </TableCell>
                            </TableRow>
                        ) : subscribers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-20 text-muted-foreground">
                                    No newsletter subscribers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            subscribers.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium text-sm">{sub.first_name || 'Guest'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Mail className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">{sub.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                                            {sub.status}
                                        </Badge>
                                        {sub.is_verified && (
                                            <Badge variant="outline" className="ml-2 text-[10px] text-green-600 border-green-200 bg-green-50">
                                                Verified
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(sub.created_at)}
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
                    <button
                        type="button"
                        className="rounded border px-3 py-1 disabled:opacity-50"
                        onClick={() => setPage((current) => Math.max(current - 1, 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        className="rounded border px-3 py-1 disabled:opacity-50"
                        onClick={() => setPage((current) => current + 1)}
                        disabled={Boolean(pagination && page >= pagination.totalPages)}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewsletterList;
