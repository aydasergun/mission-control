import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE_DIR = "/home/ayda/.openclaw/workspace";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("path");

  if (!filePath) {
    return NextResponse.json({ error: "Path required" }, { status: 400 });
  }

  // Security check: ensure path is within workspace/memory or is MEMORY.md
  // Simple check: don't allow ".." to escape
  if (filePath.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 403 });
  }

  const fullPath = path.join(WORKSPACE_DIR, filePath);

  try {
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const content = fs.readFileSync(fullPath, "utf-8");
    return NextResponse.json({ content });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
