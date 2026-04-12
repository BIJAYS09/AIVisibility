import type {
  BrandSummary, ScorePoint, PromptRow, CompetitorData, Run
} from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  brands: () =>
    get<string[]>("/brands"),

  summary: (days = 30) =>
    get<BrandSummary[]>(`/summary?days=${days}`),

  scores: (brand: string, days = 30) =>
    get<ScorePoint[]>(`/scores?brand=${encodeURIComponent(brand)}&days=${days}`),

  prompts: (brand: string, opts?: { mentioned?: boolean; category?: string; days?: number }) => {
    const p = new URLSearchParams({ brand });
    if (opts?.mentioned !== undefined) p.set("mentioned", String(opts.mentioned));
    if (opts?.category) p.set("category", opts.category);
    if (opts?.days) p.set("days", String(opts.days));
    return get<PromptRow[]>(`/prompts?${p}`);
  },

  competitors: (brands: string[], days = 30) =>
    get<CompetitorData>(
      `/competitors?brands=${brands.map(encodeURIComponent).join(",")}&days=${days}`
    ),

  runs: (limit = 10) =>
    get<Run[]>(`/runs?limit=${limit}`),
};
