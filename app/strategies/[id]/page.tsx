"use client"

import * as React from "react"
import { use } from "react"
import { AppShell } from "@/components/trading/app-shell"
import { StatusBadge } from "@/components/trading/status-badge"
import { PnLValue } from "@/components/trading/pnl-value"
import { SparklineCell } from "@/components/trading/kpi-card"
import { LimitBar } from "@/components/trading/limit-bar"
import { PnLWaterfall, PnLBarChart } from "@/components/trading/pnl-waterfall"
import { ExecutionModeToggle, ExecutionModeIndicator } from "@/components/trading/execution-mode-toggle"
import { useExecutionMode } from "@/lib/execution-mode-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import { PromoteFlowModal } from "@/components/trading/promote-flow-modal"
import { StrategyAuditTrail } from "@/components/trading/strategy-audit-trail"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/reference-data"
import {
  STRATEGIES,
  getStrategyById,
  generatePnLBreakdown,
  generatePositionsForStrategy,
  type Strategy,
} from "@/lib/strategy-registry"

// Testing stage colors
const STAGE_COLORS: Record<string, string> = {
  done: "var(--status-live)",
  pending: "var(--status-warning)",
  blocked: "var(--status-error)",
}

// Model-Strategy linkage map
const MODEL_STRATEGY_MAP: Record<string, { modelId: string; modelName: string; version: string }> = {
  "CEFI_BTC_ML_DIR_HUF_4H": { modelId: "momentum-btc-xgb", modelName: "BTC Momentum XGBoost", version: "v3.2" },
  "CEFI_ETH_ML_DIR_HUF_4H": { modelId: "momentum-eth-xgb", modelName: "ETH Momentum XGBoost", version: "v2.1" },
  "DEFI_ETH_ML_DIR_SCE_1H": { modelId: "defi-signal-lstm", modelName: "DeFi Signal LSTM", version: "v1.8" },
  "SPORTS_FOOTBALL_ML_ARB": { modelId: "sports-edge-gb", modelName: "Sports Edge GradientBoost", version: "v4.0" },
}

export default function StrategyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { mode, isLive, isBatch } = useExecutionMode()
  const [promoteModalOpen, setPromoteModalOpen] = React.useState(false)
  
  // Get strategy from registry or fallback
  const strategy = getStrategyById(id) ?? STRATEGIES[0]
  const mlModel = MODEL_STRATEGY_MAP[strategy.strategyIdPattern]
  const pnlBreakdown = React.useMemo(() => generatePnLBreakdown(strategy), [strategy])
  const positions = React.useMemo(() => generatePositionsForStrategy(strategy), [strategy])
  
  // Calculate risk limit utilization from strategy config
  const riskLimits = React.useMemo(() => {
    const netExposure = strategy.performance.netExposure
    const maxExposure = parseInt(strategy.configParams.find(c => c.key.includes("capital") || c.key.includes("position"))?.value || "5000000")
    
    return [
      { label: "Net Exposure", value: netExposure, limit: maxExposure * 2, unit: "$" },
      { label: "Position Count", value: strategy.performance.positions, limit: 20, unit: "" },
      { label: "Max Drawdown", value: strategy.performance.maxDrawdown, limit: parseFloat(strategy.riskProfile.maxDrawdown) || 10, unit: "%" },
    ]
  }, [strategy])

  return (
    <AppShell
      activeSurface="strategies"
      activePhase="run"
      breadcrumbs={[
        { label: "Strategies", href: "/strategies" },
        { label: strategy.name },
      ]}
    >
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{strategy.name}</h1>
              <StatusBadge status={strategy.status} />
              <Badge variant="outline" className="font-mono text-xs">
                {strategy.version}
              </Badge>
              <ExecutionModeIndicator />
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">{strategy.description}</p>
            
            {/* Instance Identity Panel - Operational metadata per critique 1.1 */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Strategy ID (structured) */}
              <Badge variant="outline" className="font-mono text-[10px] bg-muted/30">
                {strategy.strategyIdPattern}
              </Badge>
              {/* Config Version */}
              <Badge variant="outline" className="text-[10px]">
                v{strategy.version}
              </Badge>
              {/* Runtime Mode */}
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px]",
                  isLive ? "border-[var(--status-live)] text-[var(--status-live)]" : "border-[var(--surface-markets)] text-[var(--surface-markets)]"
                )}
              >
                {isLive ? "LIVE" : "BATCH"}
              </Badge>
              {/* Data Mode */}
              <Badge variant="outline" className="text-[10px]">
                {isLive ? "REAL" : "HISTORICAL"}
              </Badge>
              {/* Testing Stage (current) */}
              <Badge 
                variant="outline" 
                className={cn(
                  "text-[10px]",
                  strategy.status === "live" ? "border-[var(--status-live)] text-[var(--status-live)]" : "border-[var(--status-warning)] text-[var(--status-warning)]"
                )}
              >
                {strategy.status === "live" ? "LIVE_REAL" : strategy.status === "warning" ? "STAGING" : "LIVE_TESTNET"}
              </Badge>
              {/* Environment */}
              <Badge variant="secondary" className="text-[10px]">
                PROD
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span 
                  className="size-2 rounded-full"
                  style={{ backgroundColor: strategy.assetClass === "DeFi" ? "#4ade80" : strategy.assetClass === "CeFi" ? "#60a5fa" : strategy.assetClass === "TradFi" ? "#a78bfa" : strategy.assetClass === "Sports" ? "#f59e0b" : "#ec4899" }}
                />
                {strategy.assetClass}
              </span>
              <span>{strategy.strategyType}</span>
              {/* Execution Mode Tag (SCE/HUF/EVT) */}
              <Badge variant="outline" className="text-[10px] font-mono">
                {strategy.dataArchitecture.executionMode === "same_candle_exit" ? "SCE" : 
                 strategy.dataArchitecture.executionMode === "hold_until_flip" ? "HUF" : "EVT"}
              </Badge>
              {strategy.deployedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  Deployed {strategy.deployedAt}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
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
                console.log("Promoting strategy:", strategy.id)
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
          </div>
        </div>

        {/* ML Model Link - show if strategy has ML model */}
        {mlModel && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
            <Brain className="size-4" />
            <span>ML Model:</span>
            <Link href={`/quant/models/${mlModel.modelId}`} className="text-[var(--accent-blue)] hover:underline font-medium">
              {mlModel.modelName} {mlModel.version} (deployed)
            </Link>
          </div>
        )}

        {/* KPI Summary Row */}
        <div className="grid grid-cols-6 gap-4">
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
              <div className="text-2xl font-semibold font-mono">{strategy.performance.sharpe.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Return</div>
              <div className={cn("text-2xl font-semibold font-mono", strategy.performance.returnPct >= 0 ? "pnl-positive" : "pnl-negative")}>
                {strategy.performance.returnPct >= 0 ? "+" : ""}{strategy.performance.returnPct.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Max Drawdown</div>
              <div className="text-2xl font-semibold font-mono text-muted-foreground">
                {strategy.performance.maxDrawdown.toFixed(1)}%
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

          {/* P&L Attribution Tab */}
          <TabsContent value="pnl" className="space-y-6">
            <div className="grid grid-cols-12 gap-6">
              <Card className="col-span-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">P&L Waterfall (MTD)</CardTitle>
                      <CardDescription>Breakdown by settlement type</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {isLive ? "Live" : "Reconstructed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <PnLWaterfall data={pnlBreakdown} />
                </CardContent>
              </Card>

              <div className="col-span-4 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Settlement Types</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {strategy.pnlAttribution.components.map(comp => (
                      <div key={comp.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                        <div 
                          className="size-3 rounded-full mt-1 shrink-0"
                          style={{ backgroundColor: comp.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{comp.label}</div>
                          <div className="text-xs text-muted-foreground">{comp.settlementType}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{comp.description}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {strategy.pnlAttribution.formula && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">P&L Formula</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <code className="text-xs bg-muted/50 px-2 py-1 rounded block">
                        {strategy.pnlAttribution.formula}
                      </code>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Instruments Tab */}
          <TabsContent value="instruments">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Instrument Positions</CardTitle>
                  <CardDescription>Active positions by instrument</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Instrument</TableHead>
                        <TableHead>Venue</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {strategy.instruments.map((inst, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs">{inst.key}</TableCell>
                          <TableCell>{inst.venue}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{inst.type}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{inst.role}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Smart Order Routing</CardTitle>
                  <CardDescription>SOR configuration per leg</CardDescription>
                </CardHeader>
                <CardContent>
                  {strategy.sorEnabled && strategy.sorConfig ? (
                    <div className="space-y-4">
                      {strategy.sorConfig.legs.map((leg, idx) => (
                        <div key={idx} className="p-3 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{leg.name}</span>
                            <Badge variant={leg.sorEnabled ? "default" : "outline"} className="text-[10px]">
                              {leg.sorEnabled ? "SOR ON" : "SOR OFF"}
                            </Badge>
                          </div>
                          {leg.allowedVenues && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {leg.allowedVenues.map(v => (
                                <Badge key={v} variant="secondary" className="text-[10px]">{v}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      SOR not enabled for this strategy
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Data & Features Tab */}
          <TabsContent value="data">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Data Architecture</CardTitle>
                  <CardDescription>Data flow configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Raw Data Source</div>
                      <div className="text-sm font-medium">{strategy.dataArchitecture.rawDataSource}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Interval</div>
                      <div className="text-sm font-medium">{strategy.dataArchitecture.interval}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Lowest Granularity</div>
                      <div className="text-sm font-medium">{strategy.dataArchitecture.lowestGranularity}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Execution Mode</div>
                      <Badge variant="outline">{strategy.dataArchitecture.executionMode}</Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Processed Data</div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {strategy.dataArchitecture.processedData.map(d => (
                        <Badge key={d} variant="secondary" className="text-[10px] font-mono">{d}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Features Consumed</CardTitle>
                  <CardDescription>Input features from feature services</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Feature</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>SLA</TableHead>
                        <TableHead>Used For</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {strategy.featuresConsumed.map((feat, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs">{feat.name}</TableCell>
                          <TableCell className="text-xs">{feat.source}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{feat.sla}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{feat.usedFor}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Risk Tab */}
          <TabsContent value="risk">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Risk Profile</CardTitle>
                  <CardDescription>Target risk metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Target Return</div>
                      <div className="text-lg font-semibold font-mono">{strategy.riskProfile.targetReturn}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Target Sharpe</div>
                      <div className="text-lg font-semibold font-mono">{strategy.riskProfile.targetSharpe}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Max Drawdown</div>
                      <div className="text-lg font-semibold font-mono">{strategy.riskProfile.maxDrawdown}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">Max Leverage</div>
                      <div className="text-lg font-semibold font-mono">{strategy.riskProfile.maxLeverage}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Capital Scalability</div>
                    <div className="text-sm font-medium">{strategy.riskProfile.capitalScalability}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Risk Subscriptions</CardTitle>
                  <CardDescription>Risk types monitored by this strategy</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {strategy.riskSubscriptions.map((risk, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-2">
                          {risk.subscribed ? (
                            <CheckCircle className="size-4 text-[var(--status-live)]" />
                          ) : (
                            <XCircle className="size-4 text-muted-foreground" />
                          )}
                          <span className="font-medium text-sm">{risk.riskType}</span>
                        </div>
                        <div className="text-right">
                          {risk.threshold && (
                            <div className="text-xs text-muted-foreground">{risk.threshold}</div>
                          )}
                          {risk.action && (
                            <Badge variant="outline" className="text-[10px]">{risk.action}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Latency Profile</CardTitle>
                  <CardDescription>End-to-end latency targets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm">Data to Signal</span>
                    <span className="font-mono text-sm">{strategy.latencyProfile.dataToSignal}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm">Signal to Instruction</span>
                    <span className="font-mono text-sm">{strategy.latencyProfile.signalToInstruction}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm">Instruction to Fill</span>
                    <span className="font-mono text-sm">{strategy.latencyProfile.instructionToFill}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm font-semibold">End-to-End</span>
                    <span className="font-mono text-sm font-semibold">{strategy.latencyProfile.endToEnd}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Co-location Needed?</span>
                    <Badge variant={strategy.latencyProfile.coLocationNeeded ? "destructive" : "secondary"}>
                      {strategy.latencyProfile.coLocationNeeded ? "Yes" : "No"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Risk Limits</CardTitle>
                  <CardDescription>Current utilization vs limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {riskLimits.map((limit) => (
                    <LimitBar
                      key={limit.label}
                      label={limit.label}
                      value={limit.value}
                      limit={limit.limit}
                      unit={limit.unit}
                      showStatus={true}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Strategy Configuration</CardTitle>
                      <CardDescription>Version {strategy.version}</CardDescription>
                    </div>
                    <Link href={`/config/strategies/${id}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="size-4" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parameter</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {strategy.configParams.map((param) => (
                        <TableRow key={param.key}>
                          <TableCell className="font-mono text-xs">{param.key}</TableCell>
                          <TableCell className="font-mono font-medium">{param.value}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{param.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Venues</CardTitle>
                  <CardDescription>Connected execution venues</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {strategy.venues.map((venue) => (
                    <div key={venue} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="font-medium">{venue}</span>
                      <Badge variant="outline" className="text-[var(--status-live)]">Connected</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {strategy.references && (
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Code References</CardTitle>
                    <CardDescription>Implementation locations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {strategy.references.implementation && (
                        <div className="p-3 rounded-lg bg-muted/30">
                          <div className="text-xs text-muted-foreground mb-1">Implementation</div>
                          <code className="text-xs">{strategy.references.implementation}</code>
                        </div>
                      )}
                      {strategy.references.configSchema && (
                        <div className="p-3 rounded-lg bg-muted/30">
                          <div className="text-xs text-muted-foreground mb-1">Config Schema</div>
                          <code className="text-xs">{strategy.references.configSchema}</code>
                        </div>
                      )}
                      {strategy.references.executionAdapter && (
                        <div className="p-3 rounded-lg bg-muted/30">
                          <div className="text-xs text-muted-foreground mb-1">Execution Adapter</div>
                          <code className="text-xs">{strategy.references.executionAdapter}</code>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Testing Status Tab */}
          <TabsContent value="testing">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Testing Pipeline Status</CardTitle>
                <CardDescription>Progress through testing stages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-4">
                  {strategy.testingStatus.map((stage, idx) => (
                    <div 
                      key={stage.stage}
                      className={cn(
                        "p-4 rounded-lg border text-center relative",
                        stage.status === "done" && "border-[var(--status-live)] bg-[var(--status-live)]/5",
                        stage.status === "pending" && "border-[var(--status-warning)] bg-[var(--status-warning)]/5",
                        stage.status === "blocked" && "border-[var(--status-error)] bg-[var(--status-error)]/5"
                      )}
                    >
                      <div className="flex items-center justify-center mb-2">
                        {stage.status === "done" && <CheckCircle className="size-5 text-[var(--status-live)]" />}
                        {stage.status === "pending" && <Clock className="size-5 text-[var(--status-warning)]" />}
                        {stage.status === "blocked" && <AlertTriangle className="size-5 text-[var(--status-error)]" />}
                      </div>
                      <div className="font-medium text-xs">{stage.stage}</div>
                      <div className="text-[10px] text-muted-foreground uppercase mt-1">{stage.status}</div>
                      {stage.notes && (
                        <div className="text-[10px] text-muted-foreground mt-2 line-clamp-2">{stage.notes}</div>
                      )}
                      {idx < strategy.testingStatus.length - 1 && (
                        <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 size-4 text-muted-foreground z-10" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Decisions Tab - Strategy Audit Trail */}
          <TabsContent value="decisions">
            <StrategyAuditTrail strategyId={strategy.id} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
