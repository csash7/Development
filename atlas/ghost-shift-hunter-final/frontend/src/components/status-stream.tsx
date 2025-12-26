'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, ChevronRight } from 'lucide-react';

export function StatusStream({ logs }: { logs: string[] }) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    if (logs.length === 0) return null;

    return (
        <div className="w-full bg-black/80 rounded-lg border border-white/10 p-4 font-mono text-xs overflow-hidden flex flex-col gap-2 shadow-2xl">
            <div className="flex items-center gap-2 text-primary border-b border-white/10 pb-2 mb-2">
                <Terminal className="w-3 h-3" />
                <span className="tracking-widest">AGENT_CHAIN_OF_THOUGHT</span>
            </div>

            <div className="flex flex-col gap-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {logs.map((log, index) => {
                        const isLast = index === logs.length - 1;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`flex items-start gap-2 ${isLast ? "text-white font-bold" : "text-white/60"}`}
                            >
                                <ChevronRight className={`w-3 h-3 mt-0.5 shrink-0 ${isLast ? "text-primary" : "text-white/20"}`} />
                                <span>{log}</span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
