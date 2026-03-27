"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, Ban, DollarSign } from "lucide-react";
import type { Bet, BetStatus, AccumulatorLeg } from "./types";
import { MOCK_BETS } from "./mock-data";
import { fmtOdds, fmtCurrency, fmtRelativeTime } from "./helpers";
import { LeagueBadge, KpiTile, EmptyState, SectionHeader } from "./shared";
import { useToast } from "@/hooks/use-toast";

// ─── Bet Status Badge ─────────────────────────────────────────────────────────

const BET_STATUS_CONFIG: Record<
  BetStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  open: {
    label: "Open",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: Clock,
  },
  won: {
    label: "Won",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle2,
  },
  lost: {
    label: "Lost",
    className: "bg-red-500/15 text-red-400 border-red-500/30",
    icon: XCircle,
  },
  void: {
    label: "Void",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: Ban,
  },
  cashed_out: {
    label: "Cashed Out",
    className: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    icon: DollarSign,
  },
};

function BetStatusBadge({ status }: { status: BetStatus }) {
  const cfg = BET_STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold",
        cfg.className,
      )}
    >
      <Icon className="size-2.5" />
      {cfg.label}
    </span>
  );
}

// ─── KPI Summary Row ──────────────────────────────────────────────────────────

function BetsSummary({ bets }: { bets: Bet[] }) {
  const totalStaked = bets.reduce((s, b) => s + b.stake, 0);
  const settled = bets.filter((b) => b.pnl != null);
  const totalPnl = settled.reduce((s, b) => s + (b.pnl ?? 0), 0);
  const wins = settled.filter((b) => (b.pnl ?? 0) > 0).length;
  const winRate =
    settled.length > 0 ? ((wins / settled.length) * 100).toFixed(0) : "—";
  const openExposure = bets
    .filter((b) => b.status === "open")
    .reduce((s, b) => s + b.stake, 0);

  return (
    <div className="grid grid-cols-4 gap-2 p-3 border-b">
      <KpiTile label="Total Staked" value={fmtCurrency(totalStaked)} />
      <KpiTile
        label="Total P&L"
        value={totalPnl === 0 ? "—" : fmtCurrency(totalPnl)}
        valueClassName={
          totalPnl > 0
            ? "text-emerald-500"
            : totalPnl < 0
              ? "text-red-500"
              : undefined
        }
      />
      <KpiTile
        label="Win Rate"
        value={winRate !== "—" ? `${winRate}%` : "—"}
        subtext={`${wins}/${settled.length} settled`}
      />
      <KpiTile label="Open Exposure" value={fmtCurrency(openExposure)} />
    </div>
  );
}

// ─── Bet Row ──────────────────────────────────────────────────────────────────

interface BetRowProps {
  bet: Bet;
  showPnl?: boolean;
  showCashOut?: boolean;
}

function BetRow({ bet, showPnl = false, showCashOut = false }: BetRowProps) {
  const { toast } = useToast();

  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 py-2.5 px-3 border-b border-border/40 last:border-0 hover:bg-muted/10 transition-colors">
      {/* Main info */}
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <LeagueBadge league={bet.league} />
          <span className="text-xs font-semibold truncate">
            {bet.fixtureName}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap">
          <span>{bet.market}</span>
          <span>·</span>
          <span className="font-medium text-foreground">{bet.outcome}</span>
          <span>·</span>
          <span>{bet.bookmaker}</span>
          <span>·</span>
          <span>{fmtRelativeTime(bet.placedAt)}</span>
        </div>
      </div>

      {/* Status badge */}
      <BetStatusBadge status={bet.status} />

      {/* Numeric row */}
      <div className="flex items-center gap-4 text-xs flex-wrap">
        <div className="flex flex-col">
          <span className="text-[9px] text-muted-foreground">Odds</span>
          <span className="font-bold tabular-nums">{fmtOdds(bet.odds)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-muted-foreground">Stake</span>
          <span className="tabular-nums">{fmtCurrency(bet.stake)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-muted-foreground">
            Potential Return
          </span>
          <span className="tabular-nums">
            {fmtCurrency(bet.potentialReturn)}
          </span>
        </div>
        {bet.kellyStake && (
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground">Kelly</span>
            <span className="tabular-nums text-muted-foreground">
              {fmtCurrency(bet.kellyStake)}
            </span>
          </div>
        )}
        {showPnl && bet.pnl != null && (
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground">P&L</span>
            <span
              className={cn(
                "font-bold tabular-nums",
                bet.pnl > 0 ? "text-emerald-500" : "text-red-500",
              )}
            >
              {bet.pnl > 0 ? "+" : ""}
              {fmtCurrency(bet.pnl)}
            </span>
          </div>
        )}
      </div>

      {/* Cash-out button */}
      {showCashOut && bet.status === "open" && (
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[10px] px-2 self-center"
          onClick={() =>
            toast({
              title: "Cash Out",
              description: `${bet.fixtureName} — ${fmtCurrency(bet.stake)} returned`,
              duration: 3000,
            })
          }
        >
          Cash Out
        </Button>
      )}
    </div>
  );
}

// ─── Open Bets ────────────────────────────────────────────────────────────────

function OpenBetsTab({ bets }: { bets: Bet[] }) {
  const open = bets.filter((b) => b.status === "open" && !b.isAccumulator);
  if (open.length === 0) return <EmptyState message="No open bets" />;
  return (
    <div className="flex flex-col">
      {open.map((bet) => (
        <BetRow key={bet.id} bet={bet} showCashOut />
      ))}
    </div>
  );
}

// ─── Settled Bets ─────────────────────────────────────────────────────────────

type SettledFilter = "all" | "won" | "lost" | "void";

function SettledBetsTab({ bets }: { bets: Bet[] }) {
  const [filter, setFilter] = React.useState<SettledFilter>("all");
  const settled = bets.filter((b) => b.status !== "open" && !b.isAccumulator);
  const filtered =
    filter === "all"
      ? settled
      : settled.filter((b) => {
          if (filter === "won")
            return b.status === "won" || b.status === "cashed_out";
          if (filter === "lost") return b.status === "lost";
          return b.status === "void";
        });

  const FILTERS: { value: SettledFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "won", label: "Won" },
    { value: "lost", label: "Lost" },
    { value: "void", label: "Void" },
  ];

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 px-3 py-2 border-b bg-muted/10">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "px-2.5 py-0.5 text-xs rounded-full border transition-colors",
              filter === value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState message="No settled bets" />
      ) : (
        filtered.map((bet) => <BetRow key={bet.id} bet={bet} showPnl />)
      )}
    </div>
  );
}

// ─── Accumulators ─────────────────────────────────────────────────────────────

const LEG_STATUS_ICONS: Record<AccumulatorLeg["legStatus"], React.ElementType> =
  {
    pending: Clock,
    won: CheckCircle2,
    lost: XCircle,
    void: Ban,
  };

const LEG_STATUS_COLOURS: Record<AccumulatorLeg["legStatus"], string> = {
  pending: "text-muted-foreground",
  won: "text-emerald-500",
  lost: "text-red-500",
  void: "text-amber-500",
};

function AccumulatorCard({ bet }: { bet: Bet }) {
  const { toast } = useToast();
  const legs = bet.accumulatorLegs ?? [];
  const allWon = legs.every((l) => l.legStatus === "won");
  const anyLost = legs.some((l) => l.legStatus === "lost");
  const allPending = legs.every((l) => l.legStatus === "pending");

  const overallColour = allWon
    ? "border-emerald-500/30 bg-emerald-500/5"
    : anyLost
      ? "border-red-500/30 bg-red-500/5"
      : "border-border";

  return (
    <div
      className={cn(
        "rounded-lg border p-3 mx-3 my-1.5 flex flex-col gap-2",
        overallColour,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold">{bet.fixtureName}</span>
        <BetStatusBadge status={bet.status} />
        <span className="ml-auto text-[10px] text-muted-foreground">
          {fmtRelativeTime(bet.placedAt)}
        </span>
      </div>

      {/* Legs */}
      <div className="flex flex-col gap-1">
        {legs.map((leg, i) => {
          const Icon = LEG_STATUS_ICONS[leg.legStatus];
          return (
            <div key={i} className="flex items-center gap-1.5 text-[11px]">
              <Icon
                className={cn(
                  "size-3 shrink-0",
                  LEG_STATUS_COLOURS[leg.legStatus],
                )}
              />
              <span className="text-muted-foreground truncate">
                {leg.fixtureName}
              </span>
              <span className="mx-1 text-muted-foreground/40">·</span>
              <span className="font-medium">{leg.outcome}</span>
              <span className="ml-auto tabular-nums font-bold">
                {fmtOdds(leg.odds)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 pt-1 border-t text-xs">
        <div className="flex flex-col">
          <span className="text-[9px] text-muted-foreground">
            Combined odds
          </span>
          <span className="font-bold tabular-nums">{fmtOdds(bet.odds)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-muted-foreground">Stake</span>
          <span className="tabular-nums">{fmtCurrency(bet.stake)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-muted-foreground">
            Potential Return
          </span>
          <span className="tabular-nums">
            {fmtCurrency(bet.potentialReturn)}
          </span>
        </div>
        {bet.status === "open" && (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto h-6 text-[10px] px-2"
            onClick={() =>
              toast({
                title: "Cash Out",
                description: `Accumulator — ${fmtCurrency(bet.stake)} returned`,
                duration: 3000,
              })
            }
          >
            Cash Out
          </Button>
        )}
      </div>
    </div>
  );
}

function AccumulatorsTab({ bets }: { bets: Bet[] }) {
  const accas = bets.filter((b) => b.isAccumulator);
  if (accas.length === 0) return <EmptyState message="No accumulators" />;
  return (
    <div className="flex flex-col">
      {accas.map((b) => (
        <AccumulatorCard key={b.id} bet={b} />
      ))}
    </div>
  );
}

// ─── My Bets Tab ─────────────────────────────────────────────────────────────

export function MyBetsTab() {
  const bets = MOCK_BETS;

  return (
    <div className="flex flex-col h-full min-h-0">
      <BetsSummary bets={bets} />

      <Tabs defaultValue="open" className="flex flex-col flex-1 min-h-0">
        <TabsList className="mx-3 mt-2 h-8 bg-muted/40 shrink-0">
          <TabsTrigger value="open" className="text-xs flex-1">
            Open
          </TabsTrigger>
          <TabsTrigger value="settled" className="text-xs flex-1">
            Settled
          </TabsTrigger>
          <TabsTrigger value="accumulators" className="text-xs flex-1">
            Accumulators
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto mt-2">
          <TabsContent value="open" className="mt-0">
            <OpenBetsTab bets={bets} />
          </TabsContent>
          <TabsContent value="settled" className="mt-0">
            <SettledBetsTab bets={bets} />
          </TabsContent>
          <TabsContent value="accumulators" className="mt-0">
            <AccumulatorsTab bets={bets} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
