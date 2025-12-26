'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { API_URL } from '@/lib/config';
import { History, Clock, Users, AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface HistoryEntry {
    id: string;
    timestamp: string;
    image_url: string;
    worker_count: number;
    issue_count: number;
}

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/history`)
            .then(res => res.json())
            .then(data => setHistory(data.history || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <Header />

            <main className="flex-1 p-4 md:p-8 max-w-[1200px] mx-auto w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 md:mb-6">
                    <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 md:gap-3">
                        <History className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                        Audit History
                    </h1>
                    <div className="text-xs md:text-sm text-text-muted">
                        Last {history.length} audits
                    </div>
                </div>

                <div className="text-xs md:text-sm text-text-muted mb-4 md:mb-6">
                    View past audit results. Click on any record to see details.
                </div>


                {loading ? (
                    <div className="text-center py-12 text-text-muted">Loading history...</div>
                ) : history.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl">
                        <History className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
                        <p className="text-text-muted">No audit history yet.</p>
                        <p className="text-sm text-text-muted mt-2">Run your first audit to see it here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((entry) => (
                            <Link
                                key={entry.id}
                                href={`/history/${entry.id}`}
                                className="block bg-surface/50 border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Thumbnail */}
                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/50 shrink-0">
                                        <img
                                            src={`${API_URL}${entry.image_url}`}
                                            alt="Audit thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 text-sm font-mono text-text-muted mb-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(entry.timestamp)}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-4 h-4 text-primary" />
                                                <span className="text-white font-medium">{entry.worker_count}</span>
                                                <span className="text-text-muted">workers</span>
                                            </span>
                                            {entry.issue_count > 0 && (
                                                <span className="flex items-center gap-1 text-alert-red">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    <span className="font-medium">{entry.issue_count}</span>
                                                    <span>issues</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
