import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Bot, User, Smartphone, MessageCircle, Hash, Clock, Globe, Zap } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MessageCardProps {
  content: string;
  metadata?: {
    platform: string;
    timestamp: string;
    message_id: string | number;
    sender?: 'user' | 'assistant';
  };
}

export default function MessageCard({ content, metadata }: MessageCardProps) {
  const isAssistant = React.useMemo(() => {
    if (metadata?.sender === 'assistant') return true;
    if (content.includes('[[reply_to_current]]') || content.includes('Patron')) return true;
    return false;
  }, [metadata, content]);

  // 1. MEDYA ANALİZİ VE AYIKLAMA
  const mediaInfo = React.useMemo(() => {
    if (content.includes('[Audio]') || content.includes('<media:audio>')) {
      const match = content.match(/Transcript:\s*([\s\S]*)/);
      let transcript = match ? match[1] : content;
      transcript = transcript.replace(/^"|"$/g, ''); 
      return { type: 'audio', text: transcript };
    }
    
    if (content.includes('media attached:') || content.includes('[media attached:')) {
      let text = content;
      text = text.replace(/\[?media attached:[\s\S]*?\]/gi, '');
      text = text.replace(/To send an image back[\s\S]*?text body\./gi, '');
      return { type: 'image', text: text };
    }

    return { type: 'text', text: content };
  }, [content]);

  // 2. GENEL TEMİZLİK (Regex)
  const finalContent = React.useMemo(() => {
    let text = mediaInfo.text;
    text = text.replace(/^\{[\s\S]*?"timestamp"[\s\S]*?"message_id"[\s\S]*?\}\s*/, '');
    text = text.replace(/\[?media attached:[\s\S]*?\]/gi, '');
    text = text.replace(/To send an image back[\s\S]*?text body\./gi, '');
    text = text.replace(/\[(?:Telegram|Fri|Thu|Sat|Sun|Mon|Tue|Wed)\s.*?GMT[+-]\d+\]/gi, '');
    text = text.replace(/\[message_id:\s*[^\]]+\]/gi, '');
    text = text.replace(/\x1B\[[0-9;]*m|\[[0-9;]*m/g, '');
    
    // Reply Tags Temizliği (YENİ)
    text = text.replace(/\[\[.*?\]\]/g, '');

    const lines = text.split('\n');
    const filteredLines = lines.filter(line => {
      const t = line.trim();
      return !t.startsWith('System:') && 
             !t.startsWith('Exec failed') && 
             !t.startsWith('Exec completed') &&
             !t.includes('<media:audio>');
    });
    const result = filteredLines.join('\n').trim();
    return result || content; // Safety fallback
  }, [mediaInfo]);
  
  // Timestamp
  let date: Date;
  try {
    date = new Date(metadata?.timestamp || Date.now());
    if (isNaN(date.getTime())) date = new Date();
  } catch (e) {
    date = new Date();
  }
  const time = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });

  const getPlatformIcon = (platform?: string) => {
    switch (platform?.toLowerCase()) {
      case 'telegram': return <Zap className="w-3 h-3" />;
      case 'whatsapp': return <MessageCircle className="w-3 h-3" />;
      case 'discord': return <Globe className="w-3 h-3" />;
      case 'signal': return <Smartphone className="w-3 h-3" />;
      default: return <MessageCircle className="w-3 h-3" />;
    }
  };

  return (
    <div className={cn("flex w-full mb-8 group/row", isAssistant ? "justify-start" : "justify-end")}>
      <div className={cn("relative max-w-[90%] md:max-w-[80%] lg:max-w-[70%] flex flex-col", isAssistant ? "items-start" : "items-end")}>
        <div className={cn("flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase mb-1.5 px-1 opacity-40 transition-opacity group-hover/row:opacity-100", isAssistant ? "flex-row text-indigo-400" : "flex-row-reverse text-zinc-400")}>
          {isAssistant ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
          <span>{isAssistant ? "Ayda" : "Patron"}</span>
        </div>

        <div className={cn("relative p-5 shadow-sm overflow-hidden backdrop-blur-sm transition-all duration-300 border", 
          isAssistant 
            ? "bg-gradient-to-br from-indigo-600 to-violet-700 border-indigo-500/20 text-white rounded-2xl rounded-tl-none shadow-indigo-500/10" 
            : "bg-zinc-900/80 border-zinc-800 text-zinc-100 rounded-2xl rounded-tr-none hover:bg-zinc-900"
        )}>
          <div className="relative z-10">
            
            {/* AUDIO BADGE */}
            {mediaInfo.type === 'audio' && (
              <div className="group/audio inline-flex items-center gap-3 px-4 py-2.5 mb-4 bg-black/40 backdrop-blur-md rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all duration-300 cursor-pointer w-full max-w-xs overflow-hidden">
                <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-lg shadow-lg flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
                  <div className="absolute inset-0 rounded-lg bg-cyan-400/30 animate-ping"></div>
                </div>
                <div className="flex items-end gap-0.5 h-6 flex-1 justify-center opacity-80">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-1 bg-cyan-400 rounded-full animate-[wave_1s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.1}s`, height: `${Math.random() * 10 + 10}px` }}></div>
                  ))}
                </div>
                <div className="flex flex-col flex-shrink-0 text-right">
                  <span className="text-[10px] font-bold text-cyan-300 tracking-wider uppercase">Voice</span>
                  <span className="text-[9px] text-white/60">Transcribed</span>
                </div>
              </div>
            )}

            {/* IMAGE BADGE */}
            {mediaInfo.type === 'image' && (
               <div className="group/image inline-flex items-center gap-3 px-4 py-3 mb-4 bg-black/40 backdrop-blur-xl rounded-xl border border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:border-violet-400/60 transition-all duration-300 cursor-pointer w-full max-w-xs relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden"><div className="w-full h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-[scan_3s_linear_infinite]"></div></div>
                  <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-violet-900/80 to-indigo-900/80 rounded-lg border border-violet-500/40">
                    <svg className="w-6 h-6 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-violet-200 tracking-wide">Image Data</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></div>
                    </div>
                    <span className="text-[10px] text-white/50 font-mono mt-0.5">Attachment Processed</span>
                  </div>
               </div>
            )}

            <p className={cn("text-[15px] leading-7 whitespace-pre-wrap break-words font-normal", isAssistant ? "text-indigo-50" : "text-zinc-200")}>
              {finalContent}
            </p>
          </div>

          {metadata && (
             <div className={cn("mt-4 pt-3 flex items-center gap-3 text-[10px] font-medium uppercase tracking-wider border-t relative z-10", isAssistant ? "border-white/10 text-indigo-200/60" : "border-zinc-800/80 text-zinc-500")}>
                <div className="flex items-center gap-1.5">{getPlatformIcon(metadata.platform)}<span className="font-semibold">{metadata.platform}</span></div>
                <div className="flex items-center gap-2 ml-auto">
                   <div className="flex items-center gap-1"><Clock className="w-3 h-3" /><span>{time}</span></div>
                   <span className="opacity-20">|</span>
                   <div className="flex items-center gap-1"><Hash className="w-3 h-3" /><span className="font-mono">{metadata.message_id}</span></div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
