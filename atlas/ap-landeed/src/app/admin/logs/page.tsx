'use client';

import { useState, useEffect, useRef } from 'react';
import {
    RefreshCw,
    AlertCircle,
    Info,
    AlertTriangle,
    XCircle,
    Filter,
    Pause,
    Play,
} from 'lucide-react';

interface ScrapeLog {
    id: string;
    job_id: string | null;
    level: string;
    message: string;
    metadata: any;
    created_at: string;
}

const API_BASE = 'http://31.97.212.67:8080/api';

const levelConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
    debug: { icon: Info, color: 'text-slate-400', bgColor: 'bg-slate-500/10' },
    info: { icon: Info, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
    warn: { icon: AlertTriangle, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
    error: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/10' },
};

export default function LogsPage() {
    const [logs, setLogs] = useState<ScrapeLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [levelFilter, setLevelFilter] = useState<string>('');
    const logsEndRef = useRef<HTMLDivElement>(null);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (levelFilter) params.append('level', levelFilter);
            params.append('limit', '100');

            const response = await fetch(`${API_BASE}/logs?${params}`);
            if (!response.ok) throw new Error('Failed to fetch logs');
            const data = await response.json();
            setLogs(data);
            setError(null);
        } catch (err) {
            setError('Could not connect to backend');
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        if (autoRefresh) {
            const interval = setInterval(fetchLogs, 2000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, levelFilter]);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (autoRefresh) {
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, autoRefresh]);

    return (
        <div className="p-8 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Scraper Logs</h1>
                    <p className="text-slate-400 mt-1">Real-time scraper activity logs</p>
                </div>
                <div className="flex gap-2">
                    {/* Level Filter */}
                    <select
                        value={levelFilter}
                        onChange={(e) => setLevelFilter(e.target.value)}
                        className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white"
                    >
                        <option value="">All Levels</option>
                        <option value="debug">Debug</option>
                        <option value="info">Info</option>
                        <option value="warn">Warning</option>
                        <option value="error">Error</option>
                    </select>

                    {/* Auto-refresh toggle */}
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${autoRefresh
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                    >
                        {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {autoRefresh ? 'Live' : 'Paused'}
                    </button>

                    <button
                        onClick={fetchLogs}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                    {error}
                </div>
            )}

            {/* Logs Container */}
            <div className="flex-1 bg-slate-900 rounded-2xl border border-white/5 overflow-hidden flex flex-col min-h-0">
                <div className="p-3 border-b border-white/5 bg-slate-800/50 flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                        {logs.length} log entries
                    </span>
                    {autoRefresh && (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Auto-refreshing
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-auto p-4 font-mono text-sm space-y-1">
                    {logs.length === 0 ? (
                        <div className="text-center text-slate-500 py-8">
                            {loading ? 'Loading logs...' : 'No logs found'}
                        </div>
                    ) : (
                        logs.map((log) => {
                            const level = levelConfig[log.level] || levelConfig.info;
                            const LevelIcon = level.icon;
                            const time = new Date(log.created_at).toLocaleTimeString();

                            return (
                                <div
                                    key={log.id}
                                    className={`flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 ${level.bgColor}`}
                                >
                                    <span className="text-slate-500 shrink-0 w-20">{time}</span>
                                    <LevelIcon className={`w-4 h-4 shrink-0 mt-0.5 ${level.color}`} />
                                    <span className={`shrink-0 w-12 uppercase text-xs font-medium ${level.color}`}>
                                        {log.level}
                                    </span>
                                    <span className="text-white flex-1">{log.message}</span>
                                    {log.job_id && (
                                        <span className="text-slate-500 text-xs shrink-0">
                                            Job: {log.job_id.slice(0, 8)}
                                        </span>
                                    )}
                                </div>
                            );
                        })
                    )}
                    <div ref={logsEndRef} />
                </div>
            </div>
        </div>
    );
}
