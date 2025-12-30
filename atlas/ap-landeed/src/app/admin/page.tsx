'use client';

import { useState, useEffect } from 'react';
import {
    Database,
    ListTodo,
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    TrendingUp,
    Activity,
    RefreshCw,
} from 'lucide-react';

interface Stats {
    total_records: number;
    total_jobs: number;
    pending_jobs: number;
    running_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
    captcha_waiting_jobs: number;
    success_rate: number;
}

const API_BASE = 'http://31.97.212.67:8080/api';

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/stats`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            const data = await response.json();
            setStats(data);
            setError(null);
        } catch (err) {
            setError('Could not connect to scraper backend. Is it running on port 8080?');
            // Set demo stats for UI preview
            setStats({
                total_records: 0,
                total_jobs: 0,
                pending_jobs: 0,
                running_jobs: 0,
                completed_jobs: 0,
                failed_jobs: 0,
                captcha_waiting_jobs: 0,
                success_rate: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // Refresh every 10 seconds
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    const statCards = stats ? [
        {
            label: 'Total Records',
            value: stats.total_records.toLocaleString(),
            icon: Database,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20',
        },
        {
            label: 'Total Jobs',
            value: stats.total_jobs.toLocaleString(),
            icon: ListTodo,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20',
        },
        {
            label: 'Completed',
            value: stats.completed_jobs.toLocaleString(),
            icon: CheckCircle,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20',
        },
        {
            label: 'Failed',
            value: stats.failed_jobs.toLocaleString(),
            icon: XCircle,
            color: 'text-red-400',
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-500/20',
        },
        {
            label: 'Pending',
            value: stats.pending_jobs.toLocaleString(),
            icon: Clock,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20',
        },
        {
            label: 'CAPTCHA Waiting',
            value: stats.captcha_waiting_jobs.toLocaleString(),
            icon: AlertCircle,
            color: 'text-orange-400',
            bgColor: 'bg-orange-500/10',
            borderColor: 'border-orange-500/20',
        },
        {
            label: 'Running',
            value: stats.running_jobs.toLocaleString(),
            icon: Activity,
            color: 'text-cyan-400',
            bgColor: 'bg-cyan-500/10',
            borderColor: 'border-cyan-500/20',
        },
        {
            label: 'Success Rate',
            value: `${stats.success_rate.toFixed(1)}%`,
            icon: TrendingUp,
            color: 'text-green-400',
            bgColor: 'bg-green-500/10',
            borderColor: 'border-green-500/20',
        },
    ] : [];

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-slate-400 mt-1">Monitor scraper activity and statistics</p>
                </div>
                <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Backend Not Connected</span>
                    </div>
                    <p className="text-sm mt-1 text-amber-400/70">{error}</p>
                    <p className="text-sm mt-2 text-amber-400/70">
                        Start the backend with: <code className="bg-slate-800 px-2 py-0.5 rounded">cd scraper && cargo run</code>
                    </p>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className={`p-6 rounded-2xl border ${stat.bgColor} ${stat.borderColor}`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm">{stat.label}</p>
                            <p className={`text-3xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href="/admin/jobs"
                        className="p-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-amber-400 transition-colors"
                    >
                        <ListTodo className="w-6 h-6 mb-2" />
                        <p className="font-medium">Create Scrape Job</p>
                        <p className="text-sm text-amber-400/70 mt-1">Queue a new land record scrape</p>
                    </a>
                    <a
                        href="/admin/logs"
                        className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-colors"
                    >
                        <Activity className="w-6 h-6 mb-2" />
                        <p className="font-medium">View Logs</p>
                        <p className="text-sm text-slate-400 mt-1">Monitor real-time scraper activity</p>
                    </a>
                    <a
                        href="/admin/records"
                        className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-colors"
                    >
                        <Database className="w-6 h-6 mb-2" />
                        <p className="font-medium">Browse Records</p>
                        <p className="text-sm text-slate-400 mt-1">View scraped land records</p>
                    </a>
                </div>
            </div>
        </div>
    );
}
