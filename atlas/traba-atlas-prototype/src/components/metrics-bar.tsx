'use client';

import { Metrics } from '@/lib/types';
import { Activity, Zap, Box, DollarSign } from 'lucide-react';

interface MetricsBarProps {
    metrics: Metrics;
}

export function MetricsBar({ metrics }: MetricsBarProps) {
    return (
        <div className="flex items-center gap-4 w-full p-4 bg-surface border-b border-border">
            <div className="flex-1 flex gap-6">
                <MetricCard
                    label="Efficiency"
                    value={`${metrics.efficiency.toFixed(1)}%`}
                    icon={<Zap className="w-4 h-4 text-purple-400" />}
                    trend={metrics.efficiency > 90 ? 'High' : 'Normal'}
                />
                <MetricCard
                    label="Active Workers"
                    value={metrics.activeWorkers.toString()}
                    icon={<Activity className="w-4 h-4 text-blue-400" />}
                />
                <MetricCard
                    label="Throughput /hr"
                    value={Math.floor(metrics.throughput).toString()}
                    icon={<Box className="w-4 h-4 text-green-400" />}
                />
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30">
                <DollarSign className="w-5 h-5 text-green-400" />
                <div>
                    <div className="text-[10px] text-purple-200/60 uppercase tracking-wider font-bold">ROI Generated (Hourly)</div>
                    <div className="text-xl font-mono text-green-300 font-bold">${metrics.roiGenerated.toFixed(2)}</div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, icon, trend }: { label: string, value: string, icon: any, trend?: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-white/5 border border-white/5">
                {icon}
            </div>
            <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</div>
                <div className="text-lg font-bold font-mono text-foreground flex items-center gap-2">
                    {value}
                    {trend && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">{trend}</span>}
                </div>
            </div>
        </div>
    );
}
