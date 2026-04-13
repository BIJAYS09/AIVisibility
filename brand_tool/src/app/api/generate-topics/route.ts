import { NextRequest, NextResponse } from "next/server";
import { callGroq, parseJSON } from "@/lib/groq";

export async function POST(req: NextRequest) {
  const { profile } = await req.json();

  const system = `You generate search topic categories for brand visibility research.
Respond ONLY with a valid JSON array. No markdown, no explanation.`;

  const user = `Brand: ${profile.name}
Description: ${profile.description}
Industry: ${profile.industry}
Products/Services: ${profile.products?.join(", ")}
Identity: ${profile.identity?.join(", ")}

Generate 8-10 topic categories that potential customers would search for when looking for products/services like this brand's.
Each topic should represent a distinct buyer intent or use case.

Return this exact JSON array:
{
  "topics": [
    { "name": "Topic category name" },
    ...
  ]
}

Rules:
- Topics should be 3-6 words
- Cover different aspects: features, use cases, buyer types, comparisons, problems solved
- Make them specific to this brand's space, not generic
- A buyer searching these topics might discover or compare this brand`;

  try {
    const text = await callGroq(system, user, 600);
    console.log("Raw topics from Groq:", text);
    const raw = parseJSON<{ topics: { name: string }[] }>(text, { topics: [] });
    console.log("Raw topics after parsing:", raw);
    const topics = (raw.topics ?? []).map((t: { name: any; }, i: any) => ({
      id: `topic-${i}`,
      name: t.name,
      selected: true,
    }));
    return NextResponse.json({ topics });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
