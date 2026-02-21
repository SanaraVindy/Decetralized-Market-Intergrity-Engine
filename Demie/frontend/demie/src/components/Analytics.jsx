import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Fingerprint, TrendingUp, ShieldAlert, RefreshCw, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis } from 'recharts';

const Analytics = () => {
    const [data, setData] = useState({
        heuristics: [],
        growth: [],
        topEntities: [],
        avgIRS: 0
    });
    const [loading, setLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [exporting, setExporting] = useState(false);
    const reportRef = useRef(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/analytics/forensics');
            const d = await res.json();
            setData({
                heuristics: d.radarData || [],
                growth: d.growth || [],
                topEntities: d.topEntities || [],
                avgIRS: d.avgIRS || 0,
            });
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    // New Function to Trigger the Python AI Analysis
    const triggerAnalysis = async () => {
        setIsScanning(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/api/analyze', { method: 'POST' });
            if (res.ok) {
                // Refresh the data once the AI finishes writing to Neo4j
                await fetchData();
            }
        } catch (error) {
            console.error("Analysis Trigger Error:", error);
        } finally {
            setIsScanning(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const truncateAddress = (addr) => addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "0x00...0000";

    const exportPDF = async () => {
        setExporting(true);
        const canvas = await html2canvas(reportRef.current, { backgroundColor: '#020617', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addImage(imgData, 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
        pdf.save(`Forensic_Report_${Date.now()}.pdf`);
        setExporting(false);
    };

    if (loading && !isScanning) return <div className="p-10 font-mono text-blue-500 animate-pulse text-xs">INITIALIZING_FORENSIC_NODE...</div>;

    return (
        <div className="space-y-6">
            {/* Header Control Panel */}
            <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-3">
                    <ShieldAlert className="text-blue-500" size={18} />
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Forensic Intelligence Node</h3>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={triggerAnalysis}
                        disabled={isScanning}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${isScanning ? "bg-amber-600 animate-pulse" : "bg-slate-800 hover:bg-slate-700"
                            } text-white`}
                    >
                        <RefreshCw size={14} className={isScanning ? "animate-spin" : ""} />
                        {isScanning ? "ANALYZING NETWORK..." : "RE-SCAN NETWORK"}
                    </button>
                    <button
                        onClick={exportPDF}
                        disabled={exporting}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"
                    >
                        <Download size={14} /> {exporting ? "SAVING..." : "GENERATE PDF"}
                    </button>
                </div>
            </div>

            <div ref={reportRef} className="p-4 space-y-6 bg-[#020617]">
                {/* Risk Summary Card */}
                <div className="bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Network Integrity Risk</h4>
                        <div className="text-3xl font-black text-white">{(data.avgIRS * 100).toFixed(2)}%</div>
                    </div>
                    <AlertTriangle className="text-red-500 opacity-50" size={40} />
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* Radar Chart */}
                    <div className="col-span-12 lg:col-span-5 bg-[#0a0f1c] border border-slate-800 p-6 rounded-2xl">
                        <h3 className="text-xs font-bold uppercase mb-6 text-blue-400">Risk Attribution Vectors</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.heuristics}>
                                    <PolarGrid stroke="#1e293b" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                                    <Radar name="Risk" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Entities Table */}
                    <div className="col-span-12 lg:col-span-7 bg-[#0a0f1c] border border-slate-800 rounded-2xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/50 text-[10px] font-black text-slate-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Subject Wallet</th>
                                    <th className="px-6 py-4">Threat Score</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {data.topEntities.map((item, i) => (
                                    <tr key={i} className="text-xs hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4 font-mono text-blue-400">{truncateAddress(item.id)}</td>
                                        <td className="px-6 py-4 font-bold text-white">{(item.score * 100).toFixed(2)}%</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${item.score > 0.4 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                {item.score > 0.4 ? 'Critical' : 'Low Risk'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;