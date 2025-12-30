'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Search, MapPin, User, Ruler } from 'lucide-react';

interface LandRecord {
    id: string;
    survey_number: string;
    sub_division: string | null;
    district_code: string;
    mandal_code: string;
    village_code: string;
    khata_number: string | null;
    extent_acres: number | null;
    extent_guntas: number | null;
    land_classification: string | null;
    status: string;
    scraped_at: string;
}

const API_BASE = 'http://31.97.212.67:8080/api';

export default function RecordsPage() {
    const [records, setRecords] = useState<LandRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchRecords = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (searchQuery) params.append('survey', searchQuery);

            const response = await fetch(`${API_BASE}/records?${params}`);
            if (!response.ok) throw new Error('Failed to fetch records');
            const data = await response.json();
            setRecords(data);
            setError(null);
        } catch (err) {
            setError('Could not connect to backend');
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchRecords();
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Scraped Records</h1>
                    <p className="text-slate-400 mt-1">Browse land records from the database</p>
                </div>
                <button
                    onClick={fetchRecords}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-6">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by survey number..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white rounded-xl transition-colors"
                    >
                        Search
                    </button>
                </div>
            </form>

            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                    {error}
                </div>
            )}

            {/* Records Grid */}
            {records.length === 0 ? (
                <div className="text-center py-16 bg-slate-800/50 rounded-2xl border border-white/5">
                    <p className="text-slate-400">
                        {loading ? 'Loading records...' : 'No records found. Start a scrape job to populate the database.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {records.map((record) => (
                        <div
                            key={record.id}
                            className="bg-slate-800/50 rounded-2xl border border-white/5 p-5 hover:border-amber-500/30 transition-colors"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">
                                        Survey No: {record.survey_number}
                                        {record.sub_division && <span className="text-amber-400">/{record.sub_division}</span>}
                                    </h3>
                                    <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                                        <MapPin className="w-3 h-3" />
                                        {record.district_code} / {record.mandal_code} / {record.village_code}
                                    </p>
                                </div>
                                <span
                                    className={`px-2 py-1 rounded-full text-xs ${record.status === 'active'
                                            ? 'bg-emerald-500/10 text-emerald-400'
                                            : record.status === 'disputed'
                                                ? 'bg-red-500/10 text-red-400'
                                                : 'bg-amber-500/10 text-amber-400'
                                        }`}
                                >
                                    {record.status}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm">
                                {record.khata_number && (
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <span className="text-slate-500">Khata:</span>
                                        {record.khata_number}
                                    </div>
                                )}
                                {(record.extent_acres || record.extent_guntas) && (
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Ruler className="w-4 h-4 text-slate-500" />
                                        {record.extent_acres ? `${record.extent_acres} Ac` : ''}
                                        {record.extent_guntas ? ` ${record.extent_guntas} Gu` : ''}
                                    </div>
                                )}
                                {record.land_classification && (
                                    <div className="text-slate-400">
                                        {record.land_classification}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-white/5 text-xs text-slate-500">
                                Scraped: {new Date(record.scraped_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
