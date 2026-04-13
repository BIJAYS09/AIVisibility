import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MAX_PAGES = 12;
const TIMEOUT   = 8000;

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BrandCrawler/1.0)" },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html")) return null;
    return res.text();
  } catch {
    return null;
  }
}

function extractLinks(html: string, base: string): string[] {
  const $ = cheerio.load(html);
  const origin = new URL(base).origin;
  const links: string[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    try {
      const full = new URL(href, base).href;
      // Same origin only, no anchors/query-heavy pages
      if (full.startsWith(origin) && !full.includes("#") && !full.includes("?")) {
        links.push(full);
      }
    } catch { /* ignore invalid URLs */ }
  });

  return [...new Set(links)];
}

function extractText(html: string, url: string): { title: string; content: string } {
  const $ = cheerio.load(html);

  // Remove noise
  $("script, style, nav, footer, header, noscript, [aria-hidden=true]").remove();

  const title = $("title").text().trim() || $("h1").first().text().trim() || url;

  // Collect meaningful text
  const parts: string[] = [];
  $("h1, h2, h3, p, li, [class*='hero'], [class*='about'], [class*='feature']").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (t.length > 20) parts.push(t);
  });

  const content = parts.join(" ").slice(0, 3000);
  return { title, content };
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

  // Normalise
  let startUrl: string;
  try {
    startUrl = new URL(url.startsWith("http") ? url : `https://${url}`).href;
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const visited  = new Set<string>();
  const queue    = [startUrl];
  const pages: { url: string; title: string; content: string }[] = [];

  while (queue.length > 0 && pages.length < MAX_PAGES) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const html = await fetchPage(current);
    if (!html) continue;

    const { title, content } = extractText(html, current);
    if (content.length > 50) {
      pages.push({ url: current, title, content });
    }

    // Enqueue discovered links (prioritise homepage links)
    if (pages.length < 3) {
      const links = extractLinks(html, current)
        .filter(l => !visited.has(l))
        .slice(0, 8);
      queue.push(...links);
    }
  }

  if (!pages.length) {
    return NextResponse.json({ error: "Could not crawl any content from this URL" }, { status: 422 });
  }

  return NextResponse.json({ pages, pageCount: pages.length });
}