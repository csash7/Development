import Link from 'next/link';
import { MapPin, User, Calendar, ArrowRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { LandRecord } from '@/types';

interface LandRecordCardProps {
    record: LandRecord;
}

export default function LandRecordCard({ record }: LandRecordCardProps) {
    const formatExtent = () => {
        const parts = [];
        if (record.extent.acres > 0) parts.push(`${record.extent.acres} Ac`);
        if (record.extent.guntas > 0) parts.push(`${record.extent.guntas} Gu`);
        if (record.extent.cents > 0) parts.push(`${record.extent.cents} Ct`);
        return parts.join(' ') || 'N/A';
    };

    const getStatusConfig = () => {
        switch (record.status) {
            case 'active':
                return {
                    icon: CheckCircle,
                    label: 'Active',
                    bgColor: 'bg-emerald-500/10',
                    textColor: 'text-emerald-400',
                    borderColor: 'border-emerald-500/20',
                };
            case 'disputed':
                return {
                    icon: AlertCircle,
                    label: 'Disputed',
                    bgColor: 'bg-red-500/10',
                    textColor: 'text-red-400',
                    borderColor: 'border-red-500/20',
                };
            case 'pending':
                return {
                    icon: Clock,
                    label: 'Pending',
                    bgColor: 'bg-amber-500/10',
                    textColor: 'text-amber-400',
                    borderColor: 'border-amber-500/20',
                };
            default:
                return {
                    icon: CheckCircle,
                    label: 'Unknown',
                    bgColor: 'bg-slate-500/10',
                    textColor: 'text-slate-400',
                    borderColor: 'border-slate-500/20',
                };
        }
    };

    const status = getStatusConfig();
    const StatusIcon = status.icon;

    return (
        <Link href={`/land-record/${record.id}`}>
            <div className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-white/5 hover:border-amber-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/5 hover:-translate-y-1">
                {/* Status Badge */}
                <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full ${status.bgColor} ${status.textColor} border ${status.borderColor}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{status.label}</span>
                </div>

                {/* Survey Number Header */}
                <div className="mb-4">
                    <p className="text-slate-400 text-sm mb-1">Survey Number</p>
                    <h3 className="text-2xl font-bold text-white">
                        {record.surveyNumber}
                        {record.subDivision && <span className="text-amber-400">/{record.subDivision}</span>}
                    </h3>
                </div>

                {/* Location */}
                <div className="flex items-start gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-white font-medium">{record.village}</p>
                        <p className="text-slate-400 text-sm">
                            {record.mandal}, {record.district}
                        </p>
                    </div>
                </div>

                {/* Owners */}
                <div className="flex items-start gap-2 mb-4">
                    <User className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-white font-medium">
                            {record.owners.length === 1
                                ? record.owners[0].name
                                : `${record.owners[0].name} +${record.owners.length - 1} more`}
                        </p>
                        {record.owners.length === 1 && record.owners[0].nameTeugu && (
                            <p className="text-slate-400 text-sm">{record.owners[0].nameTeugu}</p>
                        )}
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-slate-400 text-xs mb-1">Extent</p>
                        <p className="text-white font-semibold">{formatExtent()}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-slate-400 text-xs mb-1">Classification</p>
                        <p className="text-white font-semibold text-sm">{record.landClassification}</p>
                    </div>
                </div>

                {/* Last Updated */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>Updated: {record.lastUpdated}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 text-sm font-medium group-hover:gap-2 transition-all">
                        View Details
                        <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </Link>
    );
}
