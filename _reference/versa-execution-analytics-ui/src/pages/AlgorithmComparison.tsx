import { useState, useMemo } from "react";
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
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import {
  TOOLTIP_STYLE,
  GRID_STYLE,
  AXIS_STYLE,
  CHART_COLORS,
} from "../lib/chart-theme";
import { useResultsStore } from "@/stores/resultsStore";
import { useFilterStore } from "@/stores/filterStore";

interface AlgorithmStats {
  algorithm: string;
  count: number;
  avgAlphaBps: number;
  avgAlphaUsd: number;
  winRate: number;
  avgSharpe: number;
  avgCostsBps: number;
  totalNotional: number;
}

export default function AlgorithmComparison() {
  const { results, filters } = useResultsStore();
  const {
    category,
    asset,
    strategy,
    mode,
    timeframe,
    instructionType,
    setCategory,
    setAsset,
    setStrategy,
    setMode,
    setTimeframe,
    setInstructionType,
  } = useFilterStore();
  const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>([]);
  const [chartView, setChartView] = useState<"bar" | "radar">("bar");

  // Filter results (excluding algorithm filter)
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
      return true;
    });
  }, [results, category, asset, strategy, mode, timeframe, instructionType]);

  // Calculate stats per algorithm
  const algorithmStats = useMemo(() => {
    const statsMap = new Map<string, AlgorithmStats>();

    filteredResults.forEach((r) => {
      const algo = r.algorithm || "UNKNOWN";
      if (!statsMap.has(algo)) {
        statsMap.set(algo, {
          algorithm: algo,
          count: 0,
          avgAlphaBps: 0,
          avgAlphaUsd: 0,
          winRate: 0,
          avgSharpe: 0,
          avgCostsBps: 0,
          totalNotional: 0,
        });
      }

      const stats = statsMap.get(algo)!;
      stats.count++;
      stats.avgAlphaBps += r.net_alpha_bps;
      stats.avgAlphaUsd += r.net_alpha_usd;
      stats.winRate += r.net_alpha_bps > 0 ? 1 : 0;
      stats.avgSharpe += r.sharpe_ratio;
      stats.avgCostsBps += r.total_costs_bps;
      stats.totalNotional += r.total_notional_usd || 0;
    });

    // Calculate averages
    statsMap.forEach((stats) => {
      if (stats.count > 0) {
        stats.avgAlphaBps = stats.avgAlphaBps / stats.count;
        stats.avgAlphaUsd = stats.avgAlphaUsd / stats.count;
        stats.winRate = (stats.winRate / stats.count) * 100;
        stats.avgSharpe = stats.avgSharpe / stats.count;
        stats.avgCostsBps = stats.avgCostsBps / stats.count;
      }
    });

    return Array.from(statsMap.values()).sort(
      (a, b) => b.avgAlphaBps - a.avgAlphaBps,
    );
  }, [filteredResults]);

  // Select top algorithms by default
  useMemo(() => {
    if (selectedAlgorithms.length === 0 && algorithmStats.length > 0) {
      setSelectedAlgorithms(algorithmStats.slice(0, 5).map((s) => s.algorithm));
    }
  }, [algorithmStats, selectedAlgorithms.length]);

  // Prepare chart data for selected algorithms
  const chartData = useMemo(() => {
    return algorithmStats
      .filter((s) => selectedAlgorithms.includes(s.algorithm))
      .map((s) => ({
        name: s.algorithm,
        "Alpha (bps)": parseFloat(s.avgAlphaBps.toFixed(2)),
        "Win Rate (%)": parseFloat(s.winRate.toFixed(1)),
        Sharpe: parseFloat(s.avgSharpe.toFixed(2)),
        "Costs (bps)": parseFloat(s.avgCostsBps.toFixed(2)),
        count: s.count,
      }));
  }, [algorithmStats, selectedAlgorithms]);

  // Radar chart data
  const radarData = useMemo(() => {
    if (chartData.length === 0) return [];

    // Normalize metrics to 0-100 scale
    const metrics = ["Alpha (bps)", "Win Rate (%)", "Sharpe", "Costs (bps)"];
    const maxValues = {
      "Alpha (bps)": Math.max(
        ...chartData.map((d) => Math.abs(d["Alpha (bps)"])),
      ),
      "Win Rate (%)": 100,
      Sharpe: Math.max(...chartData.map((d) => Math.abs(d["Sharpe"]))),
      "Costs (bps)": Math.max(...chartData.map((d) => d["Costs (bps)"])),
    };

    return metrics.map((metric) => {
      const point: Record<string, string | number> = { metric };
      chartData.forEach((algo) => {
        const value = algo[metric as keyof typeof algo] as number;
        const max = maxValues[metric as keyof typeof maxValues];
        // Invert costs (lower is better)
        if (metric === "Costs (bps)") {
          point[algo.name] = max > 0 ? 100 - (value / max) * 100 : 100;
        } else {
          point[algo.name] = max > 0 ? (value / max) * 100 : 0;
        }
      });
      return point;
    });
  }, [chartData]);

  const toggleAlgorithm = (algo: string) => {
    setSelectedAlgorithms((prev) =>
      prev.includes(algo) ? prev.filter((a) => a !== algo) : [...prev, algo],
    );
  };

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">
          Load results first to enable algorithm comparison
        </p>
      </div>
    );
  }

  const algorithmColors = [
    ...CHART_COLORS,
    CHART_COLORS[0],
    CHART_COLORS[1],
    CHART_COLORS[2],
    CHART_COLORS[3],
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
            Compare
          </h1>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Algorithm performance comparison across strategies
          </p>
        </div>
      </div>
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-4">
          {/* Filters */}
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
            </div>
          </div>

          {/* Algorithm Selection */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold">Algorithms</h2>
            </div>
            <div className="card-body space-y-2">
              {algorithmStats.map((stats, idx) => (
                <label
                  key={stats.algorithm}
                  className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedAlgorithms.includes(stats.algorithm)}
                    onChange={() => toggleAlgorithm(stats.algorithm)}
                    className="rounded border-slate-600"
                  />
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        algorithmColors[idx % algorithmColors.length],
                    }}
                  />
                  <span className="flex-1 text-sm">{stats.algorithm}</span>
                  <span className="text-xs text-slate-400">
                    ({stats.count})
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Algorithm Comparison</h1>
            <div className="flex gap-2">
              <Button
                onClick={() => setChartView("bar")}
                variant={chartView === "bar" ? "default" : "outline"}
                size="sm"
              >
                Bar Chart
              </Button>
              <Button
                onClick={() => setChartView("radar")}
                variant={chartView === "radar" ? "default" : "outline"}
                size="sm"
              >
                Radar Chart
              </Button>
            </div>
          </div>

          {/* Summary Cards for Top Algorithm */}
          {algorithmStats.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              <div className="metric-card">
                <div className="metric-value text-blue-400">
                  {algorithmStats[0]?.algorithm}
                </div>
                <div className="metric-label">Best Algorithm</div>
              </div>
              <div className="metric-card">
                <div
                  className={`metric-value ${algorithmStats[0]?.avgAlphaBps >= 0 ? "value-positive" : "value-negative"}`}
                >
                  {algorithmStats[0]?.avgAlphaBps >= 0 ? "+" : ""}
                  {algorithmStats[0]?.avgAlphaBps.toFixed(2)}
                </div>
                <div className="metric-label">Best Alpha (bps)</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">
                  {algorithmStats[0]?.winRate.toFixed(1)}%
                </div>
                <div className="metric-label">Best Win Rate</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{filteredResults.length}</div>
                <div className="metric-label">Total Configs</div>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold">
                {chartView === "bar"
                  ? "Performance Comparison"
                  : "Multi-Metric Radar"}
              </h2>
            </div>
            <div className="card-body">
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-slate-400">
                  Select algorithms to compare
                </div>
              ) : chartView === "bar" ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid {...GRID_STYLE} />
                    <XAxis type="number" {...AXIS_STYLE} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      {...AXIS_STYLE}
                      width={120}
                    />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend />
                    <Bar
                      dataKey="Alpha (bps)"
                      fill={CHART_COLORS[3]}
                      name="Alpha (bps)"
                    />
                    <Bar
                      dataKey="Win Rate (%)"
                      fill={CHART_COLORS[1]}
                      name="Win Rate (%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--color-border-subtle)" />
                    <PolarAngleAxis
                      dataKey="metric"
                      stroke="var(--color-text-muted)"
                      fontSize={12}
                    />
                    <PolarRadiusAxis
                      stroke="var(--color-text-muted)"
                      fontSize={10}
                    />
                    {chartData.map((algo, idx) => (
                      <Radar
                        key={algo.name}
                        name={algo.name}
                        dataKey={algo.name}
                        stroke={algorithmColors[idx % algorithmColors.length]}
                        fill={algorithmColors[idx % algorithmColors.length]}
                        fillOpacity={0.2}
                      />
                    ))}
                    <Legend />
                    <Tooltip {...TOOLTIP_STYLE} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Detailed Stats Table */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold">Detailed Statistics</h2>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="table-header">
                    <tr>
                      <th className="table-cell text-left">Rank</th>
                      <th className="table-cell text-left">Algorithm</th>
                      <th className="table-cell text-right">Configs</th>
                      <th className="table-cell text-right">Avg Alpha (bps)</th>
                      <th className="table-cell text-right">Avg Alpha ($)</th>
                      <th className="table-cell text-right">Win Rate</th>
                      <th className="table-cell text-right">Avg Sharpe</th>
                      <th className="table-cell text-right">Avg Costs (bps)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {algorithmStats.map((stats, idx) => (
                      <tr
                        key={stats.algorithm}
                        className={`table-row ${selectedAlgorithms.includes(stats.algorithm) ? "bg-slate-700/50" : ""}`}
                      >
                        <td className="table-cell font-bold">{idx + 1}</td>
                        <td className="table-cell">
                          <span className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor:
                                  algorithmColors[idx % algorithmColors.length],
                              }}
                            />
                            {stats.algorithm}
                          </span>
                        </td>
                        <td className="table-cell text-right">{stats.count}</td>
                        <td
                          className={`table-cell text-right ${stats.avgAlphaBps >= 0 ? "value-positive" : "value-negative"}`}
                        >
                          {stats.avgAlphaBps >= 0 ? "+" : ""}
                          {stats.avgAlphaBps.toFixed(2)}
                        </td>
                        <td
                          className={`table-cell text-right ${stats.avgAlphaUsd >= 0 ? "value-positive" : "value-negative"}`}
                        >
                          ${stats.avgAlphaUsd.toLocaleString()}
                        </td>
                        <td className="table-cell text-right">
                          {stats.winRate.toFixed(1)}%
                        </td>
                        <td className="table-cell text-right">
                          {stats.avgSharpe.toFixed(2)}
                        </td>
                        <td className="table-cell text-right value-negative">
                          -{stats.avgCostsBps.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
