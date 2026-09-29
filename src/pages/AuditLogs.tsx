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
import { Card, CardContent } from '@/components/ui/card';
import { History, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import type { ActivityLog, PaginationMeta } from '@/types';

const AuditLogs = () => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await adminService.getLogs({ limit: 20, page });
                setLogs(response.data.data);
                setPagination(response.data.pagination ?? null);
            } catch {
                toast.error('Failed to load activity logs');
            } finally {
                setLoading(false);
            }
        };
        void fetchLogs();
    }, [page]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
                <p className="text-muted-foreground underline decoration-primary/30">
                    Track every administrative action and security event on the platform.
                </p>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Entity</TableHead>
                                <TableHead>IP Address</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20">
                                        <History className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-2" />
                                        Loading audit trail...
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                                        No activity logs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-xs whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="font-medium">{log.username || `User ID: ${log.user_id}`}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{log.action}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {log.entity_type} ({log.entity_id})
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{log.ip_address}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

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

            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 p-4 rounded-lg flex gap-3">
                <ShieldAlert className="h-5 w-5 text-blue-600 shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Security Notice:</strong> Audit logs are immutable records. Use them to trace configuration changes or unauthorized access attempts.
                </p>
            </div>
        </div>
    );
};

export default AuditLogs;
