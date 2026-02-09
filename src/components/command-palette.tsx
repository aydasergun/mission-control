"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Command, ArrowRight, Zap, Home, LayoutGrid, Database, Settings } from "lucide-react";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Toggle with Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!isOpen) return null;

  const actions = [
    { id: "home", label: "Go to Home", icon: Home, action: () => router.push("/") },
    { id: "antigravity", label: "Go to Antigravity", icon: LayoutGrid, action: () => router.push("/antigravity") },
    { id: "database", label: "Go to Memory Bank", icon: Database, action: () => router.push("/database") },
    { id: "settings", label: "Go to Settings", icon: Settings, action: () => router.push("/settings") },
    { id: "flush", label: "System: Flush Memory", icon: Zap, action: () => alert("Memory Flush Triggered (Simulation)") },
  ];

  const filtered = actions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-[20vh] animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
      <div 
        className="w-full max-w-lg bg-[#0a0a0a] border border-[#333] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[#222]">
          <Search size={20} className="text-[#666]" />
          <input 
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-[#444] text-lg font-medium"
            placeholder="Type a command..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="px-2 py-1 bg-[#222] rounded text-[10px] text-[#666] font-mono border border-[#333]">ESC</div>
        </div>
        
        <div className="p-2 max-h-[300px] overflow-y-auto">
          {filtered.map((action, i) => (
            <button
              key={action.id}
              onClick={() => { action.action(); setIsOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors group ${i === 0 ? 'bg-[#111]' : ''}`}
            >
              <div className="flex items-center gap-3">
                <action.icon size={16} className="text-gray-500 group-hover:text-white" />
                <span>{action.label}</span>
              </div>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="p-4 text-center text-gray-600 text-sm italic">No commands found.</div>
          )}
        </div>
        
        <div className="bg-[#111] px-4 py-2 border-t border-[#222] flex justify-between items-center">
          <span className="text-[10px] text-gray-600 font-mono">Mission Control v2.2</span>
          <div className="flex items-center gap-2 text-[10px] text-gray-600">
            <Command size={10} /> + K to open
          </div>
        </div>
      </div>
    </div>
  );
}
