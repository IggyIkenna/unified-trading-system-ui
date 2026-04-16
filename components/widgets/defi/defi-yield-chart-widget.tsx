"use client";

import * as React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import { formatNumber } from "@/lib/utils/formatters";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useDeFiData } from "./defi-data-context";

type ViewMode = "apy" | "cumulative_pnl" | "daily_pnl" | "comparison";

/**
 * DeFi Yield Chart — time-series visualization of strategy yields.
 * Shows APY curves, cumulative P&L, and daily P&L for all DeFi strategies.
 * Yields match the presentation_defi.html exactly.
 */
export function DeFiYieldChartWidget(_props: WidgetComponentProps) {
  const { yieldSeries: allSeries, yieldSummary: summary, yieldDays: days, setYieldDays: setDays } = useDeFiData();
  const [viewMode, setViewMode] = React.useState<ViewMode>("cumulative_pnl");
  const [selectedStrategies, setSelectedStrategies] = React.useState<Set<string>>(new Set());

  // Default: show all strategies
  const visibleSeries = React.useMemo(
    () => (selectedStrategies.size === 0 ? allSeries : allSeries.filter((s) => selectedStrategies.has(s.strategy_id))),
    [allSeries, selectedStrategies],
  );

  const toggleStrategy = React.useCallback((id: string) => {
    setSelectedStrategies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Merge all series into a single data array for recharts
  const chartData = React.useMemo(() => {
    if (visibleSeries.length === 0) return [];
    const dateMap = new Map<string, Record<string, number | string>>();
    for (const series of visibleSeries) {
      for (const pt of series.data) {
        if (!dateMap.has(pt.date)) dateMap.set(pt.date, { date: pt.date });
        const row = dateMap.get(pt.date)!;
        if (viewMode === "apy") row[series.strategy_id] = pt.apy_pct;
        else if (viewMode === "cumulative_pnl") row[series.strategy_id] = pt.cumulative_pnl_usd;
        else if (viewMode === "daily_pnl") row[series.strategy_id] = pt.daily_pnl_usd;
      }
    }
    return [...dateMap.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [visibleSeries, viewMode]);

  const yFormatter = viewMode === "apy" ? (v: number) => `${v.toFixed(1)}%` : (v: number) => `$${formatNumber(v)}`;

  if (allSeries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        No yield data available
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3 p-1">
      {/* Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1">
          {(["cumulative_pnl", "apy", "daily_pnl"] as ViewMode[]).map((m) => (
            <button
              key={m}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                viewMode === m
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
              }`}
              onClick={() => setViewMode(m)}
            >
              {m === "cumulative_pnl" ? "Cumulative P&L" : m === "apy" ? "APY %" : "Daily P&L"}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {[30, 60, 90].map((d) => (
            <button
              key={d}
              className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                days === d
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
              }`}
              onClick={() => setDays(d)}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        {summary.slice(0, 4).map((s) => (
          <div key={s.strategy_id} className="rounded-md border p-2 space-y-0.5">
            <div className="font-medium truncate" style={{ color: s.color }}>
              {s.strategy_name}
            </div>
            <div className="text-lg font-bold">{s.target_apy_pct}%</div>
            <div className={`text-xs ${s.vs_ethena >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {s.vs_ethena >= 0 ? "+" : ""}
              {s.vs_ethena}% vs Ethena
            </div>
            <div className="text-muted-foreground">${formatNumber(s.cumulative_pnl_usd)} cum.</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={(d: string) => {
                const dt = new Date(d);
                return `${dt.getMonth() + 1}/${dt.getDate()}`;
              }}
              className="text-muted-foreground"
            />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={yFormatter} className="text-muted-foreground" width={70} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 6,
                fontSize: 11,
              }}
              labelFormatter={(d: string) => new Date(d).toLocaleDateString()}
              formatter={(value: number, name: string) => {
                const series = allSeries.find((s) => s.strategy_id === name);
                const label = series?.strategy_name ?? name;
                return [viewMode === "apy" ? `${value.toFixed(2)}%` : `$${formatNumber(value)}`, label];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 10 }}
              formatter={(value: string) => allSeries.find((s) => s.strategy_id === value)?.strategy_name ?? value}
            />
            {visibleSeries.map((s) => (
              <Area
                key={s.strategy_id}
                type="monotone"
                dataKey={s.strategy_id}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.08}
                strokeWidth={1.5}
                dot={false}
                connectNulls
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Strategy toggle chips */}
      <div className="flex flex-wrap gap-1">
        {allSeries.map((s) => {
          const active = selectedStrategies.size === 0 || selectedStrategies.has(s.strategy_id);
          return (
            <button
              key={s.strategy_id}
              className={`px-2 py-0.5 text-[10px] rounded-full border transition-all ${
                active ? "border-current opacity-100" : "border-border opacity-40 hover:opacity-70"
              }`}
              style={{ color: s.color }}
              onClick={() => toggleStrategy(s.strategy_id)}
            >
              {s.strategy_name} ({s.target_apy_pct}%)
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default DeFiYieldChartWidget;
