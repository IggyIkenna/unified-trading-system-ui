"use client";

import { cn } from "@/lib/utils";
import { Database, Globe, Layers, LineChart, TrendingUp } from "lucide-react";
import * as React from "react";

export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  Database,
  Layers,
  Globe,
  LineChart,
};

export function StatusBadge({ status }: { status: string }) {
  const styles = {
    live: "bg-emerald-400/10 text-emerald-400 border-emerald-400/30",
    active: "bg-cyan-400/10 text-cyan-400 border-cyan-400/30",
    ready: "bg-amber-400/10 text-amber-400 border-amber-400/30",
  };
  return (
    <span className={cn("px-2 py-0.5 text-xs font-semibold rounded border", styles[status as keyof typeof styles])}>
      {status.toUpperCase()}
    </span>
  );
}

export function MarketNode({
  market,
}: {
  market: {
    icon: string;
    name: string;
    sub: string;
    color: string;
    count?: string;
    detail?: string;
  };
}) {
  const Icon = iconMap[market.icon] || Globe;
  const colorStyles = {
    cyan: "border-cyan-400/40 bg-cyan-400/5",
    green: "border-emerald-400/30 bg-emerald-400/5",
    violet: "border-violet-400/30 bg-violet-400/5",
    amber: "border-amber-400/30 bg-amber-400/5",
    rose: "border-rose-400/30 bg-rose-400/5",
  };
  const textColorStyles = {
    cyan: "text-cyan-400",
    green: "text-emerald-400",
    violet: "text-violet-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  };
  return (
    <div className={cn("rounded-xl border p-4 text-center", colorStyles[market.color as keyof typeof colorStyles])}>
      <Icon className="size-6 mx-auto mb-2 text-foreground" />
      <div className="font-semibold text-sm">{market.name}</div>
      {market.count && (
        <div className={cn("text-lg font-bold mt-1", textColorStyles[market.color as keyof typeof textColorStyles])}>
          {market.count}
        </div>
      )}
      <div className="text-xs text-muted-foreground mt-1">{market.sub}</div>
      {market.detail && <div className="text-[10px] text-muted-foreground/70 mt-1">{market.detail}</div>}
    </div>
  );
}
