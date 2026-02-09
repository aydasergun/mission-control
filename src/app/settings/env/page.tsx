"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MonitoringPanel } from "@/components/monitoring-panel";
import { connectToGateway, LogEntry } from "@/lib/gateway";
import { Settings, X, Activity, Cpu, Database, Save, ArrowLeft } from "lucide-react";
import { EnvEditor } from "./env-editor";
import Link from "next/link";

export default function EnvPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [vpsStats, setVpsStats] = useState({ cpu: "0.0%", ram: "2.8 GB" });
  const [gatewayStatus, setGatewayStatus] = useState("OFFLINE");
  const [isMonitoringOpen, setIsMonitoringOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const connection = connectToGateway(
      (newLog) => setLogs(prev => [newLog, ...prev].slice(0, 15)),
      (status) => setGatewayStatus(status)
    );
    return () => { if (connection && connection.disconnect) connection.disconnect(); };
  }, []);

  return (
    <main className="flex h-screen w-full overflow-hidden bg-[#0a0a0a] relative text-white">
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
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Link href="/settings" className="flex items-center gap-2 text-blue-500 hover:text-blue-400 transition-colors text-xs font-black uppercase tracking-widest mb-4 group">
                   <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Config
                </Link>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                  <Cpu className="text-blue-500" /> Environment Matrix
                </h2>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Manage system variables and uplink parameters</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-[2rem] blur-xl opacity-50"></div>
              <div className="relative bg-[#0d0d0d]/80 backdrop-blur-xl border border-[#1a1a1a] rounded-3xl p-6 md:p-8 overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Database size={120} />
                </div>
                <EnvEditor />
              </div>
            </div>
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
