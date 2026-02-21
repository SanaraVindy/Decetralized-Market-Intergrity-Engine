import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserX, Trash2, Users, Loader2 } from 'lucide-react';

const UserManagement = () => {
    const [auditors, setAuditors] = useState([]);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchAuditors = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/admin/auditors');
            const data = await res.json();
            setAuditors(data);
        } catch (err) {
            console.error("Failed to fetch forensic registry", err);
        }
    };

    const handleUpdateStatus = async (username, newStatus) => {
        setActionLoading(username);
        try {
            const response = await fetch('http://localhost:8000/api/admin/approve-auditor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, status: newStatus }),
            });
            if (response.ok) fetchAuditors();
        } catch (err) {
            alert("PROTOCOL_ERROR: STATUS_UPDATE_FAILED");
        } finally {
            setActionLoading(null);
        }
    };

    useEffect(() => { fetchAuditors(); }, []);

    return (
        <div className="p-8 bg-[#020617] min-h-screen text-slate-300">
            <header className="flex items-center justify-between mb-10 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <Users className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-wider">Forensic Registry Management</h2>
                        <p className="text-[10px] font-mono text-slate-500 uppercase">Registry Control // Protocol: Admin_Override</p>
                    </div>
                </div>
                <div className="text-right font-mono text-[10px] opacity-50 uppercase">
                    Analyzed Nodes: 9,818 // Status: Live
                </div>
            </header>

            <div className="grid gap-4 max-w-4xl">
                {auditors.map((auditor) => (
                    <div key={auditor.username} className="bg-[#0f172a] border border-slate-800 p-5 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
                        <div className="flex items-center gap-4">
                            <div className={`w-2 h-2 rounded-full ${auditor.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 animate-pulse'}`} />
                            <div className="flex flex-col">
                                <span className="text-white font-mono font-bold tracking-tight">{auditor.username}</span>
                                <span className="text-[9px] text-slate-500 font-mono uppercase">SID: {auditor.sid || 'N/A'} // {auditor.role}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {auditor.status !== 'ACTIVE' && (
                                <button
                                    onClick={() => handleUpdateStatus(auditor.username, 'ACTIVE')}
                                    disabled={actionLoading === auditor.username}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/20 transition-all uppercase"
                                >
                                    {actionLoading === auditor.username ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={14} />}
                                    Authorize Access
                                </button>
                            )}
                            <button className="p-2 hover:bg-red-500/10 text-slate-600 hover:text-red-500 rounded-lg transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UserManagement;