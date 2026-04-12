"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/",            label: "Overview" },
  { href: "/competitors", label: "Competitors" },
  { href: "/prompts",     label: "Prompts" },
  { href: "/runs",        label: "Runs" },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, bottom: 0,
      width: 220,
      background: "var(--bg2)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      padding: "32px 0",
    }}>
      {/* Logo */}
      <div style={{ padding: "0 28px 32px" }}>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 13,
          letterSpacing: "0.15em",
          color: "var(--accent2)",
          fontWeight: 500,
        }}>
          PEEC
        </div>
        <div style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 11,
          color: "var(--muted)",
          marginTop: 2,
        }}>
          AI visibility
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        {NAV.map(({ href, label }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link key={href} href={href} style={{
              display: "block",
              padding: "9px 28px",
              fontSize: 13,
              fontWeight: active ? 500 : 400,
              color: active ? "var(--text)" : "var(--muted)",
              textDecoration: "none",
              borderLeft: active
                ? "2px solid var(--accent)"
                : "2px solid transparent",
              background: active ? "var(--bg3)" : "transparent",
              transition: "all 0.15s",
            }}>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "0 28px", fontSize: 11, color: "var(--muted)" }}>
        <div>P3 API: {process.env.NEXT_PUBLIC_API_URL ?? "localhost:8000"}</div>
      </div>
    </aside>
  );
}
