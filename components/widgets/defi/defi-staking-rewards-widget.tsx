"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, DollarSign, Clock } from "lucide-react";
import { toast } from "sonner";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useDeFiData } from "./defi-data-context";
import { formatNumber } from "@/lib/utils/formatters";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function daysUntil(iso: string): number {
  const now = new Date();
  const target = new Date(iso);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export function DeFiStakingRewardsWidget(_props: WidgetComponentProps) {
  const { stakingRewards, claimReward, claimAndSellReward, rewardPnl } = useDeFiData();

  // 0.6 Loading: DeFiDataContext is synchronous (mock) — isLoading is structurally absent.
  // React.Suspense in widget-wrapper.tsx handles any async boundary above this widget.

  // 0.8 Error: context does not expose an error field; WidgetErrorBoundary in widget-wrapper.tsx
  // catches thrown errors. Guard against unexpected nullish data here.
  if (!stakingRewards || !rewardPnl) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-muted-foreground">Failed to load staking rewards data.</p>
      </div>
    );
  }

  // 0.7 Empty state: no rewards tracked yet.
  if (stakingRewards.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-xs text-muted-foreground">No staking rewards available.</p>
      </div>
    );
  }

  const totalAccrued = stakingRewards.reduce((sum, r) => sum + r.accrued_value_usd, 0);
  const totalClaimed = stakingRewards.reduce((sum, r) => sum + r.claimed_amount, 0);
  const totalSold = stakingRewards.reduce((sum, r) => sum + r.sold_value_usd, 0);

  return (
    <div className="space-y-3 p-1">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border bg-muted/30 p-2 text-center">
          <p className="text-[10px] text-muted-foreground">Accrued</p>
          <p className="font-mono text-sm font-bold text-amber-400">${formatNumber(totalAccrued, 2)}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-2 text-center">
          <p className="text-[10px] text-muted-foreground">Claimed</p>
          <p className="font-mono text-sm font-bold text-blue-400">{formatNumber(totalClaimed, 2)}</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-2 text-center">
          <p className="text-[10px] text-muted-foreground">Sold</p>
          <p className="font-mono text-sm font-bold text-emerald-400">${formatNumber(totalSold, 2)}</p>
        </div>
      </div>

      {/* Per-token reward cards */}
      {stakingRewards.map((reward) => {
        const hasAccrued = reward.accrued_amount > 0;
        const days = daysUntil(reward.next_payout);

        return (
          <div key={reward.token} className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="size-4 text-amber-400" />
                <span className="text-sm font-medium">{reward.token} Rewards</span>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {reward.frequency}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Accrued</span>
                <span className="font-mono">
                  {hasAccrued ? (
                    <>
                      {formatNumber(reward.accrued_amount, 2)} {reward.token}{" "}
                      <span className="text-muted-foreground">(${formatNumber(reward.accrued_value_usd, 2)})</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">--</span>
                  )}
                </span>
              </div>
              {reward.claimed_amount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Claimed</span>
                  <span className="font-mono text-blue-400">
                    {formatNumber(reward.claimed_amount, 2)} {reward.token}
                  </span>
                </div>
              )}
              {reward.sold_amount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Sold</span>
                  <span className="font-mono text-emerald-400">
                    {formatNumber(reward.sold_amount, 2)} {reward.token} (${formatNumber(reward.sold_value_usd, 2)})
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" />
                  {reward.token === "ETHFI" ? "Next airdrop" : "Next payout"}
                </span>
                <span className="font-mono">
                  {formatDate(reward.next_payout)} <span className="text-muted-foreground">({days}d)</span>
                </span>
              </div>
            </div>

            {hasAccrued && (
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs h-7"
                  onClick={() => {
                    claimReward(reward.token);
                    toast.success("Reward claimed", {
                      description: `Claimed ${formatNumber(reward.accrued_amount, 2)} ${reward.token} (mock).`,
                    });
                  }}
                >
                  <Gift className="size-3 mr-1" />
                  Claim
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    claimAndSellReward(reward.token);
                    toast.success("Claimed & sold", {
                      description: `Claimed and sold ${formatNumber(reward.accrued_amount, 2)} ${reward.token} for $${formatNumber(reward.accrued_value_usd, 2)} (mock).`,
                    });
                  }}
                >
                  <DollarSign className="size-3 mr-1" />
                  Claim & Sell
                </Button>
              </div>
            )}
          </div>
        );
      })}

      {/* Reward P&L summary */}
      <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Reward P&L Attribution</p>
        {Object.entries(rewardPnl).map(([key, factor]) => (
          <div key={key} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{factor.label}</span>
            <span className={`font-mono ${factor.amount > 0 ? "text-emerald-400" : "text-muted-foreground"}`}>
              {factor.amount > 0 ? `+$${formatNumber(factor.amount, 0)}` : "$0"}
            </span>
          </div>
        ))}
        <div className="border-t border-border/40 pt-1 flex items-center justify-between text-xs font-medium">
          <span>Total Reward P&L</span>
          <span className="font-mono text-emerald-400">
            +$
            {formatNumber(
              Object.values(rewardPnl).reduce((s, f) => s + f.amount, 0),
              0,
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
