"use client";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function Card({
  children, className = "", style = {},
}: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div className={`fade-up ${className}`} style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "24px 28px",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
export function Stat({
  label, value, sub, accent = false,
}: {
  label: string; value: string | number; sub?: string; accent?: boolean;
}) {
  return (
    <div style={{
      background: "var(--bg2)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "18px 22px",
    }}>
      <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em", marginBottom: 6 }}>
        {label.toUpperCase()}
      </div>
      <div style={{
        fontSize: 28, fontWeight: 300,
        color: accent ? "var(--accent2)" : "var(--text)",
        lineHeight: 1,
        fontFamily: "var(--font-mono)",
      }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sentiment badge
// ---------------------------------------------------------------------------
export function SentimentBadge({ label, score }: { label: string; score: number }) {
  const color =
    label === "positive" ? "var(--positive)" :
    label === "negative" ? "var(--negative)" : "var(--neutral)";
  const sym = label === "positive" ? "▲" : label === "negative" ? "▼" : "●";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, color, fontFamily: "var(--font-mono)",
    }}>
      {sym} {score > 0 ? "+" : ""}{score.toFixed(2)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Days filter
// ---------------------------------------------------------------------------
export function DaysFilter({
  value, onChange,
}: {
  value: number; onChange: (d: number) => void;
}) {
  const opts = [7, 14, 30, 90];
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {opts.map(d => (
        <button key={d} onClick={() => onChange(d)} style={{
          padding: "4px 12px", fontSize: 12,
          fontFamily: "var(--font-mono)",
          background: value === d ? "var(--accent)" : "transparent",
          color: value === d ? "#fff" : "var(--muted)",
          border: "1px solid",
          borderColor: value === d ? "var(--accent)" : "var(--border2)",
          borderRadius: 6, cursor: "pointer",
          transition: "all 0.15s",
        }}>
          {d}d
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page header
// ---------------------------------------------------------------------------
export function PageHeader({
  title, sub, right,
}: {
  title: string; sub?: string; right?: React.ReactNode;
}) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between",
      alignItems: "flex-end", marginBottom: 32,
    }}>
      <div>
        <h1 style={{
          fontSize: 22, fontWeight: 300,
          fontFamily: "var(--font-serif)", fontStyle: "italic",
          color: "var(--text)", margin: 0, lineHeight: 1,
        }}>
          {title}
        </h1>
        {sub && <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 13 }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
export function Empty({ message }: { message: string }) {
  return (
    <div style={{
      textAlign: "center", padding: "60px 0",
      color: "var(--muted)", fontSize: 13,
      fontFamily: "var(--font-mono)",
    }}>
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
export function Skeleton({ height = 200 }: { height?: number }) {
  return (
    <div style={{
      height, borderRadius: 10,
      background: "linear-gradient(90deg, var(--surface) 25%, var(--bg3) 50%, var(--surface) 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  );
}
