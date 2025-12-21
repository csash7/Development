import { LayoutDashboard, MessageSquare, Settings, Users, Wrench } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";

const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: MessageSquare, label: "Playground", href: "/playground" },
    { icon: Users, label: "Agents", href: "/agents" },
    { icon: Wrench, label: "Tools", href: "/tools" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

export function DashboardLayout() {
    const location = useLocation();

    return (
        <div className="flex h-screen bg-background text-foreground">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-primary">Arreis</h1>
                    <p className="text-sm text-muted-foreground">Agent OS</p>
                </div>
                <nav className="space-y-1 px-3">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-muted/10 p-8">
                <Outlet />
            </main>
        </div>
    );
}
