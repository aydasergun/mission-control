"use client";

import { useEffect, useState } from "react";
import { 
  Activity, 
  Cpu, 
  HeartPulse, 
  ShieldCheck, 
  Zap, 
  Globe, 
  MessageSquare, 
  Terminal, 
  RefreshCw, 
  AlertTriangle, 
  Search, 
  FileText, 
  Power,
  X 
} from "lucide-react";
import { LogEntry } from "@/lib/gateway";

interface MonitoringPanelProps {
  logs: LogEntry[];
  vpsStats: { cpu: string; ram: string };
}

const LOG_MAP: Record<string, { label: string; color: string; icon: any }> = {
  'AGENT': { label: 'Ayda Görevde', color: 'text-orange-500', icon: Zap },
  'CHAT': { label: 'Mesaj Trafiği', color: 'text-purple-500', icon: MessageSquare },
  'ERROR': { label: 'Kritik Hata', color: 'text-red-500', icon: AlertTriangle },
  'FAILOVER': { label: 'Model Değişimi', color: 'text-amber-500', icon: RefreshCw },
  'TOOL': { label: 'Sistem Aracı Çalışıyor', color: 'text-blue-400', icon: Terminal },
  'MEMORY': { label: 'Hafıza Güncellendi', color: 'text-emerald-500', icon: FileText },
  'RESEARCH': { label: 'Ayda Araştırıyor', color: 'text-cyan-400', icon: Search },
  'LIFECYCLE': { label: 'Sistem Yaşam Döngüsü', color: 'text-slate-400', icon: Power },
};

const HIDDEN_LOGS = ['TICK', 'HEALTH', 'PRESENCE', 'HEARTBEAT', 'hello-ok', 'connect', 'open', 'close', 'event', 'res'];

export function MonitoringPanel({ logs, vpsStats }: MonitoringPanelProps) {
  const [lastTick, setLastTick] = useState(0);
  const [isHealthy, setIsHealthy] = useState(true);
  const [isAgentBusy, setIsAgentBusy] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (logs.length > 0) {
      const lastLog = logs[0];
      const logText = (lastLog.msg + " " + (lastLog.detail || "")).toLowerCase();
      
      if (lastLog.msg === 'TICK' || logText.includes('heartbeat')) setLastTick(Date.now());
      if (lastLog.msg === 'HEALTH' || logText.includes('health')) setIsHealthy(!logText.includes('error') && !logText.includes('fail'));
      if (lastLog.msg === 'AGENT' || lastLog.msg === 'TOOL' || logText.includes('tool') || logText.includes('agent')) {
        setIsAgentBusy(true);
        const timer = setTimeout(() => setIsAgentBusy(false), 2000);
        return () => clearTimeout(timer);
      }
      if (lastLog.msg === 'PRESENCE' || logText.includes('presence') || logText.includes('connect')) setIsConnected(true);
      if (lastLog.type === 'ERROR' || logText.includes('error')) setIsHealthy(false);
    }
  }, [logs]);

  const filteredLogs = logs
    .filter(log => {
      const msg = log.msg || "";
      const detail = log.detail || "";
      if (HIDDEN_LOGS.some(noise => msg.includes(noise) || detail.includes(noise))) return false;
      return true;
    })
    .map(log => {
      let detail = log.detail || "";
      let msg = log.msg;
      const lowerDetail = detail.toLowerCase();
      if (msg === 'AGENT' || msg === 'TOOL' || lowerDetail.includes('tool')) {
        if (lowerDetail.includes('exec') || lowerDetail.includes('terminal') || lowerDetail.includes('shell')) { msg = 'TOOL'; detail = "Terminalde sistem sorgusu yürütülüyor..."; }
        else if (lowerDetail.includes('read') || lowerDetail.includes('write') || lowerDetail.includes('fs.')) { msg = 'MEMORY'; detail = "Dosya sistemi üzerinde hafıza kaydı yapılıyor..."; }
        else if (lowerDetail.includes('search') || lowerDetail.includes('fetch') || lowerDetail.includes('brave')) { msg = 'RESEARCH'; detail = "Web üzerinden derinlemesine araştırma yapılıyor..."; }
        else { msg = 'AGENT'; detail = "Asistan karmaşık bir görevi analiz ediyor..."; }
      } else if (msg === 'CHAT' || lowerDetail.includes('message')) { msg = 'CHAT'; detail = "Kullanıcı ile aktif veri alışverişi sağlanıyor."; }
      else if (msg === 'LIFECYCLE') { detail = "Sistem servisleri (Gateway/UI) optimize ediliyor..."; }
      return { ...log, msg, detail };
    });

  return (
    <aside className="h-full w-full bg-[#080808] border-l border-[#1a1a1a] flex flex-col p-6 shadow-2xl relative">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[10px] font-black text-[#4b5563] uppercase tracking-[0.3em] flex items-center gap-2">
          <div className="w-1 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></div>
          Monitoring Center
        </h2>
        
        <div className="flex items-center gap-4 bg-[#111] px-4 py-2 rounded-2xl border border-white/5">
          <StatusIcon icon={HeartPulse} active={Date.now() - lastTick < 5000} color="text-red-500" glow="drop-shadow-[0_0_5px_rgba(239,68,68,0.7)]" tooltip="Sistem Kalp Atışı (Live)" pulse />
          <StatusIcon icon={ShieldCheck} active={isHealthy} color={isHealthy ? "text-[#10b981]" : "text-red-500"} glow={isHealthy ? "drop-shadow-[0_0_5px_rgba(16,185,129,0.7)]" : "drop-shadow-[0_0_5px_rgba(239,68,68,0.7)]"} tooltip={isHealthy ? "Sistem Sağlıklı" : "Kritik Hata Saptandı!"} />
          <StatusIcon icon={Zap} active={isAgentBusy} color="text-orange-500" glow="drop-shadow-[0_0_5px_rgba(249,115,22,0.7)]" tooltip="Ayda Aktif Çalışıyor" pulse />
          <StatusIcon icon={Globe} active={isConnected} color="text-blue-500" glow="drop-shadow-[0_0_5px_rgba(59,130,246,0.7)]" tooltip="Gateway Bağlantısı Aktif" />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 mb-8 overflow-hidden">
        <div className="flex justify-between items-center mb-4 px-1">
          <span className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest">Action Stream</span>
          <span className="text-[9px] text-[#10b981] font-mono font-bold animate-pulse">INTELLIGENCE ACTIVE</span>
        </div>
        <div className="flex-1 bg-black/40 border border-[#1a1a1a] rounded-2xl p-4 font-mono text-[10px] overflow-y-auto space-y-4 custom-scrollbar scroll-smooth">
          {filteredLogs.map((log, i) => {
            const mapped = LOG_MAP[log.msg] || { label: log.msg, color: 'text-gray-500', icon: Activity };
            const Icon = mapped.icon;
            return (
              <div key={i} className="animate-in fade-in slide-in-from-right duration-500 group">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg bg-white/5 ${mapped.color} group-hover:scale-110 transition-transform`}>
                    <Icon size={12} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold tracking-tight">{mapped.label}</span>
                      <span className="text-[9px] text-white/10">[{log.ts}]</span>
                    </div>
                    {log.detail && <div className="text-white/30 truncate max-w-[240px] text-[9px] italic">{log.detail}</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <span className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest px-1 flex items-center gap-2">
          VPS Pulse <div className="h-px flex-1 bg-white/5"></div>
        </span>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-[#111] to-[#0d0d0d] border border-white/5 p-4 rounded-2xl">
            <div className="text-[#444] text-[9px] font-black uppercase mb-2 flex justify-between items-center tracking-tighter">CPU <Cpu size={10} /></div>
            <div className="text-xl font-black text-white/90 tabular-nums">{vpsStats.cpu}</div>
          </div>
          <div className="bg-gradient-to-br from-[#111] to-[#0d0d0d] border border-white/5 p-4 rounded-2xl">
            <div className="text-[#444] text-[9px] font-black uppercase mb-2 flex justify-between items-center tracking-tighter">RAM <Activity size={10} /></div>
            <div className="text-xl font-black text-white/90 tabular-nums">{vpsStats.ram}</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <span className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest px-1 flex items-center gap-2">
          Active Nodes <div className="h-px flex-1 bg-white/5"></div>
        </span>
        <div className="flex flex-wrap gap-2">
          {['Brave', 'Firecrawl', 'Context7', 'Shell', 'Ollama'].map(node => (
            <div key={node} className="bg-white/5 border border-white/5 px-2.5 py-2 rounded-xl text-[9px] font-bold flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></div> {node}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function StatusIcon({ icon: Icon, active, color, glow, pulse, tooltip }: any) {
  return (
    <div className="relative group/icon">
      <div className={`transition-all duration-300 ${active ? `${color} ${glow} scale-110` : 'text-white/10 scale-100'} ${active && pulse ? 'animate-pulse' : ''}`}>
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2.5 py-1.5 bg-black border border-white/10 text-white text-[9px] font-bold uppercase tracking-wider rounded-lg opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl">
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black border-r border-b border-white/10 rotate-45"></div>
        {tooltip}
      </div>
    </div>
  );
}
