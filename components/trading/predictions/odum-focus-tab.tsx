"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, Clock, Zap } from "lucide-react";
import { ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import type { OdumInstrument, OdumInstrumentType, Timeframe } from "./types";
import { MOCK_FIXTURES } from "@/lib/mocks/fixtures/sports-data";
import { ODUM_INSTRUMENTS } from "@/lib/mocks/fixtures/predictions-data";
import { fmtVolume, fmtCents, fmtRelativeTime } from "./helpers";
import { StatusPill, DualStatBar } from "@/components/trading/sports/shared";
import { VenueChip, DivergenceBadge, DeltaPill, TimeframeBadge, ResolutionCountdown, YesNoButtons } from "./shared";
import { useToast } from "@/hooks/use-toast";
import { placeMockOrder } from "@/lib/api/mock-trade-ledger";
import { formatNumber } from "@/lib/utils/formatters";

// ─── Filter bar ───────────────────────────────────────────────────────────────

export type OdumInstrumentFilter = OdumInstrumentType | "all";
export type OdumTfFilter = Timeframe | "all";

type InstrumentFilter = OdumInstrumentFilter;
type TfFilter = OdumTfFilter;

const TYPE_FILTERS: { value: InstrumentFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "crypto", label: "Crypto" },
  { value: "tradfi", label: "TradFi" },
  { value: "football", label: "Football" },
];

const TF_FILTERS: { value: TfFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "4h", label: "4h" },
  { value: "24h", label: "24h" },
];

// ─── Dual-axis chart (price + odds on same chart) ─────────────────────────────

interface DualAxisChartProps {
  series: { t: number; price: number; oddsYes: number }[];
  underlyingLabel: string;
}

function DualAxisChart({ series, underlyingLabel }: DualAxisChartProps) {
  const prices = series.map((d) => d.price);
  const minP = Math.min(...prices) * 0.998;
  const maxP = Math.max(...prices) * 1.002;
  const lastOdds = series[series.length - 1]?.oddsYes ?? 50;
  const oddsColour = lastOdds >= 50 ? "#4ade80" : "#f87171";

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series} margin={{ top: 4, right: 44, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Left axis: underlying price */}
          <YAxis yAxisId="price" domain={[minP, maxP]} hide />
          {/* Right axis: YES odds 0-100 */}
          <YAxis
            yAxisId="odds"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: "#666" }}
            tickFormatter={(v: number) => `${v}¢`}
            width={38}
          />
          <XAxis dataKey="t" hide />
          <Area
            yAxisId="price"
            type="monotone"
            dataKey="price"
            stroke="#60a5fa"
            strokeWidth={1.5}
            fill="url(#priceGrad)"
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="odds"
            type="monotone"
            dataKey="oddsYes"
            stroke={oddsColour}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <ReferenceLine yAxisId="odds" y={50} stroke="#555" strokeDasharray="3 3" />
          <Tooltip
            contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, fontSize: 10 }}
            formatter={(value: number, name: string) => [
              name === "price"
                ? value.toLocaleString("en-US", { maximumFractionDigits: 2 })
                : `${formatNumber(value, 0)}¢`,
              name === "price" ? underlyingLabel : "YES odds",
            ]}
            labelFormatter={() => ""}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Crypto / TradFi Card ─────────────────────────────────────────────────────

function QuantCard({ inst }: { inst: OdumInstrument }) {
  const { toast } = useToast();
  const isDiverging = inst.oddsSlopeVsDelta === "diverging";

  function handleTrade(side: "yes" | "no") {
    const price = side === "yes" ? inst.currentOddsYes / 100 : inst.currentOddsNo / 100;
    placeMockOrder({
      client_id: "internal-trader",
      instrument_id: `${inst.venue.toUpperCase()}:${inst.id}:${side.toUpperCase()}`,
      venue: inst.venue === "polymarket" ? "Polymarket" : "Kalshi",
      side: "buy",
      order_type: "limit",
      quantity: 100,
      price,
      asset_class: "Prediction",
      lane: "predictions",
    });
    toast({
      title: "Order placed",
      description: `${side.toUpperCase()} ${inst.label} @ ${fmtCents(side === "yes" ? inst.currentOddsYes : inst.currentOddsNo)}`,
    });
  }

  const underlyingLabel = inst.id.startsWith("btc") ? "BTC" : inst.id.startsWith("eth") ? "ETH" : "SPY";

  return (
    <Card className="bg-card border-border/50 flex flex-col">
      <CardHeader className="pb-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <VenueChip venue={inst.venue} />
              {inst.timeframe && <TimeframeBadge tf={inst.timeframe} />}
              {isDiverging && <DivergenceBadge />}
              {inst.isTrending && (
                <Badge variant="outline" className="text-[10px] border-orange-500/40 text-orange-400">
                  🔥 Hot
                </Badge>
              )}
            </div>
            <p className="text-sm font-semibold leading-snug">{inst.label}</p>
            {inst.underlyingPrice != null && (
              <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                {underlyingLabel}: ${inst.underlyingPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p
              className={cn(
                "text-2xl font-bold tabular-nums",
                inst.currentOddsYes >= 50 ? "text-emerald-400" : "text-red-400",
              )}
            >
              {inst.currentOddsYes}¢
            </p>
            <p className="text-[10px] text-muted-foreground">YES odds</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 flex-1 flex flex-col gap-3">
        <DualAxisChart series={inst.underlyingSeries} underlyingLabel={underlyingLabel} />

        {/* Delta row */}
        {inst.closestStrikeDelta != null && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Options δ (nearest strike)</span>
            <div className="flex items-center gap-1.5">
              <DeltaPill delta={inst.closestStrikeDelta} />
              {isDiverging && <span className="text-[10px] text-amber-400">↕ odds diverge</span>}
            </div>
          </div>
        )}

        {/* Resolution + volume */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            <ResolutionCountdown resolutionAt={inst.resolutionAt} />
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 className="size-3" />
            {fmtVolume(inst.volume)}
          </span>
        </div>

        <YesNoButtons
          yesPrice={inst.currentOddsYes / 100}
          noPrice={inst.currentOddsNo / 100}
          size="default"
          onYes={() => handleTrade("yes")}
          onNo={() => handleTrade("no")}
        />
      </CardContent>
    </Card>
  );
}

// ─── Football Card (reuses sports shared components) ──────────────────────────

function FootballCard({
  fixtureId,
  oddsYes,
  oddsNo,
  marketQuestion,
  venue,
}: {
  fixtureId: string;
  oddsYes: number;
  oddsNo: number;
  marketQuestion: string;
  venue: "polymarket" | "kalshi";
}) {
  const fixture = MOCK_FIXTURES.find((f) => f.id === fixtureId);
  const { toast } = useToast();

  function handleTrade(side: "yes" | "no") {
    placeMockOrder({
      client_id: "internal-trader",
      instrument_id: `${venue.toUpperCase()}:FOOTBALL:${fixtureId}:${side.toUpperCase()}`,
      venue: venue === "polymarket" ? "Polymarket" : "Kalshi",
      side: "buy",
      order_type: "limit",
      quantity: 100,
      price: (side === "yes" ? oddsYes : oddsNo) / 100,
      asset_class: "Prediction",
      lane: "predictions",
    });
    toast({
      title: "Order placed",
      description: `${side.toUpperCase()} ${marketQuestion} @ ${fmtCents(side === "yes" ? oddsYes : oddsNo)}`,
    });
  }

  if (!fixture) return null;

  const stats = fixture.stats;

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="pb-2 p-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <VenueChip venue={venue} />
            <Badge variant="outline" className="text-[10px] border-zinc-700/50 text-zinc-400">
              {fixture.league}
            </Badge>
            <StatusPill status={fixture.status} minute={fixture.minute} />
          </div>
          <div className="flex items-center gap-2 text-right">
            <p className={cn("text-xl font-bold tabular-nums", oddsYes >= 50 ? "text-emerald-400" : "text-red-400")}>
              {oddsYes}¢
            </p>
            <p className="text-[10px] text-muted-foreground">YES</p>
          </div>
        </div>

        {/* Teams + score */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{fixture.home.name}</p>
            <p className="text-xs text-muted-foreground truncate">vs {fixture.away.name}</p>
          </div>
          {fixture.score && (
            <div className="text-center px-3">
              <p className="text-2xl font-black tabular-nums">
                {fixture.score.home} — {fixture.score.away}
              </p>
              {fixture.score.ht && (
                <p className="text-[10px] text-muted-foreground">
                  HT {fixture.score.ht.home}-{fixture.score.ht.away}
                </p>
              )}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{marketQuestion}</p>
      </CardHeader>

      <CardContent className="p-3 pt-0 space-y-2">
        {/* Live stats */}
        {stats && (
          <div className="space-y-1.5 py-2 border-t border-border/30">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Live Stats</p>
            <DualStatBar
              label="xG"
              homeValue={stats.home.xg}
              awayValue={stats.away.xg}
              format={(v) => formatNumber(v, 1)}
            />
            <DualStatBar
              label="Possession"
              homeValue={stats.home.possession}
              awayValue={stats.away.possession}
              format={(v) => `${v}%`}
            />
            <DualStatBar label="Shots OT" homeValue={stats.home.shotsOnTarget} awayValue={stats.away.shotsOnTarget} />
          </div>
        )}

        <YesNoButtons
          yesPrice={oddsYes / 100}
          noPrice={oddsNo / 100}
          size="default"
          onYes={() => handleTrade("yes")}
          onNo={() => handleTrade("no")}
        />
      </CardContent>
    </Card>
  );
}

// ─── Football market definitions ──────────────────────────────────────────────

const FOOTBALL_MARKETS = [
  {
    fixtureId: "fix-001",
    marketQuestion: "Man City to win this match?",
    oddsYes: 44,
    oddsNo: 56,
    venue: "polymarket" as const,
  },
  {
    fixtureId: "fix-002",
    marketQuestion: "Arsenal to win vs Chelsea?",
    oddsYes: 56,
    oddsNo: 44,
    venue: "polymarket" as const,
  },
  {
    fixtureId: "fix-003",
    marketQuestion: "Barcelona to win at Bernabéu?",
    oddsYes: 38,
    oddsNo: 62,
    venue: "kalshi" as const,
  },
  {
    fixtureId: "fix-004",
    marketQuestion: "Bayern to win vs PSG?",
    oddsYes: 52,
    oddsNo: 48,
    venue: "polymarket" as const,
  },
];

// ─── Main Export ─────────────────────────────────────────────────────────────

export interface OdumFocusBodyProps {
  typeFilter: OdumInstrumentFilter;
  setTypeFilter: (f: OdumInstrumentFilter) => void;
  tfFilter: OdumTfFilter;
  setTfFilter: (f: OdumTfFilter) => void;
}

export function OdumFocusBody({ typeFilter, setTypeFilter, tfFilter, setTfFilter }: OdumFocusBodyProps) {
  const filteredInstruments = React.useMemo(() => {
    return ODUM_INSTRUMENTS.filter((inst) => {
      if (typeFilter !== "all" && inst.type !== typeFilter) return false;
      if (tfFilter !== "all" && inst.timeframe !== tfFilter) return false;
      return true;
    });
  }, [typeFilter, tfFilter]);

  const showFootball = typeFilter === "all" || typeFilter === "football";
  const showQuant = typeFilter === "all" || typeFilter === "crypto" || typeFilter === "tradfi";

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-0.5 rounded-md border border-zinc-800 bg-zinc-900/60 p-0.5">
          {TYPE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTypeFilter(value)}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold rounded transition-colors",
                typeFilter === value ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {(typeFilter === "all" || typeFilter === "crypto" || typeFilter === "tradfi") && (
          <div className="flex items-center gap-0.5 rounded-md border border-zinc-800 bg-zinc-900/60 p-0.5">
            {TF_FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTfFilter(value)}
                className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded transition-colors",
                  tfFilter === value ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Zap className="size-3 text-amber-400" />
          <span>Delta divergence signals options/prediction market misalignment</span>
        </div>
      </div>

      {/* Crypto / TradFi grid */}
      {showQuant && filteredInstruments.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Crypto &amp; TradFi Prediction Markets
            </p>
            <div className="h-px flex-1 bg-border/50" />
            <Badge variant="outline" className="text-[10px]">
              {filteredInstruments.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInstruments.map((inst) => (
              <QuantCard key={inst.id} inst={inst} />
            ))}
          </div>
        </section>
      )}

      {/* Football grid */}
      {showFootball && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Football Match Markets
            </p>
            <div className="h-px flex-1 bg-border/50" />
            <Badge variant="outline" className="text-[10px]">
              {FOOTBALL_MARKETS.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {FOOTBALL_MARKETS.map((fm) => (
              <FootballCard key={fm.fixtureId} {...fm} />
            ))}
          </div>
        </section>
      )}

      {!showQuant && !showFootball && (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">No instruments match the current filters</p>
        </div>
      )}
    </div>
  );
}

export function OdumFocusTab() {
  const [typeFilter, setTypeFilter] = React.useState<InstrumentFilter>("all");
  const [tfFilter, setTfFilter] = React.useState<TfFilter>("all");
  return (
    <OdumFocusBody
      typeFilter={typeFilter}
      setTypeFilter={setTypeFilter}
      tfFilter={tfFilter}
      setTfFilter={setTfFilter}
    />
  );
}
