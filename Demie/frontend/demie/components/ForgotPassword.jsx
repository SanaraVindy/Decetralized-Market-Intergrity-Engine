import React, { useState } from 'react';
import { Mail, ArrowLeft, Send, User } from 'lucide-react'; // Added User icon
import ResetPassword from './ResetPassword';

const ForgotPassword = ({ onBack }) => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState(''); // New state for username
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleResetRequest = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch('http://localhost:8000/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.toLowerCase(),
                    username: username.trim()
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'RECOVERY_LINK_DISPATCHED' });
            } else {
                setMessage({ type: 'error', text: data.detail || 'VALIDATION_FAILED' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'CONNECTION_REFUSED' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] p-6">
            <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-10">
                    <img src="/DeMIE.png" alt="DeMIE Logo" className="w-24 mb-6 opacity-80" />
                    <h2 className="text-xl font-bold text-white uppercase tracking-widest">Identity Recovery</h2>
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1">Protocol: Dual_Factor_Auth_Reset</p>
                </div>

                <form onSubmit={handleResetRequest} className="space-y-4">
                    {/* NEW: Username Field */}
                    <div className="bg-[#020617] border border-slate-800 p-4 rounded-xl">
                        <label className="text-blue-400 text-[10px] font-bold mb-2 block uppercase tracking-tighter">Auditor Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="ADMIN_IDENTIFIER"
                                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all font-mono text-sm"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Email Field */}
                    <div className="bg-[#020617] border border-slate-800 p-4 rounded-xl">
                        <label className="text-blue-400 text-[10px] font-bold mb-2 block uppercase tracking-tighter">Registered Auditor Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                            <input
                                type="email"
                                placeholder="ADMIN@DEMIE.IO"
                                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-all font-mono text-sm"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all uppercase text-sm disabled:opacity-50"
                    >
                        {loading ? "Verifying..." : "Send Reset Link"} <Send size={16} />
                    </button>
                </form>

                {message && (
                    <div className={`mt-4 p-3 rounded-lg text-[10px] font-mono text-center uppercase border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border-red-500/50 text-red-400'
                        }`}>
                        {message.text}
                    </div>
                )}

                <button
                    onClick={onBack}
                    className="mt-8 w-full text-slate-500 hover:text-white text-[10px] font-mono flex items-center justify-center gap-2 uppercase transition-colors"
                >
                    <ArrowLeft size={12} /> Return to Encrypted Entry
                </button>
            </div>
        </div>
    );
};

export default ForgotPassword;