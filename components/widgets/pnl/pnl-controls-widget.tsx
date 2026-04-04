"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { Database, LayoutGrid, LineChart, Radio } from "lucide-react";
import { usePnLData } from "./pnl-data-context";
import { SHARE_CLASSES, SHARE_CLASS_LABELS, type ShareClass } from "@/lib/types/defi";

export function PnlControlsWidget(_props: WidgetComponentProps) {
  const { viewMode, setViewMode, dataMode, setDataMode, dateRange, setDateRange, groupBy, setGroupBy, shareClass, setShareClass } = usePnLData();

  return (
    <div className="flex flex-col gap-2 h-full min-h-0 p-2">
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

      <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-2">
        <span className="text-xs text-muted-foreground shrink-0">Group By:</span>
        <div className="flex flex-wrap gap-1">
          {["all", "client", "strategy", "venue", "asset"].map((g) => (
            <Button
              key={g}
              variant={groupBy === g ? "secondary" : "ghost"}
              size="sm"
              className="h-7 capitalize text-xs"
              onClick={() => setGroupBy(g)}
            >
              {g === "all" ? "Total" : g}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Share class selector — denominated currency for P&L display */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Currency:</span>
            <Select value={shareClass} onValueChange={(v) => setShareClass(v as ShareClass | "all")}>
              <SelectTrigger className="h-7 w-[120px] text-[10px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px]">All (USD)</SelectItem>
                {SHARE_CLASSES.map((sc) => (
                  <SelectItem key={sc} value={sc} className="text-[10px] font-mono">
                    {sc} — {SHARE_CLASS_LABELS[sc]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge variant={dataMode === "live" ? "default" : "secondary"} className="gap-1 text-[10px]">
            {dataMode === "live" ? <Radio className="size-3" /> : <Database className="size-3" />}
            {dataMode === "live" ? "Live Data" : "Batch Snapshot"}
          </Badge>
        </div>
      </div>
    </div>
  );
}
