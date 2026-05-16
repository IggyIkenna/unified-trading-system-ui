"use client";

import { DataTable } from "@/components/shared/data-table";
import { SparklineCell } from "@/components/trading/kpi-card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { Search } from "lucide-react";
import * as React from "react";

export interface RankingListItem {
  id: string;
  /** Primary display label (e.g. token symbol "BTC", protocol "Aave"). */
  name: string;
  /** Optional secondary label rendered under the name (e.g. full name "Bitcoin"). */
  subname?: string;
  /** Primary numeric value (market cap, TVL, OI, volume — depends on the ranking). */
  value: number;
  /** Optional 24h percentage change (rendered as colour-coded %change column). */
  change24h?: number;
  /** Optional 7d percentage change. */
  change7d?: number;
  /** Optional sparkline data series. */
  sparkline?: number[];
  /** Optional venue / chain / source tag. */
  source?: string;
  /** Free-form extra columns; consumers can use `extraColumns` prop to render. */
  extra?: Record<string, string | number | null>;
}

export interface RankingListExtraColumn {
  id: string;
  label: string;
  align?: "left" | "right";
  format?: (item: RankingListItem) => React.ReactNode;
  type?: "text" | "number" | "currency" | "percent";
}

export interface RankingListPresetProps {
  items: ReadonlyArray<RankingListItem>;
  /** Heading shown above the search input. Default: hidden if not provided. */
  title?: string;
  /** Format the primary value column. Default: humanised with k/M/B suffixes. */
  formatValue?: (v: number) => string;
  /** Label for the value column header. Default: "Value". */
  valueLabel?: string;
  /** Show a search input above the table. Default: true. */
  enableSearch?: boolean;
  /** Show 24h %change column. Default: true if any item has change24h. */
  show24h?: boolean;
  /** Show 7d %change column. Default: true if any item has change7d. */
  show7d?: boolean;
  /** Show sparkline column. Default: true if any item has sparkline. */
  showSparkline?: boolean;
  /** Show source/venue column. Default: true if any item has a source. */
  showSource?: boolean;
  /** Extra column defs appended after the standard ones. */
  extraColumns?: ReadonlyArray<RankingListExtraColumn>;
  /** Limit visible rows after search. Default: no limit. */
  limit?: number;
  /** When true, table fills its parent and is internally scrollable. Default: true. */
  fillHeight?: boolean;
  /** When true, virtualises rows. Default: true (good for >100 rows). */
  enableVirtualization?: boolean;
  className?: string;
  emptyMessage?: string;
  onRowClick?: (item: RankingListItem) => void;
}

function defaultFormatValue(v: number): string {
  if (Math.abs(v) >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(2)}k`;
  return `$${v.toFixed(2)}`;
}

function PercentCell({ value }: { value: number | undefined }) {
  if (value == null) return <span className="text-muted-foreground/40">—</span>;
  const isPositive = value >= 0;
  return (
    <span
      className={cn(
        "tabular-nums font-mono text-[11px]",
        isPositive ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]",
      )}
    >
      {isPositive ? "+" : ""}
      {(value * 100).toFixed(2)}%
    </span>
  );
}

/**
 * DataTable preset for ranked lists with sparkline + %change columns.
 *
 * Wraps the existing virtualised `data-table.tsx` — does NOT introduce a
 * parallel virtualised list. Per the DART cross-asset-group market-data
 * terminal plan P0.3, this is the single primitive for every ranking
 * surface borrowed from CoinMarketCap / DefiLlama / Coinglass / Polymarket /
 * sports-screener-style top-movers.
 *
 * Cross-asset-group use cases:
 *  - market-cap ranking (CoinMarketCap)
 *  - TVL by chain / protocol (DefiLlama)
 *  - DEX volume ranking (DefiLlama / DEXScreener)
 *  - open-interest ranking, gainers/losers (Coinglass)
 *  - trending markets, closing-soon (Polymarket)
 *  - sports top-movers (line movement ranking)
 *  - yield-farm ranking
 */
export function RankingListPreset({
  items,
  title,
  formatValue = defaultFormatValue,
  valueLabel = "Value",
  enableSearch = true,
  show24h,
  show7d,
  showSparkline,
  showSource,
  extraColumns = [],
  limit,
  fillHeight = true,
  enableVirtualization = true,
  className,
  emptyMessage = "No items.",
  onRowClick,
}: RankingListPresetProps) {
  const [query, setQuery] = React.useState("");

  const has24h = show24h ?? items.some((i) => i.change24h !== undefined);
  const has7d = show7d ?? items.some((i) => i.change7d !== undefined);
  const hasSparkline = showSparkline ?? items.some((i) => i.sparkline && i.sparkline.length > 0);
  const hasSource = showSource ?? items.some((i) => i.source !== undefined);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = items;
    if (q.length > 0) {
      result = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.subname?.toLowerCase().includes(q) ?? false) ||
          (i.source?.toLowerCase().includes(q) ?? false),
      );
    }
    if (limit && limit > 0 && result.length > limit) {
      result = result.slice(0, limit);
    }
    return result;
  }, [items, query, limit]);

  const columns = React.useMemo<ColumnDef<RankingListItem, unknown>[]>(() => {
    const cols: ColumnDef<RankingListItem, unknown>[] = [
      {
        id: "rank",
        header: "#",
        accessorFn: (_row, idx) => idx + 1,
        enableSorting: false,
        meta: { type: "number" },
        cell: ({ row }) => (
          <span className="text-muted-foreground/60 tabular-nums font-mono text-[10px]">{row.index + 1}</span>
        ),
      },
      {
        id: "name",
        header: "Name",
        accessorKey: "name",
        meta: { type: "text" },
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="font-medium truncate">{row.original.name}</div>
            {row.original.subname && (
              <div className="text-[10px] text-muted-foreground/70 truncate">{row.original.subname}</div>
            )}
          </div>
        ),
      },
    ];

    if (hasSource) {
      cols.push({
        id: "source",
        header: "Venue",
        accessorKey: "source",
        meta: { type: "badge" },
        cell: ({ row }) => (
          <span className="text-[10px] text-muted-foreground font-mono">{row.original.source ?? "—"}</span>
        ),
      });
    }

    cols.push({
      id: "value",
      header: valueLabel,
      accessorKey: "value",
      meta: { type: "currency" },
      cell: ({ row }) => <span>{formatValue(row.original.value)}</span>,
    });

    if (has24h) {
      cols.push({
        id: "change24h",
        header: "24h",
        accessorKey: "change24h",
        meta: { type: "percent" },
        cell: ({ row }) => <PercentCell value={row.original.change24h} />,
      });
    }

    if (has7d) {
      cols.push({
        id: "change7d",
        header: "7d",
        accessorKey: "change7d",
        meta: { type: "percent" },
        cell: ({ row }) => <PercentCell value={row.original.change7d} />,
      });
    }

    if (hasSparkline) {
      cols.push({
        id: "sparkline",
        header: "Trend",
        enableSorting: false,
        meta: { type: "actions" },
        cell: ({ row }) =>
          row.original.sparkline && row.original.sparkline.length > 0 ? (
            <SparklineCell data={row.original.sparkline} />
          ) : (
            <span className="text-muted-foreground/40">—</span>
          ),
      });
    }

    for (const col of extraColumns) {
      cols.push({
        id: col.id,
        header: col.label,
        meta: { type: col.type ?? "text" },
        cell: ({ row }) => col.format?.(row.original) ?? row.original.extra?.[col.id] ?? "—",
      });
    }

    return cols;
  }, [valueLabel, formatValue, hasSource, has24h, has7d, hasSparkline, extraColumns]);

  return (
    <div className={cn("flex flex-col gap-2 h-full", className)}>
      {(title || enableSearch) && (
        <div className="flex items-center gap-2 px-1">
          {title && <h3 className="text-xs font-semibold text-muted-foreground/90">{title}</h3>}
          {enableSearch && (
            <div className="ml-auto relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/50" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="h-7 pl-7 text-xs w-44"
              />
            </div>
          )}
        </div>
      )}
      <div
        className={cn("min-h-0", fillHeight ? "flex-1" : undefined)}
        onClick={
          onRowClick
            ? (e) => {
                // Find the row from the click target if the user wired onRowClick.
                const tr = (e.target as HTMLElement).closest("tr");
                if (!tr) return;
                const idx = tr.getAttribute("data-row-index");
                if (idx == null) return;
                const item = filtered[Number(idx)];
                if (item) onRowClick(item);
              }
            : undefined
        }
      >
        <DataTable
          columns={columns}
          data={filtered as RankingListItem[]}
          enableSorting
          enableVirtualization={enableVirtualization}
          fillHeight={fillHeight}
          emptyMessage={emptyMessage}
          hideColumnToggle
        />
      </div>
    </div>
  );
}
