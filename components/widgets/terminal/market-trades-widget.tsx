"use client";

import { LiveFeedWidget, useLiveFeed } from "@/components/shared/live-feed-widget";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import * as React from "react";
import type { WidgetComponentProps } from "../widget-registry";
import { useTerminalData } from "./terminal-data-context";

type SideFilter = "all" | "buy" | "sell";

// Mock-era heuristic: pick a decimal scale from the price magnitude.
// Live WS feed will carry venue-native precision — remove this when we switch.
function formatPrice(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10) return formatNumber(value, 2);
  if (abs >= 0.01) return formatNumber(value, 5);
  return formatNumber(value, 8);
}

export function MarketTradesWidget(_props: WidgetComponentProps) {
  const { recentTrades, ownTrades, isLoading, error } = useTerminalData();
  const [tab, setTab] = React.useState<"market" | "own">("market");
  const [sideFilter, setSideFilter] = React.useState<SideFilter>("all");
  const [sizeMin, setSizeMin] = React.useState("");
  const [sizeMax, setSizeMax] = React.useState("");

  const allTrades = tab === "market" ? recentTrades : ownTrades;

  const filteredTrades = React.useMemo(() => {
    const parseBound = (s: string) => {
      if (s.trim() === "") return null;
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    };
    const sMin = parseBound(sizeMin);
    const sMax = parseBound(sizeMax);
    return allTrades.filter((t) => {
      if (sideFilter !== "all" && String(t.side) !== sideFilter) return false;
      const size = Number(t.size);
      if (Number.isFinite(size)) {
        if (sMin !== null && size < sMin) return false;
        if (sMax !== null && size > sMax) return false;
      }
      return true;
    });
  }, [allTrades, sideFilter, sizeMin, sizeMax]);

  const trades = useLiveFeed(filteredTrades as Array<Record<string, unknown>>, 500);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="animate-pulse text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-rose-400">{error}</span>
      </div>
    );
  }

  const sideOptions: Array<{ value: SideFilter; label: string; Icon: typeof Minus }> = [
    { value: "all", label: "All sides", Icon: Minus },
    { value: "buy", label: "Buys only", Icon: ArrowUp },
    { value: "sell", label: "Sells only", Icon: ArrowDown },
  ];

  return (
    <LiveFeedWidget
      isEmpty={trades.length === 0}
      emptyMessage="No trades yet"
      header={
        <div className="flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden px-2 pt-2 pb-1 text-micro">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "market" | "own")}>
            <TabsList className="h-6 p-0.5">
              <TabsTrigger value="market" className="text-micro h-5 px-1.5">
                All
              </TabsTrigger>
              <TabsTrigger value="own" className="text-micro h-5 px-1.5">
                Own
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex h-6 items-center rounded-md border border-border">
            {sideOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSideFilter(opt.value)}
                aria-label={opt.label}
                aria-pressed={sideFilter === opt.value}
                className={cn(
                  "flex h-full w-5 items-center justify-center rounded-sm transition-colors",
                  sideFilter === opt.value
                    ? opt.value === "buy"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : opt.value === "sell"
                        ? "bg-rose-500/15 text-rose-400"
                        : "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <opt.Icon className="size-3" />
              </button>
            ))}
          </div>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="min"
            aria-label="Minimum size"
            value={sizeMin}
            onChange={(e) => setSizeMin(e.target.value)}
            className="h-6 w-12 min-w-0 px-1 text-nano shadow-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
          />
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="max"
            aria-label="Maximum size"
            value={sizeMax}
            onChange={(e) => setSizeMax(e.target.value)}
            className="h-6 w-12 min-w-0 px-1 text-nano shadow-none [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
      }
    >
      <div className="px-2 pb-2">
        <div className="flex justify-evenly text-nano text-muted-foreground py-1 border-b border-border font-medium sticky top-0 bg-card">
          <span>Time</span>
          <span>Price</span>
          <span>Size</span>
        </div>
        {trades.map((t, i) => {
          const priceNum = Number(t.price);
          const sizeNum = Number(t.size);
          return (
            <div key={i} className="flex justify-evenly text-micro py-0.5 border-b border-border/30 font-mono">
              <span className="text-muted-foreground">{String(t.time ?? "")}</span>
              <span className={cn(String(t.side) === "buy" ? "text-emerald-400" : "text-rose-400")}>
                {Number.isFinite(priceNum) ? formatPrice(priceNum) : String(t.price ?? "")}
              </span>
              <span>{Number.isFinite(sizeNum) ? formatNumber(sizeNum, 3) : String(t.size ?? "")}</span>
            </div>
          );
        })}
      </div>
    </LiveFeedWidget>
  );
}
