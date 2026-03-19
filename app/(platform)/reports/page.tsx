"use client"

import * as React from "react"
import { AppShell } from "@/components/trading/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { EntityLink } from "@/components/trading/entity-link"
import { PnLValue, PnLChange } from "@/components/trading/pnl-value"
import { useContextState, type ContextState } from "@/components/trading/context-bar"
import {
  CLIENTS,
  ORGANIZATIONS,
  STRATEGIES,
  getFilteredStrategies,
  type FilterContext,
} from "@/lib/trading-data"
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Clock,
  Send,
  Users,
  BarChart3,
  ArrowRight,
  Receipt,
  Wallet,
  Info,
  Vault,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Mock reports data - now with clientId for filtering
const allReports = [
  {
    id: "rpt-2026-03-17-001",
    name: "Daily Performance Report",
    client: "Delta One Desk",
    clientId: "delta-one",
    date: "2026-03-17",
    status: "ready",
    format: "PDF",
    generated: "1h ago",
  },
  {
    id: "rpt-2026-03-17-002",
    name: "Weekly P&L Summary",
    client: "Quant Fund",
    clientId: "quant-fund",
    date: "2026-03-17",
    status: "ready",
    format: "PDF",
    generated: "2h ago",
  },
  {
    id: "rpt-2026-03-16-001",
    name: "Monthly Performance",
    client: "Sports Desk",
    clientId: "sports-desk",
    date: "2026-03-01",
    status: "sent",
    format: "PDF",
    generated: "16d ago",
  },
  {
    id: "rpt-2026-03-17-003",
    name: "Risk Exposure Report",
    client: "DeFi Desk",
    clientId: "defi-desk",
    date: "2026-03-17",
    status: "generating",
    format: "CSV",
    generated: null,
  },
  {
    id: "rpt-2026-03-17-004",
    name: "Weekly Performance",
    client: "Main Fund",
    clientId: "alpha-main",
    date: "2026-03-17",
    status: "ready",
    format: "PDF",
    generated: "3h ago",
  },
  {
    id: "rpt-2026-03-17-005",
    name: "Crypto Desk Report",
    client: "Crypto Desk",
    clientId: "alpha-crypto",
    date: "2026-03-17",
    status: "ready",
    format: "PDF",
    generated: "4h ago",
  },
  {
    id: "rpt-2026-03-17-006",
    name: "Core Strategy Report",
    client: "Core Strategy",
    clientId: "vertex-core",
    date: "2026-03-17",
    status: "sent",
    format: "PDF",
    generated: "5h ago",
  },
]

// Mock settlements data - with clientId for filtering
const allSettlements = [
  {
    id: "sett-2026-03-17-001",
    client: "Delta One Desk",
    clientId: "delta-one",
    date: "2026-03-17",
    amount: 142500,
    status: "pending",
    type: "profit_share",
    dueDate: "2026-03-20",
  },
  {
    id: "sett-2026-03-17-002",
    client: "Quant Fund",
    clientId: "quant-fund",
    date: "2026-03-17",
    amount: 89200,
    status: "confirmed",
    type: "profit_share",
    dueDate: "2026-03-20",
  },
  {
    id: "sett-2026-03-15-001",
    client: "Sports Desk",
    clientId: "sports-desk",
    date: "2026-03-15",
    amount: 34800,
    status: "settled",
    type: "profit_share",
    dueDate: "2026-03-18",
  },
  {
    id: "sett-2026-03-10-001",
    client: "Main Fund",
    clientId: "alpha-main",
    date: "2026-03-10",
    amount: 121000,
    status: "settled",
    type: "profit_share",
    dueDate: "2026-03-13",
  },
  {
    id: "sett-2026-03-10-002",
    client: "Core Strategy",
    clientId: "vertex-core",
    date: "2026-03-10",
    amount: 185000,
    status: "settled",
    type: "profit_share",
    dueDate: "2026-03-13",
  },
]

// Mock portfolio summary - with clientId for filtering
const allPortfolioSummary = [
  { client: "Delta One Desk", clientId: "delta-one", orgId: "odum", aum: 5000000, mtdReturn: 8.2, ytdReturn: 24.5, sharpe: 2.1 },
  { client: "Quant Fund", clientId: "quant-fund", orgId: "odum", aum: 8000000, mtdReturn: 5.1, ytdReturn: 18.3, sharpe: 1.8 },
  { client: "Sports Desk", clientId: "sports-desk", orgId: "odum", aum: 2000000, mtdReturn: 12.4, ytdReturn: 31.2, sharpe: 1.6 },
  { client: "DeFi Desk", clientId: "defi-desk", orgId: "odum", aum: 3000000, mtdReturn: 9.8, ytdReturn: 28.1, sharpe: 2.3 },
  { client: "Main Fund", clientId: "alpha-main", orgId: "alpha-capital", aum: 10000000, mtdReturn: 4.2, ytdReturn: 15.6, sharpe: 1.5 },
  { client: "Crypto Desk", clientId: "alpha-crypto", orgId: "alpha-capital", aum: 5000000, mtdReturn: 6.3, ytdReturn: 22.1, sharpe: 1.9 },
  { client: "Core Strategy", clientId: "vertex-core", orgId: "vertex-partners", aum: 15000000, mtdReturn: 7.1, ytdReturn: 19.8, sharpe: 1.7 },
]

// Mock invoices - with clientId for filtering
const allInvoices = [
  { id: "inv-2026-03-001", client: "Delta One Desk", clientId: "delta-one", amount: 28500, status: "paid", date: "2026-03-01" },
  { id: "inv-2026-03-002", client: "Quant Fund", clientId: "quant-fund", amount: 16400, status: "paid", date: "2026-03-01" },
  { id: "inv-2026-03-003", client: "Sports Desk", clientId: "sports-desk", amount: 4200, status: "pending", date: "2026-03-01" },
  { id: "inv-2026-03-004", client: "Main Fund", clientId: "alpha-main", amount: 45000, status: "paid", date: "2026-03-01" },
  { id: "inv-2026-03-005", client: "Core Strategy", clientId: "vertex-core", amount: 62500, status: "paid", date: "2026-03-01" },
]

// Treasury / Capital Allocation data
const accountBalances = [
  { venue: "Binance", free: 1240000, locked: 810000, total: 2050000 },
  { venue: "Hyperliquid", free: 452000, locked: 348000, total: 800000 },
  { venue: "Aave V3", free: 0, locked: 513000, total: 513000 },
  { venue: "IBKR", free: 320000, locked: 180000, total: 500000 },
  { venue: "Deribit", free: 180000, locked: 120000, total: 300000 },
  { venue: "Betfair", free: 45000, locked: 12000, total: 57000 },
  { venue: "Wallet (ETH)", free: 95000, locked: 0, total: 95000 },
]

const recentTransfers = [
  { time: "14:20", from: "Binance", to: "Hyperliquid", amount: "$100K USDT", status: "confirming" as const, confirmations: "2/12" },
  { time: "13:45", from: "Fiat", to: "IBKR", amount: "$50K USD", status: "settled" as const },
  { time: "09:00", from: "Aave V3", to: "Wallet", amount: "$25K WETH", status: "confirmed" as const, txHash: "0xab3f..." },
  { time: "Yesterday", from: "Wallet", to: "Binance", amount: "$200K USDT", status: "confirmed" as const },
  { time: "2 days ago", from: "Betfair", to: "Bank", amount: "£15K GBP", status: "settled" as const },
]

export default function ReportsPage() {
  const { context, setContext } = useContextState()
  
  // Build filter context
  const filterContext: FilterContext = React.useMemo(() => ({
    organizationIds: context.organizationIds,
    clientIds: context.clientIds,
    strategyIds: context.strategyIds,
    mode: context.mode,
    date: new Date().toISOString().split("T")[0],
  }), [context])
  
  // Get client IDs that match the current filter
  const relevantClientIds = React.useMemo(() => {
    // If specific clients selected, use those
    if (context.clientIds.length > 0) return context.clientIds
    
    // If orgs selected, get all clients in those orgs
    if (context.organizationIds.length > 0) {
      return CLIENTS
        .filter(c => context.organizationIds.includes(c.orgId))
        .map(c => c.id)
    }
    
    // No filter = all clients
    return []
  }, [context.organizationIds, context.clientIds])
  
  // Filter data based on context
  const reports = React.useMemo(() => {
    if (relevantClientIds.length === 0) return allReports
    return allReports.filter(r => relevantClientIds.includes(r.clientId))
  }, [relevantClientIds])
  
  const settlements = React.useMemo(() => {
    if (relevantClientIds.length === 0) return allSettlements
    return allSettlements.filter(s => relevantClientIds.includes(s.clientId))
  }, [relevantClientIds])
  
  const portfolioSummary = React.useMemo(() => {
    if (relevantClientIds.length === 0) return allPortfolioSummary
    return allPortfolioSummary.filter(p => relevantClientIds.includes(p.clientId))
  }, [relevantClientIds])
  
  const invoices = React.useMemo(() => {
    if (relevantClientIds.length === 0) return allInvoices
    return allInvoices.filter(i => relevantClientIds.includes(i.clientId))
  }, [relevantClientIds])
  
  // Calculate totals from filtered data
  const totalAum = portfolioSummary.reduce((sum, p) => sum + p.aum, 0)
  const avgMtdReturn = portfolioSummary.length > 0 
    ? portfolioSummary.reduce((sum, p) => sum + p.mtdReturn, 0) / portfolioSummary.length 
    : 0
  const pendingSettlement = settlements.filter(s => s.status !== "settled").reduce((sum, s) => sum + s.amount, 0)
  const reportsThisMonth = reports.length

  return (
    <AppShell
      activeSurface="reports"
      activePhase="reconcile"
      breadcrumbs={[
        { label: "Reporting & Settlement", href: "/reports" },
        { label: "Overview" },
      ]}
      contextLevels={{ organization: true, client: true, strategy: false, underlying: false }}
      initialContext={context}
      onContextChange={setContext}
    >
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Reporting & Settlement</h1>
            <p className="text-sm text-muted-foreground">
              Client reports, portfolio performance, invoices, and settlements
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="size-4" />
              March 2026
            </Button>
            <Button size="sm" className="gap-2" style={{ backgroundColor: "var(--surface-reports)" }}>
              <FileText className="size-4" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--pnl-positive)]/10">
                  <DollarSign className="size-5" style={{ color: "var(--pnl-positive)" }} />
                </div>
                <div>
                  <p className="text-2xl font-semibold">${(totalAum / 1000000).toFixed(1)}m</p>
                  <p className="text-xs text-muted-foreground">Total AUM</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="size-5 text-primary" />
                </div>
                <div>
                  <p className={`text-2xl font-semibold ${avgMtdReturn >= 0 ? "pnl-positive" : "pnl-negative"}`}>
                    {avgMtdReturn >= 0 ? "+" : ""}{avgMtdReturn.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Avg MTD Return</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--status-warning)]/10">
                  <Receipt className="size-5" style={{ color: "var(--status-warning)" }} />
                </div>
                <div>
                  <p className="text-2xl font-semibold">${(pendingSettlement / 1000).toFixed(1)}k</p>
                  <p className="text-xs text-muted-foreground">Pending Settlement</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--surface-reports)]/10">
                  <FileText className="size-5" style={{ color: "var(--surface-reports)" }} />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{reportsThisMonth}</p>
                  <p className="text-xs text-muted-foreground">Reports This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList>
            <TabsTrigger value="portfolio" className="gap-2">
              <BarChart3 className="size-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="size-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="settlements" className="gap-2">
              <Wallet className="size-4" />
              Settlements
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <Receipt className="size-4" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="treasury" className="gap-2">
              <Vault className="size-4" />
              Treasury
            </TabsTrigger>
          </TabsList>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Client Portfolio Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolioSummary.map((client) => (
                    <div
                      key={client.client}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="size-5 text-primary" />
                        </div>
                        <div>
                          <EntityLink
                            type="client"
                            id={client.client.toLowerCase().replace(" ", "-")}
                            label={client.client}
                            className="font-semibold"
                          />
                          <p className="text-sm text-muted-foreground">
                            AUM: ${(client.aum / 1000000).toFixed(1)}m
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">MTD</p>
                          <PnLChange value={client.mtdReturn} size="sm" />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">YTD</p>
                          <PnLChange value={client.ytdReturn} size="sm" />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Sharpe</p>
                          <p className="font-mono font-semibold">{client.sharpe}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Generated Reports</CardTitle>
                  <Button size="sm" variant="outline" className="gap-2">
                    <FileText className="size-4" />
                    New Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`size-10 rounded-lg flex items-center justify-center ${
                          report.status === "ready"
                            ? "bg-[var(--status-live)]/10"
                            : report.status === "sent"
                            ? "bg-primary/10"
                            : "bg-muted"
                        }`}
                      >
                        <FileText
                          className="size-5"
                          style={{
                            color:
                              report.status === "ready"
                                ? "var(--status-live)"
                                : report.status === "sent"
                                ? "var(--primary)"
                                : "var(--muted-foreground)",
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {report.client} &bull; {report.date} &bull; {report.format}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {report.generated && (
                        <span className="text-xs text-muted-foreground">
                          Generated {report.generated}
                        </span>
                      )}
                      <Badge
                        variant={
                          report.status === "ready"
                            ? "default"
                            : report.status === "sent"
                            ? "secondary"
                            : "outline"
                        }
                        className={
                          report.status === "ready"
                            ? "bg-[var(--status-live)]/10 text-[var(--status-live)]"
                            : ""
                        }
                      >
                        {report.status === "generating" && (
                          <Clock className="size-3 mr-1 animate-spin" />
                        )}
                        {report.status}
                      </Badge>
                      {report.status === "ready" && (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Download className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Send className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settlements Tab */}
          <TabsContent value="settlements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settlement Records</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {settlements.map((settlement) => (
                  <div
                    key={settlement.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {settlement.status === "settled" && (
                        <CheckCircle2 className="size-5 text-[var(--status-live)]" />
                      )}
                      {settlement.status === "confirmed" && (
                        <CheckCircle2 className="size-5 text-[var(--status-warning)]" />
                      )}
                      {settlement.status === "pending" && (
                        <Clock className="size-5 text-muted-foreground" />
                      )}
                      <div>
                        <EntityLink
                          type="settlement"
                          id={settlement.id}
                          label={settlement.client}
                          className="font-medium"
                        />
                        <p className="text-xs text-muted-foreground">
                          {settlement.type.replace("_", " ")} &bull; Due: {settlement.dueDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <PnLValue value={settlement.amount} size="md" showSign />
                      <Badge
                        variant={
                          settlement.status === "settled"
                            ? "default"
                            : settlement.status === "confirmed"
                            ? "secondary"
                            : "outline"
                        }
                        className={
                          settlement.status === "settled"
                            ? "bg-[var(--status-live)]/10 text-[var(--status-live)]"
                            : settlement.status === "confirmed"
                            ? "bg-[var(--status-warning)]/10 text-[var(--status-warning)]"
                            : ""
                        }
                      >
                        {settlement.status}
                      </Badge>
                      {settlement.status === "pending" && (
                        <Button size="sm">Confirm</Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Invoices</CardTitle>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Receipt className="size-4" />
                    New Invoice
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Receipt
                        className={`size-5 ${
                          invoice.status === "paid"
                            ? "text-[var(--status-live)]"
                            : "text-[var(--status-warning)]"
                        }`}
                      />
                      <div>
                        <p className="font-medium font-mono">{invoice.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.client} &bull; {invoice.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-mono font-semibold">
                        ${invoice.amount.toLocaleString()}
                      </span>
                      <Badge
                        variant={invoice.status === "paid" ? "default" : "secondary"}
                        className={
                          invoice.status === "paid"
                            ? "bg-[var(--status-live)]/10 text-[var(--status-live)]"
                            : "bg-[var(--status-warning)]/10 text-[var(--status-warning)]"
                        }
                      >
                        {invoice.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Download className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Treasury Tab */}
          <TabsContent value="treasury" className="space-y-6">
            {/* Capital Allocation */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Capital Allocation by Venue</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Total: <span className="font-semibold text-foreground">${(accountBalances.reduce((s, b) => s + b.total, 0) / 1000000).toFixed(2)}M</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Venue</TableHead>
                      <TableHead className="text-right">Free</TableHead>
                      <TableHead className="text-right">Locked</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[200px]">Utilization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountBalances.map((bal) => {
                      const utilization = bal.total > 0 ? (bal.locked / bal.total) * 100 : 0
                      return (
                        <TableRow key={bal.venue}>
                          <TableCell className="font-medium">{bal.venue}</TableCell>
                          <TableCell className="text-right font-mono text-[var(--pnl-positive)]">
                            ${(bal.free / 1000).toFixed(0)}k
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            ${(bal.locked / 1000).toFixed(0)}k
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            ${(bal.total / 1000).toFixed(0)}k
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={utilization} className="h-2 flex-1" />
                              <span className="text-xs text-muted-foreground w-10">{utilization.toFixed(0)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            {/* Recent Transfers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Transfers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentTransfers.map((transfer, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-4">
                      {transfer.status === "settled" && (
                        <CheckCircle2 className="size-5 text-[var(--status-live)]" />
                      )}
                      {transfer.status === "confirmed" && (
                        <CheckCircle2 className="size-5 text-[var(--accent-blue)]" />
                      )}
                      {transfer.status === "confirming" && (
                        <Loader2 className="size-5 text-[var(--accent-blue)] animate-spin" />
                      )}
                      {transfer.status === "pending" && (
                        <Clock className="size-5 text-muted-foreground" />
                      )}
                      {transfer.status === "failed" && (
                        <AlertCircle className="size-5 text-destructive" />
                      )}
                      <div>
                        <p className="font-medium">
                          {transfer.from} <ArrowRight className="size-3 inline mx-1" /> {transfer.to}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transfer.time}
                          {transfer.txHash && <span className="ml-2 font-mono">{transfer.txHash}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono font-medium">{transfer.amount}</span>
                      <Badge
                        variant={
                          transfer.status === "settled" || transfer.status === "confirmed"
                            ? "default"
                            : transfer.status === "confirming"
                            ? "secondary"
                            : transfer.status === "failed"
                            ? "destructive"
                            : "outline"
                        }
                        className={
                          transfer.status === "settled" || transfer.status === "confirmed"
                            ? "bg-[var(--status-live)]/10 text-[var(--status-live)]"
                            : transfer.status === "confirming"
                            ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]"
                            : ""
                        }
                      >
                        {transfer.status}
                        {transfer.confirmations && ` (${transfer.confirmations})`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
