import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import {
    Database, ShieldAlert, Cpu, Fingerprint,
    Activity, Zap, LogOut, ChevronLeft,
    ChevronRight, Loader2, Share2, Search, ChevronDown,
    RefreshCw, Layers, AlertTriangle, X, ShieldCheck, AlertCircle, Wifi, Download, ArrowUpRight, ArrowDownLeft, CheckCircle,
    ChartBarIcon, Info, HelpCircle, Mail, Eye, ExternalLink, FileText // Using ChartBarIcon as our 'Analytics' visual
} from 'lucide-react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
    PieChart, Pie, Legend
} from 'recharts';


// --- 1. HeaderStat Definition ---
const HeaderStat = React.memo(({ label, value, icon }) => (
    <div className="flex items-center gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/50 hover:border-blue-500/20 transition-all shrink-0">
        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 shadow-inner">
            {icon}
        </div>
        <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
            <p className="text-lg font-mono font-bold text-white leading-none mt-1 tracking-tight">{value}</p>
        </div>
    </div>
));

// --- 2. Helper Components (Tooltip, Ticks, Loading) ---

const CustomYAxisTick = ({ x, y, payload }) => (
    <g transform={`translate(${x},${y})`}>
        <text x={-10} y={0} dy={4} textAnchor="end" fill="#94a3b8" fontSize={9} fontFamily="monospace">
            {payload.value.length > 10
                ? `${payload.value.substring(0, 6)}...${payload.value.slice(-4)}`
                : payload.value}
        </text>
    </g>
);

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#020617] border border-slate-800 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                <p className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">
                    {payload[0].payload.subject || payload[0].payload.id}
                </p>
                <p className="text-sm font-bold text-blue-400">
                    {payload[0].value.toFixed(2)}%
                </p>
            </div>
        );
    }
    return null;
};

// --- 3. Main AnalyticsView Component ---

const AnalyticsView = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const analyticsRiskDistribution = useMemo(() => {
        const entities = data?.topEntities || [];
        const buckets = { High: 0, Medium: 0, Low: 0 };
        entities.forEach((e) => {
            const score = parseFloat(e.score || 0);
            if (score > 75) buckets.High += 1;
            else if (score > 60) buckets.Medium += 1;
            else buckets.Low += 1;
        });
        return [
            { name: 'High Risk', value: buckets.High, fill: '#ef4444' },
            { name: 'Medium Risk', value: buckets.Medium, fill: '#f59e0b' },
            { name: 'Low Risk', value: buckets.Low, fill: '#3b82f6' },
        ];
    }, [data?.topEntities]);

    const fetchForensics = useCallback(async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/analytics/forensics');
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (error) {
            console.error("Forensic Sync Error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const runAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const response = await fetch('http://127.0.0.1:8000/api/analyze', { method: 'POST' });
            if (response.ok) {
                await fetchForensics(); // Refresh data after analysis
            }
        } catch (error) {
            console.error("Inference Engine Failed:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        fetchForensics();
    }, [fetchForensics]);

    return (
        <div className="space-y-6 animate-in fade-in duration-700 slide-in-from-bottom-4">
            {/* --- HEADER --- */}
            <header className="bg-slate-900/30 p-8 rounded-[2.5rem] border border-slate-800/50 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 flex gap-4 items-center">
                    <button
                        onClick={runAnalysis}
                        disabled={isAnalyzing}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-[10px] font-black uppercase tracking-tighter transition-all hover:bg-blue-500/20 ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <RefreshCw size={12} className={isAnalyzing ? 'animate-spin' : ''} />
                        {isAnalyzing ? 'Running Inference...' : 'Re-Analyze Network'}
                    </button>
                    <div className="flex flex-col items-end border-l border-slate-800 pl-4">
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Global Mean IRS</span>
                        <span className="text-2xl font-mono font-bold text-blue-400">{data?.metadata?.meanIRS || "0.0%"}</span>
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <ChartBarIcon size={24} className="text-blue-500" /> GAT Neural Analytics
                </h2>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.3em] mt-1">
                    Attention Weights & Feature Propagation Analysis
                </p>
            </header>

            {/* --- STATS HUD --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <HeaderStat
                    label="Mean Network Risk"
                    value={data?.metadata?.meanIRS || "0%"}
                    icon={<ShieldAlert size={16} className="text-red-500" />}
                />
                <HeaderStat
                    label="Analyzed Entities"
                    value={data?.topEntities?.length || 0}
                    icon={<Activity size={16} className="text-blue-500" />}
                />
                <HeaderStat
                    label="Inference Status"
                    value={isAnalyzing ? "RUNNING" : (data?.metadata?.status?.toUpperCase() || "IDLE")}
                    icon={<Cpu size={16} className={isAnalyzing ? "text-blue-400 animate-pulse" : "text-emerald-500"} />}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* --- RADAR CHART: Topological Risk Vectors --- */}
                <div className="bg-[#0a0f1c]/60 border border-slate-800/50 rounded-[2rem] p-8 min-h-[450px] flex flex-col backdrop-blur-xl relative">
                    <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-6">Topological Risk Vectors</h3>
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                            <Activity size={30} className="animate-pulse mb-2" />
                            <p className="text-[10px] font-mono uppercase">Syncing Tensors...</p>
                        </div>
                    ) : (
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data?.radarData}>
                                    <PolarGrid stroke="#1e293b" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Intelligence"
                                        dataKey="value"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fill="#3b82f6"
                                        fillOpacity={0.15}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* --- BAR CHART: Anomalous Node Distribution --- */}
                <div className="bg-[#0a0f1c]/60 border border-slate-800/50 rounded-[2rem] p-8 min-h-[450px] flex flex-col backdrop-blur-xl">
                    <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-6">Anomalous Node Distribution</h3>
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                            <Cpu size={30} className="animate-bounce mb-2" />
                            <p className="text-[10px] font-mono uppercase">Mapping Hubs...</p>
                        </div>
                    ) : (
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.topEntities} layout="vertical" margin={{ left: 30, right: 30 }}>
                                    <XAxis type="number" hide domain={[0, 100]} />
                                    <YAxis
                                        dataKey="id"
                                        type="category"
                                        tick={<CustomYAxisTick />}
                                        width={100}
                                    />
                                    <Tooltip cursor={{ fill: '#1e293b', opacity: 0.4 }} content={<CustomTooltip />} />
                                    <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={12}>
                                        {data?.topEntities?.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.score > 75 ? '#ef4444' : '#3b82f6'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* --- PIE CHART: Risk Category Breakdown --- */}
            <div className="bg-[#0a0f1c]/60 border border-slate-800/50 rounded-[2rem] p-8 min-h-[420px] flex flex-col backdrop-blur-xl">
                <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-6">Risk Category Breakdown</h3>
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-30">
                        <Activity size={30} className="animate-bounce mb-2" />
                        <p className="text-[10px] font-mono uppercase">Aggregating Risk Buckets...</p>
                    </div>
                ) : (
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analyticsRiskDistribution}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={4}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                    {analyticsRiskDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
};



//Sidebar component

const Sidebar = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed, onLogout }) => {
    const [isEngineOnline, setIsEngineOnline] = React.useState(true);

    const navItems = [
        { id: 'explorer', label: 'Identity Explorer', icon: Fingerprint, desc: 'Fused Super-Entities' },
        { id: 'network', label: 'Topological Map', icon: Share2, desc: 'Sybil-Resistant Graph' },
        { id: 'analytics', label: 'GAT Analytics', icon: ChartBarIcon, desc: 'Attention & Weights' },
        { id: 'reports', label: 'Forensic Reports', icon: Download, desc: 'Exportable Summaries' },
        {
            id: 'live',
            label: 'Integrity Stream',
            icon: Zap,
            desc: 'Real-time Risk',
            isLive: true
        },
        // New Navigation Items
        { id: 'about', label: 'About DeMIE', icon: Info, desc: 'System Architecture' },
        { id: 'help', label: 'Help Center', icon: HelpCircle, desc: 'Documentation & Support' },
    ];

    React.useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch('http://127.0.0.1:8000/api/health');
                setIsEngineOnline(res.ok);
            } catch {
                setIsEngineOnline(false);
            }
        };
        const timer = setInterval(checkStatus, 10000);
        return () => clearInterval(timer);
    }, []);

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-[#0a0f1c] border-r border-slate-800/60 transition-all duration-300 flex flex-col z-50 h-screen sticky top-0 shadow-2xl shadow-black/50`}>

            {/* --- LOGO & STATUS SECTION --- */}
            <div className="p-6 flex items-center justify-between border-b border-slate-800/50 min-h-[120px]">
                {!isCollapsed && (
                    <div className="flex flex-col animate-in fade-in slide-in-from-left-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                                <img
                                    src="/DeMIE.png"
                                    alt="DeMIE Logo"
                                    className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                                />
                            </div>
                            <span className="text-xl font-black text-white tracking-tighter italic">DeMIE</span>
                        </div>

                        {/* Engine Status Indicator - Resolves 'isEngineOnline' unused warning */}
                        <div className="flex items-center gap-2 mt-4 ml-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${isEngineOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'} shadow-[0_0_8px_rgba(16,185,129,0.5)]`} />
                            <span className={`text-[8px] font-mono uppercase tracking-[0.2em] ${isEngineOnline ? 'text-emerald-500' : 'text-red-500'}`}>
                                {isEngineOnline ? 'GAT Engine Online' : 'Engine Offline'}
                            </span>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2.5 hover:bg-slate-800/80 rounded-xl text-slate-400 transition-all hover:text-white border border-transparent hover:border-slate-700 shadow-sm"
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* --- NAVIGATION --- */}
            <nav className="flex-1 px-4 py-8 space-y-3 overflow-y-auto no-scrollbar">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all duration-300 group border ${activeTab === item.id
                            ? 'bg-blue-600/10 text-blue-400 border-blue-600/30 shadow-[inset_0_0_15px_rgba(37,99,235,0.05)]'
                            : 'text-slate-500 hover:bg-slate-800/30 hover:text-slate-300 border-transparent'
                            }`}
                    >
                        <div className="relative">
                            <item.icon size={20} className={`${activeTab === item.id ? 'text-blue-400' : 'group-hover:text-slate-300'} transition-colors duration-300`} />
                            {item.isLive && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-[3px] border-[#0a0f1c] animate-pulse" />
                            )}
                        </div>
                        {!isCollapsed && (
                            <div className="text-left">
                                <p className="text-sm font-bold tracking-tight">{item.label}</p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.desc}</p>
                            </div>
                        )}
                        {activeTab === item.id && !isCollapsed && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        )}
                    </button>
                ))}
            </nav>

            {/* --- SYSTEM CONFIDENCE INDICATOR --- */}
            {!isCollapsed && (
                <div className="mx-4 mb-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Cpu size={10} className="text-blue-400" /> Confidence
                        </span>
                        <span className="text-[10px] font-mono font-bold text-blue-400">94.2%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800/50 rounded-full overflow-hidden border border-slate-800/50">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 w-[94.2%] shadow-[0_0_10px_rgba(37,99,235,0.3)]" />
                    </div>
                </div>
            )}

            {/* --- FOOTER: LOGOUT --- */}
            <div className="p-4 border-t border-slate-800/50">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-4 p-3.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 group"
                >
                    <LogOut size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                    {!isCollapsed && <span className="font-bold text-[11px] uppercase tracking-widest">Terminate Session</span>}
                </button>
            </div>
        </aside>
    );
};

const AboutSection = () => (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        {/* --- BRAND HEADER --- */}
        <div className="flex items-center gap-6 border-b border-slate-800 pb-8">
            <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
                <div className="relative p-4 bg-slate-900 rounded-2xl border border-blue-500/30">
                    <Fingerprint className="text-blue-400" size={32} />
                </div>
            </div>
            <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">DeMIE Intelligence</h2>
                <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.4em]">Forensic Identity Resolution • Engine v1.0</p>
            </div>
        </div>

        {/* --- LEAD DEVELOPER / PROJECT ORIGIN --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 p-8 bg-[#0a0f1c] border border-slate-800 rounded-3xl space-y-4">
                <h3 className="text-blue-400 font-mono text-[10px] uppercase tracking-widest font-bold">Project Genesis</h3>
                <p className="text-slate-200 text-lg font-light leading-relaxed">
                    Developed as a <span className="text-white font-semibold underline decoration-blue-500/50 decoration-2 underline-offset-4">BSc (Hons) Software Engineering Final Year Research Project</span>, DeMIE bridges the gap between raw blockchain data and actionable identity intelligence.
                </p>
                <div className="pt-4">
                    <p className="text-slate-500 text-xs uppercase font-bold tracking-tighter">Lead Systems Architect</p>
                    <p className="text-white text-xl font-bold tracking-tight">Thevindi Muhandiramge</p>
                </div>
            </div>

            <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-3xl flex flex-col justify-center items-center text-center">
                <div className="text-4xl font-black text-blue-500 mb-1">94.2%</div>
                <p className="text-[10px] text-slate-400 uppercase font-mono tracking-widest leading-tight">Detection Accuracy<br />In Adversarial Tests</p>
            </div>
        </div>

        {/* --- TECHNICAL CORE --- */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group p-6 bg-slate-900/20 border border-slate-800 rounded-2xl hover:border-blue-500/40 transition-all">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg"><Cpu size={18} className="text-blue-400" /></div>
                    <h4 className="text-white font-bold text-sm uppercase">Neural Edge Weighting</h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                    DeMIE leverages <span className="text-slate-200 font-medium">Graph Attention Networks (GAT)</span> to autonomously identify high-risk transactional pathways. By assigning multi-head attention coefficients to edges, the engine isolates sophisticated Sybil clusters from organic network traffic.
                </p>
            </div>

            <div className="group p-6 bg-slate-900/20 border border-slate-800 rounded-2xl hover:border-purple-500/40 transition-all">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/10 rounded-lg"><Share2 size={18} className="text-purple-400" /></div>
                    <h4 className="text-white font-bold text-sm uppercase">Entity Resolution</h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                    Through <span className="text-slate-200 font-medium">Topological Fusing</span>, DeMIE reduces network complexity by merging fragmented addresses into single "Super-Entities," providing a unified view of controller behavior across the decentralized ledger.
                </p>
            </div>
        </div>
    </div>
);

const HelpSection = () => {
    // State to handle a simple "View" toggle or modal if needed
    const [viewingManual, setViewingManual] = useState(false);

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
            <div className="flex justify-between items-end border-b border-slate-800 pb-6">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Operations & Support</h2>
                    <p className="text-slate-500 text-sm italic">DeMIE Forensic Knowledge Base</p>
                </div>
                <div className="text-right">
                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-mono rounded-full uppercase tracking-widest">v1.0.4 Stable</span>
                </div>
            </div>

            {/* --- NEW: DOCUMENTATION REPOSITORY --- */}
            <section className="space-y-6">
                <h3 className="text-slate-400 font-mono text-[10px] uppercase tracking-[0.3em] font-bold flex items-center gap-2">
                    <div className="w-4 h-[1px] bg-slate-800" /> Documentation Repository
                </h3>

                <div className="group relative overflow-hidden border border-slate-800 rounded-2xl bg-[#0a0f1c] hover:border-blue-500/50 transition-all">
                    <div className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-200">DeMIE_UserManual_v1.docx</h4>
                                <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1">Full System Architecture & Forensic Protocol • 4.2 MB</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* View Action */}
                            <button
                                onClick={() => window.open('/docs/DeMIE_UserManual_v1.pdf', '_blank')}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
                            >
                                <Eye size={14} /> View
                            </button>
                            {/* Download Action */}
                            <a
                                href="/docs/DeMIE_Technical_Manual_v1.docx"
                                download
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
                            >
                                <Download size={14} /> Download
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- METRIC DEFINITIONS --- */}
            <section className="space-y-6">
                <h3 className="text-slate-400 font-mono text-[10px] uppercase tracking-[0.3em] font-bold flex items-center gap-2">
                    <div className="w-4 h-[1px] bg-slate-800" /> Analytical Metrics
                </h3>
                <div className="grid grid-cols-1 gap-2">
                    {[
                        { metric: 'IRS', name: 'Integrity Risk Score', desc: 'Predictive probability of malicious automation based on GAT inference.', color: 'text-blue-400' },
                        { metric: 'FCD', name: 'Fused Cluster Depth', desc: 'Quantifies the structural density of a Super-Entity identity cluster.', color: 'text-purple-400' },
                        { metric: 'ATC', name: 'Attention Coefficient', desc: 'The weight assigned to specific edges during the inference phase.', color: 'text-emerald-400' }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-6 p-4 bg-[#0a0f1c] border border-slate-800/60 rounded-xl hover:bg-slate-800/20 transition-colors">
                            <span className={`font-mono text-xs font-black shrink-0 w-12 ${item.color}`}>{item.metric}</span>
                            <div className="h-4 w-[1px] bg-slate-800" />
                            <div>
                                <span className="text-xs font-bold text-slate-200 block">{item.name}</span>
                                <span className="text-[11px] text-slate-500">{item.desc}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- TECHNICAL SPECIFICATIONS TABLE --- */}
            <section className="space-y-6">
                <h3 className="text-slate-400 font-mono text-[10px] uppercase tracking-[0.3em] font-bold flex items-center gap-2">
                    <div className="w-4 h-[1px] bg-slate-800" /> System Specifications
                </h3>
                <div className="overflow-hidden border border-slate-800 rounded-2xl bg-[#0a0f1c]/40 backdrop-blur-md">
                    <table className="w-full text-left text-[11px]">
                        <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/50">
                                <th className="p-4 font-bold text-slate-300 uppercase tracking-tighter">Component</th>
                                <th className="p-4 font-bold text-slate-300 uppercase tracking-tighter">Architecture</th>
                                <th className="p-4 font-bold text-slate-300 uppercase tracking-tighter">Operational Logic</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-slate-400 font-light">
                            <tr>
                                <td className="p-4 font-mono text-blue-400">Inference Model</td>
                                <td className="p-4">GAT v2 (Multi-Head)</td>
                                <td className="p-4 italic text-slate-500">Attention-based weighted graph analysis</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-mono text-blue-400">Database Layer</td>
                                <td className="p-4">Neo4j Graph DB</td>
                                <td className="p-4 italic text-slate-500">Topological relationship mapping</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-mono text-blue-400">Core Engine</td>
                                <td className="p-4">FastAPI / PyTorch</td>
                                <td className="p-4 italic text-slate-500">Real-time asynchronous processing</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* --- STANDARD OPERATING PROCEDURE (SOP) --- */}
            <section className="p-8 bg-blue-600/5 border border-blue-500/10 rounded-3xl space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <Activity size={16} className="text-blue-500" /> Operating Procedure
                    </h3>
                    <span className="text-[9px] font-mono text-slate-600">REF-ID: DE-2026-TM</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <p className="text-blue-500 font-mono text-[10px] font-black">01 / INGESTION</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">System pulls block data via RPC, vectorizing wallet interactions into feature-rich nodes.</p>
                    </div>
                    <div className="space-y-2 border-l border-slate-800/50 pl-6">
                        <p className="text-blue-500 font-mono text-[10px] font-black">02 / CALCULATION</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">GAT layers compute attention weights to identify non-organic transactional signatures.</p>
                    </div>
                    <div className="space-y-2 border-l border-slate-800/50 pl-6">
                        <p className="text-blue-500 font-mono text-[10px] font-black">03 / RESOLUTION</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">Clustered entities are fused into "Super-Entities" for comprehensive risk auditing.</p>
                    </div>
                </div>
            </section>

            {/* --- SYSTEM CONTACTS --- */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h4 className="text-white text-sm font-bold uppercase tracking-widest">Developer Registry</h4>
                    <div className="p-6 bg-[#0a0f1c] border border-slate-800 rounded-2xl space-y-3">
                        <p className="text-xs text-slate-400 leading-relaxed">
                            For inquiries regarding <span className="text-blue-400">GAT architecture</span>, research datasets, or thesis documentation, please contact the lead developer.
                        </p>
                        <div className="pt-2">
                            <div className="flex items-center gap-3 text-xs text-slate-200 font-medium">
                                <Mail size={14} className="text-blue-500" />
                                <span>thevindimuhandiramge@gmail.com</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-white text-sm font-bold uppercase tracking-widest">Technical Support</h4>
                    <div className="p-6 bg-[#0a0f1c] border border-slate-800 rounded-2xl space-y-3">
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Support is prioritized for verified forensic analysts and academic reviewers. Standard response time is 24-48h.
                        </p>
                        <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-blue-600/20">
                            Request System Audit
                        </button>
                    </div>
                </div>
            </section>

            <div className="pt-20 opacity-20 text-center border-t border-slate-800">
                <p className="text-[8px] font-mono uppercase tracking-[1em] text-slate-400">
                    Secure Terminal • 2026 Thevindi Muhandiramge
                </p>
            </div>
        </div>
    );
};

const ReportsSection = ({ entities = [], stats = {} }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [reportType, setReportType] = useState('cluster');
    const [reportData, setReportData] = useState(() => ({
        type: 'cluster',
        generatedAt: new Date().toISOString(),
        statistics: stats,
        entityCount: entities.length,
        entities: entities.map(e => ({
            address: e.address,
            community_id: e.community_id,
            integrity_risk_score: e.integrity_risk_score,
            fused_count: e.fused_count,
            amount: e.amount,
        })),
    }));

    const reportEntities = reportData.entities || [];

    const reportTypes = [
        { id: 'cluster', label: 'Cluster Integrity Audit', description: 'Forensic confidence & GAT attention weights' },
        { id: 'asset', label: 'Asset Movement Trace', description: 'Inflow/outflow vs inferred internal volume' },
        { id: 'health', label: 'System Health Summary', description: 'Model latency & classification accuracy' },
        { id: 'risk', label: 'Risk Distribution (HUD)', description: 'Global mean IRS & bucket counts' },
    ];

    const createStubReport = (type) => {
        const critical = entities.filter(e => parseFloat(e.integrity_risk_score || 0) > 0.75);
        const medium = entities.filter(e => {
            const score = parseFloat(e.integrity_risk_score || 0);
            return score >= 0.6 && score <= 0.75;
        });
        const low = entities.filter(e => parseFloat(e.integrity_risk_score || 0) < 0.6);

        return {
            type,
            generatedAt: new Date().toISOString(),
            statistics: stats,
            entityCount: entities.length,
            riskBuckets: {
                critical: critical.length,
                medium: medium.length,
                low: low.length,
            },
            entities: entities.map(e => ({
                address: e.address,
                community_id: e.community_id,
                integrity_risk_score: e.integrity_risk_score,
                fused_count: e.fused_count,
                amount: e.amount,
            })),
            criticalEntities: critical.slice(0, 25),
            mediumEntities: medium.slice(0, 25),
            lowEntities: low.slice(0, 25),
        };
    };

    const fetchReport = useCallback(async (type) => {
        try {
            const response = await fetch(`/api/reports?type=${encodeURIComponent(type)}`);
            if (response.ok) {
                const payload = await response.json();
                setReportData({ ...payload, type });
                return;
            }
        } catch (err) {
            // Backend might not be ready; fall back to client stub
        }
        setReportData(createStubReport(type));
    }, [entities, stats]);

    useEffect(() => {
        fetchReport(reportType);
    }, [fetchReport, reportType]);

    const downloadBlob = (content, filename, type) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const getImageDataUrl = async (src) => {
        try {
            const response = await fetch(src);
            if (!response.ok) return null;
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } catch {
            return null;
        }
    };

    const downloadPdf = async () => {
        setIsExporting(true);
        try {
            const { criticalEntities = [], mediumEntities = [], lowEntities = [], generatedAt, statistics, type } = reportData || {};

            const logoDataUrl = await getImageDataUrl('/DeMIE.png');
            const doc = new jsPDF('p', 'pt', 'a4');
            const margin = 40;
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const lineHeight = 14;
            let yPos = margin;

            if (logoDataUrl) {
                doc.addImage(logoDataUrl, 'PNG', margin, yPos, 50, 50);
            }

            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('DeMIE Forensic Report', margin + 60, yPos + 18);

            yPos += 60;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            const metadataLines = [
                `Report Type: ${type || 'N/A'}`,
                `Generated: ${generatedAt ? new Date(generatedAt).toLocaleString() : 'N/A'}`,
                `Mean IRS: ${((statistics?.avgRiskScore || 0) * 100).toFixed(1)}%`,
                `Value at Risk: ${statistics?.valueAtRisk ?? 'N/A'}`,
            ];

            metadataLines.forEach((line) => {
                doc.text(line, margin, yPos);
                yPos += lineHeight;
            });
            yPos += 10;

            doc.setFont('helvetica', 'bold');
            doc.text('Risk Bucket Summary', margin, yPos);
            yPos += lineHeight;
            doc.setFont('helvetica', 'normal');

            [{ label: 'Critical Risk Wallets', count: criticalEntities.length }, { label: 'Medium Risk Wallets', count: mediumEntities.length }, { label: 'Low Risk Wallets', count: lowEntities.length }].forEach((bucket) => {
                doc.text(`${bucket.label}: ${bucket.count}`, margin, yPos);
                yPos += lineHeight;
            });
            yPos += 14;

            const drawTable = (startY, columns, rows) => {
                const tableWidth = pageWidth - margin * 2;
                const headerHeight = 18;
                const rowHeight = 16;
                const columnWidths = columns.map((c) => c.widthRatio * tableWidth);

                let cursorY = startY;

                const drawHeader = () => {
                    doc.setFillColor(15, 23, 42);
                    doc.rect(margin, cursorY, tableWidth, headerHeight, 'F');
                    doc.setDrawColor(80, 80, 80);
                    doc.line(margin, cursorY, margin + tableWidth, cursorY);
                    doc.line(margin, cursorY + headerHeight, margin + tableWidth, cursorY + headerHeight);
                    let x = margin + 4;
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(9);
                    columns.forEach((col, idx) => {
                        doc.text(col.label, x, cursorY + headerHeight - 6, { baseline: 'bottom' });
                        x += columnWidths[idx];
                    });
                    cursorY += headerHeight;
                };

                const drawRow = (cells) => {
                    const bottomMargin = 40;
                    if (cursorY + rowHeight > pageHeight - bottomMargin) {
                        doc.addPage();
                        cursorY = margin;
                        drawHeader();
                    }

                    let x = margin + 4;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(8);
                    cells.forEach((cell, idx) => {
                        doc.text(String(cell ?? ''), x, cursorY + rowHeight - 6, { baseline: 'bottom' });
                        x += columnWidths[idx];
                    });
                    cursorY += rowHeight;

                    doc.setDrawColor(80, 80, 80);
                    doc.line(margin, cursorY, margin + tableWidth, cursorY);
                };

                drawHeader();
                rows.forEach(drawRow);

                return cursorY;
            };

            if (criticalEntities.length > 0) {
                doc.setFont('helvetica', 'bold');
                doc.text('Critical Risk Wallets (Top 25)', margin, yPos);
                yPos += lineHeight + 6;

                const columns = [
                    { label: 'Address', widthRatio: 0.36 },
                    { label: 'Comm ID', widthRatio: 0.18 },
                    { label: 'IRS', widthRatio: 0.14 },
                    { label: 'Fused', widthRatio: 0.14 },
                    { label: 'Amount', widthRatio: 0.18 },
                ];

                const rows = criticalEntities.slice(0, 25).map((e) => ([
                    e.address || 'N/A',
                    e.community_id || 'N/A',
                    `${((parseFloat(e.integrity_risk_score || 0) * 100).toFixed(1))}%`,
                    e.fused_count ?? '-',
                    e.amount ?? '-',
                ]));

                yPos = drawTable(yPos, columns, rows);
                yPos += 10;
            }

            doc.save(`demie-report-${Date.now()}.pdf`);
        } catch (err) {
            console.error('PDF Export Failed:', err);
            alert('PDF export failed. See console for details.');
        } finally {
            setIsExporting(false);
        }
    };

    const downloadExcel = () => {
        setIsExporting(true);
        try {
            const { entities: reportEntities = [], generatedAt, statistics, type } = reportData;
            const entityRows = reportEntities.map(e => ({
                Address: e.address,
                'Community ID': e.community_id,
                'Integrity Risk Score': e.integrity_risk_score,
                'Fused Count': e.fused_count,
                Amount: e.amount,
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(entityRows);
            XLSX.utils.book_append_sheet(wb, ws, 'Entities');

            const summaryRows = [
                ['Report Type', type],
                ['Generated', new Date(generatedAt).toLocaleString()],
                ['Total Entities', reportEntities.length],
                ['Mean IRS', `${((statistics?.avgRiskScore || 0) * 100).toFixed(1)}%`],
                ['Value at Risk', statistics?.valueAtRisk || 'N/A'],
            ];
            const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
            XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

            XLSX.writeFile(wb, `demie-report-${Date.now()}.xlsx`);
        } catch (err) {
            console.error('Excel Export Failed:', err);
        } finally {
            setIsExporting(false);
        }
    };

    const downloadJson = () => {
        setIsExporting(true);
        try {
            downloadBlob(JSON.stringify(reportData, null, 2), `demie-report-${Date.now()}.json`, 'application/json');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
                <div className="flex items-start gap-3">
                    <img
                        src="/DeMIE.png"
                        alt="DeMIE Logo"
                        className="w-10 h-10 object-contain rounded-xl border border-slate-800 shadow-inner"
                        crossOrigin="anonymous"
                    />
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Reports</h2>
                        <p className="text-slate-500 text-sm italic">Export risk summaries and forensic snapshots for offline analysis.</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs">
                        <span className="text-slate-400">Report Type</span>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="bg-transparent outline-none text-white text-xs font-bold"
                        >
                            {reportTypes.map((type) => (
                                <option key={type.id} value={type.id} className="bg-slate-900">
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={downloadPdf}
                        disabled={isExporting}
                        className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Download PDF
                    </button>
                    <button
                        onClick={downloadExcel}
                        disabled={isExporting}
                        className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Download Excel
                    </button>
                    <button
                        onClick={downloadJson}
                        disabled={isExporting}
                        className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-widest transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Download JSON
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="p-6 bg-[#0a0f1c]/40 border border-slate-800 rounded-3xl">
                    <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4">Snapshot</h3>
                    <div className="space-y-3 text-sm text-slate-200">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Generated</span>
                            <span className="font-mono">{new Date(reportData.generatedAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Total Entities</span>
                            <span className="font-bold">{reportData.entityCount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Mean IRS</span>
                            <span className="font-bold">{`${((reportData.statistics?.avgRiskScore || 0) * 100).toFixed(1)}%`}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Value at Risk</span>
                            <span className="font-bold">{reportData.statistics?.valueAtRisk || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 p-6 bg-[#0a0f1c]/40 border border-slate-800 rounded-3xl">
                    <h3 className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-4">Preview (Top 5 Entities)</h3>
                    {reportEntities.length === 0 ? (
                        <p className="text-sm text-slate-500">No entities available to preview.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {reportEntities.slice(0, 5).map((e, idx) => (
                                <div key={idx} className="p-4 bg-slate-900/30 border border-slate-800 rounded-2xl">
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Entity {idx + 1}</p>
                                    <p className="text-sm font-mono text-white truncate">{e.address || 'N/A'}</p>
                                    <div className="flex justify-between mt-2 text-xs text-slate-400">
                                        <span>IRS</span>
                                        <span>{(parseFloat(e.integrity_risk_score || 0) * 100).toFixed(2)}%</span>
                                    </div>
                                    <div className="flex justify-between mt-1 text-xs text-slate-400">
                                        <span>Fused</span>
                                        <span>{e.fused_count || 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: SuperEntitiesView (Enhanced for ICE Fusion) ---

export const SuperEntitiesView = ({
    entities = [],
    loading,
    isAuditing,
    onOpenAudit,
    onAuditAll,
    // Lifted search props from parent
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType
}) => {

    const getRiskConfig = (irs) => {
        const score = parseFloat(irs) || 0;
        if (score > 0.75) return { color: 'text-red-500', bg: 'bg-red-500/20', bar: 'bg-red-500', border: 'hover:border-red-500/40', label: 'CRITICAL RISK' };
        if (score >= 0.6) return { color: 'text-orange-500', bg: 'bg-orange-500/20', bar: 'bg-orange-500', border: 'hover:border-orange-500/40', label: 'MODERATE RISK' };
        return { color: 'text-emerald-500', bg: 'bg-emerald-500/20', bar: 'bg-emerald-500', border: 'hover:border-emerald-500/40', label: 'LOW RISK' };
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header section with ICE Fusion Controls */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/30 p-6 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-blue-500/10 rounded-lg">
                            <Layers size={18} className="text-blue-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white tracking-tight">Super-Entity Explorer</h2>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">Objective 1: Multi-Wallet Fusion Engine (ICE)</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Integrated Search Bar - Now controlled by props */}
                    <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 focus-within:border-blue-500/50 transition-all group min-w-[320px] shadow-inner">
                        <div className="relative flex items-center gap-1 pr-3 border-r border-slate-800 mr-3">
                            <select
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value)}
                                className="appearance-none bg-transparent text-[10px] font-black text-blue-500 uppercase outline-none cursor-pointer z-10 pr-4"
                            >
                                <option value="ADDRESS" className="bg-slate-900">Address</option>
                                <option value="ID" className="bg-slate-900">Comm ID</option>
                            </select>
                            <ChevronDown size={10} className="absolute right-0 text-slate-500 pointer-events-none" />
                        </div>

                        <input
                            type="text"
                            placeholder={`Search ${searchType === 'ID' ? 'Community ID' : 'Proxy Address'}...`}
                            className="bg-transparent outline-none text-xs text-slate-200 placeholder:text-slate-700 flex-1 font-mono"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Search size={14} className="text-slate-700 group-focus-within:text-blue-500 transition-colors" />
                    </div>

                    <button
                        onClick={onAuditAll}
                        disabled={isAuditing || loading}
                        className={`relative overflow-hidden whitespace-nowrap px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-white shadow-lg flex items-center gap-2 active:scale-95 ${isAuditing ? 'bg-slate-800 cursor-not-allowed text-slate-500' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'}`}
                    >
                        {isAuditing ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>GAT Inferencing...</span>
                            </>
                        ) : (
                            <>
                                <Zap size={14} />
                                <span>Re-Sync AI Clusters</span>
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* Entity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading && entities.length === 0 ? (
                    <div className="col-span-full py-40 flex flex-col items-center justify-center bg-slate-900/10 rounded-[3rem] border-2 border-slate-800/50 border-dashed">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-blue-500/20 blur-2xl animate-pulse rounded-full" />
                            <Loader2 className="animate-spin text-blue-500 relative" size={48} />
                        </div>
                        <p className="text-slate-400 font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Reconstructing Topological Clusters...</p>
                    </div>
                ) : entities.length > 0 ? (
                    entities.map((entity, idx) => {
                        const irs = entity.integrity_risk_score || 0;
                        const risk = getRiskConfig(irs);

                        return (
                            <div
                                key={entity.address || idx}
                                className={`group bg-[#0a0f1c] border border-slate-800 rounded-3xl overflow-hidden transition-all duration-500 flex flex-col hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1 ${risk.border}`}
                            >
                                <div className="p-5 border-b border-slate-800/30 flex justify-between items-center bg-slate-900/10">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${irs > 0.6 ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
                                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                                            {entity.community_id ? `CLUSTER_${entity.community_id}` : `ID: ${entity.address?.substring(0, 8)}`}
                                        </span>
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${risk.bg} ${risk.color}`}>
                                        {risk.label}
                                    </div>
                                </div>

                                <div className="p-6 space-y-5 flex-1">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Proxy Node</p>
                                            <ShieldCheck size={12} className="text-slate-700" />
                                        </div>
                                        <p className="text-xs font-mono text-blue-400/90 truncate bg-slate-950 p-3 rounded-xl border border-slate-800/50 group-hover:border-blue-500/30 transition-colors">
                                            {entity.address || '0x0000...0000'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/50 group-hover:bg-slate-900/40 transition-colors">
                                            <p className="text-[8px] text-slate-600 uppercase font-black mb-1">Fused Wallets</p>
                                            <div className="flex items-baseline gap-1">
                                                <p className="text-xl font-mono text-white leading-none">{entity.fused_count || 1}</p>
                                                <span className="text-[9px] text-slate-500 font-mono">Nodes</span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/50 group-hover:bg-slate-900/40 transition-colors">
                                            <p className="text-[8px] text-slate-600 uppercase font-black mb-1">Inferred Volume</p>
                                            <div className="flex items-baseline gap-1">
                                                <p className="text-xl font-mono text-white leading-none">{parseFloat(entity.amount || 0).toFixed(2)}</p>
                                                <span className="text-[9px] text-slate-500 font-mono">ETH</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <div className="flex justify-between text-[9px] font-black uppercase">
                                            <span className="text-slate-500 tracking-wider">Integrity Risk (IRS)</span>
                                            <span className={risk.color}>{(irs * 100).toFixed(2)}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden p-[1px]">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px] ${risk.bar}`}
                                                style={{ width: `${Math.min(irs * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* High Attention Badge (Condition: IRS > 0.8) */}
                                    {irs > 0.8 && (
                                        <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 p-2 rounded-xl">
                                            <AlertTriangle size={12} className="text-red-500" />
                                            <span className="text-[8px] font-black text-red-500 uppercase">Attention Mechanism Flagged High Weight</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => onOpenAudit(entity)}
                                        className="w-full py-3.5 bg-slate-900 hover:bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all text-slate-400 hover:text-white mt-2 border border-slate-800 hover:border-blue-400 shadow-lg active:scale-[0.98]"
                                    >
                                        Inspect Topological Audit
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-600 font-mono text-xs border-2 border-dashed border-slate-800/50 rounded-[3rem] bg-slate-900/5">
                        <AlertCircle className="mb-4 text-slate-800" size={48} />
                        <p className="uppercase tracking-[0.4em] opacity-50">Zero Entities Matched Search Parameters</p>
                    </div>
                )}
            </div>
        </div>
    );
};
// New Prop: onNodeSelect (Callback to open the Audit Modal)
export const NetworkMap = ({ entities = [], onNodeSelect }) => {
    const canvasRef = useRef(null);
    const [isSimulating, setIsSimulating] = useState(true);
    const [selectedNodeId, setSelectedNodeId] = useState(null);

    // 1. DATA OPTIMIZATION: Memoized Node Feature Extraction
    const nodes = useMemo(() => {
        return [...entities]
            .sort((a, b) => (a.integrity_risk_score || 0) - (b.integrity_risk_score || 0))
            .map((e, i) => {
                const risk = parseFloat(e.integrity_risk_score || 0);
                const fusedCount = e.fused_count || 1;
                return {
                    id: e.address || i,
                    x: 800 + (Math.random() - 0.5) * 600,
                    y: 400 + (Math.random() - 0.5) * 600,
                    vx: 0, vy: 0,
                    risk: risk,
                    fusedCount: fusedCount,
                    // Scaling radius by number of fused wallets
                    radius: 4 + (risk * 6) + (Math.log10(fusedCount) * 5),
                    isHighPriority: i > entities.length - 100 || risk > 0.7,
                    color: risk > 0.75 ? '#ef4444' : risk > 0.6 ? '#f59e0b' : '#3b82f6',
                    label: e.address ? `${e.address.slice(0, 4)}...${e.address.slice(-4)}` : '???'
                };
            });
    }, [entities]);

    // --- NEW: INTERACTION LOGIC ---
    const handleCanvasClick = (event) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        // Map click to canvas internal coordinate system
        const clickX = (event.clientX - rect.left) * (canvas.width / rect.width);
        const clickY = (event.clientY - rect.top) * (canvas.height / rect.height);

        // Selection threshold: bigger radius for bigger nodes
        let foundNode = null;
        for (const node of nodes) {
            const dx = node.x - clickX;
            const dy = node.y - clickY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < node.radius + 10) {
                foundNode = node;
                break;
            }
        }

        if (foundNode) {
            setSelectedNodeId(foundNode.id);
            // Pass the full entity data back to the parent to trigger the Modal
            const originalEntity = entities.find(e => e.address === foundNode.id);
            if (onNodeSelect) onNodeSelect(originalEntity);
        } else {
            setSelectedNodeId(null);
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d', { alpha: false });
        if (!ctx || nodes.length === 0) return;

        let animationFrameId;

        const simulate = () => {
            const { width, height } = canvas;

            // --- A. PHYSICS ENGINE ---
            if (isSimulating) {
                nodes.forEach((node, i) => {
                    node.vx += (width / 2 - node.x) * 0.0001;
                    node.vy += (height / 2 - node.y) * 0.0001;

                    const step = node.isHighPriority ? 1 : 4;
                    for (let j = i + 1; j < nodes.length; j += step) {
                        const other = nodes[j];
                        const dx = other.x - node.x;
                        const dy = other.y - node.y;
                        const distSq = dx * dx + dy * dy;

                        if (distSq < 15000) {
                            const dist = Math.sqrt(distSq) || 1;
                            const force = (120 - dist) / 120;
                            const mx = (dx / dist) * force * 0.4;
                            const my = (dy / dist) * force * 0.4;
                            node.vx -= mx; node.vy -= my;
                            other.vx += mx; other.vy += my;
                        }
                    }
                    node.x += node.vx; node.y += node.vy;
                    node.vx *= 0.92; node.vy *= 0.92;
                });
            }

            // --- B. RENDERING PIPELINE ---
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, width, height);

            // Layer: Connections
            ctx.beginPath();
            // Increase thickness and visibility of connection lines for better readability
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.16)';
            nodes.forEach((node, i) => {
                if (node.risk < 0.5) return;
                for (let j = i + 1; j < Math.min(i + 3, nodes.length); j++) {
                    ctx.moveTo(node.x, node.y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                }
            });
            ctx.stroke();

            // Layer: Nodes
            nodes.forEach(node => {
                const isSelected = node.id === selectedNodeId;

                // Draw Selection Highlight
                if (isSelected) {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
                    ctx.strokeStyle = '#fff';
                    ctx.setLineDash([4, 4]); // Dashed investigation ring
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                // Bloom/Glow for Risk
                if (node.risk > 0.7) {
                    const g = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius * 3);
                    g.addColorStop(0, `${node.color}33`);
                    g.addColorStop(1, 'transparent');
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.radius * 3, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Core Node Body
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fillStyle = node.color;
                ctx.fill();

                // Labels
                if (node.risk > 0.8 || isSelected) {
                    ctx.fillStyle = isSelected ? '#fff' : '#94a3b8';
                    ctx.font = `${isSelected ? 'bold' : ''} 10px "JetBrains Mono"`;
                    ctx.fillText(node.label, node.x + node.radius + 8, node.y + 4);
                }
            });

            animationFrameId = requestAnimationFrame(simulate);
        };

        simulate();
        return () => cancelAnimationFrame(animationFrameId);
    }, [isSimulating, nodes, selectedNodeId]);

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800/50 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                        <Share2 size={24} className="text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Topological Intelligence</h2>
                        <div className="flex items-center gap-4 mt-2">
                            <LegendItem color="#ef4444" label="Critical Risk" />
                            <LegendItem color="#f59e0b" label="Moderate Risk" />
                            <LegendItem color="#3b82f6" label="Stable Entity" />
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setIsSimulating(!isSimulating)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-600/10 border border-blue-500/30 text-blue-400"
                >
                    <RefreshCw size={12} className={isSimulating ? 'animate-spin' : ''} />
                    {isSimulating ? 'Inference Live' : 'Paused'}
                </button>
            </header>

            <div className="relative h-[750px] bg-[#020617] rounded-[3rem] border border-slate-800/50 overflow-hidden shadow-2xl group">
                <div className="absolute top-8 left-8 z-20 pointer-events-none">
                    <div className="bg-slate-950/80 border border-slate-800/50 p-4 rounded-xl backdrop-blur-md">
                        <p className="text-[10px] font-mono text-slate-500 uppercase">Interaction Mode</p>
                        <p className="text-xs text-white font-bold">CLICK NODE TO AUDIT CLUSTER</p>
                    </div>
                </div>

                <canvas
                    ref={canvasRef}
                    width={1600}
                    height={800}
                    onClick={handleCanvasClick}
                    className="w-full h-full cursor-crosshair group-active:cursor-grabbing"
                />
            </div>
        </div>
    );
};

// Simple helper for cleaner legend
const LegendItem = ({ color, label }) => (
    <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
);

const ForensicAuditModal = ({ isOpen, onClose, entity }) => {
    // --- 1. DATA PREPARATION ---
    const displayMembers = useMemo(() => {
        if (!entity) return [];

        // If backend fetch finished and we have members
        if (entity.members && entity.members.length > 0) {
            return entity.members.map(m => ({
                address: m.address || "0x000...000",
                role: m.role || "ASSOCIATE",
                amount_sent: parseFloat(m.amount_sent || 0),
                amount_received: parseFloat(m.amount_received || 0),
                individual_score: parseFloat(m.individual_score ?? m.integrity_risk_score ?? 0)
            }));
        }

        // Initial state: Only show the root proxy node from the card
        return [{
            address: entity.address,
            role: "PRIMARY_PROXY",
            individual_score: entity.integrity_risk_score || 0,
            amount_sent: parseFloat(entity.amount_sent || 0),
            amount_received: parseFloat(entity.amount_received || 0)
        }];
    }, [entity]);

    const clusterFinancials = useMemo(() => {
        return displayMembers.reduce((acc, m) => ({
            sent: acc.sent + m.amount_sent,
            received: acc.received + m.amount_received
        }), { sent: 0, received: 0 });
    }, [displayMembers]);

    const roleCounts = useMemo(() => {
        return displayMembers.reduce((acc, curr) => {
            const r = curr.role || "ASSOCIATE";
            acc[r] = (acc[r] || 0) + 1;
            return acc;
        }, {});
    }, [displayMembers]);

    // --- 2. EARLY EXIT ---
    if (!isOpen || !entity) return null;

    const handleExportManifest = () => {
        const report = {
            cluster_proxy: entity.address,
            community_id: entity.community_id,
            timestamp: new Date().toISOString(),
            gat_risk_score: entity.integrity_risk_score,
            total_members: displayMembers.length,
            financial_summary: clusterFinancials,
            composition: displayMembers
        };
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Audit_Report_${entity.address.slice(0, 8)}.json`;
        link.click();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-xl" onClick={onClose} />

            <div className="relative w-full max-w-7xl bg-[#0a0f1c] border border-slate-800/60 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                {/* --- HEADER --- */}
                <div className="flex justify-between items-center px-8 py-6 border-b border-slate-800/50 bg-slate-900/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                            <ShieldAlert className="text-blue-500" size={24} />
                        </div>
                        <div>
                            <h3 className="text-white text-xl font-bold tracking-tight">Forensic Cluster Audit</h3>
                            <div className="flex gap-3 items-center mt-1">
                                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                                    Root: <span className="text-blue-400">{entity.address}</span>
                                </span>
                                <div className="h-1 w-1 rounded-full bg-slate-700" />
                                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                                    Comm_ID: <span className="text-purple-400">{entity.community_id || "PENDING"}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-800 rounded-full text-slate-400 transition-all hover:rotate-90">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">

                    {/* --- LEFT COL: MEMBER LIST (6/12) --- */}
                    <div className="lg:col-span-6 flex flex-col h-full min-h-0">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-2">
                                <Fingerprint size={14} className="text-slate-500" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Topological Trace</span>
                            </div>
                            <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                                {(!entity.members || entity.members.length === 0) && <Loader2 size={10} className="animate-spin text-blue-400" />}
                                <span className="text-[10px] font-mono text-blue-400 font-bold">{displayMembers.length} Fused Wallets</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {displayMembers.map((member, i) => (
                                <div key={i} className="p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl hover:border-blue-500/30 transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="space-y-1">
                                            <p className="text-xs font-mono text-slate-300 group-hover:text-blue-300 transition-colors">
                                                {member.address}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-black border ${member.role === 'PRIMARY_PROXY' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-slate-800 border-slate-700 text-slate-500'
                                                    }`}>
                                                    {member.role}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-slate-600 uppercase">GAT Weight</p>
                                            <p className={`text-sm font-mono font-bold ${member.individual_score > 0.7 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {member.individual_score.toFixed(4)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-6 mt-4 pt-3 border-t border-slate-900/50">
                                        <div className="flex items-center gap-2">
                                            <ArrowDownLeft size={12} className="text-emerald-500" />
                                            <span className="text-[10px] font-mono text-emerald-500">+{member.amount_received.toFixed(2)} ETH</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ArrowUpRight size={12} className="text-red-500" />
                                            <span className="text-[10px] font-mono text-red-500">-{member.amount_sent.toFixed(2)} ETH</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- RIGHT COL: ANALYSIS (6/12) --- */}
                    <div className="lg:col-span-6 space-y-6">
                        {/* 1. Financial Aggregates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner group hover:border-emerald-500/20 transition-all">
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">Cluster Inflow</p>
                                <p className="text-2xl font-mono text-emerald-400">+{clusterFinancials.received.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs text-slate-600">ETH</span></p>
                            </div>
                            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-inner group hover:border-red-500/20 transition-all">
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">Cluster Outflow</p>
                                <p className="text-2xl font-mono text-red-400">-{clusterFinancials.sent.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs text-slate-600">ETH</span></p>
                            </div>
                        </div>

                        {/* 2. Composition Bar Chart */}
                        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-6">Structural Composition</p>
                            <div className="space-y-5">
                                {Object.entries(roleCounts).map(([role, count]) => (
                                    <div key={role} className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-mono">
                                            <span className="text-slate-400 uppercase font-bold">{role}</span>
                                            <span className="text-blue-400 font-bold">{count} Nodes</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000"
                                                style={{ width: `${(count / displayMembers.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. AI Conclusion */}
                        <div className="bg-blue-600/5 p-6 rounded-3xl border border-blue-500/20 flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Cpu size={16} className="text-blue-500" />
                                    <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">GAT Engine Inference Result</p>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <p className={`text-6xl font-mono tracking-tighter ${entity.integrity_risk_score > 0.7 ? 'text-red-500' : 'text-emerald-400'}`}>
                                        {(entity.integrity_risk_score || 0).toFixed(4)}
                                    </p>
                                    <span className="text-xs text-slate-600 font-mono italic">/ 1.0000</span>
                                </div>
                                <p className="mt-4 text-xs text-slate-400 leading-relaxed font-medium">
                                    "The Graph Attention Network has identified high feature similarity in local neighborhood
                                    embeddings. Topological distance between {displayMembers.length} nodes suggests a single
                                    controlling entity."
                                </p>
                            </div>

                            <button
                                onClick={handleExportManifest}
                                className="w-full mt-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 active:scale-95"
                            >
                                <Download size={16} />
                                Export Legal Manifest (JSON)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RiskCard = ({ title, count, color, icon, label }) => {
    const themes = {
        red: "bg-red-500/5 border-red-500/20 text-red-500",
        yellow: "bg-yellow-500/5 border-yellow-500/20 text-yellow-500",
        blue: "bg-blue-500/5 border-blue-500/20 text-blue-500"
    };

    return (
        <div className={`${themes[color]} border p-6 rounded-[2rem] backdrop-blur-md transition-all hover:scale-[1.02]`}>
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
                {icon && React.isValidElement(icon)
                    ? React.cloneElement(icon, { size: 16, className: color === 'red' ? 'animate-pulse' : '' })
                    : icon}
            </div>
            <p className="text-3xl font-mono font-bold text-white mt-2">{count}</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">{label}</p>
        </div>
    );
};

const LiveInterceptView = ({ feed = [] }) => {
    return (
        <div className="space-y-4 font-mono">
            {feed.map((entry, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 border-l-4 border-red-500 rounded-r-xl group hover:bg-slate-800/50 transition-colors">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Target: {entry.address}</span>
                        <span className="text-sm font-bold text-white uppercase">{entry.amount}</span>
                    </div>
                    <div className="text-right">
                        <div className="text-red-400 font-black text-xs">{entry.risk_display || "0.00%"} RISK</div>
                        <div className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">
                            {entry.reason || "Analyzing"} • {entry.cluster_size || 0} Nodes
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
// --- MAIN DASHBOARD VIEW ---
const DashboardView = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState('explorer');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [entities, setEntities] = useState([]);
    const [liveFeed, setLiveFeed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAuditing, setIsAuditing] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [searchType, setSearchType] = useState("ADDRESS");

    const [selectedEntity, setSelectedEntity] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stats, setStats] = useState({ valueAtRisk: "0.00 ETH", total_nodes: 0, avgRiskScore: 0 });

    // --- 1. DATA SYNC (Optimized Fetching) ---
    const fetchLiveFeed = useCallback(async () => {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/live-feed');
            if (response.ok) {
                const data = await response.json();
                setLiveFeed(data);
            }
        } catch (err) {
            console.error("Live Feed Interruption:", err);
        }
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const [statsRes, clusterRes] = await Promise.all([
                fetch('http://127.0.0.1:8000/api/stats'),
                fetch('http://127.0.0.1:8000/api/clusters')
            ]);

            if (statsRes?.ok) {
                const s = await statsRes.json();
                setStats(s);
            }

            if (clusterRes?.ok) {
                const c = await clusterRes.json();
                // Ensure we handle both array and object responses safely
                setEntities(Array.isArray(c) ? c : (c.nodes || []));
            }
        } catch (err) {
            console.error("Connection Failed:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        fetchLiveFeed();

        // 3s for Live Feed (Reactive), 10s for Stats (Consistency)
        const globalInterval = setInterval(fetchData, 10000);
        const liveInterval = setInterval(fetchLiveFeed, 3000);

        return () => {
            clearInterval(globalInterval);
            clearInterval(liveInterval);
        };
    }, [fetchData, fetchLiveFeed]);

    // --- 2. COMPUTED STATE (Risk & Search) ---
    const riskDistribution = useMemo(() => {
        const counts = { critical: 0, moderate: 0, stable: 0 };
        entities.forEach(entity => {
            const score = parseFloat(entity.integrity_risk_score || 0);
            if (score > 0.75) counts.critical++;
            else if (score >= 0.6) counts.moderate++;
            else counts.stable++;
        });
        return counts;
    }, [entities]);

    const filteredEntities = useMemo(() => {
        return entities.filter((entity) => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase().trim();
            return searchType === "ID"
                ? (entity.community_id || "").toString().toLowerCase().includes(query)
                : entity.address?.toLowerCase().includes(query);
        });
    }, [entities, searchQuery, searchType]);

    // --- 3. FORENSIC ACTIONS ---
    const handleOpenAudit = useCallback(async (entity) => {
        setSelectedEntity(entity);
        setIsModalOpen(true);
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/clusters/${entity.address}/details`);
            if (response.ok) {
                const details = await response.json();
                setSelectedEntity(prev => ({
                    ...prev,
                    ...details,
                    // Atomic update to ensure count matches deep trace
                    fused_count: details.nodes?.length || prev.fused_count
                }));
            }
        } catch (err) {
            console.error("Audit Trace Sync Failed:", err);
        }
    }, []);

    const handleAuditAll = useCallback(async () => {
        setIsAuditing(true);
        try {
            const response = await fetch('http://127.0.0.1:8000/api/analyze', { method: 'POST' });
            if (response.ok) fetchData();
        } catch (err) {
            console.error("Inference Pipeline Failed:", err);
        } finally {
            setIsAuditing(false);
        }
    }, [fetchData]);

    return (
        <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} onLogout={onLogout} />

            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* --- ANALYTICS HEADER --- */}
                <header className="h-20 border-b border-slate-800/60 bg-[#0a0f1c]/80 backdrop-blur-xl px-8 flex items-center justify-between shrink-0">
                    <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                        <HeaderStat label="Value at Risk" value={stats.valueAtRisk} icon={<Database size={14} className="text-blue-500" />} />
                        <HeaderStat label="Entities" value={stats.total_nodes.toLocaleString()} icon={<Cpu size={14} className="text-purple-500" />} />
                        <HeaderStat label="Mean IRS" value={`${(stats.avgRiskScore * 100).toFixed(1)}%`} icon={<ShieldAlert size={14} className="text-red-500" />} />
                        <div className="ml-4 pl-4 border-l border-slate-800 flex flex-col justify-center">
                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Global Filter</span>
                            <span className="text-xs font-mono text-blue-400">{filteredEntities.length} Clusters</span>
                        </div>
                    </div>
                </header>

                <section className="flex-1 overflow-y-auto p-8 no-scrollbar">
                    <div className="max-w-7xl mx-auto space-y-8">

                        {/* --- RISK DISTRIBUTION HUD --- */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <RiskCard title="Critical Risk" count={riskDistribution.critical} color="red" icon={<Activity />} label="GAT Inference > 0.75" />
                            <RiskCard title="Moderate Risk" count={riskDistribution.moderate} color="yellow" icon={<ShieldAlert />} label="Behavioral Anomalies" />
                            <RiskCard title="Stable" count={riskDistribution.stable} color="blue" icon={<CheckCircle />} label="Verified Integrity" />
                        </div>

                        {/* --- VIEW ROUTER --- */}
                        <div className="animate-in fade-in duration-700 slide-in-from-bottom-2">
                            {activeTab === 'explorer' && (
                                <SuperEntitiesView
                                    entities={filteredEntities}
                                    loading={loading}
                                    isAuditing={isAuditing}
                                    onOpenAudit={handleOpenAudit}
                                    onAuditAll={handleAuditAll}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    searchType={searchType}
                                    setSearchType={setSearchType}
                                />
                            )}

                            {activeTab === 'analytics' && <AnalyticsView />}

                            {activeTab === 'network' && (
                                <NetworkMap entities={entities} onNodeSelect={handleOpenAudit} />
                            )}

                            {activeTab === 'live' && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                        <h2 className="text-xl font-mono font-bold tracking-tighter uppercase">Intercept_Stream::Live</h2>
                                    </div>
                                    {liveFeed.length > 0 ? (
                                        <LiveInterceptView feed={liveFeed} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-40 opacity-30">
                                            <Wifi size={40} className="mb-4 animate-pulse" />
                                            <p className="font-mono text-[10px] uppercase tracking-[0.3em]">Listening for incoming transactions...</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* New Sections Integrated Here */}
                            {activeTab === 'reports' && <ReportsSection entities={filteredEntities} stats={stats} />}
                            {activeTab === 'about' && <AboutSection />}
                            {activeTab === 'help' && <HelpSection />}
                        </div>
                    </div>
                </section>
            </main>

            {/* --- CENTRAL AUDIT MODAL --- */}
            <ForensicAuditModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} entity={selectedEntity} />
        </div>
    );
};
export default DashboardView;