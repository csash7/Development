'use client';

import { useSimulation } from '@/hooks/use-simulation';
import { MetricsBar } from '@/components/metrics-bar';
import { WarehouseMap } from '@/components/warehouse-map';
import { AgentSidebar } from '@/components/agent-sidebar';
import { Hexagon } from 'lucide-react';

export default function Home() {
  const { workers, zones, alerts, metrics, resolveAlert } = useSimulation();

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden relative">
      {/* Navbar / Top */}
      <header className="h-16 border-b border-border bg-black/60 backdrop-blur-md flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <Hexagon className="w-5 h-5 text-white fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">TRABA <span className="text-primary-glow font-light">ATLAS</span></h1>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-mono">Operations Command v0.9</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs font-mono text-green-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            SYSTEM OPTIMAL
          </div>
          <div className="w-8 h-8 rounded-full bg-white/10" />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: Main View */}
        <div className="flex-1 flex flex-col relative">

          {/* HUD / Metrics */}
          <div className="z-10 relative">
            <MetricsBar metrics={metrics} />
          </div>

          {/* Map / Visualization */}
          <div className="flex-1 relative p-6">
            <WarehouseMap workers={workers} zones={zones} />

            {/* Floating Overlay for Context */}
            <div className="absolute bottom-10 left-10 pointer-events-none p-4 rounded bg-black/50 backdrop-blur border border-white/5 text-xs font-mono text-white/50">
              <div className="mb-1 text-white">Zone D: 98% Cap</div>
              <div className="mb-1 text-white">Line A: 100% Cap</div>
              <div className="text-white/30">Syncing...</div>
            </div>
          </div>

        </div>

        {/* Right: Agent Sidebar */}
        <AgentSidebar alerts={alerts} onResolve={resolveAlert} />

      </div>
    </div>
  );
}
