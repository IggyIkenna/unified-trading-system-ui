"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useDeFiData } from "./defi-data-context";
import { formatNumber } from "@/lib/utils/formatters";

/**
 * Factor-key → bar colour palette.
 *
 * This widget is archetype-agnostic: the factor list is delivered by the
 * strategy instance (`instance.pnl_factors[]`). The palette is a presentation
 * detail keyed on the canonical factor identifier so, across archetypes,
 * repeated factor kinds (`staking_yield`, `funding`, `borrow_cost`, `fees`)
 * stay colour-stable. Unknown keys fall back to a neutral bar.
 */
const FACTOR_COLOR_PALETTE: Record<string, string> = {
  // Staking family
  staking_yield: "bg-emerald-500",
  staking: "bg-emerald-500",
  restaking_reward: "bg-blue-500",
  seasonal_reward: "bg-violet-500",
  reward_unrealised: "bg-amber-500",
  // Lending family
  supply_apy: "bg-emerald-500",
  incentive_rewards: "bg-blue-500",
  fee_earnings: "bg-cyan-500",
  // Basis / carry family
  funding: "bg-emerald-500",
  basis_spread: "bg-blue-500",
  trading: "bg-violet-500",
  exec_alpha: "bg-cyan-500",
  // Cost rows
  fees: "bg-rose-500",
  borrow_cost: "bg-rose-500",
  il_realised: "bg-rose-500",
  // Leverage / LP
  leverage_factor: "bg-fuchsia-500",
  fees_earned: "bg-emerald-500",
};

function factorColor(key: string): string {
  return FACTOR_COLOR_PALETTE[key] ?? "bg-muted";
}

export function DeFiRewardPnlWidget(_props: WidgetComponentProps) {
  const { rewardPnl } = useDeFiData();

  // Error guard — context value missing
  if (!rewardPnl) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-rose-400">Failed to load reward P&amp;L data.</p>
      </div>
    );
  }

  // Loading guard — no factors available yet
  if (rewardPnl.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-muted-foreground">Loading reward data…</p>
      </div>
    );
  }

  const total = rewardPnl.reduce((s, f) => s + f.amount, 0);
  const maxAbs = Math.max(...rewardPnl.map((f) => Math.abs(f.amount)), 1);

  // Empty state — all factors are zero
  if (rewardPnl.every((f) => f.amount === 0)) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-muted-foreground">No reward P&amp;L to display.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-1">
      {/* Total */}
      <div className="rounded-lg border bg-muted/30 p-3 text-center">
        <p className="text-xs text-muted-foreground">Total Reward P&L</p>
        <p
          className={cn(
            "text-2xl font-mono font-bold",
            total > 0 ? "text-emerald-400" : total < 0 ? "text-rose-400" : "text-muted-foreground",
          )}
        >
          {total > 0 ? "+" : ""}${formatNumber(total, 0)}
        </p>
      </div>

      {/* Waterfall bars */}
      <div className="space-y-2">
        {rewardPnl.map((factor) => {
          const barWidth = maxAbs > 0 ? (Math.abs(factor.amount) / maxAbs) * 100 : 0;
          const isNegative = factor.amount < 0;
          const amountClass =
            factor.amount > 0 ? "text-emerald-400" : isNegative ? "text-rose-400" : "text-muted-foreground";
          const formatted =
            factor.amount > 0
              ? `+$${formatNumber(factor.amount, 0)}`
              : isNegative
                ? `-$${formatNumber(Math.abs(factor.amount), 0)}`
                : "$0";
          return (
            <div key={factor.key} className="space-y-0.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{factor.label}</span>
                <span className={cn("font-mono", amountClass)}>{formatted}</span>
              </div>
              <div className="h-3 bg-muted/30 rounded overflow-hidden">
                <div
                  className={cn("h-full rounded transition-all", factorColor(factor.key))}
                  style={{ width: `${Math.max(barWidth, factor.amount !== 0 ? 3 : 0)}%`, opacity: 0.7 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Breakdown legend */}
      <div className="flex items-center gap-3 flex-wrap text-micro text-muted-foreground pt-1">
        {rewardPnl.map((factor) => (
          <span key={factor.key} className="flex items-center gap-1">
            <span className={cn("size-2 rounded-full", factorColor(factor.key))} />
            {factor.key.replace(/_/g, " ")}
          </span>
        ))}
      </div>
    </div>
  );
}
