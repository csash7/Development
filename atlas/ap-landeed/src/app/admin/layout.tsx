'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ListTodo,
    ScrollText,
    Settings,
    Database,
    ArrowLeft,
    Activity,
} from 'lucide-react';

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/jobs', label: 'Scrape Jobs', icon: ListTodo },
    { href: '/admin/logs', label: 'Logs', icon: ScrollText },
    { href: '/admin/records', label: 'Records', icon: Database },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-white/5 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-white/5">
                    <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Site
                    </Link>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-amber-400" />
                        Admin Panel
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Scraper Management</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Status */}
                <div className="p-4 border-t border-white/5">
                    <div className="p-4 bg-slate-800/50 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-sm text-slate-400">Backend Status</span>
                        </div>
                        <p className="text-xs text-slate-500">
                            Connected to 31.97.212.67:8080
                        </p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
