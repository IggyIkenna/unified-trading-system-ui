"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

export interface ConfidenceBucketRow {
  bucket: string;
  count: number;
  pct: number;
}

interface SignalConfidenceHistogramProps {
  distribution: ConfidenceBucketRow[];
  highConfidenceHitRate: number;
  overallHitRate: number;
  className?: string;
}

export function SignalConfidenceHistogram({
  distribution,
  highConfidenceHitRate,
  overallHitRate,
  className,
}: SignalConfidenceHistogramProps) {
  const data = distribution.map((d) => ({
    ...d,
    label: d.bucket,
  }));

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Confidence Distribution
      </h4>
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
          >
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)" }}
              interval={0}
              angle={-12}
              textAnchor="end"
              height={48}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)" }}
              width={32}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                fontSize: "11px",
                color: "var(--foreground)",
              }}
              labelStyle={{ color: "var(--foreground)" }}
              itemStyle={{ color: "var(--muted-foreground)" }}
              formatter={(value: number, name: string) => [
                name === "count" ? value : `${value}%`,
                name === "count" ? "Signals" : "Share",
              ]}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]} fillOpacity={0.85}>
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={
                    i >= data.length - 2 ? "var(--chart-2)" : "var(--chart-4)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        High confidence (&gt;0.75) hit rate:{" "}
        <span className="text-emerald-400 font-medium tabular-nums">
          {highConfidenceHitRate}%
        </span>{" "}
        vs overall <span className="tabular-nums">{overallHitRate}%</span>
      </p>
    </div>
  );
}
