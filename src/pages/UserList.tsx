import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, ShieldAlert, UserCog, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { userService } from '@/services/apiService';
import type { PaginationMeta, RoleRecord } from '@/types';
import { Info } from 'lucide-react';

type ManagedUser = {
    id: number;
    username: string;
    email: string;
    role_id: number;
    role_name: string;
    status: string;
    created_at: string;
};

const UserList = () => {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [roles, setRoles] = useState<RoleRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        role_id: '',
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersResponse, rolesResponse] = await Promise.all([
                userService.getAll({ limit: 20, page }),
                userService.getRoles(),
            ]);

            setUsers(usersResponse.data.data as ManagedUser[]);
            setPagination(usersResponse.data.pagination ?? null);
            setRoles(rolesResponse.data.data);
        } catch {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, [page]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await userService.create({
                ...newUser,
                role_id: Number(newUser.role_id),
            });
            const selectedRole = roles.find((role) => role.id === Number(newUser.role_id));
            setUsers((current) => [
                {
                    id: Date.now(),
                    username: newUser.username,
                    email: newUser.email,
                    role_id: Number(newUser.role_id),
                    role_name: selectedRole?.role_name || 'User',
                    status: 'active',
                    created_at: new Date().toISOString(),
                },
                ...current,
            ]);
            toast.success('User created successfully');
            setIsCreateOpen(false);
            setNewUser({ username: '', email: '', password: '', first_name: '', last_name: '', role_id: '' });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create user');
        }
    };

    const handleRoleChange = async (userId: number, nextRoleId: string) => {
        try {
            await userService.update(userId, { role_id: Number(nextRoleId) });
            const selectedRole = roles.find((role) => role.id === Number(nextRoleId));
            setUsers((current) =>
                current.map((user) =>
                    user.id === userId
                        ? { ...user, role_id: Number(nextRoleId), role_name: selectedRole?.role_name || user.role_name }
                        : user
                )
            );
            toast.success('User role updated');
        } catch {
            toast.error('Failed to update role');
        }
    };

    const handleDelete = async (userId: number) => {
        if (!window.confirm('Delete this user?')) {
            return;
        }

        try {
            await userService.delete(userId);
            setUsers((current) => current.filter((user) => user.id !== userId));
            toast.success('User deleted');
        } catch {
            toast.error('Failed to delete user');
        }
    };

    const filteredUsers = useMemo(
        () =>
            users.filter((user) =>
                `${user.username} ${user.email}`.toLowerCase().includes(search.toLowerCase())
            ),
        [users, search]
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">Manage internal accounts and role assignments.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                            <DialogDescription>Add a new staff member to the system.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateUser} className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">First Name</Label>
                                    <Input
                                        id="first_name"
                                        value={newUser.first_name}
                                        onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Last Name</Label>
                                    <Input
                                        id="last_name"
                                        value={newUser.last_name}
                                        onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select
                                    value={newUser.role_id}
                                    onValueChange={(value) => setNewUser({ ...newUser, role_id: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={String(role.id)}>
                                                {role.role_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create User</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name or email..."
                    className="pl-8"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Current Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                            <TableHead className="text-right">Join Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <UserCog className="h-8 w-8 animate-pulse text-primary" />
                                        <p>Fetching user directory...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="py-20 text-center text-muted-foreground">
                                    No users matching your search.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.username}</span>
                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1 cursor-help">
                                                        <Badge variant={user.role_name === 'Admin' ? 'destructive' : 'default'} className="capitalize">
                                                            {user.role_name}
                                                        </Badge>
                                                        <Info className="h-3 w-3 text-muted-foreground" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-[200px]">
                                                    <p className="text-xs">
                                                        {roles.find(r => r.id === user.role_id)?.description || 'No description available'}
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.status === 'active' ? 'outline' : 'secondary'}>{user.status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Select value={String(user.role_id)} onValueChange={(value) => void handleRoleChange(user.id, value)}>
                                                <SelectTrigger className="h-8 w-[170px]">
                                                    <SelectValue placeholder="Change Role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem key={role.id} value={String(role.id)}>
                                                            {role.role_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-destructive"
                                                onClick={() => void handleDelete(user.id)}
                                            >
                                                <UserMinus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-xs text-muted-foreground">
                                        {new Date(user.created_at).toLocaleDateString()}
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

            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600" />
                <p className="text-sm text-amber-800">
                    Review role assignments regularly. Administrative permissions should stay limited to trusted operators.
                </p>
            </div>
        </div>
    );
};

export default UserList;
