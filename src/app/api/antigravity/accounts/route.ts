import { NextResponse } from "next/server";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const AUTH_PATH = "/home/ayda/.openclaw/agents/main/agent/auth-profiles.json";
const CACHE_PATH = "/home/ayda/.openclaw/workspace/mission-control/quota_cache.json";

function readCache() {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
    }
  } catch (e) {
    console.error("Cache read error", e);
  }
  return {};
}

function writeCache(cache: any) {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  } catch (e) {
    console.error("Cache write error", e);
  }
}

export async function GET() {
  try {
    if (!fs.existsSync(AUTH_PATH)) {
      return NextResponse.json({ error: "Auth profiles not found" }, { status: 404 });
    }

    const fileContent = fs.readFileSync(AUTH_PATH, "utf-8");
    const data = JSON.parse(fileContent);
    const profiles = data.profiles;
    const lastGood = data.lastGood?.["google-antigravity"] || "";
    const usageStats = data.usageStats || {};
    
    const cache = readCache();

    // Get LIVE usage for the active account with a strict timeout
    let liveUsage: any[] = [];
    try {
      // Run the CLI command with a 5-second timeout to avoid hanging the API
      const { stdout } = await execAsync("openclaw status --usage --json", { timeout: 5000 });
      const usageData = JSON.parse(stdout);
      liveUsage = usageData.usage?.providers?.find((p: any) => p.provider === "google-antigravity")?.windows || [];
    } catch (e) {
      console.warn("CLI usage fetch failed or timed out, falling back to cache/auth-profiles", e);
    }

    const accounts = Object.entries(profiles)
      .filter(([_, profile]: any) => profile.provider === "google-antigravity")
      .map(([pid, profile]: any) => {
        const stats = usageStats[pid] || {};
        const isCurrent = pid === lastGood;
        
        const isInCooldown = stats.cooldownUntil && stats.cooldownUntil > Date.now();
        const cooldownRemaining = isInCooldown ? Math.ceil((stats.cooldownUntil - Date.now()) / 60000) : 0;

        const getModelPercent = (idPattern: string, email: string) => {
          if (isCurrent && liveUsage.length > 0) {
            const found = liveUsage.find((w: any) => w.label.toLowerCase().includes(idPattern));
            if (found) {
              const val = 100 - found.usedPercent;
              // Update cache
              if (!cache[email]) cache[email] = {};
              cache[email][idPattern] = { percent: val, ts: Date.now() };
              return val;
            }
          }
          // Fallback to cache for passive or failed-live-fetch accounts
          return cache[email]?.[idPattern]?.percent ?? 100;
        };

        const getModelReset = (idPattern: string, email: string) => {
          if (isCurrent && liveUsage.length > 0) {
            const found = liveUsage.find((w: any) => w.label.toLowerCase().includes(idPattern));
            if (!found) return "Tükendi";
            if (!found.resetAt) return "Hazır";
            const diff = found.resetAt - Date.now();
            if (diff < 0) return "Hazır";
            const hours = Math.floor(diff / 3600000);
            if (hours > 24) return `${Math.floor(hours/24)}g ${hours%24}s`;
            return `${hours}s ${Math.floor((diff % 3600000) / 60000)}dk`;
          }
          return "Yedek";
        };

        return {
          id: pid,
          email: profile.email,
          isCurrent,
          isInCooldown,
          cooldownMins: cooldownRemaining,
          lastUsed: stats.lastUsed ? new Date(stats.lastUsed).toLocaleString('tr-TR') : 'Kullanılmadı',
          quotas: [
            { model: "G3 Pro", percent: getModelPercent("pro", profile.email), reset: getModelReset("pro", profile.email) },
            { model: "G3 Flash", percent: getModelPercent("flash", profile.email), reset: getModelReset("flash", profile.email) },
            { model: "G3 Image", percent: getModelPercent("image", profile.email), reset: getModelReset("image", profile.email) },
            { model: "Claude 4.5", percent: getModelPercent("claude", profile.email), reset: getModelReset("claude", profile.email) },
          ]
        };
      });

    writeCache(cache);
    return NextResponse.json(accounts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
