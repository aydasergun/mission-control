import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

// Global .env path - shared between OpenClaw and Mission Control
const envPath = path.join(os.homedir(), ".openclaw", ".env");

const REQUIRED_KEYS = [
  { key: "BRAVE_API_KEY", value: "" },
  { key: "GITHUB_TOKEN", value: "" },
  { key: "GOOGLE_CLOUD_API_KEY", value: "" },
  { key: "OPENROUTER_API_KEY", value: "" },
  { key: "NOTION_API_KEY", value: "" },
  { key: "GOG_KEYRING_PASSWORD", value: "" }
];

export async function GET() {
  try {
    let vars: { key: string; value: string }[] = [];
    
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      vars = content.split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith("#") && line.includes("="))
        .map(line => {
          const index = line.indexOf("=");
          const key = line.substring(0, index).trim();
          const value = line.substring(index + 1).trim();
          return { key, value };
        });
    }
    
    // Ensure required keys are present
    REQUIRED_KEYS.forEach(req => {
      if (!vars.find(v => v.key === req.key)) {
        vars.push({ ...req });
      }
    });
      
    return NextResponse.json(vars);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const newVars = await req.json();

    // Read existing file content
    let existingContent = "";
    if (fs.existsSync(envPath)) {
      existingContent = fs.readFileSync(envPath, "utf-8");
    }

    // Parse existing vars and preserve structure
    const existingLines = existingContent.split("\n");
    const existingVars: Record<string, { value: string; lineIndex: number }> = {};

    existingLines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.length > 0 && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const eqIndex = trimmed.indexOf("=");
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim();
        existingVars[key] = { value, lineIndex: index };
      }
    });

    // Update or add vars from request
    const updatedVars = newVars.filter((v: any) => v.key && v.key.trim().length > 0);
    const keysToKeep = new Set(updatedVars.map((v: any) => v.key.trim()));

    // Update existing lines
    updatedVars.forEach((v: any) => {
      const key = v.key.trim();
      const value = v.value || "";

      if (existingVars[key]) {
        // Update existing var
        existingLines[existingVars[key].lineIndex] = `${key}=${value}`;
      } else {
        // Add new var at the end (before any trailing empty lines)
        const lastNonEmptyIndex = existingLines.reduce((last: number, line: string, idx: number) => {
          return line.trim().length > 0 ? idx : last;
        }, -1);

        if (lastNonEmptyIndex >= 0) {
          existingLines.splice(lastNonEmptyIndex + 1, 0, `${key}=${value}`);
        } else {
          existingLines.push(`${key}=${value}`);
        }
      }
    });

    // Remove deleted vars (comment them out for safety)
    Object.keys(existingVars).forEach(key => {
      if (!keysToKeep.has(key)) {
        // Comment out deleted variable instead of removing
        const lineIndex = existingVars[key].lineIndex;
        existingLines[lineIndex] = `# DELETED: ${existingLines[lineIndex]}`;
      }
    });

    // Write back with comments preserved
    fs.writeFileSync(envPath, existingLines.join("\n") + "\n");

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
