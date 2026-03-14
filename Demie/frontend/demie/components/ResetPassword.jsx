import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Grab the token from the URL on load
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setMessage({ type: 'error', text: 'MALFORMED_RECOVERY_TOKEN' });
        }
    }, []);

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        if (!token) return;

        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch('http://localhost:8000/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    password: password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'CREDENTIAL_ROTATION_COMPLETE' });
                // Optional: Redirect to login after 3 seconds
                setTimeout(() => window.location.href = '/login', 3000);
            } else {
                setMessage({ type: 'error', text: data.detail || 'ROTATION_FAILED' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'NETWORK_DISRUPTION_DETECTED' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] p-6">
            <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>

                <div className="flex flex-col items-center mb-10">
                    <ShieldCheck className="text-blue-500 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-white uppercase tracking-[0.2em]">Credential Rotation</h2>
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1 italic">Status: Security_Vault_Accessed</p>
                </div>

                {!message || message.type !== 'success' ? (
                    <form onSubmit={handleResetSubmit} className="space-y-6">
                        <div className="bg-[#020617] border border-slate-800 p-5 rounded-xl">
                            <label className="text-blue-400 text-[10px] font-bold mb-3 block uppercase tracking-tighter">Enter New Security Key</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3.6 text-slate-500" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••••••"
                                    className="w-full bg-[#1e293b] border border-slate-700 rounded-lg py-3 pl-10 pr-12 text-white focus:outline-none focus:border-blue-500 transition-all font-mono text-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3.5 text-slate-500 hover:text-white"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !token}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all uppercase text-sm disabled:opacity-30 group"
                        >
                            {loading ? "Committing..." : "Update Credentials"}
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                ) : null}

                {message && (
                    <div className={`mt-6 p-4 rounded-lg text-[11px] font-mono text-center uppercase border leading-relaxed ${message.type === 'success'
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                            : 'bg-red-500/10 border-red-500/50 text-red-400'
                        }`}>
                        <div className="font-bold mb-1">{message.type === 'success' ? '✔' : '✘'} SYSTEM_MESSAGE:</div>
                        {message.text}
                        {message.type === 'success' && <div className="mt-2 text-[9px] animate-pulse">Redirecting to login portal...</div>}
                    </div>
                )}

                <div className="mt-8 flex justify-between items-center px-2">
                    <span className="text-[8px] text-slate-600 font-mono uppercase">Node: SRI-01</span>
                    <span className="text-[8px] text-slate-600 font-mono uppercase">Auth: GCM-V2</span>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;