'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LandRecord } from '@/types';
import { MapPin, Maximize2, Minimize2, Layers } from 'lucide-react';

mapboxgl.accessToken = 'pk.eyJ1IjoiY3Nhc2g3IiwiYSI6ImNtam16MWc3aTM0eGIzZXEzZXNqNnA1Y20ifQ.5CO2iTH6k16sZX2mGLjXUw';

interface MapViewProps {
    records?: LandRecord[];
    center?: [number, number]; // [lng, lat]
    zoom?: number;
    selectedRecordId?: string;
    onRecordSelect?: (record: LandRecord) => void;
    height?: string;
    showControls?: boolean;
}

// AP district centroids (approximate)
const districtCenters: Record<string, [number, number]> = {
    VSK: [83.3012, 17.6868], // Visakhapatnam
    GNT: [80.4365, 16.3067], // Guntur
    KRS: [80.6200, 16.5062], // Krishna (Vijayawada)
    EGD: [82.2475, 17.0005], // East Godavari
    WGD: [81.5212, 16.9174], // West Godavari
    CTR: [79.1003, 13.6288], // Chittoor
    NLR: [79.9865, 14.4426], // Nellore
    ATP: [77.5006, 14.6819], // Anantapur
    KNL: [78.0373, 15.8281], // Kurnool
    YSR: [78.8242, 14.4673], // Kadapa
    PKM: [79.8474, 15.3500], // Prakasam
    SKL: [84.0068, 18.2949], // Srikakulam
    VZN: [83.3956, 18.1066], // Vizianagaram
};

// AP state center
const AP_CENTER: [number, number] = [79.9740, 15.9129];

export default function MapView({
    records = [],
    center,
    zoom = 7,
    selectedRecordId,
    onRecordSelect,
    height = '400px',
    showControls = true,
}: MapViewProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mapStyle, setMapStyle] = useState<'satellite' | 'streets'>('satellite');

    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: mapStyle === 'satellite'
                ? 'mapbox://styles/mapbox/satellite-streets-v12'
                : 'mapbox://styles/mapbox/streets-v12',
            center: center || AP_CENTER,
            zoom: zoom,
            attributionControl: false,
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add scale
        map.current.addControl(new mapboxgl.ScaleControl({ maxWidth: 150 }), 'bottom-left');

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, []);

    // Update map style
    useEffect(() => {
        if (!map.current) return;

        const newStyle = mapStyle === 'satellite'
            ? 'mapbox://styles/mapbox/satellite-streets-v12'
            : 'mapbox://styles/mapbox/streets-v12';

        map.current.setStyle(newStyle);
    }, [mapStyle]);

    // Update markers when records change
    useEffect(() => {
        if (!map.current) return;

        // Clear existing markers
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        // Add new markers
        records.forEach((record) => {
            // Get coordinates from record or use district center
            const coords = record.coordinates || districtCenters[record.districtCode] || AP_CENTER;

            // Create custom marker element
            const el = document.createElement('div');
            el.className = 'map-marker';
            el.innerHTML = `
        <div class="relative cursor-pointer group">
          <div class="${selectedRecordId === record.id
                    ? 'w-8 h-8 bg-amber-500 ring-4 ring-amber-500/30'
                    : 'w-6 h-6 bg-amber-500 hover:bg-amber-400'} 
            rounded-full flex items-center justify-center shadow-lg transition-all transform ${selectedRecordId === record.id ? 'scale-110' : 'hover:scale-110'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-500 rotate-45"></div>
        </div>
      `;

            // Add slight random offset to prevent overlapping
            const offsetLng = (Math.random() - 0.5) * 0.02;
            const offsetLat = (Math.random() - 0.5) * 0.02;

            const marker = new mapboxgl.Marker(el)
                .setLngLat([coords[0] + offsetLng, coords[1] + offsetLat])
                .addTo(map.current!);

            // Create popup
            const popup = new mapboxgl.Popup({
                offset: 25,
                closeButton: false,
                className: 'land-record-popup',
            }).setHTML(`
        <div class="p-3 min-w-[200px]">
          <div class="font-semibold text-slate-900 mb-1">
            Survey No: ${record.surveyNumber}${record.subDivision ? '/' + record.subDivision : ''}
          </div>
          <div class="text-sm text-slate-600 mb-2">
            ${record.village}, ${record.mandal}
          </div>
          <div class="text-xs text-slate-500">
            ${record.owners[0].name}
          </div>
          <div class="mt-2 pt-2 border-t border-slate-200">
            <div class="text-xs text-amber-600 font-medium">
              ${record.extent.acres ? record.extent.acres + ' Ac ' : ''}
              ${record.extent.guntas ? record.extent.guntas + ' Gu ' : ''}
              • ${record.landClassification}
            </div>
          </div>
        </div>
      `);

            marker.setPopup(popup);

            // Click handler
            el.addEventListener('click', () => {
                if (onRecordSelect) {
                    onRecordSelect(record);
                }
            });

            markersRef.current.push(marker);
        });

        // Fit bounds if multiple records
        if (records.length > 1 && map.current) {
            const bounds = new mapboxgl.LngLatBounds();
            records.forEach((record) => {
                const coords = record.coordinates || districtCenters[record.districtCode] || AP_CENTER;
                bounds.extend(coords);
            });
            map.current.fitBounds(bounds, { padding: 50, maxZoom: 10 });
        }
    }, [records, selectedRecordId, onRecordSelect]);

    // Update center when prop changes
    useEffect(() => {
        if (map.current && center) {
            map.current.flyTo({ center, zoom: zoom || 12, duration: 1500 });
        }
    }, [center, zoom]);

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    return (
        <div
            className={`relative rounded-2xl overflow-hidden border border-white/10 ${isFullscreen ? 'fixed inset-4 z-50' : ''
                }`}
            style={{ height: isFullscreen ? 'auto' : height }}
        >
            {/* Map Container */}
            <div ref={mapContainer} className="w-full h-full" />

            {/* Overlay Controls */}
            {showControls && (
                <>
                    {/* Style Toggle */}
                    <div className="absolute top-3 left-3 flex gap-2">
                        <button
                            onClick={() => setMapStyle(mapStyle === 'satellite' ? 'streets' : 'satellite')}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-white text-sm rounded-lg border border-white/10 transition-colors backdrop-blur-sm"
                        >
                            <Layers className="w-4 h-4" />
                            {mapStyle === 'satellite' ? 'Streets' : 'Satellite'}
                        </button>
                    </div>

                    {/* Fullscreen Toggle */}
                    <button
                        onClick={toggleFullscreen}
                        className="absolute top-3 right-14 p-2 bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg border border-white/10 transition-colors backdrop-blur-sm"
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>

                    {/* AP Focus Button */}
                    <button
                        onClick={() => map.current?.flyTo({ center: AP_CENTER, zoom: 7, duration: 1500 })}
                        className="absolute bottom-6 right-3 flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium rounded-lg shadow-lg transition-colors"
                    >
                        <MapPin className="w-4 h-4" />
                        Andhra Pradesh
                    </button>
                </>
            )}

            {/* Fullscreen backdrop */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 bg-black/60 -z-10"
                    onClick={() => setIsFullscreen(false)}
                />
            )}

            {/* Custom Popup Styles */}
            <style jsx global>{`
        .mapboxgl-popup-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          padding: 0;
          overflow: hidden;
        }
        .mapboxgl-popup-tip {
          border-top-color: white;
        }
        .mapboxgl-ctrl-group {
          background: rgba(15, 23, 42, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .mapboxgl-ctrl-group button {
          background: transparent !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        .mapboxgl-ctrl-group button:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
        .mapboxgl-ctrl-group button span {
          filter: invert(1);
        }
        .mapboxgl-ctrl-scale {
          background: rgba(15, 23, 42, 0.8) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          border-radius: 4px !important;
        }
      `}</style>
        </div>
    );
}
