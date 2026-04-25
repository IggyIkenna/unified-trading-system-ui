"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { placeMockOrder } from "@/lib/api/mock-trade-ledger";
import { MOCK_PREDICTION_ARBS } from "@/lib/mocks/fixtures/predictions-data";
import { ARB_THRESHOLD_OPTIONS } from "@/lib/mocks/fixtures/sports-fixtures";
import { mock01 } from "@/lib/mocks/generators/deterministic";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import { Clock, Info, TrendingDown, Zap } from "lucide-react";
import * as React from "react";
import { calcArbStakes, fmtRelativeTime } from "./helpers";
import { VenueChip } from "./shared";
import type { ArbVenue, PredictionArbMarketType, PredictionArbOpportunity } from "./types";

// ─── Decay Bar ────────────────────────────────────────────────────────────────

function DecayBar({ detectedAt, maxLifetimeMs = 120_000 }: { detectedAt: string; maxLifetimeMs?: number }) {
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

  const colour = pct > 60 ? "#4ade80" : pct > 30 ? "#fbbf24" : "#f87171";
  return (
    <div className="h-0.5 w-full rounded-full bg-zinc-800 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{ width: `${pct}%`, background: colour }}
      />
    </div>
  );
}

// ─── Venue display ────────────────────────────────────────────────────────────

function VenueDisplay({ venue }: { venue: ArbVenue }) {
  return <VenueChip venue={venue} />;
}

function marketTypeBadge(t: PredictionArbMarketType) {
  switch (t) {
    case "football":
      return (
        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
          ⚽ Football
        </Badge>
      );
    case "crypto":
      return (
        <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">
          ₿ Crypto
        </Badge>
      );
    case "tradfi":
      return (
        <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
          📈 TradFi
        </Badge>
      );
  }
}

// ─── Active Arb Card ──────────────────────────────────────────────────────────

function ActiveArbCard({ arb, isNew }: { arb: PredictionArbOpportunity; isNew?: boolean }) {
  const { toast } = useToast();
  const totalStake = 10_000;
  const impliedSum = arb.legs.reduce((s, l) => s + 1 / l.odds, 0);
  const profit = totalStake / impliedSum - totalStake;

  const [s1, s2] = calcArbStakes(arb.legs[0].odds, arb.legs[1].odds, totalStake);

  function executeArb() {
    arb.legs.forEach((leg, i) => {
      placeMockOrder({
        client_id: "internal-trader",
        instrument_id: `ARB:${arb.id}:LEG${i + 1}`,
        venue: String(leg.venue),
        side: "buy",
        order_type: "limit",
        quantity: i === 0 ? s1 : s2,
        price: leg.odds,
        asset_group: "Prediction",
        lane: "predictions",
      });
    });
    toast({
      title: "Arb executed",
      description: `${arb.question} — ${formatPercent(arb.arbPct, 2)} locked in`,
    });
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border overflow-hidden flex flex-col gap-0 transition-all",
        "border-[#4ade80]/30 bg-[#0d140d]",
        isNew && "animate-in slide-in-from-top-3 duration-400",
      )}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4ade80]/60 to-transparent" />
      <DecayBar detectedAt={arb.detectedAt} />

      <div className="px-3 py-2.5 flex flex-col gap-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isNew && (
              <Badge className="text-[9px] bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/30 font-black uppercase tracking-widest">
                NEW
              </Badge>
            )}
            {marketTypeBadge(arb.marketType)}
          </div>
          <div className="text-right shrink-0">
            <span className="text-xl font-black text-[#4ade80] tabular-nums">+{formatPercent(arb.arbPct, 2)}</span>
          </div>
        </div>

        <p className="text-xs font-semibold leading-snug">{arb.question}</p>
        <p className="text-[10px] text-zinc-400">
          Outcome: <span className="text-zinc-200 font-medium">{arb.outcome}</span>
        </p>

        {/* Legs */}
        <div className="grid grid-cols-2 gap-2">
          {arb.legs.map((leg, i) => (
            <div key={i} className="rounded-lg border border-zinc-700/50 bg-zinc-900/60 p-2 space-y-1">
              <VenueDisplay venue={leg.venue} />
              <p className="text-sm font-bold tabular-nums text-white">{leg.oddsDisplay}</p>
              <p className="text-[10px] text-zinc-500">
                Stake: <span className="text-zinc-300 tabular-nums">${formatNumber(i === 0 ? s1 : s2, 0)}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Profit calc */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">Profit on $10K stake:</span>
          <span className="text-[#4ade80] font-bold tabular-nums">+${formatNumber(profit, 2)}</span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-600">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {fmtRelativeTime(arb.detectedAt)}
          </span>
          <Button
            size="sm"
            className="h-7 text-xs bg-[#4ade80]/20 hover:bg-[#4ade80]/30 text-[#4ade80] border border-[#4ade80]/30"
            onClick={executeArb}
          >
            <Zap className="size-3 mr-1" />
            Execute
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Closed Arb Card ──────────────────────────────────────────────────────────

function ClosedArbCard({ arb }: { arb: PredictionArbOpportunity }) {
  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-3 py-2 flex items-center justify-between gap-3 opacity-60">
      <div className="flex items-center gap-2 min-w-0">
        <TrendingDown className="size-3 text-zinc-600 shrink-0" />
        <p className="text-xs truncate text-zinc-400">{arb.question}</p>
        {marketTypeBadge(arb.marketType)}
      </div>
      <div className="flex items-center gap-3 shrink-0 text-[11px]">
        <span className="text-zinc-500 tabular-nums">{formatPercent(arb.arbPct, 2)}</span>
        <span className="text-zinc-600">{arb.decayedAt ? fmtRelativeTime(arb.decayedAt) : "closed"}</span>
      </div>
    </div>
  );
}

// ─── Live stream hook ─────────────────────────────────────────────────────────

function usePredictionArbStream(threshold: number) {
  const [arbs, setArbs] = React.useState<PredictionArbOpportunity[]>(MOCK_PREDICTION_ARBS);
  const [newIds, setNewIds] = React.useState<Set<string>>(new Set());
  const streamTickRef = React.useRef(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      streamTickRef.current += 1;
      const t = streamTickRef.current;
      setArbs((prev) => {
        // Age out active ones probabilistically
        const updated = prev.map((a) =>
          a.isActive && mock01(t, 301) < 0.1 ? { ...a, isActive: false, decayedAt: new Date().toISOString() } : a,
        );
        // Occasionally inject a new one
        if (mock01(t, 302) < 0.15) {
          const templates: PredictionArbOpportunity[] = [
            {
              id: `parb-live-${Date.now()}`,
              marketType: "crypto",
              question: "ETH > $3,400 in 24h",
              outcome: "YES",
              legs: [
                { venue: "polymarket", odds: 100 / 33, oddsDisplay: "33¢", suggestedStake: 3_300 },
                { venue: "kalshi", odds: 100 / 28, oddsDisplay: "28¢", suggestedStake: 2_800 },
              ],
              arbPct: 2.4,
              detectedAt: new Date().toISOString(),
              isActive: true,
            },
          ];
          const newArb = templates[0];
          setNewIds((ids) => new Set([...ids, newArb.id]));
          setTimeout(
            () =>
              setNewIds((ids) => {
                const next = new Set(ids);
                next.delete(newArb.id);
                return next;
              }),
            5000,
          );
          return [...updated, newArb];
        }
        return updated;
      });
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const filtered = arbs.filter((a) => a.arbPct >= threshold);
  return {
    active: filtered.filter((a) => a.isActive).sort((a, b) => b.arbPct - a.arbPct),
    closed: filtered.filter((a) => !a.isActive),
    newIds,
  };
}

// ─── Main Export ─────────────────────────────────────────────────────────────

type MarketTypeFilter = PredictionArbMarketType | "all";

export function ArbStreamTab() {
  const [threshold, setThreshold] = React.useState(1.5);
  const [marketTypeFilter, setMarketTypeFilter] = React.useState<MarketTypeFilter>("all");
  const { active, closed, newIds } = usePredictionArbStream(threshold);

  const filteredActive = active.filter((a) => marketTypeFilter === "all" || a.marketType === marketTypeFilter);
  const filteredClosed = closed.filter((a) => marketTypeFilter === "all" || a.marketType === marketTypeFilter);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Threshold */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Min arb:</span>
          <div className="flex items-center gap-0.5 rounded-md border border-zinc-800 bg-zinc-900/60 p-0.5">
            {ARB_THRESHOLD_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => setThreshold(t)}
                className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded transition-colors tabular-nums",
                  threshold === t ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                {t}%
              </button>
            ))}
          </div>
        </div>

        {/* Market type filter */}
        <div className="flex items-center gap-0.5 rounded-md border border-zinc-800 bg-zinc-900/60 p-0.5">
          {(["all", "football", "crypto", "tradfi"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setMarketTypeFilter(type)}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold rounded transition-colors capitalize",
                marketTypeFilter === type ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              {type === "all" ? "All" : type === "tradfi" ? "TradFi" : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-zinc-600">
          <Info className="size-3" />
          Refreshes every 8s · decay bar = time remaining before edge closes
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active arbs */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live Opportunities</span>
            {filteredActive.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-[#4ade80]">
                <span className="relative flex size-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-60" />
                  <span className="relative inline-flex rounded-full size-1.5 bg-[#4ade80]" />
                </span>
                {filteredActive.length} active
              </span>
            )}
          </div>

          {filteredActive.length === 0 ? (
            <Card className="bg-zinc-900/30 border-zinc-800">
              <CardContent className="py-10 text-center space-y-2">
                <Clock className="size-8 text-zinc-700 mx-auto" />
                <p className="text-xs text-zinc-600">No arbs above {threshold}% threshold</p>
                <p className="text-[10px] text-zinc-700">Stream re-checks every 8s</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredActive.map((arb) => (
                <ActiveArbCard key={arb.id} arb={arb} isNew={newIds.has(arb.id)} />
              ))}
            </div>
          )}
        </div>

        {/* Closed arbs */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Closed / Decayed</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>
          {filteredClosed.length === 0 ? (
            <p className="text-xs text-zinc-700 py-4 text-center">No closed arbs to show</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {filteredClosed.map((arb) => (
                <ClosedArbCard key={arb.id} arb={arb} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
