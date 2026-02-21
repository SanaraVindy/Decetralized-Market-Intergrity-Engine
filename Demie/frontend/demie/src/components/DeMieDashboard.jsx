import React, { useEffect, useState } from 'react';
import { Activity, ShieldAlert, Users, TrendingUp } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const DeMieDashboard = () => {
    const [stats, setStats] = useState({ total_nodes: 0, high_risk_count: 0, avg_threat_index: 0 });
    const [events, setEvents] = useState([]);

    useEffect(() => {
        // Fetch live stats from the backend routes created above
        fetch('/api/forensics/dashboard-stats').then(res => res.json()).then(setStats);
        fetch('/api/forensics/event-stream').then(res => res.json()).then(setEvents);
    }, []);

    return (
        <div className="p-8 bg-[#0a0b14] min-h-screen text-slate-200">
            {/* KPI Header Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Analyzed Nodes" value={stats.total_nodes} icon={<Users />} color="text-blue-400" />
                <StatCard title="High Risk Entities" value={stats.high_risk_count} icon={<ShieldAlert />} color="text-red-500" />
                <StatCard title="Avg Network Threat" value={`${stats.avg_threat_index}%`} icon={<Activity />} color="text-orange-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Risk Attribution Vectors (Center Left) */}
                <div className="bg-[#11131f] p-6 rounded-2xl border border-slate-800">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-400" /> Risk Attribution Trends
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={events}>
                                <XAxis dataKey="wallet" hide />
                                <YAxis hide domain={[0, 1]} />
                                <Tooltip contentStyle={{ backgroundColor: '#11131f', borderColor: '#1e293b' }} />
                                <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Dynamic Event Stream (Fixes the 100% issue) */}
                <div className="bg-[#11131f] p-6 rounded-2xl border border-slate-800">
                    <h3 className="text-lg font-bold mb-4">Live Forensic Stream</h3>
                    <div className="space-y-4">
                        {events.map((event, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-[#1a1c2e] rounded-lg border-l-4 border-red-500">
                                <div>
                                    <p className="text-xs font-mono text-slate-400">{event.wallet}</p>
                                    {/* Dynamic Threat Index based on integrity_risk_score */}
                                    <p className="text-sm font-bold text-red-400">
                                        THREAT INDEX: {(event.score * 100).toFixed(2)}%
                                    </p>
                                </div>
                                <p className="font-bold text-blue-400">{event.value || 0} ETH</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-[#11131f] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-slate-400 text-sm mb-1">{title}</p>
                <h2 className="text-3xl font-black">{value}</h2>
            </div>
            <div className={`p-3 bg-slate-800/50 rounded-lg ${color}`}>{icon}</div>
        </div>
    </div>
);

export default DeMieDashboard;