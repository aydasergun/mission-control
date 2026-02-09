"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCw, Trash2, Plus, Lock, Eye, EyeOff, Terminal, Sparkles } from "lucide-react";

interface EnvVar {
  key: string;
  value: string;
}

export function EnvEditor() {
  const [vars, setVars] = useState<EnvVar[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchVars();
  }, []);

  const fetchVars = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/env");
      const data = await res.json();
      setVars(data);
    } catch (e) {
      console.error("Failed to fetch env vars", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/env", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars.filter(v => v.key.trim() !== "")),
      });

      if (res.ok) {
        const btn = document.getElementById("save-btn");
        if (btn) {
           btn.classList.add("bg-green-500/20", "text-green-500", "border-green-500/50");
           setTimeout(() => btn.classList.remove("bg-green-500/20", "text-green-500", "border-green-500/50"), 2000);
        }
      }
    } catch (e) {
      console.error("Failed to save env vars", e);
    } finally {
      setIsSaving(false);
    }
  };

  const updateVar = (index: number, field: 'key' | 'value', value: string) => {
    const newVars = [...vars];
    newVars[index][field] = value;
    setVars(newVars);
  };

  const addVar = () => {
    setVars([...vars, { key: "", value: "" }]);
  };

  const deleteVar = (index: number) => {
    const newVars = vars.filter((_, i) => i !== index);
    setVars(newVars);
  };

  const toggleVisibility = (index: number) => {
    setShowValues(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw size={32} className="text-blue-500 animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/50 animate-pulse">Syncing Matrix...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-4">
           <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 border border-blue-500/20 relative group">
             <Terminal size={16} />
             <div className="absolute -inset-1 bg-blue-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
           </div>
           <div>
             <span className="text-xs font-black text-white uppercase tracking-widest block">Environment Variables</span>
             <span className="text-[9px] text-gray-500 font-bold uppercase">{vars.length} Variables Loaded</span>
           </div>
        </div>
        <button 
          id="save-btn"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50 relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <div className="relative flex items-center gap-2">
            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {isSaving ? "Uploading..." : "Save Changes"}
          </div>
        </button>
      </div>

      <div className="space-y-3">
        {vars.map((v, i) => (
          <div key={i} className="group flex flex-col md:flex-row items-start md:items-center gap-4 p-4 bg-black/40 border border-[#1a1a1a] hover:border-blue-500/30 rounded-2xl transition-all relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/0 group-hover:bg-blue-500/50 transition-all"></div>
            
            <div className="md:w-1/3 min-w-0">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-1">Variable Key</span>
              <input
                type="text"
                value={v.key}
                onChange={(e) => updateVar(i, 'key', e.target.value)}
                className="w-full bg-transparent border-none p-0 text-xs font-mono font-bold text-blue-400 focus:ring-0 placeholder-blue-900/50"
                placeholder="VARIABLE_NAME"
              />
            </div>

            <div className="flex-1 w-full relative">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block mb-1 md:hidden">Value</span>
              <div className="relative group/input">
                <input
                  type={showValues[i] ? "text" : "password"}
                  value={v.value}
                  onChange={(e) => updateVar(i, 'value', e.target.value)}
                  className="w-full bg-[#050505]/60 border border-[#222] group-hover/input:border-blue-500/30 rounded-xl px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500/50 transition-all pr-10"
                  placeholder="Enter value..."
                />
                <button 
                  onClick={() => toggleVisibility(i)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                >
                  {showValues[i] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
               <button 
                onClick={() => deleteVar(i)}
                className="p-2 bg-red-500/10 text-red-500/50 hover:text-red-500 hover:bg-red-500/20 rounded-lg border border-red-500/10 transition-all" title="Delete"
               >
                 <Trash2 size={14} />
               </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4">
        <button 
          onClick={addVar}
          className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-[#1a1a1a] hover:border-blue-500/30 hover:bg-blue-500/5 rounded-2xl text-[10px] font-black text-gray-600 hover:text-blue-500 uppercase tracking-widest transition-all group"
        >
          <Plus size={14} className="group-hover:rotate-90 transition-transform" /> Add New Matrix Variable
        </button>
      </div>

      <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-full bg-amber-500/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-1000"></div>
        <Lock size={16} className="text-amber-500 mt-0.5 shrink-0 relative" />
        <div className="relative">
          <p className="text-[9px] text-amber-500/70 font-bold uppercase tracking-wider leading-relaxed">
            Critical Warning: Modifying environment variables will affect system behavior. Changes are written directly to .env. Some changes may require a Gateway restart to take effect.
          </p>
        </div>
      </div>
    </div>
  );
}
