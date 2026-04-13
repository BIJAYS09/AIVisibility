"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SplitLayout, StepBar, Btn, Spinner, CheckRow } from "@/components/ui";
import { storage } from "@/lib/storage";
import type { Topic } from "@/types";

export default function TopicsPage() {
  const router = useRouter();
  const [topics, setTopics]     = useState<Topic[]>([]);
  const [generating, setGen]    = useState(false);
  const [customTopic, setCustom] = useState("");

  useEffect(() => {
    const t = storage.getTopics();
    if (!t.length) { router.push("/"); return; }
    setTopics(t);
  }, [router]);

  function toggle(id: string) {
    setTopics(prev => prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t));
  }

  function addCustom() {
    const name = customTopic.trim();
    if (!name) return;
    setTopics(prev => [...prev, { id: `custom-${Date.now()}`, name, selected: true }]);
    setCustom("");
  }

  async function handleNext() {
    storage.setTopics(topics);
    const profile = storage.getProfile();
    if (!profile) return;
    setGen(true);

    try {
      const res = await fetch("/api/generate-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, topics }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Prompt generation failed");
      storage.setPrompts(data.prompts);
      router.push("/prompts");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setGen(false);
    }
  }

  const selected = topics.filter(t => t.selected);
  const MAX = 10;

  // Right preview — topic list mirroring peec.ai
  const preview = (
    <div style={{ width: 420 }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)", overflow: "hidden",
      }}>
        <div style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Topics</span>
        </div>
        {topics.map((t, i) => (
          <div key={t.id} style={{
            padding: "12px 18px",
            borderBottom: i < topics.length - 1 ? "1px solid var(--border)" : "none",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: t.selected ? "var(--bg)" : "var(--bg2)",
            animation: "fadeUp 0.25s ease both",
            animationDelay: `${i * 30}ms`,
          }}>
            <span style={{ fontSize: 13, color: t.selected ? "var(--text)" : "var(--faint)" }}>
              {t.name}
            </span>
            <span style={{
              fontSize: 12, color: "var(--faint)",
              fontFamily: "var(--font-mono)",
            }}>8</span>
          </div>
        ))}
      </div>
    </div>
  );

  const left = (
    <div>
      <StepBar current={3} total={5} />
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, letterSpacing: "-0.02em" }}>
        Review Topics
      </h1>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>
        We&apos;ll create specific prompts for each topic and provide insight how AI relates these areas to your brand.
      </p>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
        You can add more topics later.
      </p>

      <div style={{ display: "flex", justifyContent: "space-between",
        fontSize: 13, marginBottom: 12 }}>
        <span style={{ fontWeight: 500 }}>Select topics</span>
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
          {selected.length}/{MAX}
        </span>
      </div>

      <div style={{ marginBottom: 16 }}>
        {topics.map(t => (
          <div key={t.id} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", marginBottom: 6,
            border: "1px solid var(--border)",
            borderRadius: "var(--r)", background: "var(--bg)",
            cursor: "pointer",
          }} onClick={() => toggle(t.id)}>
            <span style={{
              fontSize: 13,
              color: t.selected ? "var(--text)" : "var(--faint)",
            }}>{t.name}</span>
            <div style={{
              width: 18, height: 18, borderRadius: 4, flexShrink: 0,
              border: `2px solid ${t.selected ? "var(--accent)" : "var(--border2)"}`,
              background: t.selected ? "var(--accent)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}>
              {t.selected && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add custom topic */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          value={customTopic}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addCustom()}
          placeholder="+ Add custom topic"
          style={{
            flex: 1, padding: "9px 12px", fontSize: 13,
            border: "1px dashed var(--border2)", borderRadius: "var(--r)",
            fontFamily: "var(--font-sans)", background: "var(--bg)",
            color: "var(--text)", outline: "none",
          }}
        />
        <Btn variant="secondary" onClick={addCustom}>Add</Btn>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between",
        borderTop: "1px solid var(--border)", paddingTop: 20 }}>
        <Btn variant="secondary" onClick={() => router.push("/brand")}>← Back</Btn>
        <Btn onClick={handleNext} disabled={!selected.length || generating}>
          {generating ? <><Spinner />&nbsp;Generating prompts…</> : "Next →"}
        </Btn>
      </div>
    </div>
  );

  return <SplitLayout left={left} right={preview} />;
}
