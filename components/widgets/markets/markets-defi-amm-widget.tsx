"use client";

import * as React from "react";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useMarketsData } from "./markets-data-context";

export function MarketsDefiAmmWidget(_props: WidgetComponentProps) {
  const { orderFlowData, assetClass } = useMarketsData();
  const rows = React.useMemo(() => orderFlowData.slice(0, 50), [orderFlowData]);

  if (assetClass !== "defi") {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Set asset class to DeFi in Markets Controls to populate pool activity (mock).
      </div>
    );
  }

  return (
    <div className="p-2 space-y-3">
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="py-3 px-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium">DeFi market structure</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                AMM pricing — swap and LP activity below, not a classic limit order book.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="border rounded-md overflow-hidden">
        <div className="max-h-[min(400px,45vh)] overflow-auto">
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
                  <td className="p-2 font-mono text-[10px]">{new Date(order.exchangeTime).toLocaleTimeString()}</td>
                  <td className="p-2 text-[10px]">{order.venue}</td>
                  <td className="p-2">
                    <Badge variant="outline" className="text-[10px]">
                      {order.type === "trade" ? "Swap" : "LP"}
                    </Badge>
                  </td>
                  <td className="p-2 text-right font-mono text-[10px]">{order.size.toFixed(4)} ETH</td>
                  <td className="p-2 text-right font-mono text-[10px]">${order.price.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono text-[10px] text-muted-foreground">0.25%</td>
                  <td className="p-2 text-right font-mono text-[10px] text-muted-foreground">35 gwei</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Mock DeFi activity — replace with `useLiveBook` / venue feeds when wired.
      </p>
    </div>
  );
}
