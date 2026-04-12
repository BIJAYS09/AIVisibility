# Peec — Project 4: Analytics Dashboard

Next.js 14 dashboard that reads from Project 3's FastAPI and displays brand
visibility data with charts, tables, and AI-powered improvement suggestions.

## Quick start

```bash
npm install

# Configure API URL and your brand name
cp .env.local.example .env.local
# → edit NEXT_PUBLIC_API_URL and NEXT_PUBLIC_OWN_BRAND

npm run dev
# → http://localhost:3000
```

## Pages

| Route | What it shows |
|-------|--------------|
| `/` | Overview: mention rate trend, all-brands ranking, AI suggestions |
| `/competitors` | Side-by-side bar chart + table by category |
| `/prompts` | Per-prompt drill-down table with mention/missing filter |
| `/runs` | Collection run history from Project 1 |

## AI suggestions

The Overview page has a **Generate suggestions** button. It sends your
lowest-visibility prompts to the Claude API and gets back specific
content/positioning recommendations per query.

The API route lives at `src/app/api/suggestions/route.ts`.
The Anthropic API key is picked up automatically from your environment
when running via Claude.ai artifacts — no key needed in .env for that path.

If running locally outside Claude, set:
```
ANTHROPIC_API_KEY=your_key_here
```
in `.env.local`.

## Env variables

```
NEXT_PUBLIC_API_URL=http://localhost:8000   # Project 3 FastAPI server
NEXT_PUBLIC_OWN_BRAND=YourBrand            # must match brands.json exactly
ANTHROPIC_API_KEY=                         # only needed for local suggestion generation
```

## Project structure

```
peec_dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Overview dashboard
│   │   ├── layout.tsx            ← Root layout + sidebar
│   │   ├── globals.css           ← Design system / fonts
│   │   ├── api/suggestions/
│   │   │   └── route.ts          ← Claude API proxy for suggestions
│   │   ├── competitors/page.tsx
│   │   ├── prompts/page.tsx
│   │   └── runs/page.tsx
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── ui.tsx                ← Card, Stat, Badge, DaysFilter, etc.
│   │   ├── VisibilityChart.tsx   ← Recharts line chart
│   │   ├── CompetitorBar.tsx     ← Grouped bar chart
│   │   ├── PromptTable.tsx       ← Expandable prompt rows
│   │   └── SuggestionPanel.tsx   ← AI suggestion UI
│   ├── lib/
│   │   └── api.ts                ← Typed fetch helpers for P3 endpoints
│   └── types/
│       └── index.ts              ← Shared TypeScript interfaces
└── .env.local                    ← Your config (not committed)
```

## Data flow

```
Project 3 FastAPI (port 8000)
  /summary        → Overview ranking table + stat strip
  /scores         → VisibilityChart line data
  /prompts        → PromptTable rows
  /competitors    → CompetitorBar chart data
  /runs           → Runs history table

Claude API (via /api/suggestions)
  POST /v1/messages → AI improvement suggestions
```
