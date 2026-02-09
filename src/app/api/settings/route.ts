import { NextResponse } from "next/server";
import fs from "fs";

const CONFIG_PATH = "/home/ayda/.openclaw/openclaw.json";

export async function GET() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }
    const content = fs.readFileSync(CONFIG_PATH, "utf-8");
    const config = JSON.parse(content);
    
    // Extract safe public info
    const settings = {
      model: config.agents?.defaults?.model?.primary || "Unknown",
      gatewayPort: config.gateway?.port || 18789,
      telegramEnabled: config.channels?.telegram?.enabled || false,
      browserEnabled: config.browser?.enabled || false,
      version: config.meta?.lastTouchedVersion || "2026.2.1"
    };

    return NextResponse.json({ settings, raw: content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
