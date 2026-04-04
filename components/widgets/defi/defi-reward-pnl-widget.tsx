"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useDeFiData } from "./defi-data-context";
import { formatNumber } from "@/lib/utils/formatters";

const FACTOR_COLORS: Record<string, string> = {
  staking_yield: "bg-emerald-500",
  restaking_reward: "bg-blue-500",
  seasonal_reward: "bg-violet-500",
  reward_unrealised: "bg-amber-500",
};

export function DeFiRewardPnlWidget(_props: WidgetComponentProps) {
  const { rewardPnl } = useDeFiData();

  const total = Object.values(rewardPnl).reduce((s, f) => s + f.amount, 0);
  const maxAmount = Math.max(...Object.values(rewardPnl).map((f) => f.amount), 1);

  return (
    <div className="space-y-3 p-1">
      {/* Total */}
      <div className="rounded-lg border bg-muted/30 p-3 text-center">
        <p className="text-xs text-muted-foreground">Total Reward P&L</p>
        <p className={cn("text-2xl font-mono font-bold", total > 0 ? "text-emerald-400" : "text-muted-foreground")}>
          {total > 0 ? "+" : ""}${formatNumber(total, 0)}
        </p>
      </div>

      {/* Waterfall bars */}
      <div className="space-y-2">
        {Object.entries(rewardPnl).map(([key, factor]) => {
          const barWidth = maxAmount > 0 ? (factor.amount / maxAmount) * 100 : 0;
          return (
            <div key={key} className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{factor.label}</span>
                <span className={cn("font-mono", factor.amount > 0 ? "text-emerald-400" : "text-muted-foreground")}>
                  {factor.amount > 0 ? `+$${formatNumber(factor.amount, 0)}` : "$0"}
                </span>
              </div>
              <div className="h-3 bg-muted/30 rounded overflow-hidden">
                <div
                  className={cn("h-full rounded transition-all", FACTOR_COLORS[key] ?? "bg-muted")}
                  style={{ width: `${Math.max(barWidth, factor.amount > 0 ? 3 : 0)}%`, opacity: 0.7 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Breakdown summary */}
      <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground pt-1">
        {Object.entries(FACTOR_COLORS).map(([key, color]) => {
          const factor = rewardPnl[key as keyof typeof rewardPnl];
          if (!factor) return null;
          return (
            <span key={key} className="flex items-center gap-1">
              <span className={cn("size-2 rounded-full", color)} />
              {key.replace(/_/g, " ")}
            </span>
          );
        })}
      </div>
    </div>
  );
}
