import React, { useState } from 'react';
import { Shield, Lock, AlertCircle, LifeBuoy, UserPlus } from 'lucide-react';
import ForgotPassword from './ForgotPassword';
import RegisterUser from './RegisterUser'; // Import the new component

const AuditorLogin = ({ onLoginSuccess }) => {
    const [accessKey, setAccessKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [view, setView] = useState('login'); // login, forgot, register

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: "admin", password: accessKey }),
            });
            const data = await response.json();
            if (response.ok) onLoginSuccess(data);
            else throw new Error(data.detail || "Invalid Auditor Key");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (view === 'forgot') return <ForgotPassword onBack={() => setView('login')} />;
    if (view === 'register') return <RegisterUser onBack={() => setView('login')} />;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] p-6">
            <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-10">
                    <img src="/DeMIE.png" alt="DeMIE Logo" className="w-32 mb-6" />
                    <h2 className="text-2xl font-bold text-white tracking-tight">Access Restricted</h2>
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1">Demie Forensic Cryptographic Entry</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="bg-[#020617] border border-slate-800 p-5 rounded-xl">
                        <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold mb-4 bg-blue-400/10 w-fit px-2 py-1 rounded">
                            <Shield size={12} /> <span>SECURE AUDITOR SESSION</span>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                            <input
                                type="password"
                                placeholder="ENTER AUDITOR KEY"
                                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all font-mono text-sm"
                                value={accessKey}
                                onChange={(e) => setAccessKey(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold transition-all uppercase tracking-wider text-sm">
                        {loading ? "Verifying..." : "Sign with User Key"}
                    </button>
                </form>

                <div className="mt-8 flex flex-col items-center gap-4">
                    <button onClick={() => setView('forgot')} className="text-slate-500 hover:text-blue-400 text-[10px] font-mono flex items-center gap-2 uppercase">
                        <LifeBuoy size={12} /> Lost Access? Dispatch Recovery Protocol
                    </button>
                    <button onClick={() => setView('register')} className="text-blue-500/60 hover:text-blue-400 text-[10px] font-mono flex items-center gap-2 uppercase underline underline-offset-4 decoration-blue-500/30">
                        <UserPlus size={12} /> New User? Initialize ID
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditorLogin;