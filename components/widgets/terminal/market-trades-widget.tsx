"use client";

import { LiveFeedWidget, useLiveFeed } from "@/components/shared/live-feed-widget";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import * as React from "react";
import type { WidgetComponentProps } from "../widget-registry";
import { useTerminalData } from "./terminal-data-context";

export function MarketTradesWidget(_props: WidgetComponentProps) {
  const { recentTrades, ownTrades } = useTerminalData();
  const [tab, setTab] = React.useState<"market" | "own">("market");

  const allTrades = tab === "market" ? recentTrades : ownTrades;
  const trades = useLiveFeed(allTrades as Array<Record<string, unknown>>, 500);

  return (
    <LiveFeedWidget
      isEmpty={trades.length === 0}
      emptyMessage="No trades yet"
      header={
        <div className="px-3 pt-2 pb-1">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "market" | "own")}>
            <TabsList className="h-7">
              <TabsTrigger value="market" className="text-[10px] h-5 px-2">
                All
              </TabsTrigger>
              <TabsTrigger value="own" className="text-[10px] h-5 px-2">
                Own Trades
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      }
    >
      <div className="px-3 pb-2">
        <div className="grid grid-cols-4 gap-x-2 text-[9px] text-muted-foreground py-1 border-b border-border font-medium sticky top-0 bg-card">
          <span>Time</span>
          <span className="text-right">Price</span>
          <span className="text-right">Size</span>
          <span className="text-right">Side</span>
        </div>
        {trades.map((t, i) => (
          <div key={i} className="grid grid-cols-4 gap-x-2 text-[10px] py-0.5 border-b border-border/30 font-mono">
            <span className="text-muted-foreground">{String(t.time ?? "")}</span>
            <span className={cn("text-right", String(t.side) === "buy" ? "text-emerald-400" : "text-rose-400")}>
              {String(t.price ?? "")}
            </span>
            <span className="text-right">{String(t.size ?? "")}</span>
            <span className="text-right">
              <Badge
                variant="outline"
                className={cn(
                  "text-[8px] px-0.5 h-3",
                  String(t.side) === "buy"
                    ? "text-emerald-400 border-emerald-400/30"
                    : "text-rose-400 border-rose-400/30",
                )}
              >
                {String(t.side ?? "").toUpperCase()}
              </Badge>
            </span>
          </div>
        ))}
      </div>
    </LiveFeedWidget>
  );
}
