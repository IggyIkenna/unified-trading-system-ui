"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mock01 } from "@/lib/mocks/generators/deterministic";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import { DollarSign } from "lucide-react";
import { generateMockOrderBook } from "@/lib/mocks/generators/order-book";
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

// Depth chart visualization - shows cumulative volume at each price level
interface DepthChartProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  midPrice: number;
  symbol: string;
  height?: number;
  className?: string;
}

export function DepthChart({ bids, asks, midPrice, symbol, height = 200, className }: DepthChartProps) {
  // Max cumulative volume (at the deepest levels)
  const maxBidVolume = bids[bids.length - 1]?.total || 0;
  const maxAskVolume = asks[asks.length - 1]?.total || 0;
  const maxVolume = Math.max(maxBidVolume, maxAskVolume) * 1.1; // Add 10% padding

  // Price range for x-axis (show ~0.1% on each side for BTC)
  const priceRange = midPrice * 0.001; // 0.1% = ~$67 for BTC at $67k
  const minPrice = bids[bids.length - 1]?.price || midPrice - priceRange;
  const maxPrice = asks[asks.length - 1]?.price || midPrice + priceRange;
  const totalPriceRange = maxPrice - minPrice;

  // Convert price to x position (0-100)
  const priceToX = (price: number) => ((price - minPrice) / totalPriceRange) * 100;

  // Bids: cumulative volume grows as price decreases (going left from mid)
  // Path starts at mid (0 volume) and steps down-left to each bid level
  const bidPoints: string[] = [];
  // Start at the best bid with the cumulative volume at that level
  bidPoints.push(`M ${priceToX(bids[0]?.price || midPrice)} ${100 - (bids[0]?.total / maxVolume) * 90}`);

  for (let i = 1; i < bids.length; i++) {
    const x = priceToX(bids[i].price);
    const y = 100 - (bids[i].total / maxVolume) * 90; // cumulative grows, y decreases (up)
    // Step function: horizontal then vertical
    const prevX = priceToX(bids[i - 1].price);
    const prevY = 100 - (bids[i - 1].total / maxVolume) * 90;
    bidPoints.push(`L ${x} ${prevY}`); // horizontal to new price
    bidPoints.push(`L ${x} ${y}`); // vertical to new cumulative
  }
  // Close the path to the bottom
  const lastBidX = priceToX(bids[bids.length - 1]?.price || minPrice);
  bidPoints.push(`L ${lastBidX} 100`);
  bidPoints.push(`L ${priceToX(bids[0]?.price || midPrice)} 100`);
  bidPoints.push("Z");

  // Asks: cumulative volume grows as price increases (going right from mid)
  const askPoints: string[] = [];
  askPoints.push(`M ${priceToX(asks[0]?.price || midPrice)} ${100 - (asks[0]?.total / maxVolume) * 90}`);

  for (let i = 1; i < asks.length; i++) {
    const x = priceToX(asks[i].price);
    const y = 100 - (asks[i].total / maxVolume) * 90;
    const prevX = priceToX(asks[i - 1].price);
    const prevY = 100 - (asks[i - 1].total / maxVolume) * 90;
    askPoints.push(`L ${x} ${prevY}`);
    askPoints.push(`L ${x} ${y}`);
  }
  const lastAskX = priceToX(asks[asks.length - 1]?.price || maxPrice);
  askPoints.push(`L ${lastAskX} 100`);
  askPoints.push(`L ${priceToX(asks[0]?.price || midPrice)} 100`);
  askPoints.push("Z");

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Market Depth</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }}>
          {/* Grid lines */}
          <line
            x1={priceToX(midPrice)}
            y1="0"
            x2={priceToX(midPrice)}
            y2="100"
            stroke="var(--border)"
            strokeWidth="0.5"
          />
          <line x1="0" y1="50" x2="100" y2="50" stroke="var(--border)" strokeWidth="0.25" strokeDasharray="2" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="var(--border)" strokeWidth="0.25" strokeDasharray="2" />
          <line x1="0" y1="25" x2="100" y2="25" stroke="var(--border)" strokeWidth="0.25" strokeDasharray="2" />

          {/* Bid area (green) - cumulative volume at each price */}
          <path d={bidPoints.join(" ")} fill="rgba(16, 185, 129, 0.3)" stroke="rgb(16, 185, 129)" strokeWidth="1.5" />

          {/* Ask area (red) - cumulative volume at each price */}
          <path d={askPoints.join(" ")} fill="rgba(239, 68, 68, 0.3)" stroke="rgb(239, 68, 68)" strokeWidth="1.5" />
        </svg>

        {/* Price labels */}
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>${minPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          <span className="font-medium text-foreground">
            ${midPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span>${maxPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Combined order book with depth view
interface OrderBookWithDepthProps {
  symbol: string;
  venue?: string;
  midPrice?: number;
  className?: string;
}

export function OrderBookWithDepth({
  symbol = "BTC/USDT",
  venue = "Binance",
  midPrice: initialMidPrice,
  className,
}: OrderBookWithDepthProps) {
  // Default mid prices by symbol
  const defaultMidPrices: Record<string, number> = {
    "BTC/USDT": 67234.5,
    "ETH/USDT": 3456.78,
    "SOL/USDT": 156.42,
    BTC: 67234.5,
    ETH: 3456.78,
    SOL: 156.42,
  };

  const midPrice = initialMidPrice || defaultMidPrices[symbol] || 100;
  const { bids, asks } = React.useMemo(() => generateMockOrderBook(symbol, midPrice), [symbol, midPrice]);

  const spread = asks[0]?.price - bids[0]?.price || 0;
  const spreadBps = (spread / midPrice) * 10000;
  const symbolSalt = symbol.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const lastPrice = midPrice + (mock01(0, symbolSalt) - 0.5) * spread;

  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-4", className)}>
      <OrderBook
        symbol={symbol}
        bids={bids}
        asks={asks}
        lastPrice={lastPrice}
        spread={spread}
        spreadBps={spreadBps}
        midPrice={midPrice}
        venue={venue}
      />
      <DepthChart bids={bids} asks={asks} midPrice={midPrice} symbol={symbol} height={400} />
    </div>
  );
}

export { generateMockOrderBook } from "@/lib/mocks/generators/order-book";
