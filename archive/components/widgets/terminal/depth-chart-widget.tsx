// ARCHIVED 2026-04-20 — removed from terminal widget registry.
// Original locations:
//   components/widgets/terminal/depth-chart-widget.tsx
//   components/trading/order-book.tsx (inline DepthChart dependency, lines 200-301)
// Inlined here so the archive is self-contained and does not require the now-removed
// DepthChart export in components/trading/order-book.tsx.
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OrderBookLevel } from "@/components/trading/order-book";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useTerminalData } from "@/components/widgets/terminal/terminal-data-context";

interface DepthChartProps {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  midPrice: number;
  symbol: string;
  height?: number;
  className?: string;
}

function DepthChart({ bids, asks, midPrice, height = 200, className }: DepthChartProps) {
  const maxBidVolume = bids[bids.length - 1]?.total || 0;
  const maxAskVolume = asks[asks.length - 1]?.total || 0;
  const maxVolume = Math.max(maxBidVolume, maxAskVolume) * 1.1;

  const priceRange = midPrice * 0.001;
  const minPrice = bids[bids.length - 1]?.price || midPrice - priceRange;
  const maxPrice = asks[asks.length - 1]?.price || midPrice + priceRange;
  const totalPriceRange = maxPrice - minPrice;

  const priceToX = (price: number) => ((price - minPrice) / totalPriceRange) * 100;

  const bidPoints: string[] = [];
  bidPoints.push(`M ${priceToX(bids[0]?.price || midPrice)} ${100 - (bids[0]?.total / maxVolume) * 90}`);
  for (let i = 1; i < bids.length; i++) {
    const x = priceToX(bids[i].price);
    const y = 100 - (bids[i].total / maxVolume) * 90;
    const prevY = 100 - (bids[i - 1].total / maxVolume) * 90;
    bidPoints.push(`L ${x} ${prevY}`);
    bidPoints.push(`L ${x} ${y}`);
  }
  const lastBidX = priceToX(bids[bids.length - 1]?.price || minPrice);
  bidPoints.push(`L ${lastBidX} 100`);
  bidPoints.push(`L ${priceToX(bids[0]?.price || midPrice)} 100`);
  bidPoints.push("Z");

  const askPoints: string[] = [];
  askPoints.push(`M ${priceToX(asks[0]?.price || midPrice)} ${100 - (asks[0]?.total / maxVolume) * 90}`);
  for (let i = 1; i < asks.length; i++) {
    const x = priceToX(asks[i].price);
    const y = 100 - (asks[i].total / maxVolume) * 90;
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
          <path d={bidPoints.join(" ")} fill="rgba(16, 185, 129, 0.3)" stroke="rgb(16, 185, 129)" strokeWidth="1.5" />
          <path d={askPoints.join(" ")} fill="rgba(239, 68, 68, 0.3)" stroke="rgb(239, 68, 68)" strokeWidth="1.5" />
        </svg>
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

export function DepthChartWidget(_props: WidgetComponentProps) {
  const { selectedInstrument, bids, asks, livePrice, isContextComplete } = useTerminalData();

  if (!isContextComplete) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground animate-pulse">
        Loading depth data…
      </div>
    );
  }

  if (bids.length === 0 && asks.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No depth data</div>;
  }

  return (
    <div className="absolute inset-0 overflow-auto p-2">
      <DepthChart bids={bids} asks={asks} midPrice={livePrice} symbol={selectedInstrument.symbol} />
    </div>
  );
}
