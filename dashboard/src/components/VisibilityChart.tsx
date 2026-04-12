"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { ScorePoint } from "@/types";

interface Props { data: ScorePoint[]; }

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as ScorePoint;
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border2)",
      borderRadius: 8, padding: "12px 16px", fontSize: 12,
      fontFamily: "var(--font-mono)",
    }}>
      <div style={{ color: "var(--muted)", marginBottom: 8 }}>{label}</div>
      <div style={{ color: "var(--accent2)" }}>mention rate {d.mention_rate}%</div>
      <div style={{ color: "var(--text)" }}>
        {d.mentioned} / {d.total_prompts} prompts
      </div>
      <div style={{
        color: d.avg_sentiment > 0.05 ? "var(--positive)"
             : d.avg_sentiment < -0.05 ? "var(--negative)" : "var(--neutral)",
        marginTop: 4,
      }}>
        sentiment {d.avg_sentiment > 0 ? "+" : ""}{d.avg_sentiment.toFixed(3)}
      </div>
    </div>
  );
}

export default function VisibilityChart({ data }: Props) {
  if (!data.length) return (
    <div style={{ height: 240, display: "flex", alignItems: "center",
      justifyContent: "center", color: "var(--muted)", fontSize: 13,
      fontFamily: "var(--font-mono)" }}>
      no data yet — run a collection first
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
          axisLine={false} tickLine={false}
          tickFormatter={v => v.slice(5)} // MM-DD
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
          axisLine={false} tickLine={false}
          tickFormatter={v => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={50} stroke="var(--border2)" strokeDasharray="4 4" />
        <Line
          type="monotone" dataKey="mention_rate"
          stroke="var(--accent2)" strokeWidth={2}
          dot={{ fill: "var(--accent)", r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "var(--accent2)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
