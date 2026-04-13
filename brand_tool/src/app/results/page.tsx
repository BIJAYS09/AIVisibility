"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { storage } from "@/lib/storage";
import { SentimentPill, VisBar, Spinner, Card } from "@/components/ui";
import type { BrandStats, VisibilityResult } from "@/types";

type Tab = "competitors" | "prompts" | "suggestions";

function NavBar({ brand }: { brand: string }) {
  return (
    <header style={{
      background: "var(--bg)", borderBottom: "1px solid var(--border)",
      padding: "0 32px", display: "flex", justifyContent: "space-between",
      alignItems: "center", height: 56, position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 20, fontWeight: 600 }}>■</span>
        <span style={{ fontSize: 14, color: "var(--muted)" }}>Peec AI</span>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>
          Analysing <strong style={{ color: "var(--text)" }}>{brand}</strong>
        </span>
        <button
          onClick={() => { storage.clearState?.(); window.location.href = "/"; }}
          style={{
            fontSize: 13, padding: "6px 14px",
            border: "1px solid var(--border2)", borderRadius: "var(--r)",
            background: "transparent", cursor: "pointer",
            fontFamily: "var(--font-sans)", color: "var(--muted)",
          }}
        >
          New project
        </button>
      </div>
    </header>
  );
}

function HeroSection({ brand, stats }: { brand: string; stats: BrandStats | undefined }) {
  return (
    <div style={{
      background: "var(--bg)", borderBottom: "1px solid var(--border)",
      padding: "40px 48px 32px", textAlign: "center",
    }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 14px",
        border: "1px solid var(--border)", borderRadius: 20, fontSize: 12,
        color: "var(--muted)", marginBottom: 20,
      }}>
        We analyze your brand using 7 AI models
      </div>
      <h1 style={{
        fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em",
        lineHeight: 1.15, marginBottom: 10,
      }}>
        Your AI Search Analytics for{" "}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "var(--green-bg)", color: "var(--green)",
          padding: "2px 12px", borderRadius: 8,
        }}>
          <span style={{
            width: 10, height: 10, borderRadius: "50%",
            background: "var(--green)", display: "inline-block",
          }} />
          {brand}
        </span>
      </h1>
      <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 28 }}>
        Sample data on how your brand shows up in AI search.
      </p>
      {stats && (
        <div style={{ display: "flex", justifyContent: "center", gap: 32 }}>
          {[
            { label: "Visibility", value: `${stats.visibility}%` },
            { label: "Avg position", value: stats.avgPosition > 0 ? `#${stats.avgPosition}` : "—" },
            { label: "Sentiment", value: stats.sentimentLabel },
            { label: "Mentions", value: String(stats.mentionCount) },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompetitorsTab({ stats }: { stats: BrandStats[] }) {
  return (
    <div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["#", "Brands", "Visibility", "Sentiment", "Position"].map(h => (
              <th key={h} style={{
                textAlign: "left", padding: "10px 16px",
                fontSize: 12, color: "var(--muted)", fontWeight: 400,
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats
            .sort((a, b) => b.visibility - a.visibility)
            .map((s, i) => (
              <tr key={s.brand} style={{
                borderBottom: "1px solid var(--border)",
                background: s.isOwn ? "rgba(22,163,74,0.04)" : "transparent",
              }}>
                <td style={{ padding: "14px 16px", color: "var(--faint)", fontFamily: "var(--font-mono)" }}>
                  {i + 1}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: s.isOwn ? "var(--green)" : "var(--border2)",
                    }} />
                    <span style={{ fontWeight: s.isOwn ? 600 : 400 }}>{s.brand}</span>
                    {s.isOwn && (
                      <span style={{
                        fontSize: 10, padding: "1px 6px",
                        background: "var(--green-bg)", color: "var(--green)",
                        borderRadius: 4,
                      }}>you</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <VisBar pct={s.visibility} />
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <SentimentPill label={s.sentimentLabel} score={s.avgSentiment} />
                </td>
                <td style={{ padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 13 }}>
                  {s.avgPosition > 0 ? `#${s.avgPosition}` : "—"}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function PromptsTab({ results, brandName }: { results: VisibilityResult[]; brandName: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>
      {results.map((r, i) => (
        <div key={r.promptId} style={{
          borderBottom: "1px solid var(--border)",
          animation: "fadeUp 0.3s ease both",
          animationDelay: `${i * 30}ms`,
        }}>
          <div
            onClick={() => setExpanded(expanded === r.promptId ? null : r.promptId)}
            style={{
              padding: "14px 16px", cursor: "pointer",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 4,
                fontFamily: "var(--font-mono)" }}>
                {r.topicName}
              </div>
              <div style={{ fontSize: 13, color: "var(--text)" }}>{r.promptText}</div>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginLeft: 16 }}>
              <span style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 99,
                background: r.mentioned ? "var(--green-bg)" : "var(--red-bg)",
                color: r.mentioned ? "var(--green)" : "var(--red)",
              }}>
                {r.mentioned ? `mentioned ×${r.mentionCount}` : "not mentioned"}
              </span>
              {r.mentioned && (
                <SentimentPill label={r.sentimentLabel} score={r.sentiment} />
              )}
              <span style={{ color: "var(--faint)", fontSize: 14 }}>
                {expanded === r.promptId ? "▾" : "▸"}
              </span>
            </div>
          </div>

          {expanded === r.promptId && r.aiResponse && (
            <div style={{
              padding: "0 16px 16px",
              borderTop: "1px solid var(--border)",
              background: "var(--bg2)",
            }}>
              <div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 500,
                letterSpacing: "0.06em", padding: "12px 0 8px" }}>
                AI RESPONSE
              </div>
              <div style={{
                fontSize: 13, color: "var(--text)", lineHeight: 1.65,
                maxHeight: 200, overflowY: "auto",
              }}>
                {r.aiResponse}
              </div>
              {r.competitors.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 500,
                    letterSpacing: "0.06em", marginBottom: 6 }}>
                    COMPETITORS MENTIONED
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {r.competitors.map(c => (
                      <span key={c.name} style={{
                        fontSize: 12, padding: "2px 10px",
                        border: "1px solid var(--border)", borderRadius: 99,
                        color: "var(--muted)",
                      }}>
                        #{c.positionRank} {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SuggestionsTab({ brand, results }: { brand: string; results: VisibilityResult[] }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);

  const missed = results.filter(r => !r.mentioned).slice(0, 8);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, prompts: missed }),
      });
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
      setDone(true);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{
        padding: "16px 16px 0",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 20,
      }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>How to improve AI visibility</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            {missed.length} prompts where <strong>{brand}</strong> wasn&apos;t mentioned. Here&apos;s what to do.
          </div>
        </div>
        {!done && (
          <button onClick={generate} disabled={loading} style={{
            padding: "8px 18px", fontSize: 13, fontWeight: 500,
            background: "var(--accent)", color: "#fff",
            border: "none", borderRadius: "var(--r)",
            cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1,
            fontFamily: "var(--font-sans)",
          }}>
            {loading ? <><Spinner size={14} />&nbsp;Analysing…</> : "Generate suggestions"}
          </button>
        )}
      </div>

      {!done && !loading && (
        <div style={{
          margin: "0 16px", padding: "32px", textAlign: "center",
          border: "1px dashed var(--border2)", borderRadius: "var(--r)",
          fontSize: 13, color: "var(--faint)",
        }}>
          Click "Generate suggestions" to get AI-powered recommendations
        </div>
      )}

      {suggestions.map((s, i) => (
        <div key={i} style={{
          margin: "0 0 12px",
          borderBottom: "1px solid var(--border)",
          padding: "16px 16px",
          animation: "fadeUp 0.3s ease both",
          animationDelay: `${i * 50}ms`,
        }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
            <span style={{
              fontSize: 11, padding: "2px 8px",
              background: "var(--bg3)", border: "1px solid var(--border)",
              borderRadius: 99, color: "var(--muted)", whiteSpace: "nowrap",
            }}>{s.category}</span>
            <span style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.4 }}>{s.prompt}</span>
          </div>
          <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.65 }}>
            {s.advice}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [stats, setStats]     = useState<BrandStats[]>([]);
  const [results, setResults] = useState<VisibilityResult[]>([]);
  const [brand, setBrand]     = useState("");
  const [tab, setTab]         = useState<Tab>("competitors");

  useEffect(() => {
    if (!storage.isComplete()) { router.push("/"); return; }
    setStats(storage.getBrandStats());
    setResults(storage.getResults());
    const p = storage.getProfile();
    setBrand(p?.name ?? "Your Brand");
  }, [router]);

  const ownStats = stats.find(s => s.isOwn);

  const tabs: { id: Tab; label: string }[] = [
    { id: "competitors", label: "Competitors" },
    { id: "prompts",     label: "Prompts" },
    { id: "suggestions", label: "What to improve" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg2)" }}>
      <NavBar brand={brand} />
      <HeroSection brand={brand} stats={ownStats} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {/* Tab nav */}
        <div style={{
          display: "flex", gap: 0,
          borderBottom: "1px solid var(--border)", marginBottom: 0,
        }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "10px 20px", fontSize: 14, fontWeight: 500,
              background: "transparent", border: "none",
              borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
              color: tab === t.id ? "var(--text)" : "var(--muted)",
              cursor: "pointer", fontFamily: "var(--font-sans)",
              marginBottom: -1, transition: "color 0.15s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderTop: "none", borderRadius: "0 0 var(--r-lg) var(--r-lg)",
          minHeight: 300,
        }}>
          {tab === "competitors" && <CompetitorsTab stats={stats} />}
          {tab === "prompts"     && <PromptsTab results={results} brandName={brand} />}
          {tab === "suggestions" && <SuggestionsTab brand={brand} results={results} />}
        </div>
      </div>
    </div>
  );
}
