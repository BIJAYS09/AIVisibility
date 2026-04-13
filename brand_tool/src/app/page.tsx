"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SplitLayout, StepBar, Input, Btn, Spinner, Card } from "@/components/ui";
import { storage } from "@/lib/storage";
import type { BrandProfile, CrawledPage } from "@/types";

export default function SetupPage() {
  const router = useRouter();
  const [url, setUrl]       = useState("");
  const [name, setName]     = useState("");
  const [location, setLoc]  = useState("Germany");
  const [lang, setLang]     = useState("English");

  const [crawling, setCrawling]   = useState(false);
  const [crawled, setCrawled]     = useState<CrawledPage[]>([]);
  const [profiling, setProfiling] = useState(false);
  const [error, setError]         = useState("");

  async function handleCrawl() {
    if (!url || !name) { setError("Please enter your brand URL and name."); return; }
    setError(""); setCrawling(true); setCrawled([]);

    try {
      const res = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Crawl failed");
      setCrawled(data.pages);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCrawling(false);
    }
  }

  async function handleNext() {
    if (!crawled.length) { setError("Please crawl your website first."); return; }
    setError(""); setProfiling(true);

    try {
      const res = await fetch("/api/generate-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages: crawled, brandName: name, url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Profile generation failed");

      const profile: BrandProfile = {
        url, name, location, language: lang,
        description: data.description ?? "",
        industry: data.industry ?? "",
        identity: data.identity ?? [],
        products: data.products ?? [],
        audience: { simple: 20, informed: 50, evaluative: 30 },
        crawledPages: crawled,
      };
      storage.setProfile(profile);
      router.push("/brand");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setProfiling(false);
    }
  }

  const preview = (
    <Card style={{ width: 400, minHeight: 300 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--muted)", marginBottom: 16,
        textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Crawl preview
      </div>
      {!crawled.length && !crawling && (
        <div style={{ color: "var(--faint)", fontSize: 13, textAlign: "center", paddingTop: 40 }}>
          Enter your URL and click Crawl to see discovered pages
        </div>
      )}
      {crawling && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
          gap: 12, paddingTop: 40, color: "var(--muted)", fontSize: 13 }}>
          <Spinner size={24} />
          Crawling your website…
        </div>
      )}
      {crawled.map((p, i) => (
        <div key={i} style={{
          padding: "10px 0",
          borderBottom: i < crawled.length - 1 ? "1px solid var(--border)" : "none",
          animation: "fadeUp 0.3s ease both",
          animationDelay: `${i * 40}ms`,
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>
            {p.title || "Untitled"}
          </div>
          <div style={{ fontSize: 11, color: "var(--faint)", fontFamily: "var(--font-mono)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.url}
          </div>
        </div>
      ))}
    </Card>
  );

  const left = (
    <div>
      <StepBar current={1} total={5} />
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, letterSpacing: "-0.02em" }}>
        Add project details
      </h1>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 28 }}>
        Enter your website URL — we&apos;ll crawl it and learn everything about your brand automatically.
      </p>

      <Input
        label="Brand URL"
        prefix="https://"
        value={url}
        onChange={setUrl}
        placeholder="yourwebsite.com"
      />
      <Input label="Brand name" value={name} onChange={setName} placeholder="Acme Inc." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Location</div>
          <select value={location} onChange={e => setLoc(e.target.value)} style={{
            width: "100%", padding: "9px 12px",
            border: "1px solid var(--border2)", borderRadius: "var(--r)",
            background: "var(--bg)", fontSize: 13, fontFamily: "var(--font-sans)",
            color: "var(--text)", appearance: "none",
          }}>
            {["Germany","United Kingdom","United States","France","Netherlands","Global"].map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Language</div>
          <select value={lang} onChange={e => setLang(e.target.value)} style={{
            width: "100%", padding: "9px 12px",
            border: "1px solid var(--border2)", borderRadius: "var(--r)",
            background: "var(--bg)", fontSize: 13, fontFamily: "var(--font-sans)",
            color: "var(--text)", appearance: "none",
          }}>
            {["English","German","French","Spanish","Dutch"].map(l => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div style={{
          padding: "10px 14px", background: "var(--red-bg)",
          border: "1px solid #fca5a5", borderRadius: "var(--r)",
          fontSize: 13, color: "var(--red)", marginBottom: 16,
        }}>{error}</div>
      )}

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Btn variant="secondary" onClick={handleCrawl} disabled={crawling || !url}>
          {crawling ? <><Spinner /> &nbsp;Crawling…</> : "Crawl website"}
        </Btn>
        {crawled.length > 0 && (
          <span style={{ fontSize: 12, color: "var(--green)", alignSelf: "center" }}>
            ✓ {crawled.length} pages found
          </span>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 20 }}>
        <div />
        <Btn onClick={handleNext} disabled={!crawled.length || profiling}>
          {profiling ? <><Spinner /> &nbsp;Analysing…</> : "Next →"}
        </Btn>
      </div>
    </div>
  );

  return <SplitLayout left={left} right={preview} />;
}
