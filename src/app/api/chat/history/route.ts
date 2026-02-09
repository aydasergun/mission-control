import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import readline from "readline";

const SESSIONS_DIR = "/home/ayda/.openclaw/agents/main/sessions";

// Helper to parse a single line of JSONL
function parseLine(line: string) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "100", 10); // Default limit increased

  try {
    if (!fs.existsSync(SESSIONS_DIR)) {
       return NextResponse.json({ messages: [] });
    }

    // 1. Find the latest N session files (handle restarts/rotation)
    const files = fs.readdirSync(SESSIONS_DIR)
      .filter(f => f.endsWith(".jsonl"))
      .map(f => ({
        name: f,
        mtime: fs.statSync(path.join(SESSIONS_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.mtime - a.mtime) // Newest first
      .slice(0, 5); // Read last 5 session files to ensure context continuity

    if (files.length === 0) {
      return NextResponse.json({ messages: [] });
    }

    let allMessages: any[] = [];
    const seenIds = new Set();

    // 2. Read files (in reverse order: oldest to newest for proper processing if needed, 
    // but here we just collect all and sort later)
    for (const file of files) {
      const filePath = path.join(SESSIONS_DIR, file.name);
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      for await (const line of rl) {
        const entry = parseLine(line);
        if (!entry) continue;

        if (entry.type === "message" && entry.message) {
          // Deduplicate by ID
          if (entry.id && seenIds.has(entry.id)) continue;
          if (entry.id) seenIds.add(entry.id);

          const role = entry.message.role; 
          if (role !== "user" && role !== "assistant") continue;

          let content = "";
          if (Array.isArray(entry.message.content)) {
            content = entry.message.content
              .filter((c: any) => c.type === "text")
              .map((c: any) => c.text)
              .join("\n");
          } else if (typeof entry.message.content === "string") {
            content = entry.message.content;
          }

          if (content && content.trim()) {
             let source = "Terminal";
             let cleanContent = content;

             // Detect source
             if (content.includes("[Telegram")) {
               source = "Telegram";
             } else if (role === "assistant") {
               source = "Ayda";
             }

             allMessages.push({
               id: entry.id || `gen-${Math.random()}`, // Fallback ID
               role,
               content: cleanContent,
               timestamp: entry.timestamp || new Date().toISOString(),
               source,
               // Keep raw timestamp for sorting
               tsValue: new Date(entry.timestamp).getTime()
             });
          }
        }
      }
    }

    // 3. Sort by Timestamp (Oldest to Newest)
    allMessages.sort((a, b) => a.tsValue - b.tsValue);

    // 4. Return the last N messages
    const recentMessages = allMessages.slice(-limit);

    return NextResponse.json({ messages: recentMessages });

  } catch (error: any) {
    console.error("History Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
