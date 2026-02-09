import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);
const OPENCLAW_BIN = "/home/ayda/.npm-global/bin/openclaw";
const CONFIG_PATH = "/home/ayda/.openclaw/openclaw.json";
const AGENT_ID = "main"; // Or derive from config if needed

// Fallback models in case everything else fails
const FALLBACK_MODELS = [
    { id: "ollama/kimi-k2.5:cloud", name: "Kimi k2.5", provider: "ollama" },
    { id: "google-antigravity/gemini-3-pro-high", name: "Gemini 3 Pro", provider: "google-antigravity" },
    { id: "google-antigravity/gemini-3-flash", name: "Gemini 3 Flash", provider: "google-antigravity" },
    { id: "google-antigravity/claude-opus-4-5-thinking", name: "Claude Opus 4.5", provider: "google-antigravity" }
];

export async function GET() {
  let currentModel = "Unknown";
  let availableModels: any[] = [];

  try {
    // 1. Get Static Config (Default)
    if (fs.existsSync(CONFIG_PATH)) {
        try {
            const configContent = fs.readFileSync(CONFIG_PATH, "utf-8");
            const config = JSON.parse(configContent);
            
            if (config.agents?.defaults?.model?.primary) {
                currentModel = config.agents.defaults.model.primary;
            }

            const providers = config.models?.providers || {};
            Object.entries(providers).forEach(([providerName, providerData]: any) => {
                if (providerData.models) {
                    providerData.models.forEach((m: any) => {
                        let id = m.id;
                        if (!id.includes("/")) id = `${providerName}/${m.id}`;
                        availableModels.push({
                            id: id,
                            name: m.name || m.id,
                            provider: providerName,
                            shortId: m.id
                        });
                    });
                }
            });
            
            const fallbacks = config.agents?.defaults?.model?.fallbacks || [];
            fallbacks.forEach((fb: string) => {
                if (!availableModels.find(m => m.id === fb)) {
                    const [prov, mod] = fb.split('/');
                    availableModels.push({ 
                        id: fb, 
                        name: mod || fb, 
                        provider: prov || "unknown",
                        shortId: mod
                    });
                }
            });
        } catch (e) {
            console.error("Config read error:", e);
        }
    }

    // 2. Get LIVE Runtime Model via 'openclaw session status'
    try {
        const { stdout } = await execAsync(`${OPENCLAW_BIN} session status --json`, { timeout: 3000 });
        const sessionData = JSON.parse(stdout);
        if (sessionData.model) {
            currentModel = sessionData.model;
        }
    } catch (e) {
        console.warn("CLI session status check failed:", e);
    }

    if (availableModels.length === 0) {
        availableModels = FALLBACK_MODELS;
    }
    
    if (currentModel === "Unknown" && availableModels.length > 0) {
        currentModel = availableModels[0].id;
    }

    return NextResponse.json({ currentModel, availableModels });
  } catch (error: any) {
    return NextResponse.json({ 
        currentModel: FALLBACK_MODELS[0].id, 
        availableModels: FALLBACK_MODELS 
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { modelId } = body;
    if (!modelId) return NextResponse.json({ error: "Model ID required" }, { status: 400 });

    // STRATEGY: Update Config AND Session Override AND Trigger Reload
    
    // 1. Update Config (Persistent)
    // We update the agent specific model, not just defaults, to be sure.
    // openclaw config set agents.defaults.model.primary <model>
    await execAsync(`${OPENCLAW_BIN} config set agents.defaults.model.primary "${modelId}"`);

    // 2. Apply Config (Triggers Gateway Restart/Reload)
    // 'config apply' validates and writes, then restarts the gateway if needed.
    // This is more robust than just 'config set'.
    try {
        await execAsync(`${OPENCLAW_BIN} gateway apply`); 
    } catch (e) {
        // Apply might fail if gateway is busy, but config set already wrote to file.
        // Let's try explicit restart as fallback if apply fails/isn't available
        try {
            await execAsync(`${OPENCLAW_BIN} gateway restart`);
        } catch (restartErr) {
             console.error("Gateway restart failed", restartErr);
        }
    }

    return NextResponse.json({ success: true, modelId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
