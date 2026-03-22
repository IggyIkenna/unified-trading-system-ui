"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { EntityLink } from "@/components/trading/entity-link"
import { KPICard } from "@/components/trading/kpi-card"
import {
  Activity,
  Box,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Beaker,
  ArrowRight,
  Clock,
  Cpu,
  Zap,
  GitBranch,
  Shield,
  BarChart3,
  Play,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { MLNav } from "@/components/ml/ml-nav"
import { useModelFamilies, useExperiments, useMLDeployments, useModelVersions, useFeatureProvenance } from "@/hooks/api/use-ml-models"

// Context badge component
function ContextBadge({ context }: { context: "BATCH" | "LIVE" }) {
  return (
    <Badge
      variant="outline"
      className={
        context === "LIVE"
          ? "bg-[var(--status-live)]/10 text-[var(--status-live)] border-[var(--status-live)]/30"
          : "bg-[var(--surface-ml)]/10 text-[var(--surface-ml)] border-[var(--surface-ml)]/30"
      }
    >
      {context}
    </Badge>
  )
}

// Health indicator
function HealthIndicator({ health }: { health: "healthy" | "warning" | "critical" }) {
  const colors = {
    healthy: "bg-[var(--status-live)]",
    warning: "bg-[var(--status-warning)]",
    critical: "bg-[var(--status-critical)]",
  }
  return <div className={`size-2 rounded-full ${colors[health]}`} />
}

// Lifecycle rail
const LIFECYCLE_STAGES = ["Design", "Train", "Validate", "Register", "Shadow", "Promote", "Live", "Monitor", "Review"]

function LifecycleRail({ currentStage }: { currentStage: string }) {
  const currentIndex = LIFECYCLE_STAGES.findIndex(s => s.toLowerCase() === currentStage.toLowerCase())
  
  return (
    <div className="flex items-center gap-1 text-xs">
      {LIFECYCLE_STAGES.map((stage, i) => (
        <React.Fragment key={stage}>
          <span
            className={`px-2 py-0.5 rounded ${
              i === currentIndex
                ? "bg-[var(--surface-ml)] text-white font-medium"
                : i < currentIndex
                ? "text-muted-foreground"
                : "text-muted-foreground/50"
            }`}
          >
            {stage}
          </span>
          {i < LIFECYCLE_STAGES.length - 1 && (
            <ChevronRight className="size-3 text-muted-foreground/30" />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default function MLOverviewPage() {
  const { data: familiesData, isLoading: famLoading } = useModelFamilies()
  const { data: experimentsData, isLoading: expLoading } = useExperiments()
  const { data: deploymentsData, isLoading: depLoading } = useMLDeployments()
  const { data: versionsData, isLoading: verLoading } = useModelVersions()
  const { data: featuresData, isLoading: featLoading } = useFeatureProvenance()

  const MODEL_FAMILIES: Array<any> = (familiesData as any)?.data ?? []
  const EXPERIMENTS: Array<any> = (experimentsData as any)?.data ?? []
  const LIVE_DEPLOYMENTS: Array<any> = (deploymentsData as any)?.data ?? []
  const MODEL_VERSIONS: Array<any> = (versionsData as any)?.data ?? []
  const FEATURE_PROVENANCE: Array<any> = (featuresData as any)?.data ?? []

  // Derived arrays from API data
  const CHAMPION_CHALLENGER_PAIRS: Array<any> = (deploymentsData as any)?.championChallengerPairs ?? []
  const ML_ALERTS: Array<any> = (deploymentsData as any)?.alerts ?? []
  const REGIME_STATES: Array<any> = (deploymentsData as any)?.regimeStates ?? []
  const DEPLOYMENT_CANDIDATES: Array<any> = (deploymentsData as any)?.candidates ?? []

  const isLoading = famLoading || expLoading || depLoading || verLoading || featLoading

  // Calculate summary stats
  const liveModels = LIVE_DEPLOYMENTS.filter((d: any) => d.status === "active").length
  const runningExperiments = EXPERIMENTS.filter((e: any) => e.status === "running").length
  const pendingPromotions = DEPLOYMENT_CANDIDATES.filter((d: any) => d.status !== "approved" && d.status !== "rejected").length
  const activeAlerts = ML_ALERTS.filter((a: any) => !a.resolvedAt).length
  const degradedFeatures = FEATURE_PROVENANCE.filter((f: any) => f.status !== "healthy").length

  const totalPredictionsToday = LIVE_DEPLOYMENTS.reduce((sum: number, d: any) => sum + (d.metrics?.predictionsToday ?? 0), 0)
  const avgLatency = LIVE_DEPLOYMENTS.length > 0 ? LIVE_DEPLOYMENTS.reduce((sum: number, d: any) => sum + (d.metrics?.latencyP50 ?? 0), 0) / LIVE_DEPLOYMENTS.length : 0

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

  return (
    <div className="p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* ML Navigation */}
        <MLNav className="border-b pb-3" />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">ML Platform Overview</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Model training, deployment, and monitoring for systematic trading
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Link href="/services/research/ml/experiments/new">
              <Button size="sm" className="gap-2" style={{ backgroundColor: "var(--surface-ml)" }}>
                <Beaker className="size-4" />
                New Experiment
              </Button>
            </Link>
          </div>
        </div>

        {/* Lifecycle Rail */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Platform Lifecycle</span>
            <LifecycleRail currentStage="Live" />
          </div>
        </Card>

        {/* KPI Row */}
        <div className="grid grid-cols-6 gap-4">
          <KPICard
            title="Live Models"
            value={liveModels}
            status="healthy"
            subtitle="Active in production"
            onClick={() => {}}
          />
          <KPICard
            title="Running Experiments"
            value={runningExperiments}
            status={runningExperiments > 0 ? "healthy" : "neutral"}
            subtitle="GPU clusters active"
            sparklineData={[2, 3, 2, 4, 3, 2, runningExperiments]}
            onClick={() => {}}
          />
          <KPICard
            title="Predictions Today"
            value={totalPredictionsToday.toLocaleString()}
            change={12.5}
            changeLabel="vs yesterday"
            status="healthy"
            onClick={() => {}}
          />
          <KPICard
            title="Avg Latency"
            value={`${avgLatency.toFixed(1)}ms`}
            status="healthy"
            subtitle="P50 inference"
            onClick={() => {}}
          />
          <KPICard
            title="Pending Promotions"
            value={pendingPromotions}
            status={pendingPromotions > 0 ? "warning" : "neutral"}
            subtitle="Awaiting review"
            onClick={() => {}}
          />
          <KPICard
            title="Active Alerts"
            value={activeAlerts}
            status={activeAlerts > 0 ? "warning" : "healthy"}
            subtitle={activeAlerts > 0 ? "Needs attention" : "All clear"}
            onClick={() => {}}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Live Champion/Challenger Summary */}
          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="size-4" />
                  Live Model Health
                </CardTitle>
                <Link href="/services/research/ml/monitoring">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View All <ArrowRight className="size-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {LIVE_DEPLOYMENTS.map((deployment) => {
                const model = MODEL_VERSIONS.find(m => m.id === deployment.modelVersionId)
                const family = MODEL_FAMILIES.find(f => f.id === model?.modelFamilyId)
                const hasChallenger = CHAMPION_CHALLENGER_PAIRS.some(cc => cc.championId === deployment.modelVersionId)
                
                return (
                  <div
                    key={deployment.id}
                    className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <HealthIndicator health={deployment.health.overall} />
                        <div>
                          <div className="flex items-center gap-2">
                            <EntityLink
                              type="model"
                              id={deployment.modelVersionId}
                              label={family?.name || "Unknown"}
                              className="font-medium"
                            />
                            <Badge variant="outline" className="font-mono text-[10px]">
                              v{model?.version}
                            </Badge>
                            <ContextBadge context="LIVE" />
                            {model?.isChampion && (
                              <Badge className="bg-[var(--status-live)]/10 text-[var(--status-live)] text-[10px]">
                                Champion
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {deployment.strategyIds.length} strategies • Deployed {new Date(deployment.deployedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm font-mono">{deployment.metrics.predictionsToday.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">predictions today</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono">{(deployment.metrics.accuracyToday * 100).toFixed(1)}%</p>
                          <p className="text-[10px] text-muted-foreground">accuracy</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono">{deployment.metrics.latencyP50}ms</p>
                          <p className="text-[10px] text-muted-foreground">p50 latency</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Health indicators */}
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${deployment.health.predictionDrift === "normal" ? "bg-[var(--status-live)]" : "bg-[var(--status-warning)]"}`} />
                        Pred Drift
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${deployment.health.featureDrift === "normal" ? "bg-[var(--status-live)]" : "bg-[var(--status-warning)]"}`} />
                        Feature Drift
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${deployment.health.calibrationDrift === "normal" ? "bg-[var(--status-live)]" : "bg-[var(--status-warning)]"}`} />
                        Calibration
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className={`size-1.5 rounded-full ${deployment.health.latencyHealth === "normal" ? "bg-[var(--status-live)]" : "bg-[var(--status-warning)]"}`} />
                        Latency
                      </span>
                      {hasChallenger && (
                        <span className="ml-auto text-[var(--surface-ml)]">
                          Challenger active (10% traffic)
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Alerts & Degradation */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="size-4" />
                  Alerts & Degradation
                </CardTitle>
                <Badge variant={activeAlerts > 0 ? "destructive" : "secondary"}>
                  {activeAlerts} active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {ML_ALERTS.filter(a => !a.resolvedAt).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.severity === "critical"
                      ? "border-[var(--status-critical)]/30 bg-[var(--status-critical)]/5"
                      : alert.severity === "warning"
                      ? "border-[var(--status-warning)]/30 bg-[var(--status-warning)]/5"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className={`size-4 mt-0.5 ${
                        alert.severity === "critical"
                          ? "text-[var(--status-critical)]"
                          : alert.severity === "warning"
                          ? "text-[var(--status-warning)]"
                          : "text-muted-foreground"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.metric}: {alert.currentValue} (threshold: {alert.threshold})
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(alert.triggeredAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {activeAlerts === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <CheckCircle2 className="size-8 mx-auto mb-2 text-[var(--status-live)]" />
                  All systems healthy
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-3 gap-6">
          {/* Training Jobs */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cpu className="size-4" />
                  Training Jobs
                </CardTitle>
                <Link href="/services/research/ml/training">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View All <ArrowRight className="size-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {EXPERIMENTS.filter(e => e.status === "running").map((exp) => (
                <div key={exp.id} className="p-3 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="size-3.5 animate-spin text-[var(--status-running)]" />
                      <EntityLink
                        type="experiment"
                        id={exp.id}
                        label={exp.name}
                        className="text-sm font-medium"
                      />
                    </div>
                    <ContextBadge context="BATCH" />
                  </div>
                  <Progress value={exp.progress} className="h-1.5 mb-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{exp.progress}% complete</span>
                    <span>Started {exp.startedAt ? new Date(exp.startedAt).toLocaleTimeString() : "N/A"}</span>
                  </div>
                </div>
              ))}
              {EXPERIMENTS.filter(e => e.status === "running").length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No active training jobs
                </div>
              )}
            </CardContent>
          </Card>

          {/* Promising Experiments */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Beaker className="size-4" />
                  Top Candidates
                </CardTitle>
                <Link href="/services/research/ml/experiments">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View All <ArrowRight className="size-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {EXPERIMENTS.filter(e => e.status === "completed" && e.metrics && e.metrics.sharpe > 2.0)
                .slice(0, 3)
                .map((exp) => (
                  <div key={exp.id} className="p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <EntityLink
                        type="experiment"
                        id={exp.id}
                        label={exp.name}
                        className="text-sm font-medium"
                      />
                      <Badge variant="outline" className="text-[10px]">
                        <CheckCircle2 className="size-3 mr-1" />
                        Complete
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span>
                        Sharpe: <span className="font-mono font-semibold text-[var(--status-live)]">{exp.metrics?.sharpe.toFixed(2)}</span>
                      </span>
                      <span>
                        Accuracy: <span className="font-mono">{((exp.metrics?.accuracy || 0) * 100).toFixed(1)}%</span>
                      </span>
                      <span>
                        DD: <span className="font-mono">{((exp.metrics?.maxDrawdown || 0) * 100).toFixed(1)}%</span>
                      </span>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Feature Freshness */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="size-4" />
                  Feature Freshness
                </CardTitle>
                <Link href="/services/research/ml/features">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View All <ArrowRight className="size-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {FEATURE_PROVENANCE.slice(0, 5).map((feature) => (
                <div
                  key={feature.featureName}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${
                        feature.status === "healthy"
                          ? "bg-[var(--status-live)]"
                          : feature.status === "degraded"
                          ? "bg-[var(--status-warning)]"
                          : "bg-[var(--status-critical)]"
                      }`}
                    />
                    <code className="text-xs">{feature.featureName}</code>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono">{feature.freshness}</span>
                    <span className="text-muted-foreground">/ {feature.sla}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Third Row - Regime & Promotion */}
        <div className="grid grid-cols-2 gap-6">
          {/* Current Regime */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="size-4" />
                Current Regime State
              </CardTitle>
            </CardHeader>
            <CardContent>
              {REGIME_STATES.map((regime) => (
                <div key={regime.id}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{regime.name}</h3>
                      <p className="text-sm text-muted-foreground">{regime.description}</p>
                    </div>
                    <Badge variant="outline">
                      Since {new Date(regime.startedAt).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {regime.indicators.map((indicator: { name: string; value: number }) => (
                      <div key={indicator.name} className="text-center">
                        <div className="text-2xl font-mono font-semibold">{indicator.value.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">{indicator.name.replace("_", " ")}</div>
                        <Progress
                          value={indicator.value * 100}
                          className="h-1 mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pending Promotions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Play className="size-4" />
                  Pending Promotions
                </CardTitle>
                <Link href="/services/research/ml/deploy">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View All <ArrowRight className="size-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEPLOYMENT_CANDIDATES.filter(dc => dc.status !== "approved" && dc.status !== "rejected").map((candidate) => {
                const model = MODEL_VERSIONS.find(m => m.id === candidate.modelVersionId)
                const family = MODEL_FAMILIES.find(f => f.id === model?.modelFamilyId)
                const passedGates = candidate.gates.filter((g: { status: string }) => g.status === "passed").length
                const totalGates = candidate.gates.length
                
                return (
                  <div key={candidate.id} className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{family?.name}</span>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            v{model?.version}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Target: {candidate.targetStrategyIds.length} strategies
                        </p>
                      </div>
                      <Badge
                        className={
                          candidate.status === "shadow_running"
                            ? "bg-[var(--surface-ml)]/10 text-[var(--surface-ml)]"
                            : "bg-[var(--status-warning)]/10 text-[var(--status-warning)]"
                        }
                      >
                        {candidate.status.replace("_", " ")}
                      </Badge>
                    </div>
                    
                    {/* Gates progress */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Deployment Gates</span>
                        <span>{passedGates}/{totalGates} passed</span>
                      </div>
                      <div className="flex gap-1">
                        {candidate.gates.map((gate: { id: string; name: string; status: string }) => (
                          <div
                            key={gate.id}
                            className={`flex-1 h-2 rounded ${
                              gate.status === "passed"
                                ? "bg-[var(--status-live)]"
                                : gate.status === "failed"
                                ? "bg-[var(--status-critical)]"
                                : "bg-muted"
                            }`}
                            title={gate.name}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Expected impact */}
                    <div className="flex items-center gap-4 text-xs">
                      <span>
                        Sharpe: <span className="font-mono text-[var(--status-live)]">+{candidate.expectedImpact.sharpeChange.toFixed(2)}</span>
                      </span>
                      <span>
                        Accuracy: <span className="font-mono text-[var(--status-live)]">+{(candidate.expectedImpact.accuracyChange * 100).toFixed(1)}%</span>
                      </span>
                      <span>
                        Capital at Risk: <span className="font-mono">${(candidate.expectedImpact.capitalAtRisk / 1000).toFixed(0)}K</span>
                      </span>
                    </div>
                  </div>
                )
              })}
              {DEPLOYMENT_CANDIDATES.filter(dc => dc.status !== "approved" && dc.status !== "rejected").length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No pending promotions
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
