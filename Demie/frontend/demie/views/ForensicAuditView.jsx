import React, { useState } from 'react';
import { Search, ShieldAlert, ShieldCheck } from 'lucide-react';

const ForensicAuditView = () => {
    const [address, setAddress] = useState('');
    const [result, setResult] = useState(null);

    const handleAudit = async () => {
        const response = await fetch(`http://127.0.0.1:8000/api/audit/${address}`);
        const data = await response.json();
        setResult(data);
    };

    return (
        <div className="p-8">
            <div className="flex gap-4 mb-8">
                <input
                    className="flex-1 bg-slate-900 border border-slate-700 p-4 rounded-xl text-white font-mono"
                    placeholder="Enter Wallet Address (0x...)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                />
                <button onClick={handleAudit} className="bg-blue-600 px-8 rounded-xl text-white font-bold flex items-center gap-2">
                    <Search size={18} /> Run GATv2 Audit
                </button>
            </div>

            {result && (
                <div className={`p-6 rounded-2xl border ${result.isMalicious ? 'bg-red-500/10 border-red-500/50' : 'bg-emerald-500/10 border-emerald-500/50'}`}>
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                {result.isMalicious ? <ShieldAlert className="text-red-500" /> : <ShieldCheck className="text-emerald-500" />}
                                {result.status}
                            </h3>
                            <p className="text-slate-400 font-mono mt-2">{result.address}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-4xl font-black text-white">{(result.riskScore * 100).toFixed(1)}%</p>
                            <p className="text-slate-500 uppercase text-xs tracking-widest">Threat Index</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ForensicAuditView;