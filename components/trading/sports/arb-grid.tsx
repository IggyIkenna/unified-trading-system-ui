"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Lock, Zap } from "lucide-react";
import type { Fixture, OddsMarket, Bookmaker } from "./types";
import { MOCK_ODDS } from "./mock-data";
import {
  BOOKMAKERS,
  SUBSCRIBED_BOOKMAKERS,
  ODDS_MARKETS,
} from "./mock-fixtures";
import { calcArbPct, calcArbStakes, fmtOdds, fmtCurrency } from "./helpers";
import { LeagueBadge, OddsMovementIcon, LockedCell, ArbBadge } from "./shared";
import { useToast } from "@/hooks/use-toast";

// ─── Per-Cell Arb Popover ─────────────────────────────────────────────────────

interface ArbCellPopoverProps {
  fixtureId: string;
  fixtureName: string;
  outcome: string;
  odds: number;
  bookmaker: Bookmaker;
  market: OddsMarket;
}

function ArbCellPopover({
  fixtureId,
  fixtureName,
  outcome,
  odds,
  bookmaker,
  market,
}: ArbCellPopoverProps) {
  const { toast } = useToast();

  // Find the best counter-leg odds from any subscribed bookmaker
  const allOdds = MOCK_ODDS.filter(
    (o) =>
      o.fixtureId === fixtureId &&
      o.market === market &&
      !o.isLocked &&
      o.bookmaker !== bookmaker,
  );

  let bestArb: {
    bookmaker: Bookmaker;
    outcome: string;
    odds: number;
    arbPct: number;
  } | null = null;
  for (const counter of allOdds) {
    const pct = calcArbPct(odds, counter.odds);
    if (pct > 0 && (!bestArb || pct > bestArb.arbPct)) {
      bestArb = {
        bookmaker: counter.bookmaker,
        outcome: counter.outcome,
        odds: counter.odds,
        arbPct: pct,
      };
    }
  }

  if (!bestArb) return null;

  const totalStake = 10_000;
  const [stake1, stake2] = calcArbStakes(odds, bestArb.odds, totalStake);
  const profit = totalStake / (1 / odds + 1 / bestArb.odds) - totalStake;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-0.5 text-emerald-400 hover:text-emerald-300">
          <Zap className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" side="top">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ArbBadge pct={bestArb.arbPct} />
            <span className="text-xs font-semibold">{fixtureName}</span>
          </div>
          <div className="text-xs text-muted-foreground">{market}</div>
          <div className="flex flex-col gap-1 border rounded p-2 bg-muted/20">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{outcome}</span>
              <span className="font-semibold">
                {fmtOdds(odds)} @ {bookmaker}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{bestArb.outcome}</span>
              <span className="font-semibold">
                {fmtOdds(bestArb.odds)} @ {bestArb.bookmaker}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stake {bookmaker}:</span>
              <span>{fmtCurrency(stake1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Stake {bestArb.bookmaker}:
              </span>
              <span>{fmtCurrency(stake2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-emerald-500 border-t pt-1 mt-1">
              <span>Guaranteed profit:</span>
              <span>+{fmtCurrency(profit)}</span>
            </div>
          </div>
          <Button
            size="sm"
            className="h-7 text-xs w-full"
            onClick={() => {
              toast({
                title: "Arb order queued",
                description: `${outcome} + ${bestArb!.outcome}`,
                duration: 3000,
              });
            }}
          >
            Place Arb
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Grid Cell ────────────────────────────────────────────────────────────────

interface GridCellProps {
  fixtureId: string;
  fixtureName: string;
  bookmaker: Bookmaker;
  market: OddsMarket;
  outcome: string;
  allOddsForMarket: Map<
    string,
    Map<Bookmaker, { odds: number; movement: string; isLocked: boolean }>
  >;
  arbThreshold: number;
}

function GridCell({
  fixtureId,
  fixtureName,
  bookmaker,
  market,
  outcome,
  allOddsForMarket,
  arbThreshold,
}: GridCellProps) {
  const isLocked = !SUBSCRIBED_BOOKMAKERS.includes(bookmaker);

  if (isLocked) {
    return <LockedCell className="h-full" />;
  }

  const entry = allOddsForMarket.get(outcome)?.get(bookmaker);
  if (!entry) {
    return <span className="text-[10px] text-muted-foreground/40">—</span>;
  }

  // Best odds for this outcome across all unlocked bookmakers
  const bestForOutcome = Math.max(
    ...Array.from(allOddsForMarket.get(outcome)?.values() ?? [])
      .filter((e) => !e.isLocked)
      .map((e) => e.odds),
  );
  const isBest = entry.odds === bestForOutcome;

  // Check if this cell forms part of an arb (any two outcomes from this market)
  let isArbCell = false;
  for (const [otherOutcome, bmMap] of allOddsForMarket.entries()) {
    if (otherOutcome === outcome) continue;
    for (const [, other] of bmMap.entries()) {
      if (!other.isLocked) {
        const pct = calcArbPct(entry.odds, other.odds);
        if (pct >= arbThreshold) {
          isArbCell = true;
          break;
        }
      }
    }
    if (isArbCell) break;
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1 text-xs tabular-nums h-full rounded transition-colors",
        isBest && "font-bold",
        isArbCell &&
          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
      )}
    >
      <span>{fmtOdds(entry.odds)}</span>
      {isBest && !isArbCell && (
        <span className="size-1 rounded-full bg-primary shrink-0" />
      )}
      {isArbCell && (
        <ArbCellPopover
          fixtureId={fixtureId}
          fixtureName={fixtureName}
          outcome={outcome}
          odds={entry.odds}
          bookmaker={bookmaker}
          market={market}
        />
      )}
    </div>
  );
}

// ─── Arb Grid ─────────────────────────────────────────────────────────────────

interface ArbGridProps {
  fixtures: Fixture[];
  selectedMarket: OddsMarket;
  arbThreshold: number;
}

export function ArbGrid({
  fixtures,
  selectedMarket,
  arbThreshold,
}: ArbGridProps) {
  // Build nested map: fixtureId → outcome → bookmaker → { odds, movement, isLocked }
  type OddsEntry = { odds: number; movement: string; isLocked: boolean };
  const byFixture = new Map<string, Map<string, Map<Bookmaker, OddsEntry>>>();

  for (const odd of MOCK_ODDS.filter((o) => o.market === selectedMarket)) {
    if (!byFixture.has(odd.fixtureId)) byFixture.set(odd.fixtureId, new Map());
    const byOutcome = byFixture.get(odd.fixtureId)!;
    if (!byOutcome.has(odd.outcome)) byOutcome.set(odd.outcome, new Map());
    byOutcome.get(odd.outcome)!.set(odd.bookmaker, {
      odds: odd.odds,
      movement: odd.movement,
      isLocked: odd.isLocked,
    });
  }

  const fixturesWithOdds = fixtures.filter((f) => byFixture.has(f.id));

  if (fixturesWithOdds.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No odds available for selected market and filters
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-xs min-w-[600px]">
        <thead>
          <tr className="border-b bg-muted/20">
            <th className="text-left px-2 py-1.5 font-medium text-muted-foreground w-32 sticky left-0 bg-background z-10">
              Fixture / Outcome
            </th>
            {BOOKMAKERS.map((bm) => (
              <th
                key={bm}
                className="px-2 py-1.5 font-medium text-muted-foreground text-center"
              >
                <div className="flex flex-col items-center gap-0.5">
                  {!SUBSCRIBED_BOOKMAKERS.includes(bm) && (
                    <Lock className="size-2.5 text-muted-foreground/40" />
                  )}
                  <span
                    className={cn(
                      !SUBSCRIBED_BOOKMAKERS.includes(bm) &&
                        "text-muted-foreground/40",
                    )}
                  >
                    {bm === "betfair_exchange"
                      ? "Betfair"
                      : bm === "polymarket"
                        ? "Polymarket"
                        : bm}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fixturesWithOdds.map((fixture) => {
            const marketOdds = byFixture.get(fixture.id)!;
            const outcomes = Array.from(marketOdds.keys());

            return (
              <React.Fragment key={fixture.id}>
                {/* Fixture header row */}
                <tr className="border-b bg-muted/10">
                  <td
                    colSpan={BOOKMAKERS.length + 1}
                    className="px-2 py-1.5 sticky left-0"
                  >
                    <div className="flex items-center gap-1.5">
                      <LeagueBadge league={fixture.league} />
                      <span className="font-semibold text-xs">
                        {fixture.home.shortName} vs {fixture.away.shortName}
                      </span>
                      <span className="text-muted-foreground">
                        {fixture.home.name} vs {fixture.away.name}
                      </span>
                    </div>
                  </td>
                </tr>
                {/* Outcome rows */}
                {outcomes.map((outcome) => (
                  <tr
                    key={outcome}
                    className="border-b border-border/30 hover:bg-muted/10"
                  >
                    <td className="px-2 py-1 text-muted-foreground sticky left-0 bg-background z-10 max-w-[128px] truncate">
                      {outcome}
                    </td>
                    {BOOKMAKERS.map((bm) => (
                      <td key={bm} className="px-1 py-1 text-center h-8">
                        <GridCell
                          fixtureId={fixture.id}
                          fixtureName={`${fixture.home.name} vs ${fixture.away.name}`}
                          bookmaker={bm}
                          market={selectedMarket}
                          outcome={outcome}
                          allOddsForMarket={marketOdds}
                          arbThreshold={arbThreshold}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center gap-3 px-2 py-2 border-t text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-primary shrink-0" />
          Best available
        </span>
        <span className="flex items-center gap-1">
          <span className="size-3 rounded bg-emerald-500/20 border border-emerald-500/30 shrink-0" />
          Arb opportunity
        </span>
        <span className="flex items-center gap-1">
          <Lock className="size-2.5" />
          Subscription required
        </span>
      </div>
    </div>
  );
}
