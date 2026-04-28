"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Ban, CheckCircle2, ChevronRight, Clock, DollarSign, Layers, XCircle } from "lucide-react";
import * as React from "react";
import { fmtCurrency, fmtOdds, fmtRelativeTime } from "./helpers";
import { MOCK_BETS } from "@/lib/mocks/fixtures/sports-data";
import { KpiTile, LeagueBadge } from "./shared";
import type { AccumulatorLeg, Bet, BetStatus } from "./types";
import { formatNumber } from "@/lib/utils/formatters";

// ─── Status config ────────────────────────────────────────────────────────────

const BET_STATUS_CONFIG: Record<BetStatus, { label: string; colour: string; icon: React.ElementType }> = {
  open: {
    label: "Open",
    colour: "text-[#22d3ee] border-[#22d3ee]/30 bg-[#22d3ee]/10",
    icon: Clock,
  },
  won: {
    label: "Won",
    colour: "text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10",
    icon: CheckCircle2,
  },
  lost: {
    label: "Lost",
    colour: "text-red-400 border-red-400/30 bg-red-400/10",
    icon: XCircle,
  },
  void: {
    label: "Void",
    colour: "text-amber-400 border-amber-400/30 bg-amber-400/10",
    icon: Ban,
  },
  cashed_out: {
    label: "Cashed Out",
    colour: "text-purple-400 border-purple-400/30 bg-purple-400/10",
    icon: DollarSign,
  },
};

function BetStatusPill({ status, className }: { status: BetStatus; className?: string }) {
  const { label, colour, icon: Icon } = BET_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[9px] font-black border uppercase tracking-wider",
        colour,
        className,
      )}
    >
      <Icon className="size-2.5" />
      {label}
    </span>
  );
}

// ─── KPI Summary ─────────────────────────────────────────────────────────────

function BetsSummary({ bets }: { bets: Bet[] }) {
  const totalStaked = bets.reduce((s, b) => s + b.stake, 0);
  const settled = bets.filter((b) => b.pnl != null);
  const totalPnl = settled.reduce((s, b) => s + (b.pnl ?? 0), 0);
  const wins = settled.filter((b) => (b.pnl ?? 0) > 0).length;
  const winRate = settled.length > 0 ? formatNumber((wins / settled.length) * 100, 0) : "-";
  const openExposure = bets.filter((b) => b.status === "open").reduce((s, b) => s + b.stake, 0);

  return (
    <div className="grid grid-cols-4 gap-2 p-3 border-b border-zinc-800">
      <KpiTile label="Total Staked" value={fmtCurrency(totalStaked)} />
      <KpiTile
        label="P&L"
        value={totalPnl === 0 ? "-" : `${totalPnl > 0 ? "+" : ""}${fmtCurrency(totalPnl)}`}
        valueClassName={totalPnl > 0 ? "text-[#4ade80]" : totalPnl < 0 ? "text-red-400" : "text-zinc-400"}
      />
      <KpiTile
        label="Win Rate"
        value={winRate !== "-" ? `${winRate}%` : "-"}
        subtext={`${wins} of ${settled.length} settled`}
      />
      <KpiTile label="Open Exposure" value={fmtCurrency(openExposure)} />
    </div>
  );
}

// ─── Single Bet Card (used in Open + Settled) ─────────────────────────────────

interface BetCardProps {
  bet: Bet;
  showPnl?: boolean;
  showCashOut?: boolean;
}

function BetCard({ bet, showPnl = false, showCashOut = false }: BetCardProps) {
  const { toast } = useToast();
  const isWon = bet.status === "won";
  const isLost = bet.status === "lost";
  const isOpen = bet.status === "open";

  return (
    <div
      className={cn(
        "relative rounded-xl border mx-3 my-1.5 overflow-hidden transition-all",
        isOpen
          ? "border-zinc-700/60 bg-[#0f0f0f] hover:border-zinc-600"
          : isWon
            ? "border-[#4ade80]/20 bg-[#0d140d]/80"
            : isLost
              ? "border-red-500/20 bg-[#140d0d]/80"
              : "border-zinc-800/50 bg-zinc-900/20 opacity-70",
      )}
    >
      {/* Side accent stripe */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-0.5",
          isOpen ? "bg-[#22d3ee]" : isWon ? "bg-[#4ade80]" : isLost ? "bg-red-500" : "bg-zinc-700",
        )}
      />

      <div className="pl-4 pr-3 py-3 flex flex-col gap-2">
        {/* Top row: league + match + status */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <LeagueBadge league={bet.league} />
          <span className="text-xs font-bold text-white">{bet.fixtureName}</span>
          <BetStatusPill status={bet.status} className="ml-auto" />
        </div>

        {/* Market + outcome */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-zinc-500">{bet.market}</span>
          <ChevronRight className="size-3 text-zinc-700" />
          <span className="font-bold text-white">{bet.outcome}</span>
          <span className="text-zinc-600">@</span>
          <span className="text-[10px] text-zinc-500">{bet.bookmaker}</span>
        </div>

        {/* Odds + stake + return */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Odds</span>
            <span className="text-lg font-black text-white tabular-nums leading-tight">{fmtOdds(bet.odds)}</span>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Stake</span>
            <span className="text-sm font-bold tabular-nums text-zinc-300">{fmtCurrency(bet.stake)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Return</span>
            <span className="text-sm font-bold tabular-nums text-zinc-300">{fmtCurrency(bet.potentialReturn)}</span>
          </div>
          {bet.kellyStake && (
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Kelly</span>
              <span className="text-sm tabular-nums text-zinc-500">{fmtCurrency(bet.kellyStake)}</span>
            </div>
          )}
          {showPnl && bet.pnl != null && (
            <>
              <div className="h-8 w-px bg-zinc-800" />
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-600 uppercase tracking-widest">P&L</span>
                <span
                  className={cn("text-sm font-black tabular-nums", bet.pnl > 0 ? "text-[#4ade80]" : "text-red-400")}
                >
                  {bet.pnl > 0 ? "+" : ""}
                  {fmtCurrency(bet.pnl)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer: time + cash out */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-600">{fmtRelativeTime(bet.placedAt)}</span>
          {showCashOut && isOpen && (
            <Button
              size="sm"
              variant="outline"
              className="ml-auto h-7 text-[10px] px-3 font-bold border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
              onClick={() =>
                toast({
                  title: "Cashed Out",
                  description: `${bet.fixtureName}: ${fmtCurrency(bet.stake)} returned`,
                  duration: 3000,
                })
              }
            >
              <DollarSign className="size-3 mr-1" />
              Cash Out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Open Bets ────────────────────────────────────────────────────────────────

function OpenBetsTab({ bets }: { bets: Bet[] }) {
  const open = bets.filter((b) => b.status === "open" && !b.isAccumulator);
  if (open.length === 0) return <EmptyState variant="inline" title="No open single bets" />;
  return (
    <div className="flex flex-col py-1">
      {open.map((bet) => (
        <BetCard key={bet.id} bet={bet} showCashOut />
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
          if (filter === "won") return b.status === "won" || b.status === "cashed_out";
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
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-800">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={cn(
              "px-2.5 py-1 text-[10px] font-bold rounded-sm transition-colors",
              filter === value ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState variant="inline" title="No settled bets" />
      ) : (
        <div className="flex flex-col py-1">
          {filtered.map((bet) => (
            <BetCard key={bet.id} bet={bet} showPnl />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Accumulator Card ─────────────────────────────────────────────────────────

const LEG_STATUS_CONFIG: Record<AccumulatorLeg["legStatus"], { icon: React.ElementType; colour: string }> = {
  pending: { icon: Clock, colour: "text-zinc-500" },
  won: { icon: CheckCircle2, colour: "text-[#4ade80]" },
  lost: { icon: XCircle, colour: "text-red-400" },
  void: { icon: Ban, colour: "text-amber-400" },
};

function AccumulatorCard({ bet }: { bet: Bet }) {
  const { toast } = useToast();
  const legs = bet.accumulatorLegs ?? [];
  const allWon = legs.every((l) => l.legStatus === "won");
  const anyLost = legs.some((l) => l.legStatus === "lost");

  return (
    <div
      className={cn(
        "relative rounded-xl border mx-3 my-1.5 overflow-hidden",
        allWon
          ? "border-[#4ade80]/30 bg-[#0d140d]"
          : anyLost
            ? "border-red-500/20 bg-[#140d0d]/80"
            : "border-zinc-700/60 bg-[#0f0f0f]",
      )}
    >
      {/* Accent stripe */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-0.5",
          allWon ? "bg-[#4ade80]" : anyLost ? "bg-red-500" : "bg-[#22d3ee]",
        )}
      />

      <div className="pl-4 pr-3 py-3 flex flex-col gap-2.5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Layers className="size-3.5 text-zinc-500 shrink-0" />
          <span className="text-xs font-bold text-white">{bet.fixtureName}</span>
          <BetStatusPill status={bet.status} className="ml-auto" />
        </div>

        {/* Legs tree */}
        <div className="flex flex-col gap-1">
          {legs.map((leg, i) => {
            const { icon: Icon, colour } = LEG_STATUS_CONFIG[leg.legStatus];
            return (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <Icon className={cn("size-3 shrink-0", colour)} />
                <span className="text-zinc-400 truncate flex-1">{leg.fixtureName}</span>
                <span className="text-zinc-500 mx-1">·</span>
                <span className="font-semibold text-zinc-300">{leg.outcome}</span>
                <span className="ml-auto font-black tabular-nums text-white">{fmtOdds(leg.odds)}</span>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="flex items-center gap-4 border-t border-zinc-800/60 pt-2">
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Combined</span>
            <span className="text-lg font-black text-white tabular-nums">{fmtOdds(bet.odds)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Stake</span>
            <span className="text-sm font-bold tabular-nums text-zinc-300">{fmtCurrency(bet.stake)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">Return</span>
            <span className="text-sm font-bold tabular-nums text-zinc-300">{fmtCurrency(bet.potentialReturn)}</span>
          </div>
          {bet.status === "open" && (
            <Button
              size="sm"
              variant="outline"
              className="ml-auto h-7 text-[10px] px-3 font-bold border-zinc-700 text-zinc-300 hover:border-zinc-500"
              onClick={() =>
                toast({
                  title: "Cashed Out",
                  description: `Accumulator: ${fmtCurrency(bet.stake)} returned`,
                  duration: 3000,
                })
              }
            >
              <DollarSign className="size-3 mr-1" />
              Cash Out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function AccumulatorsTab({ bets }: { bets: Bet[] }) {
  const accas = bets.filter((b) => b.isAccumulator);
  if (accas.length === 0) return <EmptyState variant="inline" title="No accumulators" />;
  return (
    <div className="flex flex-col py-1">
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
        <div className="px-3 pt-2 border-b border-zinc-800 shrink-0">
          <TabsList className="h-8 bg-zinc-900/60 w-full">
            <TabsTrigger value="open" className="flex-1 text-[10px] font-bold">
              Open
            </TabsTrigger>
            <TabsTrigger value="settled" className="flex-1 text-[10px] font-bold">
              Settled
            </TabsTrigger>
            <TabsTrigger value="accumulators" className="flex-1 text-[10px] font-bold">
              Accumulators
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
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
