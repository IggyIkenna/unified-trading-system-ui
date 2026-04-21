"use client";

import { ActivityFeed } from "@/components/platform/activity-feed";
import { QuickActions } from "@/components/platform/quick-actions";
import { StatusDot } from "@/components/shared/status-badge";
import {
  ServiceTile,
  mockServiceDegraded,
} from "@/components/services/ServiceTile";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import type { Entitlement } from "@/lib/config/auth";
import type { ServiceDefinition } from "@/lib/config/services";
import { SERVICE_REGISTRY, getVisibleServices } from "@/lib/config/services";
import { useExecutionMode } from "@/lib/execution-mode-context";
import { PLATFORM_LIFECYCLE_CONFIG, PLATFORM_LIFECYCLE_STAGES, type PlatformLifecycleStage } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";
import { useTileLockState } from "@/lib/visibility/use-tile-lock-state";
import type { TileLockState } from "@/lib/visibility/tile-lock-state";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  ChevronRight,
  Clock,
  Database,
  DollarSign,
  FileText,
  FlaskConical,
  Shield,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { mock01 } from "@/lib/mocks/generators/deterministic";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

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

function useRoleKPIs(hasEntitlement: (e: Entitlement) => boolean, isLive: boolean): KPIDef[] {
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
    if (hasEntitlement("reporting") && !hasEntitlement("execution-basic")) {
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
  const { isLive } = useExecutionMode();
  const kpis = useRoleKPIs(hasEntitlement, isLive);

  const allServices = SERVICE_REGISTRY.filter((svc) => {
    if (svc.internalOnly && user?.role !== "admin") return false;
    return true;
  });

  const visibleServices = React.useMemo(() => {
    if (!user) return [];
    return getVisibleServices(user.entitlements as readonly string[], user.role);
  }, [user]);

  const visibleKeys = new Set(visibleServices.map((s) => s.key));

  const showData = hasEntitlement("data-basic") || hasEntitlement("data-pro");
  const showResearch = hasEntitlement("strategy-full") || hasEntitlement("ml-full");
  const showTrading = hasEntitlement("execution-basic") || hasEntitlement("execution-full");
  const showReporting = hasEntitlement("reporting");
  const visibleStages = React.useMemo(() => {
    if (!user) return [];
    const stages: PlatformLifecycleStage[] = [];
    if (showData) stages.push("acquire");
    if (showResearch) stages.push("build", "promote");
    if (showTrading) stages.push("run", "observe");
    if (showReporting || isAdmin() || isInternal()) stages.push("manage", "report");
    if (isAdmin() || isInternal()) return PLATFORM_LIFECYCLE_STAGES.slice();
    return stages;
  }, [user, showData, showResearch, showTrading, showReporting, isAdmin, isInternal]);

  const visibleActivityLabels = React.useMemo(
    () => visibleStages.map((s) => PLATFORM_LIFECYCLE_CONFIG[s].label),
    [visibleStages],
  );

  if (!user) return null;

  return (
    <div className="bg-background">
      <main className="platform-page-width p-6 space-y-5">
        {/* ── Row 1: Header + Health ─────────────────────────────────── */}
        <PageHeader
          title={user.org.name}
          description={
            <>
              {user.displayName} &middot; <span className="capitalize">{user.role}</span> &middot;{" "}
              {visibleServices.length} of {allServices.length} services
            </>
          }
        />
        {/* HealthBar + Live/Batch toggle removed 2026-04-21 — DART-only.
            System health belongs on DART observability surfaces (terminal /
            observe sub-tabs). Live/Batch mode is a DART execution concern.
            Neither is relevant on /dashboard (the services hub). */}

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

        {/* ── Row 2.5: Platform state narrative — explains everything in 20 seconds ── */}
        <PlatformStateNarrative
          kpis={kpis}
          visibleServices={visibleServices}
          allServices={allServices}
          isLive={isLive}
          showTrading={showTrading}
          showResearch={showResearch}
          showReporting={showReporting}
        />

        {/* ── Row 2.6: System health summary strip ──────────────────── */}
        <SystemHealthStrip services={allServices} visibleKeys={visibleKeys} />

        {/* ── Row 2.7: Your Access — explains what the user sees and why ── */}
        {user.role === "client" && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border/50 bg-muted/20 text-xs text-muted-foreground">
            <Shield className="size-4 shrink-0 text-primary/50" />
            <span>
              <strong className="text-foreground/80">{user.org.name}</strong> has access to{" "}
              <strong className="text-foreground/80">{visibleServices.length} services</strong> across{" "}
              {visibleStages.length} lifecycle stages.
              {allServices.length - visibleServices.length > 0 && (
                <>
                  {" "}
                  {allServices.length - visibleServices.length} additional service{allServices.length - visibleServices.length > 1 ? "s are" : " is"} available on upgrade.
                </>
              )}
            </span>
          </div>
        )}

        {/* ── Row 3: Main content — services + sidebar ───────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
          {/* Left: Service Grid */}
          <div className="space-y-4">
            {/* Lifecycle breadcrumb — only shows stages the user can access */}
            <div className="flex items-center gap-1 text-[10px]">
              {visibleStages.map((stage, i) => (
                <React.Fragment key={stage}>
                  {i > 0 && <ChevronRight className="size-2.5 text-muted-foreground/30" />}
                  <span className={cn("px-1.5 py-0.5 rounded", PLATFORM_LIFECYCLE_CONFIG[stage].color, "bg-current/5")}>
                    {PLATFORM_LIFECYCLE_CONFIG[stage].label}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {/* Service cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allServices
                .filter((svc) => PLATFORM_LIFECYCLE_STAGES.includes(svc.lifecycleStage as PlatformLifecycleStage))
                .map((svc) => {
                  const entitlementLocked = !visibleKeys.has(svc.key);
                  return (
                    <ServiceCardWrapper
                      key={svc.key}
                      service={svc}
                      entitlementLocked={entitlementLocked}
                      isLive={isLive}
                    />
                  );
                })}
            </div>
          </div>

          {/* Right: Activity + Quick Actions */}
          <div className="space-y-4">
            {/* Continue where you left off */}
            <WorkflowContinuity
              showResearch={showResearch}
              showTrading={showTrading}
              showReporting={showReporting}
            />

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
                <ActivityFeed maxItems={6} visibleStages={visibleActivityLabels} />
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
                  <DriftRow label="Net P&L" liveValue={142_380} batchValue={138_920} />
                  <DriftRow label="Positions" liveValue={47} batchValue={45} isCurrency={false} />
                  <DriftRow label="Risk Util." liveValue={62} batchValue={58} isCurrency={false} suffix="%" />
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
          "hover:border-white/20 transition-colors cursor-pointer border-border/50 bg-gradient-to-br from-background to-muted/10",
          alert && "border-[var(--status-warning)]/30",
        )}
      >
        <CardContent className="pt-5 pb-4 px-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
            <Icon
              className={cn(
                "size-3.5",
                alert ? "text-[var(--status-warning)]" : subtle ? "text-muted-foreground/40" : "text-primary/60",
              )}
            />
          </div>
          <p
            className={cn(
              "text-2xl font-semibold tabular-nums tracking-tight font-mono",
              subtle && "text-sm text-muted-foreground",
            )}
          >
            {value}
          </p>
          {change !== undefined && (
            <span
              className={cn(
                "text-[10px] font-medium",
                change >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]",
              )}
            >
              {change >= 0 ? "+" : ""}
              {formatPercent(change, 1)} today
            </span>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function serviceKeySalt(key: string): number {
  return [...key].reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

// ─── Quick stat generators (mock — production uses API) ──────────────────────

function useServiceQuickStat(key: string, isLive: boolean): string | undefined {
  return React.useMemo(() => {
    const stats: Record<string, string> = {
      data: "2,400+ instruments",
      research: "38 backtests, 6 models",
      promote: "3 candidates pending",
      trading: isLive ? "$142K P&L today" : "$139K batch P&L",
      observe: isLive ? "3 active alerts" : "No alerts",
      reports: "12 reports this month",
      "investor-relations": "Next board: May 15",
      admin: "42 users, 8 orgs",
    };
    return stats[key];
  }, [key, isLive]);
}

/**
 * Wrapper that resolves the three-state `lockState` for a service tile and
 * delegates rendering to the shared `<ServiceTile>` primitive (G1.3).
 *
 * Two lock-signals feed in today:
 *   1. `entitlementLocked` — derived from `getVisibleServices()` (true when
 *      the user lacks any required entitlement). Renders as `padlocked-visible`
 *      — shows the tile with a lock affordance and CTA copy.
 *   2. `useTileLockState(key)` — stub hook reserved for the restriction-profile
 *      engine (Refactor G1.7). Once wired, the engine's output overrides the
 *      entitlement-derived default (e.g. a demo profile may force
 *      `padlocked-visible` even for entitlements the admin backend grants).
 *
 * The merge rule today: if the profile hook returns anything other than
 * `"unlocked"`, it wins; otherwise fall back to the entitlement-locked default.
 * This is deliberately a stub: G1.7 owns the real fan-in.
 */
function ServiceCardWrapper({
  service,
  entitlementLocked,
  isLive,
}: {
  service: ServiceDefinition;
  entitlementLocked: boolean;
  isLive: boolean;
}) {
  const profileLockState = useTileLockState(service.key);
  const resolvedLockState: TileLockState =
    profileLockState !== "unlocked"
      ? profileLockState
      : entitlementLocked
        ? "padlocked-visible"
        : "unlocked";

  const quickStat = useServiceQuickStat(service.key, isLive);
  const degraded = React.useMemo(
    () => (resolvedLockState === "unlocked" ? mockServiceDegraded(service.key) : false),
    [resolvedLockState, service.key],
  );

  return (
    <ServiceTile
      service={service}
      lockState={resolvedLockState}
      quickStat={quickStat}
      degraded={degraded}
    />
  );
}

// ─── System Health Strip ─────────────────────────────────────────────────────

function SystemHealthStrip({
  services,
  visibleKeys,
}: {
  services: ServiceDefinition[];
  visibleKeys: Set<string>;
}) {
  const accessible = services.filter((s) => visibleKeys.has(s.key));
  const healthCounts = React.useMemo(() => {
    let healthy = 0;
    let degraded = 0;
    for (const svc of accessible) {
      const isDegraded = mock01(serviceKeySalt(svc.key), 701) > 0.9;
      if (isDegraded) degraded++;
      else healthy++;
    }
    return { healthy, degraded, total: accessible.length };
  }, [accessible]);

  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-lg border border-border/50 bg-muted/10 text-xs">
      <div className="flex items-center gap-1.5">
        <StatusDot status="live" className="size-1.5" />
        <span className="text-muted-foreground">
          <strong className="text-foreground">{healthCounts.healthy}</strong> healthy
        </span>
      </div>
      {healthCounts.degraded > 0 && (
        <div className="flex items-center gap-1.5">
          <StatusDot status="in_progress" className="size-1.5 animate-pulse" />
          <span className="text-amber-400">
            <strong>{healthCounts.degraded}</strong> degraded
          </span>
        </div>
      )}
      <span className="text-muted-foreground/50">|</span>
      <span className="text-muted-foreground">
        {healthCounts.total} services monitored
      </span>
    </div>
  );
}

// ─── Workflow Continuity ─────────────────────────────────────────────────────

function WorkflowContinuity({
  showResearch,
  showTrading,
  showReporting,
}: {
  showResearch: boolean;
  showTrading: boolean;
  showReporting: boolean;
}) {
  const items = React.useMemo(() => {
    const entries: { label: string; detail: string; href: string; icon: React.ElementType }[] = [];
    if (showResearch) {
      entries.push({
        label: "Training Run",
        detail: "BTC direction v4 — Epoch 38/50",
        href: "/services/research/ml/training",
        icon: Brain,
      });
      entries.push({
        label: "Strategy Candidates",
        detail: "3 pending review",
        href: "/services/research/strategy/candidates",
        icon: FlaskConical,
      });
    }
    if (showTrading) {
      entries.push({
        label: "Open Positions",
        detail: "47 positions, 62% risk util.",
        href: "/services/trading/positions",
        icon: BarChart3,
      });
    }
    if (showReporting) {
      entries.push({
        label: "Monthly Report",
        detail: "Draft — due May 5",
        href: "/services/reports/overview",
        icon: FileText,
      });
    }
    return entries;
  }, [showResearch, showTrading, showReporting]);

  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Continue where you left off
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-1">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="flex items-center gap-2.5 py-1.5 px-1 rounded hover:bg-muted/30 transition-colors group">
              <item.icon className="size-3.5 text-muted-foreground/50 group-hover:text-primary/70 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium group-hover:text-white transition-colors">{item.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{item.detail}</p>
              </div>
              <ChevronRight className="size-3 text-muted-foreground/20 group-hover:text-muted-foreground shrink-0" />
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function PlatformStateNarrative({
  kpis,
  visibleServices,
  allServices,
  isLive,
  showTrading,
  showResearch,
  showReporting,
}: {
  kpis: KPIDef[];
  visibleServices: ServiceDefinition[];
  allServices: ServiceDefinition[];
  isLive: boolean;
  showTrading: boolean;
  showResearch: boolean;
  showReporting: boolean;
}) {
  // Extract key numbers from KPIs
  const pnlKpi = kpis.find((k) => k.label === "Net P&L");
  const positionsKpi = kpis.find((k) => k.label === "Positions");
  const riskKpi = kpis.find((k) => k.label === "Risk Util.");
  const alertsKpi = kpis.find((k) => k.label === "Alerts");
  const modelsKpi = kpis.find((k) => k.label === "Models");
  const backtestsKpi = kpis.find((k) => k.label === "Backtests");

  const segments: string[] = [];

  if (showTrading && pnlKpi) {
    segments.push(
      `${isLive ? "Live" : "Batch"} P&L ${pnlKpi.value} across ${positionsKpi?.value ?? "—"} positions at ${riskKpi?.value ?? "—"} risk utilization`,
    );
  }
  if (showTrading && alertsKpi && alertsKpi.value !== "0") {
    segments.push(`${alertsKpi.value} active alert${alertsKpi.value !== "1" ? "s" : ""} requiring attention`);
  }
  if (showResearch) {
    const parts = [];
    if (modelsKpi) parts.push(modelsKpi.value);
    if (backtestsKpi) parts.push(`${backtestsKpi.value} backtests`);
    if (parts.length > 0) segments.push(`Research: ${parts.join(", ")}`);
  }
  if (showReporting) {
    const aumKpi = kpis.find((k) => k.label === "AUM");
    if (aumKpi) segments.push(`AUM ${aumKpi.value}`);
  }

  segments.push(`${visibleServices.length} services operational`);

  if (segments.length === 0) return null;

  return (
    <div className="px-4 py-3 rounded-lg border border-border/30 bg-muted/5">
      <p className="text-xs text-muted-foreground leading-relaxed">
        <span className="font-medium text-foreground/80">Platform Status</span> —{" "}
        {segments.join(". ")}.
      </p>
    </div>
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
      if (Math.abs(v) >= 1_000_000) return `$${formatNumber(v / 1_000_000, 1)}M`;
      if (Math.abs(v) >= 1_000) return `$${formatNumber(v / 1_000, 1)}K`;
      return `$${formatNumber(v, 0)}`;
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
        <span className={cn("text-[10px]", delta >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]")}>
          {delta >= 0 ? "+" : ""}
          {formatPercent(percent, 1)}
        </span>
      </div>
    </div>
  );
}
