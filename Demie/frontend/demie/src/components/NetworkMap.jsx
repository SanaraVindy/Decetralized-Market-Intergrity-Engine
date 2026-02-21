import React, { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { X, ShieldAlert, Activity, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const NetworkMap = () => {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [selectedNode, setSelectedNode] = useState(null); // The wallet being investigated
    const [history, setHistory] = useState([]); // Transaction history for the panel
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGraph = async () => {
            const res = await fetch('http://127.0.0.1:8000/api/network/graph');
            const data = await res.json();
            setGraphData(data);
            setLoading(false);
        };
        fetchGraph();
    }, []);

    const handleNodeClick = async (node) => {
        setSelectedNode(node);
        // Fetch detailed transaction history for this specific address
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/address/${node.id}/history`);
            const data = await res.json();
            setHistory(data);
        } catch (e) {
            setHistory([]);
        }
    };

    return (
        <div className="relative h-[600px] w-full bg-[#020617] rounded-3xl border border-slate-800 overflow-hidden">
            <ForceGraph2D
                graphData={graphData}
                nodeColor={n => n.score > 0.4 ? '#ef4444' : '#3b82f6'}
                nodeRelSize={6}
                onNodeClick={handleNodeClick}
                linkColor={() => '#1e293b'}
                linkDirectionalParticles={2}
                backgroundColor="#020617"
            />

            {/* SLIDE-OVER INVESTIGATION PANEL */}
            {selectedNode && (
                <div className="absolute right-0 top-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 p-6 shadow-2xl transition-all duration-300 transform">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                            <ShieldAlert className="text-blue-500" size={16} /> Investigation
                        </h3>
                        <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Node Metadata */}
                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Target Address</label>
                            <p className="text-xs font-mono text-blue-400 break-all">{selectedNode.id}</p>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl">
                            <span className="text-xs text-slate-300">Integrity Risk</span>
                            <span className={`text-sm font-black ${selectedNode.score > 0.4 ? 'text-red-500' : 'text-emerald-500'}`}>
                                {(selectedNode.score * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    {/* Transaction History List */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                            <Activity size={12} /> Recent Flow
                        </h4>
                        <div className="h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {history.length > 0 ? history.map((tx, i) => (
                                <div key={i} className="bg-slate-800/30 p-2 rounded-lg border border-slate-700/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {tx.type === 'SENT' ? <ArrowUpRight size={14} className="text-red-400" /> : <ArrowDownLeft size={14} className="text-emerald-400" />}
                                        <span className="text-[10px] text-slate-300 font-mono">{tx.counterparty.substring(0, 8)}...</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-white">{tx.amount} ETH</span>
                                </div>
                            )) : <p className="text-[10px] text-slate-600 italic text-center py-10">No recent transactions found.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NetworkMap;