"use client"

import * as React from "react"
import { AppShell } from "@/components/trading/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { EntityLink } from "@/components/trading/entity-link"
import {
  Cpu,
  Beaker,
  Box,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  ArrowRight,
  RefreshCw,
  GitBranch,
  BarChart3,
} from "lucide-react"
import { SERVICES, STRATEGY_ARCHETYPES, UNDERLYINGS } from "@/lib/reference-data"
import { LossCurves, ModelStrategyLinkage } from "@/components/ml/loss-curves"

// Feature services from reference data
const FEATURE_SERVICES = SERVICES.filter(s => s.domain === "features")

// Mock experiments data
const experiments = [
  {
    id: "exp-342",
    name: "BTC Direction Prediction",
    status: "running",
    progress: 67,
    startedAt: "2h ago",
    metrics: { accuracy: 0.72, loss: 0.31, sharpe: 1.8 },
    hyperparams: { lr: 0.001, layers: 4, dropout: 0.2 },
  },
  {
    id: "exp-341",
    name: "ETH Volatility Surface",
    status: "complete",
    progress: 100,
    completedAt: "4h ago",
    metrics: { accuracy: 0.68, loss: 0.42, sharpe: 1.4 },
    hyperparams: { lr: 0.0005, layers: 6, dropout: 0.3 },
  },
  {
    id: "exp-340",
    name: "Multi-Asset Momentum",
    status: "complete",
    progress: 100,
    completedAt: "1d ago",
    metrics: { accuracy: 0.71, loss: 0.35, sharpe: 2.1 },
    hyperparams: { lr: 0.001, layers: 3, dropout: 0.15 },
  },
  {
    id: "exp-339",
    name: "Sports Outcome Model",
    status: "failed",
    progress: 45,
    error: "OOM: Insufficient GPU memory",
    hyperparams: { lr: 0.002, layers: 8, dropout: 0.25 },
  },
]

// Mock models registry
const models = [
  {
    id: "model-btc-dir-v3",
    name: "BTC Direction v3",
    version: "3.2.1",
    status: "deployed",
    accuracy: 0.72,
    deployedAt: "12h ago",
    predictions: 1842,
    avgLatency: 4.2,
  },
  {
    id: "model-eth-vol-v2",
    name: "ETH Volatility v2",
    version: "2.1.0",
    status: "deployed",
    accuracy: 0.68,
    deployedAt: "2d ago",
    predictions: 3201,
    avgLatency: 3.8,
  },
  {
    id: "model-momentum-v1",
    name: "Multi-Asset Momentum",
    version: "1.0.0",
    status: "staging",
    accuracy: 0.71,
    deployedAt: "3h ago",
    predictions: 0,
    avgLatency: null,
  },
  {
    id: "model-sports-v1",
    name: "Sports Outcome",
    version: "0.9.2",
    status: "training",
    accuracy: null,
    deployedAt: null,
    predictions: 0,
    avgLatency: null,
  },
]

// Feature store - using real feature services from reference data
const features = [
  { name: "delta_one_features", service: FEATURE_SERVICES.find(s => s.id === "features-delta-one-service")?.name, freshness: "2s", sla: "5s", status: "healthy" as const, coveragePct: 71 },
  { name: "volatility_features", service: FEATURE_SERVICES.find(s => s.id === "features-volatility-service")?.name, freshness: "8s", sla: "10s", status: "healthy" as const, coveragePct: 35 },
  { name: "onchain_features", service: FEATURE_SERVICES.find(s => s.id === "features-onchain-service")?.name, freshness: "4s", sla: "5s", status: "healthy" as const, coveragePct: 39 },
  { name: "cross_instrument", service: FEATURE_SERVICES.find(s => s.id === "features-cross-instrument-service")?.name, freshness: "0.5s", sla: "1s", status: "healthy" as const, coveragePct: 65 },
  { name: "multi_timeframe", service: FEATURE_SERVICES.find(s => s.id === "features-multi-timeframe-service")?.name, freshness: "45s", sla: "30s", status: "degraded" as const, coveragePct: 57 },
  { name: "calendar_features", service: FEATURE_SERVICES.find(s => s.id === "features-calendar-service")?.name, freshness: "1m", sla: "2m", status: "healthy" as const, coveragePct: 72 },
]

// Grid comparison mock (hyperparameter sweep)
const gridResults = [
  { lr: 0.001, layers: 3, dropout: 0.1, sharpe: 2.1, accuracy: 0.71, selected: true },
  { lr: 0.001, layers: 4, dropout: 0.2, sharpe: 1.8, accuracy: 0.72, selected: false },
  { lr: 0.0005, layers: 4, dropout: 0.2, sharpe: 1.6, accuracy: 0.69, selected: false },
  { lr: 0.0005, layers: 6, dropout: 0.3, sharpe: 1.4, accuracy: 0.68, selected: false },
  { lr: 0.002, layers: 3, dropout: 0.15, sharpe: 1.2, accuracy: 0.65, selected: false },
]

export default function MLPage() {
  return (
    <AppShell
      activeSurface="ml"
      showLifecycleRail={false}
      breadcrumbs={[
        { label: "ML Platform", href: "/ml" },
        { label: "Overview" },
      ]}
      contextLevels={{ organization: true, client: false, strategy: true, underlying: true }}
    >
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">ML Platform</h1>
            <p className="text-sm text-muted-foreground">
              Model training, experiments, and deployment
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button size="sm" className="gap-2" style={{ backgroundColor: "var(--surface-ml)" }}>
              <Beaker className="size-4" />
              New Experiment
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--status-running)]/10">
                  <Activity className="size-5" style={{ color: "var(--status-running)" }} />
                </div>
                <div>
                  <p className="text-2xl font-semibold">3</p>
                  <p className="text-xs text-muted-foreground">Running Experiments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--status-live)]/10">
                  <Box className="size-5" style={{ color: "var(--status-live)" }} />
                </div>
                <div>
                  <p className="text-2xl font-semibold">2</p>
                  <p className="text-xs text-muted-foreground">Deployed Models</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">5,043</p>
                  <p className="text-xs text-muted-foreground">Predictions Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--surface-ml)]/10">
                  <Cpu className="size-5" style={{ color: "var(--surface-ml)" }} />
                </div>
                <div>
                  <p className="text-2xl font-semibold">4.0ms</p>
                  <p className="text-xs text-muted-foreground">Avg Inference</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="experiments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="experiments" className="gap-2">
              <Beaker className="size-4" />
              Experiments
            </TabsTrigger>
            <TabsTrigger value="models" className="gap-2">
              <Box className="size-4" />
              Model Registry
            </TabsTrigger>
            <TabsTrigger value="grid" className="gap-2">
              <BarChart3 className="size-4" />
              Hyperparameter Grid
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <GitBranch className="size-4" />
              Feature Store
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-2">
              <TrendingUp className="size-4" />
              Training & Linkage
            </TabsTrigger>
          </TabsList>

          {/* Experiments Tab */}
          <TabsContent value="experiments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Experiments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {experiments.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {exp.status === "running" && (
                          <RefreshCw className="size-4 animate-spin text-[var(--status-running)]" />
                        )}
                        {exp.status === "complete" && (
                          <CheckCircle2 className="size-4 text-[var(--status-live)]" />
                        )}
                        {exp.status === "failed" && (
                          <XCircle className="size-4 text-[var(--status-critical)]" />
                        )}
                        <div>
                          <EntityLink
                            type="experiment"
                            id={exp.id}
                            label={exp.name}
                            className="font-semibold"
                          />
                          <span className="text-xs text-muted-foreground ml-2">{exp.id}</span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          exp.status === "complete"
                            ? "default"
                            : exp.status === "running"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {exp.status}
                      </Badge>
                    </div>

                    {exp.status === "running" && (
                      <div className="mb-3">
                        <Progress value={exp.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {exp.progress}% complete &bull; Started {exp.startedAt}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-muted-foreground">
                          lr: <span className="font-mono text-foreground">{exp.hyperparams.lr}</span>
                        </span>
                        <span className="text-muted-foreground">
                          layers:{" "}
                          <span className="font-mono text-foreground">{exp.hyperparams.layers}</span>
                        </span>
                        <span className="text-muted-foreground">
                          dropout:{" "}
                          <span className="font-mono text-foreground">{exp.hyperparams.dropout}</span>
                        </span>
                      </div>
                      {exp.metrics && (
                        <div className="flex items-center gap-4 text-sm">
                          <span>
                            Accuracy:{" "}
                            <span className="font-mono font-semibold">
                              {(exp.metrics.accuracy * 100).toFixed(1)}%
                            </span>
                          </span>
                          <span>
                            Loss:{" "}
                            <span className="font-mono font-semibold">
                              {exp.metrics.loss.toFixed(3)}
                            </span>
                          </span>
                          <span>
                            Sharpe:{" "}
                            <span className="font-mono font-semibold">{exp.metrics.sharpe}</span>
                          </span>
                        </div>
                      )}
                      {exp.error && (
                        <span className="text-sm text-[var(--status-critical)]">{exp.error}</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Models Tab */}
          <TabsContent value="models" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Model Registry</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {models.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`size-10 rounded-lg flex items-center justify-center ${
                          model.status === "deployed"
                            ? "bg-[var(--status-live)]/10"
                            : model.status === "staging"
                            ? "bg-[var(--status-warning)]/10"
                            : "bg-muted"
                        }`}
                      >
                        <Box
                          className="size-5"
                          style={{
                            color:
                              model.status === "deployed"
                                ? "var(--status-live)"
                                : model.status === "staging"
                                ? "var(--status-warning)"
                                : "var(--muted-foreground)",
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{model.name}</span>
                          <Badge variant="outline" className="font-mono text-xs">
                            v{model.version}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {model.deployedAt
                            ? `Deployed ${model.deployedAt}`
                            : "Not yet deployed"}
                          {model.accuracy && ` • Accuracy: ${(model.accuracy * 100).toFixed(1)}%`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {model.predictions > 0 && (
                        <div className="text-right text-sm">
                          <p className="font-mono">{model.predictions.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">predictions</p>
                        </div>
                      )}
                      {model.avgLatency && (
                        <div className="text-right text-sm">
                          <p className="font-mono">{model.avgLatency}ms</p>
                          <p className="text-xs text-muted-foreground">avg latency</p>
                        </div>
                      )}
                      <Badge
                        variant={model.status === "deployed" ? "default" : "secondary"}
                        className={
                          model.status === "deployed"
                            ? "bg-[var(--status-live)]/10 text-[var(--status-live)]"
                            : ""
                        }
                      >
                        {model.status}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {model.status === "deployed" ? (
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Pause className="size-4" />
                            Undeploy
                          </Button>
                        ) : model.status === "staging" ? (
                          <Button size="sm" className="gap-1">
                            <Play className="size-4" />
                            Deploy
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Grid Tab */}
          <TabsContent value="grid" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Hyperparameter Grid</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">5 configurations</Badge>
                    <Button size="sm" variant="outline">
                      Promote Selected
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Select</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Learning Rate</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Layers</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Dropout</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Sharpe</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Accuracy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gridResults.map((row, i) => (
                        <tr
                          key={i}
                          className={`border-b border-border hover:bg-muted/30 transition-colors ${
                            row.selected ? "bg-primary/5" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              defaultChecked={row.selected}
                              className="rounded border-border"
                            />
                          </td>
                          <td className="py-3 px-4 font-mono">{row.lr}</td>
                          <td className="py-3 px-4 font-mono">{row.layers}</td>
                          <td className="py-3 px-4 font-mono">{row.dropout}</td>
                          <td className="py-3 px-4 text-right font-mono font-semibold">
                            {row.sharpe.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {(row.accuracy * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Feature Store</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {features.map((feature) => (
                  <div
                    key={feature.name}
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`size-2 rounded-full ${
                          feature.status === "healthy"
                            ? "bg-[var(--status-live)]"
                            : "bg-[var(--status-warning)]"
                        }`}
                      />
                      <span className="font-mono">{feature.name}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <span className="text-muted-foreground">Freshness: </span>
                        <span
                          className={`font-mono ${
                            feature.status === "degraded" ? "text-[var(--status-warning)]" : ""
                          }`}
                        >
                          {feature.freshness}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground">SLA: </span>
                        <span className="font-mono">{feature.sla}</span>
                      </div>
                      <Badge
                        variant={feature.status === "healthy" ? "default" : "secondary"}
                        className={
                          feature.status === "healthy"
                            ? "bg-[var(--status-live)]/10 text-[var(--status-live)]"
                            : "bg-[var(--status-warning)]/10 text-[var(--status-warning)]"
                        }
                      >
                        {feature.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training & Linkage Tab */}
          <TabsContent value="training" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Loss Curves */}
              <LossCurves experimentId="exp-342" />
              
              {/* Model-Strategy Linkage */}
              <ModelStrategyLinkage />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
