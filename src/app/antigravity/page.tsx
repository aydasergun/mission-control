"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MonitoringPanel } from "@/components/monitoring-panel";
import { connectToGateway, LogEntry } from "@/lib/gateway";
import { Menu, X, Activity } from "lucide-react";

export default function AntigravityPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [vpsStats, setVpsStats] = useState({ cpu: "0.0%", ram: "2.8 GB" });
  const [gatewayStatus, setGatewayStatus] = useState("OFFLINE");
  const [isMonitoringOpen, setIsMonitoringOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/antigravity/accounts");
      const data = await res.json();
      setAccounts(data);
    } catch (e) {
      console.error("Fetch error", e);
    }
  };

  useEffect(() => {
    fetchAccounts();
    const connection = connectToGateway(
      (newLog) => setLogs(prev => [newLog, ...prev].slice(0, 15)),
      (status) => setGatewayStatus(status)
    );
    return () => { if (connection && connection.disconnect) connection.disconnect(); };
  }, []);

  return (
    <main className="flex h-screen w-full overflow-hidden bg-[#0a0a0a] relative">
      {/* 1. DESKTOP SIDEBAR (Static) */}
      <div className="hidden lg:block w-[80px] h-full border-r border-[#1a1a1a] bg-[#050505] flex-shrink-0">
        <Sidebar />
      </div>

      {/* 2. MOBILE SIDEBAR (Drawer) */}
      <div className={`fixed inset-0 z-[100] lg:hidden ${isSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsSidebarOpen(false)}></div>
        <div className={`absolute left-0 top-0 h-full w-[80px] bg-[#050505] border-r border-[#1a1a1a] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar />
          <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 -right-12 p-2 bg-white/5 rounded-full text-white"><X size={20} /></button>
        </div>
      </div>

      <section className="flex-1 flex flex-col relative bg-[#0a0a0a] min-w-0">
        <Header status={gatewayStatus} onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Floating Action Button for Monitoring */}
        <div className="lg:hidden fixed bottom-6 right-6 z-[80]">
          <button onClick={() => setIsMonitoringOpen(true)} className="p-4 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] text-white"><Activity size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide pt-10">
          <div className="max-w-[1600px] mx-auto space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase italic">Antigravity Quota Manager</h2>
                <div className="flex items-center gap-2 text-[#4b5563] text-[10px] font-bold uppercase tracking-widest">
                  <div className="w-1 h-1 rounded-full bg-blue-500"></div> Total Pooled Accounts: {accounts.length}
                </div>
              </div>
            </div>

            {/* Responsive Grid: 1 on mobile, 2 on md, 3 on lg, 4 on xl */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {accounts.map((acc) => (
                <div key={acc.id} className={`group relative bg-[#0d0d0d] border ${acc.isCurrent ? 'border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.1)]' : 'border-[#1a1a1a]'} rounded-3xl p-6 hover:bg-[#111] transition-all duration-500`}>
                  {acc.isCurrent && <div className="absolute -top-3 left-6 bg-orange-500 text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg">Current Agent</div>}
                  {acc.isInCooldown && <div className="absolute -top-3 right-6 bg-blue-500/20 border border-blue-500/50 text-blue-400 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter flex items-center gap-1">❄️ {acc.cooldownMins}m</div>}
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1 truncate pr-4 w-full">
                      <div className="text-white font-bold text-sm truncate" title={acc.email}>{acc.email}</div>
                      <div className="text-[10px] text-gray-600 font-mono">Last: {acc.lastUsed}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {acc.quotas.map((q: any) => (
                      <div key={q.model} className="space-y-2">
                        <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-tighter">
                          <span className="text-gray-500">{q.model}</span>
                          <span className={q.percent < 15 ? 'text-red-500 animate-pulse' : 'text-gray-300'}>{q.percent}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${acc.isCurrent ? 'bg-orange-500' : 'bg-blue-500/40'}`} style={{ width: `${q.percent}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. MONITORING PANEL (Responsive) */}
      {/* Desktop: Static Sidebar */}
      <div className="hidden lg:block w-[380px] h-full border-l border-[#1a1a1a] bg-[#080808] flex-shrink-0">
        <MonitoringPanel logs={logs} vpsStats={vpsStats} />
      </div>

      {/* Mobile: Fullscreen Overlay */}
      <div className={`fixed inset-0 z-[110] lg:hidden ${isMonitoringOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-300 ${isMonitoringOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMonitoringOpen(false)}></div>
        <div className={`absolute right-0 top-0 h-full w-full sm:w-[380px] bg-[#080808] border-l border-[#1a1a1a] transition-transform duration-300 ${isMonitoringOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#0a0a0a]">
            <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2"><Activity size={14} className="text-blue-500" /> Intelligence Stream</span>
            <button onClick={() => setIsMonitoringOpen(false)} className="p-2 bg-white/5 rounded-full text-white/50"><X size={20} /></button>
          </div>
          <div className="h-full overflow-hidden"><MonitoringPanel logs={logs} vpsStats={vpsStats} /></div>
        </div>
      </div>
    </main>
  );
}
