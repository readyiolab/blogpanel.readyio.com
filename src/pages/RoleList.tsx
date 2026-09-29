import { useEffect, useState } from 'react';
import { Plus, Search, Shield, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { userService } from '@/services/apiService';
import type { RoleRecord } from '@/types';

const RoleList = () => {
    const [roles, setRoles] = useState<RoleRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [currentRole, setCurrentRole] = useState<Partial<RoleRecord>>({
        role_name: '' as any,
        description: '',
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await userService.getRoles();
            setRoles(response.data.data);
        } catch {
            toast.error('Failed to load roles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, []);

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await userService.createRole(currentRole);
            toast.success('Role created successfully');
            setIsCreateOpen(false);
            setCurrentRole({ role_name: '' as any, description: '' });
            void fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create role');
        }
    };

    const handleUpdateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentRole.id) return;
        try {
            await userService.updateRole(currentRole.id, currentRole);
            toast.success('Role updated successfully');
            setIsEditOpen(false);
            setCurrentRole({ role_name: '' as any, description: '' });
            void fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update role');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this role?')) {
            return;
        }

        try {
            await userService.deleteRole(id);
            toast.success('Role deleted');
            void fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete role');
        }
    };

    const filteredRoles = roles.filter((role) =>
        role.role_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
                    <p className="text-muted-foreground">Define and manage system access levels.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Role
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Role</DialogTitle>
                            <DialogDescription>Define a new set of permissions for users.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateRole} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="role_name">Role Name</Label>
                                <Input
                                    id="role_name"
                                    value={currentRole.role_name}
                                    onChange={(e) => setCurrentRole({ ...currentRole, role_name: e.target.value as any })}
                                    required
                                    placeholder="e.g. Moderator"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={currentRole.description}
                                    onChange={(e) => setCurrentRole({ ...currentRole, description: e.target.value })}
                                    placeholder="What can this role do?"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create Role</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search roles..."
                    className="pl-8"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Role Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Shield className="h-8 w-8 animate-pulse text-primary" />
                                        <p>Loading roles...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredRoles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="py-20 text-center text-muted-foreground">
                                    No roles found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredRoles.map((role) => (
                                <TableRow key={role.id}>
                                    <TableCell className="font-medium">{role.role_name}</TableCell>
                                    <TableCell className="text-muted-foreground">{role.description || 'No description'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setCurrentRole(role);
                                                    setIsEditOpen(true);
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive"
                                                onClick={() => void handleDelete(role.id)}
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

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Role</DialogTitle>
                        <DialogDescription>Update role details.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateRole} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit_role_name">Role Name</Label>
                            <Input
                                id="edit_role_name"
                                value={currentRole.role_name}
                                onChange={(e) => setCurrentRole({ ...currentRole, role_name: e.target.value as any })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit_description">Description</Label>
                            <Textarea
                                id="edit_description"
                                value={currentRole.description}
                                onChange={(e) => setCurrentRole({ ...currentRole, description: e.target.value })}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Update Role</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default RoleList;
