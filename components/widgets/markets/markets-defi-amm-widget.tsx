"use client";

import { LiveFeedWidget, useLiveFeed } from "@/components/shared/live-feed-widget";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { formatNumber } from "@/lib/utils/formatters";
import { AlertTriangle } from "lucide-react";
import { useMarketsData } from "./markets-data-context";

export function MarketsDefiAmmWidget(_props: WidgetComponentProps) {
  const { orderFlowData, assetClass, isLoading, isError, refetch } = useMarketsData();
  const rows = useLiveFeed(orderFlowData, 500);

  const isNotDefi = assetClass !== "defi";

  return (
    <LiveFeedWidget
      isLoading={isLoading}
      error={isError ? "Failed to load AMM activity" : null}
      onRetry={refetch}
      isEmpty={isNotDefi || rows.length === 0}
      emptyMessage={
        isNotDefi
          ? "Set asset class to DeFi in Markets Controls to populate pool activity (mock)."
          : "No AMM activity yet"
      }
      header={
        !isNotDefi ? (
          <Card className="border-amber-500/30 bg-amber-500/5 mx-2 mt-2">
            <CardContent className="py-3 px-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium">DeFi market structure</p>
                  <p className="text-micro text-muted-foreground mt-0.5">
                    AMM pricing: swap and LP activity below, not a classic limit order book.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : undefined
      }
      footer={
        !isNotDefi ? (
          <p className="text-micro text-muted-foreground px-2 pb-2">
            Mock DeFi activity: replace with `useLiveBook` / venue feeds when wired.
          </p>
        ) : undefined
      }
    >
      <div className="border rounded-md overflow-hidden mx-2 mb-2">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="text-left p-2 font-medium text-xs">Time</th>
              <th className="text-left p-2 font-medium text-xs">Pool</th>
              <th className="text-left p-2 font-medium text-xs">Action</th>
              <th className="text-right p-2 font-medium text-xs">Amount In</th>
              <th className="text-right p-2 font-medium text-xs">Amount Out</th>
              <th className="text-right p-2 font-medium text-xs">Price impact</th>
              <th className="text-right p-2 font-medium text-xs">Gas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((order) => (
              <tr
                key={order.id}
                className={`border-t border-border hover:bg-muted/30 ${order.isOwn ? "bg-yellow-500/10" : ""}`}
              >
                <td className="p-2 font-mono text-micro">{new Date(order.exchangeTime).toLocaleTimeString()}</td>
                <td className="p-2 text-micro">{order.venue}</td>
                <td className="p-2">
                  <Badge variant="outline" className="text-micro">
                    {order.type === "trade" ? "Swap" : "LP"}
                  </Badge>
                </td>
                <td className="p-2 text-right font-mono text-micro">{formatNumber(order.size, 4)} ETH</td>
                <td className="p-2 text-right font-mono text-micro">${order.price.toLocaleString()}</td>
                <td className="p-2 text-right font-mono text-micro text-muted-foreground">0.25%</td>
                <td className="p-2 text-right font-mono text-micro text-muted-foreground">35 gwei</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LiveFeedWidget>
  );
}
