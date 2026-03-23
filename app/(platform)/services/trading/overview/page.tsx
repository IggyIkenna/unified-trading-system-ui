"use client"

import * as React from "react"
import { useGlobalScope } from "@/lib/stores/global-scope-store"
import { BatchLiveRail } from "@/components/platform/batch-live-rail"
import { KPICard } from "@/components/trading/kpi-card"
import { AlertsFeed } from "@/components/trading/alerts-feed"
import { PnLAttributionPanel, type PnLComponent } from "@/components/trading/pnl-attribution-panel"
import { HealthStatusGrid, type ServiceHealth } from "@/components/trading/health-status-grid"
import { LiveBatchComparison } from "@/components/trading/live-batch-comparison"
import { ValueFormatToggle, useValueFormat } from "@/components/trading/value-format-toggle"
import { InterventionControls } from "@/components/trading/intervention-controls"
import { ScopeSummary } from "@/components/trading/scope-summary"
import { MarginUtilization, type VenueMargin } from "@/components/trading/margin-utilization"
import { DriftAnalysisPanel } from "@/components/trading/drift-analysis-panel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Radio, Database, AlertTriangle, Loader2, ArrowRight } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import Link from "next/link"

// API hooks — data from server, not client-side generation
import { useAlerts } from "@/hooks/api/use-alerts"
import { usePositions } from "@/hooks/api/use-positions"
import { useOrders } from "@/hooks/api/use-orders"
import { useServiceHealth } from "@/hooks/api/use-service-status"
import { useWebSocket } from "@/hooks/use-websocket"
import {
  useTradingOrgs,
  useTradingClients,
  useTradingPnl,
  useTradingTimeseries,
  useTradingPerformance,
  useTradingLiveBatchDelta,
} from "@/hooks/api/use-trading"

// Types only — no data or functions imported from trading-data
import type { TradingOrganization, TradingClient, PnLBreakdown, TimeSeriesPoint } from "@/lib/trading-data"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getToday(): string {
  return new Date().toISOString().split("T")[0]
}

function getYesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split("T")[0]
}

/** Loading skeleton for a full-page spinner */
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] gap-2 text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      <span>Loading dashboard...</span>
    </div>
  )
}

/** Error banner shown when one or more API calls fail */
function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mx-4 my-8 p-4 rounded-lg border border-destructive/50 bg-destructive/10 flex items-center gap-3">
      <AlertTriangle className="size-5 text-destructive flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-destructive">Failed to load dashboard data</p>
        <p className="text-xs text-muted-foreground mt-1">{message}</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OverviewPage() {
  // ---- API data ----
  const { data: orgsData, isLoading: orgsLoading, error: orgsError } = useTradingOrgs()
  const { data: clientsData, isLoading: clientsLoading, error: clientsError } = useTradingClients()
  const { data: pnlData, isLoading: pnlLoading, error: pnlError } = useTradingPnl()
  const { data: timeseriesData, isLoading: timeseriesLoading, error: timeseriesError } = useTradingTimeseries()
  const { data: performanceData, isLoading: perfLoading, error: perfError } = useTradingPerformance()
  const { data: liveBatchData, isLoading: liveBatchLoading, error: liveBatchError } = useTradingLiveBatchDelta()
  const { data: alertsData, isLoading: alertsLoading, error: alertsError } = useAlerts()
  const { data: ordersData, isLoading: ordersLoading } = useOrders()
  const { data: positionsData, isLoading: positionsLoading, error: positionsError } = usePositions()
  const { data: healthData, isLoading: healthLoading, error: healthError } = useServiceHealth()

  // ---- Real-time PnL via WebSocket ----
  const [realtimePnl, setRealtimePnl] = React.useState<Record<string, number>>({})
  const [realtimePnlPoints, setRealtimePnlPoints] = React.useState<TimeSeriesPoint[]>([])
  const { scope: wsScope } = useGlobalScope()

  const handleWsMessage = React.useCallback((msg: Record<string, unknown>) => {
    if (msg.channel === "analytics" && msg.type === "pnl_snapshot") {
      const strategies = (msg.data as Record<string, unknown>)?.strategies as Array<Record<string, unknown>> | undefined
      if (strategies) {
        const pnlMap: Record<string, number> = {}
        let totalSnapshotPnl = 0
        for (const s of strategies) {
          if (typeof s.id === "string" && typeof s.pnl === "number") {
            pnlMap[s.id] = s.pnl
            totalSnapshotPnl += s.pnl
          }
        }
        setRealtimePnl(pnlMap)
        // Append to equity curve timeseries
        setRealtimePnlPoints(prev => {
          const now = new Date().toISOString()
          const next: TimeSeriesPoint[] = [...prev, { timestamp: now, value: totalSnapshotPnl }]
          return next.length > 500 ? next.slice(-500) : next
        })
      }
    }
  }, [])

  useWebSocket({
    url: "ws://localhost:8030/ws",
    enabled: wsScope.mode === "live",
    onMessage: handleWsMessage,
  })

  // ---- Derived: organizations, clients, strategies ----
  const organizations: TradingOrganization[] = orgsData?.organizations ?? []
  const clients: TradingClient[] = clientsData?.clients ?? []

  // Alerts
  const alertsRaw = alertsData as Record<string, unknown> | undefined
  const mockAlerts = (alertsRaw?.data ?? alertsRaw?.alerts ?? []) as Array<{
    id: string
    message: string
    severity: "critical" | "high" | "medium" | "low"
    timestamp: string
    source: string
  }>

  // Positions / margin
  const positionsRaw = positionsData as Record<string, unknown> | undefined
  const positionsArr = (positionsRaw?.data ?? positionsRaw?.positions ?? []) as Array<Record<string, unknown>>
  const venueMargins: VenueMargin[] = positionsArr.map((p) => ({
    venue: (p.venue as string) ?? "",
    venueLabel: (p.venueLabel as string) ?? (p.venue as string) ?? "",
    used: (p.used as number) ?? 0,
    available: (p.available as number) ?? 0,
    total: (p.total as number) ?? 0,
    utilization: (p.utilization as number) ?? 0,
    trend: (p.trend as "up" | "down" | "stable") ?? "stable",
    marginCallDistance: (p.marginCallDistance as number) ?? 0,
    lastUpdate: (p.lastUpdate as string) ?? "",
  }))

  // Health
  const healthRaw = healthData as Record<string, unknown> | undefined
  const allMockServices: ServiceHealth[] = (healthRaw?.data ?? healthRaw?.services ?? []) as ServiceHealth[]

  // P&L breakdown
  const aggregatedPnL: PnLBreakdown = pnlData ?? {
    strategyId: "AGGREGATE", clientId: "MULTIPLE", orgId: "MULTIPLE",
    date: getToday(), mode: "live",
    delta: 0, funding: 0, basis: 0, interest_rate: 0, greeks: 0,
    mark_to_market: 0, carry: 0, fx: 0, fees: 0, slippage: 0, residual: 0, total: 0,
  }

  // Timeseries
  const emptyTs: TimeSeriesPoint[] = []
  const liveTimeSeries = timeseriesData?.timeseries ?? { pnl: emptyTs, nav: emptyTs, exposure: emptyTs }

  // For batch comparison we re-use live-batch delta endpoint
  // The mock returns full timeseries from the same seed so batch = live shifted
  const batchTimeSeries = liveBatchData ?? { pnl: emptyTs, nav: emptyTs, exposure: emptyTs }

  // Performance table — filter by global scope
  const allStrategies = performanceData?.strategies ?? []
  const { scope: context, setMode, setOrganizationIds, setClientIds, setStrategyIds } = useGlobalScope()

  const strategyPerformance = React.useMemo(() => {
    let result = allStrategies
    if (context.strategyIds.length > 0) {
      result = result.filter(s => context.strategyIds.includes(s.id))
    }
    return result
  }, [allStrategies, context.strategyIds])

  // ---- UI state ----
  const [showTimeSeries, setShowTimeSeries] = React.useState(true)
  const [batchDate, setBatchDate] = React.useState(getYesterday())
  const { format: valueFormat, setFormat: setValueFormat } = useValueFormat("dollar")
  const [strategySearch, setStrategySearch] = React.useState("")
  const [strategySort, setStrategySort] = React.useState<string>("-pnl")
  const [assetClassFilter, setAssetClassFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [showAllStrategies, setShowAllStrategies] = React.useState(false)
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string> | null>(null)

  // Filtered + sorted strategies for the table
  const filteredSortedStrategies = React.useMemo(() => {
    let result = [...strategyPerformance]
    if (strategySearch) {
      const q = strategySearch.toLowerCase()
      result = result.filter(s =>
        String(s.name ?? "").toLowerCase().includes(q) ||
        String(s.assetClass ?? "").toLowerCase().includes(q) ||
        String(s.archetype ?? "").toLowerCase().includes(q)
      )
    }
    if (assetClassFilter !== "all") {
      result = result.filter(s => s.assetClass === assetClassFilter)
    }
    if (statusFilter !== "all") {
      result = result.filter(s => s.status === statusFilter)
    }
    const desc = strategySort.startsWith("-")
    const key = strategySort.replace("-", "") as string
    result.sort((a, b) => {
      const av = Number((a as unknown as Record<string, unknown>)[key]) || 0
      const bv = Number((b as unknown as Record<string, unknown>)[key]) || 0
      if (key === "name") {
        return desc ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
      }
      return desc ? bv - av : av - bv
    })
    return result
  }, [strategyPerformance, strategySearch, strategySort, assetClassFilter, statusFilter])

  // Group strategies by asset class for collapsible view
  const groupedStrategies = React.useMemo(() => {
    const groups: Record<string, typeof filteredSortedStrategies> = {}
    const displayList = showAllStrategies ? filteredSortedStrategies : filteredSortedStrategies.slice(0, 15)
    displayList.forEach(s => {
      const ac = String(s.assetClass ?? "Other")
      if (!groups[ac]) groups[ac] = []
      groups[ac].push(s)
    })
    return groups
  }, [filteredSortedStrategies, showAllStrategies])

  // Default all groups to collapsed on first render
  React.useEffect(() => {
    if (collapsedGroups === null && Object.keys(groupedStrategies).length > 0) {
      setCollapsedGroups(new Set(Object.keys(groupedStrategies)))
    }
  }, [groupedStrategies, collapsedGroups])

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => {
      const current = prev ?? new Set(Object.keys(groupedStrategies))
      const next = new Set(current)
      if (next.has(group)) next.delete(group); else next.add(group)
      return next
    })
  }

  // ---- Loading / error ----
  const coreLoading = orgsLoading || clientsLoading || pnlLoading || timeseriesLoading || perfLoading
  const sidebarLoading = alertsLoading || positionsLoading || healthLoading || liveBatchLoading
  const isLoading = coreLoading && !pnlData && !performanceData // block render until core data arrives

  const firstError = orgsError ?? clientsError ?? pnlError ?? timeseriesError ?? perfError ?? alertsError ?? positionsError ?? healthError ?? liveBatchError
  if (firstError && !pnlData && !performanceData) {
    return <ErrorBanner message={(firstError as Error).message ?? "Unknown error"} />
  }

  if (isLoading) return <PageLoader />

  // ---- Computed KPIs ----
  // Use real-time PnL from WebSocket if available, otherwise fall back to API snapshot
  const hasRealtimePnl = Object.keys(realtimePnl).length > 0
  const totalPnl = hasRealtimePnl
    ? Object.values(realtimePnl).reduce((sum, v) => sum + v, 0)
    : aggregatedPnL.total
  // KPIs use the table-filtered list so everything is consistent
  const kpiStrategies = filteredSortedStrategies
  const totalNav = kpiStrategies.reduce((sum, s) => sum + (s.nav ?? 0), 0) || 1
  const totalExposure = kpiStrategies.reduce((sum, s) => sum + (s.exposure ?? 0), 0)
  const liveStrategies = kpiStrategies.filter((s) => s.status === "live").length
  const warningStrategies = kpiStrategies.filter((s) => s.status === "warning").length
  const criticalAlerts = mockAlerts.filter((a) => a.severity === "critical").length
  const highAlerts = mockAlerts.filter((a) => a.severity === "high").length

  // P&L components for attribution
  const safeDivide = (num: number, denom: number): number => {
    if (!denom || denom === 0 || !isFinite(num) || !isFinite(denom)) return 0
    return (num / Math.abs(denom)) * 100
  }

  const pnlComponents: PnLComponent[] = [
    { name: "Funding", pnl: aggregatedPnL.funding || 0, percentage: safeDivide(aggregatedPnL.funding, aggregatedPnL.total) },
    { name: "Carry", pnl: aggregatedPnL.carry || 0, percentage: safeDivide(aggregatedPnL.carry, aggregatedPnL.total) },
    { name: "Basis", pnl: aggregatedPnL.basis || 0, percentage: safeDivide(aggregatedPnL.basis, aggregatedPnL.total) },
    { name: "Delta", pnl: aggregatedPnL.delta || 0, percentage: safeDivide(aggregatedPnL.delta, aggregatedPnL.total) },
    { name: "Greeks", pnl: aggregatedPnL.greeks || 0, percentage: safeDivide(aggregatedPnL.greeks, aggregatedPnL.total) },
    { name: "Slippage", pnl: aggregatedPnL.slippage || 0, percentage: safeDivide(aggregatedPnL.slippage, aggregatedPnL.total) },
    { name: "Fees", pnl: aggregatedPnL.fees || 0, percentage: safeDivide(aggregatedPnL.fees, aggregatedPnL.total) },
    { name: "Residual", pnl: aggregatedPnL.residual || 0, percentage: safeDivide(aggregatedPnL.residual, aggregatedPnL.total) },
  ].filter((c) => Math.abs(c.pnl) > 0.01 && isFinite(c.pnl))

  // Format helpers
  const formatCurrency = (v: number) => {
    if (valueFormat === "percent") {
      const pct = totalNav > 0 ? (v / totalNav) * 100 : 0
      return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`
    }
    if (Math.abs(v) >= 1000000) return `$${(v / 1000000).toFixed(2)}M`
    if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`
    return `$${v.toFixed(0)}`
  }

  const formatDollar = (v: number) => {
    if (Math.abs(v) >= 1000000) return `$${(v / 1000000).toFixed(2)}M`
    if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`
    return `$${v.toFixed(0)}`
  }

  // Scope summary helpers: map IDs to objects from API data
  const scopeOrgs = context.organizationIds
    .map((id) => organizations.find((o) => o.id === id))
    .filter((o): o is TradingOrganization => !!o)
  const scopeClients = context.clientIds
    .map((id) => clients.find((c) => c.id === id))
    .filter((c): c is TradingClient => !!c)

  return (
    <div className="h-full bg-background flex flex-col">
      <main className="flex-1 p-4 space-y-4 overflow-auto">
        {/* Command Center Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-secondary/30 rounded-lg border border-border">
          <ScopeSummary
            organizations={scopeOrgs}
            clients={scopeClients}
            strategies={kpiStrategies.map((s) => ({ id: s.id, name: s.name, status: s.status }))}
            selectedStrategyIds={context.strategyIds}
            totalStrategies={kpiStrategies.length}
            totalCapital={totalNav}
            totalExposure={totalExposure}
            mode={context.mode}
            asOfDatetime={context.asOfDatetime}
            onClearScope={() => {
              setOrganizationIds([])
              setClientIds([])
              setStrategyIds([])
            }}
          />
          <div className="flex items-center gap-2">
            <InterventionControls
              scope={{
                strategyCount: kpiStrategies.length,
                totalExposure: totalExposure,
                scopeLabel:
                  context.organizationIds.length > 0 || context.clientIds.length > 0
                    ? "Filtered"
                    : "All Strategies",
              }}
            />
            <Link href="/services/trading/terminal">
              <Button variant="default" size="sm" className="h-8 gap-1.5">
                Open Trading Terminal
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Time Series Controls */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTimeSeries(!showTimeSeries)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showTimeSeries ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              <span>{showTimeSeries ? "Hide" : "Show"} Time Series</span>
            </button>
            <ValueFormatToggle
              format={valueFormat}
              onFormatChange={setValueFormat}
              className="ml-2"
            />
            <Badge variant="outline" className="ml-2 text-[10px]">
              {context.mode === "live" ? (
                <span className="flex items-center gap-1">
                  <Radio className="size-2.5 animate-pulse text-[var(--status-live)]" />
                  Live
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Database className="size-2.5" />
                  Batch ({context.asOfDatetime?.split("T")[0]})
                </span>
              )}
            </Badge>
            {(timeseriesLoading || liveBatchLoading) && (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground ml-1" />
            )}
          </div>

          {showTimeSeries && (
            <Tabs defaultValue="pnl" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pnl">P&L</TabsTrigger>
                <TabsTrigger value="nav">NAV</TabsTrigger>
                <TabsTrigger value="exposure">Exposure</TabsTrigger>
              </TabsList>

              <TabsContent value="pnl">
                <LiveBatchComparison
                  title="Cumulative P&L"
                  liveData={[...liveTimeSeries.pnl, ...realtimePnlPoints]}
                  batchData={batchTimeSeries.pnl}
                  valueFormatter={formatCurrency}
                  height={220}
                  selectedDate={batchDate}
                  onDateChange={setBatchDate}
                />
              </TabsContent>

              <TabsContent value="nav">
                <LiveBatchComparison
                  title="Net Asset Value"
                  liveData={liveTimeSeries.nav}
                  batchData={batchTimeSeries.nav}
                  valueFormatter={formatCurrency}
                  height={220}
                  selectedDate={batchDate}
                  onDateChange={setBatchDate}
                />
              </TabsContent>

              <TabsContent value="exposure">
                <LiveBatchComparison
                  title="Net Exposure"
                  liveData={liveTimeSeries.exposure}
                  batchData={batchTimeSeries.exposure}
                  valueFormatter={formatCurrency}
                  height={220}
                  selectedDate={batchDate}
                  onDateChange={setBatchDate}
                />
              </TabsContent>
            </Tabs>
          )}

          {showTimeSeries && (
            <DriftAnalysisPanel
              metrics={[
                {
                  label: "P&L",
                  liveValue: liveTimeSeries.pnl[liveTimeSeries.pnl.length - 1]?.value || 0,
                  batchValue: batchTimeSeries.pnl[batchTimeSeries.pnl.length - 1]?.value || 0,
                  threshold: 2,
                },
                {
                  label: "Net Exposure",
                  liveValue: liveTimeSeries.exposure[liveTimeSeries.exposure.length - 1]?.value || 0,
                  batchValue: batchTimeSeries.exposure[batchTimeSeries.exposure.length - 1]?.value || 0,
                  threshold: 5,
                },
                {
                  label: "NAV",
                  liveValue: liveTimeSeries.nav[liveTimeSeries.nav.length - 1]?.value || 0,
                  batchValue: batchTimeSeries.nav[batchTimeSeries.nav.length - 1]?.value || 0,
                  threshold: 1,
                },
              ]}
              unreconciledItems={[]}
              batchAsOf={`${batchDate} 23:59 UTC`}
              liveAsOf="Now"
            />
          )}
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <KPICard
            title={context.mode === "live" ? "P&L (Today)" : "P&L (As-Of)"}
            value={formatCurrency(totalPnl)}
            change={totalPnl > 0 ? 8.4 : -3.2}
            changeLabel="vs target"
            accentColor={totalPnl >= 0 ? "var(--pnl-positive)" : "var(--pnl-negative)"}
          />
          <KPICard
            title="Net Exposure"
            value={formatCurrency(totalExposure)}
            change={-2.1}
            changeLabel="24h"
            accentColor="var(--surface-trading)"
          />
          <KPICard
            title="Margin Used"
            value={`${Math.round((totalExposure / totalNav) * 100)}%`}
            change={5.2}
            changeLabel="vs limit"
            accentColor="var(--status-warning)"
          />
          <KPICard
            title="Live Strategies"
            value={`${liveStrategies}`}
            subtitle={warningStrategies > 0 ? `${warningStrategies} warning` : "All healthy"}
            accentColor="var(--status-live)"
          />
          <KPICard
            title="Alerts"
            value={`${criticalAlerts + highAlerts}`}
            subtitle={`${criticalAlerts} critical, ${highAlerts} high`}
            accentColor={criticalAlerts > 0 ? "var(--status-error)" : "var(--status-warning)"}
          />
        </div>

        {/* Strategy Performance Table — full width */}
        <div>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-sm">
                      Strategy Performance
                      {perfLoading && <Loader2 className="inline-block size-3.5 animate-spin ml-2" />}
                    </CardTitle>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={strategySearch}
                      onChange={(e) => setStrategySearch(e.target.value)}
                      className="h-7 w-36 px-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <select
                      value={assetClassFilter}
                      onChange={(e) => setAssetClassFilter(e.target.value)}
                      className="h-7 px-2 text-xs rounded-md border border-border bg-background"
                    >
                      <option value="all">All Classes</option>
                      {[...new Set(strategyPerformance.map(s => String(s.assetClass)))].sort().map(ac => (
                        <option key={ac} value={ac}>{ac}</option>
                      ))}
                    </select>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="h-7 px-2 text-xs rounded-md border border-border bg-background"
                    >
                      <option value="all">All Status</option>
                      <option value="live">Live</option>
                      <option value="paused">Paused</option>
                      <option value="warning">Warning</option>
                    </select>
                  </div>
                  <Link href="/services/trading/strategies">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {/* Summary totals */}
                <div className="flex items-center gap-6 mb-3 pb-3 border-b border-border text-xs">
                  <span className="text-muted-foreground">{filteredSortedStrategies.length} strategies</span>
                  <span className="font-mono">
                    P&L: <span className={cn(filteredSortedStrategies.reduce((s, x) => s + (x.pnl ?? 0), 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {formatDollar(filteredSortedStrategies.reduce((s, x) => s + (x.pnl ?? 0), 0))}
                    </span>
                  </span>
                  <span className="font-mono">
                    Exposure: {formatDollar(filteredSortedStrategies.reduce((s, x) => s + (x.exposure ?? 0), 0))}
                  </span>
                  <span className="font-mono">
                    NAV: {formatDollar(filteredSortedStrategies.reduce((s, x) => s + (x.nav ?? 0), 0))}
                  </span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="cursor-pointer hover:text-foreground" onClick={() => setStrategySort(strategySort === "name" ? "-name" : "name")}>
                        Strategy {strategySort === "name" ? "↑" : strategySort === "-name" ? "↓" : ""}
                      </TableHead>
                      <TableHead className="text-right cursor-pointer hover:text-foreground" onClick={() => setStrategySort(strategySort === "pnl" ? "-pnl" : "pnl")}>
                        P&L {strategySort === "pnl" ? "↑" : strategySort === "-pnl" ? "↓" : ""}
                      </TableHead>
                      <TableHead className="text-right cursor-pointer hover:text-foreground" onClick={() => setStrategySort(strategySort === "sharpe" ? "-sharpe" : "sharpe")}>
                        Sharpe {strategySort === "sharpe" ? "↑" : strategySort === "-sharpe" ? "↓" : ""}
                      </TableHead>
                      <TableHead className="text-right">Drawdown</TableHead>
                      <TableHead className="text-right cursor-pointer hover:text-foreground" onClick={() => setStrategySort(strategySort === "exposure" ? "-exposure" : "exposure")}>
                        Exposure {strategySort === "exposure" ? "↑" : strategySort === "-exposure" ? "↓" : ""}
                      </TableHead>
                      <TableHead className="text-right">NAV</TableHead>
                      <TableHead>Asset Class</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(groupedStrategies).map(([group, groupItems]) => {
                      const isCollapsed = collapsedGroups === null || collapsedGroups.has(group)
                      const groupPnl = groupItems.reduce((s, x) => s + (x.pnl ?? 0), 0)
                      const groupExposure = groupItems.reduce((s, x) => s + (x.exposure ?? 0), 0)
                      const groupNav = groupItems.reduce((s, x) => s + (x.nav ?? 0), 0)
                      return (
                        <React.Fragment key={group}>
                          {/* Group header row */}
                          <TableRow
                            className="text-xs cursor-pointer hover:bg-muted/50 border-b-0"
                            onClick={() => toggleGroup(group)}
                          >
                            <TableCell className="font-medium">
                              <span className="flex items-center gap-1.5">
                                <ChevronDown className={cn("size-3 transition-transform", isCollapsed && "-rotate-90")} />
                                {group}
                                <Badge variant="outline" className="text-[9px] h-4 px-1">{groupItems.length}</Badge>
                              </span>
                            </TableCell>
                            <TableCell className={cn("text-right font-mono tabular-nums font-medium", groupPnl >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]")}>
                              {formatDollar(groupPnl)}
                            </TableCell>
                            <TableCell />
                            <TableCell />
                            <TableCell className="text-right font-mono tabular-nums font-medium">{formatDollar(groupExposure)}</TableCell>
                            <TableCell className="text-right font-mono tabular-nums font-medium">{formatDollar(groupNav)}</TableCell>
                            <TableCell />
                            <TableCell />
                            <TableCell />
                          </TableRow>
                          {/* Individual strategy rows */}
                          {!isCollapsed && groupItems.map((s) => {
                            const livePnl = realtimePnl[s.id] ?? s.pnl
                            return (
                              <TableRow key={s.id} className="text-xs">
                                <TableCell className="pl-8">
                                  <Link href={`/services/trading/strategies/${s.id}`} className="font-medium hover:underline">
                                    {s.name}
                                  </Link>
                                </TableCell>
                                <TableCell className={cn("text-right font-mono tabular-nums", livePnl >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]")}>
                                  {formatDollar(livePnl)}
                                </TableCell>
                                <TableCell className="text-right font-mono tabular-nums">{(s.sharpe ?? 0).toFixed(2)}</TableCell>
                                <TableCell className="text-right font-mono tabular-nums text-rose-400">{(s.maxDrawdown ?? 0).toFixed(1)}%</TableCell>
                                <TableCell className="text-right font-mono tabular-nums">{formatDollar(s.exposure ?? 0)}</TableCell>
                                <TableCell className="text-right font-mono tabular-nums">{formatDollar(s.nav ?? 0)}</TableCell>
                                <TableCell>
                                  <span className="text-[10px] text-muted-foreground">{s.assetClass}</span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={cn(
                                    "text-[10px]",
                                    s.status === "live" && "text-emerald-500 border-emerald-500/30",
                                    s.status === "warning" && "text-amber-500 border-amber-500/30",
                                    s.status === "paused" && "text-muted-foreground"
                                  )}>
                                    {s.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {s.status === "live" || s.status === "warning" ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-[10px] text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
                                        onClick={(e) => { e.stopPropagation() }}
                                      >
                                        Pause
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                                        onClick={(e) => { e.stopPropagation() }}
                                      >
                                        Resume
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-[10px] text-rose-400 hover:text-rose-300 hover:bg-rose-400/10"
                                      onClick={(e) => { e.stopPropagation() }}
                                    >
                                      Stop
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </React.Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
                {filteredSortedStrategies.length > 15 && (
                  <div className="pt-2 border-t border-border mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground"
                      onClick={() => setShowAllStrategies(!showAllStrategies)}
                    >
                      {showAllStrategies
                        ? `Show less (15 of ${filteredSortedStrategies.length})`
                        : `Show all ${filteredSortedStrategies.length} strategies`
                      }
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
        </div>

        {/* Bottom Row — 4 panels, all with headers + View All links */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* P&L Attribution */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">P&L Attribution</CardTitle>
                <Link href="/services/trading/pnl">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <PnLAttributionPanel
                components={pnlComponents}
                totalPnl={totalPnl}
              />
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Alerts</CardTitle>
                <Link href="/services/trading/alerts">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin mr-2" />
                </div>
              ) : (
                <div className="space-y-2">
                  {mockAlerts.slice(0, 4).map((a) => (
                    <Link key={a.id} href="/services/trading/alerts" className="block">
                      <div className="flex items-center gap-2 py-1.5 text-xs hover:bg-muted/30 rounded px-1 -mx-1">
                        <Badge variant="outline" className={cn(
                          "text-[9px] px-1 py-0 h-4",
                          a.severity === "critical" ? "text-rose-400 border-rose-400/30" :
                          a.severity === "high" ? "text-amber-400 border-amber-400/30" : "text-sky-400 border-sky-400/30"
                        )}>
                          {a.severity === "critical" ? "CRIT" : a.severity === "high" ? "HIGH" : "MED"}
                        </Badge>
                        <span className="truncate flex-1">{a.message}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Fills */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Recent Fills</CardTitle>
                <Link href="/services/trading/orders">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin mr-2" />
                </div>
              ) : (
                <div className="space-y-1.5">
                  {(() => {
                    const raw = ordersData as unknown
                    const orders = Array.isArray(raw) ? raw : ((raw as Record<string, unknown>)?.orders ?? []) as Array<Record<string, unknown>>
                    return (orders as Array<Record<string, unknown>>).slice(0, 5).map((o, i) => (
                      <div key={String(o.order_id ?? i)} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0 text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn(
                            "text-[9px] px-1 py-0 h-4 font-mono",
                            String(o.side) === "BUY" ? "text-emerald-400 border-emerald-400/30" : "text-rose-400 border-rose-400/30"
                          )}>
                            {String(o.side)}
                          </Badge>
                          <span className="font-mono font-medium">{String(o.instrument ?? "")}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-muted-foreground">{String(o.venue ?? "")}</span>
                          <span className={cn("font-mono", String(o.status) === "FILLED" ? "text-emerald-400" : "text-amber-400")}>
                            {String(o.status ?? "")}
                          </span>
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Health */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">System Health</CardTitle>
                <Link href="/services/observe/health">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">View All</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <HealthStatusGrid services={allMockServices.slice(0, 6)} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
