"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SplitLayout, StepBar, Btn, Tag, Spinner, Card,
  SectionLabel, SectionSub,
} from "@/components/ui";
import { storage } from "@/lib/storage";
import type { BrandProfile } from "@/types";

function TagInput({
  values, onChange,
}: {
  values: string[]; onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState("");
  function add() {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  }
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {values.map(v => (
          <Tag key={v} label={v} onRemove={() => onChange(values.filter(x => x !== v))} />
        ))}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          background: "var(--bg3)", border: "1px dashed var(--border2)",
          borderRadius: 20, padding: "3px 10px", fontSize: 13, cursor: "pointer",
        }}
          onClick={() => document.getElementById("tag-input")?.focus()}
        >
          Add +
        </span>
      </div>
      <input
        id="tag-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        placeholder="Type and press Enter"
        style={{
          width: "100%", padding: "7px 10px", fontSize: 13,
          border: "1px solid var(--border)", borderRadius: "var(--r)",
          background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-sans)",
          outline: "none",
        }}
      />
    </div>
  );
}

function AudienceSlider({
  label, sub, value, onChange,
}: {
  label: string; sub: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 0", borderBottom: "1px solid var(--border)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 18, background: "var(--green)",
          borderRadius: 9, transition: "background 0.2s",
          display: "flex", alignItems: "center",
          padding: "2px 3px", cursor: "pointer",
          justifyContent: value > 0 ? "flex-end" : "flex-start",
        }} onClick={() => onChange(value > 0 ? 0 : 30)}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff" }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>{sub}</div>
        </div>
      </div>
      <input
        type="number" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: 56, padding: "4px 8px", fontSize: 13, textAlign: "right",
          border: "1px solid var(--border)", borderRadius: "var(--r)",
          fontFamily: "var(--font-mono)", background: "var(--bg)", color: "var(--text)",
        }}
      />
    </div>
  );
}

export default function BrandPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const p = storage.getProfile();
    if (!p) { router.push("/"); return; }
    setProfile(p);
  }, [router]);

  function update(patch: Partial<BrandProfile>) {
    if (!profile) return;
    const next = { ...profile, ...patch };
    setProfile(next);
  }

  async function handleNext() {
    if (!profile) return;
    storage.setProfile(profile);
    setGenerating(true);

    try {
      const res = await fetch("/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Topic generation failed");
      storage.setTopics(data.topics);
      router.push("/topics");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setGenerating(false);
    }
  }

  if (!profile) return null;

  const profilePreview = (
    <Card style={{ width: 420 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
        paddingBottom: 16, borderBottom: "1px solid var(--border)",
      }}>
        <div style={{
          width: 28, height: 28, background: "var(--green)",
          borderRadius: "50%", flexShrink: 0,
        }} />
        <span style={{ fontWeight: 600, fontSize: 15 }}>{profile.name}</span>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 500,
          letterSpacing: "0.08em", marginBottom: 4 }}>DESCRIPTION</div>
        <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>
          {profile.description || "—"}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 500,
          letterSpacing: "0.08em", marginBottom: 6 }}>INDUSTRY</div>
        <div style={{ fontSize: 13 }}>{profile.industry || "—"}</div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 500,
          letterSpacing: "0.08em", marginBottom: 6 }}>BRAND IDENTITY</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {profile.identity.map(t => <Tag key={t} label={t} />)}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, color: "var(--faint)", fontWeight: 500,
          letterSpacing: "0.08em", marginBottom: 6 }}>PRODUCTS & SERVICES</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {profile.products.map(t => <Tag key={t} label={t} />)}
        </div>
      </div>
    </Card>
  );

  const left = (
    <div>
      <StepBar current={2} total={5} />
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, letterSpacing: "-0.02em" }}>
        Verify brand profile
      </h1>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
        We extracted this from your website. Edit anything that&apos;s off.
      </p>

      <SectionLabel>Description</SectionLabel>
      <SectionSub>Context of your brand.</SectionSub>
      <textarea
        value={profile.description}
        onChange={e => update({ description: e.target.value })}
        rows={3}
        style={{
          width: "100%", padding: "10px 12px", fontSize: 13,
          border: "1px solid var(--border2)", borderRadius: "var(--r)",
          resize: "vertical", fontFamily: "var(--font-sans)",
          background: "var(--bg)", color: "var(--text)", marginBottom: 16,
          outline: "none",
        }}
      />

      <SectionLabel>Industry</SectionLabel>
      <SectionSub>Industry of your brand.</SectionSub>
      <input
        value={profile.industry}
        onChange={e => update({ industry: e.target.value })}
        style={{
          width: "100%", padding: "9px 12px", fontSize: 13,
          border: "1px solid var(--border2)", borderRadius: "var(--r)",
          fontFamily: "var(--font-sans)", background: "var(--bg)",
          color: "var(--text)", marginBottom: 16, outline: "none",
        }}
      />

      <SectionLabel>Brand identity</SectionLabel>
      <SectionSub>The name of your project.</SectionSub>
      <div style={{ marginBottom: 16 }}>
        <TagInput values={profile.identity} onChange={v => update({ identity: v })} />
      </div>

      <SectionLabel>Products & Services</SectionLabel>
      <SectionSub>What your brand offers.</SectionSub>
      <div style={{ marginBottom: 20 }}>
        <TagInput values={profile.products} onChange={v => update({ products: v })} />
      </div>

      <SectionLabel>Audience distribution</SectionLabel>
      <SectionSub>Define your audience (percentages). Used to weight prompt generation.</SectionSub>
      <div style={{ marginBottom: 20 }}>
        <AudienceSlider
          label="Simple recommendation seeker"
          sub="Casual, non-technical. Seeks a unique name."
          value={profile.audience.simple}
          onChange={v => update({ audience: { ...profile.audience, simple: v } })}
        />
        <AudienceSlider
          label="Informed shopper"
          sub="Knows product, asks about features."
          value={profile.audience.informed}
          onChange={v => update({ audience: { ...profile.audience, informed: v } })}
        />
        <AudienceSlider
          label="Evaluative researcher"
          sub="Weighs tradeoffs, explores a decision space."
          value={profile.audience.evaluative}
          onChange={v => update({ audience: { ...profile.audience, evaluative: v } })}
        />
        <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 6, fontFamily: "var(--font-mono)" }}>
          Total: {profile.audience.simple + profile.audience.informed + profile.audience.evaluative}%
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between",
        borderTop: "1px solid var(--border)", paddingTop: 20 }}>
        <Btn variant="secondary" onClick={() => router.push("/")}>← Back</Btn>
        <Btn onClick={handleNext} disabled={generating}>
          {generating ? <><Spinner />&nbsp;Generating topics…</> : "Next →"}
        </Btn>
      </div>
    </div>
  );

  return <SplitLayout left={left} right={profilePreview} />;
}
