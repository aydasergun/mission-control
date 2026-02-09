import { NextResponse } from "next/server";
import fs from "fs";

export async function POST(request: Request) {
  try {
    const { id } = await request.json();
    const filePath = "/home/ayda/.openclaw/agents/main/agent/auth-profiles.json";
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContent);
    
    if (!data.profiles[id]) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Backup current account if it's the one being deleted
    if (data.lastGood?.["google-antigravity"] === id) {
      delete data.lastGood["google-antigravity"];
    }

    // Remove from profiles
    delete data.profiles[id];

    // Remove from usage stats
    if (data.usageStats) delete data.usageStats[id];

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
