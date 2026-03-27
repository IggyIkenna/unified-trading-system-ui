"use client";

import * as React from "react";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, FileText, LayoutGrid, LineChart, Radio } from "lucide-react";
import { useMarketsData } from "./markets-data-context";

export function MarketsControlsWidget(_props: WidgetComponentProps) {
  const {
    viewMode,
    setViewMode,
    dataMode,
    setDataMode,
    dateRange,
    setDateRange,
    orderFlowView,
    setOrderFlowView,
    assetClass,
    setAssetClass,
    orderFlowRange,
    setOrderFlowRange,
    bookDepth,
    setBookDepth,
  } = useMarketsData();

  return (
    <div className="flex flex-col gap-3 p-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={viewMode === "cross-section" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 gap-1.5"
              onClick={() => setViewMode("cross-section")}
            >
              <LayoutGrid className="size-3.5" />
              Cross-Section
            </Button>
            <Button
              variant={viewMode === "time-series" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 gap-1.5"
              onClick={() => setViewMode("time-series")}
            >
              <LineChart className="size-3.5" />
              Time Series
            </Button>
          </div>
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={dataMode === "live" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 gap-1.5"
              onClick={() => setDataMode("live")}
            >
              <Radio className="size-3.5" />
              Live
            </Button>
            <Button
              variant={dataMode === "batch" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 gap-1.5"
              onClick={() => setDataMode("batch")}
            >
              <Database className="size-3.5" />
              Batch
            </Button>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="wtd">Week to Date</SelectItem>
              <SelectItem value="mtd">Month to Date</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
          <FileText className="size-3.5" />
          Generate Report
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 pt-2">
        <div className="flex flex-wrap gap-1.5">
          {(["orders", "book", "own"] as const).map((view) => (
            <Button
              key={view}
              variant={orderFlowView === view ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOrderFlowView(view)}
            >
              {view === "orders" ? "Market Orders" : view === "book" ? "Live Book" : "My Orders"}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Asset</span>
            <Select value={assetClass} onValueChange={(v) => setAssetClass(v as typeof assetClass)}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="crypto">Crypto</SelectItem>
                <SelectItem value="tradfi">TradFi</SelectItem>
                <SelectItem value="defi">DeFi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Range</span>
            <Select value={orderFlowRange} onValueChange={(v) => setOrderFlowRange(v as "1d" | "1w" | "1m")}>
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">1 Day</SelectItem>
                <SelectItem value="1w">1 Week</SelectItem>
                <SelectItem value="1m">1 Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {orderFlowView === "book" && assetClass !== "defi" && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">Depth</span>
              <Select value={bookDepth.toString()} onValueChange={(v) => setBookDepth(parseInt(v, 10))}>
                <SelectTrigger className="w-[72px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
