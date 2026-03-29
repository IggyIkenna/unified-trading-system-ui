"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useServiceActivity } from "@/hooks/api/use-service-status";
import { useTickingNowMs } from "@/hooks/use-ticking-now";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Cpu,
  FileText,
  MemoryStick,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { formatPercent } from "@/lib/utils/formatters";

export type ServiceStatus = "healthy" | "degraded" | "unhealthy" | "idle";

export interface Service {
  name: string;
  tier: "critical" | "core" | "support";
  status: ServiceStatus;
  latencyP50: number;
  latencyP99: number;
  errorRate: number;
  lastHealthCheck: string;
  uptime: string;
  version: string;
  cpuPct?: number;
  memoryPct?: number;
  connections?: number;
  queueDepth?: number;
  requiredForTier?: string;
  lastError?: string;
}

export interface FeatureFreshness {
  service: string;
  freshness: number;
  sla: number;
  status: ServiceStatus;
  region: string;
  lastUpdate: string;
}

interface LogEntry {
  id: string;
  service: string;
  severity: "info" | "warn" | "error" | "critical";
  message: string;
  timestamp: string;
  correlationId?: string;
}

// Dependency DAG node — absorbed from live-health-monitor-ui
interface DependencyNode {
  name: string;
  tier: string;
  deps: string[];
  status: ServiceStatus;
}

export function getStatusIcon(status: ServiceStatus) {
  switch (status) {
    case "healthy":
      return <CheckCircle2 className="size-4 text-[var(--status-live)]" />;
    case "degraded":
      return <AlertTriangle className="size-4 text-[var(--status-warning)]" />;
    case "unhealthy":
      return <XCircle className="size-4 text-[var(--status-error)]" />;
    case "idle":
      return <Clock className="size-4 text-muted-foreground" />;
    default:
      return null;
  }
}

export function getStatusColor(status: ServiceStatus) {
  switch (status) {
    case "healthy":
      return "text-[var(--status-live)]";
    case "degraded":
      return "text-[var(--status-warning)]";
    case "unhealthy":
      return "text-[var(--status-error)]";
    case "idle":
      return "text-muted-foreground";
    default:
      return "text-muted-foreground";
  }
}

export function getFreshnessStatus(freshness: number, sla: number): ServiceStatus {
  if (sla === 0) return "idle";
  const ratio = freshness / sla;
  if (ratio <= 1) return "healthy";
  if (ratio <= 2) return "degraded";
  return "unhealthy";
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case "critical":
      return "text-red-500 bg-red-500/10";
    case "error":
      return "text-[var(--status-error)] bg-[var(--status-error)]/10";
    case "warn":
      return "text-[var(--status-warning)] bg-[var(--status-warning)]/10";
    case "info":
      return "text-blue-400 bg-blue-400/10";
    default:
      return "text-muted-foreground bg-muted";
  }
}

// ── Skeleton Loaders ──

export function SummaryCardSkeleton() {
  return (
    <Card className="bg-card/50">
      <CardContent className="p-4">
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-8 w-12" />
      </CardContent>
    </Card>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="p-4 rounded-lg border border-border/50">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="size-4 rounded-full" />
        <Skeleton className="h-3 w-10" />
      </div>
      <Skeleton className="h-4 w-24 mb-2" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols }: { cols: number }) {
  return (
    <TableRow>
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ── Error State ──

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="size-12 text-[var(--status-error)] mb-4" />
      <h3 className="text-lg font-semibold">Failed to load data</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={onRetry}>
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}

// ── Service Card (reusable) ──

export function ServiceCard({ service }: { service: Service }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/30",
              service.status === "healthy" && "border-[var(--status-live)]/30",
              service.status === "degraded" && "border-[var(--status-warning)]/30 bg-[var(--status-warning)]/5",
              service.status === "unhealthy" && "border-[var(--status-error)]/30",
              service.status === "idle" && "border-muted-foreground/30",
            )}
          >
            <div className="flex items-center justify-between mb-2">
              {getStatusIcon(service.status)}
              <span className="text-xs text-muted-foreground font-mono">{service.version}</span>
            </div>
            <div className="font-medium text-sm truncate">{service.name}</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">p50:</span>{" "}
                <span className="font-mono">{service.latencyP50}ms</span>
              </div>
              <div>
                <span className="text-muted-foreground">p99:</span>{" "}
                <span className="font-mono">{service.latencyP99}ms</span>
              </div>
            </div>
            {service.errorRate > 0 && (
              <div className="mt-1 text-xs text-[var(--status-error)]">
                Error rate: {formatPercent(service.errorRate, 1)}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="text-xs space-y-1">
            <div>
              <strong>{service.name}</strong>
            </div>
            <div>Uptime: {service.uptime}</div>
            <div>Last check: {service.lastHealthCheck}</div>
            {service.requiredForTier && <div>Required for tier: {service.requiredForTier}</div>}
            {service.lastError && <div className="text-[var(--status-error)]">Last error: {service.lastError}</div>}
            {service.cpuPct != null && <div>CPU: {service.cpuPct}%</div>}
            {service.memoryPct != null && <div>Memory: {service.memoryPct}%</div>}
            {service.connections != null && <div>Connections: {service.connections}</div>}
            <button
              className="text-blue-400 underline underline-offset-2 hover:text-blue-300 mt-1"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`/api/v1/health/readiness?service=${encodeURIComponent(service.name)}`, "_blank");
              }}
            >
              Raw JSON
            </button>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ── Dependency DAG (absorbed from live-health-monitor-ui) ──

const DEPENDENCY_GRAPH: DependencyNode[] = [
  { name: "unified-trading-library", tier: "T0", deps: [], status: "healthy" },
  {
    name: "unified-internal-contracts",
    tier: "T0",
    deps: [],
    status: "healthy",
  },
  {
    name: "unified-api-contracts",
    tier: "T0",
    deps: ["unified-trading-library"],
    status: "healthy",
  },
  {
    name: "unified-cloud-interface",
    tier: "T1",
    deps: ["unified-trading-library", "unified-internal-contracts"],
    status: "healthy",
  },
  {
    name: "unified-config-interface",
    tier: "T1",
    deps: ["unified-trading-library"],
    status: "healthy",
  },
  {
    name: "unified-events-interface",
    tier: "T1",
    deps: ["unified-trading-library", "unified-cloud-interface"],
    status: "healthy",
  },
  {
    name: "unified-market-interface",
    tier: "T2",
    deps: ["unified-api-contracts", "unified-cloud-interface"],
    status: "healthy",
  },
  {
    name: "unified-trade-execution-interface",
    tier: "T2",
    deps: ["unified-api-contracts", "unified-cloud-interface"],
    status: "healthy",
  },
  {
    name: "execution-service",
    tier: "T3",
    deps: ["unified-trade-execution-interface", "unified-events-interface"],
    status: "healthy",
  },
  {
    name: "strategy-service",
    tier: "T3",
    deps: ["unified-market-interface", "unified-events-interface"],
    status: "healthy",
  },
  {
    name: "risk-and-exposure-service",
    tier: "T3",
    deps: ["unified-events-interface", "unified-cloud-interface"],
    status: "degraded",
  },
  {
    name: "market-tick-data-service",
    tier: "T3",
    deps: ["unified-market-interface", "unified-cloud-interface"],
    status: "healthy",
  },
  {
    name: "instruments-service",
    tier: "T3",
    deps: ["unified-api-contracts", "unified-cloud-interface"],
    status: "healthy",
  },
  {
    name: "alerting-service",
    tier: "T3",
    deps: ["unified-events-interface", "unified-cloud-interface"],
    status: "healthy",
  },
];

const TIER_COLORS: Record<string, string> = {
  T0: "border-blue-500/50 bg-blue-500/5",
  T1: "border-cyan-500/50 bg-cyan-500/5",
  T2: "border-emerald-500/50 bg-emerald-500/5",
  T3: "border-amber-500/50 bg-amber-500/5",
};

const TIER_LABELS: Record<string, string> = {
  T0: "Foundation",
  T1: "Core Interfaces",
  T2: "Domain Interfaces",
  T3: "Services",
};

export function DependencyDag() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const tiers = ["T0", "T1", "T2", "T3"];

  const filteredNodes = searchTerm
    ? DEPENDENCY_GRAPH.filter((n) => n.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : DEPENDENCY_GRAPH;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="size-4 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs h-8 text-sm"
        />
      </div>
      <div className="space-y-4">
        {tiers.map((tier) => {
          const tierNodes = filteredNodes.filter((n) => n.tier === tier);
          if (tierNodes.length === 0) return null;
          return (
            <div key={tier}>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {tier}
                </Badge>
                <span className="text-xs text-muted-foreground">{TIER_LABELS[tier]}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {tierNodes.map((node) => (
                  <div key={node.name} className={cn("p-3 rounded-lg border text-sm", TIER_COLORS[tier])}>
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(node.status)}
                      <span className="font-medium truncate">{node.name}</span>
                    </div>
                    {node.deps.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {node.deps.map((dep) => (
                          <span
                            key={dep}
                            className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded"
                          >
                            <ArrowRight className="size-2.5" />
                            {dep.replace("unified-", "u-")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Resource Metrics (absorbed from live-health-monitor-ui) ──

export function ResourceMetrics({ services }: { services: Service[] }) {
  const servicesWithResources = services.filter((s) => s.cpuPct != null || s.memoryPct != null);

  if (servicesWithResources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Cpu className="size-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">Resource metrics not available</p>
        <p className="text-xs text-muted-foreground mt-1">
          Resource data is populated when services report CPU/memory usage
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {servicesWithResources.map((service) => (
        <Card key={service.name} className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getStatusIcon(service.status)}
              {service.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {service.cpuPct != null && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Cpu className="size-3" /> CPU
                  </span>
                  <span
                    className={cn(
                      "font-mono",
                      service.cpuPct > 80
                        ? "text-[var(--status-error)]"
                        : service.cpuPct > 60
                          ? "text-[var(--status-warning)]"
                          : "text-[var(--status-live)]",
                    )}
                  >
                    {service.cpuPct}%
                  </span>
                </div>
                <Progress
                  value={service.cpuPct}
                  className={cn(
                    "h-1.5",
                    service.cpuPct > 80
                      ? "[&>div]:bg-[var(--status-error)]"
                      : service.cpuPct > 60
                        ? "[&>div]:bg-[var(--status-warning)]"
                        : "[&>div]:bg-[var(--status-live)]",
                  )}
                />
              </div>
            )}
            {service.memoryPct != null && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MemoryStick className="size-3" /> Memory
                  </span>
                  <span
                    className={cn(
                      "font-mono",
                      service.memoryPct > 80
                        ? "text-[var(--status-error)]"
                        : service.memoryPct > 60
                          ? "text-[var(--status-warning)]"
                          : "text-[var(--status-live)]",
                    )}
                  >
                    {service.memoryPct}%
                  </span>
                </div>
                <Progress
                  value={service.memoryPct}
                  className={cn(
                    "h-1.5",
                    service.memoryPct > 80
                      ? "[&>div]:bg-[var(--status-error)]"
                      : service.memoryPct > 60
                        ? "[&>div]:bg-[var(--status-warning)]"
                        : "[&>div]:bg-[var(--status-live)]",
                  )}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {service.connections != null && (
                <div>
                  <span className="text-muted-foreground">Connections:</span>{" "}
                  <span className="font-mono">{service.connections}</span>
                </div>
              )}
              {service.queueDepth != null && (
                <div>
                  <span className="text-muted-foreground">Queue:</span>{" "}
                  <span className="font-mono">{service.queueDepth}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Time Range Helper ──

function getTimeRangeMs(range: string): number {
  switch (range) {
    case "1h":
      return 60 * 60 * 1000;
    case "6h":
      return 6 * 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    default:
      return Infinity;
  }
}

// ── Logs Viewer ──

export function LogsViewer() {
  const { data: activityData, isLoading, isError, refetch } = useServiceActivity();
  const [severityFilter, setSeverityFilter] = React.useState<string>("all");
  const [serviceFilter, setServiceFilter] = React.useState("");
  const [timeRange, setTimeRange] = React.useState<string>("all");
  const wallNow = useTickingNowMs(5000);

  const logs: LogEntry[] = React.useMemo(() => {
    const raw = (activityData as Record<string, unknown>)?.data as Array<Record<string, unknown>> | undefined;
    if (!raw) return [];
    return raw.map((l, i) => ({
      id: (l.id as string) ?? `log-${i}`,
      service: (l.service as string) ?? "",
      severity: (l.severity as LogEntry["severity"]) ?? "info",
      message: (l.message as string) ?? "",
      timestamp: (l.timestamp as string) ?? "",
      correlationId: l.correlationId as string | undefined,
    }));
  }, [activityData]);

  const filtered = React.useMemo(() => {
    return logs.filter((l) => {
      if (severityFilter !== "all" && l.severity !== severityFilter) return false;
      if (serviceFilter && !l.service.toLowerCase().includes(serviceFilter.toLowerCase())) return false;
      if (timeRange !== "all") {
        const cutoff = wallNow - getTimeRangeMs(timeRange);
        const logTime = new Date(l.timestamp).getTime();
        if (logTime < cutoff) return false;
      }
      return true;
    });
  }, [logs, severityFilter, serviceFilter, timeRange, wallNow]);

  if (isError) {
    return <ErrorState message="Failed to load logs" onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Search className="size-4 text-muted-foreground" />
          <Input
            placeholder="Filter by service..."
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="h-8 w-48 text-sm"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warn">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="h-8 w-32 text-sm">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="1h">Last 1 Hour</SelectItem>
            <SelectItem value="6h">Last 6 Hours</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="size-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No log entries found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {serviceFilter || severityFilter !== "all" || timeRange !== "all"
              ? "Try adjusting your filters"
              : "Log entries appear when services report events"}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Timestamp</TableHead>
                <TableHead className="w-[80px]">Level</TableHead>
                <TableHead className="w-[180px]">Service</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="w-[120px]">Correlation ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 50).map((log) => (
                <TableRow key={log.id} className="font-mono text-xs">
                  <TableCell className="text-muted-foreground">{log.timestamp}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] uppercase px-1.5", getSeverityColor(log.severity))}
                    >
                      {log.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="truncate max-w-[180px]">{log.service}</TableCell>
                  <TableCell className="truncate max-w-[400px]">{log.message}</TableCell>
                  <TableCell className="text-muted-foreground truncate max-w-[120px]">
                    {log.correlationId ?? "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
