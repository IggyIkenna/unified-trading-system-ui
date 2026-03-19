"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Briefcase,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  PieChart,
  BarChart3,
  FileText,
  Download,
  Calendar,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Wallet,
  Clock,
} from "lucide-react"

// Mock portfolio data
const mockPortfolio = {
  nav: 2_450_000,
  navChange: 4.2,
  invested: 2_000_000,
  totalReturn: 22.5,
  mtdReturn: 2.8,
  ytdReturn: 18.7,
  sharpe: 2.1,
  maxDrawdown: -8.4,
  highWaterMark: 2_520_000,
}

// Mock allocations
const mockAllocations = [
  { strategy: "CeFi Momentum", allocation: 35, pnl: 127500, pnlPercent: 18.2, status: "active" },
  { strategy: "DeFi Basis Carry", allocation: 25, pnl: 89000, pnlPercent: 17.8, status: "active" },
  { strategy: "Sports Value Betting", allocation: 15, pnl: 42500, pnlPercent: 14.2, status: "active" },
  { strategy: "TradFi Futures", allocation: 15, pnl: 31200, pnlPercent: 10.4, status: "active" },
  { strategy: "Cross-Asset Arb", allocation: 10, pnl: 58800, pnlPercent: 29.4, status: "active" },
]

// Mock positions
const mockPositions = [
  { asset: "BTC-PERP", venue: "Binance", side: "Long", size: 12.5, entry: 42150, current: 43280, pnl: 14125, pnlPercent: 2.68 },
  { asset: "ETH-PERP", venue: "Bybit", side: "Long", size: 85, entry: 2245, current: 2312, pnl: 5695, pnlPercent: 2.98 },
  { asset: "Uniswap V3 LP", venue: "Ethereum", side: "LP", size: null, entry: null, current: 125000, pnl: 4200, pnlPercent: 3.48 },
  { asset: "Aave USDC", venue: "Ethereum", side: "Lend", size: null, entry: null, current: 200000, pnl: 1250, pnlPercent: 0.63 },
  { asset: "ES Futures", venue: "CME", side: "Short", size: -3, entry: 5125, current: 5089, pnl: 5400, pnlPercent: 0.70 },
]

// Mock transactions
const mockTransactions = [
  { date: "Mar 15, 2026", type: "Trade", description: "BTC-PERP Long Entry", amount: 527875, status: "completed" },
  { date: "Mar 14, 2026", type: "Yield", description: "Aave USDC Interest", amount: 412.50, status: "completed" },
  { date: "Mar 13, 2026", type: "Trade", description: "ETH-PERP Partial Close", amount: -85250, status: "completed" },
  { date: "Mar 12, 2026", type: "Fee", description: "LP Fee Collection", amount: 1847.25, status: "completed" },
  { date: "Mar 10, 2026", type: "Rebalance", description: "Strategy Rebalance", amount: 0, status: "completed" },
]

// Mock reports
const mockReports = [
  { name: "February 2026 Performance Report", date: "Mar 1, 2026", type: "Monthly", size: "2.4 MB" },
  { name: "Q4 2025 Comprehensive Report", date: "Jan 15, 2026", type: "Quarterly", size: "8.7 MB" },
  { name: "January 2026 Performance Report", date: "Feb 1, 2026", type: "Monthly", size: "2.1 MB" },
  { name: "2025 Annual Report", date: "Jan 31, 2026", type: "Annual", size: "24.2 MB" },
]

export default function InvestmentPage() {
  const [period, setPeriod] = React.useState("ytd")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center gap-4 px-4 md:px-6">
          <Link href="/portal/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-400/10">
              <Briefcase className="size-4 text-rose-400" />
            </div>
            <span className="font-semibold">Investment Management</span>
          </div>
          <Badge variant="outline" className="ml-auto">
            <Shield className="mr-1 size-3" />
            FCA Regulated
          </Badge>
        </div>
      </header>

      <main className="container px-4 py-6 md:px-6">
        {/* Portfolio Overview */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Net Asset Value</div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold">${mockPortfolio.nav.toLocaleString()}</span>
              <span className={cn(
                "flex items-center text-sm font-medium",
                mockPortfolio.navChange > 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {mockPortfolio.navChange > 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                {mockPortfolio.navChange > 0 ? "+" : ""}{mockPortfolio.navChange}% MTD
              </span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Invested: ${mockPortfolio.invested.toLocaleString()} | HWM: ${mockPortfolio.highWaterMark.toLocaleString()}
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mtd">MTD</SelectItem>
                <SelectItem value="qtd">QTD</SelectItem>
                <SelectItem value="ytd">YTD</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="mr-2 size-4" />
              Export
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Return</span>
                <TrendingUp className="size-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-500">+{mockPortfolio.totalReturn}%</div>
              <div className="mt-1 text-xs text-muted-foreground">Since inception</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">YTD Return</span>
                <TrendingUp className="size-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-500">+{mockPortfolio.ytdReturn}%</div>
              <div className="mt-1 text-xs text-muted-foreground">vs benchmark +12.3%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                <Activity className="size-4 text-sky-500" />
              </div>
              <div className="mt-2 text-2xl font-bold">{mockPortfolio.sharpe}</div>
              <div className="mt-1 text-xs text-muted-foreground">Rolling 12mo</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Max Drawdown</span>
                <TrendingDown className="size-4 text-rose-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-rose-500">{mockPortfolio.maxDrawdown}%</div>
              <div className="mt-1 text-xs text-muted-foreground">Peak to trough</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fee Structure</span>
                <Percent className="size-4 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-bold">2/20</div>
              <div className="mt-1 text-xs text-muted-foreground">Mgmt / Performance</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="allocation" className="mt-8">
          <TabsList>
            <TabsTrigger value="allocation">Allocation</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Allocation */}
          <TabsContent value="allocation" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Strategy Allocation</CardTitle>
                  <CardDescription>Current portfolio allocation by strategy</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Strategy</TableHead>
                        <TableHead className="text-right">Allocation</TableHead>
                        <TableHead className="text-right">P&L</TableHead>
                        <TableHead className="text-right">Return</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockAllocations.map((alloc) => (
                        <TableRow key={alloc.strategy}>
                          <TableCell className="font-medium">{alloc.strategy}</TableCell>
                          <TableCell className="text-right">{alloc.allocation}%</TableCell>
                          <TableCell className={cn(
                            "text-right font-mono",
                            alloc.pnl > 0 ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {alloc.pnl > 0 ? "+" : ""}${alloc.pnl.toLocaleString()}
                          </TableCell>
                          <TableCell className={cn(
                            "text-right font-mono",
                            alloc.pnlPercent > 0 ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {alloc.pnlPercent > 0 ? "+" : ""}{alloc.pnlPercent}%
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">Active</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Allocation Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAllocations.map((alloc) => (
                      <div key={alloc.strategy}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>{alloc.strategy}</span>
                          <span className="font-medium">{alloc.allocation}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-rose-400"
                            style={{ width: `${alloc.allocation}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Positions */}
          <TabsContent value="positions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current Positions</CardTitle>
                <CardDescription>Live positions across all strategies</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                      <TableHead className="text-right">Entry</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockPositions.map((pos, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{pos.asset}</TableCell>
                        <TableCell className="text-muted-foreground">{pos.venue}</TableCell>
                        <TableCell>
                          <Badge variant={pos.side === "Long" ? "default" : pos.side === "Short" ? "destructive" : "secondary"}>
                            {pos.side}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {pos.size != null ? pos.size.toLocaleString() : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {pos.entry != null ? `$${pos.entry.toLocaleString()}` : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${pos.current.toLocaleString()}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-mono",
                          pos.pnl > 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {pos.pnl > 0 ? "+" : ""}${pos.pnl.toLocaleString()} ({pos.pnlPercent > 0 ? "+" : ""}{pos.pnlPercent}%)
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions */}
          <TabsContent value="transactions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Transactions</CardTitle>
                <CardDescription>Trade history and account activity</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockTransactions.map((tx, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{tx.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{tx.description}</TableCell>
                        <TableCell className={cn(
                          "text-right font-mono",
                          tx.amount > 0 ? "text-emerald-500" : tx.amount < 0 ? "text-rose-500" : ""
                        )}>
                          {tx.amount !== 0 ? (tx.amount > 0 ? "+" : "") + "$" + Math.abs(tx.amount).toLocaleString() : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                            Completed
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reports & Documents</CardTitle>
                <CardDescription>Performance reports and compliance documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockReports.map((report, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-rose-400/10">
                          <FileText className="size-5 text-rose-400" />
                        </div>
                        <div>
                          <div className="font-medium">{report.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="size-3" />
                            {report.date}
                            <span className="text-muted-foreground/50">|</span>
                            <Badge variant="secondary" className="text-xs">{report.type}</Badge>
                            <span className="text-muted-foreground/50">|</span>
                            {report.size}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 size-4" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
