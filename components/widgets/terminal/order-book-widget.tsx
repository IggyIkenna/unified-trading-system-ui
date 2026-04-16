"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { OrderBook } from "@/components/trading/order-book";
import { useTerminalData } from "./terminal-data-context";

export function OrderBookWidget(_props: WidgetComponentProps) {
  const { selectedInstrument, bids, asks, livePrice, spread, spreadBps } = useTerminalData();

  if (bids.length === 0 && asks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No order book data</div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <OrderBook
        symbol={selectedInstrument.symbol}
        bids={bids}
        asks={asks}
        lastPrice={livePrice}
        spread={spread}
        spreadBps={spreadBps}
        midPrice={livePrice}
        venue={selectedInstrument.venue}
        hideTitle
      />
    </div>
  );
}
