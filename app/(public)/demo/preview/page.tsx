"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { BarChart3, Grid3X3, Activity, Database, Play, Lock, ArrowRight, Eye, AlertCircle } from "lucide-react";
import { formatNumber } from "@/lib/utils/formatters";

// Demo banner component
function DemoBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/95 text-black py-3 px-4">
      <div className="container mx-auto flex items-center justify-center gap-3 text-sm font-medium">
        <AlertCircle className="size-4 flex-shrink-0" />
        <span className="text-center">
          Platform Preview — Static demonstration only. Full interactive demo available during scheduled presentation.
        </span>
      </div>
    </div>
  );
}

// Mock heatmap data
const heatmapData = [
  {
    strategy: "VWAP Momentum",
    crypto: 2.4,
    tradfi: 1.8,
    defi: 3.1,
    sports: 0,
    perps: 2.9,
  },
  {
    strategy: "Mean Reversion",
    crypto: 1.9,
    tradfi: 2.2,
    defi: 1.4,
    sports: 0,
    perps: 2.1,
  },
  {
    strategy: "Arb Basis",
    crypto: 3.2,
    tradfi: 1.1,
    defi: 2.8,
    sports: 0,
    perps: 3.5,
  },
  {
    strategy: "Yield Farm",
    crypto: 0,
    tradfi: 0,
    defi: 4.1,
    sports: 0,
    perps: 0,
  },
  {
    strategy: "Sports ML",
    crypto: 0,
    tradfi: 0,
    defi: 0,
    sports: 2.7,
    perps: 0,
  },
  {
    strategy: "Funding Rate",
    crypto: 2.1,
    tradfi: 0,
    defi: 1.9,
    sports: 0,
    perps: 3.8,
  },
];

// Mock backtest data
const backtestResults = [
  {
    id: "BT-2847",
    strategy: "VWAP Momentum",
    status: "completed",
    sharpe: 2.41,
    drawdown: -8.2,
    trades: 1247,
  },
  {
    id: "BT-2846",
    strategy: "Mean Reversion",
    status: "completed",
    sharpe: 1.89,
    drawdown: -12.1,
    trades: 892,
  },
  {
    id: "BT-2845",
    strategy: "Arb Basis",
    status: "running",
    sharpe: null,
    drawdown: null,
    trades: 456,
  },
  {
    id: "BT-2844",
    strategy: "Funding Rate",
    status: "completed",
    sharpe: 3.12,
    drawdown: -5.4,
    trades: 2103,
  },
];

// Mock live positions
const livePositions = [
  { symbol: "BTC-PERP", side: "LONG", size: 2.5, pnl: 1247.32, entry: 67420 },
  { symbol: "ETH-PERP", side: "SHORT", size: 15.2, pnl: -342.18, entry: 3891 },
  { symbol: "SOL-PERP", side: "LONG", size: 120, pnl: 891.45, entry: 178.2 },
];

// Heatmap cell
function HeatmapCell({ value, max }: { value: number; max: number }) {
  if (value === 0) return <div className="w-full h-8 bg-muted/20 rounded" />;
  const intensity = value / max;
  const color = intensity > 0.7 ? "bg-emerald-500" : intensity > 0.4 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div
      className={cn("w-full h-8 rounded flex items-center justify-center text-xs font-medium text-white", color)}
      style={{ opacity: 0.4 + intensity * 0.6 }}
    >
      {formatNumber(value, 1)}
    </div>
  );
}

export default function DemoPreview() {
  const [activeView, setActiveView] = React.useState<"heatmap" | "backtests" | "live" | "data">("heatmap");

  return (
    <div className="min-h-screen bg-background">
      <DemoBanner />

      {/* Header */}
      <header className="border-b border-border pt-16">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold tracking-tight">
              <span className="text-primary">Olympus</span>
              <span className="text-muted-foreground ml-1 text-sm font-normal">Platform Preview</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <Lock className="size-3" />
              Demo Mode
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <Link href="/presentation">Back to Presentation</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* View Selector */}
      <div className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 py-2">
            {[
              { id: "heatmap", label: "Strategy Heatmap", icon: Grid3X3 },
              { id: "backtests", label: "Backtest Results", icon: BarChart3 },
              { id: "live", label: "Live Trading", icon: Activity },
              { id: "data", label: "Data Coverage", icon: Database },
            ].map((view) => (
              <Button
                key={view.id}
                variant={activeView === view.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveView(view.id as typeof activeView)}
                className="gap-2"
              >
                <view.icon className="size-4" />
                {view.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-32">
        {/* Heatmap View */}
        {activeView === "heatmap" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Strategy Performance Heatmap</h1>
                <p className="text-muted-foreground mt-1">Cross-asset strategy performance by Sharpe ratio</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">6 Strategies</Badge>
                <Badge variant="secondary">5 Asset Classes</Badge>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Performance Matrix</CardTitle>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-emerald-500 rounded" />
                      <span>High</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-amber-500 rounded" />
                      <span>Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-3 bg-rose-500 rounded" />
                      <span>Low</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Strategy</th>
                        <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">Crypto</th>
                        <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">TradFi</th>
                        <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">DeFi</th>
                        <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">Sports</th>
                        <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">Perps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {heatmapData.map((row, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-2 px-3 text-sm font-medium">{row.strategy}</td>
                          <td className="py-2 px-3">
                            <HeatmapCell value={row.crypto} max={4.1} />
                          </td>
                          <td className="py-2 px-3">
                            <HeatmapCell value={row.tradfi} max={4.1} />
                          </td>
                          <td className="py-2 px-3">
                            <HeatmapCell value={row.defi} max={4.1} />
                          </td>
                          <td className="py-2 px-3">
                            <HeatmapCell value={row.sports} max={4.1} />
                          </td>
                          <td className="py-2 px-3">
                            <HeatmapCell value={row.perps} max={4.1} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Backtests View */}
        {activeView === "backtests" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Backtest Results</h1>
                <p className="text-muted-foreground mt-1">Historical strategy simulation results</p>
              </div>
              <Badge variant="secondary">4 Recent Runs</Badge>
            </div>

            <div className="grid gap-4">
              {backtestResults.map((bt) => (
                <Card key={bt.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-mono text-sm text-muted-foreground">{bt.id}</div>
                          <div className="font-semibold">{bt.strategy}</div>
                        </div>
                        <Badge variant={bt.status === "completed" ? "secondary" : "outline"}>
                          {bt.status === "running" && <Play className="size-3 mr-1 animate-pulse" />}
                          {bt.status}
                        </Badge>
                      </div>
                      {bt.status === "completed" && (
                        <div className="flex items-center gap-8 text-sm">
                          <div className="text-center">
                            <div className="text-muted-foreground">Sharpe</div>
                            <div className="font-semibold text-emerald-500">
                              {bt.sharpe != null ? formatNumber(bt.sharpe, 2) : "—"}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-muted-foreground">Max DD</div>
                            <div className="font-semibold text-rose-500">{bt.drawdown}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-muted-foreground">Trades</div>
                            <div className="font-semibold">{bt.trades?.toLocaleString()}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Live Trading View */}
        {activeView === "live" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Live Trading Monitor</h1>
                <p className="text-muted-foreground mt-1">Real-time position and P&L tracking</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-muted-foreground">Live</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-500">$1,796.59</div>
                  <div className="text-sm text-muted-foreground">Total Unrealised P&L</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">3</div>
                  <div className="text-sm text-muted-foreground">Active Positions</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">$847.2K</div>
                  <div className="text-sm text-muted-foreground">Notional Exposure</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Open Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-sm text-muted-foreground">
                      <th className="text-left py-2">Symbol</th>
                      <th className="text-left py-2">Side</th>
                      <th className="text-right py-2">Size</th>
                      <th className="text-right py-2">Entry</th>
                      <th className="text-right py-2">Unrealised P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {livePositions.map((pos, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-3 font-mono font-medium">{pos.symbol}</td>
                        <td className="py-3">
                          <Badge variant={pos.side === "LONG" ? "default" : "destructive"} className="text-xs">
                            {pos.side}
                          </Badge>
                        </td>
                        <td className="py-3 text-right font-mono">{pos.size}</td>
                        <td className="py-3 text-right font-mono">${pos.entry.toLocaleString()}</td>
                        <td
                          className={cn(
                            "py-3 text-right font-mono font-semibold",
                            pos.pnl > 0 ? "text-emerald-500" : "text-rose-500",
                          )}
                        >
                          {pos.pnl > 0 ? "+" : ""}${pos.pnl.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Data Coverage View */}
        {activeView === "data" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Data Coverage</h1>
                <p className="text-muted-foreground mt-1">Unified schema across 5 asset classes</p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {[
                {
                  name: "TradFi",
                  venues: 12,
                  instruments: "50K+",
                  color: "text-cyan-500",
                },
                {
                  name: "Crypto",
                  venues: 45,
                  instruments: "800K+",
                  color: "text-orange-500",
                },
                {
                  name: "DeFi",
                  venues: 38,
                  instruments: "400K+",
                  color: "text-violet-500",
                },
                {
                  name: "Sports",
                  venues: 8,
                  instruments: "250K+",
                  color: "text-emerald-500",
                },
                {
                  name: "Perps",
                  venues: 25,
                  instruments: "15K+",
                  color: "text-rose-500",
                },
              ].map((asset) => (
                <Card key={asset.name}>
                  <CardContent className="p-4 text-center">
                    <div className={cn("text-lg font-bold", asset.color)}>{asset.name}</div>
                    <div className="mt-2 text-2xl font-bold">{asset.venues}</div>
                    <div className="text-xs text-muted-foreground">Venues</div>
                    <div className="mt-2 text-sm font-medium">{asset.instruments}</div>
                    <div className="text-xs text-muted-foreground">Instruments</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sample Venues by Asset Class</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-cyan-500 mb-2">TradFi</div>
                    <div className="space-y-1 text-muted-foreground">
                      <div>IBKR</div>
                      <div>CME</div>
                      <div>NYSE</div>
                      <div>NASDAQ</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-orange-500 mb-2">Crypto</div>
                    <div className="space-y-1 text-muted-foreground">
                      <div>Binance</div>
                      <div>OKX</div>
                      <div>Bybit</div>
                      <div>Coinbase</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-violet-500 mb-2">DeFi</div>
                    <div className="space-y-1 text-muted-foreground">
                      <div>Uniswap</div>
                      <div>Aave</div>
                      <div>Curve</div>
                      <div>GMX</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-emerald-500 mb-2">Sports</div>
                    <div className="space-y-1 text-muted-foreground">
                      <div>Pinnacle</div>
                      <div>Betfair</div>
                      <div>DraftKings</div>
                      <div>BetMGM</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-rose-500 mb-2">Perps</div>
                    <div className="space-y-1 text-muted-foreground">
                      <div>dYdX</div>
                      <div>Hyperliquid</div>
                      <div>Vertex</div>
                      <div>Drift</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Locked Overlay Hint */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <Card className="bg-card/95 backdrop-blur border-amber-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <Eye className="size-5 text-amber-500 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium">Preview Mode</span>
              <span className="text-muted-foreground ml-2">
                Interactive features disabled. Schedule a presentation for full access.
              </span>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/demo">
                Request Demo
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
