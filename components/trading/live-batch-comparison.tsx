"use client";

import * as React from "react";
import { StatusDot } from "@/components/trading/status-badge";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import {
  Radio,
  Database,
  SplitSquareVertical,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowLeftRight,
  Minus,
} from "lucide-react";
import type { TimeSeriesPoint } from "@/lib/mocks/fixtures/trading-data";
import { formatPercent } from "@/lib/utils/formatters";

type ViewMode = "live" | "batch" | "split" | "delta";

interface LiveBatchComparisonProps {
  title: string;
  liveData: TimeSeriesPoint[];
  batchData: TimeSeriesPoint[];
  deltaData?: TimeSeriesPoint[];
  valueFormatter?: (value: number) => string;
  height?: number;
  className?: string;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function LiveBatchComparison({
  title,
  liveData,
  batchData,
  deltaData,
  valueFormatter = (v) => v.toLocaleString(),
  height = 250,
  className,
  selectedDate,
  onDateChange,
}: LiveBatchComparisonProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>("split");

  // Calculate latest values
  const latestLive = liveData[liveData.length - 1]?.value ?? 0;
  const latestBatch = batchData[batchData.length - 1]?.value ?? 0;
  const latestDelta = latestLive - latestBatch;
  const deltaPercent = latestBatch !== 0 ? (latestDelta / Math.abs(latestBatch)) * 100 : 0;

  // Combine data for charts
  const combinedData = liveData.map((point, i) => ({
    timestamp: point.timestamp,
    live: point.value,
    batch: batchData[i]?.value ?? 0,
    delta: point.value - (batchData[i]?.value ?? 0),
  }));

  // Calculate Y-axis domain with auto-adjustment (not starting at 0)
  const getYDomain = (data: number[]): [number, number] => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const padding = range * 0.1;
    return [min - padding, max + padding];
  };

  const liveValues = liveData.map((d) => d.value);
  const batchValues = batchData.map((d) => d.value);
  const allValues = [...liveValues, ...batchValues];
  const deltaValues = combinedData.map((d) => d.delta);

  const renderChart = (data: TimeSeriesPoint[], color: string, label: string, yDomain?: [number, number]) => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="timestamp"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={valueFormatter}
          width={70}
          domain={yDomain || getYDomain(data.map((d) => d.value))}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            fontSize: "12px",
          }}
          formatter={(value: number) => [valueFormatter(value), label]}
          labelFormatter={(label) => `Time: ${label}`}
        />
        <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
        <Area
          type="monotone"
          dataKey="value"
          name={label}
          stroke={color}
          strokeWidth={2}
          fill={`url(#gradient-${label})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderSplitChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={combinedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradient-live" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--status-live)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--status-live)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradient-batch" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="timestamp"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={valueFormatter}
          width={70}
          domain={getYDomain(allValues)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            fontSize: "12px",
          }}
          formatter={(value: number, name: string) => [valueFormatter(value), name === "live" ? "Live" : "Batch"]}
          labelFormatter={(label) => `Time: ${label}`}
        />
        <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
        <Area
          type="monotone"
          dataKey="live"
          name="live"
          stroke="var(--status-live)"
          strokeWidth={2}
          fill="url(#gradient-live)"
        />
        <Area
          type="monotone"
          dataKey="batch"
          name="batch"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#gradient-batch)"
          strokeDasharray="5 5"
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderDeltaChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={combinedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradient-delta-pos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--pnl-positive)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--pnl-positive)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradient-delta-neg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--pnl-negative)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--pnl-negative)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="timestamp"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={valueFormatter}
          width={70}
          domain={getYDomain(deltaValues)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            fontSize: "12px",
          }}
          formatter={(value: number) => [valueFormatter(value), "Live - Batch"]}
          labelFormatter={(label) => `Time: ${label}`}
        />
        <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeWidth={1} />
        <Area
          type="monotone"
          dataKey="delta"
          name="delta"
          stroke={latestDelta >= 0 ? "var(--pnl-positive)" : "var(--pnl-negative)"}
          strokeWidth={2}
          fill={latestDelta >= 0 ? "url(#gradient-delta-pos)" : "url(#gradient-delta-neg)"}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">{title}</CardTitle>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <StatusDot status="live" className="size-2" />
                <span className="text-muted-foreground">Live</span>
                <span className="font-medium">{valueFormatter(latestLive)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <StatusDot status="batch" className="size-2" />
                <span className="text-muted-foreground">Batch</span>
                <span className="font-medium">{valueFormatter(latestBatch)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowLeftRight className="size-3 text-muted-foreground" />
                <span className="text-muted-foreground">Delta</span>
                <span
                  className={cn(
                    "font-medium",
                    latestDelta >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]",
                  )}
                >
                  {latestDelta >= 0 ? "+" : ""}
                  {valueFormatter(latestDelta)}
                  <span className="text-muted-foreground ml-1">
                    ({deltaPercent >= 0 ? "+" : ""}
                    {formatPercent(deltaPercent, 1)})
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Date Picker for Batch */}
            <div className="flex items-center gap-1.5 px-2 py-1 border border-border rounded-md">
              <Calendar className="size-3 text-muted-foreground" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                max={new Date(Date.now() - 86400000).toISOString().split("T")[0]} // Yesterday max
                className="bg-transparent text-xs border-none focus:outline-none w-28"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode("live")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs transition-colors",
                  viewMode === "live"
                    ? "bg-[var(--status-live)]/10 text-[var(--status-live)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Radio className="size-3" />
                Live
              </button>
              <button
                onClick={() => setViewMode("batch")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs transition-colors",
                  viewMode === "batch" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Database className="size-3" />
                Batch
              </button>
              <button
                onClick={() => setViewMode("split")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs transition-colors",
                  viewMode === "split" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <SplitSquareVertical className="size-3" />
                Split
              </button>
              <button
                onClick={() => setViewMode("delta")}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs transition-colors",
                  viewMode === "delta" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Minus className="size-3" />
                Delta
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {viewMode === "live" && renderChart(liveData, "var(--status-live)", "Live")}
        {viewMode === "batch" && renderChart(batchData, "var(--primary)", "Batch")}
        {viewMode === "split" && renderSplitChart()}
        {viewMode === "delta" && renderDeltaChart()}
      </CardContent>
    </Card>
  );
}

// Compact indicator showing delta status
export function LiveBatchDeltaIndicator({
  liveValue,
  batchValue,
  formatter = (v) => v.toLocaleString(),
  className,
}: {
  liveValue: number;
  batchValue: number;
  formatter?: (value: number) => string;
  className?: string;
}) {
  const delta = liveValue - batchValue;
  const percent = batchValue !== 0 ? (delta / Math.abs(batchValue)) * 100 : 0;

  return (
    <div className={cn("flex items-center gap-2 text-xs", className)}>
      <div className="flex items-center gap-1">
        <Radio className="size-3 text-[var(--status-live)]" />
        <span>{formatter(liveValue)}</span>
      </div>
      <span className="text-muted-foreground">vs</span>
      <div className="flex items-center gap-1">
        <Database className="size-3 text-primary" />
        <span>{formatter(batchValue)}</span>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] px-1.5",
          delta >= 0
            ? "border-[var(--pnl-positive)] text-[var(--pnl-positive)]"
            : "border-[var(--pnl-negative)] text-[var(--pnl-negative)]",
        )}
      >
        {delta >= 0 ? "+" : ""}
        {formatPercent(percent, 1)}
      </Badge>
    </div>
  );
}
