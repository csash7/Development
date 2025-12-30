'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { Search, Filter, MapPin, Map, Grid3X3 } from 'lucide-react';
import dynamic from 'next/dynamic';
import SearchBar from '@/components/SearchBar';
import LandRecordCard from '@/components/LandRecordCard';
import mockRecords from '@/lib/data/mock-records.json';
import districts from '@/lib/data/districts.json';
import { LandRecord } from '@/types';

// Dynamic import for MapView to avoid SSR issues with Mapbox
const MapView = dynamic(() => import('@/components/MapView'), {
    ssr: false,
    loading: () => (
        <div className="h-[400px] rounded-2xl bg-slate-800/50 animate-pulse flex items-center justify-center">
            <p className="text-slate-400">Loading map...</p>
        </div>
    ),
});

function SearchResults() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get('q') || '';
    const searchType = searchParams.get('type') || 'surveyNumber';
    const districtCode = searchParams.get('district') || '';
    const mandalCode = searchParams.get('mandal') || '';

    const [viewMode, setViewMode] = useState<'grid' | 'map' | 'split'>('split');
    const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

    const filteredRecords = useMemo(() => {
        let results = mockRecords as LandRecord[];

        // Filter by district
        if (districtCode) {
            results = results.filter((r) => r.districtCode === districtCode);
        }

        // Filter by mandal
        if (mandalCode) {
            results = results.filter((r) => r.mandalCode === mandalCode);
        }

        // Filter by search query
        if (query) {
            const queryLower = query.toLowerCase();
            results = results.filter((record) => {
                switch (searchType) {
                    case 'surveyNumber':
                        const surveyNumber = record.subDivision
                            ? `${record.surveyNumber}/${record.subDivision}`
                            : record.surveyNumber;
                        return surveyNumber.toLowerCase().includes(queryLower);
                    case 'ownerName':
                        return record.owners.some(
                            (owner) =>
                                owner.name.toLowerCase().includes(queryLower) ||
                                owner.nameTeugu?.toLowerCase().includes(queryLower)
                        );
                    case 'khataNumber':
                        return record.khataNumber?.toLowerCase().includes(queryLower);
                    case 'documentNumber':
                        return record.pattaNumber?.toLowerCase().includes(queryLower);
                    default:
                        return true;
                }
            });
        }

        return results;
    }, [query, searchType, districtCode, mandalCode]);

    const getDistrictName = () => {
        if (!districtCode) return null;
        const district = districts.find((d) => d.code === districtCode);
        return district?.name;
    };

    const handleRecordSelect = (record: LandRecord) => {
        setSelectedRecordId(record.id);
        router.push(`/land-record/${record.id}`);
    };

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header Section */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <h1 className="text-2xl font-bold text-white mb-6">Search Land Records</h1>
                    <SearchBar
                        variant="compact"
                        initialSearchType={searchType as any}
                        initialDistrict={districtCode}
                        initialMandal={mandalCode}
                        initialQuery={query}
                    />
                </div>
            </div>

            {/* Results Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Results Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            {filteredRecords.length} Record{filteredRecords.length !== 1 ? 's' : ''} Found
                        </h2>
                        {(query || districtCode) && (
                            <p className="text-slate-400 text-sm mt-1">
                                {query && (
                                    <span>
                                        Searching for "<span className="text-amber-400">{query}</span>"
                                    </span>
                                )}
                                {districtCode && (
                                    <span className="flex items-center gap-1 inline-flex ml-2">
                                        <MapPin className="w-3 h-3" />
                                        {getDistrictName()}
                                    </span>
                                )}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${viewMode === 'grid'
                                        ? 'bg-amber-500 text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Grid3X3 className="w-4 h-4" />
                                Grid
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${viewMode === 'map'
                                        ? 'bg-amber-500 text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                <Map className="w-4 h-4" />
                                Map
                            </button>
                            <button
                                onClick={() => setViewMode('split')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${viewMode === 'split'
                                        ? 'bg-amber-500 text-white'
                                        : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Split
                            </button>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
                            <Filter className="w-4 h-4" />
                            Filter
                        </button>
                    </div>
                </div>

                {/* Map View (shown in map or split mode) */}
                {(viewMode === 'map' || viewMode === 'split') && filteredRecords.length > 0 && (
                    <div className="mb-6">
                        <MapView
                            records={filteredRecords as LandRecord[]}
                            selectedRecordId={selectedRecordId || undefined}
                            onRecordSelect={handleRecordSelect}
                            height={viewMode === 'map' ? '600px' : '350px'}
                        />
                    </div>
                )}

                {/* Results Grid (shown in grid or split mode) */}
                {(viewMode === 'grid' || viewMode === 'split') && (
                    <>
                        {filteredRecords.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredRecords.map((record) => (
                                    <div
                                        key={record.id}
                                        onMouseEnter={() => setSelectedRecordId(record.id)}
                                        onMouseLeave={() => setSelectedRecordId(null)}
                                    >
                                        <LandRecordCard record={record as LandRecord} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
                                    <Search className="w-10 h-10 text-slate-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">No Records Found</h3>
                                <p className="text-slate-400 max-w-md mx-auto">
                                    We couldn't find any land records matching your search. Try adjusting your
                                    search terms or filters.
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Pagination Placeholder */}
                {filteredRecords.length > 0 && viewMode !== 'map' && (
                    <div className="mt-12 flex justify-center">
                        <div className="flex items-center gap-2">
                            <button
                                disabled
                                className="px-4 py-2 bg-slate-800 text-slate-500 rounded-lg text-sm cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                <button className="w-10 h-10 bg-amber-500 text-white rounded-lg text-sm font-medium">
                                    1
                                </button>
                            </div>
                            <button
                                disabled
                                className="px-4 py-2 bg-slate-800 text-slate-500 rounded-lg text-sm cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
                        <p className="text-slate-400">Loading search results...</p>
                    </div>
                </div>
            }
        >
            <SearchResults />
        </Suspense>
    );
}
