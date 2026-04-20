"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import { DollarSign } from "lucide-react";
import * as React from "react";

interface OrderBookLevel {
  price: number;
  size: number;
  total: number; // Cumulative
}

interface OrderBookProps {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastPrice: number;
  spread: number;
  spreadBps: number;
  midPrice: number;
  venue?: string;
  hideTitle?: boolean;
  className?: string;
}

export function OrderBook({
  symbol,
  bids,
  asks,
  lastPrice,
  spread,
  spreadBps,
  midPrice,
  venue = "Binance",
  hideTitle = false,
  className,
}: OrderBookProps) {
  const [showNative, setShowNative] = React.useState(false);
  const [decimals, setDecimals] = React.useState(2);

  // Calculate max volume for bar width scaling
  const maxBidVolume = Math.max(...bids.map((b) => b.total));
  const maxAskVolume = Math.max(...asks.map((a) => a.total));
  const maxVolume = Math.max(maxBidVolume, maxAskVolume);

  // Format price based on symbol
  const formatPrice = (price: number) => formatNumber(price, decimals);

  // Format size - show in native or USD
  const formatSize = (size: number, price: number) => {
    if (showNative) return formatNumber(size, 4);
    return `$${(size * price).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const embedded = hideTitle;

  return (
    <Card
      className={cn(
        "overflow-hidden",
        embedded && "h-full min-h-0 flex flex-col gap-0 rounded-none border-0 bg-transparent py-0 shadow-none",
        className,
      )}
    >
      {!hideTitle && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              Order Book
              <Badge variant="outline" className="text-[10px] font-mono">
                {symbol}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {venue}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Native/USD Toggle */}
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setShowNative(!showNative)}>
                <DollarSign className={cn("size-3 mr-1", showNative && "opacity-50")} />
                {showNative ? "Native" : "USD"}
              </Button>
              {/* Decimal selector */}
              <Select value={decimals.toString()} onValueChange={(v) => setDecimals(parseInt(v))}>
                <SelectTrigger className="h-6 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Spread indicator */}
          <div className="flex items-center justify-center gap-4 py-2 bg-muted/30 rounded mt-2">
            <span className="text-xs text-muted-foreground">
              Spread: <span className="font-mono text-foreground">{formatCurrency(spread, "USD", 2)}</span>
              <span className="text-muted-foreground ml-1">({formatNumber(spreadBps, 1)} bps)</span>
            </span>
            <span className="text-xs text-muted-foreground">
              Mid:{" "}
              <span className="font-mono text-foreground">
                ${midPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </span>
          </div>
        </CardHeader>
      )}

      <CardContent className={cn("pt-0 px-0", embedded && "flex min-h-0 flex-1 flex-col overflow-hidden pb-0")}>
        <div className={cn("grid grid-cols-2 gap-0", embedded && "min-h-0 flex-1 grid-rows-1 overflow-hidden")}>
          {/* Bids (left side - green) */}
          <div className="flex min-h-0 min-w-0 flex-col border-r border-border">
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/30 px-3 py-1.5 text-[10px] font-medium text-muted-foreground">
              <span>Size</span>
              <span>Bid Price</span>
            </div>
            <div className={cn("overflow-y-auto", embedded ? "min-h-0 flex-1" : "max-h-[400px]")}>
              {bids.map((bid, i) => {
                const barWidth = (bid.total / maxVolume) * 100;
                return (
                  <div
                    key={i}
                    className="relative flex items-center justify-between px-3 py-1 text-xs hover:bg-muted/30 cursor-pointer group"
                  >
                    {/* Volume bar (background) */}
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-emerald-500/10"
                      style={{ width: `${barWidth}%` }}
                    />

                    {/* Content */}
                    <span className="relative z-10 font-mono text-muted-foreground group-hover:text-foreground">
                      {formatSize(bid.size, bid.price)}
                    </span>
                    <span className="relative z-10 font-mono text-emerald-400 font-medium">
                      {formatPrice(bid.price)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Asks (right side - red) */}
          <div className="flex min-h-0 min-w-0 flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/30 px-3 py-1.5 text-[10px] font-medium text-muted-foreground">
              <span>Ask Price</span>
              <span>Size</span>
            </div>
            <div className={cn("overflow-y-auto", embedded ? "min-h-0 flex-1" : "max-h-[400px]")}>
              {asks.map((ask, i) => {
                const barWidth = (ask.total / maxVolume) * 100;
                return (
                  <div
                    key={i}
                    className="relative flex items-center justify-between px-3 py-1 text-xs hover:bg-muted/30 cursor-pointer group"
                  >
                    {/* Volume bar (background) */}
                    <div className="absolute left-0 top-0 bottom-0 bg-rose-500/10" style={{ width: `${barWidth}%` }} />

                    {/* Content */}
                    <span className="relative z-10 font-mono text-rose-400 font-medium">{formatPrice(ask.price)}</span>
                    <span className="relative z-10 font-mono text-muted-foreground group-hover:text-foreground">
                      {formatSize(ask.size, ask.price)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Last price indicator */}
        <div className="flex shrink-0 items-center justify-center border-t border-border py-2">
          <span className="text-sm font-mono font-medium">
            Last:{" "}
            <span className={cn(lastPrice >= midPrice ? "text-emerald-400" : "text-rose-400")}>
              $
              {lastPrice.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
