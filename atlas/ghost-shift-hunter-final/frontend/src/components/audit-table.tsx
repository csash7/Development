'use client';

import { useState } from 'react';
import { DiscrepancyReport } from '@/lib/types';
import { ShieldAlert, CheckCircle, Clock, ChevronDown, ChevronRight, AlertTriangle, Database, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AuditTableProps {
    reports: DiscrepancyReport[];
    columnHeaders: string[];
}

export function AuditTable({ reports, columnHeaders }: AuditTableProps) {
    const safeReports = reports || [];
    const issues = safeReports.filter(r => r.has_issue);

    // Default columns if none provided
    const headers = columnHeaders.length > 0
        ? columnHeaders
        : ['Name', 'Role', 'Time In', 'Time Out', 'Supervisor', 'Status'];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    Extracted Log Data
                </h2>
                <div className="text-[10px] md:text-xs font-mono text-text-muted">
                    {issues.length} ISSUES • {safeReports.length} WORKERS
                </div>
            </div>

            {/* Table with horizontal scroll on mobile */}
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <div className="bg-surface/50 border border-white/10 rounded-lg overflow-hidden min-w-[600px] md:min-w-0">
                    <div className="grid gap-0 divide-y divide-white/5">
                        {/* Header Row */}
                        <div className="grid grid-cols-[40px_1fr_1fr_100px_100px_80px_100px] gap-2 px-3 md:px-4 py-2 md:py-3 bg-white/5 text-[10px] md:text-xs font-mono text-text-muted uppercase">
                            <div></div>
                            <div>Name</div>
                            <div>Role</div>
                            <div>Time In</div>
                            <div>Time Out</div>
                            <div>Supervisor</div>
                            <div className="text-right">Status</div>
                        </div>

                        {/* Data Rows */}
                        {safeReports.map((report, idx) => (
                            <AccordionRow key={idx} report={report} index={idx} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AccordionRow({ report, index }: { report: DiscrepancyReport; index: number }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const isGhost = report.issue_type === "GHOST_SHIFT";
    const isUnauth = report.issue_type === "UNAUTHORIZED";
    const isLate = report.issue_type === "LATE_ARRIVAL";
    const isTimeTheft = report.issue_type === "TIME_THEFT";
    const isClean = !report.has_issue;

    const statusColor = isGhost || isUnauth || isTimeTheft
        ? "text-red-400 bg-red-500/10 border-red-500/20"
        : isLate
            ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
            : "text-green-400 bg-green-500/10 border-green-500/20";

    const rowBg = isGhost || isUnauth || isTimeTheft
        ? "bg-red-950/10 hover:bg-red-950/20"
        : isLate
            ? "bg-yellow-950/10 hover:bg-yellow-950/20"
            : "hover:bg-white/5";

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            {/* Main Row */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "grid grid-cols-[40px_1fr_1fr_100px_100px_80px_100px] gap-2 px-4 py-3 cursor-pointer transition-colors",
                    rowBg
                )}
            >
                <div className="flex items-center">
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-primary" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-white/30" />
                    )}
                </div>
                <div className="text-sm text-white font-medium flex items-center gap-2">
                    {!isClean && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                    {report.worker_name}
                </div>
                <div className="text-sm text-text-muted">
                    {report.paper_data?.Role || report.paper_data?.role || report.paper_data?.['Role'] || '-'}
                </div>
                <div className="text-sm text-text-muted font-mono">
                    {report.paper_data?.['Time In'] || report.paper_data?.time_in || report.paper_data?.['Time-In'] || report.paper_data?.TimeIn || '-'}
                </div>
                <div className="text-sm text-text-muted font-mono">
                    {report.paper_data?.['Time Out'] || report.paper_data?.time_out || report.paper_data?.['Time-Out'] || report.paper_data?.TimeOut || '-'}
                </div>
                <div className="text-sm text-text-muted">
                    {report.paper_data?.Supervisor || report.paper_data?.supervisor || report.paper_data?.['Supervisor'] || '-'}
                </div>
                <div className="flex justify-end">
                    <span className={cn(
                        "text-[10px] uppercase font-mono px-2 py-0.5 rounded border",
                        statusColor
                    )}>
                        {report.issue_type.replace(/_/g, ' ')}
                    </span>
                </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-black/30 border-t border-white/5"
                    >
                        <div className="p-4 grid grid-cols-2 gap-4">
                            {/* Paper Data (Left) */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-mono text-primary uppercase">
                                    <FileText className="w-3 h-3" />
                                    Paper Log Data
                                </div>
                                <div className="space-y-2">
                                    {Object.entries(report.paper_data || {}).map(([key, value]) => (
                                        <div key={key} className="flex justify-between text-xs">
                                            <span className="text-text-muted">{key}:</span>
                                            <span className="text-white font-mono">{value || '-'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Database Data (Right) */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase">
                                    <Database className="w-3 h-3" />
                                    Database Record
                                </div>
                                <div className="space-y-2">
                                    {Object.entries(report.database_data || {}).map(([key, value]) => (
                                        <div key={key} className="flex justify-between text-xs">
                                            <span className="text-text-muted">{key}:</span>
                                            <span className="text-white font-mono">{value || '-'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Flags Section */}
                            {report.flags && report.flags.length > 0 && (
                                <div className="col-span-2 mt-2 pt-3 border-t border-white/5">
                                    <div className="text-xs font-mono text-yellow-400 uppercase mb-2">⚠️ Flags</div>
                                    <div className="space-y-1">
                                        {report.flags.map((flag, i) => (
                                            <div key={i} className="text-xs text-yellow-300/80 flex items-start gap-2">
                                                <span>•</span>
                                                <span>{flag}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Mismatched Fields */}
                            {report.mismatched_fields && report.mismatched_fields.length > 0 && (
                                <div className="col-span-2 mt-2 pt-3 border-t border-white/5">
                                    <div className="text-xs font-mono text-red-400 uppercase mb-2">❌ Mismatches</div>
                                    <div className="space-y-2">
                                        {report.mismatched_fields.map((field, i) => (
                                            <div key={i} className="flex items-center gap-4 text-xs">
                                                <span className="text-text-muted w-24">{field.field_name}:</span>
                                                <span className="text-red-300 font-mono">Paper: {field.paper_value}</span>
                                                <span className="text-white/30">vs</span>
                                                <span className="text-cyan-300 font-mono">DB: {field.database_value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Agent Reasoning */}
                            <div className="col-span-2 mt-2 pt-3 border-t border-white/5">
                                <div className="text-xs font-mono text-text-muted uppercase mb-2">🤖 Agent Reasoning</div>
                                <p className="text-xs text-white/70 leading-relaxed">{report.reasoning}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
