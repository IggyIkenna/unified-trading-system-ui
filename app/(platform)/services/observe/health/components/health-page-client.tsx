"use client";

import { PageHeader } from "@/components/platform/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataFreshness } from "@/components/ui/data-freshness";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFeatureFreshness, useServiceHealth } from "@/hooks/api/use-service-status";
import { cn } from "@/lib/utils";
import { exportTableToCsv, exportTableToXlsx, type ExportColumn } from "@/lib/utils/export";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, Clock, Cpu, Database, Download, ExternalLink, FileText, RefreshCw, Server } from "lucide-react";
import * as React from "react";

import {
  DependencyDag,
  ErrorState,
  getFreshnessStatus,
  getStatusColor,
  getStatusIcon,
  LogsViewer,
  ResourceMetrics,
  ServiceCard,
  ServiceCardSkeleton,
  SummaryCardSkeleton,
  TableRowSkeleton,
  type FeatureFreshness,
  type Service,
  type ServiceStatus,
} from "./health-page-sections";

export default function HealthPageClient() {
  const queryClient = useQueryClient();
  const {
    data: healthData,
    isLoading: healthLoading,
    isError: healthError,
    refetch: refetchHealth,
  } = useServiceHealth();
  const { data: freshnessData, isLoading: freshnessLoading } = useFeatureFreshness();

  const services: Service[] = React.useMemo(() => {
    const raw = (healthData as Record<string, unknown>)?.data as Array<Record<string, unknown>> | undefined;
    if (!raw) return [];
    return raw.map((s) => ({
      name: (s.name as string) ?? "",
      tier: ((s.tier as string) ?? "support") as Service["tier"],
      status: ((s.status as string) ?? "healthy") as ServiceStatus,
      latencyP50: (s.latencyP50 as number) ?? 0,
      latencyP99: (s.latencyP99 as number) ?? 0,
      errorRate: (s.errorRate as number) ?? 0,
      lastHealthCheck: (s.lastHealthCheck as string) ?? "",
      uptime: (s.uptime as string) ?? "0%",
      version: (s.version as string) ?? "",
      cpuPct: s.cpuPct as number | undefined,
      memoryPct: s.memoryPct as number | undefined,
      connections: s.connections as number | undefined,
      queueDepth: s.queueDepth as number | undefined,
      requiredForTier: s.requiredForTier as string | undefined,
      lastError: s.lastError as string | undefined,
    }));
  }, [healthData]);

  const featureFreshness: FeatureFreshness[] = React.useMemo(() => {
    const raw = (freshnessData as Record<string, unknown>)?.data as Array<Record<string, unknown>> | undefined;
    if (!raw) return [];
    return raw.map((f) => ({
      service: (f.service as string) ?? "",
      freshness: (f.freshness as number) ?? 0,
      sla: (f.sla as number) ?? 0,
      status: ((f.status as string) ?? "healthy") as ServiceStatus,
      region: (f.region as string) ?? "Global",
      lastUpdate: (f.lastUpdate as string) ?? "",
    }));
  }, [freshnessData]);

  const healthyCount = services.filter((s) => s.status === "healthy").length;
  const degradedCount = services.filter((s) => s.status === "degraded").length;
  const unhealthyCount = services.filter((s) => s.status === "unhealthy").length;

  const criticalServices = services.filter((s) => s.tier === "critical");
  const coreServices = services.filter((s) => s.tier === "core");
  const supportServices = services.filter((s) => s.tier === "support");

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["service-health"] });
    queryClient.invalidateQueries({ queryKey: ["feature-freshness"] });
    queryClient.invalidateQueries({ queryKey: ["service-activity"] });
  };

  return (
    <div className="p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <Activity className="size-6 text-primary" />
              System Health
            </span>
          }
          description="Service health grid, feature freshness SLA, and operational logs"
        >
          <DataFreshness lastUpdated={healthData ? new Date() : null} isWebSocket={false} />
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleRefresh}>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ExternalLink className="size-3.5" />
            Grafana
          </Button>
        </PageHeader>

        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {healthLoading ? (
            <>
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
              <SummaryCardSkeleton />
            </>
          ) : (
            <>
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">Total Services</div>
                  <div className="text-3xl font-semibold font-mono">{services.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">Healthy</div>
                  <div className="text-3xl font-semibold font-mono text-[var(--status-live)]">{healthyCount}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">Degraded</div>
                  <div className="text-3xl font-semibold font-mono text-[var(--status-warning)]">{degradedCount}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">Unhealthy</div>
                  <div className="text-3xl font-semibold font-mono text-[var(--status-error)]">{unhealthyCount}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {healthError ? (
          <ErrorState
            message="Failed to load service health data. The API may be unavailable."
            onRetry={() => refetchHealth()}
          />
        ) : (
          <Tabs defaultValue="services" className="space-y-6">
            <TabsList>
              <TabsTrigger value="services" className="gap-2">
                <Server className="size-4" />
                Services
              </TabsTrigger>
              <TabsTrigger value="freshness" className="gap-2">
                <Clock className="size-4" />
                Feature Freshness
              </TabsTrigger>
              <TabsTrigger value="resources" className="gap-2">
                <Cpu className="size-4" />
                Resources
              </TabsTrigger>
              <TabsTrigger value="dependencies" className="gap-2">
                <Database className="size-4" />
                Dependencies
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-2">
                <FileText className="size-4" />
                Logs
              </TabsTrigger>
            </TabsList>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-6">
              {healthLoading ? (
                <div className="space-y-6">
                  {["Critical", "Core", "Support"].map((tier) => (
                    <Card key={tier}>
                      <CardHeader className="pb-3">
                        <Skeleton className="h-5 w-24" />
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <ServiceCardSkeleton key={i} />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : services.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Server className="size-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No service data available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Services will appear when the API reports health data
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Critical Tier */}
                  {criticalServices.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[var(--status-error)] border-[var(--status-error)]">
                            Critical
                          </Badge>
                          <span className="text-sm text-muted-foreground">Must be healthy for trading</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {criticalServices.map((service) => (
                            <ServiceCard key={service.name} service={service} />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Core Tier */}
                  {coreServices.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[var(--status-warning)] border-[var(--status-warning)]"
                          >
                            Core
                          </Badge>
                          <span className="text-sm text-muted-foreground">Data and inference services</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {coreServices.map((service) => (
                            <ServiceCard key={service.name} service={service} />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Support Tier */}
                  {supportServices.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Support</Badge>
                          <span className="text-sm text-muted-foreground">Reporting and auxiliary services</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {supportServices.map((service) => (
                            <ServiceCard key={service.name} service={service} />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Feature Freshness Tab */}
            <TabsContent value="freshness">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base">Feature Freshness SLA</CardTitle>
                    <CardDescription>Data freshness vs target SLA by service and region</CardDescription>
                  </div>
                  {featureFreshness.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Download className="size-3.5" />
                          Export
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            const cols: ExportColumn[] = [
                              { key: "service", header: "Service" },
                              { key: "region", header: "Region" },
                              {
                                key: "freshness",
                                header: "Freshness (s)",
                                format: "number",
                              },
                              {
                                key: "sla",
                                header: "SLA (s)",
                                format: "number",
                              },
                              { key: "status", header: "Status" },
                              { key: "lastUpdate", header: "Last Update" },
                            ];
                            exportTableToCsv(featureFreshness, cols, "feature-freshness");
                          }}
                        >
                          Export as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const cols: ExportColumn[] = [
                              { key: "service", header: "Service" },
                              { key: "region", header: "Region" },
                              {
                                key: "freshness",
                                header: "Freshness (s)",
                                format: "number",
                              },
                              {
                                key: "sla",
                                header: "SLA (s)",
                                format: "number",
                              },
                              { key: "status", header: "Status" },
                              { key: "lastUpdate", header: "Last Update" },
                            ];
                            exportTableToXlsx(featureFreshness, cols, "feature-freshness");
                          }}
                        >
                          Export as XLSX
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardHeader>
                <CardContent>
                  {freshnessLoading ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service</TableHead>
                          <TableHead>Region</TableHead>
                          <TableHead className="text-right">Freshness</TableHead>
                          <TableHead className="text-right">SLA</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[200px]">Utilization</TableHead>
                          <TableHead className="text-right">Last Update</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: 6 }).map((_, i) => (
                          <TableRowSkeleton key={i} cols={7} />
                        ))}
                      </TableBody>
                    </Table>
                  ) : featureFreshness.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Clock className="size-10 text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground">No freshness data available</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service</TableHead>
                          <TableHead>Region</TableHead>
                          <TableHead className="text-right">Freshness</TableHead>
                          <TableHead className="text-right">SLA</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[200px]">Utilization</TableHead>
                          <TableHead className="text-right">Last Update</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {featureFreshness.map((item, idx) => {
                          const status = getFreshnessStatus(item.freshness, item.sla);
                          const utilization = item.sla > 0 ? (item.freshness / item.sla) * 100 : 0;
                          return (
                            <TableRow key={`${item.service}-${item.region}-${idx}`}>
                              <TableCell className="font-medium">{item.service}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {item.region}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {item.sla > 0 ? `${item.freshness}s` : "-"}
                              </TableCell>
                              <TableCell className="text-right font-mono text-muted-foreground">
                                {item.sla > 0 ? `${item.sla}s` : "-"}
                              </TableCell>
                              <TableCell>
                                <div className={cn("flex items-center gap-1.5", getStatusColor(status))}>
                                  {getStatusIcon(status)}
                                  <span className="capitalize text-sm">{status}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {item.sla > 0 ? (
                                  <Progress
                                    value={Math.min(utilization, 100)}
                                    className={cn(
                                      "h-2",
                                      utilization <= 100 && "[&>div]:bg-[var(--status-live)]",
                                      utilization > 100 && utilization <= 200 && "[&>div]:bg-[var(--status-warning)]",
                                      utilization > 200 && "[&>div]:bg-[var(--status-error)]",
                                    )}
                                  />
                                ) : (
                                  <span className="text-muted-foreground text-sm">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right text-sm text-muted-foreground">
                                {item.lastUpdate}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resources Tab (absorbed from live-health-monitor-ui ResourceMetricsPage) */}
            <TabsContent value="resources">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resource Utilization</CardTitle>
                  <CardDescription>CPU, memory, connections, and queue depth per service</CardDescription>
                </CardHeader>
                <CardContent>
                  {healthLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="bg-card/50">
                          <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-32" />
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <Skeleton className="h-1.5 w-full" />
                            <Skeleton className="h-1.5 w-full" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <ResourceMetrics services={services} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dependencies Tab (absorbed from live-health-monitor-ui DependencyDagPage) */}
            <TabsContent value="dependencies">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Service Dependencies</CardTitle>
                  <CardDescription>Tiered dependency graph showing T0→T3 build order and health</CardDescription>
                </CardHeader>
                <CardContent>
                  <DependencyDag />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Service Logs</CardTitle>
                  <CardDescription>Structured log entries from all services</CardDescription>
                </CardHeader>
                <CardContent>
                  <LogsViewer />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
