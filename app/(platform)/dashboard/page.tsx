"use client";

import { QuickActions } from "@/components/platform/quick-actions";
import { StatusDot } from "@/components/shared/status-badge";
import {
  ServiceTile,
  mockServiceDegraded,
  type ServiceTileSubRouteChip,
} from "@/components/services/ServiceTile";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import type { Entitlement } from "@/lib/config/auth";
import type {
  DashboardTileId,
  ServiceDefinition,
} from "@/lib/config/services";
import {
  SERVICE_REGISTRY,
  getAccessibleSubRoutes,
  getVisibleServices,
} from "@/lib/config/services";
import {
  personaDashboardShape,
  personaDashboardSubRoutes,
} from "@/lib/auth/persona-dashboard-shape";
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

  // Resolve per-persona tile visibility from the dashboard shape. Tiles marked
  // "hidden" drop out entirely; "locked" / "visible" tiles both render (locked
  // tiles use the padlocked-visible ServiceTile variant via entitlementLocked).
  const tileShape = personaDashboardShape(user);
  const subRouteShape = personaDashboardSubRoutes(user);
  const allServices = SERVICE_REGISTRY.filter((svc) => {
    if (svc.internalOnly && user?.role !== "admin") return false;
    const vis = tileShape[svc.key as DashboardTileId];
    if (vis === "hidden") return false;
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
              {allServices.length} {allServices.length === 1 ? "service" : "services"}
            </>
          }
        />
        {/* 2026-04-21 — removed KPI grid, PlatformStateNarrative, SystemHealthStrip,
            HealthBar, Live/Batch toggle. All are DART-specific signals (backtest
            counts, net P&L, risk utilisation, alerts, system health, execution
            mode) and belong on DART observe / terminal surfaces — not on the
            services hub. /dashboard is the hub for navigating TO services, not
            for rendering DART summaries. */}

        {/* ── Your Access — explains what the user sees and why ── */}
        {user.role === "client" && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border/50 bg-muted/20 text-xs text-muted-foreground">
            <Shield className="size-4 shrink-0 text-primary/50" />
            <span>
              <strong className="text-foreground/80">{user.org.name}</strong> has access to{" "}
              <strong className="text-foreground/80">{allServices.length} {allServices.length === 1 ? "service" : "services"}</strong> across{" "}
              {visibleStages.length} lifecycle {visibleStages.length === 1 ? "stage" : "stages"}.
            </span>
          </div>
        )}

        {/* ── Row 3: Main content — services + sidebar ───────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
          {/* Left: Service Grid.  2026-04-21 — removed lifecycle breadcrumb
              ("Data > Research > Promote > DART > Observe > Manage > Reports")
              — 8-stage strip contradicts the 4-stage collapse, adds visual
              noise on the services hub, and duplicates what the top-nav
              already exposes. */}
          <div className="space-y-4">
            {/* Service cards — 5 top-level tiles (post 2026-04-21 collapse).
                Tile visibility resolved against persona-dashboard-shape; sub-
                route chips pre-filtered by entitlement + persona sub-route
                shape. Folded-away keys (data / research / promote / observe /
                strategy-catalogue) now live as DART sub-routes, not tiles. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allServices.map((svc) => {
                const entitlementLocked = !visibleKeys.has(svc.key);
                const tileId = svc.key as DashboardTileId;
                const chipVis = subRouteShape[tileId] ?? {};
                // Sub-routes: start from entitlement-filtered set, then apply
                // persona visibility (hidden → drop, locked → keep with
                // locked=true chip).
                const accessible = getAccessibleSubRoutes(
                  svc,
                  user.entitlements as readonly string[],
                  user.role,
                );
                const chips: ServiceTileSubRouteChip[] = accessible
                  .filter((sub) => chipVis[sub.key] !== "hidden")
                  .map((sub) => ({
                    key: sub.key,
                    label: sub.label,
                    href: sub.href,
                    icon: sub.icon,
                    locked: sub.locked || chipVis[sub.key] === "locked",
                  }));
                return (
                  <ServiceCardWrapper
                    key={svc.key}
                    service={svc}
                    entitlementLocked={entitlementLocked}
                    isLive={isLive}
                    subRoutes={chips}
                    personaId={user.id}
                  />
                );
              })}
            </div>
          </div>

          {/* Right: Quick Actions only. 2026-04-21 — removed
              WorkflowContinuity ("Continue where you left off"), ActivityFeed
              ("Recent Activity"), and Live-vs-Batch drift summary. All three
              are DART-specific (training runs / strategy candidates / open
              positions / risk alerts / backtest events / P&L comparisons) and
              belong inside DART observe / terminal / reports surfaces — not on
              the services hub. Quick Actions stays because it's cross-cutting
              navigation (Manage Users, System Health, Audit Log, Deployments,
              Configuration, Trading) — shortcuts into admin + ops. */}
          <div className="space-y-4">
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

function useServiceQuickStat(key: string, isLive: boolean, personaId?: string): string | undefined {
  return React.useMemo(() => {
    // Signals-In personas see a signal-centric stat on the DART tile, not the
    // generic P&L. Post 2026-04-21 collapse — DART tile swallows Research /
    // Promote / Observe / Strategy Catalogue surfaces, so the quick-stat
    // headline depends on the persona's primary DART sub-route.
    if (key === "dart" && personaId === "prospect-signals-only") {
      return isLive ? "2 active signals · 14 today" : "Signals replay ready";
    }
    if (key === "dart" && personaId === "client-data-only") {
      return "2,400+ instruments · Strategy catalogue";
    }
    const stats: Record<string, string> = {
      dart: isLive ? "$142K P&L · 47 positions · 3 alerts" : "$139K batch P&L · 38 backtests",
      "odum-signals": "12 counterparties · 284 emissions today",
      reports: "12 reports this month",
      "investor-relations": "Next board: May 15",
      admin: "42 users · 8 orgs",
    };
    return stats[key];
  }, [key, isLive, personaId]);
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
  subRoutes,
  personaId,
}: {
  service: ServiceDefinition;
  entitlementLocked: boolean;
  isLive: boolean;
  subRoutes?: readonly ServiceTileSubRouteChip[];
  personaId?: string;
}) {
  const profileLockState = useTileLockState(service.key);
  const resolvedLockState: TileLockState =
    profileLockState !== "unlocked"
      ? profileLockState
      : entitlementLocked
        ? "padlocked-visible"
        : "unlocked";

  const quickStat = useServiceQuickStat(service.key, isLive, personaId);
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
      subRoutes={subRoutes}
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
