import React from 'react';
import { Share2, LayoutDashboard, Activity, ChevronLeft, ChevronRight, LogOut, Terminal } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed, onLogout }) => {
    const navItems = [
        { id: 'explorer', label: 'Cluster Explorer', icon: Share2, desc: 'Heuristic Groups' },
        { id: 'analytics', label: 'Forensic Audit', icon: LayoutDashboard, desc: 'Deep Analytics' },
        { id: 'live', label: 'Event Stream', icon: Activity, desc: 'Live Intelligence' },
    ];

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-[#0a0f1c] border-r border-slate-800 transition-all duration-300 flex flex-col z-50 h-screen`}>

            {/* Header with Logo */}
            <div className="p-4 flex items-center justify-between border-b border-slate-800/50 min-h-[80px]">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                        {/* Custom DeMIE Logo replaces ShieldCheck */}
                        <img
                            src="/DeMIE.png"
                            alt="Logo"
                            className={`${isCollapsed ? 'w-10' : 'w-12'} transition-all drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]`}
                        />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <span className="text-white font-bold tracking-tight text-lg leading-tight">DeMIE</span>
                            <span className="text-[9px] text-blue-500 font-black tracking-widest uppercase">Forensic Suite</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded-md hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all group ${activeTab === item.id
                                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                    >
                        <item.icon size={20} className={activeTab === item.id ? 'text-blue-400' : 'group-hover:text-blue-400'} />
                        {!isCollapsed && (
                            <div className="text-left">
                                <p className="text-sm font-semibold">{item.label}</p>
                                <p className="text-[10px] text-slate-500">{item.desc}</p>
                            </div>
                        )}
                    </button>
                ))}
            </nav>

            {/* Footer / Logout Section */}
            <div className="p-4 border-t border-slate-800/50 bg-slate-950/30">
                {!isCollapsed && (
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">Auditor Session: Active</span>
                    </div>
                )}

                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-4 p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                >
                    <LogOut size={20} />
                    {!isCollapsed && (
                        <div className="text-left">
                            <p className="text-sm font-bold">Terminate Session</p>
                            <p className="text-[9px] text-red-500/60 font-mono tracking-widest">CLEAR_AUTH_CACHE</p>
                        </div>
                    )}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;