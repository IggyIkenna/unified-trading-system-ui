"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import type { ArbOpportunity } from "./types";
import { MOCK_ARB_STREAM } from "./mock-data";
import { fmtOdds, fmtCurrency, fmtRelativeTime } from "./helpers";
import { ArbBadge, LeagueBadge, SectionHeader } from "./shared";
import { useToast } from "@/hooks/use-toast";

// ─── Arb Card ─────────────────────────────────────────────────────────────────

function ArbCard({ arb, isNew }: { arb: ArbOpportunity; isNew?: boolean }) {
  const { toast } = useToast();
  const profit =
    arb.legs[0].suggestedReturn /
      (1 / arb.legs[0].odds + 1 / arb.legs[1].odds) -
    (arb.legs[0].suggestedStake + arb.legs[1].suggestedStake);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-3 transition-all",
        arb.isActive
          ? "bg-card hover:bg-card/80 border-border"
          : "bg-muted/20 border-border/40 opacity-60",
        isNew && "animate-in slide-in-from-top-2 duration-300",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <LeagueBadge league={arb.league} />
        <span className="text-xs font-semibold truncate flex-1">
          {arb.fixtureName}
        </span>
        <ArbBadge pct={arb.arbPct} />
      </div>

      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>{arb.market}</span>
        <span>·</span>
        <span>{fmtRelativeTime(arb.detectedAt)}</span>
        {!arb.isActive && arb.decayedAt && (
          <>
            <span>·</span>
            <span className="text-destructive/70">
              Closed {fmtRelativeTime(arb.decayedAt)}
            </span>
          </>
        )}
      </div>

      {/* Legs */}
      <div className="flex flex-col gap-1">
        {arb.legs.map((leg, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground w-3">{i + 1}.</span>
              <span className="font-medium">{leg.outcome}</span>
              <span className="text-[10px] text-muted-foreground">
                @ {leg.bookmaker}
              </span>
            </div>
            <div className="flex items-center gap-2 tabular-nums">
              <span className="font-bold">{fmtOdds(leg.odds)}</span>
              <span className="text-muted-foreground text-[10px]">
                {fmtCurrency(leg.suggestedStake)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Profit summary + action */}
      {arb.isActive && (
        <div className="flex items-center justify-between pt-1 border-t">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground">
              Guaranteed return
            </span>
            <span className="text-xs font-bold text-emerald-500">
              +{fmtCurrency(Math.abs(profit))}
            </span>
          </div>
          <Button
            size="sm"
            className="h-7 text-xs px-3"
            onClick={() => {
              toast({
                title: "Arb order placed",
                description: `${arb.fixtureName} — ${arb.market}`,
                duration: 3000,
              });
            }}
          >
            <Zap className="size-3 mr-1" />
            Place Arb
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Arb Stream Hook ──────────────────────────────────────────────────────────
// Simulates a live arb stream: every 8s, re-activates a decayed arb briefly.

function useArbStream(threshold: number) {
  const [arbs, setArbs] = React.useState<ArbOpportunity[]>(MOCK_ARB_STREAM);
  const [newIds, setNewIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setArbs((prev) => {
        const decayed = prev.filter((a) => !a.isActive);
        if (decayed.length === 0) return prev;
        // Randomly re-activate one decayed arb momentarily
        const target = decayed[Math.floor(Math.random() * decayed.length)];
        const reactivated: ArbOpportunity = {
          ...target,
          isActive: true,
          detectedAt: new Date().toISOString(),
          decayedAt: undefined,
          arbPct: target.arbPct + (Math.random() - 0.5) * 0.3,
        };
        setNewIds((ids) => new Set([...ids, reactivated.id]));
        setTimeout(() => {
          setNewIds((ids) => {
            const next = new Set(ids);
            next.delete(reactivated.id);
            return next;
          });
        }, 2000);
        return prev.map((a) => (a.id === target.id ? reactivated : a));
      });
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  const filtered = arbs.filter((a) => a.arbPct >= threshold);
  const active = filtered
    .filter((a) => a.isActive)
    .sort((a, b) => b.arbPct - a.arbPct);
  const closed = filtered
    .filter((a) => !a.isActive)
    .sort(
      (a, b) =>
        new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
    );

  return { active, closed, newIds };
}

// ─── Arb Stream ───────────────────────────────────────────────────────────────

interface ArbStreamProps {
  arbThreshold: number;
}

export function ArbStream({ arbThreshold }: ArbStreamProps) {
  const { active, closed, newIds } = useArbStream(arbThreshold);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="p-3 flex flex-col gap-2">
        {/* Active arbs */}
        <SectionHeader
          title="Active Arbs"
          count={active.length}
          action={
            active.length === 0 ? undefined : (
              <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span className="relative flex size-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500" />
                </span>
                Live
              </span>
            )
          }
        />

        {active.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
            No active arbs above {arbThreshold}% threshold
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {active.map((arb) => (
              <ArbCard key={arb.id} arb={arb} isNew={newIds.has(arb.id)} />
            ))}
          </div>
        )}

        {/* Closed arbs */}
        {closed.length > 0 && (
          <>
            <SectionHeader
              title="Closed Arbs"
              count={closed.length}
              className="mt-2"
            />
            <div className="flex flex-col gap-2">
              {closed.map((arb) => (
                <ArbCard key={arb.id} arb={arb} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
