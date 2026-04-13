"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/shared/spinner";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePlaceOrder } from "@/hooks/api/use-orders";
import { mock01 } from "@/lib/mocks/generators/deterministic";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils/formatters";
import { AlertTriangle, CheckCircle2, LayoutGrid, XCircle } from "lucide-react";
import * as React from "react";
import { DEFAULT_QUOTE_INSTRUMENTS } from "./constants";
import type { QuoteRow, QuoteStatus, RefreshInterval } from "./types";

function buildInitialQuotes(): QuoteRow[] {
  return DEFAULT_QUOTE_INSTRUMENTS.map((inst, idx) => ({
    id: `quote-${idx}`,
    symbol: inst.symbol,
    venue: inst.venue,
    bidPrice: formatNumber(inst.bidPrice, 2),
    bidSize: formatNumber(inst.bidSize, 4),
    askPrice: formatNumber(inst.askPrice, 2),
    askSize: formatNumber(inst.askSize, 4),
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
  return formatNumber(spreadBps, 1);
}

export function MassQuotePanel() {
  const placeOrder = usePlaceOrder();

  const [quotes, setQuotes] = React.useState<QuoteRow[]>(buildInitialQuotes);
  const [refreshInterval, setRefreshInterval] = React.useState<RefreshInterval>("manual");
  const [maxPositionPerInstrument, setMaxPositionPerInstrument] = React.useState("100");
  const [inventorySkew, setInventorySkew] = React.useState(false);
  const [quoteStatus, setQuoteStatus] = React.useState<QuoteStatus>({
    quotesOutstanding: 0,
    fillRate: 0,
    pnlFromSpread: 0,
    inventory: {},
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [lastAction, setLastAction] = React.useState<"quoted" | "cancelled" | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const quoteTickRef = React.useRef(0);

  const activeQuotes = quotes.filter((q) => q.active);

  const updateQuote = (id: string, field: keyof QuoteRow, value: string | number | boolean) => {
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
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
          bidPrice: formatNumber(bid + adjustment, 2),
          askPrice: formatNumber(ask + adjustment, 2),
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

  React.useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (refreshInterval === "manual") return;

    const ms = refreshInterval === "100ms" ? 100 : refreshInterval === "500ms" ? 500 : 1000;
    intervalRef.current = setInterval(() => {
      quoteTickRef.current += 1;
      const tick = quoteTickRef.current;
      setQuotes((prev) =>
        prev.map((q, qi) => {
          if (!q.active) return q;
          const bid = parseFloat(q.bidPrice) || 0;
          const ask = parseFloat(q.askPrice) || 0;
          if (bid <= 0) return q;
          const jitter = bid * 0.00001 * (mock01(tick * 1000 + qi, 200) - 0.5);
          return {
            ...q,
            bidPrice: formatNumber(bid + jitter, 2),
            askPrice: formatNumber(ask + jitter, 2),
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
                <Spinner size="sm" className="size-3.5 mr-1.5" />
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
            <label className="text-[10px] text-muted-foreground">Refresh Interval</label>
            <Select value={refreshInterval} onValueChange={(v) => setRefreshInterval(v as RefreshInterval)}>
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
            <label className="text-[10px] text-muted-foreground">Max Position / Instrument</label>
            <Input
              type="number"
              className="h-8 text-xs font-mono"
              value={maxPositionPerInstrument}
              onChange={(e) => setMaxPositionPerInstrument(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-muted-foreground">Inventory Skew (auto-adjust spread)</label>
          <Switch checked={inventorySkew} onCheckedChange={setInventorySkew} />
        </div>
      </div>

      {lastAction === "quoted" && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <CheckCircle2 className="size-3.5 text-emerald-500" />
          <span className="text-xs text-emerald-500">Quotes submitted successfully</span>
        </div>
      )}
      {lastAction === "cancelled" && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle className="size-3.5 text-amber-500" />
          <span className="text-xs text-amber-600 dark:text-amber-400">All quotes cancelled</span>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium">Quote Grid</p>
        <div className="space-y-3">
          {quotes.map((q) => (
            <div
              key={q.id}
              className={cn("p-3 rounded-lg border space-y-2 transition-opacity", !q.active && "opacity-50")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium">{q.symbol}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {q.venue}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                    {computeSpread(q.bidPrice, q.askPrice)} bps
                  </Badge>
                  <Switch checked={q.active} onCheckedChange={(checked) => updateQuote(q.id, "active", checked)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-emerald-500">Bid Price</label>
                  <Input
                    type="number"
                    className="h-7 text-xs font-mono"
                    value={q.bidPrice}
                    onChange={(e) => updateQuote(q.id, "bidPrice", e.target.value)}
                    disabled={!q.active}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-rose-500">Ask Price</label>
                  <Input
                    type="number"
                    className="h-7 text-xs font-mono"
                    value={q.askPrice}
                    onChange={(e) => updateQuote(q.id, "askPrice", e.target.value)}
                    disabled={!q.active}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-emerald-500">Bid Size</label>
                  <Input
                    type="number"
                    className="h-7 text-xs font-mono"
                    value={q.bidSize}
                    onChange={(e) => updateQuote(q.id, "bidSize", e.target.value)}
                    disabled={!q.active}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-rose-500">Ask Size</label>
                  <Input
                    type="number"
                    className="h-7 text-xs font-mono"
                    value={q.askSize}
                    onChange={(e) => updateQuote(q.id, "askSize", e.target.value)}
                    disabled={!q.active}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-muted-foreground">Skew</label>
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

      <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
        <p className="text-xs font-medium">Status</p>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <span className="text-muted-foreground">Quotes Outstanding</span>
          <span className="font-mono text-right">{quoteStatus.quotesOutstanding}</span>
          <span className="text-muted-foreground">Fill Rate</span>
          <span className="font-mono text-right">{formatPercent(quoteStatus.fillRate, 1)}</span>
          <span className="text-muted-foreground">PnL from Spread</span>
          <span
            className={cn(
              "font-mono text-right",
              quoteStatus.pnlFromSpread >= 0 ? "text-emerald-500" : "text-rose-500",
            )}
          >
            {formatCurrency(quoteStatus.pnlFromSpread, "USD", 2)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium">Inventory</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] h-7">Instrument</TableHead>
              <TableHead className="text-[10px] h-7 text-right">Net Position</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.keys(quoteStatus.inventory).length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-xs text-muted-foreground text-center py-3">
                  No inventory
                </TableCell>
              </TableRow>
            ) : (
              Object.entries(quoteStatus.inventory).map(([symbol, position]) => (
                <TableRow key={symbol}>
                  <TableCell className="font-mono text-xs">{symbol}</TableCell>
                  <TableCell
                    className={cn(
                      "font-mono text-xs text-right",
                      position > 0 ? "text-emerald-500" : position < 0 ? "text-rose-500" : "",
                    )}
                  >
                    {position > 0 ? "+" : ""}
                    {formatNumber(position, 4)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
