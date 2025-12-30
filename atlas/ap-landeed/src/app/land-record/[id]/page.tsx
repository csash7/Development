import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    MapPin,
    User,
    Users,
    Calendar,
    FileText,
    Droplets,
    ArrowLeft,
    Download,
    Printer,
    Share2,
    CheckCircle,
    AlertCircle,
    Clock,
    Building2,
    Ruler,
    Layers,
    Map,
} from 'lucide-react';
import mockRecords from '@/lib/data/mock-records.json';
import { LandRecord } from '@/types';
import LandRecordMap from '@/components/LandRecordMap';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function LandRecordPage({ params }: PageProps) {
    const { id } = await params;
    const record = mockRecords.find((r) => r.id === id) as LandRecord | undefined;

    if (!record) {
        notFound();
    }

    const formatExtent = () => {
        const parts = [];
        if (record.extent.acres > 0) parts.push(`${record.extent.acres} Acres`);
        if (record.extent.guntas > 0) parts.push(`${record.extent.guntas} Guntas`);
        if (record.extent.cents > 0) parts.push(`${record.extent.cents} Cents`);
        return parts.join(', ') || 'N/A';
    };

    const getStatusConfig = () => {
        switch (record.status) {
            case 'active':
                return {
                    icon: CheckCircle,
                    label: 'Active Record',
                    bgColor: 'bg-emerald-500/10',
                    textColor: 'text-emerald-400',
                    borderColor: 'border-emerald-500/30',
                };
            case 'disputed':
                return {
                    icon: AlertCircle,
                    label: 'Under Dispute',
                    bgColor: 'bg-red-500/10',
                    textColor: 'text-red-400',
                    borderColor: 'border-red-500/30',
                };
            case 'pending':
                return {
                    icon: Clock,
                    label: 'Pending Verification',
                    bgColor: 'bg-amber-500/10',
                    textColor: 'text-amber-400',
                    borderColor: 'border-amber-500/30',
                };
            default:
                return {
                    icon: CheckCircle,
                    label: 'Unknown',
                    bgColor: 'bg-slate-500/10',
                    textColor: 'text-slate-400',
                    borderColor: 'border-slate-500/30',
                };
        }
    };

    const status = getStatusConfig();
    const StatusIcon = status.icon;

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Link
                        href="/search"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Search
                    </Link>

                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-white">
                                    Survey No: {record.surveyNumber}
                                    {record.subDivision && (
                                        <span className="text-amber-400">/{record.subDivision}</span>
                                    )}
                                </h1>
                                <div
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${status.bgColor} ${status.textColor} border ${status.borderColor}`}
                                >
                                    <StatusIcon className="w-4 h-4" />
                                    <span className="text-sm font-medium">{status.label}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                                <MapPin className="w-4 h-4 text-amber-400" />
                                <span>
                                    {record.village}, {record.mandal}, {record.district}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
                                <Download className="w-4 h-4" />
                                Download
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
                                <Printer className="w-4 h-4" />
                                Print
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors">
                                <Share2 className="w-4 h-4" />
                                Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Land Details Card */}
                        <div className="bg-slate-800/50 rounded-2xl border border-white/5 overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/5">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-amber-400" />
                                    Land Details
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-slate-400 text-sm mb-1">Survey Number</p>
                                        <p className="text-white font-medium text-lg">
                                            {record.surveyNumber}
                                            {record.subDivision && `/${record.subDivision}`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-sm mb-1">Khata Number</p>
                                        <p className="text-white font-medium text-lg">
                                            {record.khataNumber || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-sm mb-1">Patta Number</p>
                                        <p className="text-white font-medium text-lg">
                                            {record.pattaNumber || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-sm mb-1">Last Updated</p>
                                        <p className="text-white font-medium text-lg">{record.lastUpdated}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Extent & Classification Card */}
                        <div className="bg-slate-800/50 rounded-2xl border border-white/5 overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/5">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Ruler className="w-5 h-5 text-amber-400" />
                                    Extent & Classification
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="p-4 bg-white/5 rounded-xl">
                                        <p className="text-slate-400 text-sm mb-1">Total Extent</p>
                                        <p className="text-white font-semibold text-lg">{formatExtent()}</p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-xl">
                                        <p className="text-slate-400 text-sm mb-1">Classification</p>
                                        <p className="text-white font-semibold text-lg">{record.landClassification}</p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-xl">
                                        <p className="text-slate-400 text-sm mb-1">Nature</p>
                                        <p className="text-white font-semibold text-lg">{record.landNature}</p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-xl">
                                        <p className="text-slate-400 text-sm mb-1 flex items-center gap-1">
                                            <Droplets className="w-3 h-3" />
                                            Water Source
                                        </p>
                                        <p className="text-white font-semibold text-lg">
                                            {record.waterSource || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Owners Card */}
                        <div className="bg-slate-800/50 rounded-2xl border border-white/5 overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/5">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-amber-400" />
                                    Owners ({record.owners.length})
                                </h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    {record.owners.map((owner, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start justify-between p-4 bg-white/5 rounded-xl"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold text-lg">
                                                    {owner.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium text-lg">{owner.name}</p>
                                                    {owner.nameTeugu && (
                                                        <p className="text-amber-400 text-sm">{owner.nameTeugu}</p>
                                                    )}
                                                    {owner.fatherName && (
                                                        <p className="text-slate-400 text-sm">
                                                            S/O: {owner.fatherName}
                                                        </p>
                                                    )}
                                                    {owner.aadhaarLast4 && (
                                                        <p className="text-slate-500 text-xs mt-1">
                                                            Aadhaar: XXXX-XXXX-{owner.aadhaarLast4}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-slate-400 text-sm">Share</p>
                                                <p className="text-amber-400 font-bold text-xl">
                                                    {owner.sharePercentage}%
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Map Card */}
                        <div className="bg-slate-800/50 rounded-2xl border border-white/5 overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/5">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Map className="w-5 h-5 text-amber-400" />
                                    Land Location
                                </h2>
                            </div>
                            <div className="p-4">
                                <LandRecordMap record={record as LandRecord} />
                                {record.coordinates && (
                                    <p className="text-slate-500 text-xs mt-2 text-center">
                                        Coordinates: {record.coordinates[1].toFixed(4)}°N, {record.coordinates[0].toFixed(4)}°E
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Location Card */}
                        <div className="bg-slate-800/50 rounded-2xl border border-white/5 overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/5">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-amber-400" />
                                    Location
                                </h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">District</p>
                                    <p className="text-white font-medium">{record.district}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Mandal</p>
                                    <p className="text-white font-medium">{record.mandal}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-sm mb-1">Village</p>
                                    <p className="text-white font-medium">{record.village}</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions Card */}
                        <div className="bg-slate-800/50 rounded-2xl border border-white/5 overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/5">
                                <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
                            </div>
                            <div className="p-6 space-y-3">
                                <button className="w-full flex items-center gap-3 px-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl transition-colors text-left">
                                    <FileText className="w-5 h-5" />
                                    <span className="font-medium">View 1B Document</span>
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors text-left">
                                    <FileText className="w-5 h-5" />
                                    <span className="font-medium">View Adangal</span>
                                </button>
                                <Link
                                    href="/encumbrance"
                                    className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors text-left"
                                >
                                    <FileText className="w-5 h-5" />
                                    <span className="font-medium">Check EC Status</span>
                                </Link>
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                            <p className="text-amber-400 text-sm">
                                <strong>Note:</strong> This is demo data for illustration purposes.
                                For official records, please visit{' '}
                                <a
                                    href="https://meebhoomi.ap.gov.in"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline hover:text-amber-300"
                                >
                                    Meebhoomi
                                </a>
                                .
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
