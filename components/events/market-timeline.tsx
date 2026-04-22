"use client";

/**
 * MarketTimeline — horizontal swim-lane timeline for market structure events.
 *
 * Lanes: one row per event type (options expiry, futures expiry, halving, etc.).
 * X-axis: linear time over a rolling window (default ±90 days from today, centered).
 * Each event renders as a node on its lane at its timestamp; click → drawer with detail.
 */

import * as React from "react";
import { ChevronLeft, ChevronRight, MousePointerClick, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MarketStructureEvent, MarketStructureEventType } from "@/lib/types/data-service";

const EVENT_LABELS: Record<MarketStructureEventType, string> = {
  options_expiry: "Options Expiry",
  futures_expiry: "Futures Expiry",
  halving: "Halving",
  network_upgrade: "Network Upgrade",
  exchange_halt: "Exchange Halt",
  liquidity_event: "Liquidity Event",
};

const EVENT_COLORS: Record<MarketStructureEventType, { dot: string; badge: string; accent: string }> = {
  options_expiry: {
    dot: "bg-orange-400 border-orange-300",
    badge: "text-orange-400 border-orange-400/30 bg-orange-400/10",
    accent: "text-orange-400",
  },
  futures_expiry: {
    dot: "bg-amber-400 border-amber-300",
    badge: "text-amber-400 border-amber-400/30 bg-amber-400/10",
    accent: "text-amber-400",
  },
  halving: {
    dot: "bg-yellow-400 border-yellow-300",
    badge: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    accent: "text-yellow-400",
  },
  network_upgrade: {
    dot: "bg-violet-400 border-violet-300",
    badge: "text-violet-400 border-violet-400/30 bg-violet-400/10",
    accent: "text-violet-400",
  },
  exchange_halt: {
    dot: "bg-red-400 border-red-300",
    badge: "text-red-400 border-red-400/30 bg-red-400/10",
    accent: "text-red-400",
  },
  liquidity_event: {
    dot: "bg-sky-400 border-sky-300",
    badge: "text-sky-400 border-sky-400/30 bg-sky-400/10",
    accent: "text-sky-400",
  },
};

const LANE_ORDER: MarketStructureEventType[] = [
  "options_expiry",
  "futures_expiry",
  "liquidity_event",
  "network_upgrade",
  "halving",
  "exchange_halt",
];

const IMPORTANCE_SIZE: Record<"high" | "medium" | "low", string> = {
  high: "size-3.5",
  medium: "size-2.5",
  low: "size-2",
};

const MS_DAY = 86_400_000;

function toTime(iso: string): number {
  return new Date(iso).getTime();
}

function fmtShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
}

function fmtLong(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function fmtMoneyCompact(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function fmtIntCompact(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

const WINDOW_OPTIONS = [
  { value: 30, label: "30d" },
  { value: 90, label: "90d" },
  { value: 180, label: "6mo" },
  { value: 365, label: "1yr" },
] as const;

type WindowDays = (typeof WINDOW_OPTIONS)[number]["value"];

export function MarketTimeline({ events }: { events: MarketStructureEvent[] }) {
  const [windowDays, setWindowDays] = React.useState<WindowDays>(90);
  const [centerOffsetDays, setCenterOffsetDays] = React.useState(0);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const selected = React.useMemo(() => events.find((e) => e.id === selectedId) ?? null, [events, selectedId]);

  const [now] = React.useState(() => Date.now());
  const center = now + centerOffsetDays * MS_DAY;
  const rangeMs = windowDays * MS_DAY;
  const startMs = center - rangeMs / 2;
  const endMs = center + rangeMs / 2;

  // Filter events into window + bucket by lane.
  const lanes = React.useMemo(() => {
    const buckets = new Map<MarketStructureEventType, MarketStructureEvent[]>();
    for (const lane of LANE_ORDER) buckets.set(lane, []);
    for (const ev of events) {
      const t = toTime(ev.date);
      if (t < startMs || t > endMs) continue;
      const arr = buckets.get(ev.eventType);
      if (arr) arr.push(ev);
    }
    for (const arr of buckets.values()) arr.sort((a, b) => toTime(a.date) - toTime(b.date));
    return buckets;
  }, [events, startMs, endMs]);

  const totalInRange = React.useMemo(() => {
    let n = 0;
    for (const arr of lanes.values()) n += arr.length;
    return n;
  }, [lanes]);

  // Build tick marks along the axis (5 evenly spaced).
  const ticks = React.useMemo(() => {
    const n = 5;
    return Array.from({ length: n + 1 }, (_, i) => {
      const t = startMs + ((endMs - startMs) * i) / n;
      return { pct: (i / n) * 100, time: t };
    });
  }, [startMs, endMs]);

  function pctFor(iso: string): number {
    const t = toTime(iso);
    return Math.max(0, Math.min(100, ((t - startMs) / (endMs - startMs)) * 100));
  }

  const todayPct = ((now - startMs) / (endMs - startMs)) * 100;
  const todayInRange = todayPct >= 0 && todayPct <= 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0"
            onClick={() => setCenterOffsetDays((d) => d - Math.floor(windowDays / 2))}
            aria-label="Pan left"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-[11px]"
            onClick={() => setCenterOffsetDays(0)}
            disabled={centerOffsetDays === 0}
          >
            Now
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0"
            onClick={() => setCenterOffsetDays((d) => d + Math.floor(windowDays / 2))}
            aria-label="Pan right"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>

        <div className="inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-muted/30 p-0.5">
          {WINDOW_OPTIONS.map((opt) => {
            const active = windowDays === opt.value;
            return (
              <Button
                key={opt.value}
                type="button"
                size="sm"
                variant={active ? "secondary" : "ghost"}
                onClick={() => setWindowDays(opt.value)}
                className={cn(
                  "h-6 px-2 text-[10px] font-mono",
                  active ? "bg-background shadow-sm" : "text-muted-foreground",
                )}
              >
                {opt.label}
              </Button>
            );
          })}
        </div>

        <div className="text-[11px] text-muted-foreground tabular-nums">
          {totalInRange} event{totalInRange === 1 ? "" : "s"} in window
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 lg:grid-cols-[7fr_3fr]">
        <div className="border border-border/40 rounded-md bg-card/40 p-4 overflow-hidden min-w-0">
          {/* Axis (tick labels) */}
          <div className="relative h-5 mb-3 ml-[140px]">
            {ticks.map((t, i) => (
              <div
                key={i}
                className="absolute -translate-x-1/2 text-[10px] font-mono text-muted-foreground/70 tabular-nums"
                style={{ left: `${t.pct}%` }}
              >
                {new Date(t.time).toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" })}
              </div>
            ))}
          </div>

          {/* Lanes */}
          <div className="space-y-2">
            {LANE_ORDER.map((lane) => {
              const laneEvents = lanes.get(lane) ?? [];
              const colors = EVENT_COLORS[lane];
              return (
                <div key={lane} className="flex items-center gap-3">
                  <div className="w-[132px] flex-shrink-0 flex items-center gap-1.5">
                    <span className={cn("size-2 rounded-full", colors.dot.split(" ")[0])} />
                    <span className={cn("text-[10px] uppercase tracking-wide font-semibold", colors.accent)}>
                      {EVENT_LABELS[lane]}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 font-mono tabular-nums ml-auto">
                      {laneEvents.length}
                    </span>
                  </div>
                  <div className="relative h-8 flex-1 rounded bg-muted/20 border border-border/20">
                    {/* Vertical tick guides */}
                    {ticks.slice(1, -1).map((t, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 w-px bg-border/20"
                        style={{ left: `${t.pct}%` }}
                      />
                    ))}
                    {/* "Today" marker */}
                    {todayInRange && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-400/60"
                        style={{ left: `${todayPct}%` }}
                        title="Today"
                      />
                    )}
                    {/* Event nodes */}
                    {laneEvents.map((ev) => {
                      const past = toTime(ev.date) < now;
                      const isActive = ev.id === selectedId;
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setSelectedId(ev.id)}
                          className={cn(
                            "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all",
                            "hover:scale-150 hover:z-10 cursor-pointer",
                            colors.dot,
                            IMPORTANCE_SIZE[ev.importance],
                            past && !isActive && "opacity-50",
                            isActive && "scale-150 ring-2 ring-primary ring-offset-1 ring-offset-background z-20",
                          )}
                          style={{ left: `${pctFor(ev.date)}%` }}
                          title={`${fmtShort(ev.date)} — ${ev.label}`}
                          aria-label={`${ev.label} on ${fmtShort(ev.date)}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground mt-4 pt-3 border-t border-border/30">
            <span className="font-semibold">Dot size = importance:</span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block size-3.5 rounded-full bg-slate-500" /> High
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block size-2.5 rounded-full bg-slate-500" /> Medium
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block size-2 rounded-full bg-slate-500" /> Low
            </span>
            <span className="ml-2 font-semibold">Past dimmed 50%</span>
            {todayInRange && (
              <span className="inline-flex items-center gap-1 ml-2">
                <span className="inline-block w-0.5 h-3 bg-amber-400/60" /> Today
              </span>
            )}
          </div>
        </div>

        <aside className="border border-border/50 rounded-md bg-card/40 min-w-0 max-h-[calc(100vh-22rem)] overflow-auto">
          {selected ? (
            <EventDetail event={selected} />
          ) : (
            <div className="h-full min-h-[240px] flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
              <MousePointerClick className="size-5 text-muted-foreground/60" />
              <div className="text-xs font-medium text-muted-foreground">Select an event</div>
              <div className="text-[11px] text-muted-foreground/70 leading-relaxed">
                Click any dot on the timeline to inspect venue, notional/OI, impacted symbols and halt details here.
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function EventDetail({ event }: { event: MarketStructureEvent }) {
  const [now] = React.useState(() => Date.now());
  const past = toTime(event.date) < now;
  const colors = EVENT_COLORS[event.eventType];
  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-border/50 space-y-2 bg-card/60 sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={cn("text-[10px] h-5", colors.badge)}>
            {EVENT_LABELS[event.eventType]}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] h-5 capitalize",
              past
                ? "text-slate-400 border-slate-400/30 bg-slate-400/10"
                : "text-sky-400 border-sky-400/30 bg-sky-400/10",
            )}
          >
            {past ? "Past" : "Upcoming"}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] h-5 capitalize",
              event.importance === "high"
                ? "text-red-400 border-red-400/30 bg-red-400/10"
                : event.importance === "medium"
                  ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
                  : "text-slate-400 border-slate-400/30 bg-slate-400/10",
            )}
          >
            {event.importance}
          </Badge>
        </div>
        <div className="text-sm font-semibold leading-snug flex items-center gap-2">
          <Zap className={cn("size-4 flex-shrink-0", colors.accent)} />
          <span className="truncate">{event.label}</span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          {fmtLong(event.date)} {event.time && `· ${event.time} UTC`}
          {event.venue && ` · ${event.venue}`}
          {event.asset && ` · ${event.asset}`}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70 mb-1">Description</div>
          <p className="text-xs leading-relaxed text-foreground/90">{event.description}</p>
        </div>

        {(event.openInterest !== undefined || event.notionalUsd !== undefined) && (
          <div className="grid grid-cols-2 gap-2">
            {event.openInterest !== undefined && (
              <DetailTile
                label="Open Interest"
                value={<span className="text-violet-400 font-semibold">{fmtIntCompact(event.openInterest)}</span>}
              />
            )}
            {event.notionalUsd !== undefined && (
              <DetailTile
                label="Notional"
                value={<span className="text-amber-400 font-semibold">{fmtMoneyCompact(event.notionalUsd)}</span>}
              />
            )}
          </div>
        )}

        {(event.blockHeight !== undefined || event.networkVersion) && (
          <div className="grid grid-cols-2 gap-2">
            {event.blockHeight !== undefined && (
              <DetailTile
                label="Block Height"
                value={
                  <span className="text-yellow-400 font-mono font-semibold">{fmtIntCompact(event.blockHeight)}</span>
                }
              />
            )}
            {event.networkVersion && (
              <DetailTile
                label="Version"
                value={<span className="text-violet-300 font-mono">{event.networkVersion}</span>}
              />
            )}
          </div>
        )}

        {(event.haltReason || event.resumedAt) && (
          <div className="space-y-2">
            {event.haltReason && (
              <DetailTile
                label="Halt Reason"
                value={<span className="text-slate-300 italic">{event.haltReason}</span>}
              />
            )}
            {event.resumedAt && (
              <DetailTile
                label="Resumed At"
                value={<span className="text-emerald-300 font-mono">{fmtLong(event.resumedAt)}</span>}
              />
            )}
          </div>
        )}

        {event.impactedSymbols && event.impactedSymbols.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70 mb-1.5">
              Impacted Symbols ({event.impactedSymbols.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {event.impactedSymbols.map((sym) => (
                <Badge key={sym} variant="secondary" className="text-[10px] h-5 font-mono">
                  {sym}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/30">
          {event.venue && <DetailTile label="Venue" value={event.venue} />}
          {event.asset && <DetailTile label="Asset" value={<span className="font-mono">{event.asset}</span>} />}
          <DetailTile label="Event ID" value={<span className="font-mono text-[10px] break-all">{event.id}</span>} />
        </div>
      </div>
    </div>
  );
}

function DetailTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border/50 bg-card/60 p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70 mb-0.5">{label}</div>
      <div className="text-xs">{value}</div>
    </div>
  );
}
