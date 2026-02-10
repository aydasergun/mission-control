"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Terminal, Menu, X, Activity, CheckCircle, AlertCircle, Image as ImageIcon, Bot, User, Smartphone, MessageCircle, Hash, Clock, Globe, Zap } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MonitoringPanel } from "@/components/monitoring-panel";
import { SentientCore } from "@/components/sentient-core";
import { connectToGateway, LogEntry } from "@/lib/gateway";
import MessageCard from "@/components/MessageCard";

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  source: string;
};

export default function Home() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [vpsStats, setVpsStats] = useState({ cpu: "0%", ram: "0 GB" });
  const [gatewayStatus, setGatewayStatus] = useState("OFFLINE");
  const [isMonitoringOpen, setIsMonitoringOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMonitoringOpen, setIsMobileMonitoringOpen] = useState(false);
  const [command, setCommand] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [cmdResult, setCmdResult] = useState<{success: boolean, output: string} | null>(null);
  const [agentState, setAgentState] = useState<"IDLE" | "THINKING" | "ACTION" | "ERROR">("IDLE");
  const [sendMessageFn, setSendMessageFn] = useState<(msg: string) => boolean>(() => () => false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);

  const fetchChatHistory = async () => {
    try {
      const res = await fetch("/api/chat/history?limit=50");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (e) { console.error("Chat fetch error", e); }
  };

  const fetchSystemStats = async () => {
    try {
      const res = await fetch("/api/system/stats");
      if (res.ok) {
        const data = await res.json();
        setVpsStats({ cpu: data.cpu, ram: data.ram });
      }
    } catch (e) { console.error("Stats fetch error", e); }
  };

  const handleInputSubmit = async () => {
    if (!command.trim()) return;
    if (command.startsWith("/") || command.startsWith(">")) {
        const cleanCmd = command.startsWith("/") ? command.slice(1) : command.slice(1);
        setIsExecuting(true);
        setAgentState("ACTION");
        setCmdResult(null);
        try {
            const res = await fetch("/api/terminal/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ command: cleanCmd.trim() })
            });
            const data = await res.json();
            setCmdResult({ success: res.ok, output: data.output || data.error });
            if (res.ok) setCommand("");
        } catch (e: any) {
            setCmdResult({ success: false, output: e.message });
            setAgentState("ERROR");
        } finally {
            setIsExecuting(false);
            setTimeout(() => setAgentState("IDLE"), 2000);
        }
    } else {
        const sent = sendMessageFn(command);
        if (sent) {
            setCommand("");
            setAgentState("ACTION");
            setTimeout(() => setAgentState("IDLE"), 1000);
        }
    }
  };
  
  useEffect(() => {
    fetchChatHistory();
    fetchSystemStats();
    const chatInterval = setInterval(fetchChatHistory, 3000);
    const statsInterval = setInterval(fetchSystemStats, 5000);
    const { disconnect, sendMessage } = connectToGateway(
      (newLog) => {
        setLogs(prev => [newLog, ...prev].slice(0, 50));
        if (newLog.type === "THINKING") setAgentState("THINKING");
        else if (newLog.type === "CALL") setAgentState("ACTION");
        else if (newLog.type === "ERROR") setAgentState("ERROR");
      }, 
      (status) => setGatewayStatus(status)
    );
    setSendMessageFn(() => sendMessage);
    return () => { disconnect(); clearInterval(chatInterval); clearInterval(statsInterval); };
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setUserScrolled(!isNearBottom);
    }
  };

  useEffect(() => {
    if (scrollRef.current && !userScrolled) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, userScrolled]);

  return (
    <main className="flex h-screen w-full overflow-hidden overflow-x-hidden bg-transparent relative">
      <SentientCore state={agentState} />

      <div className="hidden lg:block w-[80px] h-full border-r border-[#1a1a1a] bg-[#050505]/60 backdrop-blur-xl flex-shrink-0 z-20">
        <Sidebar />
      </div>

      <div className={`fixed inset-0 z-[100] lg:hidden ${isSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsSidebarOpen(false)}></div>
        <div className={`absolute left-0 top-0 h-full w-[80px] bg-[#050505] border-r border-[#1a1a1a] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar />
        </div>
      </div>

      <section className="flex-1 flex flex-col relative bg-transparent min-w-0 z-10">
        <Header 
          status={gatewayStatus} 
          onMenuClick={() => setIsSidebarOpen(true)} 
          onMonitoringClick={() => setIsMobileMonitoringOpen(true)}
          showMonitoringToggle={true}
        />

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 scrollbar-hide pt-6" ref={scrollRef} onScroll={handleScroll}>
          <div className="max-w-3xl mx-auto space-y-10 pb-4">
            {messages.length === 0 ? (
              <div className="text-center text-white/20 text-sm py-10 italic">Sessiz mod... Henüz mesaj yok.</div>
            ) : (
              messages.map((msg) => (
                <MessageCard 
                  key={msg.id}
                  content={msg.content}
                  metadata={{
                    platform: msg.source,
                    timestamp: msg.timestamp,
                    message_id: msg.id,
                    sender: (msg.role === 'assistant' || msg.content.includes('[[reply_to_current]]')) ? 'assistant' : 'user'
                  }}
                />
              ))
            )}
          </div>
        </div>

        <div className="p-4 md:p-6 bg-gradient-to-t from-[#050505] to-transparent">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className={`flex items-center gap-3 bg-[#0d0d0d] border p-2 pl-5 rounded-2xl transition-all relative group ${isExecuting ? 'border-blue-500/50 shadow-[0_0_20px_rgba(37,99,235,0.1)] ring-4 ring-blue-500/10' : 'border-[#1a1a1a] focus-within:border-blue-500/30'}`}>
              <div className={`absolute inset-0 rounded-2xl bg-blue-500/5 opacity-0 transition-opacity duration-500 ${isExecuting ? 'opacity-100 animate-pulse' : ''}`} />
              <Activity size={16} className={isExecuting ? 'text-blue-500 animate-spin' : 'text-zinc-600 group-hover:text-blue-400 transition-colors'} />
              <input 
                type="text" 
                placeholder="Mesaj yaz..." 
                className="bg-transparent border-none outline-none flex-1 text-sm text-zinc-200 py-3 placeholder:text-zinc-700 relative z-10" 
                value={command} 
                onChange={(e) => setCommand(e.target.value)} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleInputSubmit();
                  }
                }} 
                disabled={isExecuting} 
              />
              <button 
                onClick={handleInputSubmit} 
                disabled={isExecuting || !command.trim()} 
                className={`relative z-10 text-white text-[10px] font-black px-6 py-3 rounded-xl uppercase tracking-widest transition-all overflow-hidden ${isExecuting || !command.trim() ? 'bg-zinc-900 text-zinc-700' : 'bg-blue-600 hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] hover:scale-105 active:scale-95'}`}
              >
                {isExecuting ? (
                  <span className="animate-pulse">Wait</span>
                ) : (
                  <span className="flex items-center gap-2">Send <Zap size={12} className="fill-current" /></span>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Desktop Monitoring Panel - Always visible on xl+ */}
      <div className="hidden xl:block w-[380px] h-full border-l border-[#1a1a1a] bg-[#050505]/40 backdrop-blur-xl z-20"><MonitoringPanel logs={logs} vpsStats={vpsStats} /></div>

      {/* Mobile/Tablet Monitoring Panel - Slide-out overlay */}
      <div className={`fixed inset-0 z-[100] xl:hidden ${isMobileMonitoringOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div 
          className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isMobileMonitoringOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileMonitoringOpen(false)}
        ></div>
        <div className={`absolute right-0 top-0 h-full w-[calc(100vw-60px)] max-w-[400px] bg-[#050505] border-l border-[#1a1a1a] transition-transform duration-300 ease-out ${isMobileMonitoringOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <button 
            onClick={() => setIsMobileMonitoringOpen(false)}
            className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors z-10"
            aria-label="Close monitoring panel"
          >
            <X size={20} />
          </button>
          <MonitoringPanel logs={logs} vpsStats={vpsStats} />
        </div>
      </div>
    </main>
  );
}
