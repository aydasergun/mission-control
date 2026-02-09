import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);
const OPENCLAW_BIN = "/home/ayda/.npm-global/bin/openclaw";
const CONFIG_PATH = "/home/ayda/.openclaw/openclaw.json";

export async function GET() {
  try {
    let totalTokens = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let cost = 0;

    // 1. Try CLI (Most accurate for live session accumulation)
    try {
        // Fetch session list to get accumulated tokens
        const sessionsRes = await execAsync(`${OPENCLAW_BIN} sessions list --json`, { timeout: 3000 });
        const sessionData = JSON.parse(sessionsRes.stdout);

        if (sessionData.sessions) {
            sessionData.sessions.forEach((s: any) => {
                totalTokens += s.totalTokens || 0;
            });
        }

        // Fetch Quota/Limit Status
        const usageRes = await execAsync(`${OPENCLAW_BIN} status --usage --json`, { timeout: 3000 });
        const usageData = JSON.parse(usageRes.stdout);
        let limits: any[] = [];
        
        if (usageData.usage && usageData.usage.providers) {
          usageData.usage.providers.forEach((p: any) => {
             if (p.windows) {
                p.windows.forEach((w: any) => {
                    limits.push({
                        model: w.label,
                        usedPercent: w.usedPercent || 0,
                        resetAt: w.resetAt || null
                    });
                });
             }
          });
        }

        return NextResponse.json({
          totalTokens,
          limits
        });

    } catch (e) {
        // console.error("CLI Usage fetch failed:", e);
    }

    return NextResponse.json({
      totalTokens,
      limits: []
    });

  } catch (error: any) {
    return NextResponse.json({ 
      totalTokens: 0, 
      inputTokens: 0, 
      outputTokens: 0, 
      cost: "0.0000",
      error: error.message 
    });
  }
}
