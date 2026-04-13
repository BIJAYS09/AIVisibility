import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/claude";
import { parseJSON } from "@/lib/json";

export async function POST(req: NextRequest) {
  const { brand, prompts } = await req.json();
  if (!prompts?.length) return NextResponse.json({ suggestions: [] });

  const list = prompts
    .map((p: any, i: number) => `${i + 1}. [${p.topicName}] "${p.promptText}"`)
    .join("\n");

  const system = `You are an AI visibility strategist. Give specific, actionable advice to help a brand
appear in AI assistant responses to queries where they're currently invisible.
Respond ONLY with a valid JSON array. No markdown, no backticks.`;

  const user = `Brand: ${brand}

The following queries were sent to AI models and "${brand}" was NOT mentioned.
For each, provide a specific content/positioning recommendation.

${list}

Return:
[
  { "prompt": "copy query verbatim", "category": "topic name", "advice": "2-3 sentence specific recommendation" }
]`;

  try {
    const text = await callClaude(system, user, 1500);
    const suggestions = parseJSON(text, []);
    return NextResponse.json({ suggestions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
