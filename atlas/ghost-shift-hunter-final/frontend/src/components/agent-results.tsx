'use client';

import { DiscrepancyReport, DiscrepancyType } from '@/lib/types';
import { ShieldAlert, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function AgentResults({ reports }: { reports: DiscrepancyReport[] }) {
    const issues = reports.filter(r => r.has_issue);
    const clean = reports.filter(r => !r.has_issue);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-primary" />
                    Audit Findings
                </h2>
                <div className="text-xs font-mono text-text-muted">
                    {issues.length} ISSUES FOUND
                </div>
            </div>

            <div className="grid gap-4">
                {reports.map((report, idx) => (
                    <ResultCard key={idx} report={report} index={idx} />
                ))}
            </div>
        </div>
    );
}

function ResultCard({ report, index }: { report: DiscrepancyReport, index: number }) {
    const isGhost = report.issue_type === "GHOST_SHIFT";
    const isUnauth = report.issue_type === "UNAUTHORIZED";
    const isLate = report.issue_type === "LATE_ARRIVAL";
    const isClean = !report.has_issue;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "p-4 rounded-lg border flex flex-col gap-2",
                isGhost || isUnauth ? "bg-red-950/20 border-red-500/30" :
                    isLate ? "bg-yellow-950/20 border-yellow-500/30" :
                        "bg-green-950/20 border-green-500/30"
            )}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {isGhost || isUnauth ? <ShieldAlert className="w-4 h-4 text-red-500" /> :
                        isLate ? <Clock className="w-4 h-4 text-yellow-500" /> :
                            <CheckCircle className="w-4 h-4 text-green-500" />}

                    <span className="font-bold text-sm text-white">{report.worker_name}</span>
                </div>
                <div className={cn(
                    "text-[10px] uppercase font-mono px-2 py-0.5 rounded border",
                    isGhost || isUnauth ? "text-red-400 border-red-500/20 bg-red-500/10" :
                        isLate ? "text-yellow-400 border-yellow-500/20 bg-yellow-500/10" :
                            "text-green-400 border-green-500/20 bg-green-500/10"
                )}>
                    {report.issue_type.replace('_', ' ')}
                </div>
            </div>

            {report.has_issue && (
                <div className="text-xs text-text-muted mt-1 leading-relaxed">
                    {report.reasoning}
                </div>
            )}

            {report.has_issue && (
                <div className="mt-2 p-2 bg-black/20 rounded border border-white/5">
                    <div className="text-[10px] text-white/30 uppercase mb-1">Evidence Trail</div>
                    {report.evidence.map((e, i) => (
                        <div key={i} className="text-[10px] font-mono text-white/50">• {e}</div>
                    ))}
                </div>
            )}

        </motion.div>
    );
}
