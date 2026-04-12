import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { brand, prompts } = await req.json();

  if (!prompts?.length) {
    return NextResponse.json({ suggestions: [] });
  }

  const promptList = prompts
    .map((p: any, i: number) => `${i + 1}. [${p.category}] "${p.prompt_text}"`)
    .join("\n");

  const systemPrompt = `You are an AI visibility strategist. Your job is to analyse why a brand
is not being mentioned by AI assistants when answering certain queries, and give specific,
actionable advice on what content, positioning, or SEO changes would help the brand appear
in AI-generated responses to those queries.

Respond ONLY with a valid JSON array. Each element must have exactly these keys:
- "prompt": the original query (copy it verbatim)
- "category": the category
- "advice": 2-3 sentence specific recommendation for this exact query

Output only the JSON array. No markdown, no explanation, no backticks.`;

  const userMsg = `Brand: ${brand}

The following queries were sent to an AI assistant and ${brand} was NOT mentioned in any response.
For each query, explain what ${brand} should do to start appearing in answers like this.

Queries:
${promptList}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMsg }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text ?? "[]";

    let suggestions;
    try {
      suggestions = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      suggestions = [];
    }

    return NextResponse.json({ suggestions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
