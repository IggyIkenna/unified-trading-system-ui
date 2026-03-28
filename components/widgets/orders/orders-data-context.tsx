"use client";

import * as React from "react";
import { useOrders, useCancelOrder, useAmendOrder } from "@/hooks/api/use-orders";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { useExecutionMode } from "@/lib/execution-mode-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type InstrumentType = "All" | "Spot" | "Perp" | "Futures" | "Options" | "DeFi" | "Prediction";

interface OrderRecord {
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
  };

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  venueFilter: string;
  setVenueFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  instrumentTypeFilter: InstrumentType;
  setInstrumentTypeFilter: (t: InstrumentType) => void;
  resetFilters: () => void;

  uniqueVenues: string[];
  uniqueStatuses: string[];

  amendTarget: OrderRecord | null;
  setAmendTarget: (order: OrderRecord | null) => void;
}

const OrdersCtx = React.createContext<OrdersDataContextShape | null>(null);

export function useOrdersData(): OrdersDataContextShape {
  const ctx = React.useContext(OrdersCtx);
  if (!ctx) throw new Error("useOrdersData must be used within OrdersDataProvider");
  return ctx;
}

function classifyInstrument(instrument: string): Exclude<InstrumentType, "All"> {
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

export { type OrderRecord, type InstrumentType, classifyInstrument };

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
  const [instrumentTypeFilter, setInstrumentTypeFilter] = React.useState<InstrumentType>("All");

  const orders: OrderRecord[] = React.useMemo(() => {
    if (!ordersRaw) return [];
    const raw = ordersRaw as Record<string, unknown>;
    const arr = Array.isArray(raw) ? raw : (raw as Record<string, unknown>).orders;
    return Array.isArray(arr) ? (arr as OrderRecord[]) : [];
  }, [ordersRaw]);

  const scopedOrders = React.useMemo(() => {
    let result = orders;
    if (globalScope.strategyIds.length > 0) {
      result = result.filter((o) => !o.strategy_id || globalScope.strategyIds.includes(String(o.strategy_id)));
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
  }, [orders, globalScope.strategyIds, isPaper, isBatch]);

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
    if (instrumentTypeFilter !== "All") {
      result = result.filter((o) => classifyInstrument(o.instrument) === instrumentTypeFilter);
    }
    return result;
  }, [scopedOrders, searchQuery, venueFilter, statusFilter, instrumentTypeFilter]);

  const uniqueVenues = React.useMemo(() => [...new Set(orders.map((o) => o.venue))].sort(), [orders]);

  const uniqueStatuses = React.useMemo(() => [...new Set(orders.map((o) => o.status.toUpperCase()))].sort(), [orders]);

  const summary = React.useMemo(
    () => ({
      total: filteredOrders.length,
      open: filteredOrders.filter((o) => o.status.toUpperCase().includes("OPEN")).length,
      filled: filteredOrders.filter((o) => o.status.toUpperCase().includes("FILLED")).length,
      partial: filteredOrders.filter((o) => o.status.toUpperCase().includes("PARTIAL")).length,
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
    setInstrumentTypeFilter("All");
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
      instrumentTypeFilter,
      setInstrumentTypeFilter,
      resetFilters,
      uniqueVenues,
      uniqueStatuses,
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
      instrumentTypeFilter,
      resetFilters,
      uniqueVenues,
      uniqueStatuses,
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
              {amendMutation.isPending ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : null}
              Confirm Amend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OrdersCtx.Provider>
  );
}
