'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { API_URL } from '@/lib/config';
import { Database, Plus, Edit2, X, Check } from 'lucide-react';

interface Worker {
    id: string;
    name: string;
    role: string;
    scheduled_start: string;
    scheduled_end: string;
    gps_check_in: string;
    gps_check_out: string;
}

export default function DatabasePage() {
    const [roster, setRoster] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<Worker>>({});
    const [saving, setSaving] = useState(false);

    // Fetch roster on mount
    useEffect(() => {
        fetchRoster();
    }, []);

    const fetchRoster = async () => {
        try {
            const res = await fetch(`${API_URL}/api/roster`);
            const data = await res.json();
            setRoster(data.roster);
        } catch (e) {
            console.error('Failed to fetch roster', e);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (worker: Worker) => {
        setEditingId(worker.id);
        setEditData({ ...worker });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const saveEdit = async () => {
        if (!editingId) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/roster/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData)
            });
            if (res.ok) {
                await fetchRoster();
                setEditingId(null);
                setEditData({});
            }
        } catch (e) {
            console.error('Failed to save', e);
        } finally {
            setSaving(false);
        }
    };



    const addWorker = async () => {
        try {
            await fetch(`${API_URL}/api/roster`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'New Worker', role: 'Temp' })
            });
            await fetchRoster();
        } catch (e) {
            console.error('Failed to add', e);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <Header />

            <main className="flex-1 p-4 md:p-8 max-w-[1200px] mx-auto w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
                    <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 md:gap-3">
                        <Database className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                        Digital Roster
                    </h1>
                    <button
                        onClick={addWorker}
                        className="px-3 md:px-4 py-2 bg-primary text-white rounded-lg font-medium flex items-center gap-2 hover:bg-primary/80 transition-colors text-sm md:text-base w-fit"
                    >
                        <Plus className="w-4 h-4" />
                        Add Worker
                    </button>
                </div>

                <div className="text-xs md:text-sm text-text-muted mb-4 md:mb-6">
                    Edit GPS check-in/out times to compare against paper logs.
                </div>

                {loading ? (
                    <div className="text-center py-12 text-text-muted">Loading roster...</div>
                ) : (
                    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                        <div className="bg-surface/50 border border-white/10 rounded-lg overflow-hidden min-w-[700px] md:min-w-0">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-white/5 text-[10px] md:text-xs font-mono text-text-muted uppercase">
                                        <th className="px-3 md:px-4 py-2 md:py-3 text-left">ID</th>
                                        <th className="px-3 md:px-4 py-2 md:py-3 text-left">Name</th>
                                        <th className="px-3 md:px-4 py-2 md:py-3 text-left">Role</th>
                                        <th className="px-3 md:px-4 py-2 md:py-3 text-left">Scheduled</th>
                                        <th className="px-3 md:px-4 py-2 md:py-3 text-left">GPS In</th>
                                        <th className="px-3 md:px-4 py-2 md:py-3 text-left">GPS Out</th>
                                        <th className="px-3 md:px-4 py-2 md:py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {roster.map((worker) => (
                                        <tr key={worker.id} className="hover:bg-white/5 transition-colors">
                                            {editingId === worker.id ? (
                                                // Edit Mode
                                                <>
                                                    <td className="px-4 py-3 font-mono text-xs text-text-muted">{worker.id}</td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={editData.name || ''}
                                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={editData.role || ''}
                                                            onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                                                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-sm"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-text-muted">
                                                        {worker.scheduled_start} - {worker.scheduled_end}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={editData.gps_check_in || ''}
                                                            onChange={(e) => setEditData({ ...editData, gps_check_in: e.target.value })}
                                                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-sm font-mono"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={editData.gps_check_out || ''}
                                                            onChange={(e) => setEditData({ ...editData, gps_check_out: e.target.value })}
                                                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-sm font-mono"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={saveEdit}
                                                                disabled={saving}
                                                                className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={cancelEdit}
                                                                className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                // View Mode
                                                <>
                                                    <td className="px-4 py-3 font-mono text-xs text-text-muted">{worker.id}</td>
                                                    <td className="px-4 py-3 font-medium">{worker.name}</td>
                                                    <td className="px-4 py-3 text-text-muted">{worker.role}</td>
                                                    <td className="px-4 py-3 text-xs text-text-muted">
                                                        {worker.scheduled_start} - {worker.scheduled_end}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-sm text-primary">{worker.gps_check_in}</td>
                                                    <td className="px-4 py-3 font-mono text-sm text-primary">{worker.gps_check_out}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            onClick={() => startEdit(worker)}
                                                            className="p-1.5 bg-white/10 text-text-muted rounded hover:bg-white/20 hover:text-white transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="mt-4 md:mt-6 p-3 md:p-4 bg-primary/5 border border-primary/20 rounded-lg text-xs md:text-sm text-text-muted">
                    <strong className="text-primary">How it works:</strong> When you run an audit, the agent compares
                    the paper log against this database. Workers not on the paper log are flagged as "Ghost Shifts".
                </div>
            </main>
        </div>
    );
}

