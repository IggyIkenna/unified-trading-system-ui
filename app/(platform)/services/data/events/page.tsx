"use client";

/**
 * /services/data/events — Market events and calendar data.
 *
 * Four sub-sections (tabbed within the page):
 *   1. Economic Events — FOMC, NFP, CPI, GDP, Elections (from features-calendar-service via FRED)
 *   2. Corporate Actions — splits, symbol changes, delistings, dividends, mergers (TradFi)
 *   3. Market Structure — options expiry, futures expiry, halvings, network upgrades
 *   4. Holidays — exchange closures and partial closes by region/venue
 */

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusDot } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Calendar,
  TrendingUp,
  GitBranch,
  Building2,
  Globe,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
} from "lucide-react";
import {
  useCalendarHolidays,
  useCorporateActions,
  useEconomicEvents,
  useMarketStructureEvents,
} from "@/hooks/api/use-calendar";
import type {
  CalendarHoliday,
  CorporateAction,
  EconomicEvent,
  EconomicEventImportance,
  EconomicEventType,
  MarketStructureEvent,
  MarketStructureEventType,
  CorporateActionType,
} from "@/lib/types/data-service";

// ─── Shared helpers ────────────────────────────────────────────────────────────

const IMPORTANCE_COLORS: Record<EconomicEventImportance, string> = {
  high: "text-red-400 border-red-400/30 bg-red-400/10",
  medium: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  low: "text-slate-400 border-slate-400/30 bg-slate-400/10",
};

function importanceStatus(importance: EconomicEventImportance): "critical" | "warning" | "idle" {
  if (importance === "high") return "critical";
  if (importance === "medium") return "warning";
  return "idle";
}

function isPast(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatShortDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function formatMoneyCompact(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function formatIntCompact(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

const REPORT_TIME_LABELS: Record<"bmo" | "amc" | "during", string> = {
  bmo: "BMO",
  amc: "AMC",
  during: "Intraday",
};

function KVInline({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-1 min-w-0">
      <span className="text-[9px] uppercase tracking-wide text-muted-foreground/80 flex-shrink-0">{label}</span>
      <span className="text-[11px] font-mono truncate">{value}</span>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  count,
  iconClass,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  count?: number;
  iconClass?: string;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-muted/40", iconClass ?? "text-primary")}>
          <Icon className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {count !== undefined && (
        <Badge variant="secondary" className="text-xs tabular-nums">
          {count} events
        </Badge>
      )}
    </div>
  );
}

// ─── Economic Events ───────────────────────────────────────────────────────────

const ECONOMIC_EVENT_LABELS: Record<EconomicEventType, string> = {
  fomc: "FOMC",
  nfp: "NFP",
  cpi: "CPI",
  gdp: "GDP",
  pce: "PCE",
  initial_claims: "Initial Claims",
  election: "Election",
  other_macro: "Macro",
};

const ECONOMIC_EVENT_COLORS: Record<EconomicEventType, string> = {
  fomc: "text-violet-400 border-violet-400/30 bg-violet-400/10",
  nfp: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  cpi: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  gdp: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  pce: "text-pink-400 border-pink-400/30 bg-pink-400/10",
  initial_claims: "text-slate-400 border-slate-400/30 bg-slate-400/10",
  election: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  other_macro: "text-slate-400 border-slate-400/30 bg-slate-400/10",
};

function SurpriseBadge({ surprise }: { surprise: number | null | undefined }) {
  if (surprise === null || surprise === undefined) return null;
  const pct = Math.round(surprise * 100);
  const tone =
    pct > 0
      ? "text-emerald-400 border-emerald-400/40 bg-emerald-400/10"
      : pct < 0
        ? "text-rose-400 border-rose-400/40 bg-rose-400/10"
        : "text-slate-300 border-slate-300/40 bg-slate-300/10";
  return (
    <Badge variant="outline" className={cn("text-[10px] h-4 tabular-nums font-semibold", tone)}>
      {pct > 0 ? "+" : ""}
      {pct}%
    </Badge>
  );
}

function EconomicEventsTab({ events }: { events: EconomicEvent[] }) {
  const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcoming = sorted.filter((e) => !isPast(e.date));
  const past = sorted.filter((e) => isPast(e.date));

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={TrendingUp}
        title="Economic Calendar"
        subtitle="FOMC, NFP, CPI, GDP and other macro releases. Source: FRED API + hardcoded Fed calendar."
        count={events.length}
        iconClass="text-violet-400"
      />

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <CircleDot className="size-3 text-sky-400" />
            Upcoming
          </p>
          <Card className="border-border/50">
            <CardContent className="p-0 divide-y divide-border/30">
              {upcoming.map((ev) => (
                <div key={ev.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <StatusDot status={importanceStatus(ev.importance)} className="size-2 flex-shrink-0" />
                  <div className="w-24 flex-shrink-0">
                    <p className="text-xs font-mono text-muted-foreground">{formatDate(ev.date)}</p>
                    {ev.time && <p className="text-[10px] text-muted-foreground/60">{ev.time} UTC</p>}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] h-5 flex-shrink-0", ECONOMIC_EVENT_COLORS[ev.eventType])}
                  >
                    {ECONOMIC_EVENT_LABELS[ev.eventType]}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {ev.label}
                      {ev.period && <span className="ml-1 text-[10px] text-muted-foreground">· {ev.period}</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {ev.country}
                      {ev.source && <span> · {ev.source}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {ev.forecast !== undefined && ev.forecast !== null && (
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Forecast</p>
                        <p className="text-xs font-mono">
                          {ev.forecast}
                          {ev.unit && <span className="text-muted-foreground ml-0.5">{ev.unit}</span>}
                        </p>
                      </div>
                    )}
                    {ev.previous !== undefined && ev.previous !== null && (
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Prev</p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {ev.previous}
                          {ev.unit && <span className="ml-0.5">{ev.unit}</span>}
                        </p>
                      </div>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] h-4 flex-shrink-0", IMPORTANCE_COLORS[ev.importance])}
                  >
                    {ev.importance}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <CheckCircle2 className="size-3 text-emerald-400" />
            Released
          </p>
          <Card className="border-border/50 opacity-80">
            <CardContent className="p-0 divide-y divide-border/30">
              {past
                .slice()
                .reverse()
                .map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                    <StatusDot status={importanceStatus(ev.importance)} className="size-2 flex-shrink-0 opacity-40" />
                    <div className="w-24 flex-shrink-0">
                      <p className="text-xs font-mono text-muted-foreground">{formatDate(ev.date)}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] h-5 flex-shrink-0 opacity-70", ECONOMIC_EVENT_COLORS[ev.eventType])}
                    >
                      {ECONOMIC_EVENT_LABELS[ev.eventType]}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {ev.label}
                        {ev.period && <span className="ml-1 text-[10px] text-muted-foreground">· {ev.period}</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {ev.country}
                        {ev.source && <span> · {ev.source}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {ev.actual !== undefined && ev.actual !== null && (
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">Actual</p>
                          <p
                            className={cn(
                              "text-xs font-mono font-semibold",
                              ev.surprise !== null && ev.surprise !== undefined
                                ? ev.surprise > 0.005
                                  ? "text-emerald-400"
                                  : ev.surprise < -0.005
                                    ? "text-rose-400"
                                    : "text-slate-200"
                                : "text-slate-200",
                            )}
                          >
                            {ev.actual}
                            {ev.unit && <span className="text-muted-foreground ml-0.5">{ev.unit}</span>}
                          </p>
                        </div>
                      )}
                      {ev.forecast !== undefined && ev.forecast !== null && (
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">Forecast</p>
                          <p className="text-xs font-mono text-slate-400">
                            {ev.forecast}
                            {ev.unit && <span className="ml-0.5">{ev.unit}</span>}
                          </p>
                        </div>
                      )}
                      <SurpriseBadge surprise={ev.surprise} />
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Corporate Actions ─────────────────────────────────────────────────────────

const CORPORATE_ACTION_LABELS: Record<CorporateActionType, string> = {
  split: "Stock Split",
  reverse_split: "Reverse Split",
  symbol_change: "Symbol Change",
  delisting: "Delisting",
  spinoff: "Spin-off",
  dividend: "Dividend",
  earnings: "Earnings",
  merger: "Merger",
};

const CORPORATE_ACTION_COLORS: Record<CorporateActionType, string> = {
  split: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  reverse_split: "text-red-400 border-red-400/30 bg-red-400/10",
  symbol_change: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  delisting: "text-red-400 border-red-400/30 bg-red-400/10",
  spinoff: "text-violet-400 border-violet-400/30 bg-violet-400/10",
  dividend: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  earnings: "text-indigo-400 border-indigo-400/30 bg-indigo-400/10",
  merger: "text-pink-400 border-pink-400/30 bg-pink-400/10",
};

function CorporateActionsTab({ actions }: { actions: CorporateAction[] }) {
  const sorted = [...actions].sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={GitBranch}
        title="Corporate Actions"
        subtitle="Stock splits, symbol changes, delistings and other TradFi corporate events. Source: under research (Yahoo Finance / vendor TBD)."
        count={actions.length}
        iconClass="text-sky-400"
      />

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <AlertTriangle className="size-3 flex-shrink-0" />
            <span>
              Data source for corporate actions is currently under research. Candidates include Yahoo Finance (free),
              Polygon.io, and Refinitiv. This data will live in its own ingestion pipeline once a source is confirmed.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-0 divide-y divide-border/30">
          {sorted.map((action) => (
            <CorporateActionDetailRow key={action.id} action={action} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function CorporateActionDetailRow({ action }: { action: CorporateAction }) {
  return (
    <div className="px-4 py-3 hover:bg-muted/20 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-24 flex-shrink-0">
          <p className="text-xs font-mono text-muted-foreground">{formatDate(action.effectiveDate)}</p>
        </div>
        <Badge
          variant="outline"
          className={cn("text-[10px] h-5 flex-shrink-0", CORPORATE_ACTION_COLORS[action.actionType])}
        >
          {CORPORATE_ACTION_LABELS[action.actionType]}
        </Badge>
        <span className="text-xs font-mono font-bold w-20 flex-shrink-0 text-cyan-400">{action.symbol}</span>
        {action.newSymbol && (
          <>
            <span className="text-xs text-muted-foreground flex-shrink-0">→</span>
            <span className="text-xs font-mono font-bold text-cyan-300 flex-shrink-0">{action.newSymbol}</span>
          </>
        )}
        {action.reportTime && (
          <Badge
            variant="secondary"
            className="text-[10px] h-4 font-mono flex-shrink-0 bg-indigo-400/15 text-indigo-300 border-indigo-400/30"
          >
            {REPORT_TIME_LABELS[action.reportTime]}
          </Badge>
        )}
        {action.fiscalPeriod && (
          <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">{action.fiscalPeriod}</span>
        )}
        <span className="flex-1 text-xs text-muted-foreground truncate">{action.description}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="outline" className="text-[10px] h-4 text-muted-foreground">
            {action.venue}
          </Badge>
          {action.dataAdjusted && (
            <Badge variant="outline" className="text-[10px] h-4 text-emerald-400 border-emerald-400/30">
              Adjusted
            </Badge>
          )}
        </div>
      </div>
      <CorporateActionDetail action={action} />
    </div>
  );
}

function CorporateActionDetail({ action }: { action: CorporateAction }) {
  const hasDetail =
    action.actionType === "dividend" ||
    action.actionType === "earnings" ||
    action.actionType === "split" ||
    action.actionType === "reverse_split" ||
    action.actionType === "symbol_change" ||
    action.actionType === "spinoff" ||
    action.actionType === "merger" ||
    action.actionType === "delisting";
  if (!hasDetail) return null;

  switch (action.actionType) {
    case "dividend":
      return (
        <div className="mt-1.5 ml-[108px] flex items-center gap-x-5 gap-y-1 flex-wrap">
          <KVInline
            label="Amount"
            value={
              action.amount !== undefined ? (
                <span className="text-amber-400 font-semibold">
                  {action.currency ?? "$"} {action.amount.toFixed(4)}
                </span>
              ) : (
                "—"
              )
            }
          />
          <KVInline
            label="Yield"
            value={
              action.yieldPct !== undefined ? (
                <span className="text-emerald-400 font-semibold">{action.yieldPct.toFixed(2)}%</span>
              ) : (
                "—"
              )
            }
          />
          <KVInline
            label="Freq"
            value={
              action.frequency ? <span className="text-slate-300">{action.frequency.replace(/_/g, " ")}</span> : "—"
            }
          />
          <KVInline
            label="Declared"
            value={<span className="text-slate-300">{formatShortDate(action.declarationDate)}</span>}
          />
          <KVInline
            label="Ex-Date"
            value={<span className="text-amber-300">{formatShortDate(action.effectiveDate)}</span>}
          />
          <KVInline label="Record" value={<span className="text-sky-300">{formatShortDate(action.recordDate)}</span>} />
          <KVInline label="Pay" value={<span className="text-violet-300">{formatShortDate(action.payDate)}</span>} />
        </div>
      );

    case "earnings": {
      const released = action.actualEps !== null && action.actualEps !== undefined;
      const surprise = action.surprisePct;
      const surpriseColor =
        surprise !== null && surprise !== undefined
          ? surprise > 0.5
            ? "text-emerald-400"
            : surprise < -0.5
              ? "text-rose-400"
              : "text-slate-300"
          : "text-slate-300";
      return (
        <div className="mt-1.5 ml-[108px] flex items-center gap-x-5 gap-y-1 flex-wrap">
          <KVInline
            label="EPS Actual"
            value={
              released ? (
                <span className={cn("font-semibold", surpriseColor)}>{action.actualEps!.toFixed(2)}</span>
              ) : (
                <span className="text-muted-foreground/60">—</span>
              )
            }
          />
          <KVInline
            label="EPS Est"
            value={
              action.estimatedEps !== null && action.estimatedEps !== undefined ? (
                <span className="text-slate-400">{action.estimatedEps.toFixed(2)}</span>
              ) : (
                "—"
              )
            }
          />
          <KVInline
            label="Rev Actual"
            value={
              action.actualRevenue !== null && action.actualRevenue !== undefined ? (
                <span className={cn("font-semibold", surpriseColor)}>{formatMoneyCompact(action.actualRevenue)}</span>
              ) : (
                <span className="text-muted-foreground/60">—</span>
              )
            }
          />
          <KVInline
            label="Rev Est"
            value={<span className="text-slate-400">{formatMoneyCompact(action.estimatedRevenue ?? null)}</span>}
          />
          {surprise !== null && surprise !== undefined && (
            <KVInline
              label="Surprise"
              value={
                <span className={cn("font-semibold", surpriseColor)}>
                  {surprise > 0 ? "+" : ""}
                  {surprise.toFixed(2)}%
                </span>
              }
            />
          )}
          <KVInline
            label="Announced"
            value={<span className="text-slate-300">{formatShortDate(action.declarationDate)}</span>}
          />
        </div>
      );
    }

    case "split":
    case "reverse_split":
      return (
        <div className="mt-1.5 ml-[108px] flex items-center gap-x-5 gap-y-1 flex-wrap">
          <KVInline
            label="Ratio"
            value={
              action.ratio !== undefined ? (
                <span className="text-emerald-400 font-semibold">
                  {action.actionType === "reverse_split" ? `1:${action.ratio}` : `${action.ratio}:1`}
                </span>
              ) : (
                "—"
              )
            }
          />
          <KVInline
            label="Declared"
            value={<span className="text-slate-300">{formatShortDate(action.declarationDate)}</span>}
          />
          <KVInline label="Record" value={<span className="text-sky-300">{formatShortDate(action.recordDate)}</span>} />
          <KVInline
            label="Effective"
            value={<span className="text-violet-300">{formatShortDate(action.effectiveDate)}</span>}
          />
        </div>
      );

    case "symbol_change":
      return (
        <div className="mt-1.5 ml-[108px] flex items-center gap-x-5 gap-y-1 flex-wrap">
          <KVInline label="From" value={<span className="text-cyan-300 font-semibold">{action.symbol}</span>} />
          <KVInline label="To" value={<span className="text-cyan-400 font-bold">{action.newSymbol ?? "—"}</span>} />
          <KVInline
            label="Declared"
            value={<span className="text-slate-300">{formatShortDate(action.declarationDate)}</span>}
          />
          <KVInline
            label="Effective"
            value={<span className="text-violet-300">{formatShortDate(action.effectiveDate)}</span>}
          />
          {action.reason && (
            <KVInline label="Reason" value={<span className="text-slate-300 italic">{action.reason}</span>} />
          )}
        </div>
      );

    case "spinoff":
    case "merger":
      return (
        <div className="mt-1.5 ml-[108px] flex items-center gap-x-5 gap-y-1 flex-wrap">
          <KVInline
            label="Parent"
            value={<span className="text-cyan-300 font-semibold">{action.parentSymbol ?? action.symbol}</span>}
          />
          <KVInline
            label="Target"
            value={<span className="text-cyan-400 font-bold">{action.targetSymbol ?? action.newSymbol ?? "—"}</span>}
          />
          <KVInline
            label="Ratio"
            value={
              action.ratio !== undefined ? (
                <span className="text-emerald-400 font-semibold">{action.ratio}:1</span>
              ) : (
                "—"
              )
            }
          />
          <KVInline label="Record" value={<span className="text-sky-300">{formatShortDate(action.recordDate)}</span>} />
          <KVInline
            label="Effective"
            value={<span className="text-violet-300">{formatShortDate(action.effectiveDate)}</span>}
          />
        </div>
      );

    case "delisting":
      return (
        <div className="mt-1.5 ml-[108px] flex items-center gap-x-5 gap-y-1 flex-wrap">
          <KVInline
            label="Effective"
            value={<span className="text-rose-400 font-semibold">{formatShortDate(action.effectiveDate)}</span>}
          />
          <KVInline label="Reason" value={<span className="text-slate-300 italic">{action.reason ?? "—"}</span>} />
        </div>
      );

    default:
      return null;
  }
}

// ─── Market Structure Events ───────────────────────────────────────────────────

const MARKET_STRUCTURE_LABELS: Record<MarketStructureEventType, string> = {
  options_expiry: "Options Expiry",
  futures_expiry: "Futures Expiry",
  halving: "Halving",
  network_upgrade: "Network Upgrade",
  exchange_halt: "Exchange Halt",
  liquidity_event: "Liquidity Event",
};

const MARKET_STRUCTURE_COLORS: Record<MarketStructureEventType, string> = {
  options_expiry: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  futures_expiry: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  halving: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  network_upgrade: "text-violet-400 border-violet-400/30 bg-violet-400/10",
  exchange_halt: "text-red-400 border-red-400/30 bg-red-400/10",
  liquidity_event: "text-sky-400 border-sky-400/30 bg-sky-400/10",
};

function MarketStructureTab({ events }: { events: MarketStructureEvent[] }) {
  const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcoming = sorted.filter((e) => !isPast(e.date));
  const past = sorted.filter((e) => isPast(e.date));

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Building2}
        title="Market Structure Events"
        subtitle="Options and futures expiries, Bitcoin halvings, Ethereum upgrades, and other structural market events."
        count={events.length}
        iconClass="text-orange-400"
      />

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <CircleDot className="size-3 text-sky-400" />
            Upcoming
          </p>
          <Card className="border-border/50">
            <CardContent className="p-0 divide-y divide-border/30">
              {upcoming.map((ev) => (
                <MarketStructureDetailRow key={ev.id} event={ev} />
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <CheckCircle2 className="size-3 text-emerald-400" />
            Past
          </p>
          <Card className="border-border/50 opacity-75">
            <CardContent className="p-0 divide-y divide-border/30">
              {past
                .slice()
                .reverse()
                .map((ev) => (
                  <MarketStructureDetailRow key={ev.id} event={ev} dim />
                ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function MarketStructureDetailRow({ event, dim = false }: { event: MarketStructureEvent; dim?: boolean }) {
  return (
    <div className={cn("px-4 py-3 hover:bg-muted/20 transition-colors", dim && "opacity-80")}>
      <div className="flex items-center gap-3">
        {!dim && <StatusDot status={importanceStatus(event.importance)} className="size-2 flex-shrink-0" />}
        <div className="w-24 flex-shrink-0">
          <p className="text-xs font-mono text-muted-foreground">{formatDate(event.date)}</p>
          {event.time && <p className="text-[10px] text-muted-foreground/60">{event.time} UTC</p>}
        </div>
        <Badge
          variant="outline"
          className={cn("text-[10px] h-5 flex-shrink-0", MARKET_STRUCTURE_COLORS[event.eventType], dim && "opacity-70")}
        >
          {MARKET_STRUCTURE_LABELS[event.eventType]}
        </Badge>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{event.label}</p>
          <p className="text-[10px] text-muted-foreground truncate">{event.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {event.venue && (
            <Badge variant="outline" className="text-[10px] h-4 text-muted-foreground">
              {event.venue}
            </Badge>
          )}
          {event.asset && (
            <Badge variant="secondary" className="text-[10px] h-4 font-mono">
              {event.asset}
            </Badge>
          )}
          {!dim && (
            <Badge variant="outline" className={cn("text-[10px] h-4", IMPORTANCE_COLORS[event.importance])}>
              {event.importance}
            </Badge>
          )}
        </div>
      </div>
      <MarketStructureDetail event={event} />
    </div>
  );
}

function MarketStructureDetail({ event }: { event: MarketStructureEvent }) {
  switch (event.eventType) {
    case "options_expiry":
    case "futures_expiry":
      return (
        <div className="mt-1.5 ml-[108px] flex items-center gap-x-5 gap-y-1 flex-wrap">
          {event.openInterest !== undefined && (
            <KVInline
              label="Open Interest"
              value={<span className="text-violet-400 font-semibold">{formatIntCompact(event.openInterest)}</span>}
            />
          )}
          {event.notionalUsd !== undefined && (
            <KVInline
              label="Notional"
              value={<span className="text-amber-400 font-semibold">{formatMoneyCompact(event.notionalUsd)}</span>}
            />
          )}
          {event.impactedSymbols && event.impactedSymbols.length > 0 && (
            <KVInline
              label="Contracts"
              value={<span className="text-cyan-300">{event.impactedSymbols.slice(0, 8).join(", ")}</span>}
            />
          )}
        </div>
      );
    case "halving":
    case "network_upgrade":
      return (
        <div className="mt-1.5 ml-[108px] flex items-center gap-x-5 gap-y-1 flex-wrap">
          <KVInline
            label="Block Height"
            value={
              event.blockHeight !== undefined ? (
                <span className="text-yellow-400 font-semibold">{event.blockHeight.toLocaleString("en-US")}</span>
              ) : (
                "—"
              )
            }
          />
          {event.networkVersion && (
            <KVInline label="Version" value={<span className="text-violet-300">{event.networkVersion}</span>} />
          )}
          {event.asset && (
            <KVInline label="Asset" value={<span className="text-cyan-400 font-semibold">{event.asset}</span>} />
          )}
        </div>
      );
    case "exchange_halt":
      return (
        <div className="mt-1.5 ml-[108px] flex items-center gap-x-5 gap-y-1 flex-wrap">
          <KVInline
            label="Status"
            value={
              event.resumedAt ? (
                <span className="text-emerald-400 font-semibold">resumed</span>
              ) : (
                <span className="text-rose-400 font-semibold">halted</span>
              )
            }
          />
          <KVInline label="Reason" value={<span className="text-slate-300 italic">{event.haltReason ?? "—"}</span>} />
          {event.resumedAt && (
            <KVInline
              label="Resumed"
              value={<span className="text-emerald-300">{formatShortDate(event.resumedAt)}</span>}
            />
          )}
        </div>
      );
    case "liquidity_event":
      return event.notionalUsd !== undefined ? (
        <div className="mt-1.5 ml-[108px] flex items-center gap-x-5 gap-y-1 flex-wrap">
          <KVInline
            label="Notional"
            value={<span className="text-amber-400 font-semibold">{formatMoneyCompact(event.notionalUsd)}</span>}
          />
          {event.impactedSymbols && event.impactedSymbols.length > 0 && (
            <KVInline
              label="Impacted"
              value={<span className="text-cyan-300">{event.impactedSymbols.slice(0, 8).join(", ")}</span>}
            />
          )}
        </div>
      ) : null;
    default:
      return null;
  }
}

// ─── Holidays ──────────────────────────────────────────────────────────────────

const REGION_COLORS: Record<string, string> = {
  global: "text-violet-400 border-violet-400/30 bg-violet-400/10",
  US: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  UK: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  EU: "text-indigo-400 border-indigo-400/30 bg-indigo-400/10",
  JP: "text-rose-400 border-rose-400/30 bg-rose-400/10",
  AU: "text-amber-400 border-amber-400/30 bg-amber-400/10",
};

function HolidaysTab({ holidays }: { holidays: CalendarHoliday[] }) {
  const sorted = [...holidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcoming = sorted.filter((h) => !isPast(h.date));
  const past = sorted.filter((h) => isPast(h.date));

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Globe}
        title="Exchange Holidays & Closures"
        subtitle="Market holidays and early closes by region. Sourced from features-calendar-service."
        count={holidays.length}
        iconClass="text-emerald-400"
      />

      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <CircleDot className="size-3 text-sky-400" />
            Upcoming
          </p>
          <Card className="border-border/50">
            <CardContent className="p-0 divide-y divide-border/30">
              {upcoming.map((h) => (
                <div key={h.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="w-24 flex-shrink-0">
                    <p className="text-xs font-mono text-muted-foreground">{formatDate(h.date)}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] h-5 flex-shrink-0", REGION_COLORS[h.region] ?? REGION_COLORS.global)}
                  >
                    {h.region}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{h.label}</p>
                    <p className="text-[10px] text-muted-foreground">{h.affectedVenues.join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {h.isPartialClose ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 text-amber-400 border-amber-400/30 flex items-center gap-1"
                      >
                        <Clock className="size-2.5" />
                        Early close {h.closeTime}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-4 text-red-400 border-red-400/30">
                        Full close
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <CheckCircle2 className="size-3 text-emerald-400" />
            Past
          </p>
          <Card className="border-border/50 opacity-75">
            <CardContent className="p-0 divide-y divide-border/30">
              {past
                .slice()
                .reverse()
                .map((h) => (
                  <div key={h.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                    <div className="w-24 flex-shrink-0">
                      <p className="text-xs font-mono text-muted-foreground">{formatDate(h.date)}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] h-5 flex-shrink-0 opacity-70",
                        REGION_COLORS[h.region] ?? REGION_COLORS.global,
                      )}
                    >
                      {h.region}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{h.label}</p>
                      <p className="text-[10px] text-muted-foreground">{h.affectedVenues.join(", ")}</p>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── KPI Bar ───────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconClass?: string;
}) {
  return (
    <Card className="border-border/50 bg-card/60">
      <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
        <div className={cn("p-1.5 rounded-md bg-muted/40", iconClass)}>
          <Icon className="size-3.5" />
        </div>
        <div>
          <div className="text-xl font-bold font-mono tabular-nums">{value}</div>
          <div className="text-[10px] text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const { data: economicEvents = [] } = useEconomicEvents();
  const { data: corporateActions = [] } = useCorporateActions();
  const { data: marketStructureEvents = [] } = useMarketStructureEvents();
  const { data: holidays = [] } = useCalendarHolidays();

  const upcomingEconomic = economicEvents.filter((e) => !isPast(e.date)).length;
  const upcomingMarket = marketStructureEvents.filter((e) => !isPast(e.date)).length;
  const upcomingHolidays = holidays.filter((h) => !isPast(h.date)).length;

  return (
    <div className="p-6 space-y-6 platform-page-width">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Calendar className="size-5 text-primary" />
            Events
          </span>
        }
        description="Economic releases, corporate actions, market structure events, and exchange holidays. Equivalent to raw data — pre-processed, no further transformation needed."
      />

      {/* KPI bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Upcoming macro releases"
          value={upcomingEconomic}
          icon={TrendingUp}
          iconClass="text-violet-400"
        />
        <KpiCard
          label="Corporate actions tracked"
          value={corporateActions.length}
          icon={GitBranch}
          iconClass="text-sky-400"
        />
        <KpiCard label="Market structure events" value={upcomingMarket} icon={Building2} iconClass="text-orange-400" />
        <KpiCard
          label="Upcoming exchange closures"
          value={upcomingHolidays}
          icon={Globe}
          iconClass="text-emerald-400"
        />
      </div>

      {/* Sub-tabs */}
      <Tabs defaultValue="economic">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="economic" className="text-xs">
                Economic
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              FOMC, NFP, CPI, GDP and other macro releases (FRED + Fed calendar).
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="corporate" className="text-xs">
                Corporate
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              Stock splits, symbol changes, delistings, and other TradFi corporate events.
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="market" className="text-xs">
                Market Structure
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              Options and futures expiries, halvings, network upgrades, and structural events.
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="holidays" className="text-xs">
                Holidays
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              Exchange holidays, full closes, and early closes by region.
            </TooltipContent>
          </Tooltip>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="economic">
            <EconomicEventsTab events={economicEvents} />
          </TabsContent>
          <TabsContent value="corporate">
            <CorporateActionsTab actions={corporateActions} />
          </TabsContent>
          <TabsContent value="market">
            <MarketStructureTab events={marketStructureEvents} />
          </TabsContent>
          <TabsContent value="holidays">
            <HolidaysTab holidays={holidays} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
