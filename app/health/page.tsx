"use client"

import * as React from "react"
import { AppShell } from "@/components/trading/app-shell"
import { StatusBadge } from "@/components/trading/status-badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Activity,
  Server,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Database,
  Cpu,
} from "lucide-react"
import { cn } from "@/lib/utils"

type ServiceStatus = "healthy" | "degraded" | "unhealthy" | "idle"

interface Service {
  name: string
  tier: "critical" | "core" | "support"
  status: ServiceStatus
  latencyP50: number
  latencyP99: number
  errorRate: number
  lastHealthCheck: string
  uptime: string
  version: string
}

interface FeatureFreshness {
  service: string
  freshness: number // seconds
  sla: number // seconds
  status: ServiceStatus
  region: string
  lastUpdate: string
}

const mockServices: Service[] = [
  { name: "execution-service", tier: "critical", status: "healthy", latencyP50: 12, latencyP99: 45, errorRate: 0.01, lastHealthCheck: "2s ago", uptime: "99.99%", version: "v31.2.1" },
  { name: "risk-and-exposure-service", tier: "critical", status: "healthy", latencyP50: 8, latencyP99: 32, errorRate: 0.02, lastHealthCheck: "2s ago", uptime: "99.98%", version: "v12.4.0" },
  { name: "pnl-attribution-service", tier: "critical", status: "healthy", latencyP50: 15, latencyP99: 58, errorRate: 0.01, lastHealthCheck: "2s ago", uptime: "99.97%", version: "v8.1.2" },
  { name: "strategy-service", tier: "critical", status: "healthy", latencyP50: 22, latencyP99: 78, errorRate: 0.03, lastHealthCheck: "2s ago", uptime: "99.95%", version: "v24.0.0" },
  { name: "features-delta-1", tier: "core", status: "degraded", latencyP50: 45, latencyP99: 180, errorRate: 0.15, lastHealthCheck: "5s ago", uptime: "98.5%", version: "v17.3.1" },
  { name: "market-tick-data-service", tier: "core", status: "healthy", latencyP50: 3, latencyP99: 12, errorRate: 0.005, lastHealthCheck: "1s ago", uptime: "99.99%", version: "v6.2.0" },
  { name: "ml-inference-service", tier: "core", status: "idle", latencyP50: 85, latencyP99: 220, errorRate: 0, lastHealthCheck: "30s ago", uptime: "99.9%", version: "v3.1.0" },
  { name: "alerting-service", tier: "support", status: "healthy", latencyP50: 5, latencyP99: 18, errorRate: 0.01, lastHealthCheck: "2s ago", uptime: "99.99%", version: "v5.0.2" },
  { name: "recon-service", tier: "support", status: "healthy", latencyP50: 120, latencyP99: 450, errorRate: 0.02, lastHealthCheck: "10s ago", uptime: "99.8%", version: "v4.2.1" },
  { name: "client-reporting-api", tier: "support", status: "healthy", latencyP50: 35, latencyP99: 125, errorRate: 0.01, lastHealthCheck: "5s ago", uptime: "99.95%", version: "v7.1.0" },
]

const mockFeatureFreshness: FeatureFreshness[] = [
  { service: "features-delta-1", freshness: 92, sla: 30, status: "degraded", region: "EU", lastUpdate: "92s ago" },
  { service: "features-delta-1", freshness: 8, sla: 30, status: "healthy", region: "US", lastUpdate: "8s ago" },
  { service: "execution-service", freshness: 2, sla: 5, status: "healthy", region: "Global", lastUpdate: "2s ago" },
  { service: "risk-and-exposure", freshness: 4, sla: 10, status: "healthy", region: "Global", lastUpdate: "4s ago" },
  { service: "pnl-attribution", freshness: 8, sla: 15, status: "healthy", region: "Global", lastUpdate: "8s ago" },
  { service: "market-tick-data", freshness: 0.3, sla: 1, status: "healthy", region: "Global", lastUpdate: "0.3s ago" },
  { service: "ml-inference", freshness: 0, sla: 0, status: "idle", region: "Global", lastUpdate: "-" },
]

function getStatusIcon(status: ServiceStatus) {
  switch (status) {
    case "healthy":
      return <CheckCircle2 className="size-4 text-[var(--status-live)]" />
    case "degraded":
      return <AlertTriangle className="size-4 text-[var(--status-warning)]" />
    case "unhealthy":
      return <XCircle className="size-4 text-[var(--status-error)]" />
    case "idle":
      return <Clock className="size-4 text-muted-foreground" />
    default:
      return null
  }
}

function getStatusColor(status: ServiceStatus) {
  switch (status) {
    case "healthy":
      return "text-[var(--status-live)]"
    case "degraded":
      return "text-[var(--status-warning)]"
    case "unhealthy":
      return "text-[var(--status-error)]"
    case "idle":
      return "text-muted-foreground"
    default:
      return "text-muted-foreground"
  }
}

function getFreshnessStatus(freshness: number, sla: number): ServiceStatus {
  if (sla === 0) return "idle"
  const ratio = freshness / sla
  if (ratio <= 1) return "healthy"
  if (ratio <= 2) return "degraded"
  return "unhealthy"
}

export default function HealthPage() {
  const healthyCount = mockServices.filter((s) => s.status === "healthy").length
  const degradedCount = mockServices.filter((s) => s.status === "degraded").length
  const unhealthyCount = mockServices.filter((s) => s.status === "unhealthy").length

  const criticalServices = mockServices.filter((s) => s.tier === "critical")
  const coreServices = mockServices.filter((s) => s.tier === "core")
  const supportServices = mockServices.filter((s) => s.tier === "support")

  return (
    <AppShell
      activeSurface="trading"
      activePhase="monitor"
      breadcrumbs={[
        { label: "Trading", href: "/" },
        { label: "Health" },
      ]}
    >
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Activity className="size-6 text-primary" />
              System Health
            </h1>
            <p className="text-sm text-muted-foreground">
              Service health grid and feature freshness SLA tracker
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="size-3.5" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="size-3.5" />
              Grafana
            </Button>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Total Services</div>
              <div className="text-3xl font-semibold font-mono">{mockServices.length}</div>
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
        </div>

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
            <TabsTrigger value="dependencies" className="gap-2">
              <Database className="size-4" />
              Dependencies
            </TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            {/* By Tier */}
            <div className="space-y-6">
              {/* Critical Tier */}
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
                      <div
                        key={service.name}
                        className={cn(
                          "p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/30",
                          service.status === "healthy" && "border-[var(--status-live)]/30",
                          service.status === "degraded" && "border-[var(--status-warning)]/30",
                          service.status === "unhealthy" && "border-[var(--status-error)]/30"
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
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Core Tier */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[var(--status-warning)] border-[var(--status-warning)]">
                      Core
                    </Badge>
                    <span className="text-sm text-muted-foreground">Data and inference services</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {coreServices.map((service) => (
                      <div
                        key={service.name}
                        className={cn(
                          "p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/30",
                          service.status === "healthy" && "border-[var(--status-live)]/30",
                          service.status === "degraded" && "border-[var(--status-warning)]/30 bg-[var(--status-warning)]/5",
                          service.status === "unhealthy" && "border-[var(--status-error)]/30",
                          service.status === "idle" && "border-muted-foreground/30"
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
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Support Tier */}
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
                      <div
                        key={service.name}
                        className={cn(
                          "p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/30",
                          service.status === "healthy" && "border-[var(--status-live)]/30",
                          service.status === "degraded" && "border-[var(--status-warning)]/30",
                          service.status === "unhealthy" && "border-[var(--status-error)]/30"
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
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Feature Freshness Tab */}
          <TabsContent value="freshness">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Feature Freshness SLA</CardTitle>
                <CardDescription>Data freshness vs target SLA by service and region</CardDescription>
              </CardHeader>
              <CardContent>
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
                    {mockFeatureFreshness.map((item, idx) => {
                      const status = getFreshnessStatus(item.freshness, item.sla)
                      const utilization = item.sla > 0 ? (item.freshness / item.sla) * 100 : 0
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
                                  utilization > 200 && "[&>div]:bg-[var(--status-error)]"
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
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dependencies Tab */}
          <TabsContent value="dependencies">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Service Dependencies</CardTitle>
                <CardDescription>Critical path and dependency health</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  Dependency DAG visualization coming soon
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
