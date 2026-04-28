"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronRight, Calendar, TrendingUp, Building2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCorporateActions, useEconomicEvents, useMarketStructureEvents } from "@/hooks/api/use-calendar";
import type { CorporateAction, EconomicEvent, MarketStructureEvent } from "@/hooks/api/use-calendar";
import type { CorporateActionType, EconomicEventType, MarketStructureEventType } from "@/lib/types/data-service";

// Widget = today only (UTC). The /services/data/events page uses the same hooks
// unfiltered to show past + present + future.
function isTodayUtc(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  );
}

const IMPORTANCE_COLORS: Record<EconomicEvent["importance"], string> = {
  high: "text-red-400 border-red-400/40 bg-red-400/10",
  medium: "text-amber-400 border-amber-400/40 bg-amber-400/10",
  low: "text-slate-400 border-slate-400/40 bg-slate-400/10",
};

const ECONOMIC_EVENT_LABELS: Record<EconomicEventType, string> = {
  fomc: "FOMC / Fed",
  nfp: "Non-Farm Payrolls",
  cpi: "CPI",
  gdp: "GDP",
  pce: "PCE",
  initial_claims: "Jobless Claims",
  election: "Election",
  other_macro: "Other Macro",
};

const ECONOMIC_EVENT_COLORS: Record<EconomicEventType, string> = {
  fomc: "text-violet-400 border-violet-400/40 bg-violet-400/10",
  nfp: "text-sky-400 border-sky-400/40 bg-sky-400/10",
  cpi: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  gdp: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  pce: "text-pink-400 border-pink-400/40 bg-pink-400/10",
  initial_claims: "text-slate-300 border-slate-300/40 bg-slate-300/10",
  election: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  other_macro: "text-sky-300 border-sky-300/40 bg-sky-300/10",
};

const CORPORATE_ACTION_LABELS: Record<CorporateActionType, string> = {
  split: "Stock Splits",
  reverse_split: "Reverse Splits",
  symbol_change: "Symbol Changes",
  delisting: "Delistings",
  spinoff: "Spin-offs",
  dividend: "Dividends",
  earnings: "Earnings",
  merger: "Mergers",
};

const CORPORATE_ACTION_COLORS: Record<CorporateActionType, string> = {
  split: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
  reverse_split: "text-rose-400 border-rose-400/40 bg-rose-400/10",
  symbol_change: "text-sky-400 border-sky-400/40 bg-sky-400/10",
  delisting: "text-rose-500 border-rose-500/40 bg-rose-500/10",
  spinoff: "text-violet-400 border-violet-400/40 bg-violet-400/10",
  dividend: "text-amber-400 border-amber-400/40 bg-amber-400/10",
  earnings: "text-indigo-400 border-indigo-400/40 bg-indigo-400/10",
  merger: "text-pink-400 border-pink-400/40 bg-pink-400/10",
};

const MARKET_STRUCTURE_LABELS: Record<MarketStructureEventType, string> = {
  options_expiry: "Options Expiry",
  futures_expiry: "Futures Expiry",
  halving: "Halving",
  network_upgrade: "Network Upgrade",
  exchange_halt: "Exchange Halts",
  liquidity_event: "Liquidity Events",
};

const MARKET_STRUCTURE_COLORS: Record<MarketStructureEventType, string> = {
  options_expiry: "text-orange-400 border-orange-400/40 bg-orange-400/10",
  futures_expiry: "text-amber-400 border-amber-400/40 bg-amber-400/10",
  halving: "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  network_upgrade: "text-violet-400 border-violet-400/40 bg-violet-400/10",
  exchange_halt: "text-rose-500 border-rose-500/40 bg-rose-500/10",
  liquidity_event: "text-sky-400 border-sky-400/40 bg-sky-400/10",
};

const REPORT_TIME_LABELS: Record<NonNullable<CorporateAction["reportTime"]>, string> = {
  bmo: "BMO",
  amc: "AMC",
  during: "Intraday",
};

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmtShortDate(iso: string | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function fmtMoneyCompact(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtIntCompact(n: number | null | undefined): string {
  if (n === null || n === undefined) return "-";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

function surpriseClass(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return "text-muted-foreground";
  if (pct > 0.5) return "text-emerald-400";
  if (pct < -0.5) return "text-rose-400";
  return "text-slate-300";
}

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

function groupBy<T, K extends string>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return map;
}

function sortedEntries<K extends string, V>(map: Map<K, V[]>, labelFor: (k: K) => string): [K, V[]][] {
  return [...map.entries()].sort((a, b) => labelFor(a[0]).localeCompare(labelFor(b[0])));
}

// ---------------------------------------------------------------------------
// Shared UI primitives (dense trader rows)
// ---------------------------------------------------------------------------

function Metric({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-[9px] uppercase tracking-wide text-muted-foreground/70">{label}</span>
      <span className={cn("text-[11px] font-mono", valueClass)}>{value}</span>
    </span>
  );
}

function GroupHeader({ label, count, colorClass }: { label: string; count: number; colorClass: string }) {
  return (
    <div className="flex items-center gap-2 mt-2 mb-1 first:mt-0">
      <span
        className={cn("text-[10px] font-semibold uppercase tracking-wide px-1.5 py-[1px] rounded border", colorClass)}
      >
        {label}
      </span>
      <span className="text-[10px] text-muted-foreground/80 font-mono">×{count}</span>
      <div className="flex-1 border-b border-border/30" />
    </div>
  );
}

function EmptyTab({ label }: { label: string }) {
  return <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">No {label} today.</div>;
}

// ---------------------------------------------------------------------------
// Macro / Economic
// ---------------------------------------------------------------------------

function MacroTabContent() {
  const { data: events = [], isLoading } = useEconomicEvents();
  const today = events.filter((e) => isTodayUtc(e.date));
  if (isLoading) return <div className="text-sm text-muted-foreground py-4">Loading…</div>;
  if (today.length === 0) return <EmptyTab label="economic events" />;
  const groups = sortedEntries(
    groupBy(today, (e) => e.eventType),
    (k) => ECONOMIC_EVENT_LABELS[k],
  );
  return (
    <div className="space-y-1">
      {groups.map(([type, items]) => (
        <div key={type}>
          <GroupHeader
            label={ECONOMIC_EVENT_LABELS[type]}
            count={items.length}
            colorClass={ECONOMIC_EVENT_COLORS[type]}
          />
          <div className="space-y-1">
            {items.map((evt) => (
              <MacroRow key={evt.id} event={evt} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MacroRow({ event }: { event: EconomicEvent }) {
  const released = event.actual !== null && event.actual !== undefined;
  const unit = event.unit ?? "";
  const surprisePct = event.surprise !== null && event.surprise !== undefined ? event.surprise * 100 : null;
  const sc = surpriseClass(surprisePct);
  return (
    <div className="rounded-md border border-border/60 bg-card/40 px-2.5 py-1.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-xs truncate">{event.label}</span>
          {event.period && <span className="text-[10px] text-muted-foreground font-mono">· {event.period}</span>}
          {event.time && <span className="text-[10px] text-sky-300/80 font-mono">{event.time}Z</span>}
        </div>
        <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", IMPORTANCE_COLORS[event.importance])}>
          {event.importance}
        </Badge>
      </div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <Metric
          label="Act"
          value={
            released ? (
              <span className={sc}>
                {event.actual}
                {unit}
              </span>
            ) : (
              <span className="text-muted-foreground/60">-</span>
            )
          }
        />
        <Metric
          label="Est"
          value={
            event.forecast !== null && event.forecast !== undefined ? (
              <span className="text-slate-300">
                {event.forecast}
                {unit}
              </span>
            ) : (
              <span className="text-muted-foreground/60">-</span>
            )
          }
        />
        <Metric
          label="Prev"
          value={
            event.previous !== null && event.previous !== undefined ? (
              <span className="text-muted-foreground">
                {event.previous}
                {unit}
              </span>
            ) : (
              <span className="text-muted-foreground/60">-</span>
            )
          }
        />
        {surprisePct !== null && (
          <Metric
            label="Surp"
            value={
              <span className={sc}>
                {surprisePct > 0 ? "+" : ""}
                {surprisePct.toFixed(1)}%
              </span>
            }
          />
        )}
        {event.source && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            {event.source}
            {event.country && <span className="text-muted-foreground/70"> · {event.country}</span>}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Corporate
// ---------------------------------------------------------------------------

function CorporateTabContent() {
  const { data: actions = [], isLoading } = useCorporateActions();
  const today = actions.filter((a) => isTodayUtc(a.effectiveDate));
  if (isLoading) return <div className="text-sm text-muted-foreground py-4">Loading…</div>;
  if (today.length === 0) return <EmptyTab label="corporate actions" />;
  const groups = sortedEntries(
    groupBy(today, (a) => a.actionType),
    (k) => CORPORATE_ACTION_LABELS[k],
  );
  return (
    <div className="space-y-1">
      {groups.map(([type, items]) => (
        <div key={type}>
          <GroupHeader
            label={CORPORATE_ACTION_LABELS[type]}
            count={items.length}
            colorClass={CORPORATE_ACTION_COLORS[type]}
          />
          <div className="space-y-1">
            {items.map((action) => (
              <CorporateRow key={action.id} action={action} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CorporateRow({ action }: { action: CorporateAction }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 px-2.5 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold text-xs font-mono text-cyan-400 flex-shrink-0">{action.symbol}</span>
          {action.newSymbol && <span className="text-[10px] text-muted-foreground">→</span>}
          {action.newSymbol && (
            <span className="text-xs font-mono font-bold text-cyan-300 flex-shrink-0">{action.newSymbol}</span>
          )}
          {action.reportTime && (
            <Badge
              variant="secondary"
              className="text-[9px] h-4 px-1.5 font-mono bg-indigo-400/20 text-indigo-300 border-indigo-400/30"
            >
              {REPORT_TIME_LABELS[action.reportTime]}
            </Badge>
          )}
          {action.fiscalPeriod && (
            <span className="text-[10px] text-muted-foreground font-mono">{action.fiscalPeriod}</span>
          )}
        </div>
        <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-muted-foreground flex-shrink-0">
          {action.venue}
        </Badge>
      </div>
      <CorporateDetail action={action} />
      {action.description && (
        <div className="mt-0.5 text-[10px] text-muted-foreground/80 truncate">{action.description}</div>
      )}
    </div>
  );
}

function CorporateDetail({ action }: { action: CorporateAction }) {
  switch (action.actionType) {
    case "dividend":
      return (
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          {action.amount !== undefined && (
            <Metric
              label="Amt"
              value={
                <span className="text-amber-400 font-semibold">
                  {action.currency ?? "$"} {action.amount.toFixed(4)}
                </span>
              }
            />
          )}
          {action.yieldPct !== undefined && (
            <Metric
              label="Yield"
              value={<span className="text-emerald-400 font-semibold">{action.yieldPct.toFixed(2)}%</span>}
            />
          )}
          {action.frequency && (
            <Metric
              label="Freq"
              value={<span className="text-slate-300">{action.frequency.replace(/_/g, " ")}</span>}
            />
          )}
          <Metric label="Rec" value={<span className="text-sky-300">{fmtShortDate(action.recordDate)}</span>} />
          <Metric label="Pay" value={<span className="text-violet-300">{fmtShortDate(action.payDate)}</span>} />
        </div>
      );

    case "earnings": {
      const released = action.actualEps !== null && action.actualEps !== undefined;
      const surprise = action.surprisePct ?? null;
      const sc = surpriseClass(surprise);
      return (
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <Metric
            label="EPS"
            value={
              released ? (
                <span className={cn("font-semibold", sc)}>{action.actualEps!.toFixed(2)}</span>
              ) : (
                <span className="text-muted-foreground/60">-</span>
              )
            }
          />
          <Metric
            label="vs"
            value={
              action.estimatedEps !== null && action.estimatedEps !== undefined ? (
                <span className="text-slate-400">{action.estimatedEps.toFixed(2)}</span>
              ) : (
                <span className="text-muted-foreground/60">-</span>
              )
            }
          />
          <Metric
            label="Rev"
            value={
              action.actualRevenue !== null && action.actualRevenue !== undefined ? (
                <span className={cn("font-semibold", sc)}>{fmtMoneyCompact(action.actualRevenue)}</span>
              ) : (
                <span className="text-muted-foreground/60">-</span>
              )
            }
          />
          <Metric
            label="vs"
            value={<span className="text-slate-400">{fmtMoneyCompact(action.estimatedRevenue ?? null)}</span>}
          />
          {surprise !== null && (
            <Metric
              label="Surp"
              value={
                <span className={cn("font-semibold", sc)}>
                  {surprise > 0 ? "+" : ""}
                  {surprise.toFixed(2)}%
                </span>
              }
            />
          )}
        </div>
      );
    }

    case "split":
    case "reverse_split":
      return (
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <Metric
            label="Ratio"
            value={
              action.ratio !== undefined ? (
                <span className="text-emerald-400 font-semibold">
                  {action.actionType === "reverse_split" ? `1:${action.ratio}` : `${action.ratio}:1`}
                </span>
              ) : (
                "-"
              )
            }
          />
          <Metric label="Decl" value={<span className="text-slate-300">{fmtShortDate(action.declarationDate)}</span>} />
          <Metric label="Rec" value={<span className="text-sky-300">{fmtShortDate(action.recordDate)}</span>} />
          {action.dataAdjusted && <span className="text-[10px] text-emerald-400/80">adj.</span>}
        </div>
      );

    case "symbol_change":
      return (
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <Metric label="Decl" value={<span className="text-slate-300">{fmtShortDate(action.declarationDate)}</span>} />
          {action.reason && <span className="text-[10px] text-muted-foreground italic truncate">{action.reason}</span>}
        </div>
      );

    case "spinoff":
    case "merger":
      return (
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <Metric
            label="Parent"
            value={<span className="text-cyan-300">{action.parentSymbol ?? action.symbol}</span>}
          />
          <Metric
            label="→"
            value={
              <span className="text-cyan-400 font-semibold">{action.targetSymbol ?? action.newSymbol ?? "-"}</span>
            }
          />
          <Metric
            label="Ratio"
            value={action.ratio !== undefined ? <span className="text-emerald-400">{action.ratio}:1</span> : "-"}
          />
          <Metric label="Rec" value={<span className="text-sky-300">{fmtShortDate(action.recordDate)}</span>} />
        </div>
      );

    case "delisting":
      return (
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <Metric label="Eff" value={<span className="text-rose-400">{fmtShortDate(action.effectiveDate)}</span>} />
          {action.reason && <span className="text-[10px] text-muted-foreground italic truncate">{action.reason}</span>}
        </div>
      );

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Market structure
// ---------------------------------------------------------------------------

function MarketStructureTabContent() {
  const { data: events = [], isLoading } = useMarketStructureEvents();
  const today = events.filter((e) => isTodayUtc(e.date));
  if (isLoading) return <div className="text-sm text-muted-foreground py-4">Loading…</div>;
  if (today.length === 0) return <EmptyTab label="market structure events" />;
  const groups = sortedEntries(
    groupBy(today, (e) => e.eventType),
    (k) => MARKET_STRUCTURE_LABELS[k],
  );
  return (
    <div className="space-y-1">
      {groups.map(([type, items]) => (
        <div key={type}>
          <GroupHeader
            label={MARKET_STRUCTURE_LABELS[type]}
            count={items.length}
            colorClass={MARKET_STRUCTURE_COLORS[type]}
          />
          <div className="space-y-1">
            {items.map((evt) => (
              <MarketStructureRow key={evt.id} event={evt} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MarketStructureRow({ event }: { event: MarketStructureEvent }) {
  return (
    <div className="rounded-md border border-border/60 bg-card/40 px-2.5 py-1.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {event.asset && (
            <span className="font-bold text-xs font-mono text-cyan-400 flex-shrink-0">{event.asset}</span>
          )}
          <span className="font-semibold text-xs truncate">{event.label}</span>
          {event.time && <span className="text-[10px] text-sky-300/80 font-mono">{event.time}Z</span>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {event.venue && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-muted-foreground">
              {event.venue}
            </Badge>
          )}
          <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", IMPORTANCE_COLORS[event.importance])}>
            {event.importance}
          </Badge>
        </div>
      </div>
      <MarketStructureDetail event={event} />
      {event.description && (
        <div className="mt-0.5 text-[10px] text-muted-foreground/80 truncate">{event.description}</div>
      )}
    </div>
  );
}

function MarketStructureDetail({ event }: { event: MarketStructureEvent }) {
  switch (event.eventType) {
    case "options_expiry":
    case "futures_expiry":
      return (
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          {event.openInterest !== undefined && (
            <Metric
              label="OI"
              value={<span className="text-violet-400 font-semibold">{fmtIntCompact(event.openInterest)}</span>}
            />
          )}
          {event.notionalUsd !== undefined && (
            <Metric
              label="Notional"
              value={<span className="text-amber-400 font-semibold">{fmtMoneyCompact(event.notionalUsd)}</span>}
            />
          )}
          {event.impactedSymbols && event.impactedSymbols.length > 0 && (
            <Metric
              label="Contracts"
              value={<span className="text-cyan-300">{event.impactedSymbols.slice(0, 6).join(", ")}</span>}
            />
          )}
        </div>
      );
    case "halving":
    case "network_upgrade":
      return (
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          {event.blockHeight !== undefined && (
            <Metric
              label="Block"
              value={<span className="text-yellow-400 font-semibold">{event.blockHeight.toLocaleString("en-US")}</span>}
            />
          )}
          {event.networkVersion && (
            <Metric label="Ver" value={<span className="text-violet-300">{event.networkVersion}</span>} />
          )}
        </div>
      );
    case "exchange_halt":
      return (
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <Metric
            label="Status"
            value={
              event.resumedAt ? (
                <span className="text-emerald-400">resumed</span>
              ) : (
                <span className="text-rose-400">halted</span>
              )
            }
          />
          {event.haltReason && (
            <span className="text-[10px] text-muted-foreground italic truncate">{event.haltReason}</span>
          )}
        </div>
      );
    case "liquidity_event":
      return event.notionalUsd !== undefined ? (
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <Metric
            label="Notional"
            value={<span className="text-amber-400 font-semibold">{fmtMoneyCompact(event.notionalUsd)}</span>}
          />
        </div>
      ) : null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main component — tabbed
// ---------------------------------------------------------------------------

function TabBadge({ count }: { count: number }) {
  return <span className="ml-1 text-[10px] font-mono bg-muted/50 text-foreground/80 rounded px-1">{count}</span>;
}

function CalendarFeedInner() {
  const { data: macro = [] } = useEconomicEvents();
  const { data: corp = [] } = useCorporateActions();
  const { data: market = [] } = useMarketStructureEvents();
  const macroCount = macro.filter((e) => isTodayUtc(e.date)).length;
  const corpCount = corp.filter((a) => isTodayUtc(a.effectiveDate)).length;
  const marketCount = market.filter((e) => isTodayUtc(e.date)).length;

  return (
    <Tabs defaultValue="macro" className="w-full">
      <TabsList className="h-7 w-full justify-start">
        <TabsTrigger value="macro" className="text-[11px] h-6 gap-1">
          <TrendingUp className="h-3 w-3" />
          Macro
          <TabBadge count={macroCount} />
        </TabsTrigger>
        <TabsTrigger value="corporate" className="text-[11px] h-6 gap-1">
          <Building2 className="h-3 w-3" />
          Corporate
          <TabBadge count={corpCount} />
        </TabsTrigger>
        <TabsTrigger value="market" className="text-[11px] h-6 gap-1">
          <Layers className="h-3 w-3" />
          Market
          <TabBadge count={marketCount} />
        </TabsTrigger>
      </TabsList>
      <TabsContent value="macro" className="mt-2">
        <MacroTabContent />
      </TabsContent>
      <TabsContent value="corporate" className="mt-2">
        <CorporateTabContent />
      </TabsContent>
      <TabsContent value="market" className="mt-2">
        <MarketStructureTabContent />
      </TabsContent>
    </Tabs>
  );
}

export function CalendarEventFeed({ className, hideTitle = false }: { className?: string; hideTitle?: boolean }) {
  const [open, setOpen] = React.useState(true);

  if (hideTitle) {
    return (
      <Collapsible open={open} onOpenChange={setOpen} className={cn("w-full", className)}>
        <CollapsibleContent className="px-4 pb-4 pt-2">
          <CalendarFeedInner />
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn("w-full", className)}>
      <Card className="rounded-lg border">
        <CardHeader className="py-3 px-4">
          <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Calendar Events: Today
            </CardTitle>
            {open ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0">
            <CalendarFeedInner />
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
