import React, { useState } from 'react';
import { UserPlus, ShieldCheck, X } from 'lucide-react';

const RegisterAuditor = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({ username: '', password: '', role: 'AUDITOR' });
    const [status, setStatus] = useState(null);

    const handleRegister = async (e) => {
        e.preventDefault();
        setStatus(null); // Clear previous status

        try {
            const response = await fetch('http://localhost:8000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Ensure keys match backend: 'username' and 'password'
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', msg: `ID generated: ${data.session_id}` });
                // Reset form on success
                setFormData({ username: '', password: '', role: 'AUDITOR' });
            } else {
                throw new Error(data.detail || 'REGISTRATION_FAILED');
            }
        } catch (err) {
            setStatus({ type: 'error', msg: err.message });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0a0f1c] border border-blue-500/30 p-8 rounded-2xl w-full max-w-md shadow-2xl shadow-blue-500/10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <UserPlus className="text-blue-400" /> NEW_AUDITOR_ENTRY
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <input
                        className="w-full bg-slate-900 border border-slate-800 p-3 rounded-lg text-white font-mono text-sm focus:border-blue-500 outline-none"
                        placeholder="ASSIGN_USERNAME"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                    />
                    <input
                        type="password"
                        className="w-full bg-slate-900 border border-slate-800 p-3 rounded-lg text-white font-mono text-sm focus:border-blue-500 outline-none"
                        placeholder="SECURE_AUDITOR_KEY"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2">
                        <ShieldCheck size={18} /> AUTHORIZE_ACCOUNT
                    </button>
                </form>

                {status && (
                    <div className={`mt-4 p-3 rounded font-mono text-[10px] uppercase text-center ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                        {status.msg}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RegisterAuditor;