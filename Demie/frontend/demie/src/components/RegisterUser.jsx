import React, { useState } from 'react';
import { UserPlus, ShieldCheck, ArrowLeft, Mail, Fingerprint } from 'lucide-react';

const RegisterUser = ({ onBack }) => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'AUDITOR' });
    const [status, setStatus] = useState(null);

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (response.ok) setStatus({ type: 'success', msg: `IDENTITY SECURED: ${data.session_id}` });
            else throw new Error(data.detail || 'REGISTRATION_FAILED');
        } catch (err) {
            setStatus({ type: 'error', msg: err.message });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] p-6">
            <div className="w-full max-w-md bg-[#0f172a] border border-blue-500/20 p-8 rounded-2xl shadow-2xl shadow-blue-500/5">
                <div className="flex flex-col items-center mb-8 text-center">
                    <div className="p-3 bg-blue-500/10 rounded-full mb-4">
                        <Fingerprint className="text-blue-400" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-white uppercase tracking-widest">New Auditor Entry</h2>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">PROTOCOL: FORENSIC_INDEX_INITIALIZATION</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                        <input
                            className="w-full bg-[#020617] border border-slate-800 p-3 rounded-lg text-white font-mono text-sm focus:border-blue-500 outline-none"
                            placeholder="ASSIGN_USERNAME"
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                        <input
                            type="email"
                            className="w-full bg-[#020617] border border-slate-800 p-3 rounded-lg text-white font-mono text-sm focus:border-blue-500 outline-none"
                            placeholder="OFFICIAL_EMAIL_ADDRESS"
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                        <input
                            type="password"
                            className="w-full bg-[#020617] border border-slate-800 p-3 rounded-lg text-white font-mono text-sm focus:border-blue-500 outline-none"
                            placeholder="SECURE_AUDITOR_KEY"
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 uppercase text-xs">
                        <ShieldCheck size={16} /> Authorize Forensic ID
                    </button>
                </form>

                {status && (
                    <div className={`mt-6 p-3 rounded font-mono text-[10px] text-center border ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border-red-500/50 text-red-400'
                        }`}>
                        {status.msg}
                    </div>
                )}

                <button onClick={onBack} className="mt-8 w-full text-slate-500 hover:text-white text-[10px] font-mono flex items-center justify-center gap-2 uppercase">
                    <ArrowLeft size={12} /> Return to Entry Portal
                </button>
            </div>
        </div>
    );
};

export default RegisterUser;