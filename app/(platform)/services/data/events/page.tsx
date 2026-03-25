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
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  MOCK_ECONOMIC_EVENTS,
  MOCK_MARKET_STRUCTURE_EVENTS,
  MOCK_CALENDAR_HOLIDAYS,
  MOCK_CORPORATE_ACTIONS,
} from "@/lib/data-service-mock-data";
import type {
  EconomicEventImportance,
  EconomicEventType,
  MarketStructureEventType,
  CorporateActionType,
} from "@/lib/data-service-types";

// ─── Shared helpers ────────────────────────────────────────────────────────────

const IMPORTANCE_COLORS: Record<EconomicEventImportance, string> = {
  high: "text-red-400 border-red-400/30 bg-red-400/10",
  medium: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  low: "text-slate-400 border-slate-400/30 bg-slate-400/10",
};

const IMPORTANCE_DOT: Record<EconomicEventImportance, string> = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-slate-400",
};

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
        <div
          className={cn(
            "p-2 rounded-lg bg-muted/40",
            iconClass ?? "text-primary",
          )}
        >
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
  const positive = pct >= 0;
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] h-4 tabular-nums",
        positive
          ? "text-emerald-400 border-emerald-400/30"
          : "text-red-400 border-red-400/30",
      )}
    >
      {positive ? "+" : ""}
      {pct}%
    </Badge>
  );
}

function EconomicEventsTab() {
  const sorted = [...MOCK_ECONOMIC_EVENTS].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const upcoming = sorted.filter((e) => !isPast(e.date));
  const past = sorted.filter((e) => isPast(e.date));

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={TrendingUp}
        title="Economic Calendar"
        subtitle="FOMC, NFP, CPI, GDP and other macro releases. Source: FRED API + hardcoded Fed calendar."
        count={MOCK_ECONOMIC_EVENTS.length}
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
                <div
                  key={ev.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                >
                  <div
                    className={cn(
                      "size-2 rounded-full flex-shrink-0",
                      IMPORTANCE_DOT[ev.importance],
                    )}
                  />
                  <div className="w-24 flex-shrink-0">
                    <p className="text-xs font-mono text-muted-foreground">
                      {formatDate(ev.date)}
                    </p>
                    {ev.time && (
                      <p className="text-[10px] text-muted-foreground/60">
                        {ev.time} UTC
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-5 flex-shrink-0",
                      ECONOMIC_EVENT_COLORS[ev.eventType],
                    )}
                  >
                    {ECONOMIC_EVENT_LABELS[ev.eventType]}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{ev.label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {ev.country}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {ev.forecast !== undefined && ev.forecast !== null && (
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">
                          Forecast
                        </p>
                        <p className="text-xs font-mono">
                          {ev.forecast}
                          {ev.unit && (
                            <span className="text-muted-foreground ml-0.5">
                              {ev.unit}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    {ev.previous !== undefined && ev.previous !== null && (
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">
                          Prev
                        </p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {ev.previous}
                          {ev.unit && <span className="ml-0.5">{ev.unit}</span>}
                        </p>
                      </div>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-4 flex-shrink-0",
                      IMPORTANCE_COLORS[ev.importance],
                    )}
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
                  <div
                    key={ev.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <div
                      className={cn(
                        "size-2 rounded-full flex-shrink-0 opacity-40",
                        IMPORTANCE_DOT[ev.importance],
                      )}
                    />
                    <div className="w-24 flex-shrink-0">
                      <p className="text-xs font-mono text-muted-foreground">
                        {formatDate(ev.date)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] h-5 flex-shrink-0 opacity-70",
                        ECONOMIC_EVENT_COLORS[ev.eventType],
                      )}
                    >
                      {ECONOMIC_EVENT_LABELS[ev.eventType]}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{ev.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {ev.country}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {ev.actual !== undefined && ev.actual !== null && (
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">
                            Actual
                          </p>
                          <p className="text-xs font-mono font-medium">
                            {ev.actual}
                            {ev.unit && (
                              <span className="text-muted-foreground ml-0.5">
                                {ev.unit}
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                      {ev.forecast !== undefined && ev.forecast !== null && (
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">
                            Forecast
                          </p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {ev.forecast}
                            {ev.unit && (
                              <span className="ml-0.5">{ev.unit}</span>
                            )}
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
  dividend: "Special Dividend",
  merger: "Merger",
};

const CORPORATE_ACTION_COLORS: Record<CorporateActionType, string> = {
  split: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  reverse_split: "text-red-400 border-red-400/30 bg-red-400/10",
  symbol_change: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  delisting: "text-red-400 border-red-400/30 bg-red-400/10",
  spinoff: "text-violet-400 border-violet-400/30 bg-violet-400/10",
  dividend: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  merger: "text-pink-400 border-pink-400/30 bg-pink-400/10",
};

function CorporateActionsTab() {
  const sorted = [...MOCK_CORPORATE_ACTIONS].sort(
    (a, b) =>
      new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime(),
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={GitBranch}
        title="Corporate Actions"
        subtitle="Stock splits, symbol changes, delistings and other TradFi corporate events. Source: under research (Yahoo Finance / vendor TBD)."
        count={MOCK_CORPORATE_ACTIONS.length}
        iconClass="text-sky-400"
      />

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <AlertTriangle className="size-3 flex-shrink-0" />
            <span>
              Data source for corporate actions is currently under research.
              Candidates include Yahoo Finance (free), Polygon.io, and
              Refinitiv. This data will live in its own ingestion pipeline once
              a source is confirmed.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-0 divide-y divide-border/30">
          {sorted.map((action) => (
            <div
              key={action.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
            >
              <div className="w-24 flex-shrink-0">
                <p className="text-xs font-mono text-muted-foreground">
                  {formatDate(action.effectiveDate)}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] h-5 flex-shrink-0",
                  CORPORATE_ACTION_COLORS[action.actionType],
                )}
              >
                {CORPORATE_ACTION_LABELS[action.actionType]}
              </Badge>
              <span className="text-xs font-mono font-semibold w-20 flex-shrink-0">
                {action.symbol}
              </span>
              {action.newSymbol && (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  → {action.newSymbol}
                </span>
              )}
              {action.ratio && (
                <Badge
                  variant="secondary"
                  className="text-[10px] h-4 font-mono flex-shrink-0"
                >
                  {action.ratio}:1
                </Badge>
              )}
              <span className="flex-1 text-xs text-muted-foreground truncate">
                {action.description}
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge
                  variant="outline"
                  className="text-[10px] h-4 text-muted-foreground"
                >
                  {action.venue}
                </Badge>
                {action.dataAdjusted && (
                  <Badge
                    variant="outline"
                    className="text-[10px] h-4 text-emerald-400 border-emerald-400/30"
                  >
                    Adjusted
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
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

function MarketStructureTab() {
  const sorted = [...MOCK_MARKET_STRUCTURE_EVENTS].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const upcoming = sorted.filter((e) => !isPast(e.date));
  const past = sorted.filter((e) => isPast(e.date));

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Building2}
        title="Market Structure Events"
        subtitle="Options and futures expiries, Bitcoin halvings, Ethereum upgrades, and other structural market events."
        count={MOCK_MARKET_STRUCTURE_EVENTS.length}
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
                <div
                  key={ev.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                >
                  <div
                    className={cn(
                      "size-2 rounded-full flex-shrink-0",
                      IMPORTANCE_DOT[ev.importance],
                    )}
                  />
                  <div className="w-24 flex-shrink-0">
                    <p className="text-xs font-mono text-muted-foreground">
                      {formatDate(ev.date)}
                    </p>
                    {ev.time && (
                      <p className="text-[10px] text-muted-foreground/60">
                        {ev.time} UTC
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-5 flex-shrink-0",
                      MARKET_STRUCTURE_COLORS[ev.eventType],
                    )}
                  >
                    {MARKET_STRUCTURE_LABELS[ev.eventType]}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{ev.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {ev.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {ev.venue && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 text-muted-foreground"
                      >
                        {ev.venue}
                      </Badge>
                    )}
                    {ev.asset && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-4 font-mono"
                      >
                        {ev.asset}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] h-4",
                        IMPORTANCE_COLORS[ev.importance],
                      )}
                    >
                      {ev.importance}
                    </Badge>
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
                .map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="w-24 flex-shrink-0">
                      <p className="text-xs font-mono text-muted-foreground">
                        {formatDate(ev.date)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] h-5 flex-shrink-0 opacity-70",
                        MARKET_STRUCTURE_COLORS[ev.eventType],
                      )}
                    >
                      {MARKET_STRUCTURE_LABELS[ev.eventType]}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{ev.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {ev.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {ev.asset && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-4 font-mono"
                        >
                          {ev.asset}
                        </Badge>
                      )}
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

// ─── Holidays ──────────────────────────────────────────────────────────────────

const REGION_COLORS: Record<string, string> = {
  global: "text-violet-400 border-violet-400/30 bg-violet-400/10",
  US: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  UK: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  EU: "text-indigo-400 border-indigo-400/30 bg-indigo-400/10",
  JP: "text-rose-400 border-rose-400/30 bg-rose-400/10",
  AU: "text-amber-400 border-amber-400/30 bg-amber-400/10",
};

function HolidaysTab() {
  const sorted = [...MOCK_CALENDAR_HOLIDAYS].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const upcoming = sorted.filter((h) => !isPast(h.date));
  const past = sorted.filter((h) => isPast(h.date));

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Globe}
        title="Exchange Holidays & Closures"
        subtitle="Market holidays and early closes by region. Sourced from features-calendar-service."
        count={MOCK_CALENDAR_HOLIDAYS.length}
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
                <div
                  key={h.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="w-24 flex-shrink-0">
                    <p className="text-xs font-mono text-muted-foreground">
                      {formatDate(h.date)}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-5 flex-shrink-0",
                      REGION_COLORS[h.region] ?? REGION_COLORS.global,
                    )}
                  >
                    {h.region}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{h.label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {h.affectedVenues.join(", ")}
                    </p>
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
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 text-red-400 border-red-400/30"
                      >
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
                  <div
                    key={h.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="w-24 flex-shrink-0">
                      <p className="text-xs font-mono text-muted-foreground">
                        {formatDate(h.date)}
                      </p>
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
                      <p className="text-[10px] text-muted-foreground">
                        {h.affectedVenues.join(", ")}
                      </p>
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
          <div className="text-xl font-bold font-mono tabular-nums">
            {value}
          </div>
          <div className="text-[10px] text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const upcomingEconomic = MOCK_ECONOMIC_EVENTS.filter(
    (e) => !isPast(e.date),
  ).length;
  const upcomingMarket = MOCK_MARKET_STRUCTURE_EVENTS.filter(
    (e) => !isPast(e.date),
  ).length;
  const upcomingHolidays = MOCK_CALENDAR_HOLIDAYS.filter(
    (h) => !isPast(h.date),
  ).length;

  return (
    <div className="p-6 space-y-6 platform-page-width">
      {/* Page header */}
      <div>
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="size-5 text-primary" />
          Events
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Economic releases, corporate actions, market structure events, and
          exchange holidays. Equivalent to raw data — pre-processed, no further
          transformation needed.
        </p>
      </div>

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
          value={MOCK_CORPORATE_ACTIONS.length}
          icon={GitBranch}
          iconClass="text-sky-400"
        />
        <KpiCard
          label="Market structure events"
          value={upcomingMarket}
          icon={Building2}
          iconClass="text-orange-400"
        />
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
          <TabsTrigger value="economic" className="text-xs">
            Economic
          </TabsTrigger>
          <TabsTrigger value="corporate" className="text-xs">
            Corporate
          </TabsTrigger>
          <TabsTrigger value="market" className="text-xs">
            Market Structure
          </TabsTrigger>
          <TabsTrigger value="holidays" className="text-xs">
            Holidays
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="economic">
            <EconomicEventsTab />
          </TabsContent>
          <TabsContent value="corporate">
            <CorporateActionsTab />
          </TabsContent>
          <TabsContent value="market">
            <MarketStructureTab />
          </TabsContent>
          <TabsContent value="holidays">
            <HolidaysTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
