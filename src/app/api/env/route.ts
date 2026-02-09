import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env");

const REQUIRED_KEYS = [
  { key: "GOOGLE_CLOUD_API_KEY", value: "" },
  { key: "OPENROUTER_API_KEY", value: "" }
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
    const vars = await req.json();
    
    const content = vars
      .filter((v: any) => v.key && v.key.trim().length > 0)
      .map((v: any) => `${v.key.trim()}=${v.value}`)
      .join("\n");
      
    fs.writeFileSync(envPath, content + "\n");
    
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
