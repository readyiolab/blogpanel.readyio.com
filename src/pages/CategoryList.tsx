import { useEffect, useMemo, useState } from 'react';
import { Edit, Plus, Search, Tag, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { categoryService } from '@/services/apiService';
import type { Category } from '@/types';

const CategoryList = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await categoryService.getAll();
            setCategories(response.data.data);
        } catch {
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchCategories();
    }, []);

    const handleCreate = async () => {
        const name = window.prompt('Category name');
        if (!name?.trim()) {
            return;
        }

        try {
            const response = await categoryService.create({ category_name: name.trim() });
            setCategories((current) => [
                {
                    id: response.data?.data?.id ?? Date.now(),
                    category_name: name.trim(),
                    slug: response.data?.data?.slug ?? name.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''),
                    article_count: 0,
                },
                ...current,
            ]);
            toast.success('Category created');
        } catch {
            toast.error('Failed to create category');
        }
    };

    const handleEdit = async (category: Category) => {
        const nextName = window.prompt('Category name', category.category_name);
        if (!nextName?.trim()) {
            return;
        }

        try {
            await categoryService.update(category.id, { category_name: nextName.trim() });
            setCategories((current) =>
                current.map((item) =>
                    item.id === category.id
                        ? {
                            ...item,
                            category_name: nextName.trim(),
                            slug: nextName.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''),
                        }
                        : item
                )
            );
            toast.success('Category updated');
        } catch {
            toast.error('Failed to update category');
        }
    };

    const handleDelete = async (category: Category) => {
        if (!window.confirm(`Delete category "${category.category_name}"?`)) {
            return;
        }

        try {
            await categoryService.delete(category.id);
            setCategories((current) => current.filter((item) => item.id !== category.id));
            toast.success('Category deleted');
        } catch {
            toast.error('Failed to delete category');
        }
    };

    const filteredCategories = useMemo(
        () =>
            categories.filter((category) =>
                category.category_name.toLowerCase().includes(search.toLowerCase())
            ),
        [categories, search]
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
                    <p className="text-muted-foreground">Manage internal content taxonomy.</p>
                </div>
                <Button onClick={() => void handleCreate()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search categories..."
                    className="pl-8"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category Name</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Articles</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="py-20 text-center">
                                    <Tag className="mx-auto mb-2 h-8 w-8 animate-pulse text-muted-foreground" />
                                    Loading categories...
                                </TableCell>
                            </TableRow>
                        ) : filteredCategories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="py-20 text-center text-muted-foreground">
                                    No categories found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCategories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">{category.category_name}</TableCell>
                                    <TableCell className="font-mono text-xs">{category.slug}</TableCell>
                                    <TableCell>{category.article_count || 0}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => void handleEdit(category)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-destructive"
                                                onClick={() => void handleDelete(category)}
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default CategoryList;
