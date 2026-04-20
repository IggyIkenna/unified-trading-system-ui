"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Clock, TrendingDown } from "lucide-react";
import type {
  PredictionArbOpportunity,
  PredictionArbMarketType,
  ArbVenue,
} from "@/components/trading/predictions/types";
import { fmtRelativeTime, calcArbStakes } from "@/components/trading/predictions/helpers";
import { VenueChip } from "@/components/trading/predictions/shared";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

export function PredDecayBar({ detectedAt, maxLifetimeMs = 120_000 }: { detectedAt: string; maxLifetimeMs?: number }) {
  const [pct, setPct] = React.useState(100);
  React.useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - new Date(detectedAt).getTime();
      const remaining = Math.max(0, 1 - elapsed / maxLifetimeMs);
      setPct(remaining * 100);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [detectedAt, maxLifetimeMs]);

  const colour = pct > 60 ? "var(--pnl-positive)" : pct > 30 ? "var(--status-warning)" : "var(--pnl-negative)";
  return (
    <div className="h-0.5 w-full rounded-full bg-zinc-800 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{ width: `${pct}%`, background: colour }}
      />
    </div>
  );
}

function VenueDisplay({ venue }: { venue: ArbVenue }) {
  return <VenueChip venue={venue} />;
}

function marketTypeBadge(t: PredictionArbMarketType) {
  switch (t) {
    case "football":
      return (
        <Badge variant="outline" className="text-micro border-emerald-500/30 text-emerald-400">
          ⚽ Football
        </Badge>
      );
    case "crypto":
      return (
        <Badge variant="outline" className="text-micro border-blue-500/30 text-blue-400">
          ₿ Crypto
        </Badge>
      );
    case "tradfi":
      return (
        <Badge variant="outline" className="text-micro border-purple-500/30 text-purple-400">
          📈 TradFi
        </Badge>
      );
  }
}

export function PredActiveArbCard({
  arb,
  isNew,
  onExecute,
}: {
  arb: PredictionArbOpportunity;
  isNew?: boolean;
  onExecute: (arbId: string) => void;
}) {
  const totalStake = 10_000;
  const impliedSum = arb.legs.reduce((s, l) => s + 1 / l.odds, 0);
  const profit = totalStake / impliedSum - totalStake;
  const [s1, s2] = calcArbStakes(arb.legs[0].odds, arb.legs[1].odds, totalStake);

  return (
    <div
      className={cn(
        "relative rounded-xl border overflow-hidden flex flex-col gap-0 transition-all",
        "border-[var(--pnl-positive)]/30 bg-[#0d140d]",
        isNew && "animate-in slide-in-from-top-3 duration-400",
      )}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--pnl-positive)]/60 to-transparent" />
      <PredDecayBar detectedAt={arb.detectedAt} />

      <div className="px-3 py-2.5 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isNew && (
              <Badge className="text-nano bg-[var(--pnl-positive)]/20 text-[var(--pnl-positive)] border border-[var(--pnl-positive)]/30 font-black uppercase tracking-widest">
                NEW
              </Badge>
            )}
            {marketTypeBadge(arb.marketType)}
          </div>
          <div className="text-right shrink-0">
            <span className="text-xl font-black text-[var(--pnl-positive)] tabular-nums">
              +{formatPercent(arb.arbPct, 2)}
            </span>
          </div>
        </div>

        <p className="text-xs font-semibold leading-snug">{arb.question}</p>
        <p className="text-micro text-zinc-400">
          Outcome: <span className="text-zinc-200 font-medium">{arb.outcome}</span>
        </p>

        <div className="grid grid-cols-2 gap-2">
          {arb.legs.map((leg, i) => (
            <div key={i} className="rounded-lg border border-zinc-700/50 bg-zinc-900/60 p-2 space-y-1">
              <VenueDisplay venue={leg.venue} />
              <p className="text-sm font-bold tabular-nums text-white">{leg.oddsDisplay}</p>
              <p className="text-micro text-zinc-500">
                Stake: <span className="text-zinc-300 tabular-nums">${formatNumber(i === 0 ? s1 : s2, 0)}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-caption">
          <span className="text-zinc-500">Profit on $10K stake:</span>
          <span className="text-[var(--pnl-positive)] font-bold tabular-nums">+${formatNumber(profit, 2)}</span>
        </div>

        <div className="flex items-center justify-between text-micro text-zinc-600">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {fmtRelativeTime(arb.detectedAt)}
          </span>
          <Button
            size="sm"
            className="h-7 text-xs bg-[var(--pnl-positive)]/20 hover:bg-[var(--pnl-positive)]/30 text-[var(--pnl-positive)] border border-[var(--pnl-positive)]/30"
            onClick={() => onExecute(arb.id)}
          >
            <Zap className="size-3 mr-1" />
            Execute
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PredClosedArbCard({ arb }: { arb: PredictionArbOpportunity }) {
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-3 py-2 flex items-center justify-between gap-3 opacity-60">
      <div className="flex items-center gap-2 min-w-0">
        <TrendingDown className="size-3 text-zinc-600 shrink-0" />
        <p className="text-xs truncate text-zinc-400">{arb.question}</p>
        {marketTypeBadge(arb.marketType)}
      </div>
      <div className="flex items-center gap-3 shrink-0 text-caption">
        <span className="text-zinc-500 tabular-nums">{formatPercent(arb.arbPct, 2)}</span>
        <span className="text-zinc-600">{arb.decayedAt ? fmtRelativeTime(arb.decayedAt) : "closed"}</span>
      </div>
    </div>
  );
}
