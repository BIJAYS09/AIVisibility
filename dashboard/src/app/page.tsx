"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, Stat, SentimentBadge, DaysFilter, PageHeader, Skeleton } from "@/components/ui";
import VisibilityChart from "@/components/VisibilityChart";
import SuggestionPanel from "@/components/SuggestionPanel";
import type { BrandSummary, ScorePoint, PromptRow } from "@/types";

const OWN = process.env.NEXT_PUBLIC_OWN_BRAND ?? "YourBrand";

export default function Overview() {
  const [days, setDays]           = useState(30);
  const [brands, setBrands]       = useState<string[]>([]);
  const [summary, setSummary]     = useState<BrandSummary[]>([]);
  const [scores, setScores]       = useState<ScorePoint[]>([]);
  const [missed, setMissed]       = useState<PromptRow[]>([]);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, s] = await Promise.all([api.brands(), api.summary(days)]);
      setBrands(b);
      setSummary(s);

      if (b.includes(OWN)) {
        const [sc, mn] = await Promise.all([
          api.scores(OWN, days),
          api.prompts(OWN, { mentioned: false, days }),
        ]);
        setScores(sc);
        setMissed(mn);
      }
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const own = summary.find(s => s.brand === OWN);
  const others = summary.filter(s => s.brand !== OWN);

  return (
    <div>
      <PageHeader
        title="Overview"
        sub={`Brand visibility across ${own?.total_prompts ?? 0} prompts`}
        right={<DaysFilter value={days} onChange={setDays} />}
      />

      {/* Own brand stat strip */}
      {loading ? <Skeleton height={100} /> : own ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12, marginBottom: 28,
        }}>
          <Stat label="Mention rate" value={`${own.mention_rate}%`}
            sub={`${own.mentioned_in} of ${own.total_prompts} prompts`} accent />
          <Stat label="Avg position" value={own.avg_position.toFixed(2)}
            sub="1.0 = always first" />
          <Stat label="Total mentions" value={own.total_mentions} />
          <Stat label="Sentiment" value={own.avg_sentiment >= 0
            ? `+${own.avg_sentiment.toFixed(3)}` : own.avg_sentiment.toFixed(3)}
            sub={own.avg_sentiment > 0.05 ? "positive" : own.avg_sentiment < -0.05 ? "negative" : "neutral"}
          />
        </div>
      ) : !loading && (
        <div style={{
          padding: "20px 24px", marginBottom: 28,
          background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.15)",
          borderRadius: 10, fontSize: 13, color: "var(--negative)",
          fontFamily: "var(--font-mono)",
        }}>
          brand &quot;{OWN}&quot; not found — check NEXT_PUBLIC_OWN_BRAND in .env.local
        </div>
      )}

      {/* Visibility trend */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20,
          fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
          MENTION RATE OVER TIME — {OWN}
        </div>
        {loading ? <Skeleton height={240} /> : <VisibilityChart data={scores} />}
      </Card>

      {/* Competitor rank table */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20,
          fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
          ALL BRANDS RANKED BY MENTION RATE
        </div>
        {loading ? <Skeleton height={200} /> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["#","Brand","Mention rate","Position","Sentiment","Mentions"].map(h => (
                  <th key={h} style={{
                    textAlign: "left", padding: "8px 12px",
                    fontSize: 11, color: "var(--muted)", fontWeight: 400,
                    fontFamily: "var(--font-mono)", letterSpacing: "0.08em",
                  }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary
                .sort((a, b) => b.mention_rate - a.mention_rate)
                .map((row, i) => (
                  <tr key={row.brand} style={{
                    borderBottom: "1px solid var(--border)",
                    background: row.brand === OWN ? "rgba(99,102,241,0.06)" : "transparent",
                  }}>
                    <td style={{ padding: "12px 12px", color: "var(--muted)",
                      fontFamily: "var(--font-mono)" }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: "12px 12px", fontWeight: row.brand === OWN ? 500 : 400 }}>
                      {row.brand}
                      {row.brand === OWN && (
                        <span style={{ fontSize: 10, marginLeft: 8, color: "var(--accent2)",
                          fontFamily: "var(--font-mono)" }}>you</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          height: 4, width: 80, background: "var(--bg2)",
                          borderRadius: 2, overflow: "hidden",
                        }}>
                          <div style={{
                            height: "100%",
                            width: `${row.mention_rate}%`,
                            background: row.brand === OWN ? "var(--accent)" : "var(--border2)",
                            borderRadius: 2,
                          }} />
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                          {row.mention_rate}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 12px", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {row.avg_position.toFixed(2)}
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <SentimentBadge
                        label={row.avg_sentiment > 0.05 ? "positive" : row.avg_sentiment < -0.05 ? "negative" : "neutral"}
                        score={row.avg_sentiment}
                      />
                    </td>
                    <td style={{ padding: "12px 12px", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {row.total_mentions}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* AI suggestions */}
      <Card>
        <SuggestionPanel brand={OWN} missedPrompts={missed} />
      </Card>
    </div>
  );
}
