import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE_DIR = "/home/ayda/.openclaw/workspace";
const MEMORY_DIR = path.join(WORKSPACE_DIR, "memory");
const MAIN_MEMORY_FILE = path.join(WORKSPACE_DIR, "MEMORY.md");

export async function GET() {
  try {
    const files = [];

    // Add MEMORY.md if exists
    if (fs.existsSync(MAIN_MEMORY_FILE)) {
      const stat = fs.statSync(MAIN_MEMORY_FILE);
      files.push({
        name: "MEMORY.md",
        path: "MEMORY.md",
        size: stat.size,
        updated: stat.mtime
      });
    }

    // Add memory/ folder contents
    if (fs.existsSync(MEMORY_DIR)) {
      const memoryFiles = fs.readdirSync(MEMORY_DIR);
      memoryFiles.forEach(file => {
        if (file.endsWith(".md") || file.endsWith(".json")) {
          const filePath = path.join(MEMORY_DIR, file);
          const stat = fs.statSync(filePath);
          files.push({
            name: `memory/${file}`,
            path: `memory/${file}`,
            size: stat.size,
            updated: stat.mtime
          });
        }
      });
    }

    // Sort by updated date desc
    files.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());

    return NextResponse.json({ files });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
