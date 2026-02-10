import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

const envPath = path.join(os.homedir(), ".openclaw", ".env");
const NOTION_DATABASE_ID = "302fc37d7e8a81b0a0b7cff07b420787";

function getNotionApiKey(): string | null {
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    const lines = content.split("\n");
    for (const line of lines) {
      if (line.startsWith("NOTION_API_KEY=")) {
        return line.substring("NOTION_API_KEY=".length).trim();
      }
    }
  }
  return null;
}

export async function GET() {
  try {
    const notionKey = getNotionApiKey();
    if (!notionKey) {
      return NextResponse.json({ error: "NOTION_API_KEY not found" }, { status: 500 });
    }

    const response = await fetch(`https://api.notion.com/v1/data_sources/${NOTION_DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        page_size: 10,
        sorts: [{ timestamp: "created_time", direction: "descending" }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `Notion API error: ${response.status} - ${error}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const notionKey = getNotionApiKey();
    if (!notionKey) {
      return NextResponse.json({ error: "NOTION_API_KEY not found" }, { status: 500 });
    }

    const { task, problem, file, expected, verify, context, scope, constraints } = await req.json();

    // Build Notion page content
    const properties: any = {
      "Task": {
        title: [{ text: { content: task } }]
      }
    };

    const children: any[] = [];

    if (problem) {
      children.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: `PROBLEM: ${problem}` } }]
        }
      });
    }

    if (file) {
      children.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: `FILE: ${file}` } }]
        }
      });
    }

    if (expected) {
      children.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: `EXPECTED RESULT: ${expected}` } }]
        }
      });
    }

    if (verify) {
      children.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: `VERIFY: ${verify}` } }]
        }
      });
    }

    if (context) {
      children.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: `CONTEXT: ${context}` } }]
        }
      });
    }

    if (scope) {
      children.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: `SCOPE: ${scope}` } }]
        }
      });
    }

    if (constraints) {
      children.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: `CONSTRAINTS: ${constraints}` } }]
        }
      });
    }

    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties,
        children
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `Notion API error: ${response.status} - ${error}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ ok: true, page: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
