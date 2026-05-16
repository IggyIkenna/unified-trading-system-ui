"use client";

import { TableWidget } from "@/components/shared/table-widget";
import type { TableActionsConfig, TableFilterConfig } from "@/components/shared/table-widget";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { formatCurrency } from "@/lib/reference-data";
import { cn } from "@/lib/utils";
import type { ExportColumn } from "@/lib/utils/export";
import { formatPercent } from "@/lib/utils/formatters";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownRight, ArrowUpRight, Info, Receipt } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTierZeroScenario } from "@/lib/cockpit/use-tier-zero-scenario";
import type { ScenarioPosition, ScenarioStrategyInstance } from "@/lib/mocks/tier-zero-scenario";
import type { AssetClassFilter } from "./positions-data-context";
import { usePositionsData, type PositionRecord } from "./positions-data-context";

// 2026-05-01 cockpit migration: scope-resolved tier-zero positions get
// adapted into the legacy `PositionRecord` shape so the existing column
// renderers + filter machinery work unchanged. Synthetic fields (today_pnl,
// entry/current price, leverage, margin) use deterministic heuristics so
// the demo prospect sees plausible numbers; replacing them with real
// scenario telemetry is a follow-up.
function adaptScenarioPosition(p: ScenarioPosition, strategy: ScenarioStrategyInstance | undefined): PositionRecord {
  const side: PositionRecord["side"] = p.side === "long" ? "LONG" : "SHORT";
  const netPnl = p.unrealisedPnlUsd;
  const netPnlPct = p.notional > 0 ? (netPnl / p.notional) * 100 : 0;
  // Today's slice is a deterministic ~25% of net P&L so the column renders
  // sensibly without requiring per-day fixtures.
  const todayPnl = netPnl * 0.25;
  const todayPnlPct = netPnlPct * 0.25;
  // Synthetic price + quantity: chosen so price * qty ≈ notional.
  const syntheticPrice = 1000;
  const quantity = p.notional / syntheticPrice;
  const entryPrice = syntheticPrice * (1 - netPnlPct / 100);
  // Default 1× margin / leverage; perp/future positions could be flagged
  // separately by ScenarioPosition once the schema gains an instrumentType.
  const leverage = 1;
  const margin = p.notional / leverage;
  return {
    id: p.id,
    strategy_id: p.strategyId,
    strategy_name: strategy?.label ?? p.strategyId,
    instrument: `${p.venue}:SPOT:${p.symbol}@${p.symbol}-USD`,
    side,
    quantity,
    entry_price: entryPrice,
    current_price: syntheticPrice,
    net_pnl: netPnl,
    net_pnl_pct: netPnlPct,
    today_pnl: todayPnl,
    today_pnl_pct: todayPnlPct,
    unrealized_pnl: netPnl,
    venue: p.venue,
    margin,
    leverage,
    updated_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    notional_usd: p.notional,
    category: p.assetGroup,
    strategy_family: strategy?.family,
  };
}

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: "instrument", header: "Instrument" },
  { key: "side", header: "Side" },
  { key: "quantity", header: "Quantity", format: "number" },
  { key: "entry_price", header: "Entry Price", format: "currency" },
  { key: "current_price", header: "Current Price", format: "currency" },
  { key: "today_pnl", header: "Today's P&L", format: "currency" },
  { key: "net_pnl", header: "Net P&L", format: "currency" },
  { key: "net_delta", header: "Net Delta", format: "number" },
  { key: "health_factor", header: "Health Factor", format: "number" },
  { key: "client_name", header: "Client" },
  { key: "category", header: "Category" },
  { key: "strategy_family", header: "Family" },
  { key: "chain", header: "Chain" },
  { key: "venue", header: "Venue" },
  { key: "updated_at", header: "Updated" },
];

function formatInstrumentId(id: string): string {
  const parts = id.split(":");
  if (parts.length < 3) return id;
  const [venue, type, symbolPart] = parts;
  const symbol = symbolPart.split("@")[0];

  const venueLabel: Record<string, string> = {
    "AAVEV3-ETHEREUM": "Aave V3",
    "AAVEV3-ARBITRUM": "Aave V3 Arb",
    "AAVEV3-OPTIMISM": "Aave V3 Op",
    ETHERFI: "EtherFi",
    LIDO: "Lido",
    WALLET: "",
    HYPERLIQUID: "Hyperliquid",
    BINANCE: "Binance",
    COINBASE: "Coinbase",
    DERIBIT: "Deribit",
  };

  const typeLabel: Record<string, string> = {
    PERPETUAL: "PERP",
    FUTURE: "FUT",
    OPTION: "OPT",
    SPOT: "",
    SPOT_ASSET: "",
    A_TOKEN: "",
    DEBT_TOKEN: "",
    LST: "",
  };

  const vLabel = Object.prototype.hasOwnProperty.call(venueLabel, venue) ? venueLabel[venue] : venue;
  const tLabel = Object.prototype.hasOwnProperty.call(typeLabel, type) ? typeLabel[type] : type;

  const suffix = tLabel ? ` ${tLabel}` : "";
  const venueStr = vLabel ? ` (${vLabel})` : "";
  return `${symbol}${suffix}${venueStr}`;
}

function deriveCanonicalId(row: PositionRecord): string {
  const venue = row.venue?.toUpperCase().replace(/\s+/g, "_") ?? "UNKNOWN";
  const instrument = row.instrument?.toUpperCase() ?? "";

  let type = "SPOT";
  if (
    row.strategy_id?.includes("BASIS") ||
    row.strategy_id?.includes("PERP") ||
    instrument.endsWith("-PERP") ||
    instrument.endsWith("-USD")
  ) {
    type = "PERPETUAL";
  } else if (
    row.strategy_id?.includes("AAVE") ||
    instrument.startsWith("A_") ||
    instrument.startsWith("AUSDC") ||
    instrument.startsWith("AWETH")
  ) {
    type = "A_TOKEN";
  } else if (
    row.strategy_id?.includes("STAKED") ||
    row.strategy_id?.includes("RECURSIVE") ||
    instrument.startsWith("WEETH") ||
    instrument.startsWith("STETH") ||
    instrument.startsWith("WSTETH")
  ) {
    type = "LST";
  }

  return `${venue}:${type}:${instrument}`;
}

function PnlCell({ abs, pct }: { abs: number; pct: number }) {
  return (
    <div className="flex flex-col items-end">
      <span className={cn("font-mono font-medium", abs >= 0 ? "pnl-positive" : "pnl-negative")}>
        {abs >= 0 ? "+" : ""}${formatCurrency(Math.abs(abs))}
      </span>
      <span className={cn("text-caption font-mono", pct >= 0 ? "pnl-positive" : "pnl-negative")}>
        {pct >= 0 ? "+" : ""}
        {formatPercent(pct, 2)}
      </span>
    </div>
  );
}

function buildColumns(
  getInstrumentRoute: (instrument: string, type: AssetClassFilter) => string,
  classifyInstrument: (instrument: string) => AssetClassFilter,
  onViewTrades: (positionId: string) => void,
): ColumnDef<PositionRecord, unknown>[] {
  return [
    {
      accessorKey: "instrument",
      header: "Instrument",
      meta: { type: "text" },
      enableSorting: true,
      cell: ({ row }) => {
        const r = row.original;
        const canonicalId = deriveCanonicalId(r);
        return (
          <div className="flex flex-col min-w-[160px]">
            <div className="flex items-center gap-1">
              <Link
                href={getInstrumentRoute(r.instrument, classifyInstrument(r.instrument))}
                className="font-mono font-medium text-primary hover:underline cursor-pointer"
              >
                {formatInstrumentId(r.instrument)}
              </Link>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-2.5 text-muted-foreground cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[280px]">
                    <div className="space-y-0.5">
                      <p className="text-caption font-medium text-muted-foreground">Canonical ID</p>
                      <p className="font-mono text-xs select-all">{canonicalId}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-caption text-muted-foreground">{r.strategy_name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "side",
      header: "Side",
      meta: { type: "badge" },
      enableSorting: true,
      cell: ({ row }) => {
        const side = row.getValue<"LONG" | "SHORT">("side");
        return (
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-micro",
                side === "LONG"
                  ? "border-[var(--pnl-positive)] text-[var(--pnl-positive)]"
                  : "border-[var(--pnl-negative)] text-[var(--pnl-negative)]",
              )}
            >
              {side === "LONG" ? (
                <ArrowUpRight className="size-2.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="size-2.5 mr-0.5" />
              )}
              {side}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      meta: { type: "number" },
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right font-mono text-caption">{row.getValue<number>("quantity").toLocaleString()}</div>
      ),
    },
    {
      accessorKey: "entry_price",
      header: "Entry Price",
      meta: { type: "currency" },
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right font-mono text-caption">
          $
          {row
            .getValue<number>("entry_price")
            .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      accessorKey: "current_price",
      header: "Current Price",
      meta: { type: "currency" },
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right font-mono text-caption">
          $
          {row
            .getValue<number>("current_price")
            .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      accessorKey: "today_pnl",
      header: "Today's P&L",
      meta: { type: "currency" },
      enableSorting: true,
      cell: ({ row }) => <PnlCell abs={row.original.today_pnl} pct={row.original.today_pnl_pct} />,
    },
    {
      accessorKey: "net_pnl",
      header: "Net P&L",
      meta: { type: "currency" },
      enableSorting: true,
      cell: ({ row }) => <PnlCell abs={row.original.net_pnl} pct={row.original.net_pnl_pct} />,
    },
    {
      accessorKey: "net_delta",
      header: "Net Delta",
      meta: { type: "number" },
      enableSorting: true,
      cell: ({ row }) => {
        const delta = row.getValue<number | undefined>("net_delta");
        return delta != null ? (
          <span
            className={cn(
              "font-mono text-caption block text-right",
              delta > 0 ? "pnl-positive" : delta < 0 ? "pnl-negative" : "text-muted-foreground",
            )}
          >
            {delta > 0 ? "+" : ""}
            {delta.toFixed(2)}
          </span>
        ) : (
          <span className="text-muted-foreground text-micro block text-right">--</span>
        );
      },
    },
    {
      accessorKey: "health_factor",
      header: "HF",
      meta: { type: "number" },
      enableSorting: true,
      cell: ({ row }) => {
        const hf = row.getValue<number | undefined>("health_factor");
        return hf != null ? (
          <div className="flex justify-end">
            <Badge
              variant="outline"
              className={cn(
                "font-mono text-micro px-1.5 py-0",
                hf >= 1.5
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : hf >= 1.25
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                    : "bg-rose-500/20 text-rose-400 border-rose-500/30",
              )}
            >
              {hf.toFixed(2)}
            </Badge>
          </div>
        ) : (
          <span className="text-muted-foreground text-micro block text-right">--</span>
        );
      },
    },
    {
      accessorKey: "client_name",
      header: "Client",
      meta: { type: "text" },
      enableSorting: true,
      cell: ({ row }) => {
        const val = row.getValue<string | undefined>("client_name");
        return val ? (
          <span className="text-caption">{val}</span>
        ) : (
          <span className="text-muted-foreground text-micro">--</span>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      meta: { type: "text" },
      enableSorting: true,
      cell: ({ row }) => {
        const val = row.getValue<string | undefined>("category");
        return val ? (
          <span className="text-caption">{val}</span>
        ) : (
          <span className="text-muted-foreground text-micro">--</span>
        );
      },
    },
    {
      accessorKey: "strategy_family",
      header: "Family",
      meta: { type: "text" },
      enableSorting: true,
      cell: ({ row }) => {
        const val = row.getValue<string | undefined>("strategy_family");
        return val ? (
          <span className="text-caption">{val}</span>
        ) : (
          <span className="text-muted-foreground text-micro">--</span>
        );
      },
    },
    {
      accessorKey: "chain",
      header: "Chain",
      meta: { type: "text" },
      enableSorting: true,
      cell: ({ row }) => {
        const val = row.getValue<string | undefined>("chain");
        return val ? <span className="text-caption">{val}</span> : null;
      },
    },
    {
      accessorKey: "venue",
      header: "Venue",
      meta: { type: "text" },
      enableSorting: true,
      cell: ({ row }) => <span className="text-caption">{row.getValue<string>("venue")}</span>,
    },
    {
      accessorKey: "updated_at",
      header: "Updated",
      meta: { type: "datetime" },
      enableSorting: true,
      cell: ({ row }) => (
        <div className="text-right text-caption text-muted-foreground font-mono">
          {row.getValue<string>("updated_at")}
        </div>
      ),
    },
    {
      id: "trades",
      header: "Trades",
      meta: { type: "actions" },
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onViewTrades(row.original.id)}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            <Receipt className="size-3 shrink-0" />
            View trades
          </button>
        </div>
      ),
    },
  ];
}

export function PositionsTableWidget(_props: WidgetComponentProps) {
  const router = useRouter();

  const onViewTrades = React.useCallback(
    (positionId: string) => {
      router.push(`/services/trading/positions?position_id=${encodeURIComponent(positionId)}`);
    },
    [router],
  );

  const {
    filteredPositions,
    isLoading: positionsLoading,
    positionsError,
    refetchPositions,
    isLive,
    classifyInstrument,
    getInstrumentRoute,
    searchQuery,
    setSearchQuery,
    venueFilter,
    setVenueFilter,
    sideFilter,
    setSideFilter,
    strategyFilter,
    setStrategyFilter,
    instrumentTypeFilters,
    toggleInstrumentTypeFilter,
    assetClassOptions,
    uniqueVenues,
    uniqueStrategies,
    resetFilters,
  } = usePositionsData();

  const tierZero = useTierZeroScenario();
  const useTierZero = tierZero.status === "match" && tierZero.positions.length > 0;
  const tzRows: PositionRecord[] = React.useMemo(() => {
    if (!useTierZero) return [];
    const strategiesById = new Map(tierZero.strategies.map((s) => [s.id, s] as const));
    return tierZero.positions.map((p) => adaptScenarioPosition(p, strategiesById.get(p.strategyId)));
  }, [useTierZero, tierZero.positions, tierZero.strategies]);

  // When tier-zero is active, apply the same in-widget filter chips to the
  // synthesised rows so search / strategy / venue / side / asset-class chips
  // continue to do something. (matchesScope already pre-filtered by
  // top-level scope.)
  const tzFilteredRows: PositionRecord[] = React.useMemo(() => {
    if (!useTierZero) return [];
    const q = searchQuery.trim().toLowerCase();
    return tzRows.filter((r) => {
      if (q && !`${r.instrument} ${r.strategy_name}`.toLowerCase().includes(q)) return false;
      if (venueFilter !== "all" && r.venue !== venueFilter) return false;
      if (sideFilter !== "all" && r.side !== sideFilter) return false;
      if (strategyFilter !== "all" && r.strategy_id !== strategyFilter) return false;
      return true;
    });
  }, [useTierZero, tzRows, searchQuery, venueFilter, sideFilter, strategyFilter]);

  const dataRows = useTierZero ? tzFilteredRows : filteredPositions;

  const activeFilterCount =
    [
      searchQuery,
      venueFilter !== "all" ? venueFilter : "",
      sideFilter !== "all" ? sideFilter : "",
      strategyFilter !== "all" ? strategyFilter : "",
    ].filter(Boolean).length + instrumentTypeFilters.length;

  const columns = React.useMemo(
    () => buildColumns(getInstrumentRoute, classifyInstrument, onViewTrades),
    [getInstrumentRoute, classifyInstrument, onViewTrades],
  );

  const tzVenueOptions = React.useMemo(
    () => (useTierZero ? Array.from(new Set(tzRows.map((r) => r.venue))) : []),
    [useTierZero, tzRows],
  );
  const tzStrategyOptions = React.useMemo<Array<readonly [string, string]>>(
    () =>
      useTierZero ? Array.from(new Map(tzRows.map((r) => [r.strategy_id, r.strategy_name] as const)).entries()) : [],
    [useTierZero, tzRows],
  );
  const venueOptionsForFilter = useTierZero ? tzVenueOptions : uniqueVenues.filter(Boolean);
  const strategyOptionsForFilter: Array<readonly [string, string]> = useTierZero
    ? tzStrategyOptions
    : uniqueStrategies.filter(([id]) => id);

  const filterConfig: TableFilterConfig = {
    search: {
      query: searchQuery,
      onChange: setSearchQuery,
      placeholder: "Search positions…",
    },
    selectFilters: [
      {
        value: strategyFilter,
        onChange: setStrategyFilter,
        placeholder: "Strategy",
        allLabel: "All Strategies",
        width: "w-32",
        options: strategyOptionsForFilter.map(([id, name]) => ({ value: id, label: name })),
      },
      {
        value: venueFilter,
        onChange: setVenueFilter,
        placeholder: "Venue",
        allLabel: "All Venues",
        width: "w-32",
        options: venueOptionsForFilter.map((v) => ({ value: v, label: v })),
      },
      {
        value: sideFilter,
        onChange: (v) => setSideFilter(v as "all" | "LONG" | "SHORT"),
        placeholder: "Side",
        allLabel: "Both Sides",
        width: "w-24",
        options: [
          { value: "LONG", label: "Long" },
          { value: "SHORT", label: "Short" },
        ],
      },
    ],
    assetClass: {
      options: assetClassOptions as string[],
      active: instrumentTypeFilters as string[],
      onToggle: (cls) => toggleInstrumentTypeFilter(cls as AssetClassFilter),
    },
    activeFilterCount,
    onReset: resetFilters,
  };

  const actionsConfig: TableActionsConfig = {
    onRefresh: refetchPositions,
    dataFreshness: {
      lastUpdated: new Date(),
      isWebSocket: isLive,
      isBatch: !isLive,
    },
    export: {
      data: dataRows as unknown as Record<string, unknown>[],
      columns: EXPORT_COLUMNS,
      filename: "positions",
    },
  };

  return (
    <div data-testid="positions-table-widget" data-source={useTierZero ? "tier-zero" : "legacy"}>
      <TableWidget
        columns={columns}
        data={dataRows}
        filterConfig={filterConfig}
        actions={actionsConfig}
        isLoading={positionsLoading && !useTierZero}
        error={positionsError && !useTierZero ? "Failed to load positions" : null}
        onRetry={refetchPositions}
        emptyMessage={
          useTierZero ? "No positions match the current scope or chip filters" : "No positions match your filters"
        }
        enableSorting
        enableColumnVisibility
      />
    </div>
  );
}
