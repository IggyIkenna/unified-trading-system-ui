"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Code2,
  Database,
  Download,
  FlaskConical,
  Play,
  Search,
  SlidersHorizontal,
  TestTube,
  Trash2,
  Waves,
  Zap,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import { MOCK_INSTRUMENTS } from "@/lib/mocks/fixtures/research-pages";

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const NOTEBOOK_CELLS = [
  {
    id: 1,
    type: "code" as const,
    source: `# Portfolio Optimization — Efficient Frontier Analysis
import pandas as pd
import numpy as np
from scipy.optimize import minimize

# Load returns data
assets = ["BTC-USD", "ETH-USD", "SOL-USD", "AVAX-USD", "MATIC-USD"]
returns = pd.DataFrame(
    np.random.randn(252, 5) * 0.02 + 0.001,
    columns=assets,
    index=pd.date_range("2025-01-01", periods=252, freq="B"),
)

# Compute correlation matrix
corr_matrix = returns.corr()
print(corr_matrix.round(3))`,
    output: null as string | null,
    outputType: "table" as const,
  },
  {
    id: 2,
    type: "output" as const,
    source: "",
    output: "correlation_matrix",
    outputType: "table" as const,
  },
  {
    id: 3,
    type: "code" as const,
    source: `# Compute efficient frontier
n_portfolios = 5000
results = np.zeros((3, n_portfolios))
weights_record = []

for i in range(n_portfolios):
    weights = np.random.random(5)
    weights /= np.sum(weights)
    weights_record.append(weights)
    portfolio_return = np.sum(returns.mean() * weights) * 252
    portfolio_std = np.sqrt(
        np.dot(weights.T, np.dot(returns.cov() * 252, weights))
    )
    results[0, i] = portfolio_std
    results[1, i] = portfolio_return
    results[2, i] = portfolio_return / portfolio_std  # Sharpe

max_sharpe_idx = np.argmax(results[2])
print(f"Max Sharpe Portfolio: Return={results[1,max_sharpe_idx]:.2%}, "
      f"Vol={results[0,max_sharpe_idx]:.2%}, "
      f"Sharpe={results[2,max_sharpe_idx]:.2f}")`,
    output: "Max Sharpe Portfolio: Return=42.18%, Vol=18.34%, Sharpe=2.30",
    outputType: "text" as const,
  },
  {
    id: 4,
    type: "chart" as const,
    source: `# Plot efficient frontier
import matplotlib.pyplot as plt
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

plt.figure(figsize=(12, 6))
plt.scatter(results[0,:], results[1,:], c=results[2,:],
            cmap="viridis", marker="o", s=10, alpha=0.3)
plt.colorbar(label="Sharpe Ratio")
plt.scatter(results[0,max_sharpe_idx], results[1,max_sharpe_idx],
            marker="*", color="red", s=500, label="Max Sharpe")
plt.xlabel("Annualised Volatility")
plt.ylabel("Annualised Return")
plt.title("Efficient Frontier — 5-Asset Crypto Portfolio")
plt.legend()
plt.show()`,
    output: "Efficient Frontier Plot",
    outputType: "chart" as const,
  },
];

const CORRELATION_DATA = [
  { asset: "BTC-USD", btc: "1.000", eth: "0.842", sol: "0.714", avax: "0.681", matic: "0.623" },
  { asset: "ETH-USD", btc: "0.842", eth: "1.000", sol: "0.768", avax: "0.729", matic: "0.694" },
  { asset: "SOL-USD", btc: "0.714", eth: "0.768", sol: "1.000", avax: "0.812", matic: "0.756" },
  { asset: "AVAX-USD", btc: "0.681", eth: "0.729", sol: "0.812", avax: "1.000", matic: "0.834" },
  { asset: "MATIC-USD", btc: "0.623", eth: "0.694", sol: "0.756", avax: "0.834", matic: "1.000" },
];

const BACKTEST_STRATEGIES = [
  "ETH Basis Trade v3",
  "BTC Momentum Breakout v2",
  "Cross-Venue Stat Arb",
  "Funding Rate Arb v2",
  "Mean Reversion BTC",
  "Vol Surface v1",
];

const SIGNAL_BLOCKS = [
  {
    name: "RSI(14)",
    params: "Period: 14, Overbought: 70, Oversold: 30",
    weight: 0.35,
    color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  },
  {
    name: "MACD(12,26,9)",
    params: "Fast: 12, Slow: 26, Signal: 9",
    weight: 0.3,
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
  {
    name: "Bollinger(20,2)",
    params: "Period: 20, StdDev: 2.0",
    weight: 0.2,
    color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
  },
  {
    name: "Volume Profile",
    params: "Lookback: 50, Bins: 24",
    weight: 0.15,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  },
];

type OhlcvRow = (typeof MOCK_INSTRUMENTS)[number];

const ohlcvColumns: ColumnDef<OhlcvRow>[] = [
  {
    accessorKey: "symbol",
    header: "Symbol",
    cell: ({ row }) => <span className="font-medium font-mono text-sm">{row.original.symbol}</span>,
  },
  {
    accessorKey: "venue",
    header: "Venue",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-[10px]">
        {row.original.venue}
      </Badge>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.date}</span>,
  },
  {
    accessorKey: "open",
    header: () => <span className="block text-right">Open</span>,
    cell: ({ row }) => <span className="block text-right font-mono text-sm">{row.original.open}</span>,
  },
  {
    accessorKey: "high",
    header: () => <span className="block text-right">High</span>,
    cell: ({ row }) => <span className="block text-right font-mono text-sm">{row.original.high}</span>,
  },
  {
    accessorKey: "low",
    header: () => <span className="block text-right">Low</span>,
    cell: ({ row }) => <span className="block text-right font-mono text-sm">{row.original.low}</span>,
  },
  {
    accessorKey: "close",
    header: () => <span className="block text-right">Close</span>,
    cell: ({ row }) => <span className="block text-right font-mono text-sm">{row.original.close}</span>,
  },
  {
    accessorKey: "volume",
    header: () => <span className="block text-right">Volume</span>,
    cell: ({ row }) => <span className="block text-right font-mono text-sm">{row.original.volume}</span>,
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function QuantWorkspacePage() {
  const [executionMode, setExecutionMode] = React.useState<"batch" | "live">("batch");
  const [cellOutputs, setCellOutputs] = React.useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
  });
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStrategy, setSelectedStrategy] = React.useState(BACKTEST_STRATEGIES[0]);
  const [signalTested, setSignalTested] = React.useState(false);

  function handleRunAll() {
    setCellOutputs({ 1: true, 2: true, 3: true, 4: true });
  }

  function handleClearOutput() {
    setCellOutputs({});
  }

  const filteredInstruments = searchQuery
    ? MOCK_INSTRUMENTS.filter(
        (i) =>
          i.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.venue.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : MOCK_INSTRUMENTS;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="border-b px-6 py-4">
        <PageHeader
          title="Quant Workspace"
          description="Interactive research environment for quant analysis, data exploration, and signal design"
        >
          <Badge
            variant="outline"
            className={
              executionMode === "live"
                ? "border-emerald-500/30 text-emerald-400 cursor-pointer"
                : "border-blue-500/30 text-blue-400 cursor-pointer"
            }
            onClick={() => setExecutionMode((m) => (m === "batch" ? "live" : "batch"))}
          >
            <Activity className="size-3 mr-1" />
            {executionMode === "batch" ? "Batch Mode" : "Live Mode"}
          </Badge>
        </PageHeader>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notebook" className="flex flex-col flex-1 min-h-0">
        <div className="border-b px-6">
          <TabsList className="bg-transparent h-10 p-0 gap-0">
            <TabsTrigger
              value="notebook"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"
            >
              <Code2 className="size-4 mr-1.5" />
              Notebook
            </TabsTrigger>
            <TabsTrigger
              value="data-explorer"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"
            >
              <Database className="size-4 mr-1.5" />
              Data Explorer
            </TabsTrigger>
            <TabsTrigger
              value="backtest-lab"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"
            >
              <TestTube className="size-4 mr-1.5" />
              Backtest Lab
            </TabsTrigger>
            <TabsTrigger
              value="signal-builder"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4"
            >
              <Waves className="size-4 mr-1.5" />
              Signal Builder
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Tab 1: Notebook ──────────────────────────────────────────── */}
        <TabsContent value="notebook" className="flex-1 overflow-auto p-6">
          <div className="max-w-[1200px] mx-auto space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleRunAll} className="gap-1.5">
                <Play className="size-3.5" />
                Run All
              </Button>
              <Button size="sm" variant="outline" onClick={handleClearOutput} className="gap-1.5">
                <Trash2 className="size-3.5" />
                Clear Output
              </Button>
              <div className="ml-auto text-xs text-muted-foreground">
                Kernel: Python 3.13 | {Object.values(cellOutputs).filter(Boolean).length} / {NOTEBOOK_CELLS.length}{" "}
                cells executed
              </div>
            </div>

            {/* Cells */}
            {NOTEBOOK_CELLS.map((cell) => (
              <div key={cell.id} className="border rounded-lg overflow-hidden">
                {/* Cell header */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 border-b">
                  <span className="text-[10px] font-mono text-muted-foreground">[{cell.id}]</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-muted-foreground/30">
                    {cell.type === "chart" ? "code" : cell.type}
                  </Badge>
                  {cellOutputs[cell.id] && <span className="text-[10px] text-emerald-400 ml-auto">executed</span>}
                </div>

                {/* Cell source */}
                {(cell.type === "code" || cell.type === "chart") && (
                  <pre className="p-4 text-sm font-mono leading-relaxed bg-zinc-950 text-zinc-300 overflow-x-auto whitespace-pre">
                    {cell.source}
                  </pre>
                )}

                {/* Cell output */}
                {cellOutputs[cell.id] && cell.output === "correlation_matrix" && (
                  <div className="p-4 bg-zinc-950/50 border-t">
                    <div className="text-xs text-muted-foreground mb-2 font-mono">Out[{cell.id}]:</div>
                    <div className="overflow-x-auto">
                      <table className="text-xs font-mono">
                        <thead>
                          <tr>
                            <th className="px-3 py-1 text-left text-muted-foreground" />
                            <th className="px-3 py-1 text-right text-muted-foreground">BTC</th>
                            <th className="px-3 py-1 text-right text-muted-foreground">ETH</th>
                            <th className="px-3 py-1 text-right text-muted-foreground">SOL</th>
                            <th className="px-3 py-1 text-right text-muted-foreground">AVAX</th>
                            <th className="px-3 py-1 text-right text-muted-foreground">MATIC</th>
                          </tr>
                        </thead>
                        <tbody>
                          {CORRELATION_DATA.map((row) => (
                            <tr key={row.asset}>
                              <td className="px-3 py-1 text-muted-foreground">{row.asset}</td>
                              <td className="px-3 py-1 text-right">{row.btc}</td>
                              <td className="px-3 py-1 text-right">{row.eth}</td>
                              <td className="px-3 py-1 text-right">{row.sol}</td>
                              <td className="px-3 py-1 text-right">{row.avax}</td>
                              <td className="px-3 py-1 text-right">{row.matic}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {cellOutputs[cell.id] && cell.outputType === "text" && cell.output && (
                  <div className="p-4 bg-zinc-950/50 border-t">
                    <div className="text-xs text-muted-foreground mb-1 font-mono">Out[{cell.id}]:</div>
                    <pre className="text-sm font-mono text-emerald-400">{cell.output}</pre>
                  </div>
                )}

                {cellOutputs[cell.id] && cell.outputType === "chart" && cell.type === "chart" && (
                  <div className="p-4 bg-zinc-950/50 border-t">
                    <div className="text-xs text-muted-foreground mb-2 font-mono">Out[{cell.id}]:</div>
                    <div className="h-48 rounded-lg border border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/10">
                      <div className="text-center space-y-2">
                        <BarChart3 className="size-8 text-muted-foreground/50 mx-auto" />
                        <p className="text-sm text-muted-foreground">{cell.output}</p>
                        <p className="text-[10px] text-muted-foreground/50">
                          5,000 portfolio simulations | 5 assets | Sharpe-coloured scatter
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ── Tab 2: Data Explorer ─────────────────────────────────────── */}
        <TabsContent value="data-explorer" className="flex-1 overflow-auto p-6">
          <div className="max-w-[1400px] mx-auto space-y-4">
            {/* Search bar and date range */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search instruments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>From:</span>
                <input
                  type="date"
                  defaultValue="2026-03-27"
                  className="rounded-md border bg-background px-3 py-1.5 text-sm"
                />
                <span>To:</span>
                <input
                  type="date"
                  defaultValue="2026-03-28"
                  className="rounded-md border bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <Button size="sm" variant="outline" className="gap-1.5 ml-auto">
                <Download className="size-3.5" />
                Load to Notebook
              </Button>
            </div>

            {/* Data table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="size-4" />
                  OHLCV Data
                </CardTitle>
                <CardDescription>
                  {filteredInstruments.length} records across {new Set(filteredInstruments.map((i) => i.symbol)).size}{" "}
                  instruments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={ohlcvColumns}
                  data={filteredInstruments}
                  enableColumnVisibility={false}
                  emptyMessage="No instruments match your search."
                  className="rounded-lg border p-2"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tab 3: Backtest Lab ──────────────────────────────────────── */}
        <TabsContent value="backtest-lab" className="flex-1 overflow-auto p-6">
          <div className="max-w-[1200px] mx-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Backtest Form */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FlaskConical className="size-4" />
                    Quick Backtest
                  </CardTitle>
                  <CardDescription>Configure and launch a strategy backtest</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Strategy</label>
                    <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BACKTEST_STRATEGIES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Instrument</label>
                    <Select defaultValue="BTC-USD">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC-USD">BTC-USD</SelectItem>
                        <SelectItem value="ETH-USD">ETH-USD</SelectItem>
                        <SelectItem value="SOL-USD">SOL-USD</SelectItem>
                        <SelectItem value="AVAX-USD">AVAX-USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Date</label>
                      <input
                        type="date"
                        defaultValue="2025-01-01"
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">End Date</label>
                      <input
                        type="date"
                        defaultValue="2026-03-28"
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Initial Capital</label>
                      <input
                        type="text"
                        defaultValue="$100,000"
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max Position %</label>
                      <input
                        type="text"
                        defaultValue="25%"
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono"
                      />
                    </div>
                  </div>

                  <Button className="w-full gap-1.5">
                    <Play className="size-3.5" />
                    Run Backtest
                  </Button>
                </CardContent>
              </Card>

              {/* Results Panel */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="size-4" />
                    Results
                  </CardTitle>
                  <CardDescription>{selectedStrategy} on BTC-USD</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">Sharpe Ratio</div>
                      <div className="text-2xl font-bold font-mono">1.82</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">Sortino Ratio</div>
                      <div className="text-2xl font-bold font-mono">2.14</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">Max Drawdown</div>
                      <div className="text-2xl font-bold font-mono text-red-400">-8.2%</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground">Total Return</div>
                      <div className="text-2xl font-bold font-mono text-emerald-400">+42.3%</div>
                    </div>
                  </div>

                  {/* Equity curve placeholder */}
                  <div className="h-32 rounded-lg border border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/10">
                    <div className="text-center space-y-1">
                      <Activity className="size-6 text-muted-foreground/50 mx-auto" />
                      <p className="text-xs text-muted-foreground">Equity Curve</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Link href="/services/research/strategy/results" className="flex-1">
                      <Button variant="outline" className="w-full gap-1.5" size="sm">
                        View Full Results
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 4: Signal Builder ────────────────────────────────────── */}
        <TabsContent value="signal-builder" className="flex-1 overflow-auto p-6">
          <div className="max-w-[1200px] mx-auto space-y-6">
            {/* Signal blocks */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <SlidersHorizontal className="size-4" />
                  Composite Signal
                </CardTitle>
                <CardDescription>
                  Drag indicator blocks to build a weighted signal. Total weight:{" "}
                  {formatNumber(
                    SIGNAL_BLOCKS.reduce((s, b) => s + b.weight, 0),
                    2,
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {SIGNAL_BLOCKS.map((block) => (
                  <div key={block.name} className={`flex items-center gap-4 p-4 rounded-lg border ${block.color}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{block.name}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          w={formatNumber(block.weight, 2)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{block.params}</p>
                    </div>
                    <div className="w-32">
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-current opacity-60"
                          style={{ width: `${block.weight * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                        {formatPercent(block.weight * 100, 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Actions + Signal chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Test Signal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Instrument</label>
                      <Select defaultValue="BTC-USD">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BTC-USD">BTC-USD</SelectItem>
                          <SelectItem value="ETH-USD">ETH-USD</SelectItem>
                          <SelectItem value="SOL-USD">SOL-USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Lookback</label>
                      <Select defaultValue="30d">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7d">7 days</SelectItem>
                          <SelectItem value="30d">30 days</SelectItem>
                          <SelectItem value="90d">90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full gap-1.5" onClick={() => setSignalTested(true)}>
                    <Zap className="size-3.5" />
                    Test Signal
                  </Button>
                  <Link href="/services/research/signals">
                    <Button variant="outline" className="w-full gap-1.5" size="sm">
                      <BookOpen className="size-3.5" />
                      Save to Signals
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Signal Output</CardTitle>
                </CardHeader>
                <CardContent>
                  {signalTested ? (
                    <div className="space-y-3">
                      <div className="h-40 rounded-lg border border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/10">
                        <div className="text-center space-y-1">
                          <Waves className="size-6 text-muted-foreground/50 mx-auto" />
                          <p className="text-xs text-muted-foreground">Composite Signal vs BTC-USD Price (30d)</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-2 rounded bg-muted/30 text-center">
                          <div className="text-[10px] text-muted-foreground">Signals</div>
                          <div className="text-sm font-mono font-bold">47</div>
                        </div>
                        <div className="p-2 rounded bg-muted/30 text-center">
                          <div className="text-[10px] text-muted-foreground">Hit Rate</div>
                          <div className="text-sm font-mono font-bold text-emerald-400">62%</div>
                        </div>
                        <div className="p-2 rounded bg-muted/30 text-center">
                          <div className="text-[10px] text-muted-foreground">Avg Return</div>
                          <div className="text-sm font-mono font-bold text-emerald-400">+0.8%</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-52 flex items-center justify-center text-muted-foreground/50">
                      <div className="text-center space-y-2">
                        <Waves className="size-8 mx-auto opacity-30" />
                        <p className="text-sm">Run a signal test to see results</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
