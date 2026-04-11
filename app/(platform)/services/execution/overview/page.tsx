"use client";

import { ExecutionNav } from "@/components/execution-platform/execution-nav";
import { ResearchFamilyShell } from "@/components/platform/research-family-shell";
import { ApiError } from "@/components/shared/api-error";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { Spinner } from "@/components/shared/spinner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAlgos, useExecutionMetrics, useOrders, useVenues } from "@/hooks/api/use-orders";
import { SEED_ALGOS, SEED_RECENT_ORDERS, SEED_VENUES } from "@/lib/mocks/fixtures/execution-pages";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  TrendingDown,
  Zap,
} from "lucide-react";

export default function ExecutionOverviewPage() {
  const mockDataMode = isMockDataMode();
  const {
    data: metricsData,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useExecutionMetrics();
  const { data: venuesData, isLoading: venuesLoading, error: venuesError, refetch: refetchVenues } = useVenues();
  const { data: ordersData, isLoading: ordersLoading, error: ordersError, refetch: refetchOrders } = useOrders();
  const { data: algosData, isLoading: algosLoading, error: algosError, refetch: refetchAlgos } = useAlgos();

  const isLoading = metricsLoading || venuesLoading || ordersLoading || algosLoading;

  const metricsRaw: Record<string, any> = (metricsData as any)?.data ?? {};
  const fallbackByAlgo = mockDataMode
    ? { TWAP: 412, VWAP: 318, "Aggressive Limit": 245, Iceberg: 142, POV: 98, Market: 32 }
    : {};
  const metrics: Record<string, any> = {
    ordersExecuted: metricsRaw?.ordersExecuted ?? 0,
    volumeTraded: metricsRaw?.volumeTraded ?? 0,
    avgSlippage: metricsRaw?.avgSlippage ?? 0,
    avgFillRate: metricsRaw?.avgFillRate ?? 0,
    avgLatency: metricsRaw?.avgLatency ?? 0,
    rejects: metricsRaw?.rejects ?? 0,
    ...metricsRaw,
    byAlgo: metricsRaw?.byAlgo ?? fallbackByAlgo,
  };
  const MOCK_VENUES: Array<any> = (venuesData as any)?.data ?? (mockDataMode ? SEED_VENUES : []);
  const MOCK_RECENT_ORDERS: Array<any> = (ordersData as any)?.data ?? (mockDataMode ? SEED_RECENT_ORDERS : []);
  const MOCK_EXECUTION_ALGOS: Array<any> = (algosData as any)?.data ?? (mockDataMode ? SEED_ALGOS : []);

  const hasError = !!(metricsError || venuesError || ordersError || algosError);
  const refetchAll = () => {
    void refetchMetrics();
    void refetchVenues();
    void refetchOrders();
    void refetchAlgos();
  };

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Spinner size="lg" className="text-muted-foreground" />
      </div>
    );
  }

  if (hasError) {
    const err = (metricsError ?? venuesError ?? ordersError ?? algosError) as Error;
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b">
          <div className="platform-page-width px-6 py-3">
            <ExecutionNav />
          </div>
        </div>
        <div className="platform-page-width p-6">
          <ApiError error={err} onRetry={refetchAll} title="Failed to load execution overview" />
        </div>
      </div>
    );
  }

  // Calculate some aggregate stats
  const venueHealth = MOCK_VENUES.filter((v: any) => v.connectivity?.status === "connected").length;
  const totalVenues = MOCK_VENUES.length;
  const liveAlgos = MOCK_EXECUTION_ALGOS.filter((a: any) => a.status === "live").length;

  const execTabs = (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="h-8">
        <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
        <TabsTrigger value="algos" className="text-xs">Algos</TabsTrigger>
        <TabsTrigger value="venues" className="text-xs">Venues</TabsTrigger>
        <TabsTrigger value="tca" className="text-xs">TCA</TabsTrigger>
      </TabsList>
    </Tabs>
  );

  return (
    <ResearchFamilyShell platform="execution" tabs={execTabs} showBatchLiveRail>
      <div className="platform-page-width p-6 space-y-6">
        <PageHeader
          title="Execution"
          description="Real-time execution quality monitoring, algo comparison, and TCA analysis"
        />

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            tone="grid"
            density="panelSm"
            contentClassName="items-stretch px-3 pt-4 text-left"
            body={
              <div className="flex w-full min-w-0 items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-2xl font-bold tabular-nums">{formatNumber(metrics.ordersExecuted, 0)}</div>
                  <div className="text-xs text-muted-foreground">Orders Today</div>
                </div>
                <Activity className="size-8 shrink-0 text-muted-foreground/50" />
              </div>
            }
          />

          <MetricCard
            tone="grid"
            density="panelSm"
            contentClassName="items-stretch px-3 pt-4 text-left"
            body={
              <div className="flex w-full min-w-0 items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-2xl font-bold tabular-nums">${formatNumber(metrics.volumeTraded / 1e6, 0)}M</div>
                  <div className="text-xs text-muted-foreground">Volume Traded</div>
                </div>
                <BarChart3 className="size-8 shrink-0 text-muted-foreground/50" />
              </div>
            }
          />

          <MetricCard
            tone="grid"
            density="panelSm"
            contentClassName="items-stretch px-3 pt-4 text-left"
            body={
              <div className="flex w-full min-w-0 items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-2xl font-bold tabular-nums">
                    {formatNumber(metrics.avgSlippage, 2)}
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Slippage (bps)</div>
                </div>
                <TrendingDown className="size-8 shrink-0 text-emerald-500/50" />
              </div>
            }
          />

          <MetricCard
            tone="grid"
            density="panelSm"
            contentClassName="items-stretch px-3 pt-4 text-left"
            body={
              <div className="flex w-full min-w-0 items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-2xl font-bold tabular-nums">{formatPercent(metrics.avgFillRate, 1)}</div>
                  <div className="text-xs text-muted-foreground">Fill Rate</div>
                </div>
                <CheckCircle2 className="size-8 shrink-0 text-emerald-500/50" />
              </div>
            }
          />

          <MetricCard
            tone="grid"
            density="panelSm"
            contentClassName="items-stretch px-3 pt-4 text-left"
            body={
              <div className="flex w-full min-w-0 items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-2xl font-bold tabular-nums">{metrics.avgLatency}ms</div>
                  <div className="text-xs text-muted-foreground">Avg Latency</div>
                </div>
                <Zap className="size-8 shrink-0 text-blue-500/50" />
              </div>
            }
          />

          <MetricCard
            tone="grid"
            density="panelSm"
            contentClassName="items-stretch px-3 pt-4 text-left"
            body={
              <div className="flex w-full min-w-0 items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-2xl font-bold tabular-nums text-red-500">{metrics.rejects}</div>
                  <div className="text-xs text-muted-foreground">Rejects / Timeouts</div>
                </div>
                <AlertTriangle className="size-8 shrink-0 text-red-500/50" />
              </div>
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Venue Status */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Venue Connectivity</CardTitle>
              <CardDescription>
                {venueHealth}/{totalVenues} venues connected
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {MOCK_VENUES.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No venues connected</p>
              )}
              {MOCK_VENUES.map((venue) => (
                <div key={venue.id} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "size-2 rounded-full",
                        venue.connectivity.status === "connected" && "bg-emerald-500",
                        venue.connectivity.status === "degraded" && "bg-amber-500",
                        venue.connectivity.status === "disconnected" && "bg-red-500",
                      )}
                    />
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
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Executions</CardTitle>
              <CardDescription>Latest order fills with TCA metrics</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
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
                  {MOCK_RECENT_ORDERS.map((order) => (
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
                      <TableCell className="text-right font-mono">${order.filledQty.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">${order.avgPrice.toLocaleString()}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono",
                          order.tca.slippage < 0 ? "text-emerald-500" : "text-red-500",
                        )}
                      >
                        {order.tca.slippage >= 0 ? "+" : ""}
                        {formatNumber(order.tca.slippage, 1)} bps
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            order.status === "filled" && "bg-emerald-500/10 text-emerald-500",
                            order.status === "partial" && "bg-amber-500/10 text-amber-500",
                            order.status === "active" && "bg-blue-500/10 text-blue-500",
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
              {Object.entries(
                metrics.byAlgo as Record<
                  string,
                  {
                    orders: number;
                    volume: number;
                    slippage: number;
                    fillRate: number;
                  }
                >,
              )
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
                        <span className="font-mono">${formatNumber(data.volume / 1e6, 1)}M</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Slippage</span>
                        <span
                          className={cn(
                            "font-mono",
                            data.slippage < 1 ? "text-emerald-500" : data.slippage > 1.5 ? "text-red-500" : "",
                          )}
                        >
                          {formatNumber(data.slippage, 2)} bps
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fill Rate</span>
                        <span className="font-mono">{formatPercent(data.fillRate, 1)}</span>
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
          <CardContent className="overflow-x-auto">
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
                {MOCK_EXECUTION_ALGOS.map((algo) => (
                  <TableRow key={algo.id}>
                    <TableCell className="font-medium">{algo.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{algo.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">{algo.version}</TableCell>
                    <TableCell>{algo.supportedVenues.length} venues</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(algo.metrics.avgSlippage, 2)} bps
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatPercent(algo.metrics.avgFillRate, 1)}</TableCell>
                    <TableCell className="text-right font-mono">{algo.metrics.avgLatency}ms</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          algo.status === "live" && "bg-emerald-500/10 text-emerald-500",
                          algo.status === "testing" && "bg-amber-500/10 text-amber-500",
                          algo.status === "deprecated" && "bg-red-500/10 text-red-500",
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
    </ResearchFamilyShell>
  );
}
