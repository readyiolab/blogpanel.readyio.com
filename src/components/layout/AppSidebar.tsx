import type React from 'react';
import {
    ChevronRight,
    FileText,
    History,
    LayoutDashboard,
    List,
    LogOut,
    MessageSquare,
    PlusSquare,
    Settings,
    Shield,
    Tags,
    Users,
    User as UserIcon
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types';

interface NavItem {
    title: string;
    url: string;
    icon: React.ComponentType<{ className?: string }>;
    roles?: Role[];
    permissions?: string[];
    subItems?: NavItem[];
}

interface NavGroup {
    title: string;
    roles?: Role[];
    permissions?: string[];
    items: NavItem[];
}

const roleIn = (role: Role | undefined, allowed?: Role[]) => !allowed || (role ? allowed.includes(role) : false);
const hasAnyPermission = (permissions: string[], required?: string[]) =>
    !required || required.some((permission) => permissions.includes(permission));

const AppSidebar = () => {
    const { user, permissions, logout } = useAuth();
    const location = useLocation();
    const currentRole = user?.role;

    const navigation: NavGroup[] = [
        {
            title: 'Main',
            items: [
                { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
                { title: 'Profile', url: '/profile', icon: UserIcon },
            ],
        },
        {
            title: 'Content',
            items: [
                {
                    title: 'Articles',
                    url: '/articles',
                    icon: FileText,
                    roles: ['Admin', 'Editor'],
                    permissions: ['view_all_articles'],
                    subItems: [
                        { title: 'All Articles', url: '/articles', icon: List, permissions: ['view_all_articles'] },
                        { title: 'Pending Approval', url: '/articles/pending', icon: History, permissions: ['view_all_articles'] },
                        { title: 'Create New', url: '/articles/create', icon: PlusSquare, permissions: ['create_article'] },
                    ],
                },
                {
                    title: 'My Workspace',
                    url: '/my-articles',
                    icon: FileText,
                    roles: ['Reporter', 'Author'],
                    permissions: ['create_article'],
                    subItems: [
                        { title: 'My Articles', url: '/my-articles', icon: List, permissions: ['create_article'] },
                        { title: 'Create New', url: '/articles/create', icon: PlusSquare, permissions: ['create_article'] },
                    ],
                },
                {
                    title: 'Categories',
                    url: '/categories',
                    icon: Tags,
                    roles: ['Admin', 'Editor'],
                    permissions: ['manage_categories'],
                },
            ],
        },
        {
            title: 'Community',
            permissions: ['manage_comments'],
            items: [
                { title: 'Comments', url: '/comments', icon: MessageSquare, permissions: ['manage_comments'] },
                { title: 'Newsletter', url: '/newsletter', icon: FileText, roles: ['Admin', 'Editor'] },
            ],
        },
        {
            title: 'Administration',
            roles: ['Admin', 'Editor'],
            items: [
                { title: 'Users & Roles', url: '/users', icon: Users, permissions: ['manage_users'] },
                { title: 'Roles & Access', url: '/roles', icon: Shield, permissions: ['manage_roles'] },
                { title: 'Audit Logs', url: '/logs', icon: History, permissions: ['view_activity_logs'] },
                { title: 'Settings', url: '/settings', icon: Settings },
            ],
        },
    ];

    const filteredNavigation = navigation
        .filter((group) => roleIn(currentRole, group.roles) && hasAnyPermission(permissions, group.permissions))
        .map((group) => ({
            ...group,
            items: group.items
                .map((item) => ({
                    ...item,
                    subItems: item.subItems?.filter(
                        (subItem) => roleIn(currentRole, subItem.roles) && hasAnyPermission(permissions, subItem.permissions)
                    ),
                }))
                .filter((item) => {
                    const itemVisible = roleIn(currentRole, item.roles) && hasAnyPermission(permissions, item.permissions);
                    return itemVisible || (item.subItems?.length ?? 0) > 0;
                }),
        }))
        .filter((group) => group.items.length > 0);

    return (
        <Sidebar variant="sidebar" collapsible="icon">
            <SidebarHeader className="border-b px-4 py-4">
                <div className="flex shrink-0 items-center gap-2 px-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <span className="font-bold">R</span>
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold">Readyio CMS</span>
                        <span className="truncate text-xs opacity-70">{user?.role ?? 'Panel'}</span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {filteredNavigation.map((group) => (
                    <SidebarGroup key={group.title}>
                        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
                            {group.title}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={`${group.title}-${item.title}`}>
                                        {item.subItems && item.subItems.length > 0 ? (
                                            <Collapsible defaultOpen={location.pathname.startsWith(item.url)} className="group/collapsible">
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuButton tooltip={item.title}>
                                                        <item.icon className="h-4 w-4" />
                                                        <span>{item.title}</span>
                                                        <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub className="ml-3 border-l pl-2">
                                                        {item.subItems.map((subItem) => (
                                                            <SidebarMenuSubItem key={subItem.title}>
                                                                <SidebarMenuSubButton asChild isActive={location.pathname === subItem.url}>
                                                                    <Link to={subItem.url}>
                                                                        <subItem.icon className="mr-2 h-3 w-3" />
                                                                        <span>{subItem.title}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        ))}
                                                    </SidebarMenuSub>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        ) : (
                                            <SidebarMenuButton asChild tooltip={item.title} isActive={location.pathname === item.url}>
                                                <Link to={item.url}>
                                                    <item.icon className="h-4 w-4" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        )}
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter className="border-t p-4">
                <Button
                    variant="outline"
                    className="h-9 w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
                    onClick={logout}
                >
                    <LogOut className="h-4 w-4 text-destructive" />
                    <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
                </Button>
            </SidebarFooter>
        </Sidebar>
    );
};

export default AppSidebar;
