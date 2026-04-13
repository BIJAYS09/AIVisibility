import { NextRequest, NextResponse } from "next/server";
import { callClaude, parseJSON } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const { pages, brandName, url } = await req.json();

  const combinedText = pages
    .map((p: any) => `[${p.title}]\n${p.content}`)
    .join("\n\n---\n\n")
    .slice(0, 8000);

  const system = `You are a brand analyst. Extract a structured brand profile from website content.
Respond ONLY with a valid JSON object. No markdown, no explanation.`;

  const user = `Brand name: ${brandName}
Website: ${url}

Website content:
${combinedText}

Return this exact JSON structure:
{
  "description": "2-sentence brand description explaining what the brand does and who it's for",
  "industry": "industry name (e.g. SaaS, E-commerce, Healthcare, Fintech)",
  "identity": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "products": ["product/service 1", "product/service 2", "product/service 3", "product/service 4"],
  "competitors": ["competitor 1", "competitor 2", "competitor 3", "competitor 4", "competitor 5"]
}

Rules:
- identity: 4-6 short brand identity adjectives/keywords (e.g. "Innovative", "Enterprise-grade", "Open-source")
- products: actual products or service categories offered
- competitors: well-known direct competitors in the same space
- Keep all values concise`;

  try {
    const text = await callClaude(system, user, 800);
    const profile = parseJSON(text, null);
    if (!profile) throw new Error("Failed to parse profile");
    return NextResponse.json(profile);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
