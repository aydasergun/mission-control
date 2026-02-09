import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE_DIR = "/home/ayda/.openclaw/workspace";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filePath, content } = body;

    if (!filePath || content === undefined) {
      return NextResponse.json({ error: "Path and content required" }, { status: 400 });
    }

    // Security check
    if (filePath.includes("..")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    const fullPath = path.join(WORKSPACE_DIR, filePath);

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content, "utf-8");

    return NextResponse.json({ success: true, path: filePath });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
