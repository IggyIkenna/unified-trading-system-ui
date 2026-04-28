"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, DollarSign, Target } from "lucide-react";
import type { PredictionPosition, SettlementOutcome } from "./types";
import { MOCK_POSITIONS } from "@/lib/mocks/fixtures/predictions-data";
import { fmtUsdPrecise, fmtRelativeTime } from "./helpers";
import { VenueChip } from "./shared";
import { formatPercent } from "@/lib/utils/formatters";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pnlColour(pnl: number) {
  return pnl > 0 ? "text-emerald-400" : pnl < 0 ? "text-red-400" : "text-muted-foreground";
}

function settlementBadge(outcome: SettlementOutcome) {
  switch (outcome) {
    case "won":
      return (
        <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
          Won
        </Badge>
      );
    case "lost":
      return (
        <Badge variant="outline" className="text-[10px] border-red-500/40 text-red-400">
          Lost
        </Badge>
      );
    case "void":
      return (
        <Badge variant="outline" className="text-[10px] border-zinc-600 text-zinc-400">
          Void
        </Badge>
      );
  }
}

function categoryLabel(cat: string) {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

// ─── KPI Row ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <Card className="bg-card border-border/50">
      <CardContent className="p-4 space-y-1">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p
          className={cn(
            "text-xl font-bold tabular-nums",
            positive === true && "text-emerald-400",
            positive === false && "text-red-400",
          )}
        >
          {value}
        </p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Position Row ─────────────────────────────────────────────────────────────

function OpenPositionRow({ pos }: { pos: PredictionPosition }) {
  const priceChange = pos.currentPricePerShare - pos.entryPricePerShare;
  return (
    <tr className="border-b border-border/30 hover:bg-muted/20 transition-colors text-xs">
      <td className="py-3 pr-3 max-w-[220px]">
        <p className="font-medium leading-snug line-clamp-2">{pos.marketQuestion}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <VenueChip venue={pos.venue} />
          <Badge variant="outline" className="text-[9px] border-zinc-700/50 text-zinc-500">
            {categoryLabel(pos.category)}
          </Badge>
        </div>
      </td>
      <td className="py-3 pr-3 text-center">
        <Badge
          variant="outline"
          className={cn(
            "font-bold text-[10px]",
            pos.side === "yes" ? "border-emerald-500/40 text-emerald-400" : "border-red-500/40 text-red-400",
          )}
        >
          {pos.side.toUpperCase()}: {pos.outcome}
        </Badge>
      </td>
      <td className="py-3 pr-3 tabular-nums text-right">{pos.sharesHeld.toLocaleString()}</td>
      <td className="py-3 pr-3 tabular-nums text-right">
        <div className="flex flex-col items-end">
          <span>{pos.entryPricePerShare}¢</span>
          <span
            className={cn(
              "text-[10px]",
              priceChange > 0 ? "text-emerald-400" : priceChange < 0 ? "text-red-400" : "text-zinc-500",
            )}
          >
            now {pos.currentPricePerShare}¢
          </span>
        </div>
      </td>
      <td className="py-3 pr-3 tabular-nums text-right">{fmtUsdPrecise(pos.totalStaked)}</td>
      <td className={cn("py-3 pr-3 tabular-nums text-right font-semibold", pnlColour(pos.unrealisedPnl))}>
        {pos.unrealisedPnl > 0 ? "+" : ""}
        {fmtUsdPrecise(pos.unrealisedPnl)}
      </td>
      <td className="py-3 text-right text-muted-foreground">
        {pos.resolutionDate ? (
          <span className="font-mono text-[10px]">{pos.resolutionDate}</span>
        ) : (
          <span className="text-zinc-600">-</span>
        )}
      </td>
    </tr>
  );
}

function SettledPositionRow({ pos }: { pos: PredictionPosition }) {
  return (
    <tr className="border-b border-border/30 hover:bg-muted/20 transition-colors text-xs opacity-80">
      <td className="py-3 pr-3 max-w-[220px]">
        <p className="font-medium leading-snug line-clamp-2">{pos.marketQuestion}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <VenueChip venue={pos.venue} />
          <Badge variant="outline" className="text-[9px] border-zinc-700/50 text-zinc-500">
            {categoryLabel(pos.category)}
          </Badge>
        </div>
      </td>
      <td className="py-3 pr-3 text-center">
        <Badge
          variant="outline"
          className={cn(
            "font-bold text-[10px]",
            pos.side === "yes" ? "border-emerald-500/40 text-emerald-400" : "border-red-500/40 text-red-400",
          )}
        >
          {pos.side.toUpperCase()}: {pos.outcome}
        </Badge>
      </td>
      <td className="py-3 pr-3 text-center">{pos.settlementOutcome && settlementBadge(pos.settlementOutcome)}</td>
      <td className="py-3 pr-3 tabular-nums text-right">{pos.entryPricePerShare}¢</td>
      <td className="py-3 pr-3 tabular-nums text-right">{fmtUsdPrecise(pos.totalStaked)}</td>
      <td className={cn("py-3 pr-3 tabular-nums text-right font-semibold", pnlColour(pos.realisedPnl ?? 0))}>
        {(pos.realisedPnl ?? 0) > 0 ? "+" : ""}
        {fmtUsdPrecise(pos.realisedPnl ?? 0)}
      </td>
      <td className="py-3 text-right text-muted-foreground text-[10px] font-mono">
        {pos.settledAt ? fmtRelativeTime(pos.settledAt) : "-"}
      </td>
    </tr>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export function PortfolioTab() {
  const [settledOpen, setSettledOpen] = React.useState(false);

  const openPositions = MOCK_POSITIONS.filter((p) => p.status === "open");
  const settledPositions = MOCK_POSITIONS.filter((p) => p.status === "settled");

  const totalStaked = openPositions.reduce((s, p) => s + p.totalStaked, 0);
  const totalUnrealisedPnl = openPositions.reduce((s, p) => s + p.unrealisedPnl, 0);
  const totalRealisedPnl = settledPositions.reduce((s, p) => s + (p.realisedPnl ?? 0), 0);
  const winCount = settledPositions.filter((p) => p.settlementOutcome === "won").length;
  const winRate = settledPositions.length > 0 ? (winCount / settledPositions.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Open Positions"
          value={String(openPositions.length)}
          sub={`${settledPositions.length} settled`}
        />
        <KpiCard label="Total Staked" value={fmtUsdPrecise(totalStaked)} sub="open positions" />
        <KpiCard
          label="Unrealised P&L"
          value={(totalUnrealisedPnl > 0 ? "+" : "") + fmtUsdPrecise(totalUnrealisedPnl)}
          positive={totalUnrealisedPnl > 0 ? true : totalUnrealisedPnl < 0 ? false : undefined}
        />
        <KpiCard
          label="Win Rate"
          value={`${formatPercent(winRate, 0)}`}
          sub={`${winCount}/${settledPositions.length} settled · ${fmtUsdPrecise(totalRealisedPnl)} realised`}
          positive={totalRealisedPnl >= 0 ? true : false}
        />
      </div>

      {/* Open positions table */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="size-4 text-emerald-400" />
            Open Positions
            <Badge variant="outline" className="text-[10px] ml-auto">
              {openPositions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {openPositions.length === 0 ? (
            <div className="py-12 text-center">
              <DollarSign className="size-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No open positions</p>
            </div>
          ) : (
            <WidgetScroll axes="horizontal" scrollbarSize="thin">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-border/50 text-[10px] text-muted-foreground uppercase tracking-wider">
                    <th className="pb-2 pl-4 text-left font-medium">Market</th>
                    <th className="pb-2 pr-3 text-center font-medium">Side</th>
                    <th className="pb-2 pr-3 text-right font-medium">Shares</th>
                    <th className="pb-2 pr-3 text-right font-medium">Entry / Now</th>
                    <th className="pb-2 pr-3 text-right font-medium">Staked</th>
                    <th className="pb-2 pr-3 text-right font-medium">Unr. P&L</th>
                    <th className="pb-2 pr-4 text-right font-medium">Resolves</th>
                  </tr>
                </thead>
                <tbody className="pl-4">
                  {openPositions.map((pos) => (
                    <OpenPositionRow key={pos.id} pos={pos} />
                  ))}
                </tbody>
              </table>
            </WidgetScroll>
          )}
        </CardContent>
      </Card>

      {/* Settled positions — collapsible */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setSettledOpen((v) => !v)}
          >
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              {totalRealisedPnl >= 0 ? (
                <TrendingUp className="size-4 text-emerald-400" />
              ) : (
                <TrendingDown className="size-4 text-red-400" />
              )}
              Settled Positions
              <Badge variant="outline" className="text-[10px]">
                {settledPositions.length}
              </Badge>
            </CardTitle>
            {settledOpen ? (
              <ChevronDown className="size-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="size-4 text-muted-foreground" />
            )}
          </button>
        </CardHeader>

        {settledOpen && (
          <CardContent className="p-0">
            {settledPositions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No settled positions</p>
              </div>
            ) : (
              <WidgetScroll axes="horizontal" scrollbarSize="thin">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border/50 text-[10px] text-muted-foreground uppercase tracking-wider">
                      <th className="pb-2 pl-4 text-left font-medium">Market</th>
                      <th className="pb-2 pr-3 text-center font-medium">Side</th>
                      <th className="pb-2 pr-3 text-center font-medium">Outcome</th>
                      <th className="pb-2 pr-3 text-right font-medium">Entry Price</th>
                      <th className="pb-2 pr-3 text-right font-medium">Staked</th>
                      <th className="pb-2 pr-3 text-right font-medium">Realised P&L</th>
                      <th className="pb-2 pr-4 text-right font-medium">Settled</th>
                    </tr>
                  </thead>
                  <tbody className="pl-4">
                    {settledPositions.map((pos) => (
                      <SettledPositionRow key={pos.id} pos={pos} />
                    ))}
                  </tbody>
                </table>
              </WidgetScroll>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
