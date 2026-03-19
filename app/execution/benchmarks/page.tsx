"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ExecutionNav } from "@/components/execution-platform/execution-nav"
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  BarChart3,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  Info,
} from "lucide-react"

// Benchmark definitions
const BENCHMARKS = [
  { id: "arrival", name: "Arrival Price", description: "Price at order submission" },
  { id: "vwap", name: "VWAP", description: "Volume-weighted average price" },
  { id: "twap", name: "TWAP", description: "Time-weighted average price" },
  { id: "close", name: "Close", description: "End of period close price" },
  { id: "open", name: "Open", description: "Start of period open price" },
  { id: "midpoint", name: "Midpoint", description: "Bid-ask midpoint at arrival" },
]

// Mock benchmark performance data
const mockBenchmarkPerformance = [
  { algoId: "TWAP_AGGRESSIVE", algoName: "TWAP Aggressive", arrival: -1.2, vwap: -0.8, twap: 0.1, close: -2.1, open: 0.5, midpoint: -1.0 },
  { algoId: "TWAP_PASSIVE", algoName: "TWAP Passive", arrival: -0.4, vwap: 0.2, twap: 0.3, close: -1.2, open: 0.9, midpoint: -0.2 },
  { algoId: "VWAP_STANDARD", algoName: "VWAP Standard", arrival: -0.9, vwap: 0.1, twap: -0.5, close: -1.8, open: 0.3, midpoint: -0.7 },
  { algoId: "POV_10", algoName: "POV 10%", arrival: -0.6, vwap: 0.3, twap: 0.1, close: -1.5, open: 0.7, midpoint: -0.4 },
  { algoId: "IS_ADAPTIVE", algoName: "IS Adaptive", arrival: 0.2, vwap: 0.8, twap: 0.5, close: -0.9, open: 1.1, midpoint: 0.4 },
  { algoId: "ICEBERG", algoName: "Iceberg", arrival: -1.5, vwap: -1.0, twap: -0.7, close: -2.4, open: 0.1, midpoint: -1.3 },
  { algoId: "SNIPER", algoName: "Sniper", arrival: 0.5, vwap: 1.1, twap: 0.8, close: -0.5, open: 1.4, midpoint: 0.7 },
]

// Mock time series data for benchmark slippage
const generateSlippageTimeSeries = () => {
  const days = 30
  const data = []
  for (let i = 0; i < days; i++) {
    const date = new Date(2026, 2, 18 - (days - i - 1))
    data.push({
      date: date.toISOString().split("T")[0],
      arrival: (Math.random() - 0.5) * 3,
      vwap: (Math.random() - 0.5) * 2,
      twap: (Math.random() - 0.5) * 2,
    })
  }
  return data
}

const slippageTimeSeries = generateSlippageTimeSeries()

// Helper to format basis points
const formatBps = (value: number) => {
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(1)} bps`
}

// Helper to get color for performance
const getPerformanceColor = (value: number) => {
  if (value > 0.5) return "text-emerald-500"
  if (value > 0) return "text-emerald-400"
  if (value > -0.5) return "text-amber-500"
  return "text-red-500"
}

export default function ExecutionBenchmarksPage() {
  const [selectedBenchmark, setSelectedBenchmark] = React.useState("arrival")
  const [timeRange, setTimeRange] = React.useState("30d")
  const [selectedAlgo, setSelectedAlgo] = React.useState<string | null>(null)

  // Calculate aggregate stats
  const avgSlippage = mockBenchmarkPerformance.reduce((sum, p) => sum + p.arrival, 0) / mockBenchmarkPerformance.length
  const bestPerformer = mockBenchmarkPerformance.reduce((best, p) => p.arrival > best.arrival ? p : best)
  const worstPerformer = mockBenchmarkPerformance.reduce((worst, p) => p.arrival < worst.arrival ? p : worst)

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <ExecutionNav />
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Benchmark Analysis</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Compare execution quality against standard benchmarks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="size-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Target className="size-4" />
                Avg vs Arrival
              </div>
              <div className={cn("text-2xl font-bold tabular-nums", getPerformanceColor(avgSlippage))}>
                {formatBps(avgSlippage)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Across all algos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingUp className="size-4" />
                Best Performer
              </div>
              <div className="text-2xl font-bold tabular-nums text-emerald-500">
                {formatBps(bestPerformer.arrival)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{bestPerformer.algoName}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <TrendingDown className="size-4" />
                Worst Performer
              </div>
              <div className="text-2xl font-bold tabular-nums text-red-500">
                {formatBps(worstPerformer.arrival)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{worstPerformer.algoName}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Clock className="size-4" />
                Orders Analyzed
              </div>
              <div className="text-2xl font-bold tabular-nums">
                12,847
              </div>
              <p className="text-xs text-muted-foreground mt-1">In selected period</p>
            </CardContent>
          </Card>
        </div>

        {/* Benchmark Selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Benchmark Definitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {BENCHMARKS.map((bm) => (
                <Button
                  key={bm.id}
                  variant={selectedBenchmark === bm.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedBenchmark(bm.id)}
                  className="gap-2"
                >
                  {bm.name}
                  {selectedBenchmark === bm.id && (
                    <Badge variant="secondary" className="text-xs">
                      Selected
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              <Info className="size-4 inline mr-1" />
              {BENCHMARKS.find(b => b.id === selectedBenchmark)?.description}
            </p>
          </CardContent>
        </Card>

        {/* Benchmark Heatmap */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Algo Performance vs Benchmarks (bps)</CardTitle>
                <CardDescription>Positive = outperformed benchmark, Negative = underperformed</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[180px]">Algorithm</TableHead>
                  {BENCHMARKS.map((bm) => (
                    <TableHead key={bm.id} className="text-center text-xs">
                      {bm.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockBenchmarkPerformance.map((row) => (
                  <TableRow 
                    key={row.algoId}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      selectedAlgo === row.algoId && "bg-primary/5"
                    )}
                    onClick={() => setSelectedAlgo(selectedAlgo === row.algoId ? null : row.algoId)}
                  >
                    <TableCell className="font-medium">{row.algoName}</TableCell>
                    <TableCell className="text-center">
                      <span className={cn("font-mono tabular-nums text-sm", getPerformanceColor(row.arrival))}>
                        {formatBps(row.arrival)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn("font-mono tabular-nums text-sm", getPerformanceColor(row.vwap))}>
                        {formatBps(row.vwap)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn("font-mono tabular-nums text-sm", getPerformanceColor(row.twap))}>
                        {formatBps(row.twap)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn("font-mono tabular-nums text-sm", getPerformanceColor(row.close))}>
                        {formatBps(row.close)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn("font-mono tabular-nums text-sm", getPerformanceColor(row.open))}>
                        {formatBps(row.open)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn("font-mono tabular-nums text-sm", getPerformanceColor(row.midpoint))}>
                        {formatBps(row.midpoint)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Time Series Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Slippage Over Time</CardTitle>
            <CardDescription>Daily average slippage vs selected benchmarks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center border rounded-lg bg-muted/20">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="size-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Time series chart showing daily slippage trends</p>
                <p className="text-xs mt-1">Arrival: {formatBps(avgSlippage)} avg | VWAP: {formatBps(0.15)} avg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drill-down Panel */}
        {selectedAlgo && (
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {mockBenchmarkPerformance.find(p => p.algoId === selectedAlgo)?.algoName} - Detailed Analysis
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedAlgo(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">By Order Size</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Small (&lt;$10K)</span>
                      <span className="font-mono text-emerald-500">+0.8 bps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Medium ($10K-$100K)</span>
                      <span className="font-mono text-amber-500">-0.3 bps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Large (&gt;$100K)</span>
                      <span className="font-mono text-red-500">-1.8 bps</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">By Urgency</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Low</span>
                      <span className="font-mono text-emerald-500">+0.5 bps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Medium</span>
                      <span className="font-mono text-amber-500">-0.2 bps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">High</span>
                      <span className="font-mono text-red-500">-1.5 bps</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">By Market Condition</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Low Volatility</span>
                      <span className="font-mono text-emerald-500">+0.3 bps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Normal</span>
                      <span className="font-mono text-amber-500">-0.1 bps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">High Volatility</span>
                      <span className="font-mono text-red-500">-2.1 bps</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
