'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, MapPin, User, FileText, Hash } from 'lucide-react';
import districts from '@/lib/data/districts.json';
import mandalsData from '@/lib/data/mandals.json';

type SearchType = 'surveyNumber' | 'ownerName' | 'khataNumber' | 'documentNumber';

interface SearchBarProps {
    variant?: 'hero' | 'compact';
    initialSearchType?: SearchType;
    initialDistrict?: string;
    initialMandal?: string;
    initialQuery?: string;
}

const searchTypes = [
    { value: 'surveyNumber', label: 'Survey Number', icon: Hash, placeholder: 'Enter survey number (e.g., 123/1A)' },
    { value: 'ownerName', label: 'Owner Name', icon: User, placeholder: 'Enter owner name' },
    { value: 'khataNumber', label: 'Khata Number', icon: FileText, placeholder: 'Enter khata number' },
    { value: 'documentNumber', label: 'Document Number', icon: FileText, placeholder: 'Enter document number' },
];

export default function SearchBar({
    variant = 'hero',
    initialSearchType = 'surveyNumber',
    initialDistrict = '',
    initialMandal = '',
    initialQuery = '',
}: SearchBarProps) {
    const router = useRouter();
    const [searchType, setSearchType] = useState<SearchType>(initialSearchType);
    const [district, setDistrict] = useState(initialDistrict);
    const [mandal, setMandal] = useState(initialMandal);
    const [query, setQuery] = useState(initialQuery);
    const [isSearchTypeOpen, setIsSearchTypeOpen] = useState(false);

    const mandals = district ? (mandalsData as Record<string, Array<{ code: string; name: string; nameTeugu: string }>>)[district] || [] : [];
    const selectedSearchType = searchTypes.find((t) => t.value === searchType)!;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        const params = new URLSearchParams();
        params.set('type', searchType);
        params.set('q', query);
        if (district) params.set('district', district);
        if (mandal) params.set('mandal', mandal);

        router.push(`/search?${params.toString()}`);
    };

    if (variant === 'compact') {
        return (
            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search land records..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    />
                </div>
                <button
                    type="submit"
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-medium rounded-lg transition-all"
                >
                    Search
                </button>
            </form>
        );
    }

    return (
        <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto">
            {/* Search Type Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
                {searchTypes.map((type) => (
                    <button
                        key={type.value}
                        type="button"
                        onClick={() => setSearchType(type.value as SearchType)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${searchType === type.value
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                            }`}
                    >
                        <type.icon className="w-4 h-4" />
                        {type.label}
                    </button>
                ))}
            </div>

            {/* Main Search Box */}
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10">
                {/* Location Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
                        <select
                            value={district}
                            onChange={(e) => {
                                setDistrict(e.target.value);
                                setMandal('');
                            }}
                            className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                        >
                            <option value="">All Districts</option>
                            {districts.map((d) => (
                                <option key={d.code} value={d.code}>
                                    {d.name} ({d.nameTeugu})
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
                        <select
                            value={mandal}
                            onChange={(e) => setMandal(e.target.value)}
                            disabled={!district}
                            className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">All Mandals</option>
                            {mandals.map((m) => (
                                <option key={m.code} value={m.code}>
                                    {m.name} ({m.nameTeugu})
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                    <selectedSearchType.icon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-amber-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={selectedSearchType.placeholder}
                        className="w-full pl-14 pr-36 py-4 bg-white text-slate-900 rounded-xl text-lg placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-amber-500/30"
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                        <Search className="w-5 h-5" />
                        <span className="hidden sm:inline">Search</span>
                    </button>
                </div>
            </div>

            {/* Quick Tips */}
            <div className="mt-4 text-center">
                <p className="text-white/50 text-sm">
                    Tip: Enter survey number like <span className="text-amber-400">123/1A</span> or owner name like{' '}
                    <span className="text-amber-400">Ramesh Reddy</span>
                </p>
            </div>
        </form>
    );
}
