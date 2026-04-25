"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Radio, Database } from "lucide-react";
import type { TimeSeriesPoint } from "@/lib/mocks/fixtures/trading-data";
import { formatPercent } from "@/lib/utils/formatters";

export type ViewMode = "live" | "batch" | "split" | "delta";

interface LiveBatchComparisonProps {
  liveData: TimeSeriesPoint[];
  batchData: TimeSeriesPoint[];
  valueFormatter?: (value: number) => string;
  height?: number | string;
  className?: string;
  viewMode: ViewMode;
  /**
   * Optional id used to force Recharts to re-run animations when switching
   * between datasets that produce a visually identical SVG path (e.g. P&L vs
   * NAV in this app, where NAV = baseCapital + P&L → same shape, YAxis
   * auto-rescales). Pass any value that changes per dataset.
   */
  animationId?: string | number;
}

export function LiveBatchComparison({
  liveData,
  batchData,
  valueFormatter = (v) => v.toLocaleString(),
  height = "100%",
  className,
  viewMode,
  animationId,
}: LiveBatchComparisonProps) {
  const latestLive = liveData[liveData.length - 1]?.value ?? 0;
  const latestBatch = batchData[batchData.length - 1]?.value ?? 0;
  const latestDelta = latestLive - latestBatch;

  // Recharts' `animationId` prop wants a number. Hash the caller-supplied
  // identifier to a stable integer so different datasets re-trigger animation.
  const animId = React.useMemo(() => {
    if (animationId == null) return 0;
    const s = String(animationId);
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
  }, [animationId]);

  // Split batch into two overlay series so the dashed line can be coloured by
  // its position relative to live: red when batch > live (live underperforming),
  // green when batch <= live (live ahead). To avoid visual gaps at crossings,
  // each segment also includes one boundary point from the opposite side.
  const combinedData = liveData.map((point, i) => {
    const liveVal = point.value;
    const batchVal = batchData[i]?.value ?? 0;
    const prevLive = i > 0 ? (liveData[i - 1]?.value ?? 0) : liveVal;
    const prevBatch = i > 0 ? (batchData[i - 1]?.value ?? 0) : batchVal;
    const isAbove = batchVal > liveVal;
    const wasAbove = prevBatch > prevLive;
    const isCrossing = i > 0 && isAbove !== wasAbove;
    return {
      timestamp: point.timestamp,
      live: liveVal,
      batch: batchVal,
      delta: liveVal - batchVal,
      batchAbove: isAbove || isCrossing ? batchVal : null,
      batchBelow: !isAbove || isCrossing ? batchVal : null,
    };
  });

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
      <AreaChart key={animId} data={data} margin={{ top: 10, right: 0, left: 10, bottom: 0 }}>
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
          orientation="right"
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
          animationId={animId}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderSplitChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart key={animId} data={combinedData} margin={{ top: 10, right: 0, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="gradient-live" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--status-live)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--status-live)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradient-batch-above" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--pnl-negative)" stopOpacity={0.18} />
            <stop offset="95%" stopColor="var(--pnl-negative)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradient-batch-below" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--pnl-positive)" stopOpacity={0.18} />
            <stop offset="95%" stopColor="var(--pnl-positive)" stopOpacity={0} />
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
          orientation="right"
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
          animationId={animId}
        />
        <Area
          type="monotone"
          dataKey="batchAbove"
          name="batch"
          stroke="var(--pnl-negative)"
          strokeWidth={2}
          fill="url(#gradient-batch-above)"
          strokeDasharray="5 5"
          connectNulls={false}
          animationId={animId}
        />
        <Area
          type="monotone"
          dataKey="batchBelow"
          name="batch"
          stroke="var(--pnl-positive)"
          strokeWidth={2}
          fill="url(#gradient-batch-below)"
          strokeDasharray="5 5"
          connectNulls={false}
          animationId={animId}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderDeltaChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart key={animId} data={combinedData} margin={{ top: 10, right: 0, left: 10, bottom: 0 }}>
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
          orientation="right"
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
          animationId={animId}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <div className={cn("w-full h-full", className)}>
      {viewMode === "live" && renderChart(liveData, "var(--status-live)", "Live")}
      {viewMode === "batch" && renderChart(batchData, "var(--primary)", "Batch")}
      {viewMode === "split" && renderSplitChart()}
      {viewMode === "delta" && renderDeltaChart()}
    </div>
  );
}

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
