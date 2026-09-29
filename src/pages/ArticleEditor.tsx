import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import JoditEditor from 'jodit-react';
import { toast } from 'sonner';
import { AlertTriangle, ExternalLink, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { articleService, categoryService, getApiBaseUrl, getArticleLiveUrl, getBlogSiteUrl } from '@/services/apiService';
import { useAuth } from '@/context/AuthContext';
import type { Article, Category } from '@/types';
import imageCompression from 'browser-image-compression';

type FormState = {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    categoryId: string;
    featuredImage: string;
    imageAlt: string;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
    canonicalUrl: string;
    tags: string;
    isFeatured: boolean;
    status: 'draft' | 'pending' | 'published';
};

const defaultForm: FormState = {
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    categoryId: '',
    featuredImage: '',
    imageAlt: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    canonicalUrl: '',
    tags: '',
    isFeatured: false,
    status: 'draft',
};

const META_TITLE_LIMIT = 60;
const META_DESCRIPTION_LIMIT = 160;

const getPlainTextFromHtml = (html: string) =>
    html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const slugify = (text: string) =>
    text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

const CharCounter = ({ value, limit }: { value: string; limit: number }) => (
    <span className={value.length > limit ? 'text-destructive' : 'text-muted-foreground'}>
        {value.length}/{limit}
    </span>
);

const ArticleEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState<FormState>(defaultForm);
    const [slugTouched, setSlugTouched] = useState(false);
    const [original, setOriginal] = useState<{ slug: string; wasPublished: boolean } | null>(null);
    const editor = useRef<any>(null);
    const [editorReady, setEditorReady] = useState(false);

    const config = {
        readonly: false,
        placeholder: 'Start typing your article...',
        height: 600,
        toolbarSticky: true,
        theme: 'default',
        allowResizeY: true,
        showCharsCounter: true,
        showWordsCounter: true,
        showXPathInStatusbar: false,
        askBeforePasteHTML: false,
        askBeforePasteFromWord: false,
        defaultActionOnPaste: 'insert_clear_html' as any,
        beautyHTML: true,
        buttons: [
            'source', '|',
            'bold', 'italic', 'underline', 'strikethrough', 'eraser', '|',
            'ul', 'ol', '|',
            'outdent', 'indent', '|',
            'font', 'fontsize', 'brush', 'paragraph', '|',
            'image', 'table', 'link', '|',
            'align', 'undo', 'redo', '|',
            'hr', 'symbol', 'fullsize', 'print', 'about'
        ],
        uploader: {
            url: `${getApiBaseUrl()}/upload/image`,
            format: 'json',
            path: 'data.url',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token') || ''}`
            },
            filesVariableName: () => 'image',
            process: (resp: any) => {
                return {
                    files: [resp.data.url],
                    path: resp.data.url,
                    baseurl: '',
                    error: resp.success ? 0 : 1,
                    msg: resp.message
                };
            },
            defaultHandlerSuccess: function (this: any, data: any) {
                this.s.insertImage(data.files[0]);
            }
        }
    };

    useEffect(() => {
        const loadEditorData = async () => {
            setLoading(true);

            try {
                const [categoriesResponse, articleResponse] = await Promise.all([
                    categoryService.getAll(),
                    id ? articleService.getById(Number(id)) : Promise.resolve(null),
                ]);

                setCategories(categoriesResponse.data.data);

                if (articleResponse) {
                    const article: Article = articleResponse.data.data;
                    setFormData({
                        title: article.title,
                        slug: article.slug,
                        excerpt: article.excerpt || '',
                        content: article.content || '',
                        categoryId: article.category_id ? String(article.category_id) : '',
                        featuredImage: article.featured_image || '',
                        imageAlt: article.featured_image_alt || '',
                        metaTitle: article.meta_title || '',
                        metaDescription: article.meta_description || '',
                        metaKeywords: article.meta_keywords || '',
                        canonicalUrl: article.canonical_url || '',
                        tags: (article.tags || []).map((tag) => tag.name).join(', '),
                        isFeatured: Boolean(article.is_featured),
                        status: article.status === 'archived' ? 'draft' : article.status,
                    });
                    setSlugTouched(true);
                    setOriginal({
                        slug: article.slug,
                        wasPublished: article.status === 'published' || Boolean(article.published_at),
                    });
                }
            } catch {
                toast.error('Failed to load editor data');
            } finally {
                setLoading(false);
            }
        };

        void loadEditorData();
    }, [id]);

    // Handle Jodit image compression
    useEffect(() => {
        if (!editorReady || !editor.current) {
            return;
        }

        const jodit = (editor.current as any).current || editor.current;
        if (!jodit?.events) {
            return;
        }

        const beforeUpload = async (data: any) => {
            if (data.files && data.files.length > 0) {
                const file = data.files[0];
                if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
                    try {
                        const options = {
                            maxSizeMB: 1,
                            maxWidthOrHeight: 1920,
                            useWebWorker: true,
                        };
                        const compressedBlob = await imageCompression(file, options);
                        const compressedFile = new File([compressedBlob], file.name, { type: file.type });
                        data.files[0] = compressedFile;
                        toast.info('Optimizing editor image...');
                    } catch (err) {
                        console.error('Editor image compression failed:', err);
                    }
                }
            }
        };

        jodit.events.on('beforeUpload', beforeUpload);
        return () => {
            jodit.events?.off('beforeUpload', beforeUpload);
        };
    }, [editorReady]);

    const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setFormData((current) => ({ ...current, [key]: value }));
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // Check image dimensions
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.src = url;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            URL.revokeObjectURL(url);

            if (img.naturalWidth < 1200) {
                toast.error('Featured image must be at least 1200px wide for optimal display');
                return;
            }

            // Options for compression
            const options = {
                maxSizeMB: 1, // Max size 1MB
                maxWidthOrHeight: 1920, // Max dimensions
                useWebWorker: true,
            };

            const compressedFile = await imageCompression(file, options);

            // Convert to File object if necessary (imageCompression returns a Blob/File)
            const fileToUpload = new File([compressedFile], file.name, {
                type: compressedFile.type,
            });

            const response = await articleService.uploadImage(fileToUpload);
            setField('featuredImage', response.data.data.url);
            toast.success('Image compressed and uploaded successfully');
        } catch (error) {
            console.error('Compression/Upload error:', error);
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const effectiveSlug = slugTouched ? slugify(formData.slug) : slugify(formData.title);
    const slugChangedAfterPublish = Boolean(original?.wasPublished && effectiveSlug && effectiveSlug !== original.slug);
    const seoTitle = formData.metaTitle.trim() || formData.title.trim();
    const seoDescription = formData.metaDescription.trim() || formData.excerpt.trim();
    const blogHost = getBlogSiteUrl().replace(/^https?:\/\//, '');

    const handleSave = async (published = false) => {
        const plainContent = getPlainTextFromHtml(formData.content);
        if (!formData.title.trim() || !plainContent || !formData.categoryId) {
            toast.error('Title, content, and category are required');
            return;
        }

        if (formData.featuredImage && !formData.imageAlt.trim()) {
            toast.error('Add alt text for the featured image');
            return;
        }

        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                title: formData.title.trim(),
                excerpt: formData.excerpt.trim(),
                content: formData.content,
                categoryId: Number(formData.categoryId),
                imageUrl: formData.featuredImage, // Backend expects imageUrl
                imageAlt: formData.imageAlt.trim(),
                metaTitle: formData.metaTitle.trim(),
                metaDescription: formData.metaDescription.trim(),
                metaKeywords: formData.metaKeywords.trim(),
                canonicalUrl: formData.canonicalUrl.trim(),
                tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
                isFeatured: formData.isFeatured,
                status: published ? 'published' : 'draft',
            };

            if (slugTouched && effectiveSlug && effectiveSlug !== original?.slug) {
                payload.slug = effectiveSlug;
            }

            if (id) {
                const response = await articleService.update(Number(id), payload);
                const status = response.data?.data?.status;
                toast.success(
                    published && status === 'pending'
                        ? 'Article submitted for review'
                        : 'Article updated successfully'
                );
            } else {
                const response = await articleService.create(payload);
                const status = response.data?.data?.status;
                toast.success(
                    published && status === 'pending'
                        ? 'Article submitted for review'
                        : 'Article created successfully'
                );
            }

            const destination = user?.role === 'Admin' || user?.role === 'Editor' ? '/articles' : '/my-articles';
            navigate(destination);
        } catch (error: unknown) {
            const message =
                typeof error === 'object' &&
                    error !== null &&
                    'response' in error &&
                    typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
                    ? (error as { response: { data: { message: string } } }).response.data.message
                    : 'Failed to save article';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex h-[400px] items-center justify-center">Loading article...</div>;
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{id ? 'Edit Article' : 'Create Article'}</h1>
                    <p className="text-muted-foreground">
                        {id ? 'Update structure, copy, and metadata.' : 'Draft new content for the editorial workflow.'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                    <Button variant="secondary" onClick={() => void handleSave(false)} disabled={saving}>
                        Save Draft
                    </Button>
                    <Button onClick={() => void handleSave(true)} disabled={saving}>
                        Publish
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <Card>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-2">
                                <Label htmlFor="title">Article Title</Label>
                                <Input
                                    id="title"
                                    placeholder="Enter a title"
                                    value={formData.title}
                                    onChange={(event) => setField('title', event.target.value)}
                                    className="text-lg font-semibold"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Use a clear, factual headline. Avoid sensational phrasing or clickbait.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">URL Slug</Label>
                                <div className="flex items-center rounded-md border bg-muted/40 focus-within:ring-2 focus-within:ring-ring">
                                    <span className="hidden whitespace-nowrap pl-3 text-sm text-muted-foreground sm:inline">
                                        {blogHost}/
                                    </span>
                                    <Input
                                        id="slug"
                                        placeholder="auto-generated-from-title"
                                        value={slugTouched ? formData.slug : effectiveSlug}
                                        onChange={(event) => {
                                            setSlugTouched(true);
                                            setField('slug', event.target.value);
                                        }}
                                        onBlur={() => setField('slug', effectiveSlug)}
                                        className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                                    />
                                </div>
                                {slugChangedAfterPublish ? (
                                    <p className="flex items-start gap-1.5 text-xs text-amber-600">
                                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        This article is already live. Changing its URL keeps a permanent redirect from
                                        /{original?.slug}, but search engines will need to re-index the new address.
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Short, lowercase and keyword-focused. Published URLs should rarely change.
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Content</Label>
                                <div className="border rounded-md overflow-hidden bg-white">
                                    <JoditEditor
                                        ref={(instance) => {
                                            editor.current = instance;
                                            setEditorReady(Boolean(instance));
                                        }}
                                        value={formData.content}
                                        config={config}
                                        onChange={(newContent) => setField('content', newContent)}
                                        onBlur={(newContent) => setField('content', newContent)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>SEO Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg border bg-muted/30 p-4">
                                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Search preview
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {blogHost} › {effectiveSlug || 'article-slug'}
                                </p>
                                <p className="mt-1 line-clamp-1 text-lg leading-snug text-[#1a0dab]">
                                    {seoTitle || 'Article title'}
                                </p>
                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                    {seoDescription || 'Add a meta description or excerpt to control this snippet.'}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <Label htmlFor="metaTitle">Meta Title</Label>
                                    <CharCounter value={seoTitle} limit={META_TITLE_LIMIT} />
                                </div>
                                <Input
                                    id="metaTitle"
                                    placeholder={formData.title || 'Defaults to the article title'}
                                    value={formData.metaTitle}
                                    onChange={(event) => setField('metaTitle', event.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <Label htmlFor="metaDesc">Meta Description</Label>
                                    <CharCounter value={seoDescription} limit={META_DESCRIPTION_LIMIT} />
                                </div>
                                <Textarea
                                    id="metaDesc"
                                    placeholder="Defaults to the excerpt"
                                    value={formData.metaDescription}
                                    onChange={(event) => setField('metaDescription', event.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Summarize the article directly. Strong Discover snippets are useful, not manipulative.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="metaKeywords">Focus Keywords</Label>
                                <Input
                                    id="metaKeywords"
                                    placeholder="e.g. ai agents, production ai"
                                    value={formData.metaKeywords}
                                    onChange={(event) => setField('metaKeywords', event.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="canonicalUrl">Canonical URL</Label>
                                <Input
                                    id="canonicalUrl"
                                    type="url"
                                    placeholder={getArticleLiveUrl(effectiveSlug || 'article-slug')}
                                    value={formData.canonicalUrl}
                                    onChange={(event) => setField('canonicalUrl', event.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave empty unless this article was first published elsewhere.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Featured Image</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50">
                                {formData.featuredImage ? (
                                    <div className="relative w-full overflow-hidden rounded-md border bg-muted aspect-video">
                                        <img
                                            src={formData.featuredImage}
                                            alt="Featured"
                                            className="h-full w-full object-cover"
                                        />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute right-1 top-1 h-6 w-6"
                                            onClick={() => setField('featuredImage', '')}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="rounded-full bg-primary/10 p-3">
                                            {uploading ? (
                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                            ) : (
                                                <ImageIcon className="h-6 w-6 text-primary" />
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Click to upload image</p>
                                            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 5MB</p>
                                        </div>
                                    </>
                                )}
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id="image-upload"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    asChild
                                    disabled={uploading}
                                >
                                    <label htmlFor="image-upload" className="cursor-pointer">
                                        {uploading ? 'Uploading...' : formData.featuredImage ? 'Change Image' : 'Select Image'}
                                    </label>
                                </Button>
                                <p className="text-xs text-muted-foreground">
                                    For Google Discover, prefer an original featured image that is at least 1200px wide.
                                    Avoid logos, screenshots of text, or overly promotional artwork.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="imageAlt">Image Alt Text</Label>
                                <Input
                                    id="imageAlt"
                                    placeholder="Describe what the image shows"
                                    value={formData.imageAlt}
                                    onChange={(event) => setField('imageAlt', event.target.value)}
                                    maxLength={255}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Classification</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={formData.categoryId} onValueChange={(value) => setField('categoryId', value)}>
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={String(category.id)}>
                                                {category.category_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="excerpt">Excerpt</Label>
                                <Textarea
                                    id="excerpt"
                                    placeholder="Brief summary"
                                    value={formData.excerpt}
                                    onChange={(event) => setField('excerpt', event.target.value)}
                                    className="resize-none"
                                    rows={4}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Shown on blog cards. Write a concise summary of what readers will learn.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tags">Tags</Label>
                                <Input
                                    id="tags"
                                    placeholder="Strategy, Operations"
                                    value={formData.tags}
                                    onChange={(event) => setField('tags', event.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Separate tags with commas.</p>
                            </div>
                            <div className="flex items-start gap-3 rounded-md border p-3">
                                <Checkbox
                                    id="isFeatured"
                                    checked={formData.isFeatured}
                                    onCheckedChange={(checked) => setField('isFeatured', checked === true)}
                                    className="mt-0.5"
                                />
                                <div className="space-y-1">
                                    <Label htmlFor="isFeatured">Featured article</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Highlighted at the top of the blog listing.
                                    </p>
                                </div>
                            </div>
                            {id && original?.wasPublished && (
                                <Button variant="outline" size="sm" className="w-full" asChild>
                                    <a href={getArticleLiveUrl(original.slug)} target="_blank" rel="noreferrer">
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        View live
                                    </a>
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ArticleEditor;
