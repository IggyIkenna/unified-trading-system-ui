"use client";

import { PageHeader } from "@/components/shared/page-header";
import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  Users,
  DollarSign,
  Shield,
  Clock,
  ArrowRight,
  Plus,
  CreditCard,
  FileText,
  Activity,
  BarChart3,
  Server,
  Heart,
  CheckCircle2,
  Inbox,
  Download,
} from "lucide-react";
import { exportTableToCsv, exportTableToXlsx, type ExportColumn } from "@/lib/utils/export";
import { AuditDashboard } from "@/components/dashboards/audit-dashboard";
import { useOrganizationsList } from "@/hooks/api/use-organizations";
import { useAuditEvents } from "@/hooks/api/use-audit";
import { useServiceHealth } from "@/hooks/api/use-service-status";
import { useStrategyPerformance } from "@/hooks/api/use-strategies";
import { usePositionsSummary } from "@/hooks/api/use-positions";
import { formatNumber } from "@/lib/utils/formatters";
import { ApiError } from "@/components/shared/api-error";

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const ACTION_ICONS: Record<string, string> = {
  "role.changed": "Role",
  "org.created": "Org",
  "user.invited": "Invite",
  "subscription.upgraded": "Sub",
  "fee.updated": "Fee",
  "api_key.rotated": "Key",
  "user.suspended": "User",
  "strategy.promoted": "Promo",
  "config.changed": "Config",
  "deployment.completed": "Deploy",
};

interface AuditEvent {
  id: string;
  type: string;
  entity: string;
  actor: string;
  timestamp: string;
  details: string;
  org?: string;
}

interface ServiceHealthEntry {
  service: string;
  status: "healthy" | "degraded" | "unhealthy";
}

interface StrategyEntry {
  id: string;
  status: string;
}

interface PositionsSummaryData {
  totalAum?: number;
  total_notional?: number;
}

interface PendingApproval {
  id: string;
  type: string;
  description: string;
  requestedBy: string;
  requestedAt: string;
}

export default function AdminDashboardPage() {
  const {
    data: orgsData,
    isLoading: orgsLoading,
    isError: orgsIsError,
    error: orgsError,
    refetch: refetchOrgs,
  } = useOrganizationsList();
  const {
    data: eventsData,
    isLoading: eventsLoading,
    isError: eventsIsError,
    error: eventsError,
    refetch: refetchEvents,
  } = useAuditEvents();
  const {
    data: healthData,
    isLoading: healthLoading,
    isError: healthIsError,
    error: healthError,
    refetch: refetchHealth,
  } = useServiceHealth();
  const {
    data: strategyData,
    isLoading: strategyLoading,
    isError: strategyIsError,
    error: strategyError,
    refetch: refetchStrategy,
  } = useStrategyPerformance();
  const {
    data: positionsData,
    isLoading: positionsLoading,
    isError: positionsIsError,
    error: positionsError,
    refetch: refetchPositions,
  } = usePositionsSummary();

  const isLoading = orgsLoading || eventsLoading || healthLoading || strategyLoading || positionsLoading;
  const dashboardError = (orgsError ?? eventsError ?? healthError ?? strategyError ?? positionsError) as Error | null;
  const hasDashboardError = orgsIsError || eventsIsError || healthIsError || strategyIsError || positionsIsError;

  const refetchDashboard = () => {
    void refetchOrgs();
    void refetchEvents();
    void refetchHealth();
    void refetchStrategy();
    void refetchPositions();
  };

  const orgs: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    memberCount: number;
    subscriptionTier: string;
    monthlyFee?: number;
  }> = ((orgsData as Record<string, unknown>)?.organizations as typeof orgs) ?? [];
  const events: AuditEvent[] = ((eventsData as Record<string, unknown>)?.events as AuditEvent[]) ?? [];
  const services: ServiceHealthEntry[] =
    ((healthData as Record<string, unknown>)?.services as ServiceHealthEntry[]) ?? [];
  const strategies: StrategyEntry[] = ((strategyData as Record<string, unknown>)?.strategies as StrategyEntry[]) ?? [];
  const posSummary = positionsData as PositionsSummaryData | undefined;
  const pendingApprovals: PendingApproval[] =
    ((eventsData as Record<string, unknown>)?.pendingApprovals as PendingApproval[]) ?? [];

  const activityExportColumns: ExportColumn[] = [
    { key: "type", header: "Type" },
    { key: "actor", header: "Actor" },
    { key: "details", header: "Details" },
    { key: "entity", header: "Entity" },
    { key: "org", header: "Organization" },
    { key: "timestamp", header: "Timestamp", format: "date" },
  ];

  const totalUsers = orgs.reduce((sum: number, o) => sum + (o.memberCount ?? 0), 0);
  const activeOrgs = orgs.filter((o) => o.status === "active").length;
  const mrr = orgs.reduce((sum: number, o) => sum + (o.monthlyFee ?? 0), 0);

  // Derived metrics
  const totalStrategies = strategies.length;
  const totalAum =
    posSummary?.totalAum ??
    posSummary?.total_notional ??
    ((strategies as unknown as Array<{ nav?: number }>).reduce((sum, s) => sum + (s.nav ?? 0), 0) ||
      (((posSummary as Record<string, unknown>)?.totalExposure as number) ?? 0));
  const healthyServices = services.filter((s) => s.status === "healthy").length;
  const totalServices = services.length;
  const serviceHealthPct = totalServices > 0 ? Math.round((healthyServices / totalServices) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="container px-4 py-6 md:px-6">
          <div className="flex items-center justify-between">
            <PageHeader title="Admin Dashboard" description="Organization management, users, and system overview" />
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
              <Shield className="mr-1.5 size-3" />
              Admin
            </Badge>
          </div>
        </div>
      </div>

      <div className="container px-4 py-8 md:px-6 space-y-8">
        {!isLoading && hasDashboardError && dashboardError ? (
          <ApiError error={dashboardError} onRetry={refetchDashboard} title="Failed to load admin dashboard" />
        ) : null}
        {/* Skeleton Loading State */}
        {isLoading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-12 w-12 rounded-lg" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Card>
                <CardContent className="pt-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                      <Skeleton className="h-7 w-16" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-36" />
              <Card>
                <CardContent className="pt-4 space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5">
                      <Skeleton className="h-5 w-14" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* System Summary Cards */}
        {!isLoading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-violet-500/20 bg-violet-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Strategies</p>
                      <p className="text-3xl font-bold font-mono text-violet-400">{totalStrategies}</p>
                    </div>
                    <div className="rounded-lg bg-violet-500/10 p-3">
                      <BarChart3 className="size-6 text-violet-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total AUM</p>
                      <p className="text-3xl font-bold font-mono text-amber-400">
                        $
                        {totalAum >= 1_000_000
                          ? `${formatNumber(totalAum / 1_000_000, 1)}m`
                          : totalAum.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-amber-500/10 p-3">
                      <DollarSign className="size-6 text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-sky-500/20 bg-sky-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Users</p>
                      <p className="text-3xl font-bold font-mono text-sky-400">{totalUsers}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activeOrgs} active orgs</p>
                    </div>
                    <div className="rounded-lg bg-sky-500/10 p-3">
                      <Users className="size-6 text-sky-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card
                className={`${serviceHealthPct >= 90 ? "border-emerald-500/20 bg-emerald-500/5" : serviceHealthPct >= 70 ? "border-amber-500/20 bg-amber-500/5" : "border-red-500/20 bg-red-500/5"}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Service Health</p>
                      <p
                        className={`text-3xl font-bold font-mono ${serviceHealthPct >= 90 ? "text-emerald-400" : serviceHealthPct >= 70 ? "text-amber-400" : "text-red-400"}`}
                      >
                        {totalServices > 0 ? `${serviceHealthPct}%` : "--"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {healthyServices}/{totalServices} healthy
                      </p>
                    </div>
                    <div
                      className={`rounded-lg p-3 ${serviceHealthPct >= 90 ? "bg-emerald-500/10" : serviceHealthPct >= 70 ? "bg-amber-500/10" : "bg-red-500/10"}`}
                    >
                      <Heart
                        className={`size-6 ${serviceHealthPct >= 90 ? "text-emerald-400" : serviceHealthPct >= 70 ? "text-amber-400" : "text-red-400"}`}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/services/manage/clients">
                  <Plus className="mr-2 size-4" />
                  Create Org
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/services/manage/fees">
                  <CreditCard className="mr-2 size-4" />
                  Manage Subscriptions
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  toast.info("Audit log opened");
                  const el = document.getElementById("audit-events");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <FileText className="mr-2 size-4" />
                View Audit Log
              </Button>
              <Button variant="outline" asChild>
                <Link href="/ops/services">
                  <Server className="mr-2 size-4" />
                  Service Status
                </Link>
              </Button>
            </div>

            {/* Pending Approvals */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Pending Approvals</h2>
                <Badge variant="outline" className="text-xs">
                  {pendingApprovals.length} pending
                </Badge>
              </div>
              <Card>
                <CardContent className="pt-4">
                  {pendingApprovals.length > 0 ? (
                    <div className="space-y-2">
                      {pendingApprovals.map((approval) => (
                        <div
                          key={approval.id}
                          className="flex items-center justify-between rounded-md px-3 py-3 hover:bg-accent/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="size-4 text-amber-400" />
                            <div>
                              <p className="text-sm font-medium">{approval.description}</p>
                              <p className="text-xs text-muted-foreground">
                                Requested by {approval.requestedBy} - {approval.type}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{approval.requestedAt}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => toast.info(`Reviewing approval ${approval.id}`)}
                            >
                              Review
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Inbox className="size-10 text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground">No pending approvals</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Strategy promotions, config changes, and access requests will appear here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Organization Cards */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Organizations</h2>
              {orgs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {orgs.map((org) => (
                    <Card key={org.id} className="hover:border-foreground/20 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{org.name}</CardTitle>
                          <Badge
                            variant={org.status === "active" ? "default" : "secondary"}
                            className={
                              org.status === "active"
                                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                : org.status === "onboarding"
                                  ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                                  : "bg-red-500/20 text-red-400"
                            }
                          >
                            {org.status}
                          </Badge>
                        </div>
                        <CardDescription>
                          {org.type === "internal" ? "Internal Team" : "Client Organization"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Members</p>
                            <p className="font-mono font-medium">{org.memberCount}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Tier</p>
                            <p className="font-medium capitalize">{org.subscriptionTier}</p>
                          </div>
                        </div>
                        {org.monthlyFee !== undefined && (
                          <div className="text-sm">
                            <p className="text-muted-foreground text-xs">Monthly Fee</p>
                            <p className="font-mono font-medium">${org.monthlyFee.toLocaleString()}</p>
                          </div>
                        )}
                        <Button variant="ghost" size="sm" className="w-full" asChild>
                          <Link href="/services/manage/clients">
                            Manage
                            <ArrowRight className="ml-2 size-3" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Building2 className="size-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No organizations loaded</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Recent Activity Log (Audit Trail) */}
            <div id="audit-events">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Recent Activity Log</h2>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        <Download className="mr-1.5 size-3" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          exportTableToCsv(
                            events as unknown as Record<string, unknown>[],
                            activityExportColumns,
                            "admin-activity-log",
                          )
                        }
                      >
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          exportTableToXlsx(
                            events as unknown as Record<string, unknown>[],
                            activityExportColumns,
                            "admin-activity-log",
                          )
                        }
                      >
                        Export as XLSX
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Badge variant="outline" className="text-xs">
                    <Activity className="mr-1 size-3" />
                    {events.length} events
                  </Badge>
                </div>
              </div>
              <Card>
                <CardContent className="pt-4">
                  {events.length > 0 ? (
                    <div className="space-y-1">
                      {events.slice(0, 20).map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-accent/30 transition-colors"
                        >
                          <Badge variant="secondary" className="text-[10px] min-w-[3.5rem] justify-center">
                            {ACTION_ICONS[event.type] ?? event.type.split(".")[0]}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">
                              <span className="font-medium">{event.actor}</span>{" "}
                              <span className="text-muted-foreground">{event.details}</span>
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {event.entity && (
                                <span className="text-xs text-muted-foreground font-mono">{event.entity}</span>
                              )}
                              {event.org && (
                                <span className="text-xs text-muted-foreground">
                                  <Building2 className="inline size-3 mr-0.5" />
                                  {event.org}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                            <Clock className="size-3" />
                            {formatRelativeTime(event.timestamp)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <Activity className="size-10 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No audit events recorded</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detailed Audit Dashboard */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Audit Trail</h2>
              <Card>
                <CardContent className="p-0">
                  <AuditDashboard currentPage="dashboard" />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
