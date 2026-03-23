"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { ExecutionNav } from "@/components/execution-platform/execution-nav"
import { useOrders, useAlgos, useVenues, useExecutionMetrics } from "@/hooks/api/use-orders"
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  RefreshCw,
} from "lucide-react"

export default function ExecutionOverviewPage() {
  const { data: metricsData, isLoading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useExecutionMetrics()
  const { data: venuesData, isLoading: venuesLoading, error: venuesError, refetch: refetchVenues } = useVenues()
  const { data: ordersData, isLoading: ordersLoading, error: ordersError, refetch: refetchOrders } = useOrders()
  const { data: algosData, isLoading: algosLoading, error: algosError, refetch: refetchAlgos } = useAlgos()

  const isLoading = metricsLoading || venuesLoading || ordersLoading || algosLoading

  const metricsRaw: Record<string, any> = (metricsData as any)?.data ?? {}
  const metrics: Record<string, any> = {
    ordersExecuted: 0, volumeTraded: 0, avgSlippage: 0, avgFillRate: 0, avgLatency: 0, rejects: 0,
    ...metricsRaw,
    byAlgo: metricsRaw?.byAlgo ?? {},
  }
  const MOCK_VENUES: Array<any> = (venuesData as any)?.data ?? []
  const MOCK_RECENT_ORDERS: Array<any> = (ordersData as any)?.data ?? []
  const MOCK_EXECUTION_ALGOS: Array<any> = (algosData as any)?.data ?? []

  const hasError = metricsError || venuesError || ordersError || algosError
  const refetchAll = () => { refetchMetrics(); refetchVenues(); refetchOrders(); refetchAlgos() }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

  if (hasError) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <AlertCircle className="size-8 text-destructive" />
        <p>Failed to load execution data</p>
        <Button variant="outline" size="sm" onClick={refetchAll}>
          <RefreshCw className="size-3.5 mr-1.5" />
          Retry
        </Button>
      </div>
    )
  }

  // Calculate some aggregate stats
  const venueHealth = MOCK_VENUES.filter((v: any) => v.connectivity?.status === "connected").length
  const totalVenues = MOCK_VENUES.length
  const liveAlgos = MOCK_EXECUTION_ALGOS.filter((a: any) => a.status === "live").length

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-[1800px] mx-auto px-6 py-3">
          <ExecutionNav />
        </div>
      </div>
      
      <div className="max-w-[1800px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Execution Platform</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time execution quality monitoring, algo comparison, and TCA analysis
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{metrics.ordersExecuted.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Orders Today</div>
                </div>
                <Activity className="size-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">${(metrics.volumeTraded / 1e6).toFixed(0)}M</div>
                  <div className="text-xs text-muted-foreground">Volume Traded</div>
                </div>
                <BarChart3 className="size-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono">{metrics.avgSlippage.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Avg Slippage (bps)</div>
                </div>
                <TrendingDown className="size-8 text-emerald-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{metrics.avgFillRate.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Fill Rate</div>
                </div>
                <CheckCircle2 className="size-8 text-emerald-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono">{metrics.avgLatency}ms</div>
                  <div className="text-xs text-muted-foreground">Avg Latency</div>
                </div>
                <Zap className="size-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-red-500">{metrics.rejects}</div>
                  <div className="text-xs text-muted-foreground">Rejects / Timeouts</div>
                </div>
                <AlertTriangle className="size-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Venue Status */}
          <Card className="col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Venue Connectivity</CardTitle>
              <CardDescription>{venueHealth}/{totalVenues} venues connected</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_VENUES.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No venues connected</p>
              )}
              {MOCK_VENUES.map(venue => (
                <div key={venue.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "size-2 rounded-full",
                      venue.connectivity.status === "connected" && "bg-emerald-500",
                      venue.connectivity.status === "degraded" && "bg-amber-500",
                      venue.connectivity.status === "disconnected" && "bg-red-500"
                    )} />
                    <div>
                      <div className="font-medium text-sm">{venue.name}</div>
                      <div className="text-xs text-muted-foreground">{venue.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">{venue.connectivity.latency}ms</div>
                    <div className="text-xs text-muted-foreground">{venue.volume.marketShare}% share</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Executions</CardTitle>
              <CardDescription>Latest order fills with TCA metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Algo</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">Slippage</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_RECENT_ORDERS.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No recent executions
                      </TableCell>
                    </TableRow>
                  )}
                  {MOCK_RECENT_ORDERS.map(order => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {order.side === "BUY" ? (
                            <ArrowUpRight className="size-4 text-emerald-500" />
                          ) : (
                            <ArrowDownRight className="size-4 text-red-500" />
                          )}
                          <span className="font-medium">{order.instrument}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.algo}</Badge>
                      </TableCell>
                      <TableCell className="capitalize">{order.venue}</TableCell>
                      <TableCell className="text-right font-mono">
                        ${(order.filledQty).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${order.avgPrice.toLocaleString()}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono",
                        order.tca.slippage < 0 ? "text-emerald-500" : "text-red-500"
                      )}>
                        {order.tca.slippage >= 0 ? "+" : ""}{order.tca.slippage.toFixed(1)} bps
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={cn(
                            order.status === "filled" && "bg-emerald-500/10 text-emerald-500",
                            order.status === "partial" && "bg-amber-500/10 text-amber-500",
                            order.status === "active" && "bg-blue-500/10 text-blue-500"
                          )}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Algo Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Algo Performance (Today)</CardTitle>
            <CardDescription>Execution quality by algorithm type</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(metrics.byAlgo).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No algo performance data available yet</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(metrics.byAlgo as Record<string, { orders: number; volume: number; slippage: number; fillRate: number }>)
                .filter(([, data]) => data.orders > 0)
                .sort((a, b) => b[1].volume - a[1].volume)
                .map(([algo, data]) => (
                  <div key={algo} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline">{algo}</Badge>
                      <span className="text-xs text-muted-foreground">{data.orders} orders</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Volume</span>
                        <span className="font-mono">${(data.volume / 1e6).toFixed(1)}M</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Slippage</span>
                        <span className={cn(
                          "font-mono",
                          data.slippage < 1 ? "text-emerald-500" : data.slippage > 1.5 ? "text-red-500" : ""
                        )}>
                          {data.slippage.toFixed(2)} bps
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fill Rate</span>
                        <span className="font-mono">{data.fillRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Algos Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Live Algorithms</CardTitle>
            <CardDescription>{liveAlgos} algorithms currently in production</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Algorithm</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Venues</TableHead>
                  <TableHead className="text-right">Avg Slippage</TableHead>
                  <TableHead className="text-right">Fill Rate</TableHead>
                  <TableHead className="text-right">Latency</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_EXECUTION_ALGOS.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No algorithms configured
                    </TableCell>
                  </TableRow>
                )}
                {MOCK_EXECUTION_ALGOS.map(algo => (
                  <TableRow key={algo.id}>
                    <TableCell className="font-medium">{algo.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{algo.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">{algo.version}</TableCell>
                    <TableCell>{algo.supportedVenues.length} venues</TableCell>
                    <TableCell className="text-right font-mono">{algo.metrics.avgSlippage.toFixed(2)} bps</TableCell>
                    <TableCell className="text-right font-mono">{algo.metrics.avgFillRate.toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-mono">{algo.metrics.avgLatency}ms</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={cn(
                          algo.status === "live" && "bg-emerald-500/10 text-emerald-500",
                          algo.status === "testing" && "bg-amber-500/10 text-amber-500",
                          algo.status === "deprecated" && "bg-red-500/10 text-red-500"
                        )}
                      >
                        {algo.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
