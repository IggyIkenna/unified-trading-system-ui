"use client";

import type { WidgetComponentProps } from "../widget-registry";
import { OrderBook } from "@/components/trading/order-book";
import { useTerminalData } from "./terminal-data-context";

export function OrderBookWidget(_props: WidgetComponentProps) {
  const { selectedInstrument, bids, asks, livePrice, spread, spreadBps } = useTerminalData();

  return (
    <div className="h-full overflow-hidden">
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
