'use client';

import { useState } from 'react';
import {
    Search,
    FileText,
    Calendar,
    MapPin,
    ChevronDown,
    CheckCircle,
    AlertTriangle,
    Info,
} from 'lucide-react';
import districts from '@/lib/data/districts.json';

interface ECResult {
    documentNumber: string;
    propertyDescription: string;
    district: string;
    sro: string;
    fromDate: string;
    toDate: string;
    status: 'clear' | 'encumbered';
    encumbrances: Array<{
        type: string;
        documentNumber: string;
        documentDate: string;
        parties: string;
        amount?: number;
        description: string;
    }>;
}

// Mock EC data
const mockECResults: ECResult[] = [
    {
        documentNumber: 'EC-2024-VSK-00123',
        propertyDescription: 'Survey No. 123/1A, Rushikonda Village, Madhurawada Mandal',
        district: 'Visakhapatnam',
        sro: 'Madhurawada SRO',
        fromDate: '2014-01-01',
        toDate: '2024-12-26',
        status: 'clear',
        encumbrances: [],
    },
    {
        documentNumber: 'EC-2024-GNT-00456',
        propertyDescription: 'Survey No. 456/2B, Neerukonda Village, Mangalagiri Mandal',
        district: 'Guntur',
        sro: 'Mangalagiri SRO',
        fromDate: '2010-01-01',
        toDate: '2024-12-26',
        status: 'encumbered',
        encumbrances: [
            {
                type: 'Mortgage',
                documentNumber: 'DOC-2020-GNT-789',
                documentDate: '2020-06-15',
                parties: 'State Bank of India',
                amount: 2500000,
                description: 'Housing loan mortgage',
            },
        ],
    },
];

export default function EncumbrancePage() {
    const [searchType, setSearchType] = useState<'document' | 'property'>('document');
    const [documentNumber, setDocumentNumber] = useState('');
    const [district, setDistrict] = useState('');
    const [surveyNumber, setSurveyNumber] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [results, setResults] = useState<ECResult[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Return mock results
        setResults(mockECResults);
        setHasSearched(true);
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-4">
                            Encumbrance Certificate Search
                        </h1>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Verify if a property is free from any monetary or legal liabilities such as
                            mortgages, loans, or disputes.
                        </p>
                    </div>

                    {/* Search Form */}
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden">
                            {/* Search Type Tabs */}
                            <div className="flex border-b border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setSearchType('document')}
                                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${searchType === 'document'
                                            ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-500'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <FileText className="w-4 h-4 inline-block mr-2" />
                                    Search by Document Number
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSearchType('property')}
                                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${searchType === 'property'
                                            ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-500'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <MapPin className="w-4 h-4 inline-block mr-2" />
                                    Search by Property Details
                                </button>
                            </div>

                            <form onSubmit={handleSearch} className="p-6 space-y-4">
                                {searchType === 'document' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">
                                            Document Number
                                        </label>
                                        <input
                                            type="text"
                                            value={documentNumber}
                                            onChange={(e) => setDocumentNumber(e.target.value)}
                                            placeholder="Enter document number (e.g., DOC-2024-001)"
                                            className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="relative">
                                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                                    District
                                                </label>
                                                <select
                                                    value={district}
                                                    onChange={(e) => setDistrict(e.target.value)}
                                                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                                >
                                                    <option value="">Select District</option>
                                                    {districts.map((d) => (
                                                        <option key={d.code} value={d.code}>
                                                            {d.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 bottom-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                                    Survey Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={surveyNumber}
                                                    onChange={(e) => setSurveyNumber(e.target.value)}
                                                    placeholder="Enter survey number"
                                                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">
                                            <Calendar className="w-4 h-4 inline-block mr-1" />
                                            From Date
                                        </label>
                                        <input
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">
                                            <Calendar className="w-4 h-4 inline-block mr-1" />
                                            To Date
                                        </label>
                                        <input
                                            type="date"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Searching...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-5 h-5" />
                                            Search EC
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {hasSearched && (
                    <>
                        <h2 className="text-xl font-semibold text-white mb-6">
                            Search Results ({results.length})
                        </h2>

                        <div className="space-y-6">
                            {results.map((result) => (
                                <div
                                    key={result.documentNumber}
                                    className="bg-slate-800/50 rounded-2xl border border-white/5 overflow-hidden"
                                >
                                    {/* Header */}
                                    <div className="px-6 py-4 border-b border-white/5 flex items-start justify-between">
                                        <div>
                                            <p className="text-slate-400 text-sm mb-1">Document Number</p>
                                            <h3 className="text-xl font-semibold text-white">
                                                {result.documentNumber}
                                            </h3>
                                        </div>
                                        <div
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full ${result.status === 'clear'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                                }`}
                                        >
                                            {result.status === 'clear' ? (
                                                <>
                                                    <CheckCircle className="w-5 h-5" />
                                                    <span className="font-medium">Clear - No Encumbrances</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertTriangle className="w-5 h-5" />
                                                    <span className="font-medium">Encumbered</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="p-6">
                                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                            <div>
                                                <p className="text-slate-400 text-sm mb-1">Property</p>
                                                <p className="text-white font-medium">
                                                    {result.propertyDescription}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-sm mb-1">District</p>
                                                <p className="text-white font-medium">{result.district}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-sm mb-1">SRO</p>
                                                <p className="text-white font-medium">{result.sro}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-sm mb-1">Period</p>
                                                <p className="text-white font-medium">
                                                    {result.fromDate} to {result.toDate}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Encumbrances */}
                                        {result.encumbrances.length > 0 && (
                                            <div className="mt-6 pt-6 border-t border-white/5">
                                                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                                    <AlertTriangle className="w-5 h-5 text-red-400" />
                                                    Encumbrances Found ({result.encumbrances.length})
                                                </h4>
                                                <div className="space-y-4">
                                                    {result.encumbrances.map((enc, index) => (
                                                        <div
                                                            key={index}
                                                            className="p-4 bg-red-500/5 rounded-xl border border-red-500/20"
                                                        >
                                                            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                                <div>
                                                                    <p className="text-red-300 text-sm mb-1">Type</p>
                                                                    <p className="text-white font-medium">{enc.type}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-red-300 text-sm mb-1">
                                                                        Document Number
                                                                    </p>
                                                                    <p className="text-white font-medium">
                                                                        {enc.documentNumber}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-red-300 text-sm mb-1">Date</p>
                                                                    <p className="text-white font-medium">
                                                                        {enc.documentDate}
                                                                    </p>
                                                                </div>
                                                                {enc.amount && (
                                                                    <div>
                                                                        <p className="text-red-300 text-sm mb-1">Amount</p>
                                                                        <p className="text-white font-medium">
                                                                            ₹{enc.amount.toLocaleString('en-IN')}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="mt-3">
                                                                <p className="text-red-300 text-sm mb-1">Parties</p>
                                                                <p className="text-white">{enc.parties}</p>
                                                            </div>
                                                            <div className="mt-3">
                                                                <p className="text-red-300 text-sm mb-1">Description</p>
                                                                <p className="text-slate-300">{enc.description}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {!hasSearched && (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
                            <Info className="w-10 h-10 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            Search for Encumbrance Certificate
                        </h3>
                        <p className="text-slate-400 max-w-md mx-auto">
                            Enter a document number or property details above to search for
                            encumbrance certificates.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
