import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminService } from '@/services/apiService';
import {
    FileText,
    Users,
    Eye,
    TrendingUp,
    MessageSquare,
    History
} from 'lucide-react';

const DashboardPage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        articles: 0,
        users: 0,
        views: 0,
        comments: 0,
        pending: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await adminService.getDashboard();
                const data = response.data.data;
                setStats({
                    articles: data.total_articles || 0,
                    users: data.total_users || 0,
                    views: data.total_views || 0,
                    comments: data.total_comments || 0,
                    pending: data.pending_articles || 0,
                });
            } catch (error) {
                console.error('Failed to fetch dashboard stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const metricCards = [
        {
            title: 'Total Articles',
            value: stats.articles,
            icon: FileText,
            description: 'Articles you can access',
            color: 'text-blue-600'
        },
        {
            title: 'Pending Review',
            value: stats.pending,
            icon: TrendingUp,
            description: 'Awaiting action',
            color: 'text-amber-600'
        },
        {
            title: 'Total Views',
            value: stats.views.toLocaleString(),
            icon: Eye,
            description: 'Across accessible content',
            color: 'text-emerald-600'
        },
        {
            title: 'Active Users',
            value: stats.users,
            icon: Users,
            description: 'Registered accounts',
            color: 'text-purple-600'
        },
        {
            title: 'Comments Queue',
            value: stats.comments,
            icon: MessageSquare,
            description: 'Pending moderation',
            color: 'text-indigo-600'
        },
    ];

    const cardsToRender = user?.role === 'Admin' || user?.role === 'Editor'
        ? metricCards
        : metricCards.filter((card) => card.title !== 'Active Users');

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                <p className="text-muted-foreground underline decoration-primary/20">
                    Welcome back, {user?.username}. Here's what's happening today.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {cardsToRender.map((card, i) => (
                    <Card key={i} className="hover:border-primary/50 transition-colors cursor-default">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {card.title}
                            </CardTitle>
                            <card.icon className={`h-4 w-4 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? '...' : card.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {card.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Content Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center border-t">
                        <div className="flex flex-col items-center text-muted-foreground gap-2">
                            <TrendingUp className="h-10 w-10 opacity-20" />
                            <p className="text-sm">Traffic analytics visualization coming soon...</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 border-t pt-6">
                        <div className="flex flex-col items-center text-muted-foreground gap-2 py-10">
                            <History className="h-10 w-10 opacity-20" />
                            <p className="text-sm">Fetching activity stream...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;
