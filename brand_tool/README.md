# Peec Brand Visibility Tool

A self-hosted clone of Peec AI — crawls your website, generates competitive prompts,
runs them through Groq, and shows you exactly how visible your brand is in AI responses
vs. competitors, with actionable improvement suggestions.

## Quick start

```bash
npm install

# Set API keys
cp .env.local.example .env.local
# → ANTHROPIC_API_KEY  (claude.anthropic.com)
# → GROQ_API_KEY       (console.groq.com — free tier)

npm run dev
# → http://localhost:3000
```

## 5-step wizard

| Step | What happens |
|------|-------------|
| 1. Add project | Enter your URL — we crawl up to 12 pages automatically |
| 2. Brand profile | Claude extracts description, industry, identity tags, products |
| 3. Topics | Claude generates 8-10 topic categories specific to your market |
| 4. Prompts | 8 prompts per topic — review & select up to 50 |
| 5. Results | All prompts run through Groq, Claude scores visibility + sentiment |

## Results dashboard

- **Competitors** — ranked table: visibility %, sentiment, avg position for your brand and every competitor mentioned
- **Prompts** — per-prompt breakdown with expandable AI response + competitor mentions
- **What to improve** — Claude analyses prompts where you weren't mentioned and gives specific content/SEO/positioning recommendations

## Architecture

```
src/app/
  page.tsx                    Step 1 — URL + crawl
  brand/page.tsx              Step 2 — Edit brand profile
  topics/page.tsx             Step 3 — Select topics
  prompts/page.tsx            Step 4 — Select prompts
  results/page.tsx            Step 5 — Results dashboard

  api/
    crawl/route.ts            Crawls website with cheerio (up to 12 pages)
    generate-profile/route.ts Claude extracts brand info from page text
    generate-topics/route.ts  Claude generates topic categories
    generate-prompts/route.ts Claude generates 8 prompts per topic
    analyze/route.ts          Groq runs prompts; Claude scores each response
    suggestions/route.ts      Claude writes improvement advice per missed prompt
```

## Env variables

```
ANTHROPIC_API_KEY=   # required — profile, topic, prompt generation + scoring + suggestions
GROQ_API_KEY=        # required — runs the actual prompts through LLaMA3 70B
```
