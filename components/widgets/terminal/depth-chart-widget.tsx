"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { DepthChart } from "@/components/trading/order-book";
import { useTerminalData } from "./terminal-data-context";

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
