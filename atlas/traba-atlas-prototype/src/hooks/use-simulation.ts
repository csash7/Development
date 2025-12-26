import { useState, useEffect, useRef, useCallback } from 'react';
import { Worker, Zone, Alert, Metrics, Position } from '@/lib/types';

const ZONES: Zone[] = [
    { id: 'z1', name: 'Receiving Dock A', type: 'RECEIVING', x: 2, y: 2, width: 20, height: 30, color: 'bg-blue-900/20 border-blue-500/30' },
    { id: 'z2', name: 'Packing Line 1', type: 'PACKING', x: 25, y: 5, width: 40, height: 15, color: 'bg-purple-900/20 border-primary-500/30' },
    { id: 'z3', name: 'Packing Line 2', type: 'PACKING', x: 25, y: 25, width: 40, height: 15, color: 'bg-purple-900/20 border-primary-500/30' },
    { id: 'z4', name: 'Shipping Bay', type: 'SHIPPING', x: 70, y: 2, width: 25, height: 40, color: 'bg-green-900/20 border-green-500/30' },
    { id: 'z5', name: 'Overflow Storage', type: 'STORAGE', x: 25, y: 50, width: 40, height: 40, color: 'bg-amber-900/20 border-amber-500/30' },
];

const INITIAL_WORKERS_COUNT = 15;
const FIELD_WIDTH = 100;
const FIELD_HEIGHT = 100;

function generateWorker(id: string): Worker {
    return {
        id,
        name: `Worker ${id}`,
        role: 'Associate',
        position: { x: Math.random() * 90 + 5, y: Math.random() * 90 + 5 },
        status: 'IDLE',
        efficiency: 100,
    };
}

export function useSimulation() {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [metrics, setMetrics] = useState<Metrics>({
        efficiency: 92,
        activeWorkers: INITIAL_WORKERS_COUNT,
        throughput: 450,
        fulfillmentRate: 98.5,
        roiGenerated: 12450,
    });

    // Init workers
    useEffect(() => {
        const initWorkers = Array.from({ length: INITIAL_WORKERS_COUNT }).map((_, i) =>
            generateWorker(`w-${i + 1}`)
        );
        setWorkers(initWorkers);
    }, []);

    // Movement & Logic Loop
    useEffect(() => {
        const interval = setInterval(() => {
            setWorkers(prev => prev.map(w => {
                // 1. Logic: If IDLE, pick a target
                if (!w.targetPosition && Math.random() > 0.99) {
                    const randomZone = ZONES[Math.floor(Math.random() * ZONES.length)];
                    const target = {
                        x: randomZone.x + Math.random() * randomZone.width,
                        y: randomZone.y + Math.random() * randomZone.height
                    };
                    return { ...w, targetPosition: target, status: 'MOVING' };
                }

                // 2. Logic: Move towards target
                if (w.targetPosition) {
                    const dx = w.targetPosition.x - w.position.x;
                    const dy = w.targetPosition.y - w.position.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 0.5) {
                        // Arrived
                        return { ...w, position: w.targetPosition, targetPosition: undefined, status: 'WORKING' };
                    } else {
                        // Move
                        const speed = 0.15;
                        return {
                            ...w,
                            position: {
                                x: w.position.x + (dx / dist) * speed,
                                y: w.position.y + (dy / dist) * speed
                            }
                        };
                    }
                }

                // Randomly go status ISSUE
                if (w.status === 'WORKING' && Math.random() > 0.995 && w.efficiency > 50) {
                    return { ...w, status: 'ISSUE', efficiency: 45 };
                }

                return w;
            }));

            setMetrics(prev => ({
                ...prev,
                throughput: Math.max(0, prev.throughput + (Math.random() - 0.5) * 2),
                roiGenerated: prev.roiGenerated + 0.05
            }));

        }, 100);

        return () => clearInterval(interval);
    }, []);

    // AI "Director" Loop - Generates Alerts
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.7) return; // Only sometimes

            const types: { title: string, msg: string, sev: Alert['severity'], action: string }[] = [
                { title: 'Efficiency Drop', msg: 'Packing Line 1 efficiency below 85%.', sev: 'MEDIUM', action: 'Rebalance Lines' },
                { title: 'Bottleneck Detected', msg: 'Shipping Bay queue exceeding 15 mins.', sev: 'HIGH', action: 'Deploy Flex Workers' },
                { title: 'Safety Violation', msg: 'Unexpected movement in restricted Aisle 4.', sev: 'CRITICAL', action: 'Halt Zone A' },
                { title: 'Optimal Path Found', msg: 'Route optimization available for Batch #99.', sev: 'LOW', action: 'Apply Optimization' },
            ];

            const template = types[Math.floor(Math.random() * types.length)];
            const newAlert: Alert = {
                id: Date.now().toString(),
                title: template.title,
                message: template.msg,
                severity: template.sev,
                timestamp: Date.now(),
                actionable: true,
                actionLabel: template.action,
                resolved: false
            };

            setAlerts(prev => [newAlert, ...prev].slice(0, 5)); // Keep last 5
        }, 8000); // Every 8 seconds

        return () => clearInterval(interval);
    }, []);

    const resolveAlert = useCallback((id: string) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
        setMetrics(prev => ({ ...prev, roiGenerated: prev.roiGenerated + 500, efficiency: Math.min(100, prev.efficiency + 2) }));

        // Also fix a worker if any have issues
        setWorkers(prev => {
            const issueWorker = prev.find(w => w.status === 'ISSUE');
            if (issueWorker) {
                return prev.map(w => w.id === issueWorker.id ? { ...w, status: 'WORKING', efficiency: 100 } : w);
            }
            return prev;
        });
    }, []);

    return { workers, zones: ZONES, alerts, metrics, resolveAlert };
}
