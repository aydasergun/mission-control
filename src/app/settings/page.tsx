"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MonitoringPanel } from "@/components/monitoring-panel";
import { connectToGateway, LogEntry } from "@/lib/gateway";
import { Settings, Server, Shield, Activity, X, Terminal, Cpu, Database } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [vpsStats, setVpsStats] = useState({ cpu: "0.0%", ram: "2.8 GB" });
  const [gatewayStatus, setGatewayStatus] = useState("OFFLINE");
  const [isMonitoringOpen, setIsMonitoringOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
    const connection = connectToGateway(
      (newLog) => setLogs(prev => [newLog, ...prev].slice(0, 15)),
      (status) => setGatewayStatus(status)
    );
    return () => { if (connection && connection.disconnect) connection.disconnect(); };
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data.settings);
    } catch (e) {
      console.error("Settings error", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-full overflow-hidden bg-[#0a0a0a] relative">
      {/* 1. SIDEBAR */}
      <div className={`fixed inset-0 z-[100] lg:relative lg:z-0 lg:block ${isSidebarOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/80 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative h-full w-[80px] bg-[#050505] border-r border-[#1a1a1a]">
          <Sidebar />
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden absolute top-4 -right-12 p-2 bg-white/5 rounded-full text-white"><X size={20} /></button>
        </div>
      </div>

      <section className="flex-1 flex flex-col relative bg-[#0a0a0a] min-w-0">
        <Header status={gatewayStatus} onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Mobile Action Button */}
        <div className="lg:hidden fixed bottom-6 right-6 z-[80]">
          <button onClick={() => setIsMonitoringOpen(true)} className="p-4 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] text-white"><Activity size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide pt-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
              <Settings className="text-blue-500" /> System Configuration
            </h2>

            {loading ? (
              <div className="text-blue-500 animate-pulse text-xs font-black tracking-widest">LOADING CONFIG...</div>
            ) : settings ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* CORE CONFIG CARD */}
                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-3xl p-6 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Server size={64} />
                  </div>
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Core Systems</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-sm font-bold text-white">Primary Model</span>
                      <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{settings.model}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-sm font-bold text-white">Gateway Port</span>
                      <span className="text-xs font-mono text-gray-400">{settings.gatewayPort}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-sm font-bold text-white">System Version</span>
                      <span className="text-xs font-mono text-gray-400">v{settings.version}</span>
                    </div>
                  </div>
                </div>

                {/* ENV MATRIX CARD */}
                <Link href="/settings/env" className="bg-[#0d0d0d] border border-[#1a1a1a] hover:border-blue-500/30 rounded-3xl p-6 relative group overflow-hidden transition-all">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Database size={64} className="text-blue-500" />
                  </div>
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div>
                    Environment Matrix
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-6">Manage .env variables and secrets</p>
                  
                  <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-widest mt-auto group-hover:gap-4 transition-all">
                    Access Matrix <Activity size={12} className="animate-pulse" />
                  </div>
                </Link>

                {/* MODULES CARD */}
                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-3xl p-6 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Shield size={64} />
                  </div>
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Active Modules</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${settings.telegramEnabled ? 'bg-green-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-bold text-white">Telegram Uplink</span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-gray-500">{settings.telegramEnabled ? 'ACTIVE' : 'DISABLED'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${settings.browserEnabled ? 'bg-green-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-bold text-white">Browser Engine</span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-gray-500">{settings.browserEnabled ? 'HEADLESS' : 'OFF'}</span>
                    </div>
                  </div>
                </div>

                {/* DANGER ZONE (Visual only for now) */}
                <div className="md:col-span-2 bg-red-500/5 border border-red-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                      <Terminal size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">System Restart</h4>
                      <p className="text-[10px] text-gray-500">Reboots the OpenClaw Gateway service. Connection will be lost briefly.</p>
                    </div>
                  </div>
                  <button className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                    Restart Gateway
                  </button>
                </div>

              </div>
            ) : (
              <div className="text-red-500">Failed to load configuration.</div>
            )}
          </div>
        </div>
      </section>

      {/* MONITORING PANEL */}
      <div className={`fixed inset-0 z-[110] lg:hidden ${isMonitoringOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsMonitoringOpen(false)}></div>
        <div className={`absolute right-0 top-0 h-full w-full sm:w-[380px] bg-[#080808] border-l border-[#1a1a1a] transition-transform duration-300 ${isMonitoringOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#0a0a0a]">
            <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2"><Activity size={14} className="text-blue-500" /> Intelligence Stream</span>
            <button onClick={() => setIsMonitoringOpen(false)} className="p-2 bg-white/5 rounded-full text-white/50"><X size={20} /></button>
          </div>
          <div className="h-full overflow-hidden"><MonitoringPanel logs={logs} vpsStats={vpsStats} /></div>
        </div>
      </div>
      
      <div className="hidden lg:block w-[380px] h-full border-l border-[#1a1a1a] bg-[#080808] flex-shrink-0">
        <MonitoringPanel logs={logs} vpsStats={vpsStats} />
      </div>
    </main>
  );
}
