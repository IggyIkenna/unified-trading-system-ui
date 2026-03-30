"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/shared/spinner";
import { useAmendOrder, useCancelOrder, useOrders } from "@/hooks/api/use-orders";
import { useExecutionMode } from "@/lib/execution-mode-context";
import { getOrdersForScope } from "@/lib/mocks/fixtures/mock-data-index";
import { SEED_STRATEGIES } from "@/lib/mocks/fixtures/mock-data-seed";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { getStrategyIdsForScope } from "@/lib/stores/scope-helpers";
import { mock01 } from "@/lib/mocks/generators/deterministic";
import type { FilterDefinition } from "@/components/shared/filter-bar";
import * as React from "react";

export type InstrumentType = "All" | "Spot" | "Perp" | "Futures" | "Options" | "DeFi" | "Prediction";

export type AssetClassFilter = Exclude<InstrumentType, "All">;

const ASSET_CLASS_OPTIONS: AssetClassFilter[] = ["Spot", "Perp", "Futures", "Options", "DeFi", "Prediction"];

export interface OrderRecord {
  order_id: string;
  instrument: string;
  side: "BUY" | "SELL";
  type: string;
  price: number;
  mark_price: number;
  quantity: number;
  filled: number;
  status: string;
  venue: string;
  strategy_id: string;
  strategy_name: string;
  edge_bps: number;
  instant_pnl: number;
  created_at: string;
}

interface OrdersDataContextShape {
  orders: OrderRecord[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;

  cancelOrder: (orderId: string) => void;
  isCancelling: boolean;
  openAmendDialog: (order: OrderRecord) => void;
  submitAmend: (orderId: string, qty: number, price: number) => void;
  isAmending: boolean;

  filteredOrders: OrderRecord[];
  summary: {
    total: number;
    open: number;
    filled: number;
    partial: number;
    rejected: number;
    failed: number;
  };

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  venueFilter: string;
  setVenueFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  strategyFilter: string;
  setStrategyFilter: (s: string) => void;
  sideFilter: "all" | "BUY" | "SELL";
  setSideFilter: (s: "all" | "BUY" | "SELL") => void;
  instrumentTypeFilters: AssetClassFilter[];
  setInstrumentTypeFilters: React.Dispatch<React.SetStateAction<AssetClassFilter[]>>;
  toggleInstrumentTypeFilter: (t: AssetClassFilter) => void;
  resetFilters: () => void;

  uniqueVenues: string[];
  uniqueStatuses: string[];
  uniqueStrategies: [string, string][];

  filterDefs: FilterDefinition[];
  filterValues: Record<string, unknown>;
  handleFilterChange: (key: string, value: unknown) => void;

  assetClassOptions: AssetClassFilter[];
  classifyInstrument: (instrument: string) => AssetClassFilter;

  amendTarget: OrderRecord | null;
  setAmendTarget: (order: OrderRecord | null) => void;
}

const OrdersCtx = React.createContext<OrdersDataContextShape | null>(null);

export function useOrdersData(): OrdersDataContextShape {
  const ctx = React.useContext(OrdersCtx);
  if (!ctx) throw new Error("useOrdersData must be used within OrdersDataProvider");
  return ctx;
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

export { classifyInstrument, ASSET_CLASS_OPTIONS };

export function OrdersDataProvider({ children }: { children: React.ReactNode }) {
  const { data: ordersRaw, isLoading, error, refetch } = useOrders();
  const { scope: globalScope } = useGlobalScope();
  const { isPaper, isBatch } = useExecutionMode();
  const cancelMutation = useCancelOrder();
  const amendMutation = useAmendOrder();

  const [amendTarget, setAmendTarget] = React.useState<OrderRecord | null>(null);
  const [amendQty, setAmendQty] = React.useState("");
  const [amendPrice, setAmendPrice] = React.useState("");

  const [searchQuery, setSearchQuery] = React.useState("");
  const [venueFilter, setVenueFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [strategyFilter, setStrategyFilter] = React.useState("all");
  const [sideFilter, setSideFilter] = React.useState<"all" | "BUY" | "SELL">("all");
  const [instrumentTypeFilters, setInstrumentTypeFilters] = React.useState<AssetClassFilter[]>([]);

  const scopeStrategyIds = React.useMemo(
    () =>
      getStrategyIdsForScope({
        organizationIds: globalScope.organizationIds,
        clientIds: globalScope.clientIds,
        strategyIds: globalScope.strategyIds,
      }),
    [globalScope.organizationIds, globalScope.clientIds, globalScope.strategyIds],
  );

  const orders: OrderRecord[] = React.useMemo(() => {
    const raw = ordersRaw as Record<string, unknown> | undefined;
    const arr = raw ? (Array.isArray(raw) ? raw : (raw as Record<string, unknown>).orders) : undefined;
    const apiResult = Array.isArray(arr) && arr.length > 0 ? (arr as OrderRecord[]) : [];
    if (apiResult.length > 0) return apiResult;

    // Fall back to seed data
    const seed = getOrdersForScope(globalScope.organizationIds, globalScope.clientIds, globalScope.strategyIds);
    return seed.map((s, idx) => {
      const strat = SEED_STRATEGIES.find((st) => st.id === s.strategyId);
      return {
        order_id: s.id,
        instrument: s.instrument,
        side: s.side.toUpperCase() as "BUY" | "SELL",
        type: s.type,
        price: s.price,
        mark_price: s.price * (1 + (mock01(idx, 701) - 0.5) * 0.002),
        quantity: s.quantity,
        filled: s.filledQty,
        status: s.status,
        venue: s.venue,
        strategy_id: s.strategyId,
        strategy_name: strat?.name ?? s.strategyId,
        edge_bps: Math.round((mock01(idx, 702) * 20 - 5) * 10) / 10,
        instant_pnl: Math.round((mock01(idx, 703) * 200 - 50) * 100) / 100,
        created_at: s.timestamp,
      };
    });
  }, [ordersRaw, globalScope]);

  const scopedOrders = React.useMemo(() => {
    let result = orders;
    if (scopeStrategyIds.length > 0) {
      result = result.filter((o) => !o.strategy_id || scopeStrategyIds.includes(String(o.strategy_id)));
    }
    // Paper mode: tag order IDs with "(Paper)" suffix, mark all as simulated
    if (isPaper) {
      result = result.map((o) => ({
        ...o,
        order_id: o.order_id.endsWith("(Paper)") ? o.order_id : `${o.order_id} (Paper)`,
        status: "SIMULATED",
      }));
    }
    // Batch mode: only show filled (historically settled) orders
    if (isBatch) {
      result = result.filter((o) => o.status.toUpperCase().includes("FILLED"));
    }
    return result;
  }, [orders, scopeStrategyIds, isPaper, isBatch]);

  const filteredOrders = React.useMemo(() => {
    let result = scopedOrders;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.order_id.toLowerCase().includes(query) ||
          o.instrument.toLowerCase().includes(query) ||
          o.venue.toLowerCase().includes(query),
      );
    }
    if (venueFilter !== "all") {
      result = result.filter((o) => o.venue === venueFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status.toUpperCase() === statusFilter);
    }
    if (strategyFilter !== "all") {
      result = result.filter((o) => o.strategy_id === strategyFilter);
    }
    if (sideFilter !== "all") {
      result = result.filter((o) => o.side === sideFilter);
    }
    if (instrumentTypeFilters.length > 0) {
      result = result.filter((o) => instrumentTypeFilters.includes(classifyInstrument(o.instrument)));
    }
    return result;
  }, [scopedOrders, searchQuery, venueFilter, statusFilter, strategyFilter, sideFilter, instrumentTypeFilters]);

  const uniqueVenues = React.useMemo(() => [...new Set(orders.map((o) => o.venue))].sort(), [orders]);

  const uniqueStatuses = React.useMemo(() => [...new Set(orders.map((o) => o.status.toUpperCase()))].sort(), [orders]);

  const uniqueStrategies = React.useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach((o) => map.set(o.strategy_id, o.strategy_name || o.strategy_id));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1])) as [string, string][];
  }, [orders]);

  const summary = React.useMemo(
    () => ({
      total: filteredOrders.length,
      open: filteredOrders.filter((o) => o.status.toUpperCase().includes("OPEN")).length,
      filled: filteredOrders.filter((o) => o.status.toUpperCase().includes("FILLED")).length,
      partial: filteredOrders.filter((o) => o.status.toUpperCase().includes("PARTIAL")).length,
      rejected: filteredOrders.filter((o) => o.status.toUpperCase().includes("REJECTED")).length,
      failed: filteredOrders.filter((o) => o.status.toUpperCase().includes("FAILED")).length,
    }),
    [filteredOrders],
  );

  const handleCancel = React.useCallback((orderId: string) => cancelMutation.mutate(orderId), [cancelMutation]);

  const openAmendDialog = React.useCallback((order: OrderRecord) => {
    setAmendTarget(order);
    setAmendQty(String(order.quantity));
    setAmendPrice(String(order.price));
  }, []);

  const handleSubmitAmend = React.useCallback(
    (orderId: string, qty: number, price: number) => {
      amendMutation.mutate({ orderId, quantity: qty, price }, { onSuccess: () => setAmendTarget(null) });
    },
    [amendMutation],
  );

  const resetFilters = React.useCallback(() => {
    setSearchQuery("");
    setVenueFilter("all");
    setStatusFilter("all");
    setStrategyFilter("all");
    setSideFilter("all");
    setInstrumentTypeFilters([]);
  }, []);

  const toggleInstrumentTypeFilter = React.useCallback((t: AssetClassFilter) => {
    setInstrumentTypeFilters((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }, []);

  const filterDefs: FilterDefinition[] = React.useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "search" as const,
        placeholder: "Search by order ID, instrument, venue...",
      },
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
        key: "status",
        label: "Status",
        type: "select" as const,
        options: uniqueStatuses.map((s) => ({ value: s, label: s })),
      },
      {
        key: "side",
        label: "Side",
        type: "select" as const,
        options: [
          { value: "BUY", label: "Buy" },
          { value: "SELL", label: "Sell" },
        ],
      },
    ],
    [uniqueVenues, uniqueStatuses, uniqueStrategies],
  );

  const filterValues = React.useMemo(
    () => ({
      search: searchQuery || undefined,
      strategy: strategyFilter !== "all" ? strategyFilter : undefined,
      venue: venueFilter !== "all" ? venueFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      side: sideFilter !== "all" ? sideFilter : undefined,
    }),
    [searchQuery, strategyFilter, venueFilter, statusFilter, sideFilter],
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
      case "status":
        setStatusFilter((value as string) || "all");
        break;
      case "side":
        setSideFilter(((value as string) || "all") as "all" | "BUY" | "SELL");
        break;
    }
  }, []);

  const value: OrdersDataContextShape = React.useMemo(
    () => ({
      orders,
      isLoading,
      error: error as Error | null,
      refetch,
      cancelOrder: handleCancel,
      isCancelling: cancelMutation.isPending,
      openAmendDialog,
      submitAmend: handleSubmitAmend,
      isAmending: amendMutation.isPending,
      filteredOrders,
      summary,
      searchQuery,
      setSearchQuery,
      venueFilter,
      setVenueFilter,
      statusFilter,
      setStatusFilter,
      strategyFilter,
      setStrategyFilter,
      sideFilter,
      setSideFilter,
      instrumentTypeFilters,
      setInstrumentTypeFilters,
      toggleInstrumentTypeFilter,
      resetFilters,
      uniqueVenues,
      uniqueStatuses,
      uniqueStrategies,
      filterDefs,
      filterValues,
      handleFilterChange,
      assetClassOptions: ASSET_CLASS_OPTIONS,
      classifyInstrument,
      amendTarget,
      setAmendTarget,
    }),
    [
      orders,
      isLoading,
      error,
      refetch,
      handleCancel,
      cancelMutation.isPending,
      openAmendDialog,
      handleSubmitAmend,
      amendMutation.isPending,
      filteredOrders,
      summary,
      searchQuery,
      venueFilter,
      statusFilter,
      strategyFilter,
      sideFilter,
      instrumentTypeFilters,
      toggleInstrumentTypeFilter,
      resetFilters,
      uniqueVenues,
      uniqueStatuses,
      uniqueStrategies,
      filterDefs,
      filterValues,
      handleFilterChange,
      amendTarget,
    ],
  );

  const handleDialogSubmit = React.useCallback(() => {
    if (!amendTarget) return;
    handleSubmitAmend(amendTarget.order_id, Number(amendQty), Number(amendPrice));
  }, [amendTarget, amendQty, amendPrice, handleSubmitAmend]);

  return (
    <OrdersCtx.Provider value={value}>
      {children}

      <Dialog
        open={!!amendTarget}
        onOpenChange={(open) => {
          if (!open) setAmendTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Amend Order</DialogTitle>
          </DialogHeader>
          {amendTarget && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono">{amendTarget.order_id}</span>
                <span>&middot;</span>
                <span className="font-medium text-foreground">{amendTarget.instrument}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amend-qty">Quantity</Label>
                  <Input
                    id="amend-qty"
                    type="number"
                    step="any"
                    value={amendQty}
                    onChange={(e) => setAmendQty(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amend-price">Price</Label>
                  <Input
                    id="amend-price"
                    type="number"
                    step="any"
                    value={amendPrice}
                    onChange={(e) => setAmendPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAmendTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleDialogSubmit} disabled={amendMutation.isPending}>
              {amendMutation.isPending ? <Spinner size="sm" className="size-3.5 mr-1.5" /> : null}
              Confirm Amend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OrdersCtx.Provider>
  );
}
