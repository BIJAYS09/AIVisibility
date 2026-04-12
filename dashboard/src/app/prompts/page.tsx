"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, DaysFilter, PageHeader, Skeleton } from "@/components/ui";
import PromptTable from "@/components/PromptTable";
import type { BrandSummary, PromptRow } from "@/types";

const OWN = process.env.NEXT_PUBLIC_OWN_BRAND ?? "YourBrand";

export default function Prompts() {
  const [days, setDays]         = useState(30);
  const [brands, setBrands]     = useState<string[]>([]);
  const [brand, setBrand]       = useState(OWN);
  const [filter, setFilter]     = useState<"all" | "yes" | "no">("all");
  const [rows, setRows]         = useState<PromptRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [summary, setSummary]   = useState<BrandSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, s] = await Promise.all([api.brands(), api.summary(days)]);
      setBrands(b);
      setSummary(s.find(x => x.brand === brand) ?? null);

      const mentioned =
        filter === "yes" ? true :
        filter === "no"  ? false : undefined;

      const r = await api.prompts(brand, { mentioned, days });
      setRows(r);
    } finally {
      setLoading(false);
    }
  }, [brand, days, filter]);

  useEffect(() => { load(); }, [load]);

  const filterBtn = (label: string, val: typeof filter) => (
    <button
      onClick={() => setFilter(val)}
      style={{
        padding: "5px 14px", fontSize: 12, cursor: "pointer",
        fontFamily: "var(--font-mono)", borderRadius: 6,
        background: filter === val ? "var(--surface)" : "transparent",
        color: filter === val ? "var(--text)" : "var(--muted)",
        border: "1px solid",
        borderColor: filter === val ? "var(--border2)" : "transparent",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      <PageHeader
        title="Prompts"
        sub="Per-prompt visibility breakdown — click any row for details"
        right={<DaysFilter value={days} onChange={setDays} />}
      />

      {/* Controls row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "center" }}>
        {/* Brand selector */}
        <select
          value={brand}
          onChange={e => setBrand(e.target.value)}
          style={{
            background: "var(--surface)", color: "var(--text)",
            border: "1px solid var(--border2)", borderRadius: 8,
            padding: "6px 12px", fontSize: 13,
            fontFamily: "var(--font-mono)", cursor: "pointer",
          }}
        >
          {brands.map(b => (
            <option key={b} value={b}>{b}{b === OWN ? " (you)" : ""}</option>
          ))}
        </select>

        {/* Mention filter */}
        <div style={{
          display: "flex", gap: 2, padding: "3px",
          background: "var(--bg2)", borderRadius: 8,
          border: "1px solid var(--border)",
        }}>
          {filterBtn("All",      "all")}
          {filterBtn("Mentioned","yes")}
          {filterBtn("Missing",  "no")}
        </div>

        {/* Count pill */}
        {!loading && (
          <span style={{
            fontSize: 12, color: "var(--muted)",
            fontFamily: "var(--font-mono)",
          }}>
            {rows.length} prompt{rows.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Summary strip */}
      {summary && !loading && (
        <div style={{
          display: "flex", gap: 24, marginBottom: 20,
          padding: "14px 20px",
          background: "var(--bg2)", borderRadius: 10,
          border: "1px solid var(--border)",
          fontSize: 12, fontFamily: "var(--font-mono)",
        }}>
          <span style={{ color: "var(--muted)" }}>
            mention rate <span style={{ color: "var(--accent2)" }}>
              {summary.mention_rate}%
            </span>
          </span>
          <span style={{ color: "var(--muted)" }}>
            avg position <span style={{ color: "var(--text)" }}>
              {summary.avg_position.toFixed(2)}
            </span>
          </span>
          <span style={{ color: "var(--muted)" }}>
            avg sentiment <span style={{
              color: summary.avg_sentiment > 0.05 ? "var(--positive)"
                   : summary.avg_sentiment < -0.05 ? "var(--negative)" : "var(--neutral)",
            }}>
              {summary.avg_sentiment >= 0 ? "+" : ""}{summary.avg_sentiment.toFixed(3)}
            </span>
          </span>
          <span style={{ color: "var(--muted)" }}>
            total mentions <span style={{ color: "var(--text)" }}>
              {summary.total_mentions}
            </span>
          </span>
        </div>
      )}

      <Card>
        {loading
          ? <Skeleton height={300} />
          : <PromptTable rows={rows} />
        }
      </Card>
    </div>
  );
}
