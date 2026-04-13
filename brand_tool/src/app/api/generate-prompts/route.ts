import { NextRequest, NextResponse } from "next/server";
import { callGroq, parseJSON } from "@/lib/groq";

export async function POST(req: NextRequest) {
  const { profile, topics } = await req.json();

  const selected = topics.filter((t: any) => t.selected);

  const system = `You generate realistic search queries for brand visibility research.
Respond ONLY with a valid JSON array. No markdown, no explanation.`;

  const allPrompts: any[] = [];

  // Generate prompts for each topic (batch to save API calls)
  const topicList = selected.map((t: any) => `- ${t.name} (id: ${t.id})`).join("\n");

  const user = `Brand: ${profile.name}
Description: ${profile.description}
Industry: ${profile.industry}
Products: ${profile.products?.join(", ")}

Topics:
${topicList}

For EACH topic, generate exactly 8 realistic search queries that a potential buyer might ask an AI assistant.
Queries should vary in:
- Buyer sophistication (casual "help me find" → technical evaluation queries)
- Intent (discovery, comparison, feature research, pricing, alternatives)
- Specificity (broad category → specific use case)

Return this exact JSON array (one entry per prompt):
{
  "topic_categories": [
    { "topicId": "topic-0", "topicName": "Topic name", "text": "The full search query" },
    ...
  ]
}

Generate all prompts for all topics in one array.`;

  try {
    const text = await callGroq(system, user, 3000);
    const raw = parseJSON<{ topic_categories: { topicId: string; topicName: string; text: string }[] }>(text, { topic_categories: [] });
    console.log("Raw prompts from Groq:", raw);
    const prompts = (raw.topic_categories ?? []).map((p: { topicId: any; topicName: any; text: any; }, i: any) => ({
      id: `prompt-${i}`,
      topicId: p.topicId,
      topicName: p.topicName,
      text: p.text,
      selected: true,
    }));
    return NextResponse.json({ prompts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}