'use client';

import { motion } from 'framer-motion';
import { Worker, Zone } from '@/lib/types';
import { cn } from '@/lib/utils';

interface WarehouseMapProps {
    workers: Worker[];
    zones: Zone[];
}

export function WarehouseMap({ workers, zones }: WarehouseMapProps) {
    return (
        <div className="relative w-full h-full bg-[#0a0a0a] overflow-hidden rounded-lg border border-white/5 shadow-2xl">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {/* Zones */}
            {zones.map(zone => (
                <div
                    key={zone.id}
                    className={cn("absolute rounded-md border flex items-center justify-center transition-colors", zone.color)}
                    style={{
                        left: `${zone.x}%`,
                        top: `${zone.y}%`,
                        width: `${zone.width}%`,
                        height: `${zone.height}%`,
                    }}
                >
                    <span className="text-[10px] uppercase tracking-widest font-mono text-white/40 font-bold rotate-0">
                        {zone.name}
                    </span>
                </div>
            ))}

            {/* Workers */}
            {workers.map(worker => (
                <motion.div
                    key={worker.id}
                    initial={false}
                    animate={{
                        left: `${worker.position.x}%`,
                        top: `${worker.position.y}%`,
                    }}
                    transition={{ type: 'tween', duration: 0.5, ease: 'linear' }} // Linear for continuous movement feel
                    className="absolute w-3 h-3 -ml-1.5 -mt-1.5 z-10 group cursor-pointer"
                >
                    {/* Status glow */}
                    <div className={cn(
                        "w-full h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                        worker.status === 'ISSUE' ? 'bg-red-500 shadow-red-500/50 animate-pulse' :
                            worker.status === 'WORKING' ? 'bg-green-400 shadow-green-400/30' :
                                'bg-blue-400 shadow-blue-400/30'
                    )} />

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 border border-white/10 rounded text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <div className="font-bold text-white">{worker.name}</div>
                        <div className="text-white/60">{worker.status} • Eff: {worker.efficiency}%</div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
