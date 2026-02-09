"use client";

import { useEffect, useState } from "react";
import { Menu, ChevronDown, Coins, Zap, Brain, Sparkles, Fuel, Timer, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface HeaderProps {
  status: string;
  onMenuClick?: () => void;
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

export function Header({ status, onMenuClick }: HeaderProps) {
  const [currentModel, setCurrentModel] = useState("Loading...");
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [usage, setUsage] = useState({ totalTokens: 0, limits: [] as any[] });

  useEffect(() => {
    fetchModelInfo();
    fetchUsage();
    const usageInterval = setInterval(fetchUsage, 10000);
    return () => clearInterval(usageInterval);
  }, []);

  const fetchModelInfo = async () => {
    try {
      const res = await fetch("/api/system/model");
      const data = await res.json();
      setCurrentModel(data.currentModel);
      setAvailableModels(data.availableModels || []);
    } catch (e) { console.error(e); }
  };

  const fetchUsage = async () => {
    try {
      const res = await fetch("/api/system/usage");
      const data = await res.json();
      setUsage(data);
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
  
  // Find current model limits
  const currentModelLimit = usage.limits?.find(l => currentModel.includes(l.model)) || { usedPercent: 0, resetAt: null };
  const fuelPercentage = Math.max(0, 100 - currentModelLimit.usedPercent); // Remaining fuel
  
  // Fuel Color Logic
  let fuelColor = "text-emerald-500";
  let fuelBg = "bg-emerald-500/20";
  let fuelBar = "bg-emerald-500";
  
  if (fuelPercentage < 20) {
      fuelColor = "text-red-500";
      fuelBg = "bg-red-500/20";
      fuelBar = "bg-red-500";
  } else if (fuelPercentage < 50) {
      fuelColor = "text-yellow-500";
      fuelBg = "bg-yellow-500/20";
      fuelBar = "bg-yellow-500";
  }

  // Format Reset Time
  let resetTimeDisplay = "Ready";
  if (currentModelLimit.resetAt) {
      const resetDate = new Date(currentModelLimit.resetAt);
      if (resetDate > new Date()) {
          // Calculate minutes left manually for cleaner display than formatDistanceToNow
          const diffMs = resetDate.getTime() - new Date().getTime();
          const diffMins = Math.ceil(diffMs / 60000);
          resetTimeDisplay = `${diffMins}m`;
      }
  }

  return (
    <header className="h-[72px] bg-[#050505]/90 backdrop-blur-xl border-b border-[#1a1a1a] flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
            <Menu size={20} />
          </button>
        )}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <h1 className="glitch-wrapper text-[16px] font-black tracking-tighter text-white uppercase italic leading-none hidden sm:block" data-text="MISSION CONTROL">MISSION CONTROL</h1>
            <h1 className="text-[16px] font-black tracking-tighter text-white uppercase italic leading-none sm:hidden">MC</h1>
            <div className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 flex items-center">
              <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider leading-none">v2.4</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${status === "ONLINE" ? "bg-[#10b981] shadow-[0_0_6px_#10b981]" : "bg-red-500 shadow-[0_0_6px_#ef4444]"}`}></div>
            <span className="text-[10px] font-bold text-[#6b7280] uppercase tracking-[0.15em] leading-none">Gateway {status}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        
        {/* REACTOR STATUS (QUOTA & FUEL) */}
        <div className="hidden md:flex items-center gap-4 px-3 py-1.5 bg-[#0a0a0a] border border-[#222] rounded-lg">
          
          {/* Fuel / Quota */}
          <div className="flex items-center gap-2 min-w-[80px]">
             <Fuel size={12} className={fuelColor} />
             <div className="flex flex-col w-full">
               <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[8px] text-gray-500 font-bold uppercase leading-none">Fuel</span>
                  <span className={`text-[8px] font-bold leading-none ${fuelColor}`}>{fuelPercentage.toFixed(0)}%</span>
               </div>
               <div className="w-full h-1 bg-[#222] rounded-full overflow-hidden">
                  <div className={`h-full ${fuelBar} transition-all duration-500`} style={{ width: `${fuelPercentage}%` }}></div>
               </div>
             </div>
          </div>

          <div className="w-px h-4 bg-[#222]"></div>

          {/* Reset Timer */}
          <div className="flex items-center gap-2 min-w-[60px]">
             <RefreshCw size={12} className={currentModelLimit.resetAt && new Date(currentModelLimit.resetAt) > new Date() ? "text-amber-500 animate-pulse" : "text-gray-600"} />
             <div className="flex flex-col items-start leading-none">
               <span className="text-[8px] text-gray-500 font-bold uppercase">Reset</span>
               <span className="text-[10px] text-white font-mono">{resetTimeDisplay}</span>
             </div>
          </div>
          
           <div className="w-px h-4 bg-[#222]"></div>
           
           {/* Total Tokens (Historical) */}
           <div className="flex items-center gap-2">
              <Zap size={12} className="text-purple-500" />
              <div className="flex flex-col items-end leading-none">
                <span className="text-[8px] text-gray-500 font-bold uppercase">Total</span>
                <span className="text-[10px] text-white font-mono">{(usage.totalTokens / 1000).toFixed(0)}k</span>
              </div>
           </div>

        </div>

        {/* MODEL SELECTOR */}
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={isSwitching}
            className={`flex items-center gap-3 px-3 py-1.5 bg-[#111] border border-[#222] rounded-xl hover:border-blue-500/50 transition-all group ${isSwitching ? 'opacity-50 cursor-wait' : ''}`}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
              <Brain size={16} className="text-blue-400" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">{currentInfo.provider}</span>
              <span className="text-[11px] font-bold text-white leading-none flex items-center gap-2">
                {currentInfo.name}
                {currentInfo.tags.includes("High") && <Sparkles size={8} className="text-amber-400" fill="currentColor" />}
              </span>
            </div>
            <ChevronDown size={14} className={`text-gray-500 ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* DROPDOWN MENU */}
          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
              <div className="absolute right-0 top-full mt-2 w-72 bg-[#0a0a0a] border border-[#222] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 bg-[#111] border-b border-[#222] flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select Intelligence</span>
                  <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-gray-400">{availableModels.length} Available</span>
                </div>
                <div className="max-h-[320px] overflow-y-auto p-2 custom-scrollbar space-y-1">
                  {availableModels.map((model) => {
                    const info = formatModelInfo(model.id);
                    const isActive = currentModel === model.id;
                    
                    // Check limit for this model
                    const limit = usage.limits?.find(l => model.id.includes(l.model));
                    const isDepleted = limit && limit.usedPercent >= 95;
                    
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
                              {limit && (
                                  <span className={`text-[9px] font-mono ${limit.usedPercent > 80 ? 'text-red-500' : 'text-emerald-500'}`}>
                                      {Math.max(0, 100 - limit.usedPercent).toFixed(0)}% Fuel
                                  </span>
                              )}
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
