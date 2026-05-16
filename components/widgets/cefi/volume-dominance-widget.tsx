"use client";

import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useAssetGroupData } from "@/lib/hooks/use-asset-group-data";
import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface VolumeDominanceResponse {
  by_exchange: ReadonlyArray<{ name: string; volume_24h_usd: number; pct: number }>;
  by_chain: ReadonlyArray<{ name: string; volume_24h_usd: number; pct: number }>;
}

const COLOURS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"];

/** CMC-style volume dominance — pie/donut by exchange + by chain. */
export function VolumeDominanceWidget(_props: WidgetComponentProps) {
  const { data, isLoading } = useAssetGroupData<VolumeDominanceResponse>("volume-dominance", {
    assetGroup: "CEFI",
    staleTime: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Loading dominance…</div>
    );
  }
  return (
    <div className="h-full w-full p-2 grid grid-cols-2 gap-2">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80 mb-1">By exchange</span>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[...data.by_exchange]}
              dataKey="pct"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={60}
              innerRadius={30}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {data.by_exchange.map((_, idx) => (
                <Cell key={idx} fill={COLOURS[idx % COLOURS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => `${v.toFixed(1)}%`}
              contentStyle={{ fontSize: 10, padding: "4px 8px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80 mb-1">By chain</span>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[...data.by_chain]}
              dataKey="pct"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={60}
              innerRadius={30}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {data.by_chain.map((_, idx) => (
                <Cell key={idx} fill={COLOURS[idx % COLOURS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => `${v.toFixed(1)}%`}
              contentStyle={{ fontSize: 10, padding: "4px 8px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
