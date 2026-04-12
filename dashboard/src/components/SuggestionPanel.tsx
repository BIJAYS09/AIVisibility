"use client";
import { useState } from "react";
import type { PromptRow } from "@/types";

interface Props {
  brand: string;
  missedPrompts: PromptRow[];
}

interface Suggestion {
  prompt: string;
  category: string;
  advice: string;
}

export default function SuggestionPanel({ brand, missedPrompts }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!missedPrompts.length) return;
    setLoading(true);
    setError(null);
    setSuggestions([]);

    const sample = missedPrompts.slice(0, 8);

    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, prompts: sample }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    } catch (e: any) {
      setError(e.message ?? "Failed to generate suggestions");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: 16,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>
            AI visibility suggestions
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
            {missedPrompts.length} prompts where {brand} was not mentioned
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading || !missedPrompts.length}
          style={{
            padding: "8px 18px", fontSize: 12,
            fontFamily: "var(--font-mono)",
            background: loading ? "transparent" : "var(--accent)",
            color: loading ? "var(--muted)" : "#fff",
            border: "1px solid var(--accent)",
            borderRadius: 8, cursor: loading ? "default" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {loading ? "analysing..." : "generate suggestions"}
        </button>
      </div>

      {error && (
        <div style={{
          padding: "10px 14px", background: "rgba(248,113,113,0.08)",
          border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8,
          fontSize: 12, color: "var(--negative)", marginBottom: 12,
        }}>
          {error}
        </div>
      )}

      {!suggestions.length && !loading && (
        <div style={{
          padding: "32px", textAlign: "center",
          border: "1px dashed var(--border2)", borderRadius: 10,
          fontSize: 12, color: "var(--muted)", fontFamily: "var(--font-mono)",
        }}>
          click generate to get Claude&apos;s recommendations
        </div>
      )}

      {suggestions.map((s, i) => (
        <div key={i} style={{
          marginBottom: 12, padding: "16px 18px",
          background: "var(--bg2)", border: "1px solid var(--border)",
          borderRadius: 10, animation: "fadeUp 0.3s ease both",
          animationDelay: `${i * 60}ms`,
        }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
            <span style={{
              fontSize: 10, padding: "2px 8px",
              background: "rgba(99,102,241,0.15)", color: "var(--accent2)",
              borderRadius: 4, fontFamily: "var(--font-mono)",
              whiteSpace: "nowrap", marginTop: 1,
            }}>
              {s.category}
            </span>
            <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
              {s.prompt}
            </div>
          </div>
          <div style={{
            borderTop: "1px solid var(--border)", paddingTop: 10,
            fontSize: 13, color: "var(--text)", lineHeight: 1.6,
          }}>
            {s.advice}
          </div>
        </div>
      ))}
    </div>
  );
}
