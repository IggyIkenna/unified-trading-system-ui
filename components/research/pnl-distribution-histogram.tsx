"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import type { PnlBucket } from "@/lib/backtest-analytics-types";

interface PnlDistributionHistogramProps {
  buckets: PnlBucket[];
  avgProfitPct: number;
  avgLossPct: number;
  className?: string;
}

export function PnlDistributionHistogram({
  buckets,
  avgProfitPct,
  avgLossPct,
  className,
}: PnlDistributionHistogramProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={buckets}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <XAxis
              dataKey="bucket"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "12px",
                color: "var(--foreground)",
              }}
              labelStyle={{ color: "var(--foreground)" }}
              itemStyle={{ color: "var(--muted-foreground)" }}
            />
            <ReferenceLine
              x={buckets.findIndex((b) => b.min_pct >= 0) - 0.5}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {buckets.map((b) => (
                <Cell
                  key={b.bucket}
                  fill={
                    b.max_pct <= 0 ? "var(--destructive)" : "var(--chart-2)"
                  }
                  fillOpacity={0.75}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-red-500" />
          Avg Loss: {avgLossPct}%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-500" />
          Avg Profit: +{avgProfitPct}%
        </span>
      </div>
    </div>
  );
}
