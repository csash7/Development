export type ZoneType = 'RECEIVING' | 'PACKING' | 'SHIPPING' | 'STORAGE' | 'BREAK';

export interface Position {
    x: number;
    y: number;
}

export interface Zone {
    id: string;
    name: string;
    type: ZoneType;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
}

export type WorkerStatus = 'IDLE' | 'WORKING' | 'MOVING' | 'ISSUE' | 'OFFLINE';

export interface Worker {
    id: string;
    name: string;
    role: string;
    position: Position;
    targetPosition?: Position;
    status: WorkerStatus;
    efficiency: number; // 0-100
    assignedZoneId?: string;
}

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Alert {
    id: string;
    title: string;
    message: string;
    severity: AlertSeverity;
    timestamp: number;
    actionable: boolean;
    actionLabel?: string;
    actionHandler?: () => void;
    resolved: boolean;
}

export interface Metrics {
    efficiency: number;
    activeWorkers: number;
    throughput: number; // Units per hour
    fulfillmentRate: number; // %
    roiGenerated: number; // $ demo metric
}
