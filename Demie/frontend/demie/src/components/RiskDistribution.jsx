import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ShieldAlert, BarChart3 } from 'lucide-react';

const RiskDistribution = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        // In a real app, this would fetch from your FastAPI /api/forensics/stats endpoint
        const mockData = [
            { category: 'Low Risk (<0.3)', count: 7420, color: '#22c55e' },
            { category: 'Medium Risk (0.3-0.7)', count: 1850, color: '#eab308' },
            { category: 'High Risk (>0.7)', count: 548, color: '#ef4444' },
        ];
        setData(mockData);
    }, []);

    return (
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-700 text-white mt-6">
            <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="text-blue-400" />
                <h2 className="text-xl font-bold">Network Risk Profile</h2>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="category" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                            cursor={{ fill: '#1e293b' }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
                {data.map((item) => (
                    <div key={item.category} className="text-center p-2 rounded bg-slate-800/50">
                        <p className="text-xs text-slate-400">{item.category}</p>
                        <p className="text-lg font-bold" style={{ color: item.color }}>{item.count}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RiskDistribution;