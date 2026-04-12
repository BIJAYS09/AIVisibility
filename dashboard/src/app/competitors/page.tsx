"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, DaysFilter, PageHeader, Skeleton, SentimentBadge } from "@/components/ui";
import CompetitorBar from "@/components/CompetitorBar";
import type { BrandSummary, CompetitorData } from "@/types";

const OWN = process.env.NEXT_PUBLIC_OWN_BRAND ?? "YourBrand";

export default function Competitors() {
  const [days, setDays]           = useState(30);
  const [summary, setSummary]     = useState<BrandSummary[]>([]);
  const [competitor, setCompetitor] = useState<CompetitorData>({});
  const [selected, setSelected]   = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await api.summary(days);
      setSummary(s);
      const allBrands = s.map(b => b.brand);
      setSelected(prev => prev.length ? prev : allBrands);
      if (allBrands.length) {
        const c = await api.competitors(allBrands, days);
        setCompetitor(c);
      }
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  function toggleBrand(brand: string) {
    setSelected(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  }

  const filtered: CompetitorData = Object.fromEntries(
    selected.map(b => [b, competitor[b] ?? {}])
  );

  return (
    <div>
      <PageHeader
        title="Competitors"
        sub="Side-by-side mention rate by prompt category"
        right={<DaysFilter value={days} onChange={setDays} />}
      />

      {/* Brand toggles */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {summary.map(b => (
          <button
            key={b.brand}
            onClick={() => toggleBrand(b.brand)}
            style={{
              padding: "5px 14px", fontSize: 12, borderRadius: 20,
              fontFamily: "var(--font-mono)", cursor: "pointer",
              border: "1px solid",
              borderColor: selected.includes(b.brand) ? "var(--accent)" : "var(--border2)",
              background: selected.includes(b.brand)
                ? b.brand === OWN ? "var(--accent)" : "rgba(99,102,241,0.15)"
                : "transparent",
              color: selected.includes(b.brand) && b.brand === OWN
                ? "#fff"
                : selected.includes(b.brand) ? "var(--accent2)" : "var(--muted)",
              transition: "all 0.15s",
            }}
          >
            {b.brand}
          </button>
        ))}
      </div>

      {/* Bar chart */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20,
          fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
          MENTION RATE % BY CATEGORY
        </div>
        {loading
          ? <Skeleton height={280} />
          : <CompetitorBar data={filtered} ownBrand={OWN} />
        }
      </Card>

      {/* Detail table */}
      <Card>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20,
          fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
          FULL BREAKDOWN
        </div>
        {loading ? <Skeleton height={200} /> : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "8px 14px",
                    color: "var(--muted)", fontWeight: 400,
                    fontFamily: "var(--font-mono)", fontSize: 11 }}>
                    BRAND
                  </th>
                  {Array.from(
                    new Set(Object.values(competitor).flatMap(c => Object.keys(c)))
                  ).sort().map(cat => (
                    <th key={cat} style={{
                      textAlign: "right", padding: "8px 14px",
                      color: "var(--muted)", fontWeight: 400,
                      fontFamily: "var(--font-mono)", fontSize: 11,
                    }}>
                      {cat.toUpperCase()}
                    </th>
                  ))}
                  <th style={{ textAlign: "right", padding: "8px 14px",
                    color: "var(--muted)", fontWeight: 400,
                    fontFamily: "var(--font-mono)", fontSize: 11 }}>
                    OVERALL
                  </th>
                </tr>
              </thead>
              <tbody>
                {selected
                  .map(brand => ({
                    brand,
                    sum: summary.find(s => s.brand === brand),
                    cats: competitor[brand] ?? {},
                  }))
                  .sort((a, b) => (b.sum?.mention_rate ?? 0) - (a.sum?.mention_rate ?? 0))
                  .map(({ brand, sum, cats }) => {
                    const allCats = Array.from(
                      new Set(Object.values(competitor).flatMap(c => Object.keys(c)))
                    ).sort();
                    return (
                      <tr key={brand} style={{
                        borderBottom: "1px solid var(--border)",
                        background: brand === OWN ? "rgba(99,102,241,0.05)" : "transparent",
                      }}>
                        <td style={{ padding: "12px 14px", fontWeight: brand === OWN ? 500 : 400 }}>
                          {brand}
                          {brand === OWN && (
                            <span style={{ fontSize: 10, marginLeft: 6,
                              color: "var(--accent2)", fontFamily: "var(--font-mono)" }}>
                              you
                            </span>
                          )}
                        </td>
                        {allCats.map(cat => {
                          const val = cats[cat]?.mention_rate ?? null;
                          return (
                            <td key={cat} style={{
                              padding: "12px 14px", textAlign: "right",
                              fontFamily: "var(--font-mono)",
                              color: val === null ? "var(--muted)"
                                : val >= 70 ? "var(--positive)"
                                : val >= 30 ? "var(--text)" : "var(--negative)",
                            }}>
                              {val === null ? "—" : `${val}%`}
                            </td>
                          );
                        })}
                        <td style={{
                          padding: "12px 14px", textAlign: "right",
                          fontFamily: "var(--font-mono)",
                          color: "var(--accent2)", fontWeight: 500,
                        }}>
                          {sum?.mention_rate ?? "—"}%
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
