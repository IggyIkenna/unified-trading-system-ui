"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { LimitBar } from "@/components/trading/limit-bar"
import { PnLValue } from "@/components/trading/pnl-value"
import { StatusBadge } from "@/components/trading/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Shield,
  TrendingUp,
  Wallet,
  AlertTriangle,
  BarChart3,
  LineChart,
  Activity,
  Clock,
  Zap,
  ChevronDown,
  ChevronRight,
  Info,
  Target,
  X,
  OctagonX,
  RotateCcw,
  ArrowDownToLine,
  Power,
} from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart,
  Cell,
  ReferenceLine,
} from "recharts"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { apiFetch } from "@/lib/api/fetch"
import { toast } from "sonner"
import { useGlobalScope } from "@/lib/stores/global-scope-store"
import {
  useRiskLimits,
  useVaR,
  useGreeks,
  useStressScenarios,
  useVarSummary,
  useStressTest,
  useRegime,
  usePortfolioGreeks,
  useVenueCircuitBreakers,
  useCircuitBreakerMutation,
  useKillSwitchMutation,
} from "@/hooks/api/use-risk"

const DynamicCorrelationHeatmap = dynamic(
  () => import("@/components/risk/correlation-heatmap").then(m => m.CorrelationHeatmap),
  { ssr: false, loading: () => <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-8 w-full bg-accent animate-pulse rounded-md" />)}</div> }
)

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface RiskLimit {
  id: string
  name: string
  value: number
  limit: number
  unit: string
  category: "exposure" | "margin" | "ltv" | "concentration"
  entity: string
  entityType: "company" | "client" | "account" | "strategy" | "underlying" | "instrument"
  level: number // 0-5 for tree depth
  parentId?: string
  var95?: number
}

// Strategy-specific risk type mapping
const STRATEGY_RISK_MAP: Record<string, string[]> = {
  "BASIS_TRADE": ["delta", "funding", "basis", "protocol_risk"],
  "YIELD": ["protocol_risk", "liquidity", "concentration"],
  "MARKET_MAKING": ["delta", "liquidity", "venue_protocol", "concentration"],
  "OPTIONS": ["delta", "gamma", "vega", "theta", "rho", "volga", "vanna", "slide"],
  "DIRECTIONAL": ["delta", "concentration", "duration"],
  "MOMENTUM": ["delta", "concentration"],
  "MEAN_REVERSION": ["delta", "basis", "concentration"],
  "STATISTICAL_ARB": ["delta", "correlation", "concentration", "edge_decay"],
  "ARBITRAGE": ["delta", "edge_decay", "market_suspension", "concentration"],
}

interface ExposureRow {
  component: string
  category: "first_order" | "second_order" | "structural" | "operational" | "domain_specific"
  pnl: number
  exposure: number | string
  limit: number | string
  utilization: number
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getUtilization(value: number, limit: number): number {
  if (limit === 0) return 0
  return Math.min((value / limit) * 100, 100)
}

function getStatusFromUtil(util: number): "live" | "warning" | "critical" {
  if (util < 70) return "live"
  if (util < 90) return "warning"
  return "critical"
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function getAssetClassColor(assetClass: string): string {
  switch (assetClass) {
    case "defi": return "var(--surface-config)"
    case "cefi": return "var(--surface-trading)"
    case "tradfi": return "var(--surface-markets)"
    case "sports": return "var(--surface-strategy)"
    default: return "var(--muted-foreground)"
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

// Mock strategy list for the filter
const MOCK_STRATEGIES = [
  { id: "s1", name: "ETH Basis Trade", archetype: "BASIS_TRADE", strategyIdPattern: "DEFI_ETH_BASIS_SCE_1H" },
  { id: "s2", name: "BTC Market Making", archetype: "MARKET_MAKING", strategyIdPattern: "CEFI_BTC_MM_EVT_TICK" },
  { id: "s3", name: "ETH Options MM", archetype: "OPTIONS", strategyIdPattern: "CEFI_ETH_OPT_MM_EVT_TICK" },
  { id: "s4", name: "SPY Momentum", archetype: "DIRECTIONAL", strategyIdPattern: "TRADFI_SPY_MOM_HUF_1D" },
  { id: "s5", name: "Football Arb", archetype: "ARBITRAGE", strategyIdPattern: "SPORTS_FOOTBALL_ARB_EVT" },
  { id: "s6", name: "Aave Yield", archetype: "YIELD", strategyIdPattern: "DEFI_AAVE_YIELD_SCE_1H" },
  { id: "s7", name: "Statistical Arb", archetype: "STATISTICAL_ARB", strategyIdPattern: "CEFI_STAT_ARB_HUF_5M" },
]

// Map exposure row component names to risk type keys
const COMPONENT_TO_RISK_TYPE: Record<string, string> = {
  "Delta": "delta",
  "Gamma": "gamma",
  "Vega": "vega",
  "Theta": "theta",
  "Rho": "rho",
  "Volga": "volga",
  "Vanna": "vanna",
  "Slide": "slide",
  "Funding": "funding",
  "Basis": "basis",
  "Duration": "duration",
  "Convexity": "convexity",
  "Liquidity": "liquidity",
  "Concentration": "concentration",
  "Venue/Protocol": "venue_protocol",
  "Correlation": "correlation",
  "Staking/LTV": "staking_ltv",
  "Protocol Risk": "protocol_risk",
  "Impermanent Loss": "impermanent_loss",
  "Edge Decay": "edge_decay",
  "Market Suspension": "market_suspension",
  "Interest Rate": "interest_rate",
  "Spread": "spread",
}

export default function RiskPage() {
  const { data: riskLimitsData, isLoading: limitsLoading } = useRiskLimits()
  const { data: varData, isLoading: varLoading } = useVaR()
  const { data: greeksData, isLoading: greeksLoading } = useGreeks()
  const { data: stressScenariosData, isLoading: stressLoading } = useStressScenarios()

  // --- New hooks (Parts 1-7) ---
  const { scope } = useGlobalScope()
  const isBatchMode = scope.mode === "batch"

  const { data: varSummaryData, isLoading: varSummaryLoading } = useVarSummary()
  const [selectedStressScenario, setSelectedStressScenario] = React.useState<string | null>(null)
  const { data: stressTestResult, isLoading: stressTestLoading } = useStressTest(selectedStressScenario)
  const { data: regimeData } = useRegime()
  const { data: portfolioGreeksData, isLoading: portfolioGreeksLoading } = usePortfolioGreeks()
  // Correlation heatmap data now handled by DynamicCorrelationHeatmap component
  const { data: venueCircuitBreakers } = useVenueCircuitBreakers()

  const circuitBreakerMutation = useCircuitBreakerMutation()
  const killSwitchMutation = useKillSwitchMutation()

  // Per-strategy state tracking for UI badges
  const [trippedStrategies, setTrippedStrategies] = React.useState<Set<string>>(new Set())
  const [killedStrategies, setKilledStrategies] = React.useState<Set<string>>(new Set())
  const [scaledStrategies, setScaledStrategies] = React.useState<Record<string, number>>({})

  // Stress scenario slider state (Part 5)
  const [btcPriceChangePct, setBtcPriceChangePct] = React.useState(0)

  // Correlation heatmap hover state (Part 7)
  // hoveredCell state moved to CorrelationHeatmap component

  // Extract API data with safe fallbacks
  const mockLimitsHierarchy: RiskLimit[] = (riskLimitsData as any)?.data ?? (riskLimitsData as any)?.limits ?? []
  const componentVarData: any[] = (varData as any)?.data ?? (varData as any)?.components ?? []
  const stressScenarios: any[] = (stressScenariosData as any)?.data ?? (stressScenariosData as any)?.scenarios ?? []
  const greeksRaw = (greeksData as any)?.data ?? greeksData ?? {}
  const portfolioGreeks = greeksRaw?.portfolio ?? { delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 }
  const positionGreeks: any[] = greeksRaw?.positions ?? []
  const greeksTimeSeries: any[] = greeksRaw?.timeSeries ?? []
  const secondOrderRisks = greeksRaw?.secondOrder ?? { volga: 0, vanna: 0, slide: 0 }

  // Derived data from API or computed fallbacks
  const strategyRiskHeatmap: Array<{ strategy: string; status: string; [key: string]: string }> = (riskLimitsData as any)?.heatmap ?? []
  const allExposureRows: ExposureRow[] = (riskLimitsData as any)?.exposureRows ?? []
  const exposureTimeSeries: any[] = (riskLimitsData as any)?.exposureTimeSeries ?? []
  const termStructureData: any[] = (varData as any)?.termStructure ?? []
  const hfTimeSeries: any[] = (riskLimitsData as any)?.hfTimeSeries ?? []
  const distanceToLiquidation: any[] = (riskLimitsData as any)?.distanceToLiquidation ?? []

  const isLoading = limitsLoading || varLoading || greeksLoading || stressLoading

  const [varMethod, setVarMethod] = React.useState<"historical" | "parametric" | "monte_carlo" | "filtered_historical">("historical")
  const [regimeMultiplier, setRegimeMultiplier] = React.useState(1.0)
  const [exposurePeriod, setExposurePeriod] = React.useState<"1W" | "1M" | "3M">("1M")
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>(["first_order", "domain_specific"])

  // Item 1: Strategy risk filter state
  const [riskFilterStrategy, setRiskFilterStrategy] = React.useState<string>("all")

  // Item 2: Hierarchy node selection state
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null)

  // VaR method multipliers for visual variation
  const varMethodMultipliers: Record<string, number> = {
    historical: 1.0,
    parametric: 0.92,
    monte_carlo: 1.08,
    filtered_historical: 1.05,
  }

  const adjustedVarData = componentVarData.map((d: any) => ({
    ...d,
    var95: Math.round((d.var95 ?? 0) * varMethodMultipliers[varMethod] * regimeMultiplier),
  }))

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

  // KPI calculations
  const totalVar95 = 2100000 * regimeMultiplier
  const totalVar99 = 4800000 * regimeMultiplier
  const totalES95 = 3200000 * regimeMultiplier
  const totalES99 = 6700000 * regimeMultiplier

  // Sorted limits for display
  const sortedLimits = React.useMemo(() => {
    return [...mockLimitsHierarchy].sort((a, b) => {
      const utilA = getUtilization(a.value, a.limit)
      const utilB = getUtilization(b.value, b.limit)
      return utilB - utilA
    })
  }, [])

  const criticalCount = sortedLimits.filter((l) => getUtilization(l.value, l.limit) >= 90).length
  const warningCount = sortedLimits.filter((l) => {
    const util = getUtilization(l.value, l.limit)
    return util >= 70 && util < 90
  }).length

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  // Item 1: Filter exposure rows by strategy archetype
  const selectedStrategy = MOCK_STRATEGIES.find(s => s.archetype === riskFilterStrategy)
  const relevantRiskTypes = riskFilterStrategy === "all" 
    ? null 
    : STRATEGY_RISK_MAP[riskFilterStrategy] || []
  
  const filteredExposureRows = React.useMemo(() => {
    if (!relevantRiskTypes) return allExposureRows
    return allExposureRows.filter(row => {
      const riskType = COMPONENT_TO_RISK_TYPE[row.component]
      return riskType && relevantRiskTypes.includes(riskType)
    })
  }, [relevantRiskTypes])

  // Item 2: Get selected hierarchy node info
  const selectedHierarchyNode = selectedNode 
    ? mockLimitsHierarchy.find(l => l.entity === selectedNode) 
    : null

  const groupedExposure = React.useMemo(() => {
    const groups: Record<string, ExposureRow[]> = {
      first_order: [],
      second_order: [],
      structural: [],
      operational: [],
      domain_specific: [],
    }
    filteredExposureRows.forEach(row => {
      groups[row.category].push(row)
    })
    return groups
  }, [filteredExposureRows])

  // --- Action handlers (Part 1) ---
  const handleTripCircuitBreaker = (strategyId: string, strategyName: string) => {
    circuitBreakerMutation.mutate(
      { strategy_id: strategyId, action: "trip" },
      {
        onSuccess: () => {
          setTrippedStrategies((prev) => new Set([...prev, strategyId]))
          toast.success(`Circuit breaker tripped for ${strategyName}`)
        },
        onError: () => {
          toast.error(`Failed to trip circuit breaker for ${strategyName}`)
        },
      },
    )
  }

  const handleResetCircuitBreaker = (strategyId: string, strategyName: string) => {
    circuitBreakerMutation.mutate(
      { strategy_id: strategyId, action: "reset" },
      {
        onSuccess: () => {
          setTrippedStrategies((prev) => {
            const next = new Set(prev)
            next.delete(strategyId)
            return next
          })
          toast.success(`Circuit breaker reset for ${strategyName}`)
        },
        onError: () => {
          toast.error(`Failed to reset circuit breaker for ${strategyName}`)
        },
      },
    )
  }

  const handleKillSwitch = (strategyId: string, strategyName: string) => {
    killSwitchMutation.mutate(
      { scope: "strategy", target_id: strategyId },
      {
        onSuccess: () => {
          setKilledStrategies((prev) => new Set([...prev, strategyId]))
          toast.error(`Kill switch activated for ${strategyName}`)
        },
        onError: () => {
          toast.error(`Failed to activate kill switch for ${strategyName}`)
        },
      },
    )
  }

  // Check if any strategy has kill_switch_active
  const anyKillSwitchActive =
    killedStrategies.size > 0 ||
    (venueCircuitBreakers ?? []).some((v) => v.kill_switch_active)

  // Stress slider PnL computation (Part 5)
  const greeksForSlider = portfolioGreeksData?.portfolio ?? portfolioGreeks
  const btcSpot = 65000
  const dS = btcSpot * (btcPriceChangePct / 100)
  const estimatedPnl = greeksForSlider.delta * dS + 0.5 * greeksForSlider.gamma * dS * dS

  return (
    <div className="p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Kill Switch Banner (Part 6) */}
        {anyKillSwitchActive && (
          <div className="rounded-lg border-2 border-rose-500 bg-rose-500/10 p-4 flex items-center gap-3">
            <OctagonX className="size-6 text-rose-400 shrink-0" />
            <div>
              <p className="font-semibold text-rose-400">KILL SWITCH ACTIVE</p>
              <p className="text-sm text-rose-300">
                One or more strategies have been forcibly stopped. Review immediately.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Shield className="size-6 text-rose-400" />
              Risk Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Comprehensive risk analytics for CRO morning briefing
            </p>
          </div>
          <div className="flex items-center gap-4">
            {isBatchMode && (
              <Badge variant="secondary" className="text-xs">Batch Mode - Actions Disabled</Badge>
            )}
            {criticalCount > 0 && <StatusBadge status="critical" label={`${criticalCount} Critical`} />}
            {warningCount > 0 && <StatusBadge status="warning" label={`${warningCount} Warning`} />}
            <Badge variant="outline" className="font-mono">Kill Switches: {killedStrategies.size + 1}</Badge>
          </div>
        </div>

        {/* Tabs - 7 tabs as specified */}
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:grid-cols-none lg:flex">
            <TabsTrigger value="summary" className="gap-1.5 text-xs">
              <Shield className="size-3.5" />
              Risk Summary
            </TabsTrigger>
            <TabsTrigger value="var" className="gap-1.5 text-xs">
              <BarChart3 className="size-3.5" />
              VaR & Stress
            </TabsTrigger>
            <TabsTrigger value="exposure" className="gap-1.5 text-xs">
              <TrendingUp className="size-3.5" />
              Exposure
            </TabsTrigger>
            <TabsTrigger value="greeks" className="gap-1.5 text-xs">
              <Activity className="size-3.5" />
              Greeks
            </TabsTrigger>
            <TabsTrigger value="margin" className="gap-1.5 text-xs">
              <Wallet className="size-3.5" />
              Margin
            </TabsTrigger>
            <TabsTrigger value="term" className="gap-1.5 text-xs">
              <Clock className="size-3.5" />
              Term Structure
            </TabsTrigger>
            <TabsTrigger value="limits" className="gap-1.5 text-xs">
              <AlertTriangle className="size-3.5" />
              Limits
            </TabsTrigger>
          </TabsList>

          {/* ============================================================= */}
          {/* TAB 1: RISK SUMMARY */}
          {/* ============================================================= */}
          <TabsContent value="summary" className="space-y-6">
            {/* KPI Cards - 9 metrics in 3x3 grid */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Firm P&L</div>
                  <div className="text-2xl font-bold text-[var(--pnl-positive)]">+$1.04M</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Net Exposure</div>
                  <div className="text-2xl font-bold">$5.2M</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Margin Used</div>
                  <div className="text-2xl font-bold">47%</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-muted-foreground">VaR 95%</span>
                    {regimeMultiplier !== 1 && (
                      <Badge variant="secondary" className="text-[10px] h-4">×{regimeMultiplier.toFixed(1)}</Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-amber-400">{formatCurrency(-totalVar95)}</div>
                </CardContent>
              </Card>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-muted-foreground">ES 95%</span>
                          <Info className="size-3 text-muted-foreground" />
                          {regimeMultiplier !== 1 && (
                            <Badge variant="secondary" className="text-[10px] h-4">×{regimeMultiplier.toFixed(1)}</Badge>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-amber-400">{formatCurrency(-totalES95)}</div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p><strong>Expected Shortfall:</strong> Average loss in the worst 5% of scenarios. Also called CVaR (Conditional VaR).</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Active Alerts</div>
                  <div className="text-2xl font-bold text-amber-400">3</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-muted-foreground">VaR 99%</span>
                    {regimeMultiplier !== 1 && (
                      <Badge variant="secondary" className="text-[10px] h-4">×{regimeMultiplier.toFixed(1)}</Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-rose-400">{formatCurrency(-totalVar99)}</div>
                </CardContent>
              </Card>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Card className="cursor-help">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm text-muted-foreground">ES 99%</span>
                          <Info className="size-3 text-muted-foreground" />
                          {regimeMultiplier !== 1 && (
                            <Badge variant="secondary" className="text-[10px] h-4">×{regimeMultiplier.toFixed(1)}</Badge>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-rose-400">{formatCurrency(-totalES99)}</div>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p><strong>Expected Shortfall:</strong> Average loss in the worst 1% of scenarios. Also called CVaR (Conditional VaR).</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Kill Switches</div>
                  <div className="text-2xl font-bold text-rose-400">1</div>
                </CardContent>
              </Card>
            </div>

            {/* Strategy Risk Heatmap with Action Buttons (Part 1) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Strategy Risk Heatmap</CardTitle>
                <CardDescription>Key risk metrics by strategy, color-coded by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {strategyRiskHeatmap.map((row) => {
                    const strategyId = row.strategy.replace(/\s+/g, "_").toLowerCase()
                    const isTripped = trippedStrategies.has(strategyId)
                    const isKilled = killedStrategies.has(strategyId)
                    const scaleFactor = scaledStrategies[strategyId]
                    return (
                      <div
                        key={row.strategy}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          isKilled && "border-rose-500 bg-rose-500/20",
                          !isKilled && row.status === "ok" && "border-border bg-muted/30",
                          !isKilled && row.status === "warning" && "border-amber-500/50 bg-amber-500/10",
                          !isKilled && row.status === "critical" && "border-rose-500/50 bg-rose-500/10"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              row.status === "ok" && "bg-emerald-500",
                              row.status === "warning" && "bg-amber-500",
                              row.status === "critical" && "bg-rose-500"
                            )}
                          />
                          <span className="font-mono text-sm font-medium">{row.strategy}</span>
                          {isTripped && (
                            <Badge variant="destructive" className="text-[10px] h-5">HALTED</Badge>
                          )}
                          {isKilled && (
                            <Badge className="bg-rose-600 text-white text-[10px] h-5">KILLED</Badge>
                          )}
                          {scaleFactor !== undefined && (
                            <Badge variant="secondary" className="text-[10px] h-5">Scaled to {Math.round(scaleFactor * 100)}%</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-6 text-sm font-mono">
                            {row.delta && <span>Delta: <strong>{row.delta}</strong></span>}
                            {row.funding && <span>Funding: <strong>{row.funding}</strong></span>}
                            {row.hf && <span>HF: <strong>{row.hf}</strong></span>}
                            {row.inventory && <span>Inv: <strong>{row.inventory}</strong></span>}
                            {row.spread && <span>Spread: <strong>{row.spread}</strong></span>}
                            {row.gamma && <span>Gamma: <strong>{row.gamma}</strong></span>}
                            {row.vega && <span>Vega: <strong>{row.vega}</strong></span>}
                            {row.drawdown && <span>DD: <strong>{row.drawdown}</strong></span>}
                            {row.var && <span>VaR: <strong>{row.var}</strong></span>}
                            {row.edge && <span>Edge: <strong>{row.edge}</strong></span>}
                            {row.exposure && <span>Exp: <strong>{row.exposure}</strong></span>}
                            {row.clv && <span>CLV: <strong>{row.clv}</strong></span>}
                          </div>
                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 ml-4 shrink-0">
                            {isTripped ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-2 text-xs"
                                      disabled={isBatchMode || circuitBreakerMutation.isPending}
                                      onClick={() => handleResetCircuitBreaker(strategyId, row.strategy)}
                                    >
                                      <RotateCcw className="size-3 mr-1" />
                                      Reset
                                    </Button>
                                  </TooltipTrigger>
                                  {isBatchMode && (
                                    <TooltipContent>Switch to live mode to take action</TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-2 text-xs text-amber-400 border-amber-500/50 hover:bg-amber-500/10"
                                      disabled={isBatchMode || isKilled || circuitBreakerMutation.isPending}
                                      onClick={() => handleTripCircuitBreaker(strategyId, row.strategy)}
                                    >
                                      <Zap className="size-3 mr-1" />
                                      Trip CB
                                    </Button>
                                  </TooltipTrigger>
                                  {isBatchMode && (
                                    <TooltipContent>Switch to live mode to take action</TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    disabled={isBatchMode || isKilled}
                                    onClick={() => {
                                      const factor = 0.5
                                      apiFetch(`/api/analytics/strategies/${strategyId}/scale`, null, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ scale_factor: factor }),
                                      }).then(() => {
                                        setScaledStrategies((prev) => ({ ...prev, [strategyId]: factor }))
                                        toast.success(`Scaled ${row.strategy} to 50%`)
                                      }).catch(() => {
                                        toast.error(`Failed to scale ${row.strategy}`)
                                      })
                                    }}
                                  >
                                    <ArrowDownToLine className="size-3 mr-1" />
                                    50%
                                  </Button>
                                </TooltipTrigger>
                                {isBatchMode && (
                                  <TooltipContent>Switch to live mode to take action</TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                            <AlertDialog>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        disabled={isBatchMode || isKilled}
                                      >
                                        <Power className="size-3 mr-1" />
                                        Kill
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  {isBatchMode && (
                                    <TooltipContent>Switch to live mode to take action</TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Activate Kill Switch</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will immediately halt all trading activity for <strong>{row.strategy}</strong>.
                                    All open orders will be cancelled. This action requires manual intervention to reverse.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-rose-600 hover:bg-rose-700"
                                    onClick={() => handleKillSwitch(strategyId, row.strategy)}
                                  >
                                    Confirm Kill Switch
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Highest Utilization */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Highest Utilization First</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sortedLimits.slice(0, 6).map((limit) => (
                  <LimitBar
                    key={limit.id}
                    label={`${limit.name} (${limit.entity})`}
                    value={limit.value}
                    limit={limit.limit}
                    unit={limit.unit}
                    showStatus={false}
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================= */}
          {/* TAB 2: VAR & STRESS TESTING */}
          {/* ============================================================= */}
          <TabsContent value="var" className="space-y-6">
            {/* Section A: VaR Dashboard */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Component VaR — Marginal Contribution (95%)</CardTitle>
                    <CardDescription>Top 8 positions ranked by marginal VaR contribution</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {["historical", "parametric", "monte_carlo", "filtered_historical"].map((method) => (
                      <Button
                        key={method}
                        variant={varMethod === method ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setVarMethod(method as typeof varMethod)}
                        className="text-xs capitalize"
                      >
                        {method.replace("_", " ")}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={adjustedVarData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => formatCurrency(v)}
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                      />
                      <YAxis
                        type="category"
                        dataKey="instrument"
                        stroke="var(--muted-foreground)"
                        fontSize={11}
                        width={95}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number, _name: string, props: { payload?: typeof adjustedVarData[0] }) => [
                          `${formatCurrency(value)} (${props.payload?.pct ?? 0}%)`,
                          `VaR 95% - ${props.payload?.venue ?? ""}`,
                        ]}
                      />
                      <Bar dataKey="var95" radius={[0, 4, 4, 0]}>
                        {adjustedVarData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getAssetClassColor(entry.assetClass)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded" style={{ backgroundColor: "var(--surface-config)" }} />
                    <span>DeFi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded" style={{ backgroundColor: "var(--surface-trading)" }} />
                    <span>CeFi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded" style={{ backgroundColor: "var(--surface-markets)" }} />
                    <span>TradFi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded" style={{ backgroundColor: "var(--surface-strategy)" }} />
                    <span>Sports</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section B: Stress Testing */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Stress Testing Scenarios</CardTitle>
                <CardDescription>Historical stress scenarios applied to current portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Scenario</TableHead>
                      <TableHead className="text-right">Multiplier</TableHead>
                      <TableHead className="text-right">P&L Impact</TableHead>
                      <TableHead className="text-right">VaR Impact</TableHead>
                      <TableHead className="text-right">Positions Breaching</TableHead>
                      <TableHead>Largest Single Loss</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stressScenarios.map((scenario) => (
                      <TableRow key={scenario.name}>
                        <TableCell className="font-medium">{scenario.name}</TableCell>
                        <TableCell className="text-right font-mono">{scenario.multiplier}x</TableCell>
                        <TableCell className="text-right">
                          <span className="text-lg font-bold text-rose-400">
                            {formatCurrency(scenario.pnlImpact)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(scenario.varImpact)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={scenario.positionsBreaching > 10 ? "destructive" : scenario.positionsBreaching > 5 ? "secondary" : "outline"}>
                            {scenario.positionsBreaching}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{scenario.largestLoss}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Section C: Regime Multiplier */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Regime Stress Factor</span>
                      <span className="font-mono font-bold">{regimeMultiplier.toFixed(1)}x</span>
                    </div>
                    <Slider
                      value={[regimeMultiplier]}
                      onValueChange={([v]) => setRegimeMultiplier(v)}
                      min={0.5}
                      max={3.0}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>0.5x</span>
                      <span>3.0x</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-[300px]">
                    All VaR figures are multiplied by this factor. Increase during stress periods.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================= */}
          {/* TAB 3: EXPOSURE ATTRIBUTION */}
          {/* ============================================================= */}
          <TabsContent value="exposure" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Exposure Attribution ({filteredExposureRows.length} of 23 Risk Types)
                    </CardTitle>
                    <CardDescription>Grouped by First Order, Second Order, Structural, Operational, Domain-Specific</CardDescription>
                  </div>
                  {/* Item 1: Strategy Risk Filter */}
                  <div className="flex flex-col items-end gap-1">
                    <Select value={riskFilterStrategy} onValueChange={setRiskFilterStrategy}>
                      <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="All strategies (23 risk types)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All strategies (23 risk types)</SelectItem>
                        {MOCK_STRATEGIES.map(s => (
                          <SelectItem key={s.id} value={s.archetype}>
                            {s.name} ({s.strategyIdPattern})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {riskFilterStrategy !== "all" && selectedStrategy && (
                      <p className="text-xs text-muted-foreground">
                        Showing {filteredExposureRows.length} of 23 risk types relevant to {selectedStrategy.name}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(groupedExposure).map(([category, rows]) => (
                  <Collapsible
                    key={category}
                    open={expandedCategories.includes(category)}
                    onOpenChange={() => toggleCategory(category)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between p-3 h-auto hover:bg-muted/50">
                        <span className="font-medium capitalize">{category.replace("_", " ")} ({rows.length})</span>
                        {expandedCategories.includes(category) ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead>Component</TableHead>
                            <TableHead className="text-right">P&L</TableHead>
                            <TableHead className="text-right">Exposure</TableHead>
                            <TableHead className="text-right">Limit</TableHead>
                            <TableHead className="text-right">Utilization</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((row) => {
                            const status = getStatusFromUtil(row.utilization)
                            return (
                              <TableRow key={row.component}>
                                <TableCell className="font-medium">{row.component}</TableCell>
                                <TableCell className="text-right"><PnLValue value={row.pnl} size="sm" /></TableCell>
                                <TableCell className="text-right font-mono tabular-nums">
                                  {typeof row.exposure === "number"
                                    ? row.exposure >= 1000000 ? `$${(row.exposure / 1000000).toFixed(1)}m`
                                    : row.exposure >= 1000 ? `$${(row.exposure / 1000).toFixed(0)}k`
                                    : row.exposure.toFixed(2)
                                    : row.exposure}
                                </TableCell>
                                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                                  {typeof row.limit === "number"
                                    ? row.limit >= 1000000 ? `$${(row.limit / 1000000).toFixed(0)}m`
                                    : row.limit >= 1000 ? `$${(row.limit / 1000).toFixed(0)}k`
                                    : row.limit.toFixed(2)
                                    : row.limit}
                                </TableCell>
                                <TableCell className="text-right font-mono tabular-nums">{row.utilization.toFixed(0)}%</TableCell>
                                <TableCell><StatusBadge status={status} showDot={true} /></TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>

            {/* Exposure Time Series */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Exposure Time Series (Top 3)</CardTitle>
                  <div className="flex items-center gap-1">
                    {(["1W", "1M", "3M"] as const).map((period) => (
                      <Button
                        key={period}
                        variant={exposurePeriod === period ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setExposurePeriod(period)}
                        className="text-xs"
                      >
                        {period}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={exposureTimeSeries.slice(exposurePeriod === "1W" ? -7 : exposurePeriod === "1M" ? -30 : -90)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="delta" stroke="#3b82f6" name="Delta" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="funding" stroke="#22c55e" name="Funding" strokeWidth={2} dot={false} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================= */}
          {/* TAB 4: GREEKS DECOMPOSITION */}
          {/* ============================================================= */}
          <TabsContent value="greeks" className="space-y-6">
            {/* Portfolio Greeks Summary */}
            <div className="grid grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Portfolio Delta</div>
                  <div className="text-2xl font-bold font-mono">{portfolioGreeks.delta.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Gamma</div>
                  <div className="text-2xl font-bold font-mono">{portfolioGreeks.gamma.toFixed(3)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Vega</div>
                  <div className="text-2xl font-bold font-mono">${portfolioGreeks.vega.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Theta</div>
                  <div className="text-2xl font-bold font-mono text-rose-400">${portfolioGreeks.theta.toLocaleString()}/day</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">Rho</div>
                  <div className="text-2xl font-bold font-mono">${portfolioGreeks.rho.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            {/* Per-Position Greeks Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Per-Position Greeks</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Instrument</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Delta</TableHead>
                      <TableHead className="text-right">Gamma</TableHead>
                      <TableHead className="text-right">Vega</TableHead>
                      <TableHead className="text-right">Theta</TableHead>
                      <TableHead className="text-right">Rho</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positionGreeks.map((pos) => (
                      <TableRow key={pos.instrument}>
                        <TableCell className="font-medium">{pos.instrument}</TableCell>
                        <TableCell className="text-muted-foreground">{pos.venue}</TableCell>
                        <TableCell className="text-right font-mono">{pos.qty}</TableCell>
                        <TableCell className="text-right font-mono">{pos.delta.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">{pos.gamma.toFixed(3)}</TableCell>
                        <TableCell className="text-right font-mono">${pos.vega.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-rose-400">${pos.theta.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">${pos.rho}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-bold">
                      <TableCell>Portfolio Total</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right font-mono">{portfolioGreeks.delta.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono">{portfolioGreeks.gamma.toFixed(3)}</TableCell>
                      <TableCell className="text-right font-mono">${portfolioGreeks.vega.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-rose-400">${portfolioGreeks.theta.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono">${portfolioGreeks.rho}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Greeks Time Series */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Greeks Time Series (30 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={greeksTimeSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                      <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={11} />
                      <YAxis yAxisId="right" orientation="right" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="delta" stroke="#3b82f6" name="Delta" strokeWidth={2} dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="gamma" stroke="#f59e0b" name="Gamma" strokeWidth={2} dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="vega" stroke="#22c55e" name="Vega ($)" strokeWidth={2} dot={false} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Second-Order Risks */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Second-Order Risks (Options MM)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <div className="text-sm text-muted-foreground">Volga (d²V/dσ²)</div>
                    <div className="text-xl font-bold font-mono">${secondOrderRisks.volga.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">per 1% vol move</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <div className="text-sm text-muted-foreground">Vanna (d²V/dS·dσ)</div>
                    <div className="text-xl font-bold font-mono text-rose-400">${secondOrderRisks.vanna.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">per 1% spot × 1% vol</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <div className="text-sm text-muted-foreground">Slide (vol decay)</div>
                    <div className="text-xl font-bold font-mono text-rose-400">${secondOrderRisks.slide.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">per day</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================= */}
          {/* TAB 5: MARGIN */}
          {/* ============================================================= */}
          <TabsContent value="margin" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* CeFi Margin */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">CeFi Margin by Venue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sortedLimits.filter((l) => l.category === "margin").map((limit) => (
                    <LimitBar key={limit.id} label={limit.entity} value={limit.value} limit={limit.limit} unit={limit.unit} />
                  ))}
                </CardContent>
              </Card>

              {/* TradFi SPAN Margin */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">SPAN Margin Summary — IBKR</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Initial Margin</span>
                    <span className="font-mono font-medium">$180,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Maintenance Margin</span>
                    <span className="font-mono font-medium">$135,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cross-Margin Offset</span>
                    <span className="font-mono font-medium text-emerald-400">-$22,000</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Net Margin Required</span>
                    <span className="font-mono font-bold">$158,000</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Margin Utilization</span>
                      <span className="text-sm font-mono">79%</span>
                    </div>
                    <Progress value={79} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* DeFi Health Factor */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">DeFi Health Factor (Aave v3)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sortedLimits.filter((l) => l.category === "ltv").map((limit) => (
                  <LimitBar key={limit.id} label={`${limit.name} (${limit.entity})`} value={limit.value} limit={limit.limit} unit={limit.unit} />
                ))}
              </CardContent>
            </Card>

            {/* Health Factor Time Series */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Health Factor Time Series (7 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hfTimeSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `Day ${v}`} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[1, 2]} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [value.toFixed(2), "Health Factor"]}
                      />
                      <ReferenceLine y={1.0} stroke="var(--destructive)" strokeDasharray="5 5" label={{ value: "Liquidation", fill: "var(--destructive)", fontSize: 10 }} />
                      <ReferenceLine y={1.5} stroke="var(--warning)" strokeDasharray="5 5" label={{ value: "Deleverage", fill: "var(--warning)", fontSize: 10 }} />
                      <Area type="monotone" dataKey="hf" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Distance to Liquidation */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Distance to Liquidation</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Venue</TableHead>
                      <TableHead>HF / Margin</TableHead>
                      <TableHead className="text-right">Dist. to Liq.</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distanceToLiquidation.map((row) => (
                      <TableRow key={row.venue}>
                        <TableCell className="font-medium">{row.venue}</TableCell>
                        <TableCell className="font-mono">{row.metric}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={row.distToLiq > 20 ? "default" : row.distToLiq > 10 ? "secondary" : "destructive"}
                            className={cn(
                              "font-mono",
                              row.distToLiq > 20 && "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30",
                              row.distToLiq <= 20 && row.distToLiq > 10 && "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                            )}
                          >
                            {row.distToLiq.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "size-2 rounded-full inline-block",
                              row.distToLiq > 20 && "bg-emerald-500",
                              row.distToLiq <= 20 && row.distToLiq > 10 && "bg-amber-500",
                              row.distToLiq <= 10 && "bg-rose-500"
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================= */}
          {/* TAB 6: TERM STRUCTURE */}
          {/* ============================================================= */}
          <TabsContent value="term" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Exposure by Maturity Bucket</CardTitle>
                <CardDescription>DeFi/CeFi perpetuals classified as Overnight (8h funding settlement)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={termStructureData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="bucket" stroke="var(--muted-foreground)" fontSize={11} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [formatCurrency(value)]}
                      />
                      <Legend />
                      <Bar dataKey="defi" stackId="a" fill="var(--surface-config)" name="DeFi" />
                      <Bar dataKey="cefi" stackId="a" fill="var(--surface-trading)" name="CeFi" />
                      <Bar dataKey="tradfi" stackId="a" fill="var(--surface-markets)" name="TradFi" />
                      <Bar dataKey="sports" stackId="a" fill="var(--surface-strategy)" name="Sports" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-muted/30 text-sm text-muted-foreground">
                  <strong>Note:</strong> DeFi/CeFi perpetuals classified as Overnight (8h funding settlement).
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================= */}
          {/* TAB 7: LIMITS */}
          {/* ============================================================= */}
          <TabsContent value="limits" className="space-y-6">
            {/* Item 2: Breadcrumb for selected hierarchy node */}
            {selectedNode && selectedHierarchyNode && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-sm font-medium">Scope:</span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  {mockLimitsHierarchy
                    .filter(l => l.level < selectedHierarchyNode.level)
                    .slice(0, selectedHierarchyNode.level)
                    .map((parent, i) => (
                      <React.Fragment key={parent.id}>
                        <span>{parent.entity}</span>
                        <ChevronRight className="size-3" />
                      </React.Fragment>
                    ))}
                  <span className="font-medium text-foreground">{selectedNode}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 px-2 text-xs"
                  onClick={() => setSelectedNode(null)}
                >
                  <X className="size-3 mr-1" />
                  Clear filter
                </Button>
              </div>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Full Limit Hierarchy (6 Levels)</CardTitle>
                <CardDescription>Click a row to filter the entire risk page to that scope</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Entity</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead className="text-right">Exposure</TableHead>
                      <TableHead className="text-right">VaR 95%</TableHead>
                      <TableHead className="text-right">Utilization</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockLimitsHierarchy.slice(0, 6).map((limit) => {
                      const util = getUtilization(limit.value, limit.limit)
                      const status = getStatusFromUtil(util)
                      const indent = limit.level * 16
                      const isLeaf = limit.level === 5
                      const isSelected = selectedNode === limit.entity
                      
                      return (
                        <TableRow 
                          key={limit.id} 
                          className={cn(
                            "cursor-pointer hover:bg-muted/50",
                            isSelected && "bg-primary/5 border-l-2 border-primary"
                          )}
                          onClick={() => setSelectedNode(isSelected ? null : limit.entity)}
                        >
                          <TableCell>
                            <div className="flex items-center" style={{ paddingLeft: `${indent}px` }}>
                              {limit.level > 0 && (
                                <span className="text-muted-foreground mr-2">└</span>
                              )}
                              <span className={cn("font-medium", isLeaf && "text-muted-foreground")}>{limit.entity}</span>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize text-muted-foreground text-sm">{limit.entityType}</TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatCurrency(limit.value)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                            {limit.var95 ? formatCurrency(limit.var95) : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">{util.toFixed(0)}%</TableCell>
                          <TableCell><StatusBadge status={status} showDot={true} /></TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* All Limits Detail */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">All Limits Detail</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Level</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Limit Type</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Limit</TableHead>
                      <TableHead className="text-right">Utilization</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedLimits.map((limit) => {
                      const util = getUtilization(limit.value, limit.limit)
                      const status = getStatusFromUtil(util)
                      return (
                        <TableRow key={limit.id}>
                          <TableCell className="capitalize text-muted-foreground">{limit.entityType}</TableCell>
                          <TableCell className="font-medium">{limit.entity}</TableCell>
                          <TableCell>{limit.name}</TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {limit.unit === "$" ? `$${(limit.value / 1000000).toFixed(2)}m`
                              : limit.unit === "%" ? `${limit.value}%`
                              : limit.unit === "x" ? `${limit.value}x`
                              : limit.value.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                            {limit.unit === "$" ? `$${(limit.limit / 1000000).toFixed(0)}m`
                              : limit.unit === "%" ? `${limit.limit}%`
                              : limit.unit === "x" ? `${limit.limit}x`
                              : limit.limit.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums">{util.toFixed(0)}%</TableCell>
                          <TableCell><StatusBadge status={status} showDot={true} /></TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ================================================================= */}
        {/* PART 2: VaR Summary Cards                                         */}
        {/* ================================================================= */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="size-5 text-amber-400" />
            VaR Summary (99% Confidence)
          </h2>
          {varSummaryLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : varSummaryData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Historical VaR (99%)</div>
                  <div className="text-2xl font-bold font-mono text-amber-400">
                    {formatCurrency(-varSummaryData.historical_var_99)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Parametric VaR (99%)</div>
                  <div className="text-2xl font-bold font-mono text-amber-400">
                    {formatCurrency(-varSummaryData.parametric_var_99)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">CVaR (99%)</div>
                  <div className="text-2xl font-bold font-mono text-rose-400">
                    {formatCurrency(-varSummaryData.cvar_99)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Monte Carlo VaR (99%)</div>
                  <div className="text-2xl font-bold font-mono text-amber-400">
                    {formatCurrency(-varSummaryData.monte_carlo_var_99)}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No VaR data available
              </CardContent>
            </Card>
          )}
        </div>

        {/* ================================================================= */}
        {/* PART 3: Stress Scenario Panel                                      */}
        {/* ================================================================= */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-400" />
                  Stress Scenario Analysis
                </CardTitle>
                <CardDescription>Select a historical stress scenario to analyze portfolio impact</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {regimeData && (
                  <Badge
                    className={cn(
                      "text-xs",
                      regimeData.regime === "normal" && "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30",
                      regimeData.regime === "stressed" && "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30",
                      regimeData.regime === "crisis" && "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30",
                    )}
                  >
                    Regime: {regimeData.regime.charAt(0).toUpperCase() + regimeData.regime.slice(1)}
                  </Badge>
                )}
                <Select value={selectedStressScenario ?? ""} onValueChange={(v) => setSelectedStressScenario(v || null)}>
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Select scenario..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GFC_2008">GFC 2008</SelectItem>
                    <SelectItem value="COVID_2020">COVID 2020</SelectItem>
                    <SelectItem value="CRYPTO_BLACK_THURSDAY">Crypto Black Thursday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedStressScenario ? (
              stressTestLoading ? (
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/30 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-32" />
                    </div>
                  ))}
                </div>
              ) : stressTestResult ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <div className="text-sm text-muted-foreground">Expected Loss</div>
                    <div className="text-2xl font-bold font-mono text-rose-400">
                      {formatCurrency(-stressTestResult.expected_loss_usd)}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <div className="text-sm text-muted-foreground">Portfolio Impact</div>
                    <div className="text-2xl font-bold font-mono text-rose-400">
                      {stressTestResult.portfolio_impact_pct.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 text-center">
                    <div className="text-sm text-muted-foreground">Worst Strategy</div>
                    <div className="text-xl font-bold font-mono">
                      {stressTestResult.worst_strategy}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No stress test data available for {selectedStressScenario.replace(/_/g, " ")}
                </p>
              )
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Select a scenario above to see stress test results
              </p>
            )}
          </CardContent>
        </Card>

        {/* ================================================================= */}
        {/* PART 4: Portfolio Greeks Summary                                    */}
        {/* ================================================================= */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="size-5 text-blue-400" />
            Portfolio Greeks (Derivatives)
          </h2>
          {portfolioGreeksLoading ? (
            <div className="grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 text-center space-y-2">
                    <Skeleton className="h-4 w-20 mx-auto" />
                    <Skeleton className="h-8 w-24 mx-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : portfolioGreeksData ? (
            <>
              <div className="grid grid-cols-5 gap-4 mb-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-muted-foreground">Net Delta</div>
                    <div className="text-2xl font-bold font-mono">
                      {portfolioGreeksData.portfolio.delta.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-muted-foreground">Net Gamma</div>
                    <div className="text-2xl font-bold font-mono">
                      {portfolioGreeksData.portfolio.gamma.toFixed(4)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-muted-foreground">Net Vega</div>
                    <div className="text-2xl font-bold font-mono">
                      ${portfolioGreeksData.portfolio.vega.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-muted-foreground">Net Theta</div>
                    <div className="text-2xl font-bold font-mono text-rose-400">
                      ${portfolioGreeksData.portfolio.theta.toLocaleString()}/day
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-sm text-muted-foreground">Net Rho</div>
                    <div className="text-2xl font-bold font-mono">
                      ${portfolioGreeksData.portfolio.rho.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Per-Underlying Breakdown Table */}
              {portfolioGreeksData.per_underlying.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Per-Underlying Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Underlying</TableHead>
                          <TableHead className="text-right">Delta</TableHead>
                          <TableHead className="text-right">Gamma</TableHead>
                          <TableHead className="text-right">Vega</TableHead>
                          <TableHead className="text-right">Theta</TableHead>
                          <TableHead className="text-right">Rho</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {portfolioGreeksData.per_underlying.map((row) => (
                          <TableRow key={row.underlying}>
                            <TableCell className="font-medium">{row.underlying}</TableCell>
                            <TableCell className="text-right font-mono">{row.delta.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono">{row.gamma.toFixed(4)}</TableCell>
                            <TableCell className="text-right font-mono">${row.vega.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono text-rose-400">${row.theta.toLocaleString()}</TableCell>
                            <TableCell className="text-right font-mono">${row.rho.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No portfolio Greeks data available
              </CardContent>
            </Card>
          )}
        </div>

        {/* ================================================================= */}
        {/* PART 5: Stress Scenario Slider (What-If)                           */}
        {/* ================================================================= */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="size-4 text-blue-400" />
              What-If: BTC Price Shock
            </CardTitle>
            <CardDescription>
              Slide to estimate portfolio PnL impact using Greeks (Delta + Gamma approximation)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">BTC Price Change</span>
                  <span className={cn(
                    "font-mono font-bold text-lg",
                    btcPriceChangePct > 0 && "text-emerald-400",
                    btcPriceChangePct < 0 && "text-rose-400",
                    btcPriceChangePct === 0 && "text-muted-foreground",
                  )}>
                    {btcPriceChangePct > 0 ? "+" : ""}{btcPriceChangePct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  step={1}
                  value={btcPriceChangePct}
                  onChange={(e) => setBtcPriceChangePct(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-muted accent-blue-500"
                />
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>-30%</span>
                  <span>0%</span>
                  <span>+30%</span>
                </div>
              </div>
              <div className="w-px h-16 bg-border" />
              <div className="text-center min-w-[180px]">
                <div className="text-sm text-muted-foreground mb-1">Estimated Portfolio PnL</div>
                <div className={cn(
                  "text-3xl font-bold font-mono",
                  estimatedPnl > 0 && "text-emerald-400",
                  estimatedPnl < 0 && "text-rose-400",
                  estimatedPnl === 0 && "text-muted-foreground",
                )}>
                  {estimatedPnl >= 0 ? "+" : ""}{formatCurrency(estimatedPnl)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  dS = {formatCurrency(dS)} | Delta={greeksForSlider.delta.toFixed(2)} | Gamma={greeksForSlider.gamma.toFixed(4)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ================================================================= */}
        {/* PART 6: Per-Venue Circuit Breaker Status                           */}
        {/* ================================================================= */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="size-5 text-amber-400" />
            Venue Circuit Breaker Status
          </h2>
          {venueCircuitBreakers && venueCircuitBreakers.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {venueCircuitBreakers.map((vcb) => (
                <Card key={`${vcb.venue}-${vcb.strategy_id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{vcb.venue}</span>
                      <Badge
                        className={cn(
                          "text-[10px]",
                          vcb.status === "CLOSED" && "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30",
                          vcb.status === "HALF_OPEN" && "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30",
                          vcb.status === "OPEN" && "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30",
                        )}
                      >
                        {vcb.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{vcb.strategy_id}</div>
                    {vcb.kill_switch_active && (
                      <Badge variant="destructive" className="mt-2 text-[10px]">Kill Switch Active</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No venue circuit breaker data available
              </CardContent>
            </Card>
          )}
        </div>

        {/* ================================================================= */}
        {/* PART 7: Correlation Heatmap (dynamically imported for bundle size) */}
        {/* ================================================================= */}
        <DynamicCorrelationHeatmap />
      </div>
    </div>
  )
}
