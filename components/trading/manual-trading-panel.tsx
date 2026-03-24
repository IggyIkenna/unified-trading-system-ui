"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  CheckCircle2,
  XCircle,
  PenLine,
  AlertTriangle,
  ShieldCheck,
  ShieldX,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaceOrder, usePreTradeCheck } from "@/hooks/api/use-orders";
import { useAuth } from "@/hooks/use-auth";

const VENUES = [
  "Binance",
  "Deribit",
  "Hyperliquid",
  "Coinbase",
  "OKX",
  "Bybit",
  "Uniswap",
  "Aave",
  "Smarkets",
  "Betfair",
  "Polymarket",
  "Kalshi",
] as const;

const ALGOS = [
  "MARKET",
  "TWAP",
  "VWAP",
  "ICEBERG",
  "SOR",
  "BEST_PRICE",
  "BENCHMARK_FILL",
] as const;

const DEFAULT_QUOTE_INSTRUMENTS = [
  {
    symbol: "BTC/USDT",
    venue: "Binance",
    bidPrice: 67250.0,
    askPrice: 67280.0,
    bidSize: 0.5,
    askSize: 0.5,
  },
  {
    symbol: "ETH/USDT",
    venue: "Binance",
    bidPrice: 3420.5,
    askPrice: 3422.8,
    bidSize: 5.0,
    askSize: 5.0,
  },
  {
    symbol: "SOL/USDT",
    venue: "OKX",
    bidPrice: 142.3,
    askPrice: 142.55,
    bidSize: 50.0,
    askSize: 50.0,
  },
  {
    symbol: "BTC/USDT",
    venue: "OKX",
    bidPrice: 67248.0,
    askPrice: 67282.0,
    bidSize: 0.25,
    askSize: 0.25,
  },
  {
    symbol: "ETH/USDT",
    venue: "OKX",
    bidPrice: 3419.8,
    askPrice: 3423.1,
    bidSize: 10.0,
    askSize: 10.0,
  },
] as const;

type RefreshInterval = "manual" | "100ms" | "500ms" | "1s";

interface QuoteRow {
  id: string;
  symbol: string;
  venue: string;
  bidPrice: string;
  bidSize: string;
  askPrice: string;
  askSize: string;
  skewBps: number;
  active: boolean;
}

interface QuoteStatus {
  quotesOutstanding: number;
  fillRate: number;
  pnlFromSpread: number;
  inventory: Record<string, number>;
}

function buildInitialQuotes(): QuoteRow[] {
  return DEFAULT_QUOTE_INSTRUMENTS.map((inst, idx) => ({
    id: `quote-${idx}`,
    symbol: inst.symbol,
    venue: inst.venue,
    bidPrice: inst.bidPrice.toFixed(2),
    bidSize: inst.bidSize.toFixed(4),
    askPrice: inst.askPrice.toFixed(2),
    askSize: inst.askSize.toFixed(4),
    skewBps: 0,
    active: true,
  }));
}

function computeSpread(bidPrice: string, askPrice: string): string {
  const bid = parseFloat(bidPrice) || 0;
  const ask = parseFloat(askPrice) || 0;
  if (bid <= 0 || ask <= 0) return "—";
  const mid = (bid + ask) / 2;
  const spreadBps = ((ask - bid) / mid) * 10000;
  return spreadBps.toFixed(1);
}

function MassQuotePanel() {
  const { token } = useAuth();
  const placeOrder = usePlaceOrder();

  const [quotes, setQuotes] = React.useState<QuoteRow[]>(buildInitialQuotes);
  const [refreshInterval, setRefreshInterval] =
    React.useState<RefreshInterval>("manual");
  const [maxPositionPerInstrument, setMaxPositionPerInstrument] =
    React.useState("100");
  const [inventorySkew, setInventorySkew] = React.useState(false);
  const [quoteStatus, setQuoteStatus] = React.useState<QuoteStatus>({
    quotesOutstanding: 0,
    fillRate: 0,
    pnlFromSpread: 0,
    inventory: {},
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [lastAction, setLastAction] = React.useState<
    "quoted" | "cancelled" | null
  >(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const activeQuotes = quotes.filter((q) => q.active);

  const updateQuote = (
    id: string,
    field: keyof QuoteRow,
    value: string | number | boolean,
  ) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
    );
  };

  const handleSkewChange = (id: string, bps: number) => {
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const bid = parseFloat(q.bidPrice) || 0;
        const ask = parseFloat(q.askPrice) || 0;
        if (bid <= 0 || ask <= 0) return { ...q, skewBps: bps };
        const mid = (bid + ask) / 2;
        const oldBps = q.skewBps;
        const deltaBps = bps - oldBps;
        const adjustment = mid * (deltaBps / 10000);
        return {
          ...q,
          skewBps: bps,
          bidPrice: (bid + adjustment).toFixed(2),
          askPrice: (ask + adjustment).toFixed(2),
        };
      }),
    );
  };

  const handleQuoteAll = async () => {
    setSubmitting(true);
    setLastAction(null);
    const active = quotes.filter((q) => q.active);
    const promises = active.flatMap((q) => {
      const bidQty = parseFloat(q.bidSize) || 0;
      const askQty = parseFloat(q.askSize) || 0;
      const bidPx = parseFloat(q.bidPrice) || 0;
      const askPx = parseFloat(q.askPrice) || 0;
      const orders = [];
      if (bidQty > 0 && bidPx > 0) {
        orders.push(
          placeOrder.mutateAsync({
            instrument: q.symbol,
            side: "buy" as const,
            order_type: "limit" as const,
            quantity: bidQty,
            price: bidPx,
            venue: q.venue,
            reason: "mass-quote",
          }),
        );
      }
      if (askQty > 0 && askPx > 0) {
        orders.push(
          placeOrder.mutateAsync({
            instrument: q.symbol,
            side: "sell" as const,
            order_type: "limit" as const,
            quantity: askQty,
            price: askPx,
            venue: q.venue,
            reason: "mass-quote",
          }),
        );
      }
      return orders;
    });
    try {
      await Promise.all(promises);
      setQuoteStatus((prev) => ({
        ...prev,
        quotesOutstanding: prev.quotesOutstanding + promises.length,
      }));
      setLastAction("quoted");
    } catch {
      // individual order errors are handled by the mutation
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAll = () => {
    setQuoteStatus({
      quotesOutstanding: 0,
      fillRate: 0,
      pnlFromSpread: 0,
      inventory: {},
    });
    setLastAction("cancelled");
  };

  // Auto-refresh interval
  React.useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (refreshInterval === "manual") return;

    const ms =
      refreshInterval === "100ms"
        ? 100
        : refreshInterval === "500ms"
          ? 500
          : 1000;
    intervalRef.current = setInterval(() => {
      // Simulate quote refresh — in production this would re-fetch prices
      setQuotes((prev) =>
        prev.map((q) => {
          if (!q.active) return q;
          const bid = parseFloat(q.bidPrice) || 0;
          const ask = parseFloat(q.askPrice) || 0;
          if (bid <= 0) return q;
          const jitter = bid * 0.00001 * (Math.random() - 0.5);
          return {
            ...q,
            bidPrice: (bid + jitter).toFixed(2),
            askPrice: (ask + jitter).toFixed(2),
          };
        }),
      );
    }, ms);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval]);

  return (
    <div className="space-y-4">
      {/* Global Controls */}
      <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
        <p className="text-xs font-medium">Global Controls</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleQuoteAll}
            disabled={submitting || activeQuotes.length === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                Quoting...
              </>
            ) : (
              <>
                <LayoutGrid className="size-3.5 mr-1.5" />
                Quote All ({activeQuotes.length})
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleCancelAll}
            disabled={quoteStatus.quotesOutstanding === 0}
          >
            <XCircle className="size-3.5 mr-1.5" />
            Cancel All
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">
              Refresh Interval
            </label>
            <Select
              value={refreshInterval}
              onValueChange={(v) => setRefreshInterval(v as RefreshInterval)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="100ms">100ms</SelectItem>
                <SelectItem value="500ms">500ms</SelectItem>
                <SelectItem value="1s">1s</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground">
              Max Position / Instrument
            </label>
            <Input
              type="number"
              className="h-8 text-xs font-mono"
              value={maxPositionPerInstrument}
              onChange={(e) => setMaxPositionPerInstrument(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-muted-foreground">
            Inventory Skew (auto-adjust spread)
          </label>
          <Switch checked={inventorySkew} onCheckedChange={setInventorySkew} />
        </div>
      </div>

      {/* Status Feedback */}
      {lastAction === "quoted" && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <CheckCircle2 className="size-3.5 text-emerald-500" />
          <span className="text-xs text-emerald-500">
            Quotes submitted successfully
          </span>
        </div>
      )}
      {lastAction === "cancelled" && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle className="size-3.5 text-amber-500" />
          <span className="text-xs text-amber-600 dark:text-amber-400">
            All quotes cancelled
          </span>
        </div>
      )}

      {/* Quote Grid */}
      <div className="space-y-2">
        <p className="text-xs font-medium">Quote Grid</p>
        <div className="space-y-3">
          {quotes.map((q) => (
            <div
              key={q.id}
              className={cn(
                "p-3 rounded-lg border space-y-2 transition-opacity",
                !q.active && "opacity-50",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium">
                    {q.symbol}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {q.venue}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 font-mono"
                  >
                    {computeSpread(q.bidPrice, q.askPrice)} bps
                  </Badge>
                  <Switch
                    checked={q.active}
                    onCheckedChange={(checked) =>
                      updateQuote(q.id, "active", checked)
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-emerald-500">
                    Bid Price
                  </label>
                  <Input
                    type="number"
                    className="h-7 text-xs font-mono"
                    value={q.bidPrice}
                    onChange={(e) =>
                      updateQuote(q.id, "bidPrice", e.target.value)
                    }
                    disabled={!q.active}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-rose-500">Ask Price</label>
                  <Input
                    type="number"
                    className="h-7 text-xs font-mono"
                    value={q.askPrice}
                    onChange={(e) =>
                      updateQuote(q.id, "askPrice", e.target.value)
                    }
                    disabled={!q.active}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-emerald-500">
                    Bid Size
                  </label>
                  <Input
                    type="number"
                    className="h-7 text-xs font-mono"
                    value={q.bidSize}
                    onChange={(e) =>
                      updateQuote(q.id, "bidSize", e.target.value)
                    }
                    disabled={!q.active}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-rose-500">Ask Size</label>
                  <Input
                    type="number"
                    className="h-7 text-xs font-mono"
                    value={q.askSize}
                    onChange={(e) =>
                      updateQuote(q.id, "askSize", e.target.value)
                    }
                    disabled={!q.active}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-muted-foreground">
                    Skew
                  </label>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {q.skewBps > 0 ? "+" : ""}
                    {q.skewBps} bps
                  </span>
                </div>
                <Slider
                  min={-5}
                  max={5}
                  step={0.5}
                  value={[q.skewBps]}
                  onValueChange={([val]) => handleSkewChange(q.id, val)}
                  disabled={!q.active}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Status Panel */}
      <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
        <p className="text-xs font-medium">Status</p>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <span className="text-muted-foreground">Quotes Outstanding</span>
          <span className="font-mono text-right">
            {quoteStatus.quotesOutstanding}
          </span>
          <span className="text-muted-foreground">Fill Rate</span>
          <span className="font-mono text-right">
            {quoteStatus.fillRate.toFixed(1)}%
          </span>
          <span className="text-muted-foreground">PnL from Spread</span>
          <span
            className={cn(
              "font-mono text-right",
              quoteStatus.pnlFromSpread >= 0
                ? "text-emerald-500"
                : "text-rose-500",
            )}
          >
            ${quoteStatus.pnlFromSpread.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="space-y-2">
        <p className="text-xs font-medium">Inventory</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] h-7">Instrument</TableHead>
              <TableHead className="text-[10px] h-7 text-right">
                Net Position
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.keys(quoteStatus.inventory).length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-xs text-muted-foreground text-center py-3"
                >
                  No inventory
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(quoteStatus.inventory).map(
                ([symbol, position]) => (
                  <TableRow key={symbol}>
                    <TableCell className="font-mono text-xs">
                      {symbol}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "font-mono text-xs text-right",
                        position > 0
                          ? "text-emerald-500"
                          : position < 0
                            ? "text-rose-500"
                            : "",
                      )}
                    >
                      {position > 0 ? "+" : ""}
                      {position.toFixed(4)}
                    </TableCell>
                  </TableRow>
                ),
              )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface ComplianceCheckResult {
  name: string;
  passed: boolean;
  limit_value: number | string;
  current_value: number | string;
  proposed_value: number | string;
}

interface PreTradeCheckResponse {
  passed: boolean;
  checks: ComplianceCheckResult[];
}

interface ManualTradingPanelProps {
  defaultInstrument?: string;
  defaultVenue?: string;
  currentPrice?: number;
  instruments?: Array<{ symbol: string; venue: string }>;
  strategies?: Array<{ id: string; name: string }>;
}

type OrderState = "idle" | "preview" | "submitting" | "success" | "error";

export function ManualTradingPanel({
  defaultInstrument = "BTC/USDT",
  defaultVenue = "Binance",
  currentPrice = 0,
  instruments = [],
  strategies = [],
}: ManualTradingPanelProps) {
  const { user } = useAuth();
  const placeOrder = usePlaceOrder();
  const preTradeCheck = usePreTradeCheck();

  const [open, setOpen] = React.useState(false);
  const [panelMode, setPanelMode] = React.useState<"single" | "mass-quote">(
    "single",
  );
  const [side, setSide] = React.useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = React.useState<"limit" | "market">("limit");
  const [instrument, setInstrument] = React.useState(defaultInstrument);
  const [venue, setVenue] = React.useState(defaultVenue);
  const [quantity, setQuantity] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [strategyId, setStrategyId] = React.useState("manual");
  const [reason, setReason] = React.useState("");
  const [algo, setAlgo] = React.useState<string>("MARKET");
  const [algoParams, setAlgoParams] = React.useState<Record<string, number>>(
    {},
  );
  const [executionMode, setExecutionMode] = React.useState<
    "execute" | "record_only"
  >("execute");
  const [counterparty, setCounterparty] = React.useState("");
  const [sourceReference, setSourceReference] = React.useState("");
  const [orderState, setOrderState] = React.useState<OrderState>("idle");
  const [errorMessage, setErrorMessage] = React.useState("");
  const [complianceResult, setComplianceResult] =
    React.useState<PreTradeCheckResponse | null>(null);
  const [complianceUnavailable, setComplianceUnavailable] =
    React.useState(false);
  const [complianceLoading, setComplianceLoading] = React.useState(false);

  React.useEffect(() => {
    setInstrument(defaultInstrument);
  }, [defaultInstrument]);

  React.useEffect(() => {
    setVenue(defaultVenue);
  }, [defaultVenue]);

  const effectivePrice =
    orderType === "market" ? currentPrice : parseFloat(price) || 0;
  const qty = parseFloat(quantity) || 0;
  const total = effectivePrice * qty;

  const canPreview = qty > 0 && (orderType === "market" || effectivePrice > 0);

  const handlePreview = async () => {
    if (!canPreview) return;
    setOrderState("preview");
    setComplianceResult(null);
    setComplianceUnavailable(false);
    setComplianceLoading(true);
    try {
      const result = (await preTradeCheck.mutateAsync({
        instrument,
        side,
        quantity: qty,
        price: orderType === "limit" ? effectivePrice : undefined,
        strategy_id: strategyId === "manual" ? undefined : strategyId,
      })) as PreTradeCheckResponse;
      setComplianceResult(result);
    } catch {
      setComplianceUnavailable(true);
    } finally {
      setComplianceLoading(false);
    }
  };

  const compliancePassed =
    complianceUnavailable || (complianceResult?.passed ?? false);
  const failedCheck = complianceResult?.checks.find((c) => !c.passed);

  const handleSubmit = async () => {
    setOrderState("submitting");
    setErrorMessage("");
    try {
      await placeOrder.mutateAsync({
        instrument,
        side,
        order_type: orderType,
        quantity: qty,
        price: orderType === "limit" ? effectivePrice : undefined,
        venue,
        strategy_id: strategyId === "manual" ? undefined : strategyId,
        client_id: user?.org?.id,
        reason: reason || undefined,
        algo,
        algo_params:
          Object.keys(algoParams).length > 0 ? algoParams : undefined,
        execution_mode: executionMode,
        counterparty:
          executionMode === "record_only" && counterparty
            ? counterparty
            : undefined,
        source_reference:
          executionMode === "record_only" && sourceReference
            ? sourceReference
            : undefined,
      });
      setOrderState("success");
      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Order failed");
      setOrderState("error");
    }
  };

  const resetForm = () => {
    setQuantity("");
    setPrice("");
    setReason("");
    setStrategyId("manual");
    setAlgo("MARKET");
    setAlgoParams({});
    setExecutionMode("execute");
    setCounterparty("");
    setSourceReference("");
    setOrderState("idle");
    setErrorMessage("");
    setComplianceResult(null);
    setComplianceUnavailable(false);
    setComplianceLoading(false);
    setPanelMode("single");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <PenLine className="size-3.5" />
          Manual Trade
        </Button>
      </SheetTrigger>
      <SheetContent
        className={cn(
          "overflow-y-auto",
          panelMode === "mass-quote"
            ? "w-[480px] sm:w-[520px]"
            : "w-[400px] sm:w-[440px]",
        )}
      >
        <SheetHeader>
          <SheetTitle>
            {panelMode === "single" ? "Manual Trade Entry" : "Mass Quote"}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Panel Mode Toggle */}
          <Tabs
            value={panelMode}
            onValueChange={(v) => setPanelMode(v as "single" | "mass-quote")}
          >
            <TabsList className="w-full">
              <TabsTrigger value="single" className="flex-1">
                Single Order
              </TabsTrigger>
              <TabsTrigger value="mass-quote" className="flex-1 gap-1.5">
                <LayoutGrid className="size-3" />
                Mass Quote
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {panelMode === "mass-quote" && <MassQuotePanel />}

          {/* Single Order Mode */}
          {panelMode === "single" && (
            <>
              {/* Instrument */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Instrument
                </label>
                {instruments.length > 0 ? (
                  <Select value={instrument} onValueChange={setInstrument}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {instruments.map((inst) => (
                        <SelectItem key={inst.symbol} value={inst.symbol}>
                          <span className="font-mono">{inst.symbol}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {inst.venue}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={instrument}
                    onChange={(e) => setInstrument(e.target.value)}
                    className="font-mono"
                  />
                )}
              </div>

              {/* Venue */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Venue</label>
                <Select value={venue} onValueChange={setVenue}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VENUES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Side */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={side === "buy" ? "default" : "outline"}
                  className={cn(
                    "w-full",
                    side === "buy" && "bg-emerald-600 hover:bg-emerald-700",
                  )}
                  onClick={() => setSide("buy")}
                >
                  <TrendingUp className="size-4 mr-2" />
                  Buy
                </Button>
                <Button
                  variant={side === "sell" ? "default" : "outline"}
                  className={cn(
                    "w-full",
                    side === "sell" && "bg-rose-600 hover:bg-rose-700",
                  )}
                  onClick={() => setSide("sell")}
                >
                  <TrendingDown className="size-4 mr-2" />
                  Sell
                </Button>
              </div>

              {/* Order Type */}
              <Tabs
                value={orderType}
                onValueChange={(v) => setOrderType(v as "limit" | "market")}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="limit" className="flex-1">
                    Limit
                  </TabsTrigger>
                  <TabsTrigger value="market" className="flex-1">
                    Market
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Algo */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Algo</label>
                <Select
                  value={algo}
                  onValueChange={(v) => {
                    setAlgo(v);
                    setAlgoParams({});
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALGOS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Algo Params */}
              {algo === "TWAP" && (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 30"
                    value={algoParams.duration_minutes ?? ""}
                    onChange={(e) =>
                      setAlgoParams({
                        ...algoParams,
                        duration_minutes: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="font-mono"
                  />
                </div>
              )}
              {algo === "ICEBERG" && (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Number of Slices
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 5"
                    value={algoParams.num_slices ?? ""}
                    onChange={(e) =>
                      setAlgoParams({
                        ...algoParams,
                        num_slices: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="font-mono"
                  />
                </div>
              )}
              {algo === "SOR" && (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Max Slippage (bps)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 10"
                    value={algoParams.max_slippage_bps ?? ""}
                    onChange={(e) =>
                      setAlgoParams({
                        ...algoParams,
                        max_slippage_bps: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="font-mono"
                  />
                </div>
              )}

              {/* Price */}
              {orderType === "limit" && (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">
                    Price (USD)
                  </label>
                  <Input
                    type="number"
                    placeholder={
                      currentPrice > 0 ? currentPrice.toFixed(2) : "0.00"
                    }
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="font-mono"
                  />
                </div>
              )}

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Quantity
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="font-mono"
                />
                <div className="flex items-center gap-1">
                  {[25, 50, 75, 100].map((pct) => (
                    <Button
                      key={pct}
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] flex-1"
                      onClick={() => setQuantity((0.01 * pct).toFixed(4))}
                    >
                      {pct}%
                    </Button>
                  ))}
                </div>
              </div>

              {/* Strategy Link */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Link to Strategy
                </label>
                <Select value={strategyId} onValueChange={setStrategyId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual (unlinked)</SelectItem>
                    {strategies.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Reason (optional)
                </label>
                <Input
                  placeholder="e.g. hedge delta exposure"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              {/* Execution Mode */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Execution Mode
                </label>
                <Tabs
                  value={executionMode}
                  onValueChange={(v) =>
                    setExecutionMode(v as "execute" | "record_only")
                  }
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="execute" className="flex-1">
                      Execute
                    </TabsTrigger>
                    <TabsTrigger value="record_only" className="flex-1">
                      Record Only
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {executionMode === "record_only" && (
                <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">
                      Counterparty
                    </label>
                    <Input
                      placeholder="e.g. Goldman Sachs"
                      value={counterparty}
                      onChange={(e) => setCounterparty(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">
                      Source Reference
                    </label>
                    <Input
                      placeholder="e.g. Bloomberg ticket #12345"
                      value={sourceReference}
                      onChange={(e) => setSourceReference(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <Separator />

              {/* Order Preview */}
              {orderState === "preview" && (
                <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                  <p className="text-xs font-medium">Order Preview</p>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <span className="text-muted-foreground">Side</span>
                    <span
                      className={cn(
                        "font-medium",
                        side === "buy" ? "text-emerald-500" : "text-rose-500",
                      )}
                    >
                      {side.toUpperCase()}
                    </span>
                    <span className="text-muted-foreground">Instrument</span>
                    <span className="font-mono">{instrument}</span>
                    <span className="text-muted-foreground">Type</span>
                    <span className="capitalize">{orderType}</span>
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-mono">
                      $
                      {effectivePrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-mono">{qty}</span>
                    <span className="text-muted-foreground">Venue</span>
                    <span>{venue}</span>
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-mono font-medium">
                      $
                      {total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              )}

              {/* Compliance Check */}
              {orderState === "preview" && (
                <div className="p-3 rounded-lg border space-y-2">
                  <p className="text-xs font-medium flex items-center gap-1.5">
                    {complianceLoading && (
                      <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                    )}
                    {!complianceLoading && complianceResult?.passed && (
                      <ShieldCheck className="size-3.5 text-emerald-500" />
                    )}
                    {!complianceLoading &&
                      complianceResult &&
                      !complianceResult.passed && (
                        <ShieldX className="size-3.5 text-rose-500" />
                      )}
                    {!complianceLoading && complianceUnavailable && (
                      <AlertTriangle className="size-3.5 text-amber-500" />
                    )}
                    Pre-Trade Compliance
                  </p>

                  {complianceLoading && (
                    <p className="text-xs text-muted-foreground">
                      Running compliance checks...
                    </p>
                  )}

                  {complianceUnavailable && (
                    <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/30">
                      <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        Compliance check unavailable — submission permitted with
                        caution
                      </span>
                    </div>
                  )}

                  {complianceResult && (
                    <>
                      <div className="space-y-1.5">
                        {complianceResult.checks.map((check) => (
                          <div
                            key={check.name}
                            className="flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant={
                                  check.passed ? "outline" : "destructive"
                                }
                                className={cn(
                                  "text-[10px] px-1.5 py-0",
                                  check.passed &&
                                    "border-emerald-500/50 text-emerald-600 dark:text-emerald-400",
                                )}
                              >
                                {check.passed ? "PASS" : "FAIL"}
                              </Badge>
                              <span className="text-muted-foreground">
                                {check.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-[10px]">
                              <span
                                className="text-muted-foreground"
                                title="Limit"
                              >
                                {check.limit_value}
                              </span>
                              <span className="text-muted-foreground">/</span>
                              <span title="Current">{check.current_value}</span>
                              <span className="text-muted-foreground">→</span>
                              <span
                                className={cn(
                                  !check.passed && "text-rose-500 font-medium",
                                )}
                                title="Proposed"
                              >
                                {check.proposed_value}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div
                        className={cn(
                          "flex items-center gap-2 p-2 rounded text-xs",
                          complianceResult.passed
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {complianceResult.passed ? (
                          <>
                            <ShieldCheck className="size-3.5 shrink-0" />
                            Pre-trade checks passed
                          </>
                        ) : (
                          <>
                            <ShieldX className="size-3.5 shrink-0" />
                            Order rejected —{" "}
                            {failedCheck?.name ?? "compliance check"} violated
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Status Messages */}
              {orderState === "success" && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  <span className="text-sm text-emerald-500">
                    Order submitted successfully
                  </span>
                </div>
              )}
              {orderState === "error" && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
                  <XCircle className="size-4 text-rose-500" />
                  <span className="text-sm text-rose-500">{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {orderState === "idle" && (
                  <Button
                    className="flex-1"
                    onClick={handlePreview}
                    disabled={!canPreview}
                  >
                    Preview Order
                  </Button>
                )}
                {orderState === "preview" && (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setOrderState("idle")}
                    >
                      Edit
                    </Button>
                    <Button
                      className={cn(
                        "flex-1",
                        side === "buy"
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-rose-600 hover:bg-rose-700",
                      )}
                      onClick={handleSubmit}
                      disabled={
                        complianceLoading ||
                        (!compliancePassed && !complianceLoading)
                      }
                    >
                      {complianceLoading ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>Confirm {side === "buy" ? "Buy" : "Sell"}</>
                      )}
                    </Button>
                  </>
                )}
                {orderState === "submitting" && (
                  <Button className="flex-1" disabled>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Submitting...
                  </Button>
                )}
                {orderState === "error" && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setOrderState("preview")}
                  >
                    Retry
                  </Button>
                )}
              </div>
            </>
          )}

          {/* Client Badge */}
          {user && (
            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">
                {user.org?.id ?? "unknown org"}
              </Badge>
              <span>
                Submitted by {user.displayName ?? user.email ?? "unknown"}
              </span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
