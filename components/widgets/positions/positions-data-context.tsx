"use client";

import type { FilterDefinition } from "@/components/shared/filter-bar";
import { usePositions } from "@/hooks/api/use-positions";
import { useWebSocket } from "@/hooks/use-websocket";
import type { MockOrder } from "@/lib/api/mock-trade-ledger";
import { getOrders } from "@/lib/api/mock-trade-ledger";
import type { StrategyArchetype, StrategyFamily } from "@/lib/architecture-v2";
import { makeFamilyFilterPredicate } from "@/lib/architecture-v2/family-filter";
import { useExecutionMode } from "@/lib/execution-mode-context";
import { getPositionsForScope } from "@/lib/mocks/fixtures/mock-data-index";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { getStrategyIdsForScope } from "@/lib/stores/scope-helpers";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import * as React from "react";

export type InstrumentType = "All" | "Spot" | "Perp" | "Futures" | "Options" | "DeFi" | "Prediction";

type AssetClassFilter = Exclude<InstrumentType, "All">;

const asset_group_OPTIONS: AssetClassFilter[] = ["Spot", "Perp", "Futures", "Options", "DeFi", "Prediction"];

function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function classifyInstrument(instrument: string): AssetClassFilter {
  const upper = instrument.toUpperCase();
  if (/\d+-[CP]$/.test(upper) || upper.includes("OPTIONS")) return "Options";
  if (upper.includes("PERPETUAL") || upper.includes("PERP")) return "Perp";
  if (/^[A-Z]+-\d{1,2}[A-Z]{3}\d{2,4}$/.test(upper)) return "Futures";
  if (
    upper.includes("AAVE") ||
    upper.includes("UNISWAP") ||
    upper.includes("LIDO") ||
    upper.includes("WALLET:") ||
    upper.includes("MORPHO")
  )
    return "DeFi";
  if (
    upper.includes("BETFAIR") ||
    upper.includes("POLYMARKET") ||
    upper.includes("KALSHI") ||
    upper.includes("NBA:") ||
    upper.includes("NFL:") ||
    upper.includes("EPL:") ||
    upper.includes("LALIGA:")
  )
    return "Prediction";
  return "Spot";
}

function getInstrumentRoute(instrument: string, type: AssetClassFilter): string {
  const asset = instrument.split("-")[0].split(":")[0].toUpperCase();
  switch (type) {
    case "Spot":
    case "Perp":
      return "/services/trading/terminal";
    case "Options":
      return `/services/trading/options?tab=chain&asset=${asset}`;
    case "Futures":
      return `/services/trading/options?tab=futures&asset=${asset}`;
    case "DeFi":
      return "/services/trading/defi";
    case "Prediction":
      return "/services/trading/sports";
  }
}

interface PositionRecord {
  id: string;
  strategy_id: string;
  strategy_name: string;
  instrument: string;
  side: "LONG" | "SHORT";
  quantity: number;
  entry_price: number;
  current_price: number;
  /** Total unrealized P&L since entry */
  net_pnl: number;
  net_pnl_pct: number;
  /** Today's slice of unrealized P&L (mock / derived) */
  today_pnl: number;
  today_pnl_pct: number;
  unrealized_pnl?: number;
  venue: string;
  margin: number;
  leverage: number;
  updated_at: string;
  /** USD notional from API (accounts for contract size on derivatives) */
  notional_usd?: number;
  /** DeFi: per-underlying net delta (ETH-equivalent) */
  net_delta?: number;
  /** DeFi: AAVE health factor (lending/recursive positions) */
  health_factor?: number;
  /** Shard dimension: client display name */
  client_name?: string;
  /** Shard dimension: domain category (CeFi, DeFi, TradFi, Sports, Prediction) */
  category?: string;
  /** Shard dimension: strategy family grouping */
  strategy_family?: string;
  /** Shard dimension: trading account identifier */
  account_id?: string;
  /** Shard dimension: blockchain chain (for DeFi positions) */
  chain?: string;
}

// ---------------------------------------------------------------------------
// DeFi mock positions — appended alongside CeFi/TradFi positions
// ---------------------------------------------------------------------------

// Elysium-branded DeFi demo rows retired 2026-04-21 (Wave 7 — venue dropped from UAC).
// Re-seed from canonical UAC STRATEGY_REGISTRY slot labels once a v2-aware DeFi mock fixture lands.
const DEFI_MOCK_POSITIONS: PositionRecord[] = [];

const STRATEGY_ID_NAMES: Record<string, string> = {
  AAVE_LENDING: "AAVE Lending",
  BASIS_TRADE: "Multi-Venue Basis Trade",
  STAKED_BASIS: "Staked Basis (weETH)",
  RECURSIVE_STAKED_BASIS: "Recursive Staked Basis",
  USDT_HEDGED_RECURSIVE: "USDT Hedged Recursive",
};

// ---------------------------------------------------------------------------
// Derive position deltas from filled DeFi orders in the mock ledger
// ---------------------------------------------------------------------------

function makePosition(
  id: string,
  order: MockOrder,
  instrumentId: string,
  side: "LONG" | "SHORT",
  qty: number,
  price: number,
  opts: { leverage?: number; health_factor?: number } = {},
): PositionRecord {
  const stratName = STRATEGY_ID_NAMES[order.strategy_id ?? ""] ?? order.strategy_id ?? "DeFi Order";
  return {
    id,
    strategy_id: order.strategy_id ?? "UNKNOWN",
    strategy_name: stratName,
    instrument: instrumentId,
    side,
    quantity: qty,
    entry_price: price,
    current_price: price,
    net_pnl: 0,
    net_pnl_pct: 0,
    today_pnl: 0,
    today_pnl_pct: 0,
    unrealized_pnl: 0,
    venue: order.venue,
    margin: 0,
    leverage: opts.leverage ?? 1,
    net_delta: side === "LONG" ? qty * price : -(qty * price),
    health_factor: opts.health_factor,
    updated_at: order.updated_at,
  };
}

function deriveDefiPositionDeltas(existingIds: Set<string>): PositionRecord[] {
  const filledDefi = getOrders().filter((o: MockOrder) => {
    if (o.asset_group !== "DeFi" || o.status !== "filled" || o.lane !== "defi") return false;
    const instr = o.instrument_id.toUpperCase();
    return !instr.startsWith("TRANSFER:") && !instr.startsWith("BRIDGE:") && !instr.startsWith("SWAP:");
  });

  // Flash loan orders get decomposed into collateral + debt pair
  const derived: PositionRecord[] = [];
  const nonFlash: MockOrder[] = [];
  for (const order of filledDefi) {
    const instrUpper = order.instrument_id.toUpperCase();
    if (instrUpper.startsWith("FLASH_LOAN:")) {
      const collatId = `defi-ledger-flash-collat-${order.id}`;
      const debtId = `defi-ledger-flash-debt-${order.id}`;
      if (!existingIds.has(collatId)) {
        const collateralVenue = order.venue || "AAVEV3-ETHEREUM";
        derived.push(
          makePosition(collatId, order, `${collateralVenue}:A_TOKEN:AWEETH@ETHEREUM`, "LONG", order.quantity, 3400, {
            leverage: 2.5,
            health_factor: 1.38,
          }),
        );
      }
      if (!existingIds.has(debtId)) {
        const debtVenue = order.venue || "AAVEV3-ETHEREUM";
        derived.push(
          makePosition(
            debtId,
            order,
            `${debtVenue}:DEBT_TOKEN:DEBTWETH@ETHEREUM`,
            "SHORT",
            order.quantity * 0.8,
            3400,
            {
              leverage: 2.5,
              health_factor: 1.38,
            },
          ),
        );
      }
    } else {
      nonFlash.push(order);
    }
  }

  // Group remaining by instrument_id to accumulate quantity deltas
  const deltaMap = new Map<string, { order: MockOrder; qtyDelta: number }>();
  for (const order of nonFlash) {
    const existing = deltaMap.get(order.instrument_id);
    const delta = order.side === "buy" ? order.quantity : -order.quantity;
    if (existing) {
      existing.qtyDelta += delta;
    } else {
      deltaMap.set(order.instrument_id, { order, qtyDelta: delta });
    }
  }

  for (const [instrumentId, { order, qtyDelta }] of deltaMap) {
    const matchId = `defi-ledger-${instrumentId}`;
    if (existingIds.has(matchId)) continue;
    if (Math.abs(qtyDelta) < 0.000001) continue;

    const price = order.average_fill_price ?? order.price;
    const instrUpper = instrumentId.toUpperCase();
    const isLending = instrUpper.includes("DEBT_TOKEN") || instrUpper.includes("A_TOKEN");
    const side: "LONG" | "SHORT" = qtyDelta > 0 ? "LONG" : "SHORT";
    derived.push(
      makePosition(matchId, order, instrumentId, side, Math.abs(qtyDelta), price, {
        leverage: isLending ? 2.5 : 1,
        health_factor: isLending ? 1.38 : undefined,
      }),
    );
  }
  return derived;
}

interface PositionsSummary {
  totalPositions: number;
  totalNotional: number;
  unrealizedPnL: number;
  totalMargin: number;
  longExposure: number;
  shortExposure: number;
}

interface PositionsDataContextValue {
  positions: PositionRecord[];
  isLoading: boolean;
  positionsError: Error | null;
  refetchPositions: () => void;

  filteredPositions: PositionRecord[];
  summary: PositionsSummary;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  venueFilter: string;
  setVenueFilter: (v: string) => void;
  sideFilter: "all" | "LONG" | "SHORT";
  setSideFilter: (s: "all" | "LONG" | "SHORT") => void;
  strategyFilter: string;
  setStrategyFilter: (s: string) => void;
  instrumentTypeFilters: AssetClassFilter[];
  setInstrumentTypeFilters: React.Dispatch<React.SetStateAction<AssetClassFilter[]>>;
  toggleInstrumentTypeFilter: (t: AssetClassFilter) => void;
  resetFilters: () => void;

  uniqueVenues: string[];
  uniqueStrategies: [string, string][];
  filterDefs: FilterDefinition[];
  filterValues: Record<string, unknown>;
  handleFilterChange: (key: string, value: unknown) => void;

  assetClassOptions: AssetClassFilter[];
  isLive: boolean;

  classifyInstrument: (instrument: string) => AssetClassFilter;
  getInstrumentRoute: (instrument: string, type: AssetClassFilter) => string;

  /** Re-read mock ledger to pick up newly filled DeFi orders as positions */
  refreshPositions: () => void;
}

const PositionsDataContext = React.createContext<PositionsDataContextValue | null>(null);

function mapRawRowToPosition(row: Record<string, unknown>): PositionRecord {
  const id = String(row.id ?? "");
  const entry = Number(row.entry_price ?? 0);
  const current = Number(row.current_price ?? 0);
  const netPnl = Number(row.net_pnl ?? row.pnl ?? row.unrealized_pnl ?? 0);
  const netPct =
    row.net_pnl_pct != null
      ? Number(row.net_pnl_pct)
      : row.pnl_pct != null
        ? Number(row.pnl_pct)
        : entry > 0
          ? ((current - entry) / entry) * 100
          : 0;
  const h = hashId(id);
  const dailyFrac = 0.1 + (h % 21) / 100;
  const todayPnl = row.today_pnl != null ? Number(row.today_pnl) : Math.round(netPnl * dailyFrac * 100) / 100;
  const qty = Number(row.quantity ?? 0);
  const todayPct =
    row.today_pnl_pct != null
      ? Number(row.today_pnl_pct)
      : entry > 0 && Math.abs(qty) > 0
        ? (todayPnl / (Math.abs(qty) * entry)) * 100
        : dailyFrac * netPct;

  return {
    id,
    strategy_id: String(row.strategy_id ?? ""),
    strategy_name: String(row.strategy_name ?? ""),
    instrument: String(row.instrument ?? ""),
    side: (String(row.side ?? "LONG").toUpperCase() === "SHORT" ? "SHORT" : "LONG") as "LONG" | "SHORT",
    quantity: qty,
    entry_price: entry,
    current_price: current,
    net_pnl: netPnl,
    net_pnl_pct: netPct,
    today_pnl: todayPnl,
    today_pnl_pct: todayPct,
    unrealized_pnl: row.unrealized_pnl != null ? Number(row.unrealized_pnl) : netPnl,
    venue: String(row.venue ?? ""),
    margin: Number(row.margin ?? 0),
    leverage: Number(row.leverage ?? 0),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
    notional_usd: row.notional_usd != null ? Number(row.notional_usd) : undefined,
    client_name: row.client_name != null ? String(row.client_name) : undefined,
    category: row.assetGroup != null ? String(row.assetGroup) : undefined,
    strategy_family: row.strategy_family != null ? String(row.strategy_family) : undefined,
    account_id: row.account_id != null ? String(row.account_id) : undefined,
    chain: row.chain != null ? String(row.chain) : undefined,
  };
}

export function PositionsDataProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const strategyIdFilter = searchParams.get("strategy_id");
  const { scope: globalScope } = useGlobalScope();
  const { isLive } = useExecutionMode();

  const {
    data: positionsRaw,
    isLoading: positionsLoading,
    error: positionsError,
    refetch: refetchPositions,
  } = usePositions();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [venueFilter, setVenueFilter] = React.useState("all");
  const [sideFilter, setSideFilter] = React.useState<"all" | "LONG" | "SHORT">("all");
  const [strategyFilter, setStrategyFilter] = React.useState(strategyIdFilter || "all");
  const [instrumentTypeFilters, setInstrumentTypeFilters] = React.useState<AssetClassFilter[]>([]);
  const [ledgerRefreshCounter, setLedgerRefreshCounter] = React.useState(0);

  /** Trigger a re-derivation of positions from the mock trade ledger */
  const refreshPositionsFromLedger = React.useCallback(() => {
    setLedgerRefreshCounter((c) => c + 1);
  }, []);

  const queryClient = useQueryClient();
  const handleWsMessage = React.useCallback(
    (msg: Record<string, unknown>) => {
      if (msg.channel === "positions" && msg.type === "pnl_update") {
        const updatedPositions = (msg.data as Record<string, unknown>)?.positions as
          | Record<string, unknown>[]
          | undefined;
        if (updatedPositions) {
          queryClient.setQueryData(["positions", undefined], (old: unknown) => {
            if (!old) return old;
            const oldData = old as Record<string, unknown>;
            const oldPositions = ((oldData as Record<string, unknown>).data ??
              (oldData as Record<string, unknown>).positions ??
              oldData) as Record<string, unknown>[];
            if (!Array.isArray(oldPositions)) return old;
            const updateMap = new Map(
              updatedPositions.map((p) => [
                String((p as Record<string, unknown>).instrument) + String((p as Record<string, unknown>).venue),
                p,
              ]),
            );
            const merged = oldPositions.map((p) => {
              const row = p as Record<string, unknown>;
              const update = updateMap.get(String(row.instrument) + String(row.venue));
              if (update) {
                const u = update as Record<string, unknown>;
                return {
                  ...row,
                  unrealized_pnl: u.unrealized_pnl,
                  current_price: u.current_price,
                  net_pnl: u.net_pnl ?? u.unrealized_pnl ?? row.net_pnl,
                };
              }
              return p;
            });
            return { ...oldData, data: merged };
          });
        }
      }
    },
    [queryClient],
  );

  useWebSocket({ url: "ws://localhost:8030/ws", enabled: isLive, onMessage: handleWsMessage });

  // Auto-refresh positions when a mock DeFi order fills
  React.useEffect(() => {
    const handler = () => refreshPositionsFromLedger();
    window.addEventListener("mock-order-filled", handler);
    return () => window.removeEventListener("mock-order-filled", handler);
  }, [refreshPositionsFromLedger]);

  React.useEffect(() => {
    if (strategyIdFilter) setStrategyFilter(strategyIdFilter);
  }, [strategyIdFilter]);

  const scopeStrategyIds = React.useMemo(
    () =>
      getStrategyIdsForScope({
        organizationIds: globalScope.organizationIds,
        clientIds: globalScope.clientIds,
        strategyIds: globalScope.strategyIds,
      }),
    [globalScope.organizationIds, globalScope.clientIds, globalScope.strategyIds],
  );

  const positions: PositionRecord[] = React.useMemo(() => {
    const raw = positionsRaw as Record<string, unknown> | undefined;
    const arr = raw
      ? Array.isArray(raw)
        ? raw
        : ((raw as Record<string, unknown>).data ?? (raw as Record<string, unknown>).positions)
      : undefined;
    let result: PositionRecord[] = [];

    if (Array.isArray(arr) && arr.length > 0) {
      result = (arr as Record<string, unknown>[]).map((row) => mapRawRowToPosition(row));
    } else {
      const seed = getPositionsForScope(globalScope.organizationIds, globalScope.clientIds, globalScope.strategyIds);
      result = seed.map((s) => {
        const netPnl = s.unrealisedPnl;
        const netPct = s.entryPrice > 0 ? ((s.currentPrice - s.entryPrice) / s.entryPrice) * 100 : 0;
        const h = hashId(s.id);
        const dailyFrac = 0.1 + (h % 21) / 100;
        const todayPnl = Math.round(netPnl * dailyFrac * 100) / 100;
        const todayPct =
          s.entryPrice > 0 && Math.abs(s.quantity) > 0
            ? (todayPnl / (Math.abs(s.quantity) * s.entryPrice)) * 100
            : dailyFrac * netPct;
        return {
          id: s.id,
          strategy_id: s.strategyId,
          strategy_name: s.strategyName,
          instrument: s.instrument,
          side: s.side.toUpperCase() as "LONG" | "SHORT",
          quantity: s.quantity,
          entry_price: s.entryPrice,
          current_price: s.currentPrice,
          net_pnl: netPnl,
          net_pnl_pct: netPct,
          today_pnl: todayPnl,
          today_pnl_pct: todayPct,
          unrealized_pnl: netPnl,
          venue: s.venue,
          margin: Math.abs(s.quantity * s.entryPrice * 0.1),
          leverage: 10,
          updated_at: new Date().toISOString(),
        };
      });
    }

    // Append DeFi mock positions alongside existing CeFi/TradFi positions
    const defiIds = new Set(DEFI_MOCK_POSITIONS.map((p) => p.id));
    if (!result.some((p) => defiIds.has(p.id))) {
      result = [...result, ...DEFI_MOCK_POSITIONS];
    }

    // Derive additional positions from filled DeFi orders in the mock ledger
    const existingIds = new Set(result.map((p) => p.id));
    const ledgerDerived = deriveDefiPositionDeltas(existingIds);
    if (ledgerDerived.length > 0) {
      result = [...result, ...ledgerDerived];
    }

    if (scopeStrategyIds.length > 0) {
      result = result.filter((p) => scopeStrategyIds.includes(p.strategy_id));
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    positionsRaw,
    scopeStrategyIds,
    globalScope.organizationIds,
    globalScope.clientIds,
    globalScope.strategyIds,
    ledgerRefreshCounter,
  ]);

  const filteredPositions = React.useMemo(() => {
    let result = positions;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.strategy_name.toLowerCase().includes(query) ||
          p.instrument.toLowerCase().includes(query) ||
          p.venue.toLowerCase().includes(query),
      );
    }
    if (strategyFilter !== "all") result = result.filter((p) => p.strategy_id === strategyFilter);
    if (venueFilter !== "all") result = result.filter((p) => p.venue === venueFilter);
    if (sideFilter !== "all") result = result.filter((p) => p.side === sideFilter);
    if (instrumentTypeFilters.length > 0) {
      result = result.filter((p) => instrumentTypeFilters.includes(classifyInstrument(p.instrument)));
    }
    // Phase 3 (plan p3-wire-picker-orders-positions): filter by the global
    // (family, archetype) selection written by TradingFamilyFilterBanner.
    const familyPredicate = makeFamilyFilterPredicate({
      family: globalScope.strategyFamily as StrategyFamily | undefined,
      archetype: globalScope.strategyArchetype as StrategyArchetype | undefined,
    });
    result = result.filter(familyPredicate);
    return result;
  }, [
    positions,
    searchQuery,
    strategyFilter,
    venueFilter,
    sideFilter,
    instrumentTypeFilters,
    globalScope.strategyFamily,
    globalScope.strategyArchetype,
  ]);

  const summary: PositionsSummary = React.useMemo(() => {
    // Use API-provided notional_usd (accounts for contract size on derivatives)
    // with fallback to quantity * price for mock/seed data
    const getNotional = (p: PositionRecord) =>
      p.notional_usd != null ? Math.abs(p.notional_usd) : Math.abs(p.quantity * p.current_price);

    return {
      totalPositions: filteredPositions.length,
      totalNotional: filteredPositions.reduce((sum, p) => sum + getNotional(p), 0),
      unrealizedPnL: filteredPositions.reduce((sum, p) => sum + p.net_pnl, 0),
      totalMargin: filteredPositions.reduce((sum, p) => sum + p.margin, 0),
      longExposure: filteredPositions.filter((p) => p.side === "LONG").reduce((sum, p) => sum + getNotional(p), 0),
      shortExposure: filteredPositions.filter((p) => p.side === "SHORT").reduce((sum, p) => sum + getNotional(p), 0),
    };
  }, [filteredPositions]);

  const uniqueVenues = React.useMemo(() => [...new Set(positions.map((p) => p.venue))].sort(), [positions]);

  const uniqueStrategies = React.useMemo(() => {
    const map = new Map<string, string>();
    positions.forEach((p) => map.set(p.strategy_id, p.strategy_name));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1])) as [string, string][];
  }, [positions]);

  const filterDefs: FilterDefinition[] = React.useMemo(
    () => [
      { key: "search", label: "Search", type: "search" as const, placeholder: "Search positions..." },
      {
        key: "strategy",
        label: "Strategy",
        type: "select" as const,
        options: uniqueStrategies.map(([id, name]) => ({ value: id, label: name })),
      },
      {
        key: "venue",
        label: "Venue",
        type: "select" as const,
        options: uniqueVenues.map((v) => ({ value: v, label: v })),
      },
      {
        key: "side",
        label: "Side",
        type: "select" as const,
        options: [
          { value: "LONG", label: "Long" },
          { value: "SHORT", label: "Short" },
        ],
      },
    ],
    [uniqueVenues, uniqueStrategies],
  );

  const filterValues = React.useMemo(
    () => ({
      search: searchQuery || undefined,
      strategy: strategyFilter !== "all" ? strategyFilter : undefined,
      venue: venueFilter !== "all" ? venueFilter : undefined,
      side: sideFilter !== "all" ? sideFilter : undefined,
    }),
    [searchQuery, strategyFilter, venueFilter, sideFilter],
  );

  const handleFilterChange = React.useCallback((key: string, value: unknown) => {
    switch (key) {
      case "search":
        setSearchQuery((value as string) || "");
        break;
      case "strategy":
        setStrategyFilter((value as string) || "all");
        break;
      case "venue":
        setVenueFilter((value as string) || "all");
        break;
      case "side":
        setSideFilter(((value as string) || "all") as "all" | "LONG" | "SHORT");
        break;
    }
  }, []);

  const toggleInstrumentTypeFilter = React.useCallback((t: AssetClassFilter) => {
    setInstrumentTypeFilters((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }, []);

  const resetFilters = React.useCallback(() => {
    setSearchQuery("");
    setStrategyFilter("all");
    setVenueFilter("all");
    setSideFilter("all");
    setInstrumentTypeFilters([]);
  }, []);

  const value: PositionsDataContextValue = React.useMemo(
    () => ({
      positions,
      isLoading: positionsLoading,
      positionsError: positionsError as Error | null,
      refetchPositions,
      filteredPositions,
      summary,
      searchQuery,
      setSearchQuery,
      venueFilter,
      setVenueFilter,
      sideFilter,
      setSideFilter,
      strategyFilter,
      setStrategyFilter,
      instrumentTypeFilters,
      setInstrumentTypeFilters,
      toggleInstrumentTypeFilter,
      resetFilters,
      uniqueVenues,
      uniqueStrategies,
      filterDefs,
      filterValues,
      handleFilterChange,
      assetClassOptions: asset_group_OPTIONS,
      isLive,
      classifyInstrument,
      getInstrumentRoute,
      refreshPositions: refreshPositionsFromLedger,
    }),
    [
      positions,
      positionsLoading,
      positionsError,
      refetchPositions,
      filteredPositions,
      summary,
      searchQuery,
      venueFilter,
      sideFilter,
      strategyFilter,
      instrumentTypeFilters,
      toggleInstrumentTypeFilter,
      resetFilters,
      uniqueVenues,
      uniqueStrategies,
      filterDefs,
      filterValues,
      handleFilterChange,
      isLive,
      refreshPositionsFromLedger,
    ],
  );

  return <PositionsDataContext.Provider value={value}>{children}</PositionsDataContext.Provider>;
}

export function usePositionsData(): PositionsDataContextValue {
  const ctx = React.useContext(PositionsDataContext);
  if (!ctx) throw new Error("usePositionsData must be used within PositionsDataProvider");
  return ctx;
}

export type { AssetClassFilter, PositionRecord, PositionsSummary };
