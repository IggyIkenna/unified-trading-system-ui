"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ContextBar } from "@/components/platform/context-bar"
import { BatchLiveRail } from "@/components/platform/batch-live-rail"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Calendar,
  Layers,
  Target,
  Zap,
  DollarSign,
  Percent,
} from "lucide-react"
import { BACKTEST_RUNS as DEFAULT_BACKTEST_RUNS } from "@/lib/strategy-platform-mock-data"
import { cn } from "@/lib/utils"
import { useStrategyPerformance } from "@/hooks/api/use-strategies"

// Generate mock time series data for a backtest run
function generateTimeSeriesData(runId: string, days: number = 180) {
  const seed = runId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const data = []
  let cumPnl = 0
  let maxPnl = 0
  
  for (let i = 0; i < days; i++) {
    const r = ((seed * (i + 1) * 9301 + 49297) % 233280) / 233280
    const dailyReturn = (r - 0.48) * 0.03
    cumPnl += dailyReturn
    maxPnl = Math.max(maxPnl, cumPnl)
    const drawdown = cumPnl - maxPnl
    
    const date = new Date(2024, 0, 1)
    date.setDate(date.getDate() + i)
    
    data.push({
      date: date.toISOString().split("T")[0],
      pnl: cumPnl,
      drawdown: drawdown,
      dailyReturn: dailyReturn,
      sharpe: (cumPnl / (i + 1)) * 16, // Annualized pseudo-sharpe
      trades: Math.floor(r * 20) + 5,
      exposure: 0.5 + r * 0.4,
    })
  }
  
  return data
}

// Generate regime breakdown data
function generateRegimeData(runId: string) {
  const seed = runId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const r = (i: number) => ((seed * i * 9301 + 49297) % 233280) / 233280
  
  return [
    { regime: "Trending", sharpe: 1.5 + r(1) * 1.5, return: 0.12 + r(2) * 0.1, drawdown: 0.02 + r(3) * 0.03, days: 45 },
    { regime: "Mean Revert", sharpe: 1.2 + r(4) * 1.0, return: 0.08 + r(5) * 0.08, drawdown: 0.03 + r(6) * 0.03, days: 38 },
    { regime: "Volatile", sharpe: 0.3 + r(7) * 0.8, return: 0.02 + r(8) * 0.06, drawdown: 0.06 + r(9) * 0.06, days: 22 },
    { regime: "Low Vol", sharpe: 1.0 + r(10) * 0.8, return: 0.05 + r(11) * 0.05, drawdown: 0.01 + r(12) * 0.02, days: 30 },
  ]
}

// Generate attribution data
function generateAttributionData(runId: string) {
  const seed = runId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const r = (i: number) => ((seed * i * 9301 + 49297) % 233280) / 233280
  
  const grossPnl = 280000 + r(1) * 80000
  const slippage = 15000 + r(2) * 10000
  const fees = 8000 + r(3) * 5000
  const funding = 5000 + r(4) * 8000
  
  return {
    grossPnl,
    slippage,
    fees,
    funding,
    netPnl: grossPnl - slippage - fees - funding,
  }
}

// PnL Chart
function PnLChart({ data }: { data: ReturnType<typeof generateTimeSeriesData> }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--surface-strategy)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--surface-strategy)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: 12,
          }}
          formatter={(v: number) => [`${(v * 100).toFixed(2)}%`, "Cumulative PnL"]}
          labelFormatter={(v) => new Date(v).toLocaleDateString()}
        />
        <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
        <Area
          type="monotone"
          dataKey="pnl"
          stroke="var(--surface-strategy)"
          fill="url(#pnlGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Drawdown Chart
function DrawdownChart({ data }: { data: ReturnType<typeof generateTimeSeriesData> }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--status-critical)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--status-critical)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short" })}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          domain={["dataMin", 0]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: 12,
          }}
          formatter={(v: number) => [`${(v * 100).toFixed(2)}%`, "Drawdown"]}
        />
        <Area
          type="monotone"
          dataKey="drawdown"
          stroke="var(--status-critical)"
          fill="url(#ddGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Regime Performance Chart
function RegimeChart({ data }: { data: ReturnType<typeof generateRegimeData> }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
        <XAxis type="number" tick={{ fontSize: 10 }} />
        <YAxis dataKey="regime" type="category" tick={{ fontSize: 11 }} width={80} />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: 12,
          }}
        />
        <Legend />
        <Bar dataKey="sharpe" name="Sharpe" fill="var(--surface-strategy)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Attribution Waterfall
function AttributionWaterfall({ data }: { data: ReturnType<typeof generateAttributionData> }) {
  const waterfallData = [
    { name: "Gross PnL", value: data.grossPnl, fill: "var(--status-live)" },
    { name: "Slippage", value: -data.slippage, fill: "var(--status-critical)" },
    { name: "Fees", value: -data.fees, fill: "var(--status-critical)" },
    { name: "Funding", value: -data.funding, fill: "var(--status-warning)" },
    { name: "Net PnL", value: data.netPnl, fill: "var(--surface-strategy)" },
  ]

  return (
    <div className="space-y-3">
      {waterfallData.map((item) => (
        <div key={item.name} className="flex items-center gap-4">
          <div className="w-20 text-xs text-muted-foreground">{item.name}</div>
          <div className="flex-1 h-6 bg-muted/30 rounded relative overflow-hidden">
            <div
              className="h-full rounded transition-all"
              style={{
                width: `${Math.abs(item.value) / data.grossPnl * 100}%`,
                backgroundColor: item.fill,
              }}
            />
          </div>
          <div className={cn("w-24 text-right font-mono text-sm", item.value < 0 && "text-[var(--status-critical)]")}>
            {item.value < 0 ? "-" : ""}${Math.abs(item.value).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  )
}

// KPI Summary Card
function KPISummary({ run }: { run: typeof DEFAULT_BACKTEST_RUNS[0] }) {
  if (!run.metrics) return null

  const kpis = [
    { label: "Sharpe", value: run.metrics.sharpe.toFixed(2), icon: TrendingUp },
    { label: "Return", value: `${(run.metrics.totalReturn * 100).toFixed(1)}%`, icon: Percent, positive: run.metrics.totalReturn >= 0 },
    { label: "Max DD", value: `${(run.metrics.maxDrawdown * 100).toFixed(1)}%`, icon: TrendingDown, negative: true },
    { label: "Hit Rate", value: `${(run.metrics.hitRate * 100).toFixed(0)}%`, icon: Target },
    { label: "Sortino", value: run.metrics.sortino.toFixed(2), icon: Activity },
    { label: "Calmar", value: run.metrics.calmar.toFixed(2), icon: Zap },
  ]

  return (
    <div className="grid grid-cols-6 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <kpi.icon className="size-3" />
              {kpi.label}
            </div>
            <div
              className={cn(
                "text-xl font-mono font-bold",
                kpi.positive === true && "text-[var(--status-live)]",
                kpi.positive === false && "text-[var(--status-critical)]",
                kpi.negative && "text-[var(--status-critical)]"
              )}
            >
              {kpi.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function StrategyResultsPage() {
  const { data: perfData, isLoading } = useStrategyPerformance()
  const perfRaw: any[] = (perfData as any)?.data ?? (perfData as any)?.backtestRuns ?? []
  const BACKTEST_RUNS = perfRaw.length > 0 ? perfRaw : DEFAULT_BACKTEST_RUNS

  const [context, setContext] = React.useState<"BATCH" | "LIVE">("BATCH")
  const [selectedRunId, setSelectedRunId] = React.useState<string>(BACKTEST_RUNS[0]?.id ?? "")

  const selectedRun = BACKTEST_RUNS.find((r: any) => r.id === selectedRunId)
  const timeSeriesData = React.useMemo(
    () => generateTimeSeriesData(selectedRunId),
    [selectedRunId]
  )
  const regimeData = React.useMemo(
    () => generateRegimeData(selectedRunId),
    [selectedRunId]
  )
  const attributionData = React.useMemo(
    () => generateAttributionData(selectedRunId),
    [selectedRunId]
  )

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

  return (
    <div className="flex flex-col flex-1">
      {/* Context Bar */}
      <ContextBar
        platform="strategy"
        scope={{ fund: "ODUM", client: "Internal" }}
        context={context}
        templateName={selectedRun?.templateName}
        configVersion={selectedRun?.configVersion}
        dataSource={selectedRun?.dataSource}
        asOfDate={selectedRun?.asOfDate}
      />

      {/* Batch/Live Rail */}
      <BatchLiveRail
        platform="strategy"
        currentStage="Backtest"
        context={context}
        onContextChange={setContext}
      />

      {/* Run Selector */}
      <div className="flex items-center gap-4 px-6 py-3 border-b">
        <span className="text-sm text-muted-foreground">Backtest Run:</span>
        <Select value={selectedRunId} onValueChange={setSelectedRunId}>
          <SelectTrigger className="w-[400px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BACKTEST_RUNS.filter((r) => r.status === "completed").map((run) => (
              <SelectItem key={run.id} value={run.id}>
                <div className="flex items-center gap-2">
                  <span>{run.templateName}</span>
                  <Badge variant="outline" className="text-[10px]">v{run.configVersion}</Badge>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{run.instrument}</span>
                  <span className="text-muted-foreground">{run.venue}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="ml-auto">
          {selectedRun?.dateWindow.start} - {selectedRun?.dateWindow.end}
        </Badge>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* KPI Summary */}
        {selectedRun && <KPISummary run={selectedRun} />}

        {/* Charts */}
        <Tabs defaultValue="pnl" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pnl" className="gap-2">
              <TrendingUp className="size-4" />
              PnL Curve
            </TabsTrigger>
            <TabsTrigger value="drawdown" className="gap-2">
              <TrendingDown className="size-4" />
              Drawdown
            </TabsTrigger>
            <TabsTrigger value="regime" className="gap-2">
              <Layers className="size-4" />
              Regime Analysis
            </TabsTrigger>
            <TabsTrigger value="attribution" className="gap-2">
              <DollarSign className="size-4" />
              PnL Attribution
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pnl">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cumulative PnL</CardTitle>
              </CardHeader>
              <CardContent>
                <PnLChart data={timeSeriesData} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="drawdown">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Drawdown Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <DrawdownChart data={timeSeriesData} />
                <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <div className="text-xs text-muted-foreground">Max Drawdown</div>
                    <div className="text-lg font-mono font-bold text-[var(--status-critical)]">
                      {(Math.min(...timeSeriesData.map((d) => d.drawdown)) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Avg Drawdown</div>
                    <div className="text-lg font-mono font-bold">
                      {(timeSeriesData.reduce((a, d) => a + d.drawdown, 0) / timeSeriesData.length * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Recovery Days (Avg)</div>
                    <div className="text-lg font-mono font-bold">12</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Underwater %</div>
                    <div className="text-lg font-mono font-bold">
                      {((timeSeriesData.filter((d) => d.drawdown < -0.01).length / timeSeriesData.length) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regime">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Performance by Market Regime</CardTitle>
              </CardHeader>
              <CardContent>
                <RegimeChart data={regimeData} />
                <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                  {regimeData.map((r) => (
                    <div key={r.regime} className="p-3 rounded-lg bg-muted/30">
                      <div className="text-xs font-medium mb-2">{r.regime}</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sharpe</span>
                          <span className="font-mono">{r.sharpe.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Return</span>
                          <span className="font-mono">{(r.return * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Days</span>
                          <span className="font-mono">{r.days}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attribution">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">PnL Attribution</CardTitle>
              </CardHeader>
              <CardContent>
                <AttributionWaterfall data={attributionData} />
                <div className="grid grid-cols-2 gap-6 mt-6 pt-4 border-t">
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-3">Cost Breakdown</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Slippage Cost</span>
                        <span className="font-mono text-[var(--status-critical)]">
                          ${attributionData.slippage.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trading Fees</span>
                        <span className="font-mono text-[var(--status-critical)]">
                          ${attributionData.fees.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Funding Cost</span>
                        <span className="font-mono text-[var(--status-warning)]">
                          ${attributionData.funding.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t font-medium">
                        <span>Total Costs</span>
                        <span className="font-mono">
                          ${(attributionData.slippage + attributionData.fees + attributionData.funding).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-3">Cost Ratios</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Cost / Gross</span>
                        <span className="font-mono">
                          {(((attributionData.slippage + attributionData.fees + attributionData.funding) / attributionData.grossPnl) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Slippage / Trade</span>
                        <span className="font-mono">~$42</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Net / Gross</span>
                        <span className="font-mono text-[var(--status-live)]">
                          {((attributionData.netPnl / attributionData.grossPnl) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
