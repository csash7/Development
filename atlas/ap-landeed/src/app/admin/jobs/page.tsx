'use client';

import { useState, useEffect } from 'react';
import {
    Plus,
    RefreshCw,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Play,
    Trash2,
    Image,
    MapPin,
} from 'lucide-react';

interface District {
    code: string;
    name: string;
}

interface Mandal {
    code: string;
    name: string;
}

interface ScrapeJob {
    id: string;
    job_type: string;
    status: string;
    district_code: string | null;
    mandal_code: string | null;
    village_code: string | null;
    survey_number: string | null;
    attempts: number | null;
    error_message: string | null;
    captcha_image_base64: string | null;
    created_at: string;
}

const API_BASE = 'http://31.97.212.67:8080/api';

const statusConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
    pending: { icon: Clock, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
    running: { icon: Play, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10' },
    completed: { icon: CheckCircle, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
    failed: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/10' },
    captcha_required: { icon: AlertCircle, color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
};

export default function JobsPage() {
    const [jobs, setJobs] = useState<ScrapeJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [captchaModal, setCaptchaModal] = useState<ScrapeJob | null>(null);
    const [captchaSolution, setCaptchaSolution] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        state_code: 'TS',
        job_type: 'telangana_land_status',
        district_code: '',
        mandal_code: '',
        village_code: '',
        survey_number: '',
    });

    const [districts, setDistricts] = useState<District[]>([]);
    const [mandals, setMandals] = useState<Mandal[]>([]);

    const states = [
        { code: 'TS', name: 'Telangana' },
        { code: 'AP', name: 'Andhra Pradesh' },
    ];

    useEffect(() => {
        // Fetch districts when state changes
        const fetchDistricts = async () => {
            try {
                const res = await fetch(`${API_BASE}/districts?state=${formData.state_code}`);
                if (res.ok) {
                    const data = await res.json();
                    setDistricts(data);
                }
            } catch (e) {
                console.error("Failed to fetch districts", e);
            }
        };
        fetchDistricts();
    }, [formData.state_code]);

    useEffect(() => {
        // Fetch mandals when district changes
        if (!formData.district_code) {
            setMandals([]);
            return;
        }
        const fetchMandals = async () => {
            try {
                const res = await fetch(`${API_BASE}/mandals/${formData.district_code}`);
                if (res.ok) {
                    const data = await res.json();
                    setMandals(data);
                }
            } catch (e) {
                console.error("Failed to fetch mandals", e);
            }
        };
        fetchMandals();
    }, [formData.district_code]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE}/jobs`);
            if (!response.ok) throw new Error('Failed to fetch jobs');
            const data = await response.json();
            setJobs(data);
            setError(null);
        } catch (err) {
            setError('Could not connect to backend');
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
        const interval = setInterval(fetchJobs, 5000);
        return () => clearInterval(interval);
    }, []);

    const createJob = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE}/jobs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (!response.ok) throw new Error('Failed to create job');
            setShowCreateForm(false);
            setFormData({
                state_code: 'TS',
                job_type: 'telangana_land_status',
                district_code: '',
                mandal_code: '',
                village_code: '',
                survey_number: '',
            });
            fetchJobs();
        } catch (err) {
            alert('Failed to create job. Is the backend running?');
        }
    };

    const cancelJob = async (id: string) => {
        if (!confirm('Cancel this job?')) return;
        try {
            await fetch(`${API_BASE}/jobs/${id}`, { method: 'DELETE' });
            fetchJobs();
        } catch (err) {
            alert('Failed to cancel job');
        }
    };

    const submitCaptcha = async (jobId: string) => {
        try {
            const response = await fetch(`${API_BASE}/jobs/${jobId}/captcha`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ solution: captchaSolution }),
            });
            if (!response.ok) throw new Error('Failed to submit CAPTCHA');
            setCaptchaModal(null);
            setCaptchaSolution('');
            fetchJobs();
        } catch (err) {
            alert('Failed to submit CAPTCHA');
        }
    };



    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Scrape Jobs</h1>
                    <p className="text-slate-400 mt-1">Manage and monitor scraping tasks</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchJobs}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Job
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                    {error}
                </div>
            )}

            {/* Jobs Table */}
            <div className="bg-slate-800/50 rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                            <th className="text-left p-4 text-slate-400 font-medium">Type</th>
                            <th className="text-left p-4 text-slate-400 font-medium">Location</th>
                            <th className="text-left p-4 text-slate-400 font-medium">Survey No</th>
                            <th className="text-left p-4 text-slate-400 font-medium">Created</th>
                            <th className="text-left p-4 text-slate-400 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-500">
                                    {loading ? 'Loading jobs...' : 'No jobs found. Create one to get started.'}
                                </td>
                            </tr>
                        ) : (
                            jobs.map((job) => {
                                const status = statusConfig[job.status] || statusConfig.pending;
                                const StatusIcon = status.icon;
                                return (
                                    <tr key={job.id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="p-4">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${status.bgColor}`}>
                                                <StatusIcon className={`w-4 h-4 ${status.color}`} />
                                                <span className={`text-sm ${status.color}`}>{job.status}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-white">{job.job_type}</td>
                                        <td className="p-4 text-slate-300">
                                            {job.district_code} / {job.mandal_code}
                                        </td>
                                        <td className="p-4 text-white font-mono">{job.survey_number || '-'}</td>
                                        <td className="p-4 text-slate-400 text-sm">
                                            {new Date(job.created_at).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                {job.status === 'captcha_required' && job.captcha_image_base64 && (
                                                    <button
                                                        onClick={() => setCaptchaModal(job)}
                                                        className="p-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg transition-colors"
                                                        title="Solve CAPTCHA"
                                                    >
                                                        <Image className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {['pending', 'captcha_required'].includes(job.status) && (
                                                    <button
                                                        onClick={() => cancelJob(job.id)}
                                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                                        title="Cancel"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Job Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-slate-900 rounded-2xl border border-white/10 p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">Create Scrape Job</h2>
                        <form onSubmit={createJob} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Job Type</label>
                                <select
                                    value={formData.job_type}
                                    onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                                    className="w-full p-3 bg-slate-800 border border-white/10 rounded-lg text-white"
                                >
                                    <option value="telangana_land_status">Telangana Land Status</option>
                                    <option value="meebhoomi_1b">Meebhoomi 1B</option>
                                    <option value="meebhoomi_adangal">Meebhoomi Adangal</option>
                                    <option value="igrs_ec">IGRS EC</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">State</label>
                                <select
                                    value={formData.state_code}
                                    onChange={(e) => setFormData({ ...formData, state_code: e.target.value, district_code: '', mandal_code: '' })}
                                    className="w-full p-3 bg-slate-800 border border-white/10 rounded-lg text-white"
                                >
                                    {states.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">District</label>
                                <select
                                    value={formData.district_code}
                                    onChange={(e) => setFormData({ ...formData, district_code: e.target.value, mandal_code: '' })}
                                    className="w-full p-3 bg-slate-800 border border-white/10 rounded-lg text-white"
                                    required
                                >
                                    <option value="">Select District</option>
                                    {districts.map((d) => (
                                        <option key={d.code} value={d.code}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Mandal</label>
                                <select
                                    value={formData.mandal_code}
                                    onChange={(e) => setFormData({ ...formData, mandal_code: e.target.value })}
                                    className="w-full p-3 bg-slate-800 border border-white/10 rounded-lg text-white"
                                    required
                                    disabled={!formData.district_code}
                                >
                                    <option value="">Select Mandal</option>
                                    {mandals.map((m) => (
                                        <option key={m.code} value={m.code}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Village Code</label>
                                <input
                                    type="text"
                                    value={formData.village_code}
                                    onChange={(e) => setFormData({ ...formData, village_code: e.target.value })}
                                    placeholder="e.g., VSK04R01"
                                    className="w-full p-3 bg-slate-800 border border-white/10 rounded-lg text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Survey Number</label>
                                <input
                                    type="text"
                                    value={formData.survey_number}
                                    onChange={(e) => setFormData({ ...formData, survey_number: e.target.value })}
                                    placeholder="e.g., 123/1A"
                                    className="w-full p-3 bg-slate-800 border border-white/10 rounded-lg text-white"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="flex-1 p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 p-3 bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors"
                                >
                                    Create Job
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CAPTCHA Modal */}
            {captchaModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-slate-900 rounded-2xl border border-white/10 p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">Solve CAPTCHA</h2>
                        <div className="mb-4">
                            {captchaModal.captcha_image_base64 && (
                                <img
                                    src={`data:image/png;base64,${captchaModal.captcha_image_base64}`}
                                    alt="CAPTCHA"
                                    className="w-full rounded-lg border border-white/10"
                                />
                            )}
                        </div>
                        <input
                            type="text"
                            value={captchaSolution}
                            onChange={(e) => setCaptchaSolution(e.target.value)}
                            placeholder="Enter CAPTCHA text"
                            className="w-full p-3 bg-slate-800 border border-white/10 rounded-lg text-white mb-4 text-center text-xl tracking-widest"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setCaptchaModal(null);
                                    setCaptchaSolution('');
                                }}
                                className="flex-1 p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => submitCaptcha(captchaModal.id)}
                                disabled={!captchaSolution}
                                className="flex-1 p-3 bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors disabled:opacity-50"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
