"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle,
  Clock,
  Database,
  Download,
  FileText,
  FlaskConical,
  GitBranch,
  LineChart,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Settings,
  Sliders,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface QuantDashboardProps {
  currentPage: string
}

// Mock data
interface BacktestRun {
  id: string
  name: string
  strategy: string
  status: "completed" | "running" | "queued" | "failed" | "promoted"
  period: string
  trades: number
  winRate: number
  pnl: number
  sharpe: number
  maxDrawdown: number
  completedAt?: string
  progress?: number
  error?: string
  promotedAt?: string
  liveAllocation?: number // USD allocated to live trading
}

const initialBacktestRuns: BacktestRun[] = [
  { id: "bt-001", name: "momentum_btc_1h", strategy: "Momentum", status: "promoted", period: "2023-01-01 to 2024-01-15", trades: 1247, winRate: 58.4, pnl: 142500, sharpe: 1.85, maxDrawdown: 12.4, completedAt: "2h ago", promotedAt: "1h ago", liveAllocation: 500000 },
  { id: "bt-002", name: "mean_reversion_eth", strategy: "Mean Reversion", status: "completed", period: "2023-01-01 to 2024-01-15", trades: 2156, winRate: 62.1, pnl: 98400, sharpe: 1.52, maxDrawdown: 8.7, completedAt: "4h ago" },
  { id: "bt-003", name: "arb_eth_btc", strategy: "Statistical Arb", status: "running", period: "2023-06-01 to 2024-01-15", trades: 0, winRate: 0, pnl: 0, sharpe: 0, maxDrawdown: 0, progress: 34 },
  { id: "bt-004", name: "funding_arb_multi", strategy: "Funding Arb", status: "queued", period: "2023-01-01 to 2024-01-15", trades: 0, winRate: 0, pnl: 0, sharpe: 0, maxDrawdown: 0 },
  { id: "bt-005", name: "trend_following_sol", strategy: "Trend Following", status: "failed", period: "2023-01-01 to 2024-01-15", trades: 0, winRate: 0, pnl: 0, sharpe: 0, maxDrawdown: 0, error: "Insufficient data for SOL before 2023-03" },
]

const mlTrainingJobs = [
  { id: "ml-001", name: "price_predictor_v2", model: "LSTM", status: "completed", accuracy: 67.4, loss: 0.032, epochs: 100, duration: "4h 23m", completedAt: "1h ago" },
  { id: "ml-002", name: "signal_classifier", model: "XGBoost", status: "completed", accuracy: 72.1, loss: 0.28, epochs: 500, duration: "45m", completedAt: "3h ago" },
  { id: "ml-003", name: "volatility_forecast", model: "Transformer", status: "running", accuracy: 0, loss: 0.045, epochs: 50, duration: "2h 15m", progress: 62 },
  { id: "ml-004", name: "regime_detector", model: "HMM", status: "queued", accuracy: 0, loss: 0, epochs: 0, duration: "-", progress: 0 },
]

const configParameters = [
  { name: "lookback_period", type: "int", min: 10, max: 200, default: 50, current: 50, description: "Number of bars to look back" },
  { name: "entry_threshold", type: "float", min: 0.5, max: 3.0, default: 1.5, current: 1.5, description: "Z-score threshold for entry" },
  { name: "exit_threshold", type: "float", min: 0.1, max: 1.0, default: 0.5, current: 0.5, description: "Z-score threshold for exit" },
  { name: "max_position_size", type: "float", min: 0.01, max: 1.0, default: 0.1, current: 0.1, description: "Max position as % of portfolio" },
  { name: "stop_loss_pct", type: "float", min: 0.5, max: 10.0, default: 2.0, current: 2.0, description: "Stop loss percentage" },
  { name: "use_trailing_stop", type: "bool", default: true, current: true, description: "Enable trailing stop loss" },
  { name: "rebalance_freq", type: "string", options: ["1m", "5m", "15m", "1h", "4h", "1d"], default: "1h", current: "1h", description: "Rebalancing frequency" },
]

const features = [
  { name: "price_momentum_1h", category: "Momentum", freshness: "2s", coverage: "99.8%", status: "live" },
  { name: "volume_profile_15m", category: "Volume", freshness: "5s", coverage: "99.5%", status: "live" },
  { name: "funding_rate_btc", category: "Funding", freshness: "10s", coverage: "100%", status: "live" },
  { name: "correlation_btc_eth", category: "Correlation", freshness: "1m", coverage: "99.2%", status: "live" },
  { name: "volatility_ewma", category: "Volatility", freshness: "3s", coverage: "99.9%", status: "live" },
  { name: "order_imbalance", category: "Microstructure", freshness: "500ms", coverage: "98.5%", status: "degraded" },
  { name: "sentiment_score", category: "Alternative", freshness: "5m", coverage: "95.0%", status: "live" },
]

const executionAlpha = [
  { strategy: "BTC Basis v3", trades: 1247, signal: "+$412k", executed: "+$398k", slippage: "-$14k", alpha: "+$3.2k" },
  { strategy: "ETH Staked", trades: 892, signal: "+$289k", executed: "+$281k", slippage: "-$8k", alpha: "+$1.8k" },
  { strategy: "ML Directional", trades: 567, signal: "-$18k", executed: "-$22k", slippage: "-$4k", alpha: "-$1.2k" },
  { strategy: "Sports Arb", trades: 234, signal: "+$44k", executed: "+$42k", slippage: "-$2k", alpha: "+$0.5k" },
]

function getStatusIcon(status: string) {
  switch (status) {
    case "completed": return <CheckCircle className="h-4 w-4 text-positive" />
    case "promoted": return <Rocket className="h-4 w-4 text-[var(--accent-blue)]" />
    case "running": return <RefreshCw className="h-4 w-4 animate-spin text-info" />
    case "queued": return <Clock className="h-4 w-4 text-muted-foreground" />
    case "failed": return <XCircle className="h-4 w-4 text-destructive" />
    default: return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

// Main Quant Dashboard
function QuantOverview() {
  const [backtestRuns, setBacktestRuns] = React.useState<BacktestRun[]>(initialBacktestRuns)
  const [promotingBacktest, setPromotingBacktest] = React.useState<BacktestRun | null>(null)
  const [allocationAmount, setAllocationAmount] = React.useState<string>("250000")
  
  const completedBacktests = backtestRuns.filter(b => b.status === "completed").length
  const promotedBacktests = backtestRuns.filter(b => b.status === "promoted").length
  const runningJobs = backtestRuns.filter(b => b.status === "running").length + mlTrainingJobs.filter(m => m.status === "running").length
  const avgSharpe = (backtestRuns.filter(b => b.sharpe > 0).reduce((sum, b) => sum + b.sharpe, 0) / backtestRuns.filter(b => b.sharpe > 0).length).toFixed(2)
  
  const handlePromote = (bt: BacktestRun) => {
    setPromotingBacktest(bt)
    setAllocationAmount("250000")
  }
  
  const confirmPromotion = () => {
    if (!promotingBacktest) return
    setBacktestRuns(prev => prev.map(bt => 
      bt.id === promotingBacktest.id 
        ? { ...bt, status: "promoted" as const, promotedAt: "just now", liveAllocation: parseInt(allocationAmount) }
        : bt
    ))
    setPromotingBacktest(null)
  }

  return (
    <div className="p-4 space-y-4">
      {/* Promotion Modal */}
      {promotingBacktest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <Card className="w-[500px] shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-blue)]/10">
                  <Rocket className="h-5 w-5 text-[var(--accent-blue)]" />
                </div>
                <div>
                  <CardTitle className="text-lg">Promote to Live Trading</CardTitle>
                  <CardDescription>Deploy {promotingBacktest.name} to production</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Strategy Summary */}
              <div className="grid grid-cols-4 gap-3 p-3 rounded-lg bg-muted/50">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Sharpe</div>
                  <div className="font-mono font-medium text-[var(--accent-blue)]">{promotingBacktest.sharpe}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                  <div className="font-mono font-medium">{promotingBacktest.winRate}%</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Simulated P&L</div>
                  <div className="font-mono font-medium text-positive">+${(promotingBacktest.pnl / 1000).toFixed(0)}k</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Max DD</div>
                  <div className="font-mono font-medium text-negative">{promotingBacktest.maxDrawdown}%</div>
                </div>
              </div>
              
              {/* Allocation Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Allocation (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input 
                    type="text" 
                    value={allocationAmount}
                    onChange={(e) => setAllocationAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    className="pl-7 font-mono"
                    placeholder="250000"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {[100000, 250000, 500000, 1000000].map(amt => (
                    <Button
                      key={amt}
                      variant={allocationAmount === String(amt) ? "secondary" : "outline"}
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setAllocationAmount(String(amt))}
                    >
                      ${(amt / 1000).toFixed(0)}k
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Warning */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/30">
                <AlertTriangle className="h-4 w-4 text-[var(--status-warning)] mt-0.5" />
                <div className="text-xs">
                  <span className="font-medium">Risk Warning:</span> This will deploy the strategy with real capital. 
                  Simulated performance does not guarantee live results. Position sizing and risk limits will be enforced.
                </div>
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 px-6 pb-4">
              <Button variant="outline" onClick={() => setPromotingBacktest(null)}>
                Cancel
              </Button>
              <Button onClick={confirmPromotion} className="bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/90">
                <Rocket className="h-3.5 w-3.5 mr-1.5" />
                Promote to Live
              </Button>
            </div>
          </Card>
        </div>
      )}
    
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Quant Dashboard</h1>
          <p className="text-xs text-muted-foreground">Research, backtesting, and ML training</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            Config Grid
          </Button>
          <Button size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Backtest
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{backtestRuns.length}</p>
                <p className="text-xs text-muted-foreground">Total Backtests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-positive/10">
                <CheckCircle className="h-5 w-5 text-positive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedBacktests}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-blue)]/10">
                <Rocket className="h-5 w-5 text-[var(--accent-blue)]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{promotedBacktests}</p>
                <p className="text-xs text-muted-foreground">Live</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <RefreshCw className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{runningJobs}</p>
                <p className="text-xs text-muted-foreground">Running</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{avgSharpe}</p>
                <p className="text-xs text-muted-foreground">Avg Sharpe</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-positive/10">
                <TrendingUp className="h-5 w-5 text-positive" />
              </div>
              <div>
                <p className="text-2xl font-bold">60.3%</p>
                <p className="text-xs text-muted-foreground">Avg Win Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-12">
        {/* Backtest Runs */}
        <Card className="col-span-7">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Recent Backtests
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-6 text-xs">View All</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              {backtestRuns.map((bt, idx) => (
                <div
                  key={bt.id}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 hover:bg-muted/50 cursor-pointer",
                    idx !== backtestRuns.length - 1 && "border-b border-border/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(bt.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{bt.name}</span>
                        <Badge variant="outline" className="text-[9px]">{bt.strategy}</Badge>
                        {bt.status === "promoted" && (
                          <Badge className="text-[9px] bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]">LIVE</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {bt.status === "completed" ? `${bt.trades} trades | ${bt.winRate}% win rate` : 
                         bt.status === "promoted" ? `Allocated $${((bt.liveAllocation || 0) / 1000).toFixed(0)}k | ${bt.promotedAt}` :
                         bt.status === "running" ? `Progress: ${bt.progress}%` : 
                         bt.status === "failed" ? bt.error : "Queued"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {bt.status === "completed" && (
                      <>
                        <div className="text-right">
                          <div className={cn("font-mono font-medium", bt.pnl >= 0 ? "text-positive" : "text-negative")}>
                            {bt.pnl >= 0 ? "+" : ""}${(bt.pnl / 1000).toFixed(0)}k
                          </div>
                          <div className="text-xs text-muted-foreground">Sharpe: {bt.sharpe}</div>
                        </div>
                        {bt.sharpe >= 1.5 && bt.pnl > 0 && (
                          <Button 
                            size="sm" 
                            className="h-7 text-xs bg-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/90"
                            onClick={(e) => { e.stopPropagation(); handlePromote(bt) }}
                          >
                            <Rocket className="h-3 w-3 mr-1" />
                            Promote
                          </Button>
                        )}
                      </>
                    )}
                    {bt.status === "promoted" && (
                      <div className="text-right">
                        <div className={cn("font-mono font-medium", bt.pnl >= 0 ? "text-positive" : "text-negative")}>
                          {bt.pnl >= 0 ? "+" : ""}${(bt.pnl / 1000).toFixed(0)}k
                        </div>
                        <div className="text-xs text-muted-foreground">Sharpe: {bt.sharpe}</div>
                      </div>
                    )}
                    {bt.status === "running" && (
                      <Progress value={bt.progress} className="w-24 h-1.5" />
                    )}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* ML Training Jobs */}
        <Card className="col-span-5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                ML Training
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-6 text-xs">View All</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              {mlTrainingJobs.map((job, idx) => (
                <div
                  key={job.id}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 hover:bg-muted/50 cursor-pointer",
                    idx !== mlTrainingJobs.length - 1 && "border-b border-border/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{job.name}</span>
                        <Badge variant="outline" className="text-[9px]">{job.model}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {job.status === "completed" ? `${job.epochs} epochs | ${job.duration}` : job.status === "running" ? `Epoch ${Math.floor(job.epochs * (job.progress || 0) / 100)}/${job.epochs}` : "Queued"}
                      </div>
                    </div>
                  </div>
                  {job.status === "completed" && (
                    <div className="text-right">
                      <div className="font-mono font-medium">{job.accuracy}%</div>
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                    </div>
                  )}
                  {job.status === "running" && (
                    <Progress value={job.progress} className="w-20 h-1.5" />
                  )}
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Backtest Page
function BacktestPage() {
  const [selectedBacktest, setSelectedBacktest] = React.useState<string | null>("bt-001")
  const backtestRuns = initialBacktestRuns

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Backtesting</h1>
          <p className="text-xs text-muted-foreground">Historical strategy testing and analysis</p>
        </div>
        <Button size="sm">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          New Backtest
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Backtest List */}
        <div className="col-span-4">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Backtest Runs</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search backtests..." className="h-8 pl-8 text-sm" />
              </div>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-1">
                {backtestRuns.map((bt) => (
                  <button
                    key={bt.id}
                    onClick={() => setSelectedBacktest(bt.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                      selectedBacktest === bt.id ? "bg-primary/10" : "hover:bg-muted"
                    )}
                  >
                    {getStatusIcon(bt.status)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{bt.name}</span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{bt.strategy}</span>
                        {bt.status === "completed" && (
                          <>
                            <span>-</span>
                            <span className={bt.pnl >= 0 ? "text-positive" : "text-negative"}>
                              {bt.pnl >= 0 ? "+" : ""}{(bt.pnl / 1000).toFixed(0)}k
                            </span>
                          </>
                        )}
                      </div>
                      {bt.status === "running" && <Progress value={bt.progress} className="mt-1.5 h-1" />}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Backtest Details */}
        <div className="col-span-8">
          {selectedBacktest && (() => {
            const bt = backtestRuns.find(b => b.id === selectedBacktest)
            if (!bt || bt.status !== "completed") {
              return (
                <Card>
                  <CardContent className="p-12 text-center text-muted-foreground">
                    {bt?.status === "running" ? (
                      <div className="space-y-4">
                        <RefreshCw className="h-12 w-12 animate-spin text-info mx-auto" />
                        <p className="text-lg font-medium">Backtest Running</p>
                        <Progress value={bt.progress} className="h-2 w-64 mx-auto" />
                      </div>
                    ) : bt?.status === "failed" ? (
                      <div className="space-y-4">
                        <XCircle className="h-12 w-12 text-destructive mx-auto" />
                        <p className="text-lg font-medium text-destructive">Backtest Failed</p>
                        <p className="text-sm">{bt.error}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Clock className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="text-lg font-medium">Queued</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            }

            return (
              <div className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Total P&L</p>
                      <p className={cn("mt-1 text-2xl font-bold", bt.pnl >= 0 ? "text-positive" : "text-negative")}>
                        {bt.pnl >= 0 ? "+" : ""}${(bt.pnl / 1000).toFixed(0)}k
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
                      <p className="mt-1 text-2xl font-bold">{bt.sharpe}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Win Rate</p>
                      <p className="mt-1 text-2xl font-bold">{bt.winRate}%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Max Drawdown</p>
                      <p className="mt-1 text-2xl font-bold text-negative">-{bt.maxDrawdown}%</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Backtest Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Strategy</span>
                          <Badge variant="outline">{bt.strategy}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Period</span>
                          <span className="text-sm">{bt.period}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Trades</span>
                          <span className="text-sm font-medium">{bt.trades.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Status</span>
                          <div className="flex items-center gap-1.5">
                            {getStatusIcon(bt.status)}
                            <span className="capitalize">{bt.status}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Completed</span>
                          <span className="text-sm">{bt.completedAt}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

// Config Grid Page - This is the key new feature for cartesian product config generation
function ConfigGridPage() {
  const [gridDimensions, setGridDimensions] = React.useState(2)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Config Grid Generator</h1>
          <p className="text-xs text-muted-foreground">Generate parameter grids for backtesting</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export Grid
          </Button>
          <Button size="sm">
            <Play className="h-3.5 w-3.5 mr-1.5" />
            Run Grid Search
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-12">
        {/* Parameter Configuration */}
        <Card className="col-span-8">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                Parameter Configuration
              </CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Grid dimensions:</span>
                <Select value={gridDimensions.toString()} onValueChange={(v) => setGridDimensions(parseInt(v))}>
                  <SelectTrigger className="w-[60px] h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1D</SelectItem>
                    <SelectItem value="2">2D</SelectItem>
                    <SelectItem value="3">3D</SelectItem>
                    <SelectItem value="4">4D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {configParameters.map((param) => (
                <div key={param.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{param.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({param.type})</span>
                    </div>
                    {param.type === "bool" ? (
                      <Switch checked={param.current as boolean} />
                    ) : param.type === "string" ? (
                      <Select value={param.current as string}>
                        <SelectTrigger className="w-[100px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {param.options?.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="font-mono text-sm">{param.current}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{param.description}</p>
                  {(param.type === "int" || param.type === "float") && (
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground w-12">{param.min}</span>
                      <Slider
                        value={[param.current as number]}
                        min={param.min}
                        max={param.max}
                        step={param.type === "float" ? 0.1 : 1}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-12 text-right">{param.max}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Grid Preview */}
        <Card className="col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Grid Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">Total Combinations</div>
                <div className="text-2xl font-bold mt-1">2,048</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">Estimated Runtime</div>
                <div className="text-2xl font-bold mt-1">~4h 30m</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">Parameters in Grid</div>
                <div className="text-lg font-bold mt-1">{gridDimensions} dimensions</div>
                <div className="text-xs text-muted-foreground mt-1">
                  lookback_period, entry_threshold
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ML Training Page
function TrainingPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">ML Training</h1>
          <p className="text-xs text-muted-foreground">Model training jobs and results</p>
        </div>
        <Button size="sm">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          New Training Job
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Job</th>
                <th className="px-4 py-3 text-center font-medium">Model</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Accuracy</th>
                <th className="px-4 py-3 text-right font-medium">Loss</th>
                <th className="px-4 py-3 text-right font-medium">Epochs</th>
                <th className="px-4 py-3 text-right font-medium">Duration</th>
              </tr>
            </thead>
            <tbody>
              {mlTrainingJobs.map((job) => (
                <tr key={job.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{job.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{job.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[10px]">{job.model}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">{getStatusIcon(job.status)}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {job.accuracy > 0 ? `${job.accuracy}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {job.loss > 0 ? job.loss.toFixed(4) : "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{job.epochs > 0 ? job.epochs : "-"}</td>
                  <td className="px-4 py-3 text-right">{job.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

// Features Page
function FeaturesPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Feature Store</h1>
          <p className="text-xs text-muted-foreground">Feature catalog and freshness monitoring</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Feature</th>
                <th className="px-4 py-3 text-center font-medium">Category</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Freshness</th>
                <th className="px-4 py-3 text-right font-medium">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => (
                <tr key={feature.name} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{feature.name}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[10px]">{feature.category}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {feature.status === "live" ? (
                      <CheckCircle className="h-4 w-4 text-positive inline" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning inline" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{feature.freshness}</td>
                  <td className="px-4 py-3 text-right font-mono">{feature.coverage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

// Results/Execution Alpha Page
function ResultsPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Execution Alpha</h1>
          <p className="text-xs text-muted-foreground">Signal vs execution performance analysis</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Strategy</th>
                <th className="px-4 py-3 text-right font-medium">Trades</th>
                <th className="px-4 py-3 text-right font-medium">Signal P&L</th>
                <th className="px-4 py-3 text-right font-medium">Executed P&L</th>
                <th className="px-4 py-3 text-right font-medium">Slippage</th>
                <th className="px-4 py-3 text-right font-medium">Exec Alpha</th>
              </tr>
            </thead>
            <tbody>
              {executionAlpha.map((row) => (
                <tr key={row.strategy} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{row.strategy}</td>
                  <td className="px-4 py-3 text-right font-mono">{row.trades.toLocaleString()}</td>
                  <td className={cn("px-4 py-3 text-right font-mono", row.signal.startsWith("+") ? "text-positive" : "text-negative")}>
                    {row.signal}
                  </td>
                  <td className={cn("px-4 py-3 text-right font-mono", row.executed.startsWith("+") ? "text-positive" : "text-negative")}>
                    {row.executed}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-negative">{row.slippage}</td>
                  <td className={cn("px-4 py-3 text-right font-mono font-medium", row.alpha.startsWith("+") ? "text-positive" : "text-negative")}>
                    {row.alpha}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

export function QuantDashboard({ currentPage }: QuantDashboardProps) {
  switch (currentPage) {
    case "backtest":
      return <BacktestPage />
    case "config":
      return <ConfigGridPage />
    case "training":
      return <TrainingPage />
    case "features":
      return <FeaturesPage />
    case "results":
      return <ResultsPage />
    case "dashboard":
    default:
      return <QuantOverview />
  }
}
