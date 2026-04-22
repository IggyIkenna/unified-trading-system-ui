"use client";

import { LiveFeedWidget, useLiveFeed } from "@/components/shared/live-feed-widget";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { Badge } from "@/components/ui/badge";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { CRYPTO_VENUES, TRADFI_VENUES } from "@/lib/config/services/markets.config";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import { useMarketsData } from "./markets-data-context";

export function MarketsLiveBookWidget(_props: WidgetComponentProps) {
  const { liveBookUpdates, assetClass, bookDepth, isLoading, isError, refetch } = useMarketsData();
  const rows = useLiveFeed(liveBookUpdates, 500);

  const venueLabel =
    assetClass === "crypto" ? CRYPTO_VENUES.join(", ") : assetClass === "tradfi" ? TRADFI_VENUES.join(", ") : "";

  const isDefi = assetClass === "defi";

  return (
    <LiveFeedWidget
      isLoading={isLoading}
      error={isError ? "Failed to load order book data" : null}
      onRetry={refetch}
      isEmpty={isDefi || rows.length === 0}
      emptyMessage={
        isDefi
          ? "Switch asset to Crypto or TradFi for the order book, or add the DeFi Pool Activity widget for AMM data."
          : "No book updates yet"
      }
      header={
        !isDefi ? (
          <div className="flex flex-wrap items-center gap-2 p-2">
            <Badge variant="outline" className="text-micro max-w-full truncate font-normal">
              {venueLabel}
            </Badge>
            <Badge variant="outline" className="text-micro">
              {liveBookUpdates.length} updates
            </Badge>
          </div>
        ) : undefined
      }
      footer={
        !isDefi ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-muted-foreground p-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-cyan-500/40 rounded shrink-0" /> Market Trade
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-yellow-500/40 rounded shrink-0" /> Own (*)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[var(--pnl-positive)]/40 rounded shrink-0" /> Updated Bid
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[var(--pnl-negative)]/40 rounded shrink-0" /> Updated Ask
            </span>
            <span className="ml-auto">Trade: B/S = side; last letter = aggressor</span>
          </div>
        ) : undefined
      }
    >
      <div className="border rounded-md overflow-hidden bg-black/20 mx-2 mb-2">
        <WidgetScroll axes="horizontal" className="min-h-0">
          <table className="w-full text-micro font-mono">
            <thead className="bg-muted/30 sticky top-0 z-[1]">
              <tr>
                <th className="text-left p-1.5 font-medium whitespace-nowrap">Exch Time</th>
                <th className="text-right p-1.5 font-medium whitespace-nowrap">Delay</th>
                <th className="text-left p-1.5 font-medium whitespace-nowrap">Venue</th>
                {Array.from({ length: bookDepth }, (_, i) => (
                  <th
                    key={`bid-h-${i}`}
                    className="text-right p-1.5 font-medium text-[var(--pnl-positive)] whitespace-nowrap"
                  >
                    Bid {bookDepth - i}
                  </th>
                ))}
                <th className="text-center p-1.5 font-medium whitespace-nowrap w-28 bg-muted/20">Trade</th>
                {Array.from({ length: bookDepth }, (_, i) => (
                  <th
                    key={`ask-h-${i}`}
                    className="text-left p-1.5 font-medium text-[var(--pnl-negative)] whitespace-nowrap"
                  >
                    Ask {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {rows.map((update) => (
                <tr
                  key={update.id}
                  className={cn(
                    update.updateType === "trade"
                      ? update.trade?.isOwn
                        ? "bg-yellow-500/15"
                        : "bg-cyan-500/10"
                      : "hover:bg-muted/20",
                  )}
                >
                  <td className="p-1.5 whitespace-nowrap">{new Date(update.exchangeTime).toLocaleTimeString()}</td>
                  <td
                    className={cn(
                      "p-1.5 text-right whitespace-nowrap",
                      update.delayMs > 10 ? "text-amber-500" : "text-green-500",
                    )}
                  >
                    {update.delayMs}ms
                  </td>
                  <td className="p-1.5 text-muted-foreground whitespace-nowrap">{update.venue}</td>
                  {update.updateType === "book" && update.bidLevels
                    ? [...update.bidLevels].reverse().map((level, i) => (
                        <td
                          key={`bid-${i}`}
                          className={cn(
                            "p-1.5 text-right whitespace-nowrap",
                            level.updated ? "bg-[var(--pnl-positive)]/25 font-bold" : "",
                          )}
                        >
                          <span className="text-[var(--pnl-positive)]">${level.price.toLocaleString()}</span>
                          <span className="text-muted-foreground ml-1">/{formatNumber(level.size, 1)}</span>
                        </td>
                      ))
                    : Array.from({ length: bookDepth }).map((_, i) => (
                        <td key={`bid-empty-${i}`} className="p-1.5 text-center text-muted-foreground/30">
                          -
                        </td>
                      ))}
                  <td className="p-1.5 text-center whitespace-nowrap">
                    {update.trade ? (
                      <div
                        className={cn(
                          "flex items-center justify-center gap-0.5 flex-wrap",
                          update.trade.isOwn ? "text-yellow-400" : "text-cyan-400",
                        )}
                      >
                        <span
                          className={
                            update.trade.side === "buy" ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"
                          }
                        >
                          {update.trade.side === "buy" ? "B" : "S"}
                        </span>
                        <span className="font-bold">${update.trade.price.toLocaleString()}</span>
                        <span className="text-muted-foreground">x{formatNumber(update.trade.size, 2)}</span>
                        <span
                          className={cn(
                            "text-nano",
                            update.trade.aggressor === "buyer"
                              ? "text-[var(--pnl-positive)]"
                              : "text-[var(--pnl-negative)]",
                          )}
                        >
                          {update.trade.aggressor === "buyer" ? "B" : "S"}
                        </span>
                        {update.trade.isOwn && <span className="text-yellow-400 font-bold">*</span>}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/30">-</span>
                    )}
                  </td>
                  {update.updateType === "book" && update.askLevels
                    ? update.askLevels.map((level, i) => (
                        <td
                          key={`ask-${i}`}
                          className={cn(
                            "p-1.5 text-left whitespace-nowrap",
                            level.updated ? "bg-[var(--pnl-negative)]/25 font-bold" : "",
                          )}
                        >
                          <span className="text-[var(--pnl-negative)]">${level.price.toLocaleString()}</span>
                          <span className="text-muted-foreground ml-1">/{formatNumber(level.size, 1)}</span>
                        </td>
                      ))
                    : Array.from({ length: bookDepth }).map((_, i) => (
                        <td key={`ask-empty-${i}`} className="p-1.5 text-center text-muted-foreground/30">
                          -
                        </td>
                      ))}
                </tr>
              ))}
            </tbody>
          </table>
        </WidgetScroll>
      </div>
    </LiveFeedWidget>
  );
}
