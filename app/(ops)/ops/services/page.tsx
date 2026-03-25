"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Server,
  Database,
  Cpu,
  Activity,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronRight,
  Layers,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SERVICES, type Service } from "@/lib/reference-data";
import { useServicesList } from "@/hooks/api/use-service-status";

// Extend services with runtime status
interface ServiceStatus extends Service {
  instances: number;
  healthyInstances: number;
  cpu: number;
  memory: number;
  requestsPerSec: number;
  errorRate: number;
  p50Latency: number;
  p99Latency: number;
  lastDeployed: string;
  version: string;
}

const serviceStatuses: ServiceStatus[] = SERVICES.map((service) => ({
  ...service,
  instances: Math.floor(Math.random() * 3) + 1,
  healthyInstances: Math.floor(Math.random() * 3) + 1,
  cpu: Math.random() * 80 + 10,
  memory: Math.random() * 70 + 20,
  requestsPerSec: Math.floor(Math.random() * 500) + 50,
  errorRate: Math.random() * 2,
  p50Latency: Math.random() * 10 + 1,
  p99Latency: Math.random() * 50 + 10,
  lastDeployed: "2h ago",
  version: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}`,
}));

// Shard configuration data
interface ShardInfo {
  key: string;
  status: "running" | "stale" | "failed";
  lastUpdate: string;
  latency?: string;
  error?: string;
}

interface ShardConfig {
  dimensions: string;
  totalShards: number;
  shards: ShardInfo[];
}

const serviceShards: Record<string, ShardConfig> = {
  "features-delta-one-service": {
    dimensions: "category x venue x feature_group",
    totalShards: 42,
    shards: [
      {
        key: "cefi/binance/funding_rates",
        status: "running",
        lastUpdate: "3m ago",
        latency: "12ms",
      },
      {
        key: "cefi/okx/order_book",
        status: "running",
        lastUpdate: "1m ago",
        latency: "8ms",
      },
      {
        key: "defi/aave_v3/lending_rates",
        status: "running",
        lastUpdate: "5m ago",
        latency: "45ms",
      },
      {
        key: "tradfi/databento/equity_bars",
        status: "stale",
        lastUpdate: "47m ago",
      },
      {
        key: "sports/odds_api/match_odds",
        status: "failed",
        lastUpdate: "2h ago",
        error: "timeout",
      },
      {
        key: "defi/uniswap_v3/pool_state",
        status: "running",
        lastUpdate: "2m ago",
        latency: "22ms",
      },
    ],
  },
  "market-tick-data-service": {
    dimensions: "category x venue",
    totalShards: 28,
    shards: [
      {
        key: "cefi/binance",
        status: "running",
        lastUpdate: "0.3s ago",
        latency: "2ms",
      },
      {
        key: "cefi/okx",
        status: "running",
        lastUpdate: "0.5s ago",
        latency: "3ms",
      },
      {
        key: "defi/hyperliquid",
        status: "running",
        lastUpdate: "1s ago",
        latency: "5ms",
      },
      {
        key: "cefi/deribit",
        status: "running",
        lastUpdate: "0.8s ago",
        latency: "4ms",
      },
    ],
  },
  "market-data-processing-service": {
    dimensions: "category x venue x asset",
    totalShards: 156,
    shards: [
      {
        key: "cefi/binance/btc",
        status: "running",
        lastUpdate: "1s ago",
        latency: "15ms",
      },
      {
        key: "cefi/binance/eth",
        status: "running",
        lastUpdate: "1s ago",
        latency: "14ms",
      },
      {
        key: "defi/aave/weth",
        status: "running",
        lastUpdate: "5s ago",
        latency: "32ms",
      },
      { key: "sports/pinnacle/nfl", status: "stale", lastUpdate: "12m ago" },
    ],
  },
  "position-balance-monitor-service": {
    dimensions: "venue x account",
    totalShards: 18,
    shards: [
      {
        key: "binance/main",
        status: "running",
        lastUpdate: "30s ago",
        latency: "120ms",
      },
      {
        key: "hyperliquid/trading",
        status: "running",
        lastUpdate: "15s ago",
        latency: "45ms",
      },
      {
        key: "aave_v3/defi",
        status: "running",
        lastUpdate: "1m ago",
        latency: "200ms",
      },
    ],
  },
};

function getServiceHealth(
  service: ServiceStatus,
): "healthy" | "degraded" | "unhealthy" {
  if (service.healthyInstances === 0) return "unhealthy";
  if (service.healthyInstances < service.instances || service.errorRate > 1)
    return "degraded";
  return "healthy";
}

export default function ServicesPage() {
  const { data: apiData, refetch } = useServicesList();

  // Use API data if available, fall back to reference-data-derived mock
  const allServices: ServiceStatus[] =
    ((apiData as Record<string, unknown>)?.services as ServiceStatus[]) ??
    serviceStatuses;

  const apiServices = allServices.filter((s) => s.type === "api-service");
  const coreServices = allServices.filter(
    (s) => s.type === "service" || s.type === "batch-service",
  );

  const healthyCounts = {
    healthy: allServices.filter((s) => getServiceHealth(s) === "healthy")
      .length,
    degraded: allServices.filter((s) => getServiceHealth(s) === "degraded")
      .length,
    unhealthy: allServices.filter((s) => getServiceHealth(s) === "unhealthy")
      .length,
  };

  return (
    <div className="p-6">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Services</h1>
            <p className="text-sm text-muted-foreground">
              Monitor service health, deployments, and resource usage
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input placeholder="Search services..." className="pl-8 w-64" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetch();
                toast.info("Refreshing services...");
              }}
            >
              <RefreshCw className="size-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Health Summary */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Services
                  </p>
                  <p className="text-2xl font-semibold">{allServices.length}</p>
                </div>
                <Server className="size-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Healthy</p>
                  <p className="text-2xl font-semibold pnl-positive">
                    {healthyCounts.healthy}
                  </p>
                </div>
                <CheckCircle2
                  className="size-8"
                  style={{ color: "var(--pnl-positive)" }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Degraded</p>
                  <p className="text-2xl font-semibold status-warning">
                    {healthyCounts.degraded}
                  </p>
                </div>
                <AlertTriangle
                  className="size-8"
                  style={{ color: "var(--status-warning)" }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unhealthy</p>
                  <p className="text-2xl font-semibold pnl-negative">
                    {healthyCounts.unhealthy}
                  </p>
                </div>
                <XCircle
                  className="size-8"
                  style={{ color: "var(--pnl-negative)" }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              All Services ({allServices.length})
            </TabsTrigger>
            <TabsTrigger value="apis">APIs ({apiServices.length})</TabsTrigger>
            <TabsTrigger value="core">
              Core Services ({coreServices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <ServiceTable services={allServices} />
          </TabsContent>
          <TabsContent value="apis" className="space-y-4">
            <ServiceTable services={apiServices} />
          </TabsContent>
          <TabsContent value="core" className="space-y-4">
            <ServiceTable services={coreServices} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ServiceTable({ services }: { services: ServiceStatus[] }) {
  const [expandedService, setExpandedService] = React.useState<string | null>(
    null,
  );

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Instances</TableHead>
            <TableHead className="text-right">CPU</TableHead>
            <TableHead className="text-right">Memory</TableHead>
            <TableHead className="text-right">Req/s</TableHead>
            <TableHead className="text-right">Error Rate</TableHead>
            <TableHead className="text-right">p50 / p99</TableHead>
            <TableHead className="text-right">Version</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => {
            const serviceId = service.id ?? service.name;
            const health = getServiceHealth(service);
            const hasShard = Boolean(serviceShards[serviceId]);
            const isExpanded = expandedService === serviceId;
            const shardConfig = serviceShards[serviceId];

            return (
              <React.Fragment key={service.id}>
                <TableRow
                  className={cn(hasShard && "cursor-pointer hover:bg-muted/50")}
                  onClick={() =>
                    hasShard &&
                    setExpandedService(isExpanded ? null : serviceId)
                  }
                >
                  <TableCell className="w-8 p-2">
                    {hasShard &&
                      (isExpanded ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      ))}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {service.type === "api-service" ? (
                        <Database className="size-4 text-muted-foreground" />
                      ) : (
                        <Cpu className="size-4 text-muted-foreground" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{service.name}</p>
                          {hasShard && (
                            <Badge
                              variant="outline"
                              className="text-xs font-normal"
                            >
                              <Layers className="size-3 mr-1" />
                              {shardConfig?.totalShards} shards
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {service.domain}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        health === "healthy"
                          ? "default"
                          : health === "degraded"
                            ? "secondary"
                            : "destructive"
                      }
                      className={cn(
                        health === "healthy" &&
                          "bg-[var(--pnl-positive)]/10 text-[var(--pnl-positive)] border-[var(--pnl-positive)]/20",
                        health === "degraded" &&
                          "bg-[var(--status-warning)]/10 text-[var(--status-warning)] border-[var(--status-warning)]/20",
                      )}
                    >
                      {health}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span
                      className={cn(
                        service.healthyInstances < service.instances &&
                          "text-[var(--status-warning)]",
                      )}
                    >
                      {service.healthyInstances}
                    </span>
                    /{service.instances}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="font-mono">
                        {service.cpu.toFixed(0)}%
                      </span>
                      {service.cpu > 70 && (
                        <ArrowUpRight className="size-3 text-[var(--status-warning)]" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className="font-mono">
                        {service.memory.toFixed(0)}%
                      </span>
                      {service.memory > 80 && (
                        <ArrowUpRight className="size-3 text-[var(--status-warning)]" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {service.requestsPerSec}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "font-mono",
                        service.errorRate > 1 && "text-[var(--pnl-negative)]",
                      )}
                    >
                      {service.errorRate.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {service.p50Latency.toFixed(1)}ms /{" "}
                    {service.p99Latency.toFixed(0)}ms
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="font-mono text-xs">
                      {service.version}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Expanded Shard Details */}
                {isExpanded && shardConfig && (
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={11} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            Dimensions:
                          </span>
                          <code className="bg-background px-2 py-0.5 rounded text-xs font-mono">
                            {shardConfig.dimensions}
                          </code>
                          <span className="text-muted-foreground">
                            Total Shards:
                          </span>
                          <span className="font-medium">
                            {shardConfig.totalShards}
                          </span>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-8">Status</TableHead>
                              <TableHead>Shard Key</TableHead>
                              <TableHead className="text-right">
                                Last Update
                              </TableHead>
                              <TableHead className="text-right">
                                Latency
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {shardConfig.shards.map((shard: ShardInfo) => (
                              <TableRow key={shard.key}>
                                <TableCell>
                                  {shard.status === "running" && (
                                    <CheckCircle2 className="size-4 text-[var(--pnl-positive)]" />
                                  )}
                                  {shard.status === "stale" && (
                                    <AlertTriangle className="size-4 text-[var(--status-warning)]" />
                                  )}
                                  {shard.status === "failed" && (
                                    <XCircle className="size-4 text-[var(--pnl-negative)]" />
                                  )}
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {shard.key}
                                </TableCell>
                                <TableCell className="text-right text-sm text-muted-foreground">
                                  {shard.lastUpdate}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                  {shard.latency ||
                                    (shard.error ? (
                                      <span className="text-destructive">
                                        {shard.error}
                                      </span>
                                    ) : (
                                      "—"
                                    ))}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <p className="text-xs text-muted-foreground">
                          Showing {shardConfig.shards.length} of{" "}
                          {shardConfig.totalShards} shards
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
