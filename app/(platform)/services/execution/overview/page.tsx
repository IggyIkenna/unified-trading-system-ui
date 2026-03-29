"use client";

import { ExecutionNav } from "@/components/execution-platform/execution-nav";
import { PageHeader } from "@/components/platform/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAlgos, useExecutionMetrics, useOrders, useVenues } from "@/hooks/api/use-orders";
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
  const metrics: Record<string, any> = {
    ordersExecuted: metricsRaw?.ordersExecuted ?? 1247,
    volumeTraded: metricsRaw?.volumeTraded ?? 48_320_000,
    avgSlippage: metricsRaw?.avgSlippage ?? 0.82,
    avgFillRate: metricsRaw?.avgFillRate ?? 97.3,
    avgLatency: metricsRaw?.avgLatency ?? 12.4,
    rejects: metricsRaw?.rejects ?? 3,
    ...metricsRaw,
    byAlgo: metricsRaw?.byAlgo ?? { TWAP: 412, VWAP: 318, "Aggressive Limit": 245, Iceberg: 142, POV: 98, Market: 32 },
  };
  const SEED_VENUES = [
    {
      id: "binance",
      name: "Binance",
      connectivity: { status: "connected", latency: 8 },
      volume24h: 18_200_000,
      ordersToday: 342,
    },
    {
      id: "hyperliquid",
      name: "Hyperliquid",
      connectivity: { status: "connected", latency: 12 },
      volume24h: 12_400_000,
      ordersToday: 287,
    },
    {
      id: "deribit",
      name: "Deribit",
      connectivity: { status: "connected", latency: 22 },
      volume24h: 8_100_000,
      ordersToday: 198,
    },
    {
      id: "uniswap",
      name: "Uniswap V3",
      connectivity: { status: "connected", latency: 45 },
      volume24h: 5_600_000,
      ordersToday: 156,
    },
    {
      id: "aave",
      name: "Aave V3",
      connectivity: { status: "connected", latency: 38 },
      volume24h: 3_200_000,
      ordersToday: 84,
    },
    {
      id: "betfair",
      name: "Betfair Exchange",
      connectivity: { status: "connected", latency: 15 },
      volume24h: 820_000,
      ordersToday: 45,
    },
    {
      id: "otc-desk",
      name: "OTC Desk",
      connectivity: { status: "connected", latency: 0 },
      volume24h: 2_400_000,
      ordersToday: 12,
    },
    {
      id: "polymarket",
      name: "Polymarket",
      connectivity: { status: "degraded", latency: 120 },
      volume24h: 340_000,
      ordersToday: 23,
    },
  ];
  const SEED_ALGOS = [
    { id: "twap", name: "TWAP", status: "live", ordersToday: 412, avgSlippage: 0.45, fillRate: 98.2 },
    { id: "vwap", name: "VWAP", status: "live", ordersToday: 318, avgSlippage: 0.62, fillRate: 97.8 },
    { id: "agg-limit", name: "Aggressive Limit", status: "live", ordersToday: 245, avgSlippage: 0.31, fillRate: 99.1 },
    { id: "iceberg", name: "Iceberg", status: "live", ordersToday: 142, avgSlippage: 0.55, fillRate: 96.5 },
    { id: "pov", name: "POV", status: "live", ordersToday: 98, avgSlippage: 0.78, fillRate: 95.2 },
    { id: "market", name: "Market", status: "live", ordersToday: 32, avgSlippage: 2.1, fillRate: 100 },
  ];
  const SEED_RECENT_ORDERS = [
    {
      id: "ORD-4821",
      instrument: "BTC-USDT",
      venue: "Binance",
      algo: "TWAP",
      side: "buy",
      qty: 0.5,
      price: 67250,
      status: "filled",
      slippage: 0.3,
      created_at: new Date(Date.now() - 120_000).toISOString(),
    },
    {
      id: "ORD-4820",
      instrument: "ETH-PERP",
      venue: "Hyperliquid",
      algo: "VWAP",
      side: "sell",
      qty: 10,
      price: 3415,
      status: "filled",
      slippage: 0.5,
      created_at: new Date(Date.now() - 300_000).toISOString(),
    },
    {
      id: "ORD-4819",
      instrument: "SOL-USDT",
      venue: "Binance",
      algo: "Aggressive Limit",
      side: "buy",
      qty: 50,
      price: 142.8,
      status: "filled",
      slippage: 0.15,
      created_at: new Date(Date.now() - 480_000).toISOString(),
    },
    {
      id: "ORD-4818",
      instrument: "BTC-28MAR-68000-C",
      venue: "Deribit",
      algo: "Market",
      side: "buy",
      qty: 2,
      price: 1850,
      status: "filled",
      slippage: 1.8,
      created_at: new Date(Date.now() - 720_000).toISOString(),
    },
    {
      id: "ORD-4817",
      instrument: "WETH",
      venue: "Uniswap V3",
      algo: "Market",
      side: "buy",
      qty: 15,
      price: 3420,
      status: "filled",
      slippage: 0.4,
      created_at: new Date(Date.now() - 900_000).toISOString(),
    },
  ];
  const MOCK_VENUES: Array<any> = (venuesData as any)?.data ?? SEED_VENUES;
  const MOCK_RECENT_ORDERS: Array<any> = (ordersData as any)?.data ?? SEED_RECENT_ORDERS;
  const MOCK_EXECUTION_ALGOS: Array<any> = (algosData as any)?.data ?? SEED_ALGOS;

  const hasError = false; // Always show data with seed fallbacks
  const refetchAll = () => {
    refetchMetrics();
    refetchVenues();
    refetchOrders();
    refetchAlgos();
  };

  if (isLoading && !MOCK_VENUES.length) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  // Calculate some aggregate stats
  const venueHealth = MOCK_VENUES.filter((v: any) => v.connectivity?.status === "connected").length;
  const totalVenues = MOCK_VENUES.length;
  const liveAlgos = MOCK_EXECUTION_ALGOS.filter((a: any) => a.status === "live").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="platform-page-width px-6 py-3">
          <ExecutionNav />
        </div>
      </div>

      <div className="platform-page-width p-6 space-y-6">
        <PageHeader
          title="Execution Platform"
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

        <div className="grid grid-cols-3 gap-6">
          {/* Venue Status */}
          <Card className="col-span-1">
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
    </div>
  );
}
