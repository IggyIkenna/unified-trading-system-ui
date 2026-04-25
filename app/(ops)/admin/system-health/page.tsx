"use client";

/**
 * /admin/system-health — canonical operator view of the 67-service fleet.
 *
 * Why this exists: `/health` is a probe endpoint consumed by k8s / Cloud Run;
 * humans still need a dense at-a-glance view of every service × environment.
 * This page collapses that into four orthogonal axes:
 *
 *   1. Health  — live / degraded / down / unknown
 *   2. Tier    — runtime tier 0 | 1 | 2 | 3 (from runtime-tiers-and-deployment.md)
 *   3. Mode    — preset (ci | mock | api-real | real) or raw 5-axis badges
 *   4. Env     — dev / staging / production
 *
 * Admin + internal-trader only (internalOnly tile; extra runtime gate below).
 *
 * MVP: data is locally-mocked from lib/config/system-health-services.ts.
 * Follow-up: wire `/api/v1/services/system-health` aggregator in deployment-api
 * that queries each service's /health and merges with deployment-api runtime
 * config — then swap the mock hook for the real one.
 */

import * as React from "react";
import { redirect } from "next/navigation";
import { Activity, AlertTriangle, CheckCircle2, HeartPulse, RefreshCw, ShieldAlert, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  SYSTEM_HEALTH_DOMAIN_LABELS,
  SYSTEM_HEALTH_SERVICES,
  type ServiceDomain,
  type ServiceTier,
  type SystemHealthService,
} from "@/lib/config/system-health-services";

type HealthStatus = "live" | "degraded" | "down" | "unknown";
type EnvName = "dev" | "staging" | "production";
type ModePreset = "ci" | "mock" | "api-real" | "real";

interface ModeAxisState {
  preset: ModePreset;
  uiData: "mock" | "real";
  uiAuth: "mock" | "real";
  apiData: "mock" | "real";
  apiAuth: "mock" | "real";
  mockState: "interactive" | "deterministic";
}

interface SystemHealthRow extends SystemHealthService {
  status: HealthStatus;
  mode: ModeAxisState;
  env: EnvName;
  lastDeployedAt: string;
  owner: string;
}

function modePreset(preset: ModePreset): ModeAxisState {
  switch (preset) {
    case "ci":
      return {
        preset,
        uiData: "mock",
        uiAuth: "mock",
        apiData: "mock",
        apiAuth: "mock",
        mockState: "deterministic",
      };
    case "mock":
      return {
        preset,
        uiData: "mock",
        uiAuth: "mock",
        apiData: "mock",
        apiAuth: "mock",
        mockState: "interactive",
      };
    case "api-real":
      return {
        preset,
        uiData: "mock",
        uiAuth: "mock",
        apiData: "real",
        apiAuth: "real",
        mockState: "interactive",
      };
    case "real":
      return {
        preset,
        uiData: "real",
        uiAuth: "real",
        apiData: "real",
        apiAuth: "real",
        mockState: "deterministic",
      };
  }
}

/**
 * Deterministic mock — stable hash over service key so filter/sort UX is
 * reproducible. Replace with real data once `/api/v1/services/system-health`
 * ships. Tracked as follow-up memory item.
 */
function mockRow(svc: SystemHealthService): SystemHealthRow {
  const hash = Array.from(svc.key).reduce((acc, ch) => (acc + ch.charCodeAt(0)) % 997, 0);
  const statusBuckets: HealthStatus[] = [
    "live",
    "live",
    "live",
    "live",
    "live",
    "live",
    "degraded",
    "degraded",
    "down",
    "unknown",
  ];
  const status = statusBuckets[hash % statusBuckets.length];
  const modePresets: ModePreset[] = ["mock", "mock", "api-real", "real", "real"];
  const preset = modePresets[hash % modePresets.length];
  const envs: EnvName[] = ["dev", "dev", "staging", "production"];
  const env = envs[hash % envs.length];
  const days = hash % 28;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return {
    ...svc,
    status,
    mode: modePreset(preset),
    env,
    lastDeployedAt: d.toISOString(),
    owner: svc.domain === "core" ? "platform" : svc.domain,
  };
}

const STATUS_STYLE: Record<
  HealthStatus,
  { label: string; className: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  live: {
    label: "Live",
    className: "bg-emerald-600/15 text-emerald-400 border-emerald-600/20",
    Icon: CheckCircle2,
  },
  degraded: {
    label: "Degraded",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    Icon: AlertTriangle,
  },
  down: {
    label: "Down",
    className: "bg-red-500/15 text-red-400 border-red-500/20",
    Icon: XCircle,
  },
  unknown: {
    label: "Unknown",
    className: "bg-muted text-muted-foreground border-border",
    Icon: ShieldAlert,
  },
};

const TIER_STYLE: Record<ServiceTier, string> = {
  0: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  1: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  2: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  3: "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20",
};

const ENV_STYLE: Record<EnvName, string> = {
  dev: "bg-slate-500/15 text-slate-300 border-slate-500/20",
  staging: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  production: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
};

function StatusBadge({ status }: { status: HealthStatus }) {
  const s = STATUS_STYLE[status];
  const { Icon } = s;
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", s.className)}>
      <Icon className="size-3" />
      {s.label}
    </Badge>
  );
}

function TierBadge({ tier }: { tier: ServiceTier }) {
  return (
    <Badge variant="outline" className={cn("font-mono text-xs", TIER_STYLE[tier])}>
      T{tier}
    </Badge>
  );
}

function EnvBadge({ env }: { env: EnvName }) {
  return (
    <Badge variant="outline" className={cn("text-xs capitalize", ENV_STYLE[env])}>
      {env}
    </Badge>
  );
}

function ModeBadge({ mode }: { mode: ModeAxisState }) {
  const label = mode.preset;
  const tooltip = [
    `UI data: ${mode.uiData}`,
    `UI auth: ${mode.uiAuth}`,
    `API data: ${mode.apiData}`,
    `API auth: ${mode.apiAuth}`,
    `Mock state: ${mode.mockState}`,
  ].join(" · ");
  const presetColor =
    label === "real"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
      : label === "api-real"
        ? "bg-amber-500/15 text-amber-300 border-amber-500/20"
        : label === "ci"
          ? "bg-blue-500/15 text-blue-300 border-blue-500/20"
          : "bg-slate-500/15 text-slate-300 border-slate-500/20";
  return (
    <Badge variant="outline" className={cn("font-mono text-xs", presetColor)} title={tooltip}>
      {label}
    </Badge>
  );
}

const DOMAIN_ORDER: readonly ServiceDomain[] = ["core", "sports", "cefi", "tradfi", "defi", "prediction", "ui"];

export default function SystemHealthPage() {
  const { user, isAdmin, isInternal } = useAuth();
  const [search, setSearch] = React.useState("");
  const [domainFilter, setDomainFilter] = React.useState<Set<ServiceDomain>>(new Set(DOMAIN_ORDER));
  const [statusFilter, setStatusFilter] = React.useState<Set<HealthStatus>>(
    new Set(["live", "degraded", "down", "unknown"]),
  );
  const [tierFilter, setTierFilter] = React.useState<Set<ServiceTier>>(new Set([0, 1, 2, 3]));
  const [envFilter, setEnvFilter] = React.useState<Set<EnvName>>(new Set(["dev", "staging", "production"]));
  const [refreshedAt, setRefreshedAt] = React.useState<string>(new Date().toLocaleTimeString());

  // Runtime gate — admin or internal role only.
  if (user && !(isAdmin() || isInternal())) {
    redirect("/dashboard");
  }

  const rows: readonly SystemHealthRow[] = React.useMemo(() => SYSTEM_HEALTH_SERVICES.map(mockRow), []);

  const summary = React.useMemo(() => {
    const s = { live: 0, degraded: 0, down: 0, unknown: 0 };
    for (const r of rows) s[r.status] += 1;
    return s;
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (!domainFilter.has(r.domain)) return false;
      if (!statusFilter.has(r.status)) return false;
      if (!tierFilter.has(r.tier)) return false;
      if (!envFilter.has(r.env)) return false;
      if (!q) return true;
      return r.label.toLowerCase().includes(q) || r.key.toLowerCase().includes(q);
    });
  }, [rows, search, domainFilter, statusFilter, tierFilter, envFilter]);

  const byDomain = React.useMemo(() => {
    const map = new Map<ServiceDomain, SystemHealthRow[]>();
    for (const domain of DOMAIN_ORDER) map.set(domain, []);
    for (const r of filteredRows) {
      const list = map.get(r.domain);
      if (list) list.push(r);
    }
    return map;
  }, [filteredRows]);

  function toggle<T>(set: Set<T>, value: T, setter: (next: Set<T>) => void): void {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  function handleRefresh(): void {
    // Mock refresh — flips timestamp. Real hook should invalidate the query.
    setRefreshedAt(new Date().toLocaleTimeString());
  }

  return (
    <div className="px-6 py-6 space-y-6">
      <PageHeader
        title="System Health"
        description={
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <HeartPulse className="size-3" />
            67-service fleet · refreshed {refreshedAt}
          </span>
        }
      >
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="size-4 mr-2" />
          Refresh
        </Button>
      </PageHeader>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Live</span>
              <CheckCircle2 className="size-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-mono font-bold text-emerald-300">
              {summary.live}
              <span className="text-sm text-muted-foreground font-normal"> / {rows.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Degraded</span>
              <AlertTriangle className="size-4 text-amber-400" />
            </div>
            <div className="text-2xl font-mono font-bold text-amber-300">{summary.degraded}</div>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Down</span>
              <XCircle className="size-4 text-red-400" />
            </div>
            <div className="text-2xl font-mono font-bold text-red-300">{summary.down}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Unknown</span>
              <ShieldAlert className="size-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-mono font-bold">{summary.unknown}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by service name or key"
            className="max-w-md"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide mr-1">Domain</span>
            {DOMAIN_ORDER.map((d) => {
              const active = domainFilter.has(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggle(domainFilter, d, setDomainFilter)}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded border transition-colors",
                    active
                      ? "bg-primary/15 border-primary/30 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {SYSTEM_HEALTH_DOMAIN_LABELS[d]}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide mr-1">Status</span>
            {(["live", "degraded", "down", "unknown"] as HealthStatus[]).map((s) => {
              const active = statusFilter.has(s);
              const meta = STATUS_STYLE[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(statusFilter, s, setStatusFilter)}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded border transition-colors",
                    active ? meta.className : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide mr-1">Tier</span>
            {([0, 1, 2, 3] as ServiceTier[]).map((t) => {
              const active = tierFilter.has(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggle(tierFilter, t, setTierFilter)}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded border font-mono transition-colors",
                    active ? TIER_STYLE[t] : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  T{t}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide mr-1">Environment</span>
            {(["dev", "staging", "production"] as EnvName[]).map((e) => {
              const active = envFilter.has(e);
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() => toggle(envFilter, e, setEnvFilter)}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded border capitalize transition-colors",
                    active ? ENV_STYLE[e] : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {e}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Per-domain table groups */}
      {DOMAIN_ORDER.map((domain) => {
        const domainRows = byDomain.get(domain) ?? [];
        if (domainRows.length === 0) return null;
        return (
          <Card key={domain}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="size-4 text-muted-foreground" />
                  {SYSTEM_HEALTH_DOMAIN_LABELS[domain]}
                  <Badge variant="secondary" className="text-[10px]">
                    {domainRows.length}
                  </Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[28%]">Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Environment</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead className="text-right">Last deploy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domainRows.map((r) => (
                    <TableRow key={r.key}>
                      <TableCell className="align-top">
                        <div className="font-medium">{r.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 font-mono">{r.key}</div>
                        <div className="text-xs text-muted-foreground mt-1">{r.description}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell>
                        <TierBadge tier={r.tier} />
                      </TableCell>
                      <TableCell>
                        <ModeBadge mode={r.mode} />
                      </TableCell>
                      <TableCell>
                        <EnvBadge env={r.env} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.owner}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(r.lastDeployedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {filteredRows.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No services match the current filters.
          </CardContent>
        </Card>
      )}

      <p className="text-[11px] text-muted-foreground">
        Status data is currently mocked client-side. Follow-up: wire{" "}
        <code className="font-mono">/api/v1/services/system-health</code> aggregator in{" "}
        <code className="font-mono">deployment-api</code> that merges each service&apos;s{" "}
        <code className="font-mono">/health</code> probe with runtime config.
      </p>
    </div>
  );
}
