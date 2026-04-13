import { NextRequest, NextResponse } from "next/server";
import { callClaude, parseJSON } from "@/lib/claude";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama3-70b-8192";

async function queryGroq(prompt: string): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not set");

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });

  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function analyzeResponse(
  promptText: string,
  aiResponse: string,
  brandName: string,
  competitors: string[]
): Promise<any> {
  const system = `You analyze AI responses for brand mentions. Respond ONLY with valid JSON.`;

  const user = `Brand to track: "${brandName}"
Competitors: ${competitors.join(", ")}

Prompt that was asked: "${promptText}"

AI response received:
"${aiResponse}"

Analyze this response and return:
{
  "brandMentioned": true/false,
  "brandMentionCount": number,
  "brandPositionRank": null or number (1=first brand mentioned),
  "brandSentiment": number between -1 and 1,
  "brandSentimentLabel": "positive" | "neutral" | "negative",
  "competitorMentions": [
    { "name": "competitor name", "positionRank": number, "sentiment": number }
  ]
}

Rules:
- positionRank counts from 1. If brand is 3rd brand mentioned, rank=3
- sentiment: >0.05 positive, <-0.05 negative, else neutral
- Only include competitors actually mentioned in the response`;

  const text = await callClaude(system, user, 400);
  return parseJSON(text, {
    brandMentioned: false,
    brandMentionCount: 0,
    brandPositionRank: null,
    brandSentiment: 0,
    brandSentimentLabel: "neutral",
    competitorMentions: [],
  });
}

export async function POST(req: NextRequest) {
  const { profile, prompts } = await req.json();

  const selected = prompts.filter((p: any) => p.selected).slice(0, 30); // cap at 30 to avoid long waits
  const results: any[] = [];
  const competitorMap: Record<string, { mentions: number; positions: number[]; sentiments: number[] }> = {};

  for (const prompt of selected) {
    try {
      // 1. Get AI response
      const aiResponse = await queryGroq(prompt.text);

      // 2. Analyze it with Claude
      const analysis = await analyzeResponse(
        prompt.text,
        aiResponse,
        profile.name,
        profile.competitors ?? []
      );

      results.push({
        promptId: prompt.id,
        promptText: prompt.text,
        topicName: prompt.topicName,
        aiResponse,
        mentioned: analysis.brandMentioned,
        mentionCount: analysis.brandMentionCount,
        positionRank: analysis.brandPositionRank,
        sentiment: analysis.brandSentiment,
        sentimentLabel: analysis.brandSentimentLabel,
        competitors: analysis.competitorMentions,
      });

      // Accumulate competitor stats
      for (const c of analysis.competitorMentions ?? []) {
        if (!competitorMap[c.name]) {
          competitorMap[c.name] = { mentions: 0, positions: [], sentiments: [] };
        }
        competitorMap[c.name].mentions++;
        if (c.positionRank) competitorMap[c.name].positions.push(c.positionRank);
        if (c.sentiment != null) competitorMap[c.name].sentiments.push(c.sentiment);
      }
    } catch (e) {
      // Skip failed prompts gracefully
      results.push({
        promptId: prompt.id,
        promptText: prompt.text,
        topicName: prompt.topicName,
        aiResponse: "",
        mentioned: false,
        mentionCount: 0,
        positionRank: null,
        sentiment: 0,
        sentimentLabel: "neutral",
        competitors: [],
      });
    }
  }

  const total = results.length;
  const mentioned = results.filter(r => r.mentioned).length;

  // Build brand stats: own brand first
  const ownSentiments = results.filter(r => r.mentioned).map(r => r.sentiment);
  const ownPositions  = results.filter(r => r.positionRank != null).map(r => r.positionRank as number);

  const brandStats: any[] = [
    {
      brand: profile.name,
      isOwn: true,
      visibility: total ? Math.round((mentioned / total) * 100) : 0,
      avgPosition: ownPositions.length
        ? parseFloat((ownPositions.reduce((a, b) => a + b, 0) / ownPositions.length).toFixed(1))
        : 0,
      avgSentiment: ownSentiments.length
        ? parseFloat((ownSentiments.reduce((a, b) => a + b, 0) / ownSentiments.length).toFixed(3))
        : 0,
      sentimentLabel: ownSentiments.length
        ? (ownSentiments.reduce((a, b) => a + b, 0) / ownSentiments.length > 0.05
            ? "positive" : ownSentiments.reduce((a, b) => a + b, 0) / ownSentiments.length < -0.05
            ? "negative" : "neutral")
        : "neutral",
      mentionCount: results.reduce((s, r) => s + r.mentionCount, 0),
    },
    // Competitors
    ...Object.entries(competitorMap)
      .map(([name, data]) => ({
        brand: name,
        isOwn: false,
        visibility: Math.round((data.mentions / total) * 100),
        avgPosition: data.positions.length
          ? parseFloat((data.positions.reduce((a, b) => a + b, 0) / data.positions.length).toFixed(1))
          : 0,
        avgSentiment: data.sentiments.length
          ? parseFloat((data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length).toFixed(3))
          : 0,
        sentimentLabel: data.sentiments.length
          ? (data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length > 0.05
              ? "positive" : data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length < -0.05
              ? "negative" : "neutral")
          : "neutral",
        mentionCount: data.mentions,
      }))
      .sort((a, b) => b.visibility - a.visibility),
  ];

  return NextResponse.json({ results, brandStats });
}