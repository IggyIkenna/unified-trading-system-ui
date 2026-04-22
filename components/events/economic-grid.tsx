"use client";

/**
 * EconomicGrid — dense, sortable, filterable table view of economic events with a
 * detail drawer. Used as the "Pro Grid" layout for /services/data/events.
 */

import * as React from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, MousePointerClick, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

const IMPORTANCE_DOT: Record<EconomicEventImportance, string> = {
  high: "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]",
  medium: "bg-amber-400",
  low: "bg-slate-500",
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
}

function fmtLongDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function NumCell({ value, unit }: { value: number | null | undefined; unit?: string }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground/50">—</span>;
  return (
    <span className="font-mono tabular-nums">
      {value}
      {unit && <span className="text-muted-foreground/70 ml-0.5">{unit}</span>}
    </span>
  );
}

function ActualCell({ event }: { event: EconomicEvent }) {
  if (event.actual === null || event.actual === undefined) {
    return <span className="text-muted-foreground/50">—</span>;
  }
  const s = event.surprise;
  const tone =
    s !== null && s !== undefined
      ? s > 0.005
        ? "text-emerald-400"
        : s < -0.005
          ? "text-rose-400"
          : "text-slate-200"
      : "text-slate-200";
  return (
    <span className={cn("font-mono font-semibold tabular-nums", tone)}>
      {event.actual}
      {event.unit && <span className="text-muted-foreground/70 ml-0.5 font-normal">{event.unit}</span>}
    </span>
  );
}

function SurpriseCell({ surprise }: { surprise: number | null | undefined }) {
  if (surprise === null || surprise === undefined) return <span className="text-muted-foreground/40">—</span>;
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

const columnHelper = createColumnHelper<EconomicEvent>();

export function EconomicGrid({ events }: { events: EconomicEvent[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "date", desc: false }]);
  const [filter, setFilter] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const selected = React.useMemo(() => events.find((e) => e.id === selectedId) ?? null, [events, selectedId]);

  const columns = React.useMemo(
    () => [
      columnHelper.accessor((row) => row.date, {
        id: "date",
        header: "Date",
        cell: (info) => <span className="font-mono text-xs text-muted-foreground">{fmtDate(info.getValue())}</span>,
        sortingFn: (a, b, id) =>
          new Date(a.getValue<string>(id)).getTime() - new Date(b.getValue<string>(id)).getTime(),
        size: 72,
      }),
      columnHelper.accessor((row) => row.time ?? "", {
        id: "time",
        header: "Time",
        cell: (info) => (
          <span className="font-mono text-[11px] text-muted-foreground/70">{info.getValue() || "—"}</span>
        ),
        size: 56,
      }),
      columnHelper.accessor((row) => row.label, {
        id: "event",
        header: "Event",
        cell: (info) => {
          const ev = info.row.original;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <span className={cn("size-1.5 rounded-full flex-shrink-0", IMPORTANCE_DOT[ev.importance])} />
              <span className="text-xs font-medium truncate">{ev.label}</span>
              {ev.period && <span className="text-[10px] text-muted-foreground flex-shrink-0">· {ev.period}</span>}
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.eventType, {
        id: "type",
        header: "Type",
        cell: (info) => (
          <Badge variant="outline" className={cn("text-[10px] h-5", EVENT_COLORS[info.getValue()])}>
            {EVENT_LABELS[info.getValue()]}
          </Badge>
        ),
        size: 88,
      }),
      columnHelper.accessor((row) => row.country, {
        id: "country",
        header: "Country",
        cell: (info) => <span className="text-[11px] text-muted-foreground font-mono">{info.getValue()}</span>,
        size: 72,
      }),
      columnHelper.accessor((row) => row.forecast ?? null, {
        id: "forecast",
        header: () => <div className="text-right">Forecast</div>,
        cell: (info) => (
          <div className="text-right text-xs">
            <NumCell value={info.row.original.forecast} unit={info.row.original.unit} />
          </div>
        ),
        size: 88,
      }),
      columnHelper.accessor((row) => row.actual ?? null, {
        id: "actual",
        header: () => <div className="text-right">Actual</div>,
        cell: (info) => (
          <div className="text-right text-xs">
            <ActualCell event={info.row.original} />
          </div>
        ),
        size: 88,
      }),
      columnHelper.accessor((row) => row.previous ?? null, {
        id: "previous",
        header: () => <div className="text-right">Prev</div>,
        cell: (info) => (
          <div className="text-right text-xs text-muted-foreground">
            <NumCell value={info.row.original.previous} unit={info.row.original.unit} />
          </div>
        ),
        size: 80,
      }),
      columnHelper.accessor((row) => row.surprise ?? null, {
        id: "surprise",
        header: () => <div className="text-right">Surprise</div>,
        cell: (info) => (
          <div className="text-right">
            <SurpriseCell surprise={info.row.original.surprise} />
          </div>
        ),
        size: 72,
      }),
      columnHelper.accessor((row) => row.source ?? "", {
        id: "source",
        header: "Source",
        cell: (info) => <span className="text-[10px] text-muted-foreground/70 truncate">{info.getValue() || "—"}</span>,
        size: 120,
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: events,
    columns,
    state: { sorting, globalFilter: filter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, value: string) => {
      if (!value) return true;
      const needle = value.toLowerCase();
      const ev = row.original;
      return (
        ev.label.toLowerCase().includes(needle) ||
        ev.country.toLowerCase().includes(needle) ||
        (ev.source ?? "").toLowerCase().includes(needle) ||
        (ev.period ?? "").toLowerCase().includes(needle) ||
        EVENT_LABELS[ev.eventType].toLowerCase().includes(needle)
      );
    },
  });

  const rows = table.getRowModel().rows;
  const [nowMs] = React.useState(() => Date.now());

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
          <Input
            placeholder="Filter by event, country, source, period…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <div className="text-[11px] text-muted-foreground tabular-nums">
          {rows.length} of {events.length} events
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 lg:grid-cols-[7fr_3fr]">
        <div className="border border-border/50 rounded-md overflow-hidden bg-card/40 min-w-0">
          <div className="max-h-[calc(100vh-22rem)] overflow-auto">
            <table className="w-full text-xs table-fixed">
              <thead className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-border/50">
                    {hg.headers.map((h) => {
                      const canSort = h.column.getCanSort();
                      const sorted = h.column.getIsSorted();
                      return (
                        <th
                          key={h.id}
                          style={{ width: h.getSize() }}
                          className={cn(
                            "px-3 py-2 text-left text-[10px] uppercase tracking-wide font-semibold text-muted-foreground",
                            canSort && "cursor-pointer select-none hover:text-foreground transition-colors",
                          )}
                          onClick={canSort ? h.column.getToggleSortingHandler() : undefined}
                        >
                          <div className="flex items-center gap-1">
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            {canSort && (
                              <span className="text-muted-foreground/60">
                                {sorted === "asc" ? (
                                  <ArrowUp className="size-3" />
                                ) : sorted === "desc" ? (
                                  <ArrowDown className="size-3" />
                                ) : (
                                  <ArrowUpDown className="size-3 opacity-30" />
                                )}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground text-xs">
                      No events match the current filter.
                    </td>
                  </tr>
                )}
                {rows.map((row) => {
                  const ev = row.original;
                  const past = new Date(ev.date).getTime() < nowMs;
                  const isActive = ev.id === selectedId;
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedId(ev.id)}
                      className={cn(
                        "border-b border-border/20 cursor-pointer transition-colors",
                        isActive ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/30",
                        past && !isActive && "opacity-75",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-1.5 align-middle truncate">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="border border-border/50 rounded-md bg-card/40 min-w-0 max-h-[calc(100vh-22rem)] overflow-auto">
          {selected ? (
            <EventDetail event={selected} nowMs={nowMs} />
          ) : (
            <div className="h-full min-h-[240px] flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
              <MousePointerClick className="size-5 text-muted-foreground/60" />
              <div className="text-xs font-medium text-muted-foreground">Select an event</div>
              <div className="text-[11px] text-muted-foreground/70 leading-relaxed">
                Click any row to inspect forecast, actual, surprise, and source details here.
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function EventDetail({ event, nowMs }: { event: EconomicEvent; nowMs: number }) {
  const past = new Date(event.date).getTime() < nowMs;
  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-border/50 space-y-2 bg-card/60 sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("size-2 rounded-full", IMPORTANCE_DOT[event.importance])} />
          <Badge variant="outline" className={cn("text-[10px] h-5", EVENT_COLORS[event.eventType])}>
            {EVENT_LABELS[event.eventType]}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] h-5 capitalize",
              past
                ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                : "text-sky-400 border-sky-400/30 bg-sky-400/10",
            )}
          >
            {past ? "Released" : "Upcoming"}
          </Badge>
        </div>
        <div className="text-sm font-semibold leading-snug">{event.label}</div>
        <div className="text-[11px] text-muted-foreground">
          {fmtLongDate(event.date)} {event.time && `· ${event.time} UTC`} · {event.country}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {event.period && (
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70 mb-1">Period</div>
            <div className="text-xs font-mono">{event.period}</div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <MetricTile label="Forecast" value={event.forecast} unit={event.unit} tone="text-slate-300" />
          <MetricTile
            label="Actual"
            value={event.actual}
            unit={event.unit}
            tone={
              event.surprise !== null && event.surprise !== undefined
                ? event.surprise > 0.005
                  ? "text-emerald-400"
                  : event.surprise < -0.005
                    ? "text-rose-400"
                    : "text-slate-200"
                : "text-slate-200"
            }
            emphasis
          />
          <MetricTile label="Previous" value={event.previous} unit={event.unit} tone="text-muted-foreground" />
        </div>

        {event.surprise !== null && event.surprise !== undefined && (
          <div className="rounded-md border border-border/50 bg-muted/20 p-3 flex items-center justify-between gap-3">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Surprise</div>
            <SurpriseCell surprise={event.surprise} />
          </div>
        )}

        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70 mb-1">Description</div>
          <p className="text-xs leading-relaxed text-foreground/90">{event.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/30">
          <DetailField label="Importance" value={<span className="capitalize">{event.importance}</span>} />
          <DetailField label="Source" value={event.source ?? "—"} />
          <DetailField label="Country" value={event.country} />
          <DetailField label="Event ID" value={<span className="font-mono text-[10px] break-all">{event.id}</span>} />
        </div>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  unit,
  tone,
  emphasis,
}: {
  label: string;
  value: number | null | undefined;
  unit?: string;
  tone: string;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-md border border-border/50 bg-card/60 p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70 mb-1">{label}</div>
      <div className={cn("font-mono tabular-nums", emphasis ? "text-lg font-semibold" : "text-sm", tone)}>
        {value === null || value === undefined ? (
          <span className="text-muted-foreground/50">—</span>
        ) : (
          <>
            {value}
            {unit && <span className="text-muted-foreground/70 ml-0.5 text-xs font-normal">{unit}</span>}
          </>
        )}
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground/70 mb-0.5">{label}</div>
      <div className="text-xs">{value}</div>
    </div>
  );
}
