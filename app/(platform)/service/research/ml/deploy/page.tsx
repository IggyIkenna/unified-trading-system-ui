"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, 
  Rocket, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Clock,
  Shield,
  GitBranch,
  Database,
  Cpu,
  Activity,
  FileText,
  Users,
  Lock,
  Server,
  Zap,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Eye
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// Deploy readiness checklist
const deploymentChecklist = {
  modelId: "funding-pred-v2.4.0-rc1",
  modelName: "Funding Rate Predictor v2.4.0",
  targetStage: "CHAMPION",
  currentStage: "CHALLENGER",
  requestedBy: "alex.chen@odum.io",
  requestedAt: "2026-03-17 14:32:00",
  categories: [
    {
      id: "validation",
      name: "Model Validation",
      icon: "Target",
      status: "passed",
      checks: [
        { id: "backtest", name: "Backtest completed (6mo OOS)", status: "passed", detail: "Sharpe 2.58, +7.1% vs champion" },
        { id: "walkforward", name: "Walk-forward validation", status: "passed", detail: "5/5 windows passed" },
        { id: "statistical", name: "Statistical significance tests", status: "passed", detail: "4/5 tests significant at α=0.05" },
        { id: "regime", name: "Regime robustness check", status: "passed", detail: "Outperforms in all 5 regimes" },
        { id: "stress", name: "Stress test scenarios", status: "passed", detail: "Max DD -4.2% in crash scenario" },
      ],
    },
    {
      id: "technical",
      name: "Technical Readiness",
      icon: "Cpu",
      status: "passed",
      checks: [
        { id: "latency", name: "Inference latency < 50ms p99", status: "passed", detail: "32ms p99" },
        { id: "throughput", name: "Throughput > 1000 req/s", status: "passed", detail: "2,340 req/s" },
        { id: "memory", name: "Memory footprint < 2GB", status: "passed", detail: "1.2GB peak" },
        { id: "gpu", name: "GPU utilization optimal", status: "passed", detail: "68% avg, no throttling" },
        { id: "serialization", name: "Model serialization valid", status: "passed", detail: "ONNX v1.14" },
      ],
    },
    {
      id: "data",
      name: "Data Pipeline",
      icon: "Database",
      status: "warning",
      checks: [
        { id: "features", name: "All features available in prod", status: "passed", detail: "12/12 features mapped" },
        { id: "schema", name: "Input schema validated", status: "passed", detail: "v2.1 compatible" },
        { id: "freshness", name: "Feature freshness SLAs met", status: "warning", detail: "oi_change_1h: 850ms (target 500ms)" },
        { id: "fallback", name: "Fallback values configured", status: "passed", detail: "All 12 features have defaults" },
        { id: "drift", name: "No feature drift detected", status: "passed", detail: "PSI < 0.1 for all features" },
      ],
    },
    {
      id: "governance",
      name: "Governance & Compliance",
      icon: "Shield",
      status: "pending",
      checks: [
        { id: "review", name: "Quant team review", status: "passed", detail: "Approved by J. Smith" },
        { id: "risk", name: "Risk team sign-off", status: "pending", detail: "Awaiting M. Johnson" },
        { id: "audit", name: "Audit trail complete", status: "passed", detail: "Full lineage captured" },
        { id: "docs", name: "Documentation updated", status: "passed", detail: "Model card v2.4" },
        { id: "rollback", name: "Rollback plan documented", status: "passed", detail: "Automated rollback ready" },
      ],
    },
    {
      id: "infrastructure",
      name: "Infrastructure",
      icon: "Server",
      status: "passed",
      checks: [
        { id: "capacity", name: "Serving capacity available", status: "passed", detail: "4x A100 allocated" },
        { id: "monitoring", name: "Monitoring dashboards ready", status: "passed", detail: "Grafana configured" },
        { id: "alerts", name: "Alert thresholds configured", status: "passed", detail: "12 alerts active" },
        { id: "canary", name: "Canary deployment configured", status: "passed", detail: "5% initial traffic" },
        { id: "circuit", name: "Circuit breaker configured", status: "passed", detail: "Error rate > 5% triggers" },
      ],
    },
  ],
}

// Deployment stages
const deploymentStages = [
  { id: "canary", name: "Canary (5%)", status: "ready", duration: "30 min", metrics: "Error rate, latency" },
  { id: "shadow", name: "Shadow Mode", status: "ready", duration: "2 hours", metrics: "Prediction accuracy" },
  { id: "partial", name: "Partial (25%)", status: "pending", duration: "4 hours", metrics: "P&L impact" },
  { id: "majority", name: "Majority (75%)", status: "pending", duration: "12 hours", metrics: "Full metrics" },
  { id: "full", name: "Full Rollout", status: "pending", duration: "—", metrics: "Champion promotion" },
]

// Recent deployments
const recentDeployments = [
  { modelId: "vol-forecast-v1.8.2", deployedAt: "2026-03-15 09:00", status: "success", duration: "4h 32m", promotedBy: "j.smith@odum.io" },
  { modelId: "liq-detect-v3.1.0", deployedAt: "2026-03-12 14:30", status: "rolled_back", duration: "1h 15m", promotedBy: "m.wong@odum.io", reason: "Latency regression" },
  { modelId: "funding-pred-v2.3.1", deployedAt: "2026-03-01 10:00", status: "success", duration: "6h 45m", promotedBy: "a.chen@odum.io" },
  { modelId: "spread-pred-v2.0.0", deployedAt: "2026-02-20 11:15", status: "success", duration: "3h 20m", promotedBy: "j.smith@odum.io" },
]

export default function DeployReadinessPage() {
  const [deploymentConfig, setDeploymentConfig] = useState({
    canaryPercent: 5,
    autoRollback: true,
    shadowMode: true,
    notifySlack: true,
  })

  const totalChecks = deploymentChecklist.categories.flatMap(c => c.checks).length
  const passedChecks = deploymentChecklist.categories.flatMap(c => c.checks).filter(c => c.status === "passed").length
  const warningChecks = deploymentChecklist.categories.flatMap(c => c.checks).filter(c => c.status === "warning").length
  const pendingChecks = deploymentChecklist.categories.flatMap(c => c.checks).filter(c => c.status === "pending").length
  const readinessScore = Math.round((passedChecks / totalChecks) * 100)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed": return <CheckCircle2 className="size-4 text-[var(--status-success)]" />
      case "warning": return <AlertTriangle className="size-4 text-[var(--status-warning)]" />
      case "pending": return <Clock className="size-4 text-muted-foreground" />
      case "failed": return <XCircle className="size-4 text-[var(--status-error)]" />
      default: return null
    }
  }

  const getCategoryStatusBadge = (status: string) => {
    switch (status) {
      case "passed": return <Badge className="bg-[var(--status-success)]">Passed</Badge>
      case "warning": return <Badge className="bg-[var(--status-warning)] text-black">Warning</Badge>
      case "pending": return <Badge variant="outline">Pending</Badge>
      case "failed": return <Badge className="bg-[var(--status-error)]">Failed</Badge>
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/service/research/ml/overview">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="size-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  <Rocket className="size-5" />
                  Deploy Readiness
                </h1>
                <p className="text-sm text-muted-foreground">Pre-deployment checklist and rollout configuration</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {deploymentChecklist.modelName}
              </Badge>
              <Button variant="outline" size="sm">
                <Eye className="size-4 mr-2" />
                Preview Changes
              </Button>
              <Button 
                size="sm" 
                disabled={pendingChecks > 0}
                className={pendingChecks === 0 ? "bg-[var(--status-success)] hover:bg-[var(--status-success)]/90" : ""}
              >
                <Rocket className="size-4 mr-2" />
                Start Deployment
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Readiness Summary */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Readiness Score</p>
                  <p className="text-3xl font-bold">{readinessScore}%</p>
                </div>
                <div className="relative size-16">
                  <svg className="size-16 -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="hsl(var(--muted))" strokeWidth="4" fill="none" />
                    <circle 
                      cx="32" cy="32" r="28" 
                      stroke={readinessScore >= 90 ? "var(--status-success)" : readinessScore >= 70 ? "var(--status-warning)" : "var(--status-error)"} 
                      strokeWidth="4" 
                      fill="none"
                      strokeDasharray={`${readinessScore * 1.76} 176`}
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-8 text-[var(--status-success)]" />
                <div>
                  <p className="text-sm text-muted-foreground">Checks Passed</p>
                  <p className="text-2xl font-bold">{passedChecks}/{totalChecks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="size-8 text-[var(--status-warning)]" />
                <div>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                  <p className="text-2xl font-bold">{warningChecks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="size-8 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Approvals</p>
                  <p className="text-2xl font-bold">{pendingChecks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Blocking Issue Banner */}
        {pendingChecks > 0 && (
          <Card className="border-[var(--status-warning)]/50 bg-[var(--status-warning)]/10">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="size-6 text-[var(--status-warning)]" />
                  <div>
                    <p className="font-semibold">Deployment Blocked: Pending Approvals</p>
                    <p className="text-sm text-muted-foreground">
                      Risk team sign-off required before deployment can proceed
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Users className="size-4 mr-2" />
                  Request Approval
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Checklist */}
          <div className="col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deployment Checklist</CardTitle>
                <CardDescription>All checks must pass before deployment</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" defaultValue={["validation", "governance"]}>
                  {deploymentChecklist.categories.map(category => (
                    <AccordionItem key={category.id} value={category.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center gap-3">
                            {category.status === "passed" && <CheckCircle2 className="size-5 text-[var(--status-success)]" />}
                            {category.status === "warning" && <AlertTriangle className="size-5 text-[var(--status-warning)]" />}
                            {category.status === "pending" && <Clock className="size-5 text-muted-foreground" />}
                            <span className="font-medium">{category.name}</span>
                          </div>
                          {getCategoryStatusBadge(category.status)}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-8">
                          {category.checks.map(check => (
                            <div key={check.id} className="flex items-center justify-between py-2 border-b last:border-0">
                              <div className="flex items-center gap-3">
                                {getStatusIcon(check.status)}
                                <span className="text-sm">{check.name}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">{check.detail}</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            {/* Deployment Stages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rollout Stages</CardTitle>
                <CardDescription>Gradual deployment with automatic checkpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {deploymentStages.map((stage, idx) => (
                    <div key={stage.id} className="flex items-center">
                      <div className={`flex flex-col items-center p-3 rounded-lg border ${
                        stage.status === "ready" ? "border-[var(--status-success)]/50 bg-[var(--status-success)]/10" : "border-muted"
                      }`}>
                        <p className="text-sm font-medium">{stage.name}</p>
                        <p className="text-xs text-muted-foreground">{stage.duration}</p>
                        <Badge variant={stage.status === "ready" ? "default" : "outline"} className="mt-2 text-xs">
                          {stage.status === "ready" ? "Ready" : "Pending"}
                        </Badge>
                      </div>
                      {idx < deploymentStages.length - 1 && (
                        <ChevronRight className="size-4 text-muted-foreground mx-1" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuration & History */}
          <div className="space-y-4">
            {/* Deployment Config */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deployment Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Shadow Mode First</p>
                    <p className="text-xs text-muted-foreground">Run predictions without acting</p>
                  </div>
                  <Switch 
                    checked={deploymentConfig.shadowMode} 
                    onCheckedChange={(v) => setDeploymentConfig(p => ({ ...p, shadowMode: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Auto-Rollback</p>
                    <p className="text-xs text-muted-foreground">Rollback if metrics degrade</p>
                  </div>
                  <Switch 
                    checked={deploymentConfig.autoRollback} 
                    onCheckedChange={(v) => setDeploymentConfig(p => ({ ...p, autoRollback: v }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Slack Notifications</p>
                    <p className="text-xs text-muted-foreground">Alert #ml-deploys channel</p>
                  </div>
                  <Switch 
                    checked={deploymentConfig.notifySlack} 
                    onCheckedChange={(v) => setDeploymentConfig(p => ({ ...p, notifySlack: v }))}
                  />
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-2">Initial Canary %</p>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min="1" 
                      max="20" 
                      value={deploymentConfig.canaryPercent}
                      onChange={(e) => setDeploymentConfig(p => ({ ...p, canaryPercent: parseInt(e.target.value) }))}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-8">{deploymentConfig.canaryPercent}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Deployments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Deployments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentDeployments.map(dep => (
                    <div key={dep.modelId} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{dep.modelId}</p>
                        <p className="text-xs text-muted-foreground">{dep.deployedAt}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={dep.status === "success" ? "bg-[var(--status-success)]" : "bg-[var(--status-error)]"}>
                          {dep.status === "success" ? "Success" : "Rolled Back"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{dep.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
