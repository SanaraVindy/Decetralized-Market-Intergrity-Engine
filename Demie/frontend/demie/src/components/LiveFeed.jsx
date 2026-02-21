import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, ShieldAlert, Database, WifiOff } from 'lucide-react';

const LiveFeed = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/api/live-feed');
                if (!response.ok) throw new Error(`HTTP_ERROR_${response.status}`);

                const data = await response.json();

                // Normalizing various backend response patterns
                const eventList = Array.isArray(data) ? data : (data?.data || []);
                setEvents(eventList);
                setError(null);
            } catch (err) {
                console.error("Live Feed Sync Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFeed();
        const interval = setInterval(fetchFeed, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading && events.length === 0) {
        return (
            <div className="p-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <div className="font-mono text-blue-500 text-[10px] tracking-[0.3em] animate-pulse">
                    SYNCHRONIZING_GATv2_STREAM...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6 px-1">
                <h2 className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-[0.15em]">
                    <Activity className={error ? "text-red-500" : "text-blue-500 animate-pulse"} size={16} />
                    Live Forensic Stream
                </h2>
                {error && (
                    <div className="flex items-center gap-2 text-[9px] text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                        <WifiOff size={12} />
                        NODE_OFFLINE
                    </div>
                )}
            </div>

            {/* Event List Container */}
            <div className="grid gap-3 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
                {events.length > 0 ? (
                    events.map((event, idx) => {
                        // FIX: 7917% Bug. If score is > 1, assume it's already scaled.
                        const rawScore = Number(event.integrity_risk_score || 0);
                        const normalizedScore = rawScore > 1 ? rawScore / 100 : rawScore;
                        const isHighRisk = normalizedScore > 0.7;

                        // FIX: NaN ETH Bug. Force zero if null/undefined.
                        const amountValue = Number(event.total_ether_flow || 0);

                        const rawAddr = event.address || event.wallet || "0x000...0000";
                        const displayAddr = rawAddr.length > 18
                            ? `${rawAddr.substring(0, 8)}...${rawAddr.substring(rawAddr.length - 4)}`
                            : rawAddr;

                        return (
                            <div
                                key={event.id || idx}
                                className={`group relative bg-slate-900/40 backdrop-blur-md border transition-all duration-300 ${isHighRisk
                                    ? 'border-red-500/20 hover:border-red-500/50 shadow-lg shadow-red-900/10'
                                    : 'border-slate-800 hover:border-blue-500/30'
                                    } p-4 rounded-xl flex items-center justify-between`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Icon with Status Glow */}
                                    <div className={`p-2.5 rounded-lg transition-all duration-500 ${isHighRisk
                                        ? 'bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                                        : 'bg-blue-500/10 text-blue-400'
                                        }`}>
                                        {isHighRisk ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                                    </div>

                                    <div>
                                        <p className="text-xs font-mono text-slate-300 group-hover:text-blue-200 transition-colors">
                                            {displayAddr}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded tracking-tighter uppercase ${isHighRisk ? 'bg-red-500 text-white' : 'bg-emerald-500/20 text-emerald-400'
                                                }`}>
                                                {isHighRisk ? 'Critical' : 'Safe'}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono">
                                                SCORE: <span className={isHighRisk ? 'text-red-400 font-bold' : 'text-slate-400'}>
                                                    {(normalizedScore * 100).toFixed(1)}%
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className={`font-bold font-mono text-sm tracking-tight ${isNaN(amountValue) || amountValue === 0 ? 'text-slate-600' : 'text-blue-400'
                                        }`}>
                                        {amountValue.toFixed(4)} <span className="text-[10px] opacity-50">ETH</span>
                                    </p>
                                    <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-1 opacity-60">
                                        GAT_v2_SCAN
                                    </p>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
                        <Database className="mx-auto text-slate-700 mb-3 opacity-20" size={32} />
                        <div className="text-slate-600 font-mono text-[10px] tracking-[0.2em] uppercase">
                            No active entities in scope
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveFeed;