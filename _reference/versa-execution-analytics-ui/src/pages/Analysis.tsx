import { useState, useMemo, useEffect } from "react";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@unified-trading/ui-kit";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  ComposedChart,
  Area,
} from "recharts";
import {
  TOOLTIP_STYLE,
  GRID_STYLE,
  AXIS_STYLE,
  CHART_COLORS,
} from "../lib/chart-theme";
import { useResultsStore } from "@/stores/resultsStore";
import { useFilterStore } from "@/stores/filterStore";
import apiClient from "@/api/client";

type ChartType = "distribution" | "alpha-detail" | "equity" | "rankings";

interface ExecutionAlpha {
  summary: {
    benchmark_price?: number;
    vw_gross_entry_alpha_bps?: number;
    vw_gross_exit_alpha_bps?: number;
    vw_total_costs_bps?: number;
    vw_net_alpha_bps?: number;
    total_entry_notional_usd?: number;
    total_exit_notional_usd?: number;
    num_entries?: number;
    num_exits?: number;
    net_alpha_usd?: number;
  };
  entry_fills?: Array<{
    order_id: string;
    fill_price: number;
    benchmark_price: number;
    slippage_bps: number;
    notional_usd: number;
    timestamp?: string;
    direction?: number;
  }>;
  exit_fills?: Array<{
    order_id: string;
    fill_price: number;
    benchmark_price: number;
    slippage_bps: number;
    notional_usd: number;
    timestamp?: string;
    exit_type?: string;
  }>;
}

interface EquityData {
  timestamp: string;
  equity: number;
  drawdown?: number;
}

export default function Analysis() {
  const { results, filters } = useResultsStore();
  const {
    category,
    asset,
    strategy,
    mode,
    timeframe,
    instructionType,
    algorithm,
    setCategory,
    setAsset,
    setStrategy,
    setMode,
    setTimeframe,
    setInstructionType,
    setAlgorithm,
  } = useFilterStore();
  const [chartType, setChartType] = useState<ChartType>("distribution");
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [executionAlpha, setExecutionAlpha] = useState<ExecutionAlpha | null>(
    null,
  );
  const [equityData, setEquityData] = useState<EquityData[]>([]);
  const [loadingAlpha, setLoadingAlpha] = useState(false);

  // Load execution alpha for selected result
  useEffect(() => {
    if (!selectedResultId) {
      setExecutionAlpha(null);
      setEquityData([]);
      return;
    }

    const fetchAlphaData = async () => {
      setLoadingAlpha(true);
      try {
        const result = results.find((r) => r.result_id === selectedResultId);
        if (!result) return;
        if (!result.run_path) {
          setExecutionAlpha(null);
          return;
        }

        // Fetch execution_alpha.json from GCS through the API
        try {
          const response = await apiClient.get<
            ExecutionAlpha & { available?: boolean }
          >("/results/execution_alpha", {
            params: {
              source: result.bucket ? "gcs" : "local",
              run_path: result.run_path,
              ...(result.bucket ? { bucket: result.bucket } : {}),
            },
          });
          if (response.data.available === false) {
            setExecutionAlpha(null);
          } else {
            setExecutionAlpha(response.data);
          }
        } catch {
          // Execution alpha may not be available for all results
          setExecutionAlpha(null);
        }

        // Note: Equity data endpoint would need to be implemented if required
      } catch (error) {
        console.error("Error fetching alpha data:", error);
      } finally {
        setLoadingAlpha(false);
      }
    };

    fetchAlphaData();
  }, [selectedResultId, results]);

  // Filter results
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      if (category !== "All" && r.category !== category) return false;
      if (asset !== "All" && r.asset !== asset) return false;
      if (strategy !== "All" && r.strategy_description !== strategy)
        return false;
      if (mode !== "All" && r.mode !== mode) return false;
      if (timeframe !== "All" && r.timeframe !== timeframe) return false;
      if (instructionType !== "All" && r.instruction_type !== instructionType)
        return false;
      if (algorithm !== "All" && r.algorithm !== algorithm) return false;
      return true;
    });
  }, [
    results,
    category,
    asset,
    strategy,
    mode,
    timeframe,
    instructionType,
    algorithm,
  ]);

  // Calculate stats
  const stats = useMemo(() => {
    if (filteredResults.length === 0) {
      return {
        mean: 0,
        median: 0,
        std: 0,
        min: 0,
        max: 0,
        positivePct: 0,
        totalAlphaUsd: 0,
      };
    }
    const alphas = filteredResults
      .map((r) => r.net_alpha_bps)
      .sort((a, b) => a - b);
    const mean = alphas.reduce((s, v) => s + v, 0) / alphas.length;
    const median = alphas[Math.floor(alphas.length / 2)];
    const variance =
      alphas.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / alphas.length;
    const std = Math.sqrt(variance);
    const positivePct =
      (alphas.filter((a) => a > 0).length / alphas.length) * 100;
    const totalAlphaUsd = filteredResults.reduce(
      (s, r) => s + r.net_alpha_usd,
      0,
    );
    return {
      mean,
      median,
      std,
      min: alphas[0],
      max: alphas[alphas.length - 1],
      positivePct,
      totalAlphaUsd,
    };
  }, [filteredResults]);

  // Build histogram data
  const histogramData = useMemo(() => {
    if (filteredResults.length === 0) return [];
    const alphas = filteredResults.map((r) => r.net_alpha_bps);
    const min = Math.min(...alphas);
    const max = Math.max(...alphas);
    const binCount = 30;
    const binSize = (max - min) / binCount || 1;

    const bins = Array(binCount)
      .fill(0)
      .map((_, i) => ({
        binStart: min + i * binSize,
        binEnd: min + (i + 1) * binSize,
        count: 0,
      }));

    alphas.forEach((a) => {
      const binIndex = Math.min(Math.floor((a - min) / binSize), binCount - 1);
      if (binIndex >= 0 && binIndex < binCount) bins[binIndex].count++;
    });

    return bins.map((b) => ({
      name: b.binStart.toFixed(1),
      count: b.count,
      fill: b.binStart >= 0 ? "#22c55e" : "#ef4444",
    }));
  }, [filteredResults]);

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Load results first to enable analysis</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header with timestamp */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
            Analysis
          </h1>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Execution alpha analysis and performance breakdown
          </p>
        </div>
        <span
          data-testid="analysis-timestamp"
          className="text-xs text-[var(--color-text-muted)]"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {new Date().toLocaleString([], {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <div className="w-64 flex-shrink-0 space-y-4">
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold">Filters</h2>
            </div>
            <div className="card-body space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Category
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    {filters.categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Asset
                </label>
                <Select value={asset} onValueChange={setAsset}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    {filters.assets.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Strategy
                </label>
                <Select value={strategy} onValueChange={setStrategy}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    {filters.strategies.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Mode
                </label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    {filters.modes.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Timeframe
                </label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    {filters.timeframes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Instruction Type
                </label>
                <Select
                  value={instructionType}
                  onValueChange={setInstructionType}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    {filters.instruction_types.map((i) => (
                      <SelectItem key={i} value={i}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Algorithm
                </label>
                <Select value={algorithm} onValueChange={setAlgorithm}>
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    {filters.algorithms.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{filteredResults.length}</div>
            <div className="metric-label">Filtered Results</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* KPI Cards */}
          <div
            data-testid="kpi-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {[
              {
                label: "Mean Alpha (bps)",
                value: `${stats.mean >= 0 ? "+" : ""}${stats.mean.toFixed(2)}`,
                accent:
                  stats.mean >= 0
                    ? "var(--color-success, #22c55e)"
                    : "var(--color-error, #ef4444)",
              },
              {
                label: "Total Alpha ($)",
                value: `$${stats.totalAlphaUsd.toLocaleString()}`,
                accent: "var(--color-accent-blue, #3b82f6)",
              },
              {
                label: "Positive %",
                value: `${stats.positivePct.toFixed(1)}%`,
                accent: "var(--color-accent-purple, #a78bfa)",
              },
              {
                label: "Configs",
                value: String(filteredResults.length),
                accent: "var(--color-accent-amber, #f59e0b)",
              },
            ].map(({ label, value, accent }) => (
              <div
                key={label}
                data-testid={`kpi-card-${label
                  .toLowerCase()
                  .replace(/[\s()$]+/g, "-")
                  .replace(/-+$/, "")}`}
                className="bg-[var(--color-surface,#1e293b)] border border-[var(--color-border,#334155)] rounded-lg p-4"
              >
                <div className="flex items-stretch gap-3">
                  <div
                    className="w-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: accent }}
                  />
                  <div>
                    <div className="text-xs text-[var(--color-text-muted,#94a3b8)] mb-1">
                      {label}
                    </div>
                    <div
                      className="text-xl font-semibold font-mono text-[var(--color-text-primary,#f1f5f9)]"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {value}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chart Type Selection */}
          <div className="flex space-x-2">
            {(
              ["distribution", "alpha-detail", "equity", "rankings"] as const
            ).map((type) => (
              <Button
                key={type}
                onClick={() => setChartType(type)}
                variant={chartType === type ? "default" : "outline"}
                size="sm"
              >
                {type === "alpha-detail"
                  ? "Alpha Detail"
                  : type === "equity"
                    ? "Equity Curve"
                    : type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>

          {/* Result Selection for Alpha Detail and Equity views */}
          {(chartType === "alpha-detail" || chartType === "equity") && (
            <div className="card">
              <div className="card-body">
                <label className="block text-xs text-slate-400 mb-1">
                  Select Result to Analyze
                </label>
                <Select
                  value={selectedResultId || ""}
                  onValueChange={(v) => setSelectedResultId(v || null)}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Select a result..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredResults.slice(0, 50).map((r) => (
                      <SelectItem key={r.result_id} value={r.result_id}>
                        {r.config_id.slice(0, 50)} (
                        {r.net_alpha_bps >= 0 ? "+" : ""}
                        {r.net_alpha_bps.toFixed(2)} bps)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold">
                {chartType === "distribution" && "Alpha Distribution"}
                {chartType === "alpha-detail" && "Execution Alpha Breakdown"}
                {chartType === "equity" && "Equity Curve"}
                {chartType === "rankings" && "Best Configs"}
              </h2>
            </div>
            <div className="card-body">
              {chartType === "distribution" && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={histogramData}>
                    <CartesianGrid {...GRID_STYLE} />
                    <XAxis dataKey="name" {...AXIS_STYLE} />
                    <YAxis {...AXIS_STYLE} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <ReferenceLine x="0" stroke="#94a3b8" />
                    <ReferenceLine
                      x={stats.mean.toFixed(1)}
                      stroke={CHART_COLORS[5]}
                      strokeDasharray="5 5"
                      label={{ value: "Mean", fill: CHART_COLORS[5] }}
                    />
                    <Bar dataKey="count" fill={CHART_COLORS[3]} />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* Alpha Detail View */}
              {chartType === "alpha-detail" && (
                <div className="space-y-6">
                  {loadingAlpha ? (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                      Loading execution alpha data...
                    </div>
                  ) : !selectedResultId ? (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                      Select a result above to view execution alpha breakdown
                    </div>
                  ) : !executionAlpha ? (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                      No execution alpha data available for this result
                    </div>
                  ) : (
                    <>
                      {/* Alpha Summary Metrics */}
                      <div className="grid grid-cols-5 gap-4">
                        <div className="metric-card">
                          <div
                            className={`metric-value ${(executionAlpha.summary.vw_gross_entry_alpha_bps || 0) >= 0 ? "value-positive" : "value-negative"}`}
                          >
                            {(executionAlpha.summary.vw_gross_entry_alpha_bps ||
                              0) >= 0
                              ? "+"
                              : ""}
                            {(
                              executionAlpha.summary.vw_gross_entry_alpha_bps ||
                              0
                            ).toFixed(2)}
                          </div>
                          <div className="metric-label">Entry Alpha (bps)</div>
                        </div>
                        <div className="metric-card">
                          <div
                            className={`metric-value ${(executionAlpha.summary.vw_gross_exit_alpha_bps || 0) >= 0 ? "value-positive" : "value-negative"}`}
                          >
                            {(executionAlpha.summary.vw_gross_exit_alpha_bps ||
                              0) >= 0
                              ? "+"
                              : ""}
                            {(
                              executionAlpha.summary.vw_gross_exit_alpha_bps ||
                              0
                            ).toFixed(2)}
                          </div>
                          <div className="metric-label">Exit Alpha (bps)</div>
                        </div>
                        <div className="metric-card">
                          <div className="metric-value value-negative">
                            -
                            {(
                              executionAlpha.summary.vw_total_costs_bps || 0
                            ).toFixed(2)}
                          </div>
                          <div className="metric-label">Costs (bps)</div>
                        </div>
                        <div className="metric-card">
                          <div
                            className={`metric-value ${(executionAlpha.summary.vw_net_alpha_bps || 0) >= 0 ? "value-positive" : "value-negative"}`}
                          >
                            {(executionAlpha.summary.vw_net_alpha_bps || 0) >= 0
                              ? "+"
                              : ""}
                            {(
                              executionAlpha.summary.vw_net_alpha_bps || 0
                            ).toFixed(2)}
                          </div>
                          <div className="metric-label">Net Alpha (bps)</div>
                        </div>
                        <div className="metric-card">
                          <div className="metric-value">
                            $
                            {(
                              executionAlpha.summary.net_alpha_usd || 0
                            ).toLocaleString()}
                          </div>
                          <div className="metric-label">Net Alpha ($)</div>
                        </div>
                      </div>

                      {/* Benchmark Price */}
                      {executionAlpha.summary.benchmark_price && (
                        <div className="text-sm text-slate-400">
                          Benchmark Price:{" "}
                          <span className="text-white font-mono">
                            $
                            {executionAlpha.summary.benchmark_price.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Entry Fills Chart */}
                      {executionAlpha.entry_fills &&
                        executionAlpha.entry_fills.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold mb-2">
                              Entry Fills ({executionAlpha.entry_fills.length})
                            </h3>
                            <ResponsiveContainer width="100%" height={200}>
                              <BarChart
                                data={executionAlpha.entry_fills.map(
                                  (f, i) => ({
                                    index: i + 1,
                                    slippage_bps: f.slippage_bps,
                                    fill:
                                      f.slippage_bps >= 0
                                        ? CHART_COLORS[1]
                                        : CHART_COLORS[5],
                                  }),
                                )}
                              >
                                <CartesianGrid {...GRID_STYLE} />
                                <XAxis
                                  dataKey="index"
                                  {...AXIS_STYLE}
                                  label={{
                                    value: "Fill #",
                                    position: "insideBottom",
                                    offset: -5,
                                    fill: "var(--color-text-muted)",
                                  }}
                                />
                                <YAxis
                                  {...AXIS_STYLE}
                                  label={{
                                    value: "Alpha (bps)",
                                    angle: -90,
                                    position: "insideLeft",
                                    fill: "var(--color-text-muted)",
                                  }}
                                />
                                <Tooltip
                                  {...TOOLTIP_STYLE}
                                  formatter={(value: number) => [
                                    `${value >= 0 ? "+" : ""}${value.toFixed(2)} bps`,
                                    "Alpha",
                                  ]}
                                />
                                <ReferenceLine y={0} stroke="#94a3b8" />
                                <Bar dataKey="slippage_bps" name="Alpha">
                                  {executionAlpha.entry_fills.map((f, i) => (
                                    <Bar
                                      key={i}
                                      dataKey="slippage_bps"
                                      fill={
                                        f.slippage_bps >= 0
                                          ? "#22c55e"
                                          : "#ef4444"
                                      }
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                      {/* Exit Fills Chart */}
                      {executionAlpha.exit_fills &&
                        executionAlpha.exit_fills.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold mb-2">
                              Exit Fills ({executionAlpha.exit_fills.length})
                            </h3>
                            <ResponsiveContainer width="100%" height={200}>
                              <BarChart
                                data={executionAlpha.exit_fills.map((f, i) => ({
                                  index: i + 1,
                                  slippage_bps: f.slippage_bps,
                                  fill:
                                    f.slippage_bps >= 0
                                      ? CHART_COLORS[1]
                                      : CHART_COLORS[5],
                                }))}
                              >
                                <CartesianGrid {...GRID_STYLE} />
                                <XAxis
                                  dataKey="index"
                                  {...AXIS_STYLE}
                                  label={{
                                    value: "Fill #",
                                    position: "insideBottom",
                                    offset: -5,
                                    fill: "var(--color-text-muted)",
                                  }}
                                />
                                <YAxis
                                  {...AXIS_STYLE}
                                  label={{
                                    value: "Alpha (bps)",
                                    angle: -90,
                                    position: "insideLeft",
                                    fill: "var(--color-text-muted)",
                                  }}
                                />
                                <Tooltip
                                  {...TOOLTIP_STYLE}
                                  formatter={(value: number) => [
                                    `${value >= 0 ? "+" : ""}${value.toFixed(2)} bps`,
                                    "Alpha",
                                  ]}
                                />
                                <ReferenceLine y={0} stroke="#94a3b8" />
                                <Bar
                                  dataKey="slippage_bps"
                                  fill={CHART_COLORS[3]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                      {/* Fill Details Table */}
                      {executionAlpha.entry_fills &&
                        executionAlpha.entry_fills.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold mb-2">
                              Fill Details
                            </h3>
                            <div className="overflow-x-auto max-h-64 overflow-y-auto">
                              <table className="w-full text-sm">
                                <thead className="table-header sticky top-0 bg-slate-800">
                                  <tr>
                                    <th className="table-cell text-left">
                                      Type
                                    </th>
                                    <th className="table-cell text-left">
                                      Order ID
                                    </th>
                                    <th className="table-cell text-right">
                                      Fill Price
                                    </th>
                                    <th className="table-cell text-right">
                                      Benchmark
                                    </th>
                                    <th className="table-cell text-right">
                                      Alpha (bps)
                                    </th>
                                    <th className="table-cell text-right">
                                      Notional
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {executionAlpha.entry_fills.map((f, i) => (
                                    <tr
                                      key={`entry-${i}`}
                                      className="table-row"
                                    >
                                      <td className="table-cell text-green-400">
                                        Entry
                                      </td>
                                      <td className="table-cell font-mono text-xs">
                                        {f.order_id?.slice(0, 12)}...
                                      </td>
                                      <td
                                        className="table-cell text-right font-mono"
                                        style={{
                                          fontVariantNumeric: "tabular-nums",
                                        }}
                                      >
                                        ${f.fill_price.toLocaleString()}
                                      </td>
                                      <td
                                        className="table-cell text-right font-mono"
                                        style={{
                                          fontVariantNumeric: "tabular-nums",
                                        }}
                                      >
                                        ${f.benchmark_price.toLocaleString()}
                                      </td>
                                      <td
                                        className={`table-cell text-right ${f.slippage_bps >= 0 ? "value-positive" : "value-negative"}`}
                                      >
                                        {f.slippage_bps >= 0 ? "+" : ""}
                                        {f.slippage_bps.toFixed(2)}
                                      </td>
                                      <td className="table-cell text-right">
                                        ${f.notional_usd.toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                  {executionAlpha.exit_fills?.map((f, i) => (
                                    <tr key={`exit-${i}`} className="table-row">
                                      <td className="table-cell text-red-400">
                                        Exit
                                      </td>
                                      <td className="table-cell font-mono text-xs">
                                        {f.order_id?.slice(0, 12)}...
                                      </td>
                                      <td
                                        className="table-cell text-right font-mono"
                                        style={{
                                          fontVariantNumeric: "tabular-nums",
                                        }}
                                      >
                                        ${f.fill_price.toLocaleString()}
                                      </td>
                                      <td
                                        className="table-cell text-right font-mono"
                                        style={{
                                          fontVariantNumeric: "tabular-nums",
                                        }}
                                      >
                                        ${f.benchmark_price.toLocaleString()}
                                      </td>
                                      <td
                                        className={`table-cell text-right ${f.slippage_bps >= 0 ? "value-positive" : "value-negative"}`}
                                      >
                                        {f.slippage_bps >= 0 ? "+" : ""}
                                        {f.slippage_bps.toFixed(2)}
                                      </td>
                                      <td className="table-cell text-right">
                                        ${f.notional_usd.toLocaleString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}

              {/* Equity Curve View */}
              {chartType === "equity" && (
                <div className="space-y-4">
                  {loadingAlpha ? (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                      Loading equity data...
                    </div>
                  ) : !selectedResultId ? (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                      Select a result above to view equity curve
                    </div>
                  ) : equityData.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-slate-400">
                      No equity data available for this result. Equity tracking
                      requires account state during backtest.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <ComposedChart data={equityData}>
                        <CartesianGrid {...GRID_STYLE} />
                        <XAxis
                          dataKey="timestamp"
                          {...AXIS_STYLE}
                          tickFormatter={(value) =>
                            new Date(value).toLocaleTimeString()
                          }
                        />
                        <YAxis {...AXIS_STYLE} />
                        <Tooltip
                          {...TOOLTIP_STYLE}
                          labelFormatter={(value) =>
                            new Date(value as string).toLocaleString()
                          }
                          formatter={(value: number, name: string) => [
                            name === "equity"
                              ? `$${value.toLocaleString()}`
                              : `${(value * 100).toFixed(2)}%`,
                            name === "equity" ? "Equity" : "Drawdown",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="equity"
                          stroke={CHART_COLORS[3]}
                          fill={CHART_COLORS[3]}
                          fillOpacity={0.3}
                          name="Equity"
                        />
                        {equityData[0]?.drawdown !== undefined && (
                          <Line
                            type="monotone"
                            dataKey="drawdown"
                            stroke={CHART_COLORS[5]}
                            strokeWidth={2}
                            dot={false}
                            name="Drawdown"
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}

              {chartType === "rankings" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="table-header">
                      <tr>
                        <th className="table-cell text-left">Rank</th>
                        <th className="table-cell text-left">Config ID</th>
                        <th className="table-cell text-left">Algorithm</th>
                        <th className="table-cell text-right">Alpha (bps)</th>
                        <th className="table-cell text-right">P&L</th>
                        <th className="table-cell text-right">Sharpe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...filteredResults]
                        .sort((a, b) => b.net_alpha_bps - a.net_alpha_bps)
                        .slice(0, 10)
                        .map((r, i) => (
                          <tr
                            key={r.result_id}
                            className="table-row hover:bg-slate-700 cursor-pointer"
                            onClick={() => {
                              setSelectedResultId(r.result_id);
                              setChartType("alpha-detail");
                            }}
                          >
                            <td
                              className="table-cell font-bold"
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              {i + 1}
                            </td>
                            <td className="table-cell font-mono text-xs">
                              {r.config_id.slice(0, 30)}...
                            </td>
                            <td className="table-cell">{r.algorithm}</td>
                            <td
                              className={`table-cell text-right font-mono ${r.net_alpha_bps >= 0 ? "value-positive" : "value-negative"}`}
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              {r.net_alpha_bps >= 0 ? "+" : ""}
                              {r.net_alpha_bps.toFixed(2)}
                            </td>
                            <td
                              className="table-cell text-right font-mono"
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              ${r.pnl.toLocaleString()}
                            </td>
                            <td
                              className="table-cell text-right font-mono"
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              {r.sharpe_ratio.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
