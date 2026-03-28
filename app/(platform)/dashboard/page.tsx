"use client";

import * as React from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { SERVICE_REGISTRY, getVisibleServices } from "@/lib/config/services";
import type { ServiceDefinition } from "@/lib/config/services";
import {
  PLATFORM_LIFECYCLE_CONFIG,
  PLATFORM_LIFECYCLE_STAGES,
  type PlatformLifecycleStage,
} from "@/lib/taxonomy";
import { PLATFORM_STATS } from "@/lib/config/platform-stats";
import { useExecutionMode } from "@/lib/execution-mode-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Lock,
  Database,
  FlaskConical,
  ArrowUpCircle,
  TrendingUp,
  Eye,
  Settings2,
  FileText,
  ChevronRight,
  Activity,
  Radio,
  Shield,
  Zap,
  BarChart3,
  Clock,
  DollarSign,
  AlertTriangle,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HealthBar } from "@/components/platform/health-bar";
import { QuickActions } from "@/components/platform/quick-actions";
import { ActivityFeed } from "@/components/platform/activity-feed";

// ─── Icon map for services ────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Database,
  FlaskConical,
  ArrowUpCircle,
  TrendingUp,
  Eye,
  Settings2,
  FileText,
  Settings: Settings2,
};

// ─── Role-aware KPI definitions ───────────────────────────────────────────────
// Each entitlement tier sees KPIs relevant to their subscription.
// In production these values come from the API; mock mode generates realistic data.

interface KPIDef {
  label: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  href: string;
  alert?: boolean;
  subtle?: boolean;
}

function useRoleKPIs(
  hasEntitlement: (e: string) => boolean,
  isLive: boolean,
): KPIDef[] {
  return React.useMemo(() => {
    const kpis: KPIDef[] = [];

    // Data KPIs — everyone with data access sees these
    if (hasEntitlement("data-basic") || hasEntitlement("data-pro")) {
      kpis.push({
        label: "Instruments",
        value: hasEntitlement("data-pro") ? "2,400+" : "180",
        icon: Database,
        href: "/services/data/instruments",
      });
      kpis.push({
        label: "Data Freshness",
        value: isLive ? "Real-time" : "T+1 06:00",
        icon: Clock,
        href: "/services/data/overview",
        subtle: true,
      });
    }

    // Research KPIs — strategy/ML users
    if (hasEntitlement("strategy-full") || hasEntitlement("ml-full")) {
      kpis.push({
        label: "Backtests",
        value: "38",
        change: 5.2,
        icon: FlaskConical,
        href: "/services/research/strategy/backtests",
      });
      kpis.push({
        label: "Models",
        value: "6 champions",
        icon: Brain,
        href: "/services/research/ml/registry",
      });
    }

    // Trading KPIs — execution users
    if (hasEntitlement("execution-basic") || hasEntitlement("execution-full")) {
      kpis.push({
        label: "Net P&L",
        value: `$${isLive ? "142.4" : "138.9"}K`,
        change: isLive ? 3.2 : 2.8,
        icon: DollarSign,
        href: "/services/trading/pnl",
      });
      kpis.push({
        label: "Positions",
        value: "47",
        icon: BarChart3,
        href: "/services/trading/positions",
      });
      kpis.push({
        label: "Risk Util.",
        value: "62%",
        icon: Shield,
        href: "/services/observe/risk",
        alert: 62 > 75,
      });
      kpis.push({
        label: "Alerts",
        value: isLive ? "3" : "0",
        icon: AlertTriangle,
        href: "/services/observe/alerts",
        alert: isLive,
      });
    }

    // Reporting KPIs — reporting/IR users (without trading)
    if (
      hasEntitlement("reporting") &&
      !hasEntitlement("execution-basic")
    ) {
      kpis.push({
        label: "AUM",
        value: "$24.8m",
        change: 1.4,
        icon: DollarSign,
        href: "/services/reports/overview",
      });
      kpis.push({
        label: "MTD Return",
        value: "+2.3%",
        icon: TrendingUp,
        href: "/services/reports/overview",
      });
      kpis.push({
        label: "Pending Settlement",
        value: "$48.2K",
        icon: Clock,
        href: "/services/reports/settlement",
      });
    }

    return kpis;
  }, [hasEntitlement, isLive]);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, hasEntitlement, isAdmin, isInternal } = useAuth();
  const { mode, isLive, setMode } = useExecutionMode();
  const kpis = useRoleKPIs(hasEntitlement, isLive);

  const allServices = SERVICE_REGISTRY.filter((svc) => {
    if (svc.internalOnly && user?.role !== "admin") return false;
    return true;
  });

  const visibleServices = React.useMemo(() => {
    if (!user) return [];
    return getVisibleServices(
      user.entitlements as readonly string[],
      user.role,
    );
  }, [user]);

  const visibleKeys = new Set(visibleServices.map((s) => s.key));

  if (!user) return null;

  const showTrading = hasEntitlement("execution-basic");
  const showResearch = hasEntitlement("strategy-full");
  // Batch/live toggle is only meaningful for users with real-time data access
  const showBatchLiveToggle = showTrading || showResearch;

  return (
    <div className="bg-background">
      <main className="platform-page-width p-6 space-y-5">
        {/* ── Row 1: Header + Health ─────────────────────────────────── */}
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">
              {user.org.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {user.displayName} &middot;{" "}
              <span className="capitalize">{user.role}</span> &middot;{" "}
              {visibleServices.length} of {allServices.length} services
            </p>
          </div>
          <div className="flex items-center gap-3">
            <HealthBar />
            {/* Batch/Live mode indicator — only for users with real-time data */}
            {showBatchLiveToggle && (
              <button
                onClick={() => setMode(isLive ? "batch" : "live")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                  isLive
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-primary/30 bg-primary/10 text-primary",
                )}
              >
                {isLive ? (
                  <Radio className="size-3" />
                ) : (
                  <Database className="size-3" />
                )}
                {isLive ? "Live" : "Batch"}
              </button>
            )}
          </div>
        </div>

        {/* ── Row 2: Role-aware KPIs ────────────────────────────────── */}
        {/* Every user sees KPIs relevant to their entitlements. Data-only users
            see instruments + freshness. Research users see backtests + models.
            Trading users see P&L + positions + risk. Reports-only users see AUM. */}
        {kpis.length > 0 && (
          <div
            className={cn(
              "grid gap-3",
              kpis.length <= 3
                ? "grid-cols-1 sm:grid-cols-3"
                : kpis.length <= 4
                  ? "grid-cols-2 sm:grid-cols-4"
                  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
            )}
          >
            {kpis.map((kpi) => (
              <KPICard
                key={kpi.label}
                label={kpi.label}
                value={kpi.value}
                change={kpi.change}
                icon={kpi.icon}
                href={kpi.href}
                alert={kpi.alert}
                subtle={kpi.subtle}
              />
            ))}
          </div>
        )}

        {/* ── Row 3: Main content — services + sidebar ───────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
          {/* Left: Service Grid */}
          <div className="space-y-4">
            {/* Lifecycle breadcrumb */}
            <div className="flex items-center gap-1 text-[10px]">
              {PLATFORM_LIFECYCLE_STAGES.map((stage, i) => (
                <React.Fragment key={stage}>
                  {i > 0 && (
                    <ChevronRight className="size-2.5 text-muted-foreground/30" />
                  )}
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded",
                      PLATFORM_LIFECYCLE_CONFIG[stage].color,
                      "bg-current/5",
                    )}
                  >
                    {PLATFORM_LIFECYCLE_CONFIG[stage].label}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {/* Service cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allServices
                .filter((svc) =>
                  PLATFORM_LIFECYCLE_STAGES.includes(
                    svc.lifecycleStage as PlatformLifecycleStage,
                  ),
                )
                .map((svc) => {
                  const isLocked = !visibleKeys.has(svc.key);
                  return (
                    <ServiceCard
                      key={svc.key}
                      service={svc}
                      locked={isLocked}
                    />
                  );
                })}
            </div>
          </div>

          {/* Right: Activity + Quick Actions */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <QuickActions />
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Recent Activity
                  </CardTitle>
                  <Activity className="size-3 text-muted-foreground/40" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ActivityFeed maxItems={6} />
              </CardContent>
            </Card>

            {/* Batch/Live drift summary — only for trading users */}
            {showTrading && (
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Live vs Batch
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <DriftRow
                    label="Net P&L"
                    liveValue={142_380}
                    batchValue={138_920}
                  />
                  <DriftRow
                    label="Positions"
                    liveValue={47}
                    batchValue={45}
                    isCurrency={false}
                  />
                  <DriftRow
                    label="Risk Util."
                    liveValue={62}
                    batchValue={58}
                    isCurrency={false}
                    suffix="%"
                  />
                  <Link
                    href="/services/reports/reconciliation"
                    className="block text-[10px] text-primary hover:underline mt-2"
                  >
                    View full reconciliation
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  change,
  icon: Icon,
  href,
  alert,
  subtle,
}: {
  label: string;
  value: string;
  change?: number;
  icon: React.ElementType;
  href: string;
  alert?: boolean;
  subtle?: boolean;
}) {
  return (
    <Link href={href}>
      <Card
        className={cn(
          "hover:border-white/20 transition-colors cursor-pointer",
          alert && "border-[var(--status-warning)]/30",
        )}
      >
        <CardContent className="p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {label}
            </span>
            <Icon
              className={cn(
                "size-3.5",
                alert
                  ? "text-[var(--status-warning)]"
                  : subtle
                    ? "text-muted-foreground/40"
                    : "text-primary/60",
              )}
            />
          </div>
          <p
            className={cn(
              "text-lg font-semibold tabular-nums tracking-tight",
              subtle && "text-sm text-muted-foreground",
            )}
          >
            {value}
          </p>
          {change !== undefined && (
            <span
              className={cn(
                "text-[10px] font-medium",
                change >= 0
                  ? "text-[var(--pnl-positive)]"
                  : "text-[var(--pnl-negative)]",
              )}
            >
              {change >= 0 ? "+" : ""}
              {change.toFixed(1)}% today
            </span>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function ServiceCard({
  service,
  locked,
}: {
  service: ServiceDefinition;
  locked: boolean;
}) {
  const Icon =
    ICON_MAP[service.icon] ?? Database;
  const stageConfig =
    PLATFORM_LIFECYCLE_CONFIG[
      service.lifecycleStage as PlatformLifecycleStage
    ] ?? PLATFORM_LIFECYCLE_CONFIG.acquire;

  // Mock health — in production this comes from the API
  const health = React.useMemo(
    () =>
      locked
        ? "locked"
        : Math.random() > 0.9
          ? "degraded"
          : "healthy",
    [locked],
  );

  if (locked) {
    return (
      <Card className="border-dashed border-border/50 opacity-60">
        <CardContent className="p-4 flex gap-3">
          <div className="flex-shrink-0 mt-0.5 text-muted-foreground">
            <Lock className="size-4" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {service.label}
              </span>
              <Badge
                variant="outline"
                className="text-[8px] px-1 py-0 border-amber-500/30 text-amber-500"
              >
                Upgrade
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground/60 leading-relaxed line-clamp-2">
              {service.description}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href={service.href}>
      <Card className="group hover:border-white/20 transition-colors cursor-pointer h-full">
        <CardContent className="p-4 flex gap-3">
          <div className={cn("flex-shrink-0 mt-0.5", stageConfig.color)}>
            <Icon className="size-4" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium group-hover:text-white transition-colors">
                {service.label}
              </span>
              <span
                className={cn(
                  "text-[8px] uppercase tracking-wider",
                  stageConfig.color,
                )}
              >
                {stageConfig.label}
              </span>
              {/* Health dot */}
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={cn(
                        "size-1.5 rounded-full ml-auto flex-shrink-0",
                        health === "healthy"
                          ? "bg-emerald-500"
                          : health === "degraded"
                            ? "bg-yellow-500 animate-pulse"
                            : "bg-muted-foreground/30",
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {health === "healthy" ? "All systems operational" : "Degraded performance"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
              {service.description}
            </p>
          </div>
          <ChevronRight className="size-3.5 text-muted-foreground/20 group-hover:text-muted-foreground flex-shrink-0 mt-1 transition-colors" />
        </CardContent>
      </Card>
    </Link>
  );
}

function DriftRow({
  label,
  liveValue,
  batchValue,
  isCurrency = true,
  suffix = "",
}: {
  label: string;
  liveValue: number;
  batchValue: number;
  isCurrency?: boolean;
  suffix?: string;
}) {
  const delta = liveValue - batchValue;
  const percent = batchValue !== 0 ? (delta / Math.abs(batchValue)) * 100 : 0;

  const fmt = (v: number) => {
    if (isCurrency) {
      if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
      if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
      return `$${v.toFixed(0)}`;
    }
    return `${v}${suffix}`;
  };

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 font-mono">
        <span className="text-muted-foreground/60">{fmt(batchValue)}</span>
        <span className="text-muted-foreground/40">&rarr;</span>
        <span>{fmt(liveValue)}</span>
        <span
          className={cn(
            "text-[10px]",
            delta >= 0
              ? "text-[var(--pnl-positive)]"
              : "text-[var(--pnl-negative)]",
          )}
        >
          {delta >= 0 ? "+" : ""}
          {percent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
