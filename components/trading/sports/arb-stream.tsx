"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Zap, Clock, TrendingDown } from "lucide-react";
import type { ArbOpportunity } from "./types";
import { MOCK_ARB_STREAM } from "@/lib/mocks/fixtures/sports-data";
import { fmtOdds, fmtCurrency, fmtRelativeTime } from "./helpers";
import { ArbBadge, LeagueBadge } from "./shared";
import { useToast } from "@/hooks/use-toast";
import { mock01 } from "@/lib/mocks/generators/deterministic";
import { formatPercent } from "@/lib/utils/formatters";
import { isMockDataMode } from "@/lib/runtime/data-mode";

// ─── Decay timer for active arbs ─────────────────────────────────────────────
// Shows a countdown visual — arbs are time-sensitive

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

// ─── Live Arb Card ────────────────────────────────────────────────────────────

function ActiveArbCard({ arb, isNew }: { arb: ArbOpportunity; isNew?: boolean }) {
  const { toast } = useToast();
  const [placing, setPlacing] = React.useState(false);

  // Profit per £10k total stake
  const totalStake = 10_000;
  const impliedSum = arb.legs.reduce((s, l) => s + 1 / l.odds, 0);
  const profit = totalStake / impliedSum - totalStake;

  const handlePlaceBet = React.useCallback(async () => {
    const isMock = typeof window !== "undefined" && isMockDataMode();
    if (isMock) {
      toast({
        title: "Arb placed",
        description: `${arb.fixtureName} · ${arb.market}`,
        duration: 3000,
      });
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch("/api/sports/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fixture: arb.fixtureName,
          market: arb.market,
          arbPct: arb.arbPct,
          legs: arb.legs.map((l) => ({
            outcome: l.outcome,
            odds: l.odds,
            bookmaker: l.bookmaker,
            stake: l.suggestedStake,
          })),
          totalStake,
        }),
      });

      if (res.ok) {
        toast({
          title: "Arb placed",
          description: `${arb.fixtureName} · ${arb.market}`,
          duration: 3000,
        });
      } else {
        toast({
          title: "Bet failed",
          description: `Server returned ${res.status}`,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Bet failed",
        description: message,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setPlacing(false);
    }
  }, [arb, toast, totalStake]);

  return (
    <div
      className={cn(
        "relative rounded-xl border overflow-hidden flex flex-col gap-0 transition-all",
        "border-[#4ade80]/30 bg-[#0d140d]",
        isNew && "animate-in slide-in-from-top-3 duration-400",
      )}
    >
      {/* Glow strip */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#4ade80]/60 to-transparent" />

      {/* Decay bar */}
      <DecayBar detectedAt={arb.detectedAt} />

      <div className="p-3 flex flex-col gap-2">
        {/* Header */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <LeagueBadge league={arb.league} />
          <ArbBadge pct={arb.arbPct} className="text-sm" />
          <span className="ml-auto text-[9px] text-zinc-500">{fmtRelativeTime(arb.detectedAt)}</span>
        </div>

        <div className="text-xs font-bold text-white">{arb.fixtureName}</div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{arb.market}</div>

        {/* Two legs */}
        <div className="flex flex-col gap-1">
          {arb.legs.map((leg, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-zinc-900/80 border border-zinc-800 px-2.5 py-1.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[9px] text-zinc-500 w-4 shrink-0">{i + 1}.</span>
                <span className="text-[11px] text-zinc-200 truncate">{leg.outcome}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-sm font-black text-white tabular-nums">{fmtOdds(leg.odds)}</span>
                <span className="text-[9px] text-zinc-500">{leg.bookmaker}</span>
                <span className="text-[10px] text-zinc-400 tabular-nums">{fmtCurrency(leg.suggestedStake)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Profit row + CTA */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#4ade80]/15">
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Guaranteed profit</span>
            <span className="text-sm font-black text-[#4ade80] tabular-nums">+{fmtCurrency(profit)}</span>
            <span className="text-[9px] text-zinc-600">per {fmtCurrency(totalStake)} staked</span>
          </div>
          <Button
            size="sm"
            className="ml-auto h-8 px-3 font-black text-xs bg-[#4ade80] text-black hover:bg-[#4ade80]/90"
            disabled={placing}
            onClick={() => void handlePlaceBet()}
          >
            <Zap className="size-3 mr-1" />
            {placing ? "Placing..." : "Place Arb"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Closed Arb Card ──────────────────────────────────────────────────────────

function ClosedArbCard({ arb }: { arb: ArbOpportunity }) {
  return (
    <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/20 p-2.5 flex flex-col gap-1.5 opacity-50">
      <div className="flex items-center gap-1.5">
        <LeagueBadge league={arb.league} />
        <span className="text-[10px] text-zinc-500 font-bold">{arb.fixtureName}</span>
        <span className="ml-auto inline-flex items-center gap-1 text-[9px] text-zinc-600">
          <TrendingDown className="size-2.5" />
          CLOSED
        </span>
      </div>
      <div className="flex items-center justify-between text-[10px] text-zinc-600">
        <span>{arb.market}</span>
        <span className="tabular-nums">was +{formatPercent(arb.arbPct, 2)}</span>
        {arb.decayedAt && <span>{fmtRelativeTime(arb.decayedAt)}</span>}
      </div>
    </div>
  );
}

// ─── Arb Stream Hook ──────────────────────────────────────────────────────────

function useArbStream(threshold: number) {
  const [arbs, setArbs] = React.useState<ArbOpportunity[]>(MOCK_ARB_STREAM);
  const [newIds, setNewIds] = React.useState<Set<string>>(new Set());
  const streamTickRef = React.useRef(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      streamTickRef.current += 1;
      const t = streamTickRef.current;
      setArbs((prev) => {
        const decayed = prev.filter((a) => !a.isActive);
        if (decayed.length === 0) return prev;
        const pickIdx = Math.min(decayed.length - 1, Math.floor(mock01(t, 401) * decayed.length));
        const target = decayed[pickIdx];
        const reactivated: ArbOpportunity = {
          ...target,
          isActive: true,
          detectedAt: new Date().toISOString(),
          decayedAt: undefined,
          arbPct: Math.max(0.5, target.arbPct + (mock01(t, 402) - 0.5) * 0.5),
        };
        setNewIds((ids) => new Set([...ids, reactivated.id]));
        setTimeout(
          () =>
            setNewIds((ids) => {
              const n = new Set(ids);
              n.delete(reactivated.id);
              return n;
            }),
          2000,
        );
        return prev.map((a) => (a.id === target.id ? reactivated : a));
      });
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const filtered = arbs.filter((a) => a.arbPct >= threshold);
  return {
    active: filtered.filter((a) => a.isActive).sort((a, b) => b.arbPct - a.arbPct),
    closed: filtered
      .filter((a) => !a.isActive)
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()),
    newIds,
  };
}

// ─── Arb Stream ───────────────────────────────────────────────────────────────

interface ArbStreamProps {
  arbThreshold: number;
}

export function ArbStream({ arbThreshold }: ArbStreamProps) {
  const { active, closed, newIds } = useArbStream(arbThreshold);

  return (
    <div className="flex flex-col h-full overflow-auto p-3 gap-2.5">
      {/* Active section */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Live Opportunities</span>
        {active.length > 0 && (
          <span className="flex items-center gap-1 text-[9px] text-[#4ade80]">
            <span className="relative flex size-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-60" />
              <span className="relative inline-flex rounded-full size-1.5 bg-[#4ade80]" />
            </span>
            {active.length} active
          </span>
        )}
      </div>

      {active.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-zinc-600">
          <Clock className="size-8 opacity-30" />
          <span className="text-xs text-center">
            No arbs above {arbThreshold}%<br />
            threshold right now
          </span>
          <span className="text-[10px] text-zinc-700">Stream re-checks every 8s</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {active.map((arb) => (
            <ActiveArbCard key={arb.id} arb={arb} isNew={newIds.has(arb.id)} />
          ))}
        </div>
      )}

      {/* Closed section */}
      {closed.length > 0 && (
        <>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Closed</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>
          <div className="flex flex-col gap-1.5">
            {closed.map((arb) => (
              <ClosedArbCard key={arb.id} arb={arb} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
