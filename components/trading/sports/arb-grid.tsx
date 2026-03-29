"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Lock, TrendingUp, Zap } from "lucide-react";
import * as React from "react";
import { calcArbPct, calcArbStakes, fmtCurrency, fmtOdds } from "./helpers";
import { MOCK_ODDS } from "@/lib/mocks/fixtures/sports-data";
import { BOOKMAKERS, SUBSCRIBED_BOOKMAKERS } from "@/lib/mocks/fixtures/sports-fixtures";
import { ArbBadge, LeagueBadge } from "./shared";
import type { Bookmaker, Fixture, OddsMarket } from "./types";
import { formatPercent } from "@/lib/utils/formatters";

// ─── Bookmaker header abbreviations ──────────────────────────────────────────

const BM_LABEL_OVERRIDES: Partial<Record<Bookmaker, string>> = {
  bet365: "B365",
  pinnacle: "PINN",
  unibet: "UNI",
  marathon: "MARA",
  betfair_exchange: "BFX",
  polymarket: "POLY",
};

const BM_COLOUR_OVERRIDES: Partial<Record<Bookmaker, string>> = {
  bet365: "#00a651",
  pinnacle: "#e31837",
  unibet: "#00b4e5",
  marathon: "#ff6600",
  betfair_exchange: "#ffb80c",
  polymarket: "#0038ff",
};

function bookmakerLabel(bm: Bookmaker): string {
  return BM_LABEL_OVERRIDES[bm] ?? bm.replace(/_/g, " ").slice(0, 4).toUpperCase();
}

function bookmakerColour(bm: Bookmaker): string {
  return BM_COLOUR_OVERRIDES[bm] ?? "#71717a";
}

// ─── Arb Popover ─────────────────────────────────────────────────────────────

interface ArbCellPopoverProps {
  fixtureId: string;
  fixtureName: string;
  outcome: string;
  odds: number;
  bookmaker: Bookmaker;
  market: OddsMarket;
  arbPct: number;
  counterOutcome: string;
  counterOdds: number;
  counterBm: Bookmaker;
}

function ArbCellPopover({
  fixtureName,
  outcome,
  odds,
  bookmaker,
  market,
  arbPct,
  counterOutcome,
  counterOdds,
  counterBm,
}: ArbCellPopoverProps) {
  const { toast } = useToast();
  const totalStake = 10_000;
  const [stake1, stake2] = calcArbStakes(odds, counterOdds, totalStake);
  const profit = odds * stake1 - totalStake;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="absolute inset-0 flex items-center justify-center">
          <Zap className="size-2.5 text-[#4ade80]" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-0 border-[#4ade80]/30 bg-[#0d140d] shadow-2xl shadow-[#4ade80]/10"
        side="top"
        align="center"
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#4ade80]/20">
          <ArbBadge pct={arbPct} />
          <span className="text-xs font-bold text-white truncate">{fixtureName}</span>
        </div>

        <div className="p-3 flex flex-col gap-2.5">
          {/* Market */}
          <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{market}</p>

          {/* Two legs */}
          <div className="flex flex-col gap-1.5">
            {[
              { out: outcome, od: odds, bm: bookmaker },
              { out: counterOutcome, od: counterOdds, bm: counterBm },
            ].map((leg, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-zinc-900/80 border border-zinc-800 px-2.5 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-2 rounded-full shrink-0" style={{ background: bookmakerColour(leg.bm) }} />
                  <span className="text-[10px] text-zinc-300 truncate">{leg.out}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-black text-white tabular-nums">{fmtOdds(leg.od)}</span>
                  <span className="text-[9px] text-zinc-500">{bookmakerLabel(leg.bm)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Stake split */}
          <div className="flex flex-col gap-1 rounded-lg bg-[#4ade80]/5 border border-[#4ade80]/20 px-2.5 py-2">
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-400">Stake {bookmakerLabel(bookmaker)}</span>
              <span className="text-white tabular-nums">{fmtCurrency(stake1)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-400">Stake {bookmakerLabel(counterBm)}</span>
              <span className="text-white tabular-nums">{fmtCurrency(stake2)}</span>
            </div>
            <div className="flex justify-between text-xs font-black border-t border-[#4ade80]/20 pt-1 mt-0.5">
              <span className="text-[#4ade80]">Guaranteed profit</span>
              <span className="text-[#4ade80] tabular-nums">+{fmtCurrency(profit)}</span>
            </div>
          </div>

          <Button
            size="sm"
            className="h-8 text-xs font-black w-full bg-[#4ade80] text-black hover:bg-[#4ade80]/90"
            onClick={() => {
              toast({
                title: "Arb order placed",
                description: `${fixtureName} · ${market}`,
                duration: 3000,
              });
            }}
          >
            <Zap className="size-3 mr-1.5" />
            Place Arb — {formatPercent(arbPct, 2)} locked in
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Grid Cell ────────────────────────────────────────────────────────────────

type OddsEntry = { odds: number; movement: string; isLocked: boolean };

interface GridCellProps {
  fixtureId: string;
  fixtureName: string;
  bookmaker: Bookmaker;
  market: OddsMarket;
  outcome: string;
  outcomesMap: Map<string, Map<Bookmaker, OddsEntry>>;
  arbThreshold: number;
}

function GridCell({ fixtureId, fixtureName, bookmaker, market, outcome, outcomesMap, arbThreshold }: GridCellProps) {
  const isLocked = !SUBSCRIBED_BOOKMAKERS.includes(bookmaker);

  if (isLocked) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-700">
        <Lock className="size-3" />
      </div>
    );
  }

  const entry = outcomesMap.get(outcome)?.get(bookmaker);
  if (!entry) {
    return <span className="text-zinc-700 text-[10px]">—</span>;
  }

  // Best odds across unlocked bookmakers for this outcome
  const allForOutcome = Array.from(outcomesMap.get(outcome)?.entries() ?? []).filter(([, e]) => !e.isLocked);
  const bestOdds = Math.max(...allForOutcome.map(([, e]) => e.odds));
  const isBest = entry.odds === bestOdds && allForOutcome.length > 1;

  // Check for arb with any other outcome
  let arbInfo: {
    pct: number;
    counterOutcome: string;
    counterOdds: number;
    counterBm: Bookmaker;
  } | null = null;
  for (const [otherOutcome, bmMap] of outcomesMap.entries()) {
    if (otherOutcome === outcome) continue;
    for (const [bm, other] of bmMap.entries()) {
      if (other.isLocked) continue;
      const pct = calcArbPct(entry.odds, other.odds);
      if (pct >= arbThreshold && (!arbInfo || pct > arbInfo.pct)) {
        arbInfo = {
          pct,
          counterOutcome: otherOutcome,
          counterOdds: other.odds,
          counterBm: bm,
        };
      }
    }
  }

  const movement = entry.movement as string;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center h-full rounded-md transition-all gap-0.5 px-1",
        arbInfo
          ? "bg-[#4ade80]/10 border border-[#4ade80]/30 text-[#4ade80]"
          : isBest
            ? "bg-[#22d3ee]/8 border border-[#22d3ee]/20"
            : "hover:bg-zinc-800/40",
      )}
    >
      <span
        className={cn(
          "text-xs font-black tabular-nums",
          arbInfo ? "text-[#4ade80]" : isBest ? "text-[#22d3ee]" : "text-zinc-300",
        )}
      >
        {fmtOdds(entry.odds)}
      </span>
      {movement !== "STABLE" && (
        <span className={cn("text-[8px] font-bold", movement === "UP" ? "text-[#4ade80]" : "text-red-400")}>
          {movement === "UP" ? "▲" : "▼"}
        </span>
      )}
      {arbInfo && (
        <ArbCellPopover
          fixtureId={fixtureId}
          fixtureName={fixtureName}
          outcome={outcome}
          odds={entry.odds}
          bookmaker={bookmaker}
          market={market}
          arbPct={arbInfo.pct}
          counterOutcome={arbInfo.counterOutcome}
          counterOdds={arbInfo.counterOdds}
          counterBm={arbInfo.counterBm}
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

export function ArbGrid({ fixtures, selectedMarket, arbThreshold }: ArbGridProps) {
  type OddsEntry2 = { odds: number; movement: string; isLocked: boolean };
  const byFixture = new Map<string, Map<string, Map<Bookmaker, OddsEntry2>>>();

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
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-600">
        <TrendingUp className="size-8 opacity-30" />
        <span className="text-sm">No odds available for the selected market</span>
      </div>
    );
  }

  return (
    <div className="overflow-auto h-full">
      <table className="w-full border-collapse min-w-[560px]">
        {/* Bookmaker header */}
        <thead className="sticky top-0 z-20 bg-[#0a0a0b]">
          <tr className="border-b border-zinc-800">
            <th className="text-left px-3 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-500 w-36 sticky left-0 bg-[#0a0a0b]">
              Fixture / Outcome
            </th>
            {BOOKMAKERS.map((bm) => {
              const locked = !SUBSCRIBED_BOOKMAKERS.includes(bm);
              return (
                <th key={bm} className="px-1 py-2 text-center w-16">
                  <div className="flex flex-col items-center gap-0.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: locked ? "#3f3f46" : bookmakerColour(bm) }}
                    />
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase tracking-wider",
                        locked ? "text-zinc-700" : "text-zinc-400",
                      )}
                    >
                      {bookmakerLabel(bm)}
                    </span>
                    {locked && <Lock className="size-2 text-zinc-700" />}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {fixturesWithOdds.map((fixture) => {
            const marketOdds = byFixture.get(fixture.id)!;
            const outcomes = Array.from(marketOdds.keys());

            return (
              <React.Fragment key={fixture.id}>
                {/* Fixture divider row */}
                <tr>
                  <td
                    colSpan={BOOKMAKERS.length + 1}
                    className="px-3 py-2 border-t border-b border-zinc-800/80 bg-zinc-900/30 sticky left-0"
                  >
                    <div className="flex items-center gap-2">
                      <LeagueBadge league={fixture.league} />
                      <span className="text-xs font-bold text-white">
                        {fixture.home.name} <span className="text-zinc-600">vs</span> {fixture.away.name}
                      </span>
                    </div>
                  </td>
                </tr>

                {/* Outcome rows */}
                {outcomes.map((outcome, idx) => (
                  <tr
                    key={outcome}
                    className={cn(
                      "border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors",
                      idx % 2 === 0 ? "bg-zinc-950/40" : "",
                    )}
                  >
                    <td className="px-3 py-1.5 sticky left-0 bg-inherit z-10 max-w-[144px]">
                      <span className="text-[11px] text-zinc-400 truncate block">{outcome}</span>
                    </td>
                    {BOOKMAKERS.map((bm) => (
                      <td key={bm} className="px-1 py-1 text-center h-10">
                        <GridCell
                          fixtureId={fixture.id}
                          fixtureName={`${fixture.home.name} vs ${fixture.away.name}`}
                          bookmaker={bm}
                          market={selectedMarket}
                          outcome={outcome}
                          outcomesMap={marketOdds}
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
      <div className="flex items-center gap-4 px-3 py-2 border-t border-zinc-800 text-[9px] text-zinc-600 bg-[#0a0a0b] sticky bottom-0">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-[#22d3ee]/20 border border-[#22d3ee]/30 shrink-0" />
          Best available odds
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-[#4ade80]/20 border border-[#4ade80]/30 shrink-0" />
          Arb opportunity — click for stake split
        </span>
        <span className="flex items-center gap-1.5">
          <Lock className="size-2.5" />
          Subscription required
        </span>
      </div>
    </div>
  );
}
