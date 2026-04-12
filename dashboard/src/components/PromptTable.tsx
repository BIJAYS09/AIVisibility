"use client";
import { useState } from "react";
import { SentimentBadge } from "./ui";
import type { PromptRow } from "@/types";

interface Props { rows: PromptRow[]; }

export default function PromptTable({ rows }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!rows.length) return (
    <div style={{ color: "var(--muted)", fontSize: 13, padding: "20px 0",
      fontFamily: "var(--font-mono)" }}>
      no prompts found
    </div>
  );

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Category","Prompt","Mentioned","Position","Sentiment","Model"].map(h => (
              <th key={h} style={{
                textAlign: "left", padding: "10px 14px",
                fontSize: 11, color: "var(--muted)",
                fontWeight: 400, letterSpacing: "0.08em",
                fontFamily: "var(--font-mono)", whiteSpace: "nowrap",
              }}>
                {h.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const key = `${row.prompt_id}-${i}`;
            const isOpen = expanded === key;
            return [
              <tr
                key={key}
                onClick={() => setExpanded(isOpen ? null : key)}
                style={{
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  background: isOpen ? "var(--bg3)" : "transparent",
                  transition: "background 0.1s",
                }}
              >
                <td style={{ padding: "12px 14px" }}>
                  <span style={{
                    fontSize: 11, padding: "2px 8px",
                    background: "var(--bg2)", border: "1px solid var(--border2)",
                    borderRadius: 4, color: "var(--muted)",
                    fontFamily: "var(--font-mono)",
                  }}>
                    {row.category}
                  </span>
                </td>
                <td style={{ padding: "12px 14px", maxWidth: 320 }}>
                  <div style={{
                    overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap", color: "var(--text)",
                  }}>
                    {row.prompt_text}
                  </div>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 4,
                    fontFamily: "var(--font-mono)",
                    background: row.mentioned ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.08)",
                    color: row.mentioned ? "var(--positive)" : "var(--negative)",
                  }}>
                    {row.mentioned ? `yes ×${row.mention_count}` : "no"}
                  </span>
                </td>
                <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)" }}>
                  {row.position_score > 0 ? row.position_score.toFixed(1) : "—"}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  {row.mentioned
                    ? <SentimentBadge label={row.sentiment_label} score={row.avg_sentiment} />
                    : <span style={{ color: "var(--muted)", fontSize: 11 }}>—</span>
                  }
                </td>
                <td style={{ padding: "12px 14px", color: "var(--muted)",
                  fontSize: 11, fontFamily: "var(--font-mono)" }}>
                  {row.model.split("-").slice(0, 2).join("-")}
                </td>
              </tr>,
              isOpen && (
                <tr key={`${key}-exp`} style={{ background: "var(--bg3)" }}>
                  <td colSpan={6} style={{ padding: "0 14px 16px 14px" }}>
                    <div style={{
                      fontSize: 12, color: "var(--muted)", lineHeight: 1.6,
                      paddingTop: 8,
                    }}>
                      {row.prompt_text}
                    </div>
                    <div style={{
                      marginTop: 8, fontSize: 11, color: "var(--muted)",
                      fontFamily: "var(--font-mono)",
                    }}>
                      {new Date(row.collected_at).toLocaleString()} · {row.prompt_id}
                    </div>
                  </td>
                </tr>
              ),
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
