"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Database, Settings, Moon, Terminal } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="h-full w-full bg-[#050505] border-r border-[#1a1a1a] flex flex-col items-center py-6 gap-8 z-50">
      <div className="flex flex-col items-center gap-2 group cursor-pointer">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)] group-hover:scale-110 transition-transform duration-300">
          <Moon size={20} className="text-white fill-white animate-pulse-slow" />
        </div>
      </div>

      <nav className="flex flex-col gap-4 w-full px-3">
        <NavItem href="/" icon={Home} label="Home" active={isActive("/")} />
        <NavItem href="/antigravity" icon={LayoutGrid} label="Antigravity" active={isActive("/antigravity")} />
        <NavItem href="/database" icon={Database} label="Memory" active={isActive("/database")} />
        <NavItem href="/settings" icon={Settings} label="Config" active={isActive("/settings")} />
      </nav>

      <div className="mt-auto flex flex-col gap-4 w-full px-3">
        <div className="w-10 h-10 rounded-xl bg-[#111] border border-[#222] flex items-center justify-center text-[#444] hover:text-white hover:border-white/20 transition-all cursor-not-allowed" title="Terminal (Coming Soon)">
          <Terminal size={18} />
        </div>
      </div>
    </aside>
  );
}

function NavItem({ href, icon: Icon, label, active }: any) {
  return (
    <Link 
      href={href}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative group ${
        active 
          ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
          : "text-[#666] hover:bg-[#111] hover:text-white"
      }`}
    >
      <Icon size={20} strokeWidth={active ? 3 : 2} />
      
      {/* Tooltip */}
      <div className="absolute left-14 bg-black border border-[#222] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap uppercase tracking-widest z-50">
        {label}
        {/* Triangle */}
        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black border-l border-b border-[#222] rotate-45"></div>
      </div>
    </Link>
  );
}
