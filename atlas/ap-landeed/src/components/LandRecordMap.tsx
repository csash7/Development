'use client';

import dynamic from 'next/dynamic';
import { LandRecord } from '@/types';

// Dynamic import for MapView to avoid SSR issues with Mapbox
const MapView = dynamic(() => import('@/components/MapView'), {
    ssr: false,
    loading: () => (
        <div className="h-[250px] rounded-2xl bg-slate-800/50 animate-pulse flex items-center justify-center">
            <p className="text-slate-400">Loading map...</p>
        </div>
    ),
});

interface LandRecordMapProps {
    record: LandRecord;
}

export default function LandRecordMap({ record }: LandRecordMapProps) {
    return (
        <MapView
            records={[record]}
            center={record.coordinates}
            zoom={14}
            height="250px"
            showControls={true}
        />
    );
}
