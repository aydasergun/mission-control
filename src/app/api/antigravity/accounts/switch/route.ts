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

    // Set as lastGood for the provider
    if (!data.lastGood) data.lastGood = {};
    data.lastGood["google-antigravity"] = id;

    // Reset usage stats errors for this profile to give it a fresh start
    if (data.usageStats && data.usageStats[id]) {
      data.usageStats[id].errorCount = 0;
      delete data.usageStats[id].cooldownUntil;
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
