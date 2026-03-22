"use client"

import * as React from "react"
import { useGlobalScope } from "@/lib/stores/global-scope-store"
import { KPICard } from "@/components/trading/kpi-card"
import { AlertsFeed, type Alert } from "@/components/trading/alerts-feed"
import { PnLAttributionPanel, type PnLComponent } from "@/components/trading/pnl-attribution-panel"
import { HealthStatusGrid, type ServiceHealth } from "@/components/trading/health-status-grid"
import { LimitBar } from "@/components/trading/limit-bar"
import { LiveBatchComparison, LiveBatchDeltaIndicator } from "@/components/trading/live-batch-comparison"
import { ValueFormatToggle, useValueFormat, FormattedValue, type ValueFormat } from "@/components/trading/value-format-toggle"
import { InterventionControls } from "@/components/trading/intervention-controls"
import { ScopeSummary } from "@/components/trading/scope-summary"
import { MarginUtilization, type VenueMargin } from "@/components/trading/margin-utilization"
import { DriftAnalysisPanel } from "@/components/trading/drift-analysis-panel"
import { KillSwitchPanel } from "@/components/trading/kill-switch-panel"
import { CircuitBreakerGrid } from "@/components/trading/circuit-breaker-grid"
import { StrategyAuditTrail } from "@/components/trading/strategy-audit-trail"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Shield, AlertTriangle, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Radio, Database, Info } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useAlerts } from "@/hooks/api/use-alerts"
import { usePositions } from "@/hooks/api/use-positions"
import { useServiceHealth } from "@/hooks/api/use-service-status"

// Import the trading data system
import {
  ORGANIZATIONS,
  CLIENTS,
  STRATEGIES,
  getFilteredStrategies,
  getAggregatedPnL,
  getAggregatedTimeSeries,
  getLiveBatchDelta,
  getStrategyPerformance,
  getToday,
  getYesterday,
  getFilteredServices,
  getFilteredAlerts,
  type FilterContext,
  type Alert as TradingAlert,
} from "@/lib/trading-data"

export default function OverviewPage() {
  const { data: alertsData, isLoading: alertsLoading } = useAlerts()
  const mockAlerts: TradingAlert[] = (alertsData as any)?.data ?? (alertsData as any)?.alerts ?? []

  const { data: positionsData, isLoading: positionsLoading } = usePositions()
  const positionsRaw: any[] = (positionsData as any)?.data ?? (positionsData as any)?.positions ?? []
  const venueMargins: VenueMargin[] = positionsRaw.length > 0
    ? positionsRaw.map((p: any) => ({
        venue: p.venue ?? "",
        venueLabel: p.venueLabel ?? p.venue ?? "",
        used: p.used ?? 0,
        available: p.available ?? 0,
        total: p.total ?? 0,
        utilization: p.utilization ?? 0,
        trend: p.trend ?? "stable",
        marginCallDistance: p.marginCallDistance ?? 0,
        lastUpdate: p.lastUpdate ?? "",
      }))
    : []

  const { data: healthData, isLoading: healthLoading } = useServiceHealth()
  const allMockServices: ServiceHealth[] = (healthData as any)?.data ?? (healthData as any)?.services ?? []

  const isLoading = alertsLoading || positionsLoading || healthLoading

  const { scope: context, setOrganizationIds, setClientIds, setStrategyIds } = useGlobalScope()
  const [showTimeSeries, setShowTimeSeries] = React.useState(true)
  const [batchDate, setBatchDate] = React.useState(getYesterday())
  const { format: valueFormat, setFormat: setValueFormat, formatValue } = useValueFormat("dollar")

  // Build filter context from UI state
  const filterContext: FilterContext = React.useMemo(() => ({
    organizationIds: context.organizationIds,
    clientIds: context.clientIds,
    strategyIds: context.strategyIds,
    mode: context.mode,
    date: context.mode === "batch" ? (context.asOfDatetime?.split("T")[0] || getYesterday()) : getToday(),
  }), [context])

  // Get FILTERED data based on current context
  const filteredStrategies = React.useMemo(() => 
    getFilteredStrategies(filterContext), 
    [filterContext]
  )
  
  const aggregatedPnL = React.useMemo(() => 
    getAggregatedPnL(filterContext),
    [filterContext]
  )
  
  // Time series data - now using aggregation
  const liveTimeSeries = React.useMemo(() => 
    getAggregatedTimeSeries({ ...filterContext, mode: "live" }),
    [filterContext]
  )
  
  const batchTimeSeries = React.useMemo(() => 
    getAggregatedTimeSeries({ ...filterContext, mode: "batch", date: batchDate }),
    [filterContext, batchDate]
  )
  
  // Strategy performance table data
  const strategyPerformance = React.useMemo(() => 
    getStrategyPerformance(filterContext),
    [filterContext]
  )
  
  // Get services relevant to filtered strategies
  const relevantServices = React.useMemo(() => 
    getFilteredServices(filterContext),
    [filterContext]
  )
  
  // Get filtered alerts based on context
  const filteredAlerts = React.useMemo(() => 
    getFilteredAlerts(mockAlerts, filterContext),
    [filterContext]
  )
  
  // Filter services based on what's relevant to current filter context
  const filteredServices = React.useMemo(() => {
    if (relevantServices.length === 0) return allMockServices
    return allMockServices.filter(s => relevantServices.includes(s.name))
  }, [relevantServices])

  // Compute aggregated KPIs from filtered data
  const totalPnl = aggregatedPnL.total
  const totalNav = filteredStrategies.reduce((sum, s) => sum + s.baseCapital, 0)
  const totalExposure = liveTimeSeries.exposure[liveTimeSeries.exposure.length - 1]?.value || 0
  const liveStrategies = filteredStrategies.filter(s => s.status === "live").length
  const warningStrategies = filteredStrategies.filter(s => s.status === "warning").length
  const criticalAlerts = filteredAlerts.filter(a => a.severity === "critical").length
  const highAlerts = filteredAlerts.filter(a => a.severity === "high").length

  // P&L components for attribution panel
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
  ].filter(c => Math.abs(c.pnl) > 0.01 && isFinite(c.pnl))

  // Format helpers
  const formatCurrency = React.useCallback((v: number) => {
    if (valueFormat === "percent") {
      const pct = totalNav > 0 ? (v / totalNav) * 100 : 0
      return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`
    }
    if (Math.abs(v) >= 1000000) return `$${(v / 1000000).toFixed(2)}M`
    if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`
    return `$${v.toFixed(0)}`
  }, [valueFormat, totalNav])
  
  const formatDollar = (v: number) => {
    if (Math.abs(v) >= 1000000) return `$${(v / 1000000).toFixed(2)}M`
    if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`
    return `$${v.toFixed(0)}`
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 p-4 space-y-4 overflow-auto">
        {/* Command Center Header */}
        <div className="flex items-center justify-between gap-4 px-3 py-2 bg-secondary/30 rounded-lg border border-border">
          <ScopeSummary
            organizations={context.organizationIds.map(id => ORGANIZATIONS.find(o => o.id === id)!).filter(Boolean)}
            clients={context.clientIds.map(id => CLIENTS.find(c => c.id === id)!).filter(Boolean)}
            strategies={filteredStrategies.map(s => ({ id: s.id, name: s.name, status: s.status }))}
            selectedStrategyIds={context.strategyIds}
            totalStrategies={STRATEGIES.length}
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
          <InterventionControls
            scope={{
              strategyCount: filteredStrategies.length,
              totalExposure: totalExposure,
              scopeLabel: context.organizationIds.length > 0 || context.clientIds.length > 0
                ? "Filtered"
                : "All Strategies",
            }}
          />
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
                  liveData={liveTimeSeries.pnl}
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
                  <CardTitle className="text-sm">Strategy Performance</CardTitle>
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
                    {strategyPerformance.slice(0, 8).map((s) => (
                      <TableRow key={s.id} className="text-xs">
                        <TableCell>
                          <Link href={`/services/trading/strategies/${s.id}`} className="font-medium hover:underline">
                            {s.name}
                          </Link>
                          <p className="text-[10px] text-muted-foreground">{s.assetClass}</p>
                        </TableCell>
                        <TableCell className={cn("text-right font-mono tabular-nums", s.pnl >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]")}>
                          {formatDollar(s.pnl)}
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
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right: Alerts Feed */}
          <div>
            <AlertsFeed 
              alerts={filteredAlerts.slice(0, 6).map(a => ({
                id: a.id,
                message: a.message,
                severity: a.severity as "low" | "medium" | "high" | "critical",
                timestamp: a.timestamp,
                source: a.source,
              }))} 
            />
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
          <HealthStatusGrid services={filteredServices.slice(0, 8)} />

          {/* Margin Utilization */}
          <MarginUtilization venues={venueMargins} />
        </div>
      </main>
    </div>
  )
}
