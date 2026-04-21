"use client";

/**
 * G1.1 intentional split — /services/research/overview is the Build/Research
 * landing page. Its trading-phase counterpart at /services/trading/overview is
 * a deliberately different surface (live trading desk landing), NOT a phase
 * fork of the same conceptual page. Per Stage 3E §1.1, these remain separate
 * component trees because they serve distinct audiences with distinct data
 * bindings. The `phase` prop pattern applies only to surfaces that SHARE a
 * conceptual role across research / paper / live — these do not.
 */
import { AlertRow } from "@/components/shared/alert-row";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BuildActiveJob, BuildActivity, BuildAlert } from "@/lib/mocks/fixtures/build-data";
import {
  BUILD_ACTIVE_JOBS,
  BUILD_ALERTS,
  BUILD_OVERVIEW_STATS,
  BUILD_RECENT_ACTIVITY,
} from "@/lib/mocks/fixtures/build-data";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Database,
  FlaskConical,
  Info,
  Layers,
  Pause,
  Play,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { formatNumber } from "@/lib/utils/formatters";
import { FamilyArchetypePicker } from "@/components/architecture-v2";
import type { StrategyArchetypeV2, StrategyFamilyV2 } from "@/lib/architecture-v2";

// ─── Pipeline Stage Cards ─────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  {
    id: "features",
    label: "Features",
    icon: Layers,
    href: "/services/research/features",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    stats: (s: typeof BUILD_OVERVIEW_STATS) => [
      { label: "Defined", value: s.features.total_defined.toString() },
      { label: "Computed", value: `${s.features.computed_pct}%` },
      { label: "Stale", value: s.features.stale_count.toString() },
    ],
    badge: (s: typeof BUILD_OVERVIEW_STATS) =>
      s.features.stale_count > 0
        ? {
            label: `${s.features.stale_count} stale`,
            variant: "warning" as const,
          }
        : { label: "Healthy", variant: "success" as const },
  },
  {
    id: "feature_etl",
    label: "Feature ETL",
    icon: Database,
    href: "/services/research/feature-etl",
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    stats: (s: typeof BUILD_OVERVIEW_STATS) => [
      { label: "Complete", value: `${s.feature_etl.overall_pct}%` },
      {
        label: "Shards",
        value: `${s.feature_etl.shards_complete}/${s.feature_etl.shards_total}`,
      },
      { label: "Active Jobs", value: s.feature_etl.active_jobs.toString() },
    ],
    badge: (s: typeof BUILD_OVERVIEW_STATS) =>
      s.feature_etl.active_jobs > 0
        ? {
            label: `${s.feature_etl.active_jobs} running`,
            variant: "info" as const,
          }
        : { label: "Idle", variant: "default" as const },
  },
  {
    id: "models",
    label: "Models",
    icon: Brain,
    href: "/services/research/ml",
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
    stats: (s: typeof BUILD_OVERVIEW_STATS) => [
      { label: "Trained", value: s.models.total_trained.toString() },
      { label: "Champions", value: s.models.champion_count.toString() },
      { label: "Training", value: s.models.active_jobs.toString() },
    ],
    badge: (s: typeof BUILD_OVERVIEW_STATS) =>
      s.models.active_jobs > 0
        ? {
            label: `${s.models.active_jobs} training`,
            variant: "info" as const,
          }
        : {
            label: `${s.models.champion_count} champions`,
            variant: "success" as const,
          },
  },
  {
    id: "strategies",
    label: "Strategies",
    icon: FlaskConical,
    href: "/services/research/strategies",
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    stats: (s: typeof BUILD_OVERVIEW_STATS) => [
      { label: "Backtests", value: s.strategies.total_run.toString() },
      { label: "Candidates", value: s.strategies.candidates.toString() },
      { label: "This Week", value: s.strategies.new_this_week.toString() },
    ],
    badge: (s: typeof BUILD_OVERVIEW_STATS) => ({
      label: `${s.strategies.candidates} candidates`,
      variant: "success" as const,
    }),
  },
  {
    id: "execution",
    label: "Execution",
    icon: Zap,
    href: "/services/research/execution",
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    stats: (s: typeof BUILD_OVERVIEW_STATS) => [
      { label: "Backtested", value: s.execution.total_backtested.toString() },
      { label: "In Progress", value: s.execution.in_progress.toString() },
      { label: "Best Sharpe", value: formatNumber(s.execution.best_sharpe, 2) },
    ],
    badge: (s: typeof BUILD_OVERVIEW_STATS) =>
      s.execution.in_progress > 0
        ? {
            label: `${s.execution.in_progress} running`,
            variant: "info" as const,
          }
        : {
            label: `Best: ${formatNumber(s.execution.best_sharpe, 2)}`,
            variant: "success" as const,
          },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const JOB_TYPE_COLORS: Record<BuildActiveJob["type"], string> = {
  feature_computation: "text-cyan-400",
  model_training: "text-violet-400",
  strategy_backtest: "text-amber-400",
  execution_backtest: "text-emerald-400",
};

const JOB_TYPE_LABELS: Record<BuildActiveJob["type"], string> = {
  feature_computation: "Feature ETL",
  model_training: "Model Training",
  strategy_backtest: "Strategy",
  execution_backtest: "Execution",
};

const JOB_TYPE_HREFS: Record<BuildActiveJob["type"], string> = {
  feature_computation: "/services/research/feature-etl",
  model_training: "/services/research/ml/training",
  strategy_backtest: "/services/research/strategies",
  execution_backtest: "/services/research/execution",
};

const ALERT_ICONS: Record<BuildAlert["severity"], React.ElementType> = {
  critical: XCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

const ALERT_COLORS: Record<BuildAlert["severity"], string> = {
  critical: "text-red-400",
  warning: "text-amber-400",
  info: "text-blue-400",
  success: "text-emerald-400",
};

const BADGE_VARIANTS = {
  warning: "border-amber-400/40 text-amber-400",
  success: "border-emerald-400/40 text-emerald-400",
  info: "border-blue-400/40 text-blue-400",
  default: "border-muted-foreground/30 text-muted-foreground",
} as const;

function StatusBadge({ label, variant }: { label: string; variant: keyof typeof BADGE_VARIANTS }) {
  return (
    <Badge variant="outline" className={cn("text-xs", BADGE_VARIANTS[variant])}>
      {label}
    </Badge>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BuildOverviewPage() {
  const stats = BUILD_OVERVIEW_STATS;
  const activeJobs = BUILD_ACTIVE_JOBS;
  const alerts = BUILD_ALERTS;
  const activity = BUILD_RECENT_ACTIVITY;

  const runningJobs = activeJobs.filter((j) => j.status === "running");
  const queuedJobs = activeJobs.filter((j) => j.status === "queued");
  const [scopeFamily, setScopeFamily] = React.useState<
    StrategyFamilyV2 | undefined
  >(undefined);
  const [scopeArchetype, setScopeArchetype] = React.useState<
    StrategyArchetypeV2 | undefined
  >(undefined);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Research Pipeline"
        description={
          <>
            <p>Features, models, strategies, and execution research — one pipeline, one family.</p>
            <p className="text-caption text-muted-foreground/60 font-mono">
              {runningJobs.length} active job{runningJobs.length !== 1 ? "s" : ""} &middot;{" "}
              {alerts.filter((a) => a.severity === "critical" || a.severity === "warning").length} alert
              {alerts.filter((a) => a.severity === "critical" || a.severity === "warning").length !== 1 ? "s" : ""}
            </p>
          </>
        }
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/services/research/feature-etl">
            <Database className="size-4 mr-2" />
            Feature ETL
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/services/research/execution">
            <Zap className="size-4 mr-2" />
            New Backtest
          </Link>
        </Button>
      </PageHeader>

      {/* v2 Family / Archetype scope — narrows downstream drill-downs. */}
      <div
        className="flex flex-wrap items-center gap-3 rounded-md border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground"
        data-testid="research-overview-family-picker"
      >
        <span className="font-medium uppercase tracking-wide">Scope</span>
        <FamilyArchetypePicker
          idPrefix="research-overview"
          availabilityFilter="allowed"
          value={{ family: scopeFamily, archetype: scopeArchetype }}
          onChange={(next) => {
            setScopeFamily(next.family);
            setScopeArchetype(next.archetype);
          }}
        />
        {scopeArchetype && (
          <Link
            href={`/services/research/strategies?archetype=${scopeArchetype}`}
            className="ml-auto text-primary underline-offset-4 hover:underline"
            data-testid="research-overview-drilldown-link"
          >
            Open strategies scoped to {scopeArchetype} &rarr;
          </Link>
        )}
      </div>

      {/* Pipeline Stage Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {PIPELINE_STAGES.map((stage) => {
          const Icon = stage.icon;
          const stageStats = stage.stats(stats);
          const stageBadge = stage.badge(stats);
          return (
            <Link key={stage.id} href={stage.href}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={cn("flex items-center justify-center size-8 rounded-lg", stage.bgColor)}>
                      <Icon className={cn("size-4", stage.color)} />
                    </div>
                    <StatusBadge label={stageBadge.label} variant={stageBadge.variant} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{stage.label}</p>
                  </div>
                  <div className="space-y-1">
                    {stageStats.map((s) => (
                      <div key={s.label} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{s.label}</span>
                        <span className="font-medium tabular-nums">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Active Jobs + Alerts (two-column) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Jobs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="size-4 text-primary" />
                Active Jobs
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-400/30">
                  {runningJobs.length} running
                </Badge>
                {queuedJobs.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {queuedJobs.length} queued
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeJobs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No active jobs</p>
            )}
            {activeJobs.map((job) => {
              const href = JOB_TYPE_HREFS[job.type];
              return (
                <Link key={job.id} href={href}>
                  <div className="rounded-lg border border-border/50 p-3 hover:border-primary/30 transition-colors cursor-pointer space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-xs shrink-0", JOB_TYPE_COLORS[job.type])}>
                            {JOB_TYPE_LABELS[job.type]}
                          </Badge>
                          <span className="text-sm font-medium truncate">{job.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{job.detail}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {job.status === "running" ? (
                          <div className="flex items-center gap-1 text-xs text-emerald-400">
                            <Play className="size-3" />
                            {job.eta_minutes != null ? `~${job.eta_minutes}m` : "Running"}
                          </div>
                        ) : job.status === "queued" ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            Queued
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-amber-400">
                            <Pause className="size-3" />
                            Paused
                          </div>
                        )}
                      </div>
                    </div>
                    {job.status === "running" && (
                      <div className="space-y-1">
                        <Progress value={job.progress_pct} className="h-1.5" />
                        <p className="text-xs text-muted-foreground text-right">{job.progress_pct}%</p>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
            <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
              <Link href="/services/research/feature-etl">
                View all jobs <ArrowRight className="size-3 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-400" />
                Alerts
              </CardTitle>
              <div className="flex gap-1">
                {(["critical", "warning"] as const).map((sev) => {
                  const count = alerts.filter((a) => a.severity === sev).length;
                  if (count === 0) return null;
                  return (
                    <Badge key={sev} variant="outline" className={cn("text-xs", ALERT_COLORS[sev])}>
                      {count} {sev}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              <div className="space-y-2 pr-2">
                {alerts.map((alert) => {
                  const AlertIcon = ALERT_ICONS[alert.severity];
                  return (
                    <AlertRow
                      key={alert.id}
                      variant="card"
                      leading={<AlertIcon className={cn("size-4 shrink-0", ALERT_COLORS[alert.severity])} />}
                      classNameLeading="mt-0.5"
                      title={alert.message}
                      detail={alert.detail ?? undefined}
                      timestamp={alert.timestamp}
                      timestampMode="relative"
                      actionHref={alert.action_href}
                      actionPresentation="footer"
                    />
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              Recent Activity
            </CardTitle>
          </div>
          <CardDescription>Latest changes across the research pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {activity.map((item: BuildActivity, i) => (
              <AlertRow
                key={item.id}
                variant="inline"
                withBottomBorder={i < activity.length - 1}
                dividerTone="subtle"
                actionPresentation="none"
                leading={<span className="size-1.5 shrink-0 rounded-full bg-primary/60" />}
                titleClassName="text-sm font-normal"
                title={
                  item.href ? (
                    <Link href={item.href} className="hover:text-primary transition-colors">
                      {item.action}
                    </Link>
                  ) : (
                    item.action
                  )
                }
                end={
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{item.actor}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
