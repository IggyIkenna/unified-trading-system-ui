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

  // Performance table
  const strategyPerformance = performanceData?.strategies ?? []

  // ---- UI state ----
  const { scope: context, setMode, setOrganizationIds, setClientIds, setStrategyIds } = useGlobalScope()
  const [showTimeSeries, setShowTimeSeries] = React.useState(true)
  const [batchDate, setBatchDate] = React.useState(getYesterday())
  const { format: valueFormat, setFormat: setValueFormat } = useValueFormat("dollar")

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
  const totalNav = strategyPerformance.reduce((sum, s) => sum + s.nav, 0) || 1
  const totalExposure = liveTimeSeries.exposure[liveTimeSeries.exposure.length - 1]?.value || 0
  const liveStrategies = strategyPerformance.filter((s) => s.status === "live").length
  const warningStrategies = strategyPerformance.filter((s) => s.status === "warning").length
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
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 p-4 space-y-4 overflow-auto">
        <BatchLiveRail
          platform="strategy"
          currentStage="Monitor"
          context={context.mode === "live" ? "LIVE" : "BATCH"}
          onContextChange={(v) => setMode(v === "LIVE" ? "live" : "batch")}
        />
        {/* Command Center Header */}
        <div className="flex items-center justify-between gap-4 px-3 py-2 bg-secondary/30 rounded-lg border border-border">
          <ScopeSummary
            organizations={scopeOrgs}
            clients={scopeClients}
            strategies={strategyPerformance.map((s) => ({ id: s.id, name: s.name, status: s.status }))}
            selectedStrategyIds={context.strategyIds}
            totalStrategies={strategyPerformance.length}
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
                strategyCount: strategyPerformance.length,
                totalExposure: totalExposure,
                scopeLabel:
                  context.organizationIds.length > 0 || context.clientIds.length > 0
                    ? "Filtered"
                    : "All Strategies",
              }}
            />
            <Link href="/services/trading/overview">
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
              unreconciledItems={[
                { id: "1", type: "fill", description: "ETH/USD Long 2.5 @ 3,245.50", timestamp: "14:32:15", amount: 8113.75, venue: "Binance" },
                { id: "2", type: "fill", description: "BTC/USD Short 0.15 @ 62,150", timestamp: "14:28:44", amount: 9322.50, venue: "Deribit" },
                { id: "3", type: "transfer", description: "USDC deposit from treasury", timestamp: "13:45:00", amount: 50000, venue: "Aave" },
              ]}
              batchAsOf={`${batchDate} 23:59 UTC`}
              liveAsOf="Now"
            />
          )}
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-5 gap-4">
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

        {/* Main Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Left: Strategy Performance Table */}
          <div className="col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    Strategy Performance
                    {perfLoading && <Loader2 className="inline-block size-3.5 animate-spin ml-2" />}
                  </CardTitle>
                  <Link href="/services/trading/strategies">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead>Strategy</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                      <TableHead className="text-right">Sharpe</TableHead>
                      <TableHead className="text-right">Exposure</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strategyPerformance.slice(0, 8).map((s) => {
                      const livePnl = realtimePnl[s.id] ?? s.pnl
                      return (
                      <TableRow key={s.id} className="text-xs">
                        <TableCell>
                          <Link href={`/services/trading/strategies/${s.id}`} className="font-medium hover:underline">
                            {s.name}
                          </Link>
                          <p className="text-[10px] text-muted-foreground">{s.assetClass}</p>
                        </TableCell>
                        <TableCell className={cn("text-right font-mono tabular-nums", livePnl >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]")}>
                          {formatDollar(livePnl)}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{s.sharpe.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{formatDollar(s.exposure)}</TableCell>
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
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right: Alerts Feed */}
          <div>
            {alertsLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Loading alerts...
                </CardContent>
              </Card>
            ) : (
              <AlertsFeed
                alerts={mockAlerts.slice(0, 6).map((a) => ({
                  id: a.id,
                  message: a.message,
                  severity: a.severity,
                  timestamp: a.timestamp,
                  source: a.source,
                }))}
              />
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-3 gap-4">
          {/* P&L Attribution */}
          <PnLAttributionPanel
            components={pnlComponents}
            totalPnl={totalPnl}
          />

          {/* Service Health */}
          <HealthStatusGrid services={allMockServices.slice(0, 8)} />

          {/* Margin Utilization */}
          <MarginUtilization venues={venueMargins} />
        </div>
      </main>
    </div>
  )
}
