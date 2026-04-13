"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SplitLayout, StepBar, Btn, Spinner, CheckRow } from "@/components/ui";
import { storage } from "@/lib/storage";
import type { Prompt, Topic } from "@/types";

export default function PromptsPage() {
  const router = useRouter();
  const [prompts, setPrompts]     = useState<Prompt[]>([]);
  const [topics, setTopics]       = useState<Topic[]>([]);
  const [activeTopicId, setActive] = useState<string>("");
  const [running, setRunning]     = useState(false);
  const [searchTerm, setSearch]   = useState("");

  useEffect(() => {
    const p = storage.getPrompts();
    const t = storage.getTopics();
    if (!p.length) { router.push("/"); return; }
    setPrompts(p);
    setTopics(t.filter(x => x.selected));
    setActive(t.find(x => x.selected)?.id ?? "");
  }, [router]);

  function togglePrompt(id: string) {
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  }

  function toggleTopic(topicId: string, val: boolean) {
    setPrompts(prev => prev.map(p => p.topicId === topicId ? { ...p, selected: val } : p));
  }

  async function handleAnalyze() {
    storage.setPrompts(prompts);
    const profile = storage.getProfile();
    if (!profile) return;
    setRunning(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, prompts: prompts.filter(p => p.selected) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      storage.setResults(data.results, data.brandStats);
      router.push("/results");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setRunning(false);
    }
  }

  const selectedCount = prompts.filter(p => p.selected).length;
  const MAX = 50;

  const activeTopic = topics.find(t => t.id === activeTopicId);
  const visiblePrompts = prompts.filter(p => {
    if (p.topicId !== activeTopicId) return false;
    if (searchTerm) return p.text.toLowerCase().includes(searchTerm.toLowerCase());
    return true;
  });

  // Right side: prompt panel like peec.ai
  const preview = (
    <div style={{ width: 500 }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Prompts</div>
          {/* Topic tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {topics.map(t => (
              <button key={t.id} onClick={() => setActive(t.id)} style={{
                padding: "4px 10px", fontSize: 11, borderRadius: 20, cursor: "pointer",
                border: "1px solid",
                borderColor: activeTopicId === t.id ? "var(--accent)" : "var(--border)",
                background: activeTopicId === t.id ? "var(--accent)" : "transparent",
                color: activeTopicId === t.id ? "#fff" : "var(--muted)",
                fontFamily: "var(--font-sans)",
                transition: "all 0.15s",
              }}>
                {t.name.split(" ").slice(0, 3).join(" ")}
              </button>
            ))}
          </div>
        </div>

        {/* Two-column: topic list + prompts */}
        <div style={{ display: "flex" }}>
          {/* Topic list */}
          <div style={{ width: 200, borderRight: "1px solid var(--border)", flexShrink: 0 }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
              <input
                value={searchTerm}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search prompts"
                style={{
                  width: "100%", padding: "5px 8px", fontSize: 12,
                  border: "1px solid var(--border)", borderRadius: 6,
                  background: "var(--bg2)", color: "var(--text)", outline: "none",
                  fontFamily: "var(--font-sans)",
                }}
              />
            </div>
            {topics.map(t => (
              <div key={t.id}
                onClick={() => setActive(t.id)}
                style={{
                  padding: "10px 14px", fontSize: 12,
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  background: activeTopicId === t.id ? "var(--bg2)" : "transparent",
                  display: "flex", justifyContent: "space-between",
                  color: activeTopicId === t.id ? "var(--text)" : "var(--muted)",
                }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.name}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", flexShrink: 0, marginLeft: 4 }}>
                  {prompts.filter(p => p.topicId === t.id).length}
                </span>
              </div>
            ))}
          </div>

          {/* Prompt list */}
          <div style={{ flex: 1, maxHeight: 400, overflowY: "auto" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)",
              fontSize: 11, color: "var(--faint)", fontWeight: 500 }}>
              {activeTopic?.name}
            </div>
            {visiblePrompts.map((p, i) => (
              <div key={p.id} style={{
                padding: "10px 14px", fontSize: 12, lineHeight: 1.5,
                borderBottom: "1px solid var(--border)",
                color: p.selected ? "var(--text)" : "var(--faint)",
                cursor: "pointer",
                background: p.selected ? "transparent" : "var(--bg2)",
              }} onClick={() => togglePrompt(p.id)}>
                {p.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const left = (
    <div>
      <StepBar current={4} total={5} />
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, letterSpacing: "-0.02em" }}>
        Review Prompts
      </h1>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
        We&apos;ll run each selected prompt through AI models and measure your brand&apos;s visibility and sentiment. You can add more prompts later.
      </p>

      <div style={{ display: "flex", justifyContent: "space-between",
        fontSize: 13, marginBottom: 12 }}>
        <span style={{ fontWeight: 500 }}>Select prompts</span>
        <span style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
          {selectedCount}/{MAX}
        </span>
      </div>

      {/* Topic accordions */}
      <div style={{ marginBottom: 16 }}>
        {topics.map(topic => {
          const topicPrompts = prompts.filter(p => p.topicId === topic.id);
          const topicSelected = topicPrompts.filter(p => p.selected).length;
          const isActive = activeTopicId === topic.id;

          return (
            <div key={topic.id} style={{
              marginBottom: 8, border: "1px solid var(--border)",
              borderRadius: "var(--r)", overflow: "hidden",
            }}>
              {/* Topic header */}
              <div
                style={{
                  padding: "12px 14px", display: "flex",
                  justifyContent: "space-between", alignItems: "center",
                  cursor: "pointer", background: isActive ? "var(--bg3)" : "var(--bg)",
                  transition: "background 0.15s",
                }}
                onClick={() => setActive(isActive ? "" : topic.id)}
              >
                <span style={{ fontSize: 13, fontWeight: 500 }}>{topic.name}</span>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--muted)",
                    fontFamily: "var(--font-mono)" }}>
                    {topicSelected}/{topicPrompts.length}
                  </span>
                  <span style={{ color: "var(--muted)", fontSize: 16 }}>{isActive ? "▾" : "▸"}</span>
                </div>
              </div>

              {/* Prompts */}
              {isActive && (
                <div style={{ borderTop: "1px solid var(--border)", padding: "4px 14px" }}>
                  <div style={{ fontSize: 11, color: "var(--faint)", padding: "6px 0 4px",
                    fontWeight: 500, letterSpacing: "0.06em" }}>
                    PROMPTS
                  </div>
                  {topicPrompts.map(p => (
                    <CheckRow key={p.id} checked={p.selected} onChange={() => togglePrompt(p.id)}>
                      {p.text}
                    </CheckRow>
                  ))}
                  <div style={{ padding: "8px 0" }}>
                    <button
                      style={{
                        fontSize: 12, color: "var(--muted)", background: "none",
                        border: "none", cursor: "pointer", padding: 0,
                      }}
                      onClick={() => toggleTopic(topic.id, topicSelected < topicPrompts.length)}
                    >
                      {topicSelected === topicPrompts.length ? "Deselect all" : "Select all"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {running && (
        <div style={{
          padding: "12px 16px", background: "var(--blue-bg)",
          border: "1px solid #bfdbfe", borderRadius: "var(--r)",
          fontSize: 13, color: "var(--blue)", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <Spinner size={14} />
          Running {selectedCount} prompts through AI models… this may take 1–3 minutes.
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between",
        borderTop: "1px solid var(--border)", paddingTop: 20 }}>
        <Btn variant="secondary" onClick={() => router.push("/topics")}>← Back</Btn>
        <Btn onClick={handleAnalyze} disabled={!selectedCount || running}>
          {running ? <><Spinner />&nbsp;Analysing…</> : `Analyse ${selectedCount} prompts →`}
        </Btn>
      </div>
    </div>
  );

  return <SplitLayout left={left} right={preview} />;
}
