import React from 'react';
import { Users, ShieldAlert, Activity, ExternalLink, Database, Fingerprint, Layers } from 'lucide-react';

const SuperEntitiesView = ({ entities = [], loading, onViewDetails }) => {
    // Safety check: ensure entities is always an array
    const safeEntities = Array.isArray(entities) ? entities : [];

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Professional Audit Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/20 p-6 rounded-2xl border border-slate-800/50">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Fingerprint size={18} className="text-blue-500" />
                        <h2 className="text-xl font-bold text-white tracking-tight">Identity Cluster Explorer</h2>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">
                        Engine: GATv2-Pro // Heuristic Set: 4.1.0
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-500 uppercase">Analyzed Nodes</p>
                        <p className="text-lg font-mono font-bold text-white">9,841</p>
                    </div>
                    <div className="w-[1px] bg-slate-800 h-10" />
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-500 uppercase">Detection Edges</p>
                        <p className="text-lg font-mono font-bold text-blue-500">2,000</p>
                    </div>
                </div>
            </header>

            {/* Entity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="h-64 bg-slate-900/50 rounded-2xl animate-pulse border border-slate-800"></div>
                    ))
                ) : safeEntities.length > 0 ? (
                    safeEntities.map((entity) => {
                        const riskPercent = (entity.riskScore || 0) * 100;
                        const isHighRisk = riskPercent > 70;

                        return (
                            <div key={entity.id} className="bg-[#0a0f1c] border border-slate-800 p-5 rounded-2xl hover:border-blue-500/50 transition-all group relative flex flex-col justify-between min-h-[260px]">
                                {/* Top Section: Type & Status */}
                                <div className="flex justify-between items-start">
                                    <div className={`p-2 rounded-lg ${isHighRisk ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-400'}`}>
                                        <Layers size={18} />
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Classification</span>
                                        <span className={`text-[10px] font-bold uppercase mt-1 ${isHighRisk ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {entity.type || 'Standard Node'}
                                        </span>
                                    </div>
                                </div>

                                {/* Middle Section: Identity */}
                                <div className="my-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        <h3 className="font-mono text-[10px] text-slate-500 truncate max-w-[150px]">
                                            {entity.id}
                                        </h3>
                                    </div>
                                    <p className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                                        {entity.name || "Unnamed Forensic Cluster"}
                                    </p>
                                </div>

                                {/* Bottom Section: Audit Metrics */}
                                <div className="space-y-4 pt-4 border-t border-slate-800/50">
                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Forensic Risk Score</span>
                                            <span className={`font-mono font-bold ${isHighRisk ? 'text-red-500' : 'text-blue-400'}`}>
                                                {riskPercent.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                                            <div
                                                className={`h-full transition-all duration-1000 ${isHighRisk ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-blue-500'}`}
                                                style={{ width: `${riskPercent}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => onViewDetails(entity)}
                                        className="w-full py-2.5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest bg-slate-800/50 hover:bg-blue-600 text-slate-300 hover:text-white transition-all rounded-xl border border-slate-700/50 hover:border-blue-400"
                                    >
                                        Initiate Full Trace <ExternalLink size={12} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-20 bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-500">
                        <Activity size={40} className="mb-4 opacity-20" />
                        <p className="font-mono text-sm uppercase tracking-widest">No subject clusters identified in current scope</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperEntitiesView;