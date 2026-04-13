"use client";
import React from "react";

// Step indicator
export function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 12, color: "var(--faint)", marginBottom: 8, fontFamily: "var(--font-mono)" }}>
        STEP {current}/{total}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < current ? "var(--accent)" : "var(--border)",
            transition: "background 0.3s",
          }} />
        ))}
      </div>
    </div>
  );
}

// Tag pill with ×
export function Tag({
  label, onRemove,
}: {
  label: string; onRemove?: () => void;
}) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "var(--bg3)", border: "1px solid var(--border)",
      borderRadius: 20, padding: "3px 10px", fontSize: 13,
    }}>
      {label}
      {onRemove && (
        <button onClick={onRemove} style={{
          background: "none", border: "none",
          cursor: "pointer", color: "var(--faint)",
          fontSize: 14, lineHeight: 1, padding: 0,
        }}>×</button>
      )}
    </span>
  );
}

// Primary button
export function Btn({
  children, onClick, disabled = false, variant = "primary", style = {},
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  style?: React.CSSProperties;
}) {
  const styles: React.CSSProperties = {
    padding: "10px 20px", fontSize: 14, fontWeight: 500,
    borderRadius: "var(--r)", cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.15s",
    fontFamily: "var(--font-sans)",
    ...(variant === "primary" ? {
      background: "var(--accent)", color: "#fff", borderColor: "var(--accent)",
    } : variant === "secondary" ? {
      background: "var(--bg)", color: "var(--text)", borderColor: "var(--border2)",
    } : {
      background: "transparent", color: "var(--muted)", borderColor: "transparent",
    }),
    ...style,
  };
  return <button style={styles} onClick={onClick} disabled={disabled}>{children}</button>;
}

// Text input
export function Input({
  label, value, onChange, placeholder = "", prefix, type = "text",
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  type?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{label}</div>}
      <div style={{ display: "flex", border: "1px solid var(--border2)", borderRadius: "var(--r)", overflow: "hidden" }}>
        {prefix && (
          <span style={{
            padding: "9px 12px", background: "var(--bg3)",
            borderRight: "1px solid var(--border2)",
            color: "var(--muted)", fontSize: 13, whiteSpace: "nowrap",
          }}>{prefix}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, padding: "9px 12px", border: "none",
            outline: "none", fontSize: 14, background: "var(--bg)",
            color: "var(--text)", fontFamily: "var(--font-sans)",
          }}
        />
      </div>
    </div>
  );
}

// Card
export function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)", padding: "24px 28px", ...style,
    }}>
      {children}
    </div>
  );
}

// Section label
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>
      {children}
    </div>
  );
}
export function SectionSub({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
      {children}
    </div>
  );
}

// Checkbox row
export function CheckRow({
  checked, onChange, children,
}: {
  checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode;
}) {
  return (
    <label style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "8px 0", cursor: "pointer",
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
        border: `2px solid ${checked ? "var(--accent)" : "var(--border2)"}`,
        background: checked ? "var(--accent)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}>
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}
        <input
          type="checkbox" checked={checked}
          onChange={e => onChange(e.target.checked)}
          style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
        />
      </div>
      <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>{children}</span>
    </label>
  );
}

// Split layout (left panel + right preview)
export function SplitLayout({
  left, right,
}: {
  left: React.ReactNode; right: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Left panel */}
      <div style={{
        width: 460, flexShrink: 0,
        background: "var(--bg)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        position: "relative",
      }}>
        {/* Logo */}
        <div style={{
          padding: "20px 32px 0",
          fontSize: 20, fontWeight: 600, letterSpacing: "-0.03em",
        }}>
          ■
        </div>
        <div style={{
          flex: 1, padding: "24px 32px 0",
          overflowY: "auto",
        }}>
          {left}
        </div>
        <div style={{ height: 20 }} />
      </div>
      {/* Right preview */}
      <div style={{
        flex: 1, background: "var(--bg2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 40, overflowY: "auto",
      }}>
        {right}
      </div>
    </div>
  );
}

// Spinner
export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      border: `${size / 8}px solid var(--border)`,
      borderTopColor: "var(--accent)",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
      display: "inline-block",
    }} />
  );
}

// Sentiment pill
export function SentimentPill({ label, score }: { label: string; score: number }) {
  const color = label === "positive" ? "var(--green)"
              : label === "negative" ? "var(--red)" : "var(--faint)";
  const bg = label === "positive" ? "var(--green-bg)"
           : label === "negative" ? "var(--red-bg)" : "var(--bg3)";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: bg, color,
      borderRadius: 99, padding: "2px 8px", fontSize: 11,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: color, display: "inline-block",
      }} />
      {label}
    </span>
  );
}

// Progress bar
export function VisBar({ pct }: { pct: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        height: 6, width: 80, background: "var(--bg3)",
        borderRadius: 3, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: pct > 60 ? "var(--green)" : pct > 30 ? "var(--accent)" : "var(--red)",
          borderRadius: 3, transition: "width 0.5s ease",
        }} />
      </div>
      <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 500 }}>
        {pct}%
      </span>
    </div>
  );
}
