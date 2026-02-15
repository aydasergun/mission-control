"use client";

import { useEffect, useState } from "react";
import { Menu, ChevronDown, Coins, Brain, Sparkles, HeartPulse, Activity, ShieldCheck, Globe, Monitor } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface HeaderProps {
  status: string;
  onMenuClick?: () => void;
  onMonitoringClick?: () => void;
  showMonitoringToggle?: boolean;
}

// FORMATTER: Cleans up long model IDs into pretty names
// e.g. "google-antigravity/gemini-3-pro-high" -> { provider: "Google", name: "Gemini 3 Pro", type: "High" }
const formatModelInfo = (modelId: string) => {
  if (!modelId) return { provider: "System", name: "Unknown", tags: [] };

  let provider = "Local";
  let name = modelId;
  let tags: string[] = [];

  if (modelId.includes("/")) {
    const parts = modelId.split("/");
    provider = parts[0];
    name = parts[1];
  }

  // Prettify Provider
  if (provider.includes("antigravity")) provider = "Antigravity";
  else if (provider === "ollama") provider = "Ollama";
  else if (provider === "google") provider = "Google";
  else if (provider === "openai") provider = "OpenAI";

  // Prettify Name & Tags
  name = name
    .replace("claude-opus-4-5-thinking", "Claude Opus 4.5")
    .replace("claude-sonnet-4-5", "Claude Sonnet 4.5")
    .replace("gemini-3-pro-high", "Gemini 3 Pro")
    .replace("gemini-3-flash", "Gemini 3 Flash")
    .replace("kimi-k2.5:cloud", "Kimi k2.5");

  // Add Tags based on ID
  if (modelId.includes("thinking")) tags.push("Thinking");
  if (modelId.includes("high")) tags.push("High");
  if (modelId.includes("preview")) tags.push("Preview");
  if (modelId.includes("flash")) tags.push("Fast");

  return { provider, name, tags };
};

function StatusIcon({ icon: Icon, active, color, glow, tooltip, pulse }: any) {
  return (
    <div className="relative group/icon">
      <div className={`transition-all duration-300 ${active ? `${color} ${glow} scale-110` : 'text-white/10 scale-100'} ${active && pulse ? 'animate-pulse' : ''}`}>
        <Icon size={14} strokeWidth={2.5} />
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black border border-white/10 text-white text-[8px] font-bold uppercase tracking-wider rounded-lg opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl">
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black border-r border-b border-white/10 rotate-45"></div>
        {tooltip}
      </div>
    </div>
  );
}

export function Header({ status, onMenuClick, onMonitoringClick, showMonitoringToggle }: HeaderProps) {
  const [currentModel, setCurrentModel] = useState("Loading...");
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    fetchModelInfo();
  }, []);

  const fetchModelInfo = async () => {
    try {
      const res = await fetch("/api/system/model");
      const data = await res.json();
      setCurrentModel(data.currentModel);
      setAvailableModels(data.availableModels || []);
    } catch (e) { console.error(e); }
  };

  const handleModelSwitch = async (modelId: string) => {
    setIsSwitching(true);
    setIsDropdownOpen(false);
    try {
      const res = await fetch("/api/system/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId })
      });
      if (res.ok) {
        setCurrentModel(modelId);
      }
    } catch (e) { console.error(e); } finally { setIsSwitching(false); }
  };

  const currentInfo = formatModelInfo(currentModel);

  return (
    <header className="h-[72px] bg-[#050505]/90 backdrop-blur-xl border-b border-[#1a1a1a] flex items-center justify-between px-4 md:px-6 sticky top-0 z-50 shadow-sm overflow-visible">
      {/* Left Section - Logo & Status */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-shrink-0">
        {onMenuClick && (
          <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors flex-shrink-0" aria-label="Open menu">
            <Menu size={20} />
          </button>
        )}
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Single h1 with responsive content */}
            <h1 className="text-[14px] sm:text-[16px] font-black tracking-tighter text-white uppercase italic leading-none flex-shrink-0 flex items-center">
              {/* Mobile: Simple title */}
              <span className="block sm:hidden">🌙 AYDA</span>
              {/* Desktop: Full title with glitch effect */}
              <span className="!hidden sm:!block glitch-wrapper" data-text="🌙 AYDA · MISSION CONTROL">
                🌙 AYDA · MISSION CONTROL
              </span>
            </h1>
            <div className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center flex-shrink-0">
              <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider leading-none">v2.4</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status === "ONLINE" ? "bg-[#10b981] shadow-[0_0_6px_#10b981]" : "bg-red-500 shadow-[0_0_6px_#ef4444]"}`}></div>
            <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-[0.15em] leading-none">Gateway {status}</span>
          </div>
        </div>
      </div>

      {/* Right Section - Actions & Model Selector */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-shrink-0">
        
        {/* System Status Icons - Visible on all devices */}
        <div className="flex items-center gap-1 sm:gap-2">
          <StatusIcon icon={HeartPulse} active={true} color="text-red-500" glow="drop-shadow-[0_0_5px_rgba(239,68,68,0.7)]" tooltip="System Heartbeat" pulse />
          <StatusIcon icon={ShieldCheck} active={true} color="text-[#10b981]" glow="drop-shadow-[0_0_5px_rgba(16,185,129,0.7)]" tooltip="System Healthy" />
          <StatusIcon icon={Activity} active={true} color="text-blue-500" glow="drop-shadow-[0_0_5px_rgba(59,130,246,0.7)]" tooltip="Ayda Active" />
          <StatusIcon icon={Globe} active={true} color="text-purple-500" glow="drop-shadow-[0_0_5px_rgba(147,51,234,0.7)]" tooltip="Gateway Connected" />
        </div>

        {/* Monitoring Toggle - Visible on mobile/tablet (hidden on xl+) */}
        {showMonitoringToggle && onMonitoringClick && (
          <button 
            onClick={onMonitoringClick}
            className="xl:hidden p-2.5 bg-[#111] border border-[#222] rounded-xl hover:border-blue-500/50 transition-all group flex-shrink-0 relative"
            aria-label="Open monitoring panel"
          >
            <Activity size={18} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black border border-white/10 text-white text-[9px] font-bold uppercase tracking-wider rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-2xl">
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-black border-r border-b border-white/10 rotate-45"></div>
              Mobile: System monitoring & controls
            </div>
          </button>
        )}
        


        {/* MODEL SELECTOR - Always visible, simplified on mobile */}
        <div className="relative flex-shrink-0 min-w-[44px]">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={isSwitching}
            className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-[#111] border border-[#222] rounded-xl hover:border-blue-500/50 transition-all group min-h-[40px] ${isSwitching ? 'opacity-50 cursor-wait' : ''}`}
            aria-label="Select AI Model"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors flex-shrink-0">
              <Brain size={14} className="text-blue-400 sm:w-4 sm:h-4" />
            </div>
            {/* Model name - visible on screens >= 400px (xs-ish) */}
            <div className="flex flex-col items-start text-left min-w-0 hidden min-[400px]:flex">
              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">{currentInfo.provider}</span>
              <span className="text-[10px] sm:text-[11px] font-bold text-white leading-none flex items-center gap-1 sm:gap-2 truncate max-w-[80px] sm:max-w-[120px]">
                {currentInfo.name}
                {currentInfo.tags.includes("High") && <Sparkles size={8} className="text-amber-400 flex-shrink-0" fill="currentColor" />}
              </span>
            </div>
            <ChevronDown size={14} className={`text-gray-500 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* DROPDOWN MENU - Using React Portal pattern with fixed positioning */}
          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-[90]" onClick={() => setIsDropdownOpen(false)}></div>
              <div className="fixed right-2 sm:right-0 sm:absolute sm:top-full sm:mt-2 w-[calc(100vw-1rem)] sm:w-72 max-w-[320px] bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 top-[68px] sm:top-auto">
                <div className="px-4 py-3 bg-[#111] border-b border-[#222] flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select Intelligence</span>
                  <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-gray-400">{availableModels.length} Available</span>
                </div>
                <div className="max-h-[320px] overflow-y-auto p-2 custom-scrollbar space-y-1">
                  {availableModels.map((model) => {
                    const info = formatModelInfo(model.id);
                    const isActive = currentModel === model.id;
                    
                    // Model availability check (removed fuel quota tracking)
                    const isDepleted = false; // All models available
                    
                    return (
                      <button
                        key={model.id}
                        onClick={() => handleModelSwitch(model.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 group ${
                          isActive 
                            ? "bg-blue-600/10 border border-blue-500/30" 
                            : "border border-transparent hover:bg-[#151515] hover:border-[#222]"
                        } ${isDepleted ? "opacity-50 grayscale" : ""}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-500 shadow-[0_0_6px_#3b82f6]' : isDepleted ? 'bg-red-500' : 'bg-[#333] group-hover:bg-[#444]'}`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-[11px] font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>{info.name}</span>
                            <span className="text-[9px] text-gray-600 font-mono uppercase">{info.provider}</span>
                          </div>
                          <div className="flex justify-between items-center">
                              <div className="flex gap-1">
                                 {info.tags.map(tag => (
                                   <span key={tag} className="text-[8px] px-1.5 py-px rounded bg-white/5 text-gray-500 font-medium">{tag}</span>
                                 ))}
                               </div>
                           </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>  

      </div>
    </header>
  );
}
