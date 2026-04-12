"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import type { CompetitorData } from "@/types";

const PALETTE = [
  "#6366f1","#34d399","#f59e0b","#f87171","#a78bfa","#38bdf8",
];

interface Props {
  data: CompetitorData;
  ownBrand: string;
}

export default function CompetitorBar({ data, ownBrand }: Props) {
  const brands = Object.keys(data);
  if (!brands.length) return null;

  // Collect all categories
  const cats = Array.from(
    new Set(brands.flatMap(b => Object.keys(data[b])))
  ).sort();

  // Build recharts rows: one per category
  const rows = cats.map(cat => {
    const row: Record<string, string | number> = { category: cat };
    brands.forEach(b => {
      row[b] = data[b][cat]?.mention_rate ?? 0;
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={rows} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="category"
          tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "var(--muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}
          axisLine={false} tickLine={false}
          tickFormatter={v => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            background: "var(--surface)", border: "1px solid var(--border2)",
            borderRadius: 8, fontSize: 12, fontFamily: "var(--font-mono)",
            color: "var(--text)",
          }}
          formatter={(v: number, name: string) => [`${v}%`, name]}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)", paddingTop: 16 }}
        />
        {brands.map((brand, i) => (
          <Bar
            key={brand} dataKey={brand} radius={[3, 3, 0, 0]}
            fill={brand === ownBrand ? "var(--accent2)" : PALETTE[i % PALETTE.length]}
            opacity={brand === ownBrand ? 1 : 0.55}
            maxBarSize={28}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
