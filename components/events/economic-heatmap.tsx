"use client";

/**
 * EconomicHeatmap — calendar heatmap view of economic events.
 *
 * Grid: day cells over a rolling 3-month window (prev · current · next).
 * Cell color: max importance among the day's releases. Upcoming days are tinted by
 * importance; released days overlay a surprise tint (green/red) averaged across releases.
 * Click a cell to open a drawer listing that day's events.
 */

import * as React from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EconomicEvent, EconomicEventImportance, EconomicEventType } from "@/lib/types/data-service";

const EVENT_LABELS: Record<EconomicEventType, string> = {
  fomc: "FOMC",
  nfp: "NFP",
  cpi: "CPI",
  gdp: "GDP",
  pce: "PCE",
  initial_claims: "Claims",
  election: "Election",
  other_macro: "Macro",
};

const EVENT_COLORS: Record<EconomicEventType, string> = {
  fomc: "text-violet-400 border-violet-400/30 bg-violet-400/10",
  nfp: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  cpi: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  gdp: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  pce: "text-pink-400 border-pink-400/30 bg-pink-400/10",
  initial_claims: "text-slate-400 border-slate-400/30 bg-slate-400/10",
  election: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  other_macro: "text-slate-400 border-slate-400/30 bg-slate-400/10",
};

// Solid dot color per event type, used inside day cells to communicate the type mix.
const EVENT_DOT: Record<EconomicEventType, string> = {
  fomc: "bg-violet-400",
  nfp: "bg-sky-400",
  cpi: "bg-orange-400",
  gdp: "bg-emerald-400",
  pce: "bg-pink-400",
  initial_claims: "bg-slate-300",
  election: "bg-yellow-400",
  other_macro: "bg-slate-400",
};

// ─── Date helpers (UTC) ────────────────────────────────────────────────────────

const MS_DAY = 86_400_000;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function toUtcMidnight(iso: string): Date {
  // events are YYYY-MM-DD; parse as UTC so TZ doesn't shift the day.
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

function isoDay(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addMonths(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
}

function monthStart(year: number, monthIdx: number): Date {
  return new Date(Date.UTC(year, monthIdx, 1));
}

function monthGridStart(year: number, monthIdx: number): Date {
  // First cell on Monday of the week containing the 1st.
  const first = monthStart(year, monthIdx);
  const day = first.getUTCDay(); // 0=Sun..6=Sat
  const mondayOffset = (day + 6) % 7;
  return new Date(first.getTime() - mondayOffset * MS_DAY);
}

function daysInMonth(year: number, monthIdx: number): number {
  return new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
}

// ─── Cell aggregation ──────────────────────────────────────────────────────────

type DayBucket = {
  events: EconomicEvent[];
  maxImportance: EconomicEventImportance | null;
  avgSurprise: number | null; // only if all released events have surprise
  allReleased: boolean;
};

const IMPORTANCE_RANK: Record<EconomicEventImportance, number> = { low: 0, medium: 1, high: 2 };

function bucketByDay(events: EconomicEvent[]): Map<string, DayBucket> {
  const map = new Map<string, DayBucket>();
  for (const ev of events) {
    const key = ev.date.slice(0, 10);
    let b = map.get(key);
    if (!b) {
      b = { events: [], maxImportance: null, avgSurprise: null, allReleased: true };
      map.set(key, b);
    }
    b.events.push(ev);
    if (!b.maxImportance || IMPORTANCE_RANK[ev.importance] > IMPORTANCE_RANK[b.maxImportance]) {
      b.maxImportance = ev.importance;
    }
  }
  const now = Date.now();
  for (const [, b] of map) {
    const surprises: number[] = [];
    let released = 0;
    for (const ev of b.events) {
      const past = toUtcMidnight(ev.date).getTime() < now;
      if (past) released += 1;
      if (past && ev.surprise !== null && ev.surprise !== undefined) surprises.push(ev.surprise);
    }
    b.allReleased = released === b.events.length && b.events.length > 0;
    b.avgSurprise = surprises.length ? surprises.reduce((s, v) => s + v, 0) / surprises.length : null;
  }
  return map;
}

// ─── Color class per cell ─────────────────────────────────────────────────────

function cellClasses(bucket: DayBucket | undefined, today: boolean): string {
  if (!bucket) {
    return "bg-muted/5 border-border/20";
  }
  // Released + has surprise → saturated surprise tint.
  if (bucket.allReleased && bucket.avgSurprise !== null) {
    const s = bucket.avgSurprise;
    if (s > 0.02) return "bg-emerald-500/35 border-emerald-400/70 shadow-[inset_0_0_12px_rgba(16,185,129,0.25)]";
    if (s > 0.005) return "bg-emerald-500/20 border-emerald-400/50";
    if (s < -0.02) return "bg-rose-500/35 border-rose-400/70 shadow-[inset_0_0_12px_rgba(244,63,94,0.25)]";
    if (s < -0.005) return "bg-rose-500/20 border-rose-400/50";
    return "bg-slate-400/15 border-slate-400/40";
  }
  // Upcoming or unreleased → importance tint (thicker border + inner glow on high).
  switch (bucket.maxImportance) {
    case "high":
      return cn(
        "bg-red-500/25 border-red-400/70 border-[1.5px] shadow-[inset_0_0_10px_rgba(248,113,113,0.25)]",
        today && "ring-1 ring-red-400/80",
      );
    case "medium":
      return "bg-amber-500/20 border-amber-400/55";
    case "low":
      return "bg-slate-400/15 border-slate-400/40";
    default:
      return "bg-muted/5 border-border/20";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EconomicHeatmap({ events }: { events: EconomicEvent[] }) {
  // Anchor view around "today" (UTC month). User can step ±.
  const [anchorOffset, setAnchorOffset] = React.useState(0);
  const [selectedDay, setSelectedDay] = React.useState<string | null>(null);
  const [nowMs] = React.useState(() => Date.now());

  const buckets = React.useMemo(() => bucketByDay(events), [events]);

  const today = React.useMemo(() => {
    const now = new Date(nowMs);
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }, [nowMs]);
  const todayKey = isoDay(today);

  const anchor = React.useMemo(() => {
    const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    return addMonths(base, anchorOffset);
  }, [today, anchorOffset]);

  // Three months to render: prev · current · next (relative to anchor).
  const months = React.useMemo(() => [addMonths(anchor, -1), anchor, addMonths(anchor, 1)], [anchor]);

  const windowStart = months[0]?.getTime() ?? nowMs;
  const windowEnd = React.useMemo(() => {
    const last = months[months.length - 1];
    if (!last) return nowMs;
    return addMonths(last, 1).getTime() - 1;
  }, [months, nowMs]);

  const selectedBucket = selectedDay ? buckets.get(selectedDay) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0"
            onClick={() => setAnchorOffset((n) => n - 1)}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-[11px]"
            onClick={() => setAnchorOffset(0)}
            disabled={anchorOffset === 0}
          >
            Today
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0"
            onClick={() => setAnchorOffset((n) => n + 1)}
            aria-label="Next month"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
        <Legend />
      </div>

      <div className="grid gap-3 grid-cols-1 lg:grid-cols-[7fr_3fr]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
          {months.map((m) => (
            <MonthGrid
              key={isoDay(m)}
              month={m}
              buckets={buckets}
              todayKey={todayKey}
              selectedDay={selectedDay}
              onSelect={setSelectedDay}
            />
          ))}
        </div>

        <aside className="border border-border/50 rounded-md bg-card/40 min-w-0 max-h-[calc(100vh-22rem)] overflow-auto">
          {selectedDay && selectedBucket ? (
            <DayDetail dayKey={selectedDay} bucket={selectedBucket} />
          ) : selectedDay ? (
            <div className="px-4 py-4 space-y-2">
              <div className="text-sm font-semibold">{formatFullDate(selectedDay)}</div>
              <div className="text-xs text-muted-foreground">No economic events scheduled.</div>
            </div>
          ) : (
            <UpcomingPanel
              events={events}
              nowMs={nowMs}
              windowStart={windowStart}
              windowEnd={windowEnd}
              onSelect={setSelectedDay}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function UpcomingPanel({
  events,
  nowMs,
  windowStart,
  windowEnd,
  onSelect,
}: {
  events: EconomicEvent[];
  nowMs: number;
  windowStart: number;
  windowEnd: number;
  onSelect: (dayKey: string) => void;
}) {
  const { upcoming, typeMix, highCount, totalInWindow } = React.useMemo(() => {
    const byType = new Map<EconomicEventType, number>();
    const future: EconomicEvent[] = [];
    let high = 0;
    let total = 0;
    for (const ev of events) {
      const t = toUtcMidnight(ev.date).getTime();
      if (t < windowStart || t > windowEnd) continue;
      total += 1;
      byType.set(ev.eventType, (byType.get(ev.eventType) ?? 0) + 1);
      if (ev.importance === "high") high += 1;
      if (t >= nowMs - MS_DAY) future.push(ev);
    }
    future.sort((a, b) => {
      const da = toUtcMidnight(a.date).getTime();
      const db = toUtcMidnight(b.date).getTime();
      if (da !== db) return da - db;
      return (a.time ?? "").localeCompare(b.time ?? "");
    });
    return {
      upcoming: future.slice(0, 8),
      typeMix: Array.from(byType.entries()).sort(([, a], [, b]) => b - a),
      highCount: high,
      totalInWindow: total,
    };
  }, [events, nowMs, windowStart, windowEnd]);

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-border/50 space-y-2 bg-card/60 sticky top-0 z-10 backdrop-blur">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-sm font-semibold">3-month window</div>
          <div className="text-[10px] font-mono text-muted-foreground tabular-nums">{totalInWindow} events</div>
        </div>
        {highCount > 0 && (
          <div className="inline-flex items-center gap-1 text-[11px] text-red-400 font-semibold">
            <Flame className="size-3" />
            {highCount} high-importance
          </div>
        )}
        {typeMix.length > 0 && (
          <div className="flex items-center gap-x-2 gap-y-1 flex-wrap pt-1">
            {typeMix.map(([type, n]) => (
              <span key={type} className="inline-flex items-center gap-1 text-[10px]">
                <span className={cn("size-1.5 rounded-full", EVENT_DOT[type])} />
                <span className="font-mono tabular-nums text-foreground/80">{n}</span>
                <span className="text-muted-foreground/70">{EVENT_LABELS[type]}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="px-3 py-3 space-y-1.5">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70 px-1">Next up</div>
        {upcoming.length === 0 ? (
          <div className="text-xs text-muted-foreground py-6 text-center">No upcoming events in this window.</div>
        ) : (
          upcoming.map((ev) => {
            const dayKey = ev.date.slice(0, 10);
            const daysOut = Math.round((toUtcMidnight(ev.date).getTime() - nowMs) / MS_DAY);
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => onSelect(dayKey)}
                className="w-full text-left rounded-md border border-border/40 bg-card/60 hover:bg-card/90 hover:border-border/70 p-2 transition-colors flex items-start gap-2.5"
              >
                <div className="flex-shrink-0 w-10 text-center">
                  <div className="text-[8px] uppercase tracking-wide text-muted-foreground/70 leading-none">
                    {new Date(ev.date).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
                  </div>
                  <div className="text-base font-mono font-bold tabular-nums leading-none mt-1">
                    {toUtcMidnight(ev.date).getUTCDate()}
                  </div>
                  <div className="text-[8px] font-mono text-muted-foreground/60 leading-none mt-1 tabular-nums">
                    {daysOut <= 0 ? "today" : `+${daysOut}d`}
                  </div>
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className={cn("text-[9px] h-4 px-1", EVENT_COLORS[ev.eventType])}>
                      {EVENT_LABELS[ev.eventType]}
                    </Badge>
                    {ev.importance === "high" && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] text-red-400 font-bold">
                        <Flame className="size-2.5" />
                        HIGH
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-medium leading-tight line-clamp-2">{ev.label}</div>
                  <div className="text-[9px] text-muted-foreground font-mono tabular-nums">
                    {ev.time ?? "-"} · {ev.country}
                    {ev.period && ` · ${ev.period}`}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function MonthGrid({
  month,
  buckets,
  todayKey,
  selectedDay,
  onSelect,
}: {
  month: Date;
  buckets: Map<string, DayBucket>;
  todayKey: string;
  selectedDay: string | null;
  onSelect: (dayKey: string) => void;
}) {
  const year = month.getUTCFullYear();
  const monthIdx = month.getUTCMonth();

  // 6 weeks × 7 days covers any month layout.
  const cells = React.useMemo(() => {
    const startMs = monthGridStart(year, monthIdx).getTime();
    return Array.from({ length: 42 }, (_, i) => new Date(startMs + i * MS_DAY));
  }, [year, monthIdx]);

  // Per-month roll-up: total events, high-importance count.
  const { total, highCount } = React.useMemo(() => {
    const prefix = `${year}-${String(monthIdx + 1).padStart(2, "0")}-`;
    let t = 0;
    let h = 0;
    for (const [key, bucket] of buckets) {
      if (!key.startsWith(prefix)) continue;
      t += bucket.events.length;
      h += bucket.events.filter((e) => e.importance === "high").length;
    }
    return { total: t, highCount: h };
  }, [buckets, year, monthIdx]);

  return (
    <div className="border border-border/40 rounded-md bg-card/30 p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold tracking-wide uppercase text-foreground/90">
          {MONTH_NAMES[monthIdx].slice(0, 3)} {year}
        </h3>
        <div className="flex items-center gap-1.5 text-[9px] font-mono tabular-nums text-muted-foreground">
          <span>{total}</span>
          {highCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-red-400">
              <Flame className="size-2.5" />
              {highCount}
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-[3px] mb-0.5">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className={cn(
              "text-center text-[8px] uppercase tracking-wide font-medium",
              w === "Sat" || w === "Sun" ? "text-muted-foreground/40" : "text-muted-foreground/60",
            )}
          >
            {w.slice(0, 1)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-[3px]">
        {cells.map((d) => {
          const inMonth = d.getUTCMonth() === monthIdx;
          const key = isoDay(d);
          const bucket = buckets.get(key);
          const isToday = key === todayKey;
          const isSelected = key === selectedDay;
          const surprise = bucket?.allReleased ? bucket.avgSurprise : null;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              disabled={!bucket}
              className={cn(
                "relative rounded-[3px] border transition-all overflow-hidden",
                "h-[52px] p-1 flex flex-col justify-between text-left",
                cellClasses(bucket, isToday),
                !inMonth && "opacity-25",
                bucket &&
                  "hover:scale-[1.06] hover:z-10 cursor-pointer hover:shadow-[0_0_0_1px_rgba(255,255,255,0.15)]",
                !bucket && "cursor-default",
                isToday && !isSelected && "ring-1 ring-foreground/50",
                isSelected && "ring-2 ring-primary ring-offset-1 ring-offset-background z-20 scale-[1.03]",
              )}
              title={bucket ? `${key}: ${bucket.events.length} event${bucket.events.length === 1 ? "" : "s"}` : key}
              aria-label={`${key}${bucket ? `: ${bucket.events.length} events` : ""}`}
            >
              <div className="flex items-start justify-between gap-1 leading-none">
                <span
                  className={cn(
                    "text-[10px] font-mono tabular-nums",
                    isToday
                      ? "font-bold text-foreground"
                      : bucket
                        ? "font-medium text-foreground/85"
                        : "text-muted-foreground/40",
                  )}
                >
                  {d.getUTCDate()}
                </span>
                {surprise !== null && (
                  <span
                    className={cn(
                      "text-[9px] font-mono font-bold tabular-nums",
                      surprise > 0.005 ? "text-emerald-200" : surprise < -0.005 ? "text-rose-200" : "text-slate-300",
                    )}
                  >
                    {surprise > 0 ? "+" : ""}
                    {(surprise * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              {bucket && (
                <div className="flex items-center gap-[2px] flex-wrap">
                  {bucket.events.slice(0, 4).map((ev, i) => (
                    <span
                      key={`${ev.id}-${i}`}
                      className={cn(
                        "size-[6px] rounded-full ring-1 ring-black/20 shadow-sm",
                        EVENT_DOT[ev.eventType],
                        ev.importance === "high" && "size-[7px] shadow-[0_0_4px_rgba(255,255,255,0.4)]",
                      )}
                      title={EVENT_LABELS[ev.eventType]}
                    />
                  ))}
                  {bucket.events.length > 4 && (
                    <span className="text-[8px] font-mono font-bold leading-none text-foreground/80 ml-0.5">
                      +{bucket.events.length - 4}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
      <span className="font-semibold">Upcoming:</span>
      <LegendSwatch className="bg-red-400/20 border-red-400/50" label="High" />
      <LegendSwatch className="bg-amber-400/15 border-amber-400/40" label="Medium" />
      <LegendSwatch className="bg-slate-400/10 border-slate-400/30" label="Low" />
      <span className="ml-2 font-semibold">Released:</span>
      <LegendSwatch className="bg-emerald-400/25 border-emerald-400/50" label="Beat" />
      <LegendSwatch className="bg-rose-400/25 border-rose-400/50" label="Miss" />
    </div>
  );
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("inline-block size-3 rounded border", className)} />
      {label}
    </span>
  );
}

function formatFullDate(dayKey: string): string {
  const d = toUtcMidnight(dayKey);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function DayDetail({ dayKey, bucket }: { dayKey: string; bucket: DayBucket }) {
  const sorted = [...bucket.events].sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  const [now] = React.useState(() => Date.now());

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-border/50 space-y-1 bg-card/60 sticky top-0 z-10 backdrop-blur">
        <div className="text-sm font-semibold leading-snug">{formatFullDate(dayKey)}</div>
        <div className="text-[11px] text-muted-foreground">
          {bucket.events.length} event{bucket.events.length === 1 ? "" : "s"}
          {bucket.allReleased && bucket.avgSurprise !== null && (
            <>
              {" · avg surprise "}
              <span
                className={cn(
                  "font-mono font-semibold",
                  bucket.avgSurprise > 0.005
                    ? "text-emerald-400"
                    : bucket.avgSurprise < -0.005
                      ? "text-rose-400"
                      : "text-slate-300",
                )}
              >
                {bucket.avgSurprise > 0 ? "+" : ""}
                {(bucket.avgSurprise * 100).toFixed(1)}%
              </span>
            </>
          )}
        </div>
      </div>
      <div className="px-3 py-3 space-y-2.5">
        {sorted.map((ev) => {
          const past = toUtcMidnight(ev.date).getTime() < now;
          return (
            <div key={ev.id} className="rounded-md border border-border/50 bg-card/60 p-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className={cn("text-[10px] h-5 flex-shrink-0", EVENT_COLORS[ev.eventType])}>
                    {EVENT_LABELS[ev.eventType]}
                  </Badge>
                  <span className="text-xs font-medium truncate">{ev.label}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">{ev.time ?? "-"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <Metric label="Forecast" value={ev.forecast} unit={ev.unit} />
                <Metric
                  label="Actual"
                  value={ev.actual}
                  unit={ev.unit}
                  tone={
                    past && ev.surprise !== null && ev.surprise !== undefined
                      ? ev.surprise > 0.005
                        ? "text-emerald-400"
                        : ev.surprise < -0.005
                          ? "text-rose-400"
                          : "text-slate-200"
                      : "text-slate-200"
                  }
                  emphasis
                />
                <Metric label="Prev" value={ev.previous} unit={ev.unit} tone="text-muted-foreground" />
              </div>
              <p className="text-[11px] leading-snug text-foreground/80">{ev.description}</p>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="truncate">
                  {ev.country}
                  {ev.source && <> · {ev.source}</>}
                  {ev.period && <> · {ev.period}</>}
                </span>
                <span className="capitalize flex-shrink-0">{ev.importance}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  tone = "text-slate-200",
  emphasis,
}: {
  label: string;
  value: number | null | undefined;
  unit?: string;
  tone?: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground/70">{label}</div>
      <div className={cn("font-mono tabular-nums", emphasis ? "text-sm font-semibold" : "text-xs", tone)}>
        {value === null || value === undefined ? (
          <span className="text-muted-foreground/50">-</span>
        ) : (
          <>
            {value}
            {unit && <span className="text-muted-foreground/70 ml-0.5 text-[9px] font-normal">{unit}</span>}
          </>
        )}
      </div>
    </div>
  );
}
