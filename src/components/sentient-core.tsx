"use client";

import { useEffect, useState } from "react";

type AgentState = "IDLE" | "THINKING" | "ACTION" | "ERROR";

interface SentientCoreProps {
  state: AgentState;
}

export function SentientCore({ state }: SentientCoreProps) {
  const [pulseClass, setPulseClass] = useState("shadow-[0_0_50px_rgba(59,130,246,0.2)] bg-blue-500/10");
  
  useEffect(() => {
    switch (state) {
      case "IDLE":
        setPulseClass("shadow-[0_0_60px_rgba(59,130,246,0.15)] bg-blue-500/5 animate-pulse-slow duration-[4000ms]");
        break;
      case "THINKING":
        setPulseClass("shadow-[0_0_80px_rgba(251,191,36,0.3)] bg-amber-500/10 animate-pulse duration-[1500ms]");
        break;
      case "ACTION":
        setPulseClass("shadow-[0_0_100px_rgba(255,255,255,0.4)] bg-white/20 animate-ping duration-[1000ms]");
        break;
      case "ERROR":
        setPulseClass("shadow-[0_0_50px_rgba(239,68,68,0.4)] bg-red-500/20 animate-glitch");
        break;
    }
  }, [state]);

  // Dynamic Background Gradient based on state
  const bgGradient = 
    state === "IDLE" ? "from-blue-900/5 via-black to-black" :
    state === "THINKING" ? "from-amber-900/10 via-black to-black" :
    state === "ACTION" ? "from-gray-900/10 via-black to-black" :
    "from-red-900/10 via-black to-black";

  return (
    <div className={`fixed inset-0 pointer-events-none z-[-1] transition-all duration-1000 bg-gradient-to-b ${bgGradient}`}>
      {/* The Core: A subtle orb in the top center (or center of screen) */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-[120px] transition-all duration-1000 opacity-60">
        <div className={`w-full h-full rounded-full transition-all duration-1000 ${pulseClass}`}></div>
      </div>
      
      {/* Micro-particles / Grid overlay for texture */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]"></div>
    </div>
  );
}
