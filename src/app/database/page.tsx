"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { MonitoringPanel } from "@/components/monitoring-panel";
import { connectToGateway, LogEntry } from "@/lib/gateway";
import { FileText, Database, Activity, X, Save, Edit3, Check } from "lucide-react";

export default function DatabasePage() {
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [vpsStats, setVpsStats] = useState({ cpu: "0%", ram: "0 GB" });
  const [gatewayStatus, setGatewayStatus] = useState("OFFLINE");
  const [isMonitoringOpen, setIsMonitoringOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchFiles();
    const connection = connectToGateway(
      (newLog) => setLogs(prev => [newLog, ...prev].slice(0, 15)),
      (status) => setGatewayStatus(status)
    );
    return () => { if (connection && connection.disconnect) connection.disconnect(); };
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/database/list");
      const data = await res.json();
      setFiles(data.files || []);
    } catch (e) { console.error(e); }
  };

  const loadFile = async (path: string) => {
    setLoading(true);
    setSelectedFile(path);
    setIsEditing(false); // Reset edit mode on file switch
    try {
      const res = await fetch(`/api/database/content?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      setFileContent(data.content);
    } catch (e) {
      setFileContent("Error loading file.");
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/database/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: selectedFile, content: fileContent })
      });
      if (res.ok) {
        setIsEditing(false);
        // Maybe show a toast
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex h-screen w-full overflow-hidden bg-[#0a0a0a] relative">
      <div className={`fixed inset-0 z-[100] lg:relative lg:z-0 lg:block ${isSidebarOpen ? 'block' : 'hidden'}`}>
        <div className="absolute inset-0 bg-black/80 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative h-full w-[80px] bg-[#050505] border-r border-[#1a1a1a]">
          <Sidebar />
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden absolute top-4 -right-12 p-2 bg-white/5 rounded-full text-white"><X size={20} /></button>
        </div>
      </div>

      <section className="flex-1 flex flex-col relative bg-[#0a0a0a] min-w-0">
        <Header status={gatewayStatus} onMenuClick={() => setIsSidebarOpen(true)} />

        <div className="lg:hidden fixed bottom-6 right-6 z-[80]">
          <button onClick={() => setIsMonitoringOpen(true)} className="p-4 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] text-white"><Activity size={20} /></button>
        </div>

        <div className="flex-1 overflow-hidden p-4 md:p-8 flex flex-col md:flex-row gap-6">
          {/* LEFT: File List */}
          <div className={`w-full md:w-1/3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl flex flex-col overflow-hidden ${selectedFile ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-[#1a1a1a] flex items-center gap-2">
              <Database size={16} className="text-blue-500" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Memory Bank</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {files.map(file => (
                <button
                  key={file.path}
                  onClick={() => loadFile(file.path)}
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between group transition-all ${selectedFile === file.path ? 'bg-blue-600 text-white' : 'hover:bg-[#151515] text-gray-400'}`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText size={16} className={selectedFile === file.path ? 'text-white' : 'text-gray-600 group-hover:text-gray-400'} />
                    <span className="text-xs font-bold truncate">{file.name}</span>
                  </div>
                  <span className="text-[9px] opacity-50 font-mono hidden xl:block">{new Date(file.updated).toLocaleDateString()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: Editor */}
          <div className={`w-full md:w-2/3 bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl flex flex-col overflow-hidden ${selectedFile ? 'flex' : 'hidden md:flex'}`}>
            {selectedFile ? (
              <>
                <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between bg-[#111]">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedFile(null)} className="md:hidden p-1.5 hover:bg-white/10 rounded-lg text-gray-400"><X size={16} /></button>
                    <span className="text-xs font-bold text-white font-mono">{selectedFile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors">CANCEL</button>
                        <button 
                          onClick={saveFile} 
                          disabled={isSaving}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center gap-2 shadow-lg"
                        >
                          {isSaving ? <Activity size={12} className="animate-spin" /> : <Save size={12} />}
                          SAVE
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 transition-colors flex items-center gap-2"
                      >
                        <Edit3 size={12} /> EDIT
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-hidden relative bg-[#080808]">
                  {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center text-blue-500 animate-pulse text-xs font-black tracking-widest">DECRYPTING MEMORY...</div>
                  ) : (
                    <textarea
                      value={fileContent}
                      onChange={(e) => setFileContent(e.target.value)}
                      readOnly={!isEditing}
                      className={`w-full h-full p-6 bg-transparent border-none outline-none font-mono text-xs md:text-sm leading-relaxed resize-none ${isEditing ? 'text-white' : 'text-gray-400'}`}
                      spellCheck={false}
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-4">
                <Database size={48} className="opacity-20" />
                <span className="text-xs font-black uppercase tracking-widest opacity-50">Select a memory file to inspect</span>
              </div>
            )}
          </div>
        </div>
      </section>

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
