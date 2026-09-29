import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, ExternalLink, MoreHorizontal, Plus, Search, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { articleService, getArticleLiveUrl } from '@/services/apiService';
import type { Article, PaginationMeta } from '@/types';

type Props = {
    ownOnly?: boolean;
    status?: string;
};

const ArticleList = ({ ownOnly = false, status }: Props) => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const response = ownOnly
                ? await articleService.getMyArticles({ limit: 20, page })
                : await articleService.getAdminList({ limit: 20, page, status });
            setArticles(response.data.data);
            setPagination(response.data.pagination ?? null);
        } catch {
            toast.error('Failed to load articles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchArticles();
    }, [ownOnly, page, status]);

    useEffect(() => {
        setPage(1);
    }, [ownOnly, status]);

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this article?')) {
            return;
        }

        try {
            await articleService.delete(id);
            setArticles((current) => current.filter((article) => article.id !== id));
            setPagination((current) =>
                current
                    ? {
                        ...current,
                        totalRecords: Math.max(current.totalRecords - 1, 0),
                        totalPages: Math.max(Math.ceil(Math.max(current.totalRecords - 1, 0) / current.limit), 1),
                    }
                    : current
            );
            toast.success('Article deleted successfully');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to delete article';
            toast.error(message);
        }
    };

    const filteredArticles = useMemo(
        () =>
            articles.filter((article) =>
                [article.title, article.author_name, article.category_name]
                    .filter(Boolean)
                    .some((value) => value!.toLowerCase().includes(search.toLowerCase()))
            ),
        [articles, search]
    );

    const title = ownOnly ? 'My Articles' : status === 'pending' ? 'Pending Articles' : 'All Articles';

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                    <p className="text-muted-foreground">Manage content, status, and editorial flow.</p>
                </div>
                <Button asChild>
                    <Link to="/articles/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New
                    </Link>
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search articles..."
                    className="pl-8"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Updated</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-10 text-center">
                                    Loading articles...
                                </TableCell>
                            </TableRow>
                        ) : filteredArticles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-10 text-center">
                                    No articles found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredArticles.map((article) => (
                                <TableRow key={article.id}>
                                    <TableCell className="max-w-[320px] truncate font-medium">
                                        {article.title}
                                    </TableCell>
                                    <TableCell>{article.author_name ?? 'Unknown'}</TableCell>
                                    <TableCell>{article.category_name ?? 'Uncategorized'}</TableCell>
                                    <TableCell>
                                        <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                                            {article.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {article.updated_at
                                            ? new Date(article.updated_at).toLocaleDateString()
                                            : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem asChild>
                                                    <Link to={`/articles/edit/${article.id}`}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                {article.status === 'published' && (
                                                    <DropdownMenuItem asChild>
                                                        <a href={getArticleLiveUrl(article.slug)} target="_blank" rel="noreferrer">
                                                            <ExternalLink className="mr-2 h-4 w-4" />
                                                            View live
                                                        </a>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(article.id)}
                                                    className="text-destructive"
                                                >
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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

export default ArticleList;
