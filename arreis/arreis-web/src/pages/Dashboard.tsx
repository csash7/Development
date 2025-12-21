import { Activity, MessageCircle, Users, Zap } from "lucide-react";

const stats = [
    { label: "Total Conversations", value: "1,234", icon: MessageCircle, trend: "+12%" },
    { label: "Active Agents", value: "8", icon: Users, trend: "+2" },
    { label: "Avg Response Time", value: "1.2s", icon: Zap, trend: "-0.3s" },
    { label: "Success Rate", value: "98.5%", icon: Activity, trend: "+0.5%" },
];

export function Dashboard() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">Overview of your agent fleet performance.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="rounded-xl border bg-card p-6 shadow-sm">
                            <div className="flex items-center justify-between space-y-0 pb-2">
                                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex items-baseline space-x-3">
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <div className="text-xs text-green-500 font-medium">{stat.trend}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border bg-card p-6 shadow-sm">
                    <h3 className="font-semibold">Recent Activity</h3>
                    <div className="mt-4 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <MessageCircle className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Customer Support Agent</p>
                                    <p className="text-xs text-muted-foreground">Resolved ticket #123{i}</p>
                                </div>
                                <div className="ml-auto text-xs text-muted-foreground">2m ago</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="col-span-3 rounded-xl border bg-card p-6 shadow-sm">
                    <h3 className="font-semibold">System Health</h3>
                    <div className="mt-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">API Latency</span>
                            <span className="text-sm font-medium text-green-500">45ms</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Memory Usage</span>
                            <span className="text-sm font-medium text-yellow-500">65%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Error Rate</span>
                            <span className="text-sm font-medium text-green-500">0.01%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
