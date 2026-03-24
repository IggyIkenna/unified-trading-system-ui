"use client";

import * as React from "react";
import { KPICard } from "@/components/trading/kpi-card";
import {
  StrategyPerformanceTable,
  type StrategyPerformance,
} from "@/components/trading/strategy-performance-table";
import { AlertsFeed, type Alert } from "@/components/trading/alerts-feed";
import {
  PnLAttributionPanel,
  type PnLComponent,
} from "@/components/trading/pnl-attribution-panel";
import {
  HealthStatusGrid,
  type ServiceHealth,
} from "@/components/trading/health-status-grid";
import { LimitBar } from "@/components/trading/limit-bar";
import { AsOfDatetimePicker } from "@/components/trading/as-of-datetime-picker";
import {
  TimeSeriesPanel,
  generateTimeSeriesData,
  type TimeRange,
  type Granularity,
} from "@/components/trading/time-series-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Activity,
  TrendingUp,
  Globe,
  Bell,
  FileText,
} from "lucide-react";

// Mock data
const mockStrategies: StrategyPerformance[] = [
  {
    id: "btc-basis-v3",
    name: "BTC Basis v3",
    status: "live",
    pnl: 412000,
    sharpe: 2.1,
    maxDrawdown: 4.1,
    sparklineData: [10, 15, 12, 18, 22, 20, 25, 28, 30, 32],
    assetClass: "DeFi",
  },
  {
    id: "eth-staked",
    name: "ETH Staked Basis",
    status: "live",
    pnl: 289000,
    sharpe: 2.5,
    maxDrawdown: 3.3,
    sparklineData: [8, 12, 15, 14, 18, 20, 22, 25, 24, 28],
    assetClass: "DeFi",
  },
  {
    id: "aave-lending",
    name: "AAVE Lending",
    status: "live",
    pnl: 91000,
    sharpe: 1.8,
    maxDrawdown: 2.1,
    sparklineData: [5, 8, 10, 12, 11, 14, 15, 16, 18, 19],
    assetClass: "DeFi",
  },
  {
    id: "ml-direction",
    name: "ML Directional",
    status: "warning",
    pnl: -18000,
    sharpe: 0.9,
    maxDrawdown: 6.8,
    sparklineData: [20, 18, 22, 15, 12, 14, 10, 8, 11, 9],
    assetClass: "Crypto",
  },
  {
    id: "spy-ml",
    name: "SPY ML Directional",
    status: "live",
    pnl: 67000,
    sharpe: 1.4,
    maxDrawdown: 3.9,
    sparklineData: [12, 14, 13, 16, 18, 17, 20, 19, 22, 24],
    assetClass: "TradFi",
  },
  {
    id: "sports-arb",
    name: "Sports Arbitrage",
    status: "live",
    pnl: 44000,
    sharpe: 1.6,
    maxDrawdown: 1.8,
    sparklineData: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    assetClass: "Sports",
  },
];

const mockAlerts: Alert[] = [
  {
    id: "1",
    severity: "critical",
    title: "Kill switch armed",
    description: "BTC Basis v3 — inventory skew exceeds threshold",
    timestamp: new Date(Date.now() - 120000),
    source: "risk-monitor",
  },
  {
    id: "2",
    severity: "high",
    title: "Feature freshness degraded",
    description: "features-delta-1 92s lag in EU region",
    timestamp: new Date(Date.now() - 300000),
    source: "feature-monitor",
  },
  {
    id: "3",
    severity: "medium",
    title: "Recon break detected",
    description: "Elysium SMA position mismatch — $12k delta",
    timestamp: new Date(Date.now() - 600000),
    source: "recon-service",
  },
];

const mockPnLComponents: PnLComponent[] = [
  { name: "Funding", pnl: 412000, exposure: "$8.2m" },
  { name: "Basis", pnl: 355000, exposure: "14 bps" },
  { name: "Staking", pnl: 145000, exposure: "LTV .72" },
  { name: "Delta", pnl: 61000, exposure: "$2.4m" },
  { name: "Greeks", pnl: -8000, exposure: "Δ:-0.98" },
  { name: "Slippage", pnl: -61000, exposure: "—" },
  { name: "Fees", pnl: -44000, exposure: "—" },
  { name: "Recon", pnl: -18000, exposure: "4 brks" },
];

const mockServices: ServiceHealth[] = [
  { name: "features-delta-1", freshness: 92, sla: 30, status: "warning" },
  { name: "execution-svc", freshness: 2, sla: 5, status: "live" },
  { name: "risk-exposure", freshness: 4, sla: 10, status: "live" },
  { name: "pnl-attribution", freshness: 8, sla: 15, status: "live" },
  { name: "market-tick-data", freshness: 0.3, sla: 1, status: "live" },
  { name: "ml-inference", freshness: 0, sla: 0, status: "idle" },
];

interface TraderDashboardProps {
  currentPage: string;
}

// Command Center - main trader view
function CommandCenter() {
  const [timeRange, setTimeRange] = React.useState<TimeRange>("1d");
  const [granularity, setGranularity] = React.useState<Granularity>("1h");
  const [showTimeSeries, setShowTimeSeries] = React.useState(true);
  const [currentDate, setCurrentDate] = React.useState(
    new Date().toISOString().split("T")[0],
  );

  const totalPnl = mockPnLComponents.reduce((sum, c) => sum + c.pnl, 0);
  const liveStrategies = mockStrategies.filter(
    (s) => s.status === "live",
  ).length;
  const warningStrategies = mockStrategies.filter(
    (s) => s.status === "warning",
  ).length;
  const criticalAlerts = mockAlerts.filter(
    (a) => a.severity === "critical",
  ).length;
  const highAlerts = mockAlerts.filter((a) => a.severity === "high").length;

  const pnlTimeSeries = React.useMemo(
    () => generateTimeSeriesData(timeRange, granularity, 842000, 0.01),
    [timeRange, granularity],
  );
  const navTimeSeries = React.useMemo(
    () => generateTimeSeriesData(timeRange, granularity, 24500000, 0.005),
    [timeRange, granularity],
  );
  const exposureTimeSeries = React.useMemo(
    () => generateTimeSeriesData(timeRange, granularity, 4200000, 0.02),
    [timeRange, granularity],
  );

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-6">
      {/* Header with Time Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Trading Command Center</h1>
          <p className="text-sm text-muted-foreground">
            Real-time operational state across all strategies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AsOfDatetimePicker />
          <Button variant="outline" size="sm" className="gap-2">
            <Shield className="size-4" />
            Kill Switch
          </Button>
        </div>
      </div>

      {/* Time Series Section */}
      <div className="space-y-2">
        <button
          onClick={() => setShowTimeSeries(!showTimeSeries)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showTimeSeries ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
          {showTimeSeries ? "Hide" : "Show"} Time Series
        </button>

        {showTimeSeries && (
          <Tabs defaultValue="pnl" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pnl">P&L</TabsTrigger>
              <TabsTrigger value="nav">NAV</TabsTrigger>
              <TabsTrigger value="exposure">Exposure</TabsTrigger>
            </TabsList>

            <TabsContent value="pnl">
              <TimeSeriesPanel
                title="Cumulative P&L"
                series={[
                  {
                    id: "pnl",
                    name: "P&L",
                    data: pnlTimeSeries,
                    color: "var(--pnl-positive)",
                  },
                ]}
                selectedRange={timeRange}
                onRangeChange={setTimeRange}
                granularity={granularity}
                onGranularityChange={setGranularity}
                showGranularity={timeRange === "1d"}
                valueFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                height={200}
                showDateNavigation
                currentDate={currentDate}
                onDateChange={setCurrentDate}
              />
            </TabsContent>

            <TabsContent value="nav">
              <TimeSeriesPanel
                title="Net Asset Value"
                series={[
                  {
                    id: "nav",
                    name: "NAV",
                    data: navTimeSeries,
                    color: "var(--surface-trading)",
                  },
                ]}
                selectedRange={timeRange}
                onRangeChange={setTimeRange}
                granularity={granularity}
                onGranularityChange={setGranularity}
                showGranularity={timeRange === "1d"}
                valueFormatter={(v) => `$${(v / 1000000).toFixed(2)}M`}
                height={200}
                showDateNavigation
                currentDate={currentDate}
                onDateChange={setCurrentDate}
              />
            </TabsContent>

            <TabsContent value="exposure">
              <TimeSeriesPanel
                title="Net Exposure"
                series={[
                  {
                    id: "exposure",
                    name: "Exposure",
                    data: exposureTimeSeries,
                    color: "var(--surface-markets)",
                  },
                ]}
                selectedRange={timeRange}
                onRangeChange={setTimeRange}
                granularity={granularity}
                onGranularityChange={setGranularity}
                showGranularity={timeRange === "1d"}
                valueFormatter={(v) => `$${(v / 1000000).toFixed(2)}M`}
                height={200}
                showDateNavigation
                currentDate={currentDate}
                onDateChange={setCurrentDate}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-5 gap-4">
        <KPICard
          title="Firm P&L"
          value={`$${(totalPnl / 1000000).toFixed(2)}m`}
          change={0.8}
          changeLabel="1d"
          sparklineData={[10, 12, 11, 14, 15, 18, 20, 22, 25, 28]}
          status="healthy"
        />
        <KPICard
          title="Net Exposure"
          value="$4.2m"
          subtitle="1.2x leverage"
          sparklineData={[20, 22, 21, 23, 25, 24, 26, 25, 27, 28]}
          status="neutral"
        />
        <KPICard
          title="Margin"
          value="82%"
          subtitle="$340k free"
          status="warning"
        />
        <KPICard
          title="Live Strategies"
          value={liveStrategies.toString()}
          subtitle={`${warningStrategies} warning`}
          status={warningStrategies > 0 ? "warning" : "healthy"}
        />
        <KPICard
          title="Alerts"
          value={mockAlerts.length.toString()}
          subtitle={`${criticalAlerts} crit, ${highAlerts} high`}
          status={
            criticalAlerts > 0
              ? "critical"
              : highAlerts > 0
                ? "warning"
                : "healthy"
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Strategy Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <StrategyPerformanceTable
                strategies={mockStrategies}
                onRowClick={(id) => console.log("Navigate to strategy:", id)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="col-span-5">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                P&L + Risk Attribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <PnLAttributionPanel
                components={mockPnLComponents}
                totalPnl={totalPnl}
                showExposure={true}
              />
            </CardContent>
          </Card>
        </div>

        <div className="col-span-5">
          <Card className="h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="size-4 text-status-warning" />
                Alerts & Incidents
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <AlertsFeed
                alerts={mockAlerts}
                onAcknowledge={(id) => console.log("Acknowledge:", id)}
                onViewAll={() => console.log("View all alerts")}
              />
            </CardContent>
          </Card>
        </div>

        <div className="col-span-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Health & Feature Freshness
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <HealthStatusGrid
                services={mockServices}
                onServiceClick={(name) =>
                  console.log("Navigate to service:", name)
                }
              />
            </CardContent>
          </Card>
        </div>

        <div className="col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Risk Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <LimitBar
                label="Delta Exposure"
                value={2400000}
                limit={5000000}
                unit="$"
                showStatus={false}
              />
              <LimitBar
                label="Margin (Binance)"
                value={78}
                limit={80}
                unit="%"
                showStatus={false}
              />
              <LimitBar
                label="LTV (Aave)"
                value={0.72}
                limit={0.75}
                unit=""
                showStatus={false}
              />
              <LimitBar
                label="Firm Leverage"
                value={1.2}
                limit={3}
                unit="x"
                showStatus={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Placeholder pages for other trader sections
function PositionsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-2">Positions</h1>
      <p className="text-muted-foreground mb-6">
        Live positions across all venues and strategies
      </p>
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          Positions view - coming soon
        </CardContent>
      </Card>
    </div>
  );
}

function StrategiesPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-2">Strategies</h1>
      <p className="text-muted-foreground mb-6">
        Strategy management and configuration
      </p>
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          Strategies view - coming soon
        </CardContent>
      </Card>
    </div>
  );
}

function MarketsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-2">Markets</h1>
      <p className="text-muted-foreground mb-6">
        Market data and instrument analysis
      </p>
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          Markets view - coming soon
        </CardContent>
      </Card>
    </div>
  );
}

function OrdersPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-2">Orders</h1>
      <p className="text-muted-foreground mb-6">
        Order management and execution
      </p>
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          Orders view - coming soon
        </CardContent>
      </Card>
    </div>
  );
}

function AlertsPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-2">Alerts</h1>
      <p className="text-muted-foreground mb-6">Alert management and history</p>
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          Alerts view - coming soon
        </CardContent>
      </Card>
    </div>
  );
}

export function TraderDashboard({ currentPage }: TraderDashboardProps) {
  switch (currentPage) {
    case "positions":
      return <PositionsPage />;
    case "strategies":
      return <StrategiesPage />;
    case "markets":
      return <MarketsPage />;
    case "orders":
      return <OrdersPage />;
    case "alerts":
      return <AlertsPage />;
    case "dashboard":
    default:
      return <CommandCenter />;
  }
}
