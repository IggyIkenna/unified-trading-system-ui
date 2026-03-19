"use client"

import * as React from "react"
import { AppShell } from "@/components/trading/app-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/trading/status-badge"
import { PnLValue } from "@/components/trading/pnl-value"
import { SparklineCell } from "@/components/trading/kpi-card"
import { EntityLink } from "@/components/trading/entity-link"
import {
  STRATEGIES,
  getTotalAUM,
  getTotalPnL,
  getTotalMTDPnL,
} from "@/lib/strategy-registry"
import { formatCurrency } from "@/lib/reference-data"
import Link from "next/link"
import { 
  Activity,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  AlertTriangle,
  Zap,
  ArrowRight,
  RefreshCw,
  Radio,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

// Generate sparkline data for portfolio overview
const generatePortfolioData = () => {
  const data = []
  let value = 10000000
  for (let i = 0; i < 30; i++) {
    value = value * (1 + (Math.random() - 0.48) * 0.02)
    data.push({
      day: i + 1,
      value: value,
      pnl: (Math.random() - 0.4) * 50000,
    })
  }
  return data
}

// Generate recent alerts
const recentAlerts = [
  { id: 1, type: "warning", message: "ETH Basis spread widened to 0.8%", strategy: "DEFI_ETH_BASIS_SCE_1H", time: "2m ago" },
  { id: 2, type: "info", message: "BTC Options MM rebalanced delta", strategy: "CEFI_BTC_OPT_MM_EVT_TICK", time: "5m ago" },
  { id: 3, type: "success", message: "Football arb executed +$2,340", strategy: "SPORTS_FOOTBALL_ARB_EVT", time: "12m ago" },
  { id: 4, type: "warning", message: "SOL perp funding rate spike", strategy: "CEFI_SOL_PERP_FUND_EVT_TICK", time: "18m ago" },
]

// Generate recent fills
const recentFills = [
  { id: 1, instrument: "BTC-PERP", side: "buy", size: 0.5, price: 67234.50, venue: "Hyperliquid", time: "1m ago" },
  { id: 2, instrument: "ETH/USDT", side: "sell", size: 2.3, price: 3456.78, venue: "Binance", time: "3m ago" },
  { id: 3, instrument: "SOL-PERP", side: "buy", size: 15, price: 156.42, venue: "Hyperliquid", time: "5m ago" },
  { id: 4, instrument: "BTC/USD", side: "sell", size: 0.25, price: 67250.00, venue: "Deribit", time: "8m ago" },
  { id: 5, instrument: "ETH-PERP", side: "buy", size: 1.8, price: 3458.50, venue: "Hyperliquid", time: "12m ago" },
]

export default function TraderPage() {
  const portfolioData = React.useMemo(() => generatePortfolioData(), [])
  const totalAUM = getTotalAUM()
  const totalPnL = getTotalPnL()
  const totalMTDPnL = getTotalMTDPnL()
  
  // Get live strategies
  const liveStrategies = STRATEGIES.filter(s => s.status === "live")
  const warningStrategies = STRATEGIES.filter(s => s.status === "warning")
  
  // Calculate summary stats
  const totalPositions = STRATEGIES.reduce((acc, s) => acc + (s.performance?.positions || 0), 0)
  const avgSharpe = STRATEGIES.reduce((acc, s) => acc + (s.performance?.sharpe || 0), 0) / STRATEGIES.length

  return (
    <AppShell 
      title="Trader Dashboard" 
      subtitle="Quick portfolio overview"
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 text-emerald-500 border-emerald-500/30">
            <Radio className="size-2.5 animate-pulse" />
            Live
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCw className="size-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total AUM</p>
                  <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalAUM)}</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="size-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Today P&L</p>
                  <PnLValue value={totalPnL} size="lg" />
                </div>
                <div className={cn(
                  "p-2 rounded-lg",
                  totalPnL >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"
                )}>
                  {totalPnL >= 0 ? (
                    <TrendingUp className="size-5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="size-5 text-rose-500" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">MTD P&L</p>
                  <PnLValue value={totalMTDPnL} size="lg" />
                </div>
                <div className={cn(
                  "p-2 rounded-lg",
                  totalMTDPnL >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"
                )}>
                  <BarChart3 className="size-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active Strategies</p>
                  <p className="text-2xl font-bold tabular-nums">{liveStrategies.length}</p>
                  {warningStrategies.length > 0 && (
                    <p className="text-xs text-amber-500">{warningStrategies.length} warnings</p>
                  )}
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Activity className="size-5 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Chart - 2 columns */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Portfolio Performance</CardTitle>
                  <CardDescription>30-day cumulative P&L</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Sharpe: {avgSharpe.toFixed(2)}</Badge>
                  <Badge variant="outline" className="text-xs">{totalPositions} positions</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={portfolioData}>
                    <defs>
                      <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      tickFormatter={(v) => `D${v}`}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                      domain={["dataMin - 100000", "dataMax + 100000"]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "Portfolio Value"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#portfolioGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Alerts</CardTitle>
                <Link href="/alerts">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    View All
                    <ArrowRight className="size-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                  <div className={cn(
                    "p-1 rounded",
                    alert.type === "warning" && "bg-amber-500/20 text-amber-500",
                    alert.type === "info" && "bg-blue-500/20 text-blue-500",
                    alert.type === "success" && "bg-emerald-500/20 text-emerald-500",
                  )}>
                    {alert.type === "warning" ? (
                      <AlertTriangle className="size-3.5" />
                    ) : alert.type === "success" ? (
                      <Zap className="size-3.5" />
                    ) : (
                      <Activity className="size-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <EntityLink type="strategy" id={alert.strategy} label={alert.strategy} />
                      <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strategy Summary */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Top Performing Strategies</CardTitle>
                <Link href="/strategies">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    View All
                    <ArrowRight className="size-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...STRATEGIES]
                  .sort((a, b) => (b.performance?.pnlTotal || 0) - (a.performance?.pnlTotal || 0))
                  .slice(0, 5)
                  .map((strategy) => (
                    <div key={strategy.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={strategy.status} showDot />
                        <div>
                          <Link href={`/strategies/${strategy.id}`} className="text-sm font-medium hover:underline">
                            {strategy.name}
                          </Link>
                          <p className="text-xs text-muted-foreground">{strategy.assetClass}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <SparklineCell data={strategy.sparklineData || []} />
                        <PnLValue value={strategy.performance?.pnlTotal || 0} size="sm" />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Fills */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Fills</CardTitle>
                <Link href="/trading">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Trade
                    <ArrowRight className="size-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentFills.map((fill) => (
                  <div key={fill.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] h-5 px-1.5",
                          fill.side === "buy" ? "text-emerald-500 border-emerald-500/30" : "text-rose-500 border-rose-500/30"
                        )}
                      >
                        {fill.side.toUpperCase()}
                      </Badge>
                      <div>
                        <p className="text-sm font-mono font-medium">{fill.instrument}</p>
                        <p className="text-xs text-muted-foreground">{fill.venue}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono tabular-nums">
                        {fill.size} @ ${fill.price.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{fill.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
