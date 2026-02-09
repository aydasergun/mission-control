import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Security: Allowlist of commands or loose mode?
// For Mission Control, we want power, but let's be careful.
// We'll allow arbitrary commands but log them heavily.
// In a real prod env, this should be guarded by auth.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { command } = body;

    if (!command || typeof command !== "string") {
      return NextResponse.json({ error: "Command required" }, { status: 400 });
    }

    // Basic safeguards
    if (command.includes("rm -rf /") || command.includes(":(){ :|:& };:")) {
      return NextResponse.json({ error: "Command blocked by safety protocols." }, { status: 403 });
    }

    // Execute
    // Timeout 10s to prevent hanging
    const { stdout, stderr } = await execAsync(command, { timeout: 10000, cwd: "/home/ayda/.openclaw/workspace" });

    return NextResponse.json({ 
      output: stdout || stderr || "Command executed successfully (no output).",
      status: "success" 
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message, 
      output: error.stdout || error.stderr, // Return partial output if any
      status: "error" 
    }, { status: 500 });
  }
}
