import React, { useState, useEffect } from 'react';
import { Shield, Lock, User, AlertCircle, LifeBuoy, UserPlus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';
import RegisterUser from './RegisterUser';

const AuditorLogin = ({ onLoginSuccess }) => {
    const location = useLocation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [view, setView] = useState('login');

    useEffect(() => {
        if (location.state?.message) {
            setError(location.state.message);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        if (error && (username || password)) {
            setError(null);
        }
    }, [username, password, error]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                onLoginSuccess(data);
            } else {
                throw new Error(data.detail || "Authentication Failed");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (view === 'forgot') return <ForgotPassword onBack={() => setView('login')} />;
    if (view === 'register') return <RegisterUser onBack={() => setView('login')} />;

    return (
        /* BACKGROUND: Pure black for maximum contrast */
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#000000] p-6 selection:bg-blue-500/30">

            {/* LOGIN BOX: Lightened to Slate-900 with a sharper border and outer glow 
                This ensures the box 'pops' off the black background
            */}
            <div className="w-full max-w-md bg-[#0f172a] border border-slate-700 rounded-2xl p-8 shadow-[0_0_40px_rgba(59,130,246,0.15)] ring-1 ring-slate-700/50 relative overflow-hidden">

                {/* Accent: Bright blue top border to define the edge */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500 opacity-80 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>

                <div className="flex flex-col items-center mb-8">
                    <img src="/DeMIE.png" alt="DeMIE Logo" className="w-24 mb-6 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
                    <h2 className="text-2xl font-bold text-white tracking-tight italic">DeMIE Access</h2>
                    <p className="text-blue-400/80 text-[10px] uppercase tracking-[0.4em] mt-1 font-mono font-bold">Forensic Intelligence Portal</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {/* INPUT CONTAINER: Darker than the box to create depth */}
                    <div className="bg-[#020617] border border-slate-800 p-6 rounded-xl space-y-4 shadow-inner">
                        <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold mb-2 bg-blue-400/10 w-fit px-2 py-1 rounded border border-blue-400/20">
                            <Shield size={12} className="animate-pulse" /> <span>SECURE AUDITOR SESSION</span>
                        </div>

                        {/* Username */}
                        <div className="relative group">
                            <User className="absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="USERNAME / AUDITOR ID"
                                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all font-mono text-xs placeholder:text-slate-500"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                            <input
                                type="password"
                                placeholder="SECURE PASSWORD"
                                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all font-mono text-xs placeholder:text-slate-500"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-[11px] bg-red-400/10 p-3 rounded-lg border border-red-400/20 animate-in fade-in">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold transition-all uppercase tracking-wider text-sm shadow-lg shadow-blue-900/30 active:scale-[0.98]"
                    >
                        {loading ? "Verifying..." : "Initialize Session"}
                    </button>
                </form>

                <div className="mt-8 flex flex-col items-center gap-4 border-t border-slate-800/50 pt-6">
                    <button onClick={() => setView('forgot')} className="text-slate-500 hover:text-blue-400 text-[10px] font-mono flex items-center gap-2 uppercase transition-colors">
                        <LifeBuoy size={12} /> Lost Access? Dispatch Recovery
                    </button>
                    <button onClick={() => setView('register')} className="text-blue-500/50 hover:text-blue-400 text-[10px] font-mono flex items-center gap-2 uppercase underline underline-offset-4 decoration-blue-500/20 transition-colors">
                        <UserPlus size={12} /> New User? Register ID
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditorLogin;