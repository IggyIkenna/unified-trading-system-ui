"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { KPICard } from "@/components/trading/kpi-card"
import { ContextBar } from "@/components/platform/context-bar"
import { BatchLiveRail } from "@/components/platform/batch-live-rail"
import {
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ArrowRight,
  GitCompare,
  BarChart3,
  ShoppingBasket,
  ChevronRight,
  Play,
  Pause,
  RefreshCw,
} from "lucide-react"
import {
  STRATEGY_TEMPLATES,
  STRATEGY_CONFIGS,
  BACKTEST_RUNS,
  STRATEGY_ALERTS,
  STRATEGY_CANDIDATES,
  ARCHETYPE_OPTIONS,
} from "@/lib/strategy-platform-mock-data"

// Archetype catalog strip
function ArchetypeCatalog() {
  const [selected, setSelected] = React.useState<string | null>(null)

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      <span className="text-xs text-muted-foreground whitespace-nowrap">Archetypes:</span>
      {ARCHETYPE_OPTIONS.map((arch) => (
        <button
          key={arch.value}
          onClick={() => setSelected(selected === arch.value ? null : arch.value)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap
            ${selected === arch.value
              ? "bg-[var(--surface-strategy)] text-white"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }
          `}
        >
          {arch.label}
          <Badge variant="secondary" className="h-4 text-[10px] px-1">
            {arch.count}
          </Badge>
        </button>
      ))}
    </div>
  )
}

// Running backtests card
function RunningBacktests() {
  const running = BACKTEST_RUNS.filter((r) => r.status === "running")
  const queued = BACKTEST_RUNS.filter((r) => r.status === "queued")

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <RefreshCw className="size-4 text-[var(--surface-strategy)]" />
          Active Backtests
          <Badge variant="secondary" className="ml-auto">
            {running.length} running
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {running.length === 0 && queued.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active backtests</p>
        ) : (
          <>
            {running.map((run) => (
              <div key={run.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-medium">{run.templateName}</span>
                  <span className="text-muted-foreground">
                    {run.instrument} / {run.venue}
                  </span>
                </div>
                <Progress value={run.progress} className="h-1.5" />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Config v{run.configVersion}</span>
                  <span>{run.progress}% complete</span>
                </div>
              </div>
            ))}
            {queued.length > 0 && (
              <div className="pt-2 border-t text-xs text-muted-foreground">
                {queued.length} backtest(s) queued
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Recent completions card
function RecentCompletions() {
  const completed = BACKTEST_RUNS.filter((r) => r.status === "completed")
    .slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="size-4 text-[var(--status-live)]" />
          Recent Completions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {completed.map((run) => (
            <Link
              key={run.id}
              href={`/strategy-platform/results?runId=${run.id}`}
              className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium truncate">
                    {run.templateName}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    v{run.configVersion}
                  </Badge>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {run.instrument} / {run.venue} / {run.dateWindow.start} - {run.dateWindow.end}
                </div>
              </div>
              {run.metrics && (
                <div className="flex items-center gap-3 text-xs">
                  <div className="text-right">
                    <div className="font-mono font-medium">
                      {run.metrics.sharpe.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Sharpe</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono font-medium ${run.metrics.totalReturn >= 0 ? "text-[var(--status-live)]" : "text-[var(--status-critical)]"}`}>
                      {(run.metrics.totalReturn * 100).toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">Return</div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Strategy templates overview
function TemplatesCatalog() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          Strategy Templates
          <Badge variant="secondary">{STRATEGY_TEMPLATES.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {STRATEGY_TEMPLATES.slice(0, 6).map((tpl) => (
            <div
              key={tpl.id}
              className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium truncate">{tpl.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {tpl.archetype.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {tpl.venues.slice(0, 3).join(", ")}
                  {tpl.venues.length > 3 && ` +${tpl.venues.length - 3}`}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                v{tpl.version}
              </div>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
          View all templates
          <ArrowRight className="size-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  )
}

// Alerts feed
function AlertsFeed() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="size-4 text-[var(--status-warning)]" />
          Alerts
          <Badge variant="destructive" className="ml-auto">
            {STRATEGY_ALERTS.filter((a) => !a.acknowledgedAt).length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {STRATEGY_ALERTS.map((alert) => (
            <div
              key={alert.id}
              className={`p-2 rounded-md border text-xs ${
                alert.severity === "critical"
                  ? "border-[var(--status-critical)]/30 bg-[var(--status-critical)]/5"
                  : alert.severity === "warning"
                  ? "border-[var(--status-warning)]/30 bg-[var(--status-warning)]/5"
                  : "border-border bg-muted/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium">{alert.message}</span>
                {!alert.acknowledgedAt && (
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    NEW
                  </Badge>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {new Date(alert.triggeredAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Candidate basket summary
function CandidateSummary() {
  const pending = STRATEGY_CANDIDATES.filter((c) => c.reviewState === "pending").length
  const inReview = STRATEGY_CANDIDATES.filter((c) => c.reviewState === "in_review").length
  const approved = STRATEGY_CANDIDATES.filter((c) => c.reviewState === "approved").length

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ShoppingBasket className="size-4 text-[var(--surface-strategy)]" />
          Candidate Basket
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold font-mono">{pending}</div>
            <div className="text-[10px] text-muted-foreground">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-[var(--status-warning)]">{inReview}</div>
            <div className="text-[10px] text-muted-foreground">In Review</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-mono text-[var(--status-live)]">{approved}</div>
            <div className="text-[10px] text-muted-foreground">Approved</div>
          </div>
        </div>
        <div className="space-y-2">
          {STRATEGY_CANDIDATES.slice(0, 3).map((cand) => {
            const config = STRATEGY_CONFIGS.find((c) => c.id === cand.configId)
            return (
              <div key={cand.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                <div>
                  <div className="text-xs font-medium">{config?.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    v{cand.configVersion} • Sharpe: {cand.metricsSnapshot.sharpe.toFixed(2)}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    cand.reviewState === "approved"
                      ? "text-[var(--status-live)] border-[var(--status-live)]/30"
                      : cand.reviewState === "in_review"
                      ? "text-[var(--status-warning)] border-[var(--status-warning)]/30"
                      : ""
                  }`}
                >
                  {cand.reviewState.replace("_", " ")}
                </Badge>
              </div>
            )
          })}
        </div>
        <Link href="/strategy-platform/candidates">
          <Button variant="outline" size="sm" className="w-full mt-3 text-xs">
            View all candidates
            <ArrowRight className="size-3 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

// Batch vs Live drift summary
function DriftSummary() {
  const withDrift = BACKTEST_RUNS.filter((r) => r.driftScore !== null)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <GitCompare className="size-4" />
          Batch/Live Drift
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {withDrift.map((run) => (
            <div key={run.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{run.templateName}</span>
                <span
                  className={`font-mono ${
                    (run.driftScore || 0) < 0.1
                      ? "text-[var(--status-live)]"
                      : (run.driftScore || 0) < 0.2
                      ? "text-[var(--status-warning)]"
                      : "text-[var(--status-critical)]"
                  }`}
                >
                  {((run.driftScore || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <Progress
                value={100 - (run.driftScore || 0) * 100}
                className="h-1.5"
              />
              <div className="text-[10px] text-muted-foreground">
                v{run.configVersion} • {run.venue}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function StrategyPlatformOverviewPage() {
  const [context, setContext] = React.useState<"BATCH" | "LIVE">("BATCH")

  // Calculate KPIs
  const totalBacktests = BACKTEST_RUNS.length
  const completedBacktests = BACKTEST_RUNS.filter((r) => r.status === "completed").length
  const avgSharpe = BACKTEST_RUNS
    .filter((r) => r.metrics)
    .reduce((sum, r) => sum + (r.metrics?.sharpe || 0), 0) / completedBacktests
  const candidatesInReview = STRATEGY_CANDIDATES.filter((c) => c.reviewState === "in_review").length

  return (
    <div className="flex flex-col flex-1">
      {/* Context Bar */}
      <ContextBar
        platform="strategy"
        scope={{ fund: "ODUM", client: "Internal" }}
        context={context}
        badges={[
          { label: "Stage", value: "Research" },
          { label: "Templates", value: String(STRATEGY_TEMPLATES.length) },
        ]}
        dataSource="HISTORICAL_TICK"
        asOfDate="2024-10-18"
      />

      {/* Batch/Live Rail */}
      <BatchLiveRail
        platform="strategy"
        currentStage="Backtest"
        context={context}
        onContextChange={setContext}
      />

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Archetype Catalog */}
        <ArchetypeCatalog />

        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4">
          <KPICard
            title="Total Backtests"
            value={totalBacktests}
            icon={<FlaskConical className="size-4" />}
            subtitle={`${completedBacktests} completed`}
          />
          <KPICard
            title="Avg Sharpe"
            value={avgSharpe.toFixed(2)}
            icon={<TrendingUp className="size-4" />}
            trend={{ value: 12, direction: "up" }}
          />
          <KPICard
            title="Candidates"
            value={STRATEGY_CANDIDATES.length}
            icon={<ShoppingBasket className="size-4" />}
            subtitle={`${candidatesInReview} in review`}
          />
          <KPICard
            title="Active Alerts"
            value={STRATEGY_ALERTS.filter((a) => !a.acknowledgedAt).length}
            icon={<AlertTriangle className="size-4" />}
            status={STRATEGY_ALERTS.some((a) => a.severity === "critical" && !a.acknowledgedAt) ? "critical" : "nominal"}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <RunningBacktests />
            <TemplatesCatalog />
          </div>

          {/* Center Column */}
          <div className="space-y-6">
            <RecentCompletions />
            <DriftSummary />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <CandidateSummary />
            <AlertsFeed />
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/strategy-platform/backtests">
                  <Button variant="outline" size="sm" className="gap-2">
                    <FlaskConical className="size-4" />
                    View Backtests Grid
                  </Button>
                </Link>
                <Link href="/strategy-platform/compare">
                  <Button variant="outline" size="sm" className="gap-2">
                    <GitCompare className="size-4" />
                    Compare Configs
                  </Button>
                </Link>
                <Link href="/strategy-platform/heatmap">
                  <Button variant="outline" size="sm" className="gap-2">
                    <BarChart3 className="size-4" />
                    Performance Heatmap
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Last sync:</span>
                <span className="font-mono">2 min ago</span>
                <Button variant="ghost" size="icon" className="size-6">
                  <RefreshCw className="size-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
