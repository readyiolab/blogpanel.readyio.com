import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { authService, articleService } from '@/services/apiService';
import { Twitter, Facebook, Linkedin, Globe, Camera, Loader2, Save } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ProfilePage = () => {
    const { user: authUser, updateUserInfo } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        authorTitle: '',
        bio: '',
        twitter_url: '',
        facebook_url: '',
        linkedin_url: '',
        website_url: '',
        profileImage: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await authService.getProfile();
                const userData = (response.data as any).data.user;
                setFormData({
                    firstName: userData.first_name || '',
                    lastName: userData.last_name || '',
                    authorTitle: userData.author_title || '',
                    bio: userData.bio || '',
                    twitter_url: userData.twitter_url || '',
                    facebook_url: userData.facebook_url || '',
                    linkedin_url: userData.linkedin_url || '',
                    website_url: userData.website_url || '',
                    profileImage: userData.profile_image || ''
                });
            } catch (error) {
                toast.error('Failed to load profile details');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const response = await articleService.uploadImage(file);
            const imageUrl = response.data.data.url;
            setFormData(prev => ({ ...prev, profileImage: imageUrl }));
            toast.success('Profile image uploaded');
        } catch (error) {
            toast.error('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await authService.updateProfile(formData);
            if (updateUserInfo) {
                updateUserInfo({
                    ...formData,
                    role: authUser?.role || 'Author'
                } as any);
            }
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                <p className="text-muted-foreground">Manage your public information and social presence.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>This information will be displayed on your author profile box.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="relative group">
                                <Avatar className="h-32 w-32 border-4 border-muted">
                                    <AvatarImage src={formData.profileImage} />
                                    <AvatarFallback className="text-4xl bg-primary/10">
                                        {authUser?.username?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <label
                                    htmlFor="image-upload"
                                    className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                                >
                                    {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
                                </label>
                                <input
                                    id="image-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input id="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input id="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="authorTitle">Author Title</Label>
                                    <Input
                                        id="authorTitle"
                                        value={formData.authorTitle}
                                        onChange={handleChange}
                                        placeholder="e.g. Engineering Lead"
                                        maxLength={120}
                                    />
                                    <p className="text-xs text-muted-foreground">Shown under your name on blog posts.</p>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="bio">Author Bio</Label>
                                    <Textarea
                                        id="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        placeholder="Briefly describe your expertise..."
                                        className="h-24"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Social Media Links</CardTitle>
                        <CardDescription>Links to your professional social profiles.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="twitter_url" className="flex items-center gap-2">
                                    <Twitter className="h-4 w-4 text-blue-400" /> Twitter URL
                                </Label>
                                <Input id="twitter_url" value={formData.twitter_url} onChange={handleChange} placeholder="https://twitter.com/yourusername" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="facebook_url" className="flex items-center gap-2">
                                    <Facebook className="h-4 w-4 text-blue-600" /> Facebook URL
                                </Label>
                                <Input id="facebook_url" value={formData.facebook_url} onChange={handleChange} placeholder="https://facebook.com/yourusername" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="linkedin_url" className="flex items-center gap-2">
                                    <Linkedin className="h-4 w-4 text-blue-700" /> LinkedIn URL
                                </Label>
                                <Input id="linkedin_url" value={formData.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/yourusername" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website_url" className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-muted-foreground" /> Website URL
                                </Label>
                                <Input id="website_url" value={formData.website_url} onChange={handleChange} placeholder="https://yourwebsite.com" />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end border-t pt-6 bg-muted/10">
                        <Button type="submit" disabled={saving || uploading} className="min-w-[120px]">
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Profile
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
};

export default ProfilePage;
