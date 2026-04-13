"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, PageHeader, Skeleton } from "@/components/ui";
import type { Run } from "@/types";

function ms(n: number) {
  if (n < 1000) return `${n}ms`;
  return `${(n / 1000).toFixed(1)}s`;
}

function ago(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Runs() {
  const [runs, setRuns]     = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.runs(20).then(r => { setRuns(r); setLoading(false); });
  }, []);

  const duration = (r: Run) => {
    const ms = new Date(r.finished_at).getTime() - new Date(r.started_at).getTime();
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(0)}s`;
  };

  return (
    <div>
      <PageHeader
        title="Runs"
        sub="Collection run history from Project 1"
      />

      <Card>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20,
          fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
          RECENT RUNS
        </div>

        {loading ? <Skeleton height={300} /> : runs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0",
            color: "var(--muted)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
            no runs yet — run python main.py in peec_collector/
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Run ID","Started","Duration","Responses","Avg latency"].map(h => (
                  <th key={h} style={{
                    textAlign: "left", padding: "8px 14px",
                    fontSize: 11, color: "var(--muted)", fontWeight: 400,
                    fontFamily: "var(--font-mono)", letterSpacing: "0.08em",
                  }}>
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map(run => (
                <tr key={run.run_id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "14px 14px" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 12,
                      color: "var(--muted)",
                    }}>
                      {run.run_id.slice(0, 8)}…
                    </span>
                  </td>
                  <td style={{ padding: "14px 14px" }}>
                    <div style={{ fontSize: 13 }}>
                      {new Date(run.started_at).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2,
                      fontFamily: "var(--font-mono)" }}>
                      {ago(run.started_at)}
                    </div>
                  </td>
                  <td style={{ padding: "14px 14px",
                    fontFamily: "var(--font-mono)", color: "var(--text)" }}>
                    {duration(run)}
                  </td>
                  <td style={{ padding: "14px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 16, fontWeight: 300,
                        fontFamily: "var(--font-mono)", color: "var(--accent2)",
                      }}>
                        {run.response_count}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>
                        responses
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 14px",
                    fontFamily: "var(--font-mono)", color: "var(--text)" }}>
                    {ms(run.avg_latency_ms)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Stats summary */}
      {!loading && runs.length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12, marginTop: 20,
        }}>
          {[
            {
              label: "Total runs",
              value: runs.length,
            },
            {
              label: "Total responses collected",
              value: runs.reduce((s, r) => s + r.response_count, 0),
            },
            {
              label: "Avg responses per run",
              value: Math.round(
                runs.reduce((s, r) => s + r.response_count, 0) / runs.length
              ),
            },
          ].map(({ label, value }) => (
            <div key={label} style={{
              background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: 10, padding: "16px 20px",
            }}>
              <div style={{ fontSize: 11, color: "var(--muted)",
                fontFamily: "var(--font-mono)", letterSpacing: "0.08em", marginBottom: 6 }}>
                {label.toUpperCase()}
              </div>
              <div style={{ fontSize: 24, fontWeight: 300,
                fontFamily: "var(--font-mono)", color: "var(--text)" }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
