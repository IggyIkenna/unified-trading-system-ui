import { useState, useEffect } from "react";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@unified-trading/ui-kit";
import { useParams, useNavigate } from "react-router-dom";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Line,
  Scatter,
  ReferenceLine,
} from "recharts";
import {
  TOOLTIP_STYLE,
  GRID_STYLE,
  AXIS_STYLE,
  CHART_COLORS,
} from "../lib/chart-theme";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import apiClient from "@/api/client";
import { useResultsStore } from "@/stores/resultsStore";
import { Order } from "@/api/types";

interface ResultDetailsResponse {
  orders?: Order[];
}

interface AlphaFill {
  timestamp: string;
  fill_price: number;
  benchmark_price: number;
  side?: string;
  quantity?: number;
  alpha_bps?: number;
  notional?: number;
  direction?: number;
  net_alpha_bps?: number;
  notional_usd?: number;
  slippage_bps?: number;
  exit_type?: string;
}

interface ExecutionAlphaData {
  available: boolean;
  run_path: string;
  error?: string;
  summary: {
    vw_entry_slippage_bps?: number;
    vw_exit_slippage_bps?: number;
    vw_net_alpha_bps?: number;
    total_notional_usd?: number;
    total_costs_bps?: number;
    num_entries?: number;
    num_exits?: number;
    tp_hits?: number;
    sl_hits?: number;
    candle_close_exits?: number;
  };
  equity_curve: {
    timestamp: string;
    cumulative_alpha_usd: number;
    cumulative_alpha_bps: number;
    cumulative_notional_usd: number;
    fill_type: string;
  }[];
  entry_fills: AlphaFill[];
  exit_fills: AlphaFill[];
}

interface PriceDataPoint {
  timestamp: string;
  price: number;
  fill?: "entry" | "exit";
  fillPrice?: number;
  signal?: "buy" | "sell";
  signalPrice?: number;
}

export default function DeepDive() {
  const { configId } = useParams();
  const navigate = useNavigate();
  const { results } = useResultsStore();
  const [activeTab, setActiveTab] = useState<
    "alpha" | "price" | "fills" | "orders" | "timeline"
  >("alpha");
  const [chartView, setChartView] = useState<"usd" | "bps">("usd");
  const [priceData, setPriceData] = useState<PriceDataPoint[]>([]);
  const [priceLoading, setPriceLoading] = useState(false);

  const selectedResult = configId
    ? results.find((r) => r.result_id === configId || r.config_id === configId)
    : null;

  const formatOptionLabel = (label: string, maxLen = 72) => {
    if (label.length <= maxLen) return label;
    return `${label.slice(0, maxLen - 3)}...`;
  };

  // Fetch execution alpha data when a result is selected
  const {
    data: alphaData,
    isLoading: alphaLoading,
    error: alphaError,
  } = useQuery({
    queryKey: [
      "execution-alpha",
      selectedResult?.bucket,
      selectedResult?.run_path,
    ],
    queryFn: async () => {
      if (!selectedResult?.run_path) return null;
      const response = await apiClient.get<ExecutionAlphaData>(
        "/results/execution_alpha",
        {
          params: {
            source: selectedResult.bucket ? "gcs" : "local",
            run_path: selectedResult.run_path,
            ...(selectedResult.bucket ? { bucket: selectedResult.bucket } : {}),
          },
        },
      );
      return response.data;
    },
    enabled: !!selectedResult?.run_path,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Fetch result details (includes orders) when a result is selected
  const { data: resultDetails, isLoading: detailsLoading } = useQuery({
    queryKey: [
      "result-details",
      selectedResult?.result_id,
      selectedResult?.bucket,
    ],
    queryFn: async () => {
      if (!selectedResult?.result_id) return null;
      const response = await apiClient.get<ResultDetailsResponse>(
        `/results/${selectedResult.result_id}`,
        {
          params: {
            source: selectedResult.bucket ? "gcs" : "local",
            ...(selectedResult.bucket ? { bucket: selectedResult.bucket } : {}),
          },
        },
      );
      return response.data;
    },
    enabled: !!selectedResult?.result_id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timestamp;
    }
  };

  // Prepare chart data
  const chartData =
    alphaData?.equity_curve?.map((point) => ({
      time: formatTime(point.timestamp),
      timestamp: point.timestamp,
      alpha_usd: point.cumulative_alpha_usd,
      alpha_bps: point.cumulative_alpha_bps,
      notional: point.cumulative_notional_usd,
      fill_type: point.fill_type,
    })) || [];

  const hasExecutionAlpha = !!alphaData?.available;
  const netAlphaBps =
    alphaData?.summary?.vw_net_alpha_bps ?? selectedResult?.net_alpha_bps ?? 0;
  const totalCostsBps =
    alphaData?.summary?.total_costs_bps ?? selectedResult?.total_costs_bps ?? 0;
  const totalNotionalUsd =
    alphaData?.summary?.total_notional_usd ??
    selectedResult?.total_notional_usd ??
    0;
  const totalFills =
    (alphaData?.summary?.num_entries ?? 0) +
      (alphaData?.summary?.num_exits ?? 0) ||
    (selectedResult?.total_trades ?? 0);

  // Load price data with signals when price tab is active
  useEffect(() => {
    if (activeTab !== "price" || !selectedResult || !alphaData) return;

    const loadPriceData = async () => {
      setPriceLoading(true);
      try {
        // Build price chart data from fills
        const fills = [
          ...(alphaData.entry_fills?.map((f: AlphaFill) => ({
            ...f,
            type: "entry",
          })) || []),
          ...(alphaData.exit_fills?.map((f: AlphaFill) => ({
            ...f,
            type: "exit",
          })) || []),
        ].sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

        if (fills.length === 0) {
          setPriceData([]);
          return;
        }

        // Generate price data points from fills
        const data: PriceDataPoint[] = fills.map((fill) => ({
          timestamp: fill.timestamp,
          price: fill.fill_price || fill.benchmark_price,
          fill: (fill.type === "entry" ? "entry" : "exit") as "entry" | "exit",
          fillPrice: fill.fill_price,
          signalPrice: fill.benchmark_price,
        }));

        setPriceData(data);
      } catch (error) {
        console.error("Error loading price data:", error);
        setPriceData([]);
      } finally {
        setPriceLoading(false);
      }
    };

    loadPriceData();
  }, [activeTab, selectedResult, alphaData]);

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">
          Load results first to enable deep dive analysis
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
            Deep Dive
          </h1>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Per-config execution analysis and fill inspection
          </p>
        </div>

        {/* Config selector */}
        <Select
          value={configId || ""}
          onValueChange={(v) => navigate(`/deep-dive/${v}`)}
        >
          <SelectTrigger className="w-96">
            <SelectValue placeholder="Select a config..." />
          </SelectTrigger>
          <SelectContent>
            {results.map((r) => (
              <SelectItem key={r.result_id} value={r.result_id}>
                {formatOptionLabel(r.run_id || r.config_id || r.result_id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedResult ? (
        <>
          {!alphaLoading && !hasExecutionAlpha && (
            <div className="card">
              <div className="card-body py-3 text-amber-300 text-sm space-y-1">
                This run does not include execution-alpha detail files. Summary
                metrics are shown, but fill-level deep dive is unavailable.
                {alphaData?.error && (
                  <div className="text-xs text-amber-200/90">
                    Detail: {alphaData.error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="metric-card">
              <div
                className={`metric-value ${netAlphaBps >= 0 ? "value-positive" : "value-negative"}`}
              >
                {netAlphaBps >= 0 ? "+" : ""}
                {netAlphaBps.toFixed(2)}
              </div>
              <div className="metric-label">Net Alpha (bps)</div>
            </div>
            <div className="metric-card">
              <div className="metric-value value-negative">
                -{totalCostsBps.toFixed(2)}
              </div>
              <div className="metric-label">Costs (bps)</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">
                ${totalNotionalUsd.toLocaleString()}
              </div>
              <div className="metric-label">Total Notional</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{totalFills}</div>
              <div className="metric-label">Total Fills</div>
            </div>
          </div>

          {/* Execution Alpha Chart */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="font-semibold">Cumulative Execution Alpha</h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => setChartView("usd")}
                  variant={chartView === "usd" ? "default" : "outline"}
                  size="sm"
                >
                  $ USD
                </Button>
                <Button
                  onClick={() => setChartView("bps")}
                  variant={chartView === "bps" ? "default" : "outline"}
                  size="sm"
                >
                  bps
                </Button>
              </div>
            </div>
            <div className="card-body">
              {alphaLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : alphaError || !alphaData?.available ? (
                <div className="flex items-center justify-center h-[300px] text-slate-400">
                  {alphaError
                    ? "Error loading execution alpha data"
                    : "No execution alpha data available for this run"}
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="alphaGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={CHART_COLORS[3]}
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={CHART_COLORS[3]}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...GRID_STYLE} />
                    <XAxis dataKey="time" {...AXIS_STYLE} />
                    <YAxis
                      {...AXIS_STYLE}
                      tickFormatter={(value) =>
                        chartView === "usd"
                          ? `$${value.toFixed(2)}`
                          : `${value.toFixed(2)}`
                      }
                    />
                    <Tooltip
                      {...TOOLTIP_STYLE}
                      formatter={(value: number) => [
                        chartView === "usd"
                          ? `$${value.toFixed(4)}`
                          : `${value.toFixed(4)} bps`,
                        "Cumulative Alpha",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey={chartView === "usd" ? "alpha_usd" : "alpha_bps"}
                      stroke={CHART_COLORS[3]}
                      strokeWidth={2}
                      fill="url(#alphaGradient)"
                      name="Cumulative Alpha"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-slate-400">
                  No fill data available
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="card">
            <div className="border-b border-slate-700 flex">
              {(["alpha", "price", "fills", "orders", "timeline"] as const).map(
                (tab) => (
                  <Button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    variant="ghost"
                    size="sm"
                    className={`rounded-none px-4 py-3 text-sm font-medium ${
                      activeTab === tab
                        ? "text-white border-b-2 border-blue-500"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Button>
                ),
              )}
            </div>
            <div className="card-body">
              {activeTab === "alpha" && alphaData?.summary && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="metric-card">
                      <div className="metric-value text-blue-400">
                        {alphaData.summary.vw_entry_slippage_bps?.toFixed(3) ??
                          "0.000"}
                      </div>
                      <div className="metric-label">Entry Slippage (bps)</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-value text-blue-400">
                        {alphaData.summary.vw_exit_slippage_bps?.toFixed(3) ??
                          "0.000"}
                      </div>
                      <div className="metric-label">Exit Slippage (bps)</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-value text-green-400">
                        {alphaData.summary.tp_hits ?? 0}
                      </div>
                      <div className="metric-label">TP Hits</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-value text-red-400">
                        {alphaData.summary.sl_hits ?? 0}
                      </div>
                      <div className="metric-label">SL Hits</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="metric-card">
                      <div className="metric-value">
                        {alphaData.summary.num_entries ?? 0}
                      </div>
                      <div className="metric-label">Entry Fills</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-value">
                        {alphaData.summary.num_exits ?? 0}
                      </div>
                      <div className="metric-label">Exit Fills</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-value">
                        {alphaData.summary.candle_close_exits ?? 0}
                      </div>
                      <div className="metric-label">Candle Close Exits</div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "price" && (
                <div className="space-y-4">
                  {priceLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : priceData.length === 0 ? (
                    <div className="text-slate-400 text-center py-8">
                      No price data available. Ensure the selected result has
                      execution fills.
                    </div>
                  ) : (
                    <>
                      {/* Price Chart with Fills */}
                      <div>
                        <h3 className="text-sm font-semibold mb-2">
                          Price Chart with Executions
                        </h3>
                        <ResponsiveContainer width="100%" height={350}>
                          <ComposedChart data={priceData}>
                            <CartesianGrid {...GRID_STYLE} />
                            <XAxis
                              dataKey="timestamp"
                              {...AXIS_STYLE}
                              tickFormatter={(value) => formatTime(value)}
                            />
                            <YAxis
                              {...AXIS_STYLE}
                              domain={["dataMin - 10", "dataMax + 10"]}
                              tickFormatter={(value) =>
                                `$${value.toLocaleString()}`
                              }
                            />
                            <Tooltip
                              {...TOOLTIP_STYLE}
                              labelFormatter={(value) =>
                                new Date(value as string).toLocaleString()
                              }
                              formatter={(value: number, name: string) => [
                                `$${value.toLocaleString()}`,
                                name,
                              ]}
                            />
                            {/* Benchmark price reference line */}
                            {alphaData?.summary?.vw_entry_slippage_bps !==
                              undefined &&
                              priceData[0]?.signalPrice && (
                                <ReferenceLine
                                  y={priceData[0].signalPrice}
                                  stroke={CHART_COLORS[2]}
                                  strokeDasharray="5 5"
                                  label={{
                                    value: "Benchmark",
                                    fill: CHART_COLORS[2],
                                    position: "right",
                                  }}
                                />
                              )}
                            {/* Fill price line */}
                            <Line
                              type="monotone"
                              dataKey="price"
                              stroke={CHART_COLORS[3]}
                              strokeWidth={2}
                              dot={false}
                              name="Price"
                            />
                            {/* Entry fills as green dots */}
                            <Scatter
                              data={priceData.filter((d) => d.fill === "entry")}
                              dataKey="fillPrice"
                              fill={CHART_COLORS[1]}
                              name="Entry"
                            />
                            {/* Exit fills as red dots */}
                            <Scatter
                              data={priceData.filter((d) => d.fill === "exit")}
                              dataKey="fillPrice"
                              fill={CHART_COLORS[5]}
                              name="Exit"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-blue-500" />
                          <span className="text-slate-400">Price</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-slate-400">Entry Fills</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="text-slate-400">Exit Fills</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-4 border-t-2 border-dashed border-amber-500" />
                          <span className="text-slate-400">Benchmark</span>
                        </div>
                      </div>

                      {/* Fill Summary */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="metric-card">
                          <div className="metric-value text-green-400">
                            {alphaData?.entry_fills?.length ?? 0}
                          </div>
                          <div className="metric-label">Entry Fills</div>
                        </div>
                        <div className="metric-card">
                          <div className="metric-value text-red-400">
                            {alphaData?.exit_fills?.length ?? 0}
                          </div>
                          <div className="metric-label">Exit Fills</div>
                        </div>
                        <div className="metric-card">
                          <div className="metric-value">
                            $
                            {priceData[0]?.signalPrice?.toLocaleString() ?? "-"}
                          </div>
                          <div className="metric-label">Benchmark</div>
                        </div>
                        <div className="metric-card">
                          <div
                            className={`metric-value ${(alphaData?.summary?.vw_net_alpha_bps ?? 0) >= 0 ? "value-positive" : "value-negative"}`}
                          >
                            {(alphaData?.summary?.vw_net_alpha_bps ?? 0) >= 0
                              ? "+"
                              : ""}
                            {(
                              alphaData?.summary?.vw_net_alpha_bps ?? 0
                            ).toFixed(2)}{" "}
                            bps
                          </div>
                          <div className="metric-label">Net Alpha</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              {activeTab === "fills" && (
                <div className="overflow-x-auto">
                  {alphaData?.entry_fills &&
                  alphaData.entry_fills.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="table-row text-slate-400 border-b border-slate-700">
                          <th className="table-header-cell text-left py-2 px-3">
                            Time
                          </th>
                          <th className="table-header-cell text-left py-2 px-3">
                            Type
                          </th>
                          <th className="table-header-cell text-right py-2 px-3">
                            Price
                          </th>
                          <th className="table-header-cell text-right py-2 px-3">
                            Notional
                          </th>
                          <th className="table-header-cell text-right py-2 px-3">
                            Slippage (bps)
                          </th>
                          <th className="table-header-cell text-right py-2 px-3">
                            Alpha (bps)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...alphaData.entry_fills, ...alphaData.exit_fills]
                          .sort(
                            (a, b) =>
                              new Date(a.timestamp).getTime() -
                              new Date(b.timestamp).getTime(),
                          )
                          .slice(0, 50)
                          .map((fill, idx) => (
                            <tr
                              key={idx}
                              className="table-row border-b border-slate-800 hover:bg-slate-800/50"
                            >
                              <td className="table-cell py-2 px-3">
                                {formatTime(fill.timestamp)}
                              </td>
                              <td className="table-cell py-2 px-3">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    (fill.direction ?? 0) > 0
                                      ? "bg-green-900 text-green-300"
                                      : "bg-red-900 text-red-300"
                                  }`}
                                >
                                  {(fill.direction ?? 0) > 0 ? "ENTRY" : "EXIT"}
                                </span>
                              </td>
                              <td className="table-cell text-right py-2 px-3">
                                $
                                {fill.fill_price?.toFixed(2) ??
                                  fill.benchmark_price?.toFixed(2)}
                              </td>
                              <td className="table-cell text-right py-2 px-3">
                                ${fill.notional_usd?.toFixed(2)}
                              </td>
                              <td className="table-cell text-right py-2 px-3">
                                {fill.slippage_bps?.toFixed(3)}
                              </td>
                              <td
                                className={`table-cell text-right py-2 px-3 ${(fill.net_alpha_bps ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}
                              >
                                {fill.net_alpha_bps?.toFixed(3)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-slate-400 text-center py-8">
                      No fill data available
                    </div>
                  )}
                </div>
              )}
              {activeTab === "orders" && (
                <div className="overflow-x-auto">
                  {detailsLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                  ) : resultDetails?.orders &&
                    resultDetails.orders.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="table-row text-slate-400 border-b border-slate-700">
                          <th className="table-header-cell text-left py-2 px-3">
                            Time
                          </th>
                          <th className="table-header-cell text-left py-2 px-3">
                            Order ID
                          </th>
                          <th className="table-header-cell text-left py-2 px-3">
                            Side
                          </th>
                          <th className="table-header-cell text-right py-2 px-3">
                            Price
                          </th>
                          <th className="table-header-cell text-right py-2 px-3">
                            Amount
                          </th>
                          <th className="table-header-cell text-left py-2 px-3">
                            Status
                          </th>
                          <th className="table-header-cell text-left py-2 px-3">
                            Algorithm
                          </th>
                          <th className="table-header-cell text-left py-2 px-3">
                            Parent Order
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultDetails.orders
                          .sort(
                            (a, b) =>
                              new Date(a.timestamp).getTime() -
                              new Date(b.timestamp).getTime(),
                          )
                          .slice(0, 100)
                          .map((order: Order) => (
                            <tr
                              key={order.id}
                              className="table-row border-b border-slate-800 hover:bg-slate-800/50"
                            >
                              <td className="table-cell py-2 px-3">
                                {formatTime(order.timestamp)}
                              </td>
                              <td className="table-cell py-2 px-3 font-mono text-xs">
                                {order.id.slice(0, 8)}...
                              </td>
                              <td className="table-cell py-2 px-3">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    order.side === "BUY"
                                      ? "bg-green-900 text-green-300"
                                      : "bg-red-900 text-red-300"
                                  }`}
                                >
                                  {order.side}
                                </span>
                              </td>
                              <td className="table-cell text-right py-2 px-3">
                                ${order.price.toFixed(2)}
                              </td>
                              <td className="table-cell text-right py-2 px-3">
                                {order.amount.toFixed(4)}
                              </td>
                              <td className="table-cell py-2 px-3">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    order.status === "FILLED"
                                      ? "bg-blue-900 text-blue-300"
                                      : order.status === "REJECTED" ||
                                          order.status === "CANCELLED"
                                        ? "bg-red-900 text-red-300"
                                        : "bg-yellow-900 text-yellow-300"
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </td>
                              <td className="table-cell py-2 px-3 text-xs text-slate-400">
                                {order.exec_algorithm || "-"}
                              </td>
                              <td className="table-cell py-2 px-3 font-mono text-xs text-slate-400">
                                {order.parent_order_id
                                  ? `${order.parent_order_id.slice(0, 8)}...`
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-slate-400 text-center py-8">
                      No orders available for this result
                    </div>
                  )}
                </div>
              )}
              {activeTab === "timeline" && (
                <div className="space-y-4">
                  {/* Timeline Event Summary */}
                  {alphaData && (
                    <div className="grid grid-cols-5 gap-4 mb-4">
                      <div className="metric-card">
                        <div className="metric-value text-blue-400">
                          {alphaData.summary?.num_entries ?? 0}
                        </div>
                        <div className="metric-label">Entries</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-value text-red-400">
                          {alphaData.summary?.num_exits ?? 0}
                        </div>
                        <div className="metric-label">Exits</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-value text-green-400">
                          {alphaData.summary?.tp_hits ?? 0}
                        </div>
                        <div className="metric-label">TP Hits</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-value text-red-400">
                          {alphaData.summary?.sl_hits ?? 0}
                        </div>
                        <div className="metric-label">SL Hits</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-value text-yellow-400">
                          {alphaData.summary?.candle_close_exits ?? 0}
                        </div>
                        <div className="metric-label">Candle Exits</div>
                      </div>
                    </div>
                  )}

                  {/* Timeline Events List */}
                  {alphaData?.entry_fills || alphaData?.exit_fills ? (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />

                      {/* Timeline events */}
                      <div className="space-y-4 ml-8">
                        {[
                          ...(alphaData.entry_fills?.map((f: AlphaFill) => ({
                            ...f,
                            type: "ENTRY",
                            color: "green",
                          })) || []),
                          ...(alphaData.exit_fills?.map((f: AlphaFill) => ({
                            ...f,
                            type: "EXIT",
                            color: "red",
                          })) || []),
                        ]
                          .sort(
                            (a, b) =>
                              new Date(a.timestamp).getTime() -
                              new Date(b.timestamp).getTime(),
                          )
                          .slice(0, 50)
                          .map((event, idx) => (
                            <div
                              key={idx}
                              className="relative flex items-start gap-4"
                            >
                              {/* Timeline dot */}
                              <div
                                className={`absolute -left-8 w-4 h-4 rounded-full border-2 ${
                                  event.type === "ENTRY"
                                    ? "bg-green-500 border-green-400"
                                    : "bg-red-500 border-red-400"
                                }`}
                                style={{ top: "4px" }}
                              />

                              {/* Event card */}
                              <div
                                className={`flex-1 p-3 rounded-lg border ${
                                  event.type === "ENTRY"
                                    ? "bg-green-900/20 border-green-700"
                                    : "bg-red-900/20 border-red-700"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      event.type === "ENTRY"
                                        ? "bg-green-800 text-green-200"
                                        : "bg-red-800 text-red-200"
                                    }`}
                                  >
                                    {event.type}{" "}
                                    {event.exit_type
                                      ? `(${event.exit_type})`
                                      : ""}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {formatTime(event.timestamp)}
                                  </span>
                                </div>
                                <div className="grid grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <div className="text-slate-400 text-xs">
                                      Fill Price
                                    </div>
                                    <div className="font-mono">
                                      ${event.fill_price?.toFixed(2) ?? "-"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-slate-400 text-xs">
                                      Benchmark
                                    </div>
                                    <div className="font-mono">
                                      $
                                      {event.benchmark_price?.toFixed(2) ?? "-"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-slate-400 text-xs">
                                      Slippage
                                    </div>
                                    <div
                                      className={`font-mono ${(event.slippage_bps ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}
                                    >
                                      {(event.slippage_bps ?? 0) >= 0
                                        ? "+"
                                        : ""}
                                      {event.slippage_bps?.toFixed(3) ?? "-"}{" "}
                                      bps
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-slate-400 text-xs">
                                      Notional
                                    </div>
                                    <div className="font-mono">
                                      $
                                      {event.notional_usd?.toLocaleString() ??
                                        "-"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-center py-8">
                      No timeline events available. Select a config with
                      execution data.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <div className="card-body text-center py-8 text-slate-400">
            Select a config from the dropdown above to view details
          </div>
        </div>
      )}
    </div>
  );
}
