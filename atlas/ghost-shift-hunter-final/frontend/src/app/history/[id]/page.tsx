'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { AuditTable } from '@/components/audit-table';
import { API_URL } from '@/lib/config';
import { Clock, ArrowLeft, Search, Play } from 'lucide-react';
import Link from 'next/link';

interface HistoryDetail {
    id: string;
    timestamp: string;
    image_url: string;
    worker_count: number;
    issue_count: number;
    reports?: any[];  // Full audit reports with issue detection
    result: {
        shifts: any[];
        cleaned_logs: any[];
        column_headers: string[];
    };
}

export default function HistoryDetailPage() {
    const params = useParams();
    const auditId = params.id as string;

    const [data, setData] = useState<HistoryDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!auditId) return;

        fetch(`${API_URL}/api/history/${auditId}`)
            .then(res => {
                if (!res.ok) throw new Error('Audit not found');
                return res.json();
            })
            .then(setData)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [auditId]);

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Use saved reports if available (these have issue detection)
    const reports = data?.reports || [];

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <Header />

            <main className="flex-1 p-4 md:p-8 max-w-[1400px] mx-auto w-full">
                {/* Back Link */}
                <Link
                    href="/history"
                    className="inline-flex items-center gap-2 text-xs md:text-sm text-text-muted hover:text-white transition-colors mb-4 md:mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to History
                </Link>

                {loading ? (
                    <div className="text-center py-12 text-text-muted">Loading audit details...</div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-alert-red mb-4">{error}</p>
                        <Link href="/history" className="text-primary hover:underline">
                            Return to History
                        </Link>
                    </div>
                ) : data ? (
                    <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 md:gap-8">
                        {/* Left Panel - Image */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs md:text-sm text-text-muted mb-2">
                                <Search className="w-4 h-4" />
                                <span>Input Source</span>
                            </div>

                            <div className="rounded-xl overflow-hidden border border-white/10 bg-black">
                                <img
                                    src={`${API_URL}${data.image_url}`}
                                    alt="Uploaded document"
                                    className="w-full h-auto"
                                />
                            </div>

                            <div className="bg-surface/50 border border-white/10 rounded-lg p-4 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-text-muted">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(data.timestamp)}
                                </div>
                                <div className="text-xs text-text-muted">
                                    Audit ID: <span className="font-mono text-primary">{data.id}</span>
                                </div>
                                <div className="text-xs text-text-muted">
                                    Workers: <span className="text-white">{data.worker_count}</span> •
                                    Issues: <span className={data.issue_count > 0 ? 'text-red-400' : 'text-green-400'}>{data.issue_count}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel - Results */}
                        <div>
                            <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
                                <Play className="w-4 h-4" />
                                <span>Audit Results</span>
                            </div>

                            {reports.length > 0 ? (
                                <AuditTable
                                    reports={reports}
                                    columnHeaders={data.result?.column_headers || []}
                                />
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-xl text-text-muted">
                                    No audit data available. The audit may not have completed.
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </main>
        </div>
    );
}
