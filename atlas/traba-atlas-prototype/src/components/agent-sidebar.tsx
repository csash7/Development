'use client';

import { Alert } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Terminal, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentSidebarProps {
    alerts: Alert[];
    onResolve: (id: string) => void;
}

export function AgentSidebar({ alerts, onResolve }: AgentSidebarProps) {
    return (
        <div className="w-[400px] h-full bg-surface border-l border-border flex flex-col shadow-2xl z-20">
            {/* Header */}
            <div className="p-4 border-b border-border bg-surface-highlight flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 relative">
                    <Cpu className="w-5 h-5 text-primary-glow" />
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface animate-pulse" />
                </div>
                <div>
                    <h2 className="font-bold text-white tracking-tight">Atlas Agent</h2>
                    <div className="text-xs text-primary-glow/80 font-mono">v2.4.0 • Connected</div>
                </div>
            </div>

            {/* Chat / Feed Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Intro Message */}
                <div className="bg-white/5 border border-white/5 rounded-lg p-3 text-sm text-muted-foreground font-mono">
                    <span className="text-blue-400">System:</span> Monitoring all zones. Anomaly detection active. Ready for intervention.
                </div>

                <AnimatePresence>
                    {alerts.map(alert => (
                        <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, x: 20, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: 'auto' }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                                "rounded-lg border p-4 shadow-lg relative overflow-hidden group",
                                alert.resolved ? "border-green-500/20 bg-green-500/5 opacity-60" :
                                    alert.severity === 'CRITICAL' ? "border-red-500/40 bg-red-500/10" :
                                        alert.severity === 'HIGH' ? "border-orange-500/40 bg-orange-500/10" :
                                            "border-blue-500/30 bg-blue-500/5"
                            )}
                        >
                            {/* Decorative side bar */}
                            <div className={cn("absolute left-0 top-0 bottom-0 w-1",
                                alert.severity === 'CRITICAL' ? "bg-red-500" :
                                    alert.severity === 'HIGH' ? "bg-orange-500" : "bg-blue-500"
                            )} />

                            <div className="flex justify-between items-start mb-2 pl-2">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 opacity-70" />
                                    <span className="font-bold text-sm tracking-wide">{alert.title}</span>
                                </div>
                                <span className="text-[10px] font-mono opacity-50">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            </div>

                            <div className="pl-2 text-sm text-gray-300 mb-3 leading-relaxed">
                                {alert.message}
                            </div>

                            {alert.actionable && !alert.resolved && (
                                <div className="pl-2">
                                    <button
                                        onClick={() => onResolve(alert.id)}
                                        className="w-full py-2 bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/50 text-xs font-bold text-primary-glow flex items-center justify-center gap-2 rounded transition-all active:scale-95"
                                    >
                                        <Terminal className="w-3 h-3" />
                                        AUTO-FIX: {alert.actionLabel}
                                    </button>
                                    <div className="text-[10px] text-center mt-1 text-white/30">Est. ROI: $500/hr saved</div>
                                </div>
                            )}

                            {alert.resolved && (
                                <div className="pl-2 flex items-center gap-2 text-green-400 text-xs font-bold mt-2">
                                    <CheckCircle className="w-3 h-3" />
                                    Optimization Applied
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Input Placeholder (Visual only for now) */}
            <div className="p-4 border-t border-border">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Ask Atlas about the warehouse state..."
                        className="w-full bg-black/40 border border-white/10 rounded-md py-3 pl-4 pr-10 text-sm focus:outline-none focus:border-primary/50 text-white placeholder:text-white/20"
                        disabled
                    />
                    <div className="absolute right-3 top-3 text-white/20">⏎</div>
                </div>
            </div>
        </div>
    );
}
