"use client";

import * as React from "react";
import { use } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { PnLValue } from "@/components/trading/pnl-value";
import { SparklineCell } from "@/components/trading/kpi-card";
import { LimitBar } from "@/components/trading/limit-bar";
import { PnLBarChart } from "@/components/trading/pnl-waterfall";
import { ExecutionModeToggle, ExecutionModeIndicator } from "@/components/trading/execution-mode-toggle";
import { useExecutionMode } from "@/lib/execution-mode-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Pause,
  Settings,
  BarChart2,
  TrendingUp,
  Clock,
  Activity,
  ChevronRight,
  Layers,
  Database,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  History,
  Rocket,
  Brain,
  LineChart as LineChartIcon,
} from "lucide-react";
import { PromoteFlowModal } from "@/components/promote/promote-flow-modal";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/reference-data";
import {
  STRATEGIES as DEFAULT_STRATEGIES,
  getStrategyById as getDefaultStrategyById,
  generatePnLBreakdown,
  generatePositionsForStrategy,
  type Strategy,
  type PnLBreakdownData,
} from "@/lib/mocks/fixtures/strategy-instances";
import { useStrategyPerformance } from "@/hooks/api/use-strategies";
import { ApiError } from "@/components/shared/api-error";
import { Spinner } from "@/components/shared/spinner";
import { MODEL_STRATEGY_MAP } from "./components/strategy-detail-constants";
import { StrategyDetailTabPanels } from "./components/strategy-detail-tab-panels";
import { StrategyDetailArchetypePanel } from "./components/strategy-detail-archetype-panel";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

function decodeStrategyRouteId(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function StrategyDetailPageClient({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = use(params);
  const id = decodeStrategyRouteId(rawId);
  const { mode, isLive, isBatch } = useExecutionMode();
  const { data: perfData, isLoading, isError, error, refetch } = useStrategyPerformance();
  const perfRaw: any[] = (perfData as any)?.data ?? (perfData as any)?.strategies ?? [];
  const STRATEGIES: Strategy[] = perfRaw.length > 0 ? (perfRaw as Strategy[]) : DEFAULT_STRATEGIES;

  const [promoteModalOpen, setPromoteModalOpen] = React.useState(false);

  // Prefer registry version (has full fields: pnlAttribution, instruments, etc.)
  // Fall back to API data if not in registry
  const apiStrategy = perfRaw.find((s: Record<string, unknown>) => s.id === id) as Record<string, unknown> | undefined;
  const registryStrategy = getDefaultStrategyById(id);
  // Merge: registry as base, API data for live metrics
  const strategy = registryStrategy
    ? {
        ...registryStrategy,
        ...(apiStrategy
          ? {
              pnl: apiStrategy.pnl,
              nav: apiStrategy.nav,
              exposure: apiStrategy.exposure,
              sharpe: apiStrategy.sharpe,
            }
          : {}),
      }
    : ((apiStrategy as unknown as Strategy) ?? DEFAULT_STRATEGIES[0]);
  const mlModel = MODEL_STRATEGY_MAP[strategy.strategyIdPattern];
  const pnlBreakdown: PnLBreakdownData = React.useMemo(() => {
    try {
      return generatePnLBreakdown(strategy);
    } catch {
      return {
        strategyId: strategy.id,
        total: strategy.performance?.pnlMTD ?? 0,
        components: [],
        realized: 0,
        unrealized: 0,
        residual: 0,
      } as PnLBreakdownData;
    }
  }, [strategy]);
  const positions = React.useMemo(() => generatePositionsForStrategy(strategy), [strategy]);

  // Calculate risk limit utilization from strategy config
  const riskLimits = React.useMemo(() => {
    const netExposure = strategy.performance.netExposure;
    const maxExposure = parseInt(
      strategy.configParams.find((c) => c.key.includes("capital") || c.key.includes("position"))?.value || "5000000",
    );

    return [
      {
        label: "Net Exposure",
        value: netExposure,
        limit: maxExposure * 2,
        unit: "$",
      },
      {
        label: "Position Count",
        value: strategy.performance.positions,
        limit: 20,
        unit: "",
      },
      {
        label: "Max Drawdown",
        value: strategy.performance.maxDrawdown,
        limit: parseFloat(strategy.riskProfile.maxDrawdown) || 10,
        unit: "%",
      },
    ];
  }, [strategy]);

  const hasRegistryFallback = registryStrategy !== undefined;

  // Registry-backed strategies must render even when /api/trading/performance fails (demo, offline, proxy).
  if (isLoading && !hasRegistryFallback) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <Spinner size="lg" className="text-muted-foreground" />
      </div>
    );
  }

  if (isError && !hasRegistryFallback) {
    return (
      <div className="p-8">
        <ApiError error={error as Error} onRetry={() => void refetch()} title="Failed to load strategy" />
      </div>
    );
  }

  const arch = strategy.archetype as string;

  return (
    <div className="p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <PageHeader
          title={
            <span className="flex flex-wrap items-center gap-3">
              {strategy.name}
              <StatusBadge status={strategy.status} />
              <Badge variant="outline" className="font-mono text-xs">
                {strategy.version}
              </Badge>
              <ExecutionModeIndicator />
            </span>
          }
          description={
            <div className="space-y-2">
              <p className="max-w-2xl text-sm text-muted-foreground">{strategy.description}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-muted/30 font-mono text-[10px]">
                  {strategy.strategyIdPattern}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  v{strategy.version}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    isLive
                      ? "border-[var(--status-live)] text-[var(--status-live)]"
                      : "border-[var(--surface-markets)] text-[var(--surface-markets)]",
                  )}
                >
                  {isLive ? "LIVE" : "BATCH"}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {isLive ? "REAL" : "HISTORICAL"}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    strategy.status === "live"
                      ? "border-[var(--status-live)] text-[var(--status-live)]"
                      : "border-[var(--status-warning)] text-[var(--status-warning)]",
                  )}
                >
                  {strategy.status === "live"
                    ? "LIVE_REAL"
                    : strategy.status === "warning"
                      ? "STAGING"
                      : "LIVE_TESTNET"}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  PROD
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{
                      backgroundColor:
                        strategy.assetClass === "DeFi"
                          ? "#4ade80"
                          : strategy.assetClass === "CeFi"
                            ? "#60a5fa"
                            : strategy.assetClass === "TradFi"
                              ? "#a78bfa"
                              : strategy.assetClass === "Sports"
                                ? "#f59e0b"
                                : "#ec4899",
                    }}
                  />
                  {strategy.assetClass}
                </span>
                <span>{strategy.strategyType}</span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {strategy.dataArchitecture.executionMode === "same_candle_exit"
                    ? "SCE"
                    : strategy.dataArchitecture.executionMode === "hold_until_flip"
                      ? "HUF"
                      : "EVT"}
                </Badge>
                {strategy.deployedAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    Deployed {strategy.deployedAt}
                  </span>
                )}
              </div>
            </div>
          }
        >
          <ExecutionModeToggle size="sm" />
          {strategy.status === "live" ? (
            <Button variant="outline" size="sm" className="gap-2">
              <Pause className="size-4" />
              Pause
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="gap-2">
              <Play className="size-4" />
              Resume
            </Button>
          )}
          <PromoteFlowModal
            strategyId={strategy.id}
            strategyName={strategy.name}
            currentStage={strategy.status === "live" ? "LIVE_REAL" : "STAGING"}
            onPromote={async () => {
              console.log("Promoting strategy:", strategy.id);
            }}
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
                <Rocket className="size-4" />
                Promote
              </Button>
            }
          />
          <Link href={`/config/strategies/${id}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="size-4" />
              Config
            </Button>
          </Link>
          <Link href={`/positions?strategy_id=${id}`}>
            <Button size="sm" className="gap-2">
              <Activity className="size-4" />
              View Positions
            </Button>
          </Link>
        </PageHeader>

        {/* ML Model Link - show if strategy has ML model */}
        {mlModel && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
            <Brain className="size-4" />
            <span>ML Model:</span>
            <Link
              href={`/quant/models/${mlModel.modelId}`}
              className="text-[var(--accent-blue)] hover:underline font-medium"
            >
              {mlModel.modelName} {mlModel.version} (deployed)
            </Link>
          </div>
        )}

        {/* KPI Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Total P&L</div>
              <PnLValue value={strategy.performance.pnlTotal} size="lg" />
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">MTD P&L</div>
              <PnLValue value={strategy.performance.pnlMTD} size="lg" />
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Sharpe</div>
              <div className="text-2xl font-semibold font-mono">{formatNumber(strategy.performance.sharpe, 2)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Return</div>
              <div
                className={cn(
                  "text-2xl font-semibold font-mono",
                  strategy.performance.returnPct >= 0 ? "pnl-positive" : "pnl-negative",
                )}
              >
                {strategy.performance.returnPct >= 0 ? "+" : ""}
                {formatPercent(strategy.performance.returnPct, 1)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Max Drawdown</div>
              <div className="text-2xl font-semibold font-mono text-muted-foreground">
                {formatPercent(strategy.performance.maxDrawdown, 1)}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Net Exposure</div>
              <div className="text-2xl font-semibold font-mono">
                ${formatCurrency(strategy.performance.netExposure)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pnl" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pnl" className="gap-2">
              <TrendingUp className="size-4" />
              P&L Attribution
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <LineChartIcon className="size-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="instruments" className="gap-2">
              <Layers className="size-4" />
              Instruments
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="size-4" />
              Data & Features
            </TabsTrigger>
            <TabsTrigger value="risk" className="gap-2">
              <Shield className="size-4" />
              Risk
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="size-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="testing" className="gap-2">
              <BarChart2 className="size-4" />
              Testing Status
            </TabsTrigger>
            <TabsTrigger value="decisions" className="gap-2">
              <History className="size-4" />
              Decisions
            </TabsTrigger>
          </TabsList>
          <StrategyDetailTabPanels
            strategy={strategy}
            id={id}
            isLive={isLive}
            pnlBreakdown={pnlBreakdown}
            riskLimits={riskLimits}
          />
        </Tabs>
        <StrategyDetailArchetypePanel strategy={strategy} arch={arch} />
      </div>
    </div>
  );
}
