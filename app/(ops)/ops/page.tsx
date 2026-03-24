"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EntityLink } from "@/components/trading/entity-link";
import { EventStreamViewer } from "@/components/ops/event-stream-viewer";
import { VenueConnectivity } from "@/components/ops/venue-connectivity";
import {
  Server,
  Activity,
  FileText,
  Shield,
  Rocket,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  GitBranch,
  Database,
  Radio,
} from "lucide-react";

// Mock batch job data
const batchJobs = [
  {
    id: "job-2026-03-17-001",
    name: "Feature Pipeline - Delta One",
    status: "running",
    progress: 78,
    startedAt: "06:00:00",
    eta: "2m remaining",
  },
  {
    id: "job-2026-03-17-002",
    name: "P&L Attribution Batch",
    status: "complete",
    progress: 100,
    startedAt: "05:30:00",
    completedAt: "05:42:00",
  },
  {
    id: "job-2026-03-17-003",
    name: "Risk Exposure Calculation",
    status: "complete",
    progress: 100,
    startedAt: "05:00:00",
    completedAt: "05:18:00",
  },
  {
    id: "job-2026-03-17-004",
    name: "Historical Data Backfill",
    status: "failed",
    progress: 45,
    startedAt: "04:00:00",
    error: "Connection timeout to data source",
  },
];

// Mock services data
const services = [
  {
    name: "execution-service",
    version: "v3.12.1",
    expectedVersion: "v3.12.1",
    status: "healthy",
    lastDeploy: "2h ago",
    env: "prod",
  },
  {
    name: "features-delta-one",
    version: "v2.8.0",
    expectedVersion: "v2.8.1",
    status: "drift",
    lastDeploy: "1d ago",
    env: "prod",
  },
  {
    name: "risk-and-exposure",
    version: "v1.15.2",
    expectedVersion: "v1.15.2",
    status: "healthy",
    lastDeploy: "3h ago",
    env: "prod",
  },
  {
    name: "pnl-attribution",
    version: "v2.4.0",
    expectedVersion: "v2.4.0",
    status: "healthy",
    lastDeploy: "6h ago",
    env: "prod",
  },
  {
    name: "strategy-service",
    version: "v4.2.1",
    expectedVersion: "v4.2.1",
    status: "healthy",
    lastDeploy: "12h ago",
    env: "prod",
  },
  {
    name: "ml-inference",
    version: "v1.3.0",
    expectedVersion: "v1.3.0",
    status: "idle",
    lastDeploy: "2d ago",
    env: "prod",
  },
];

// Data completeness mock
const dataCompleteness = [
  { service: "features-delta-one", days: [100, 100, 95, 60] },
  { service: "execution-service", days: [100, 100, 100, 100] },
  { service: "risk-and-exposure", days: [100, 100, 100, 85] },
  { service: "pnl-attribution", days: [100, 100, 100, 100] },
  { service: "market-tick-data", days: [100, 100, 100, 90] },
];

// Recent deployments
const recentDeploys = [
  {
    service: "execution-service",
    version: "v3.12.1",
    env: "prod",
    time: "2h ago",
    status: "success",
  },
  {
    service: "risk-and-exposure",
    version: "v1.15.2",
    env: "prod",
    time: "3h ago",
    status: "success",
  },
  {
    service: "pnl-attribution",
    version: "v2.4.0",
    env: "prod",
    time: "6h ago",
    status: "success",
  },
  {
    service: "features-delta-one",
    version: "v2.8.0",
    env: "staging",
    time: "8h ago",
    status: "success",
  },
];

// Audit log mock
const auditLog = [
  {
    action: "Config Changed",
    entity: "BTC Basis v3",
    actor: "john.doe",
    time: "10m ago",
    type: "config",
  },
  {
    action: "Strategy Paused",
    entity: "ML Directional",
    actor: "system",
    time: "25m ago",
    type: "intervention",
  },
  {
    action: "Deployment",
    entity: "execution-service",
    actor: "ci-bot",
    time: "2h ago",
    type: "deploy",
  },
  {
    action: "Kill Switch Armed",
    entity: "Sports Arb",
    actor: "jane.smith",
    time: "3h ago",
    type: "intervention",
  },
];

export default function OpsPage() {
  const [dataMode, setDataMode] = React.useState<"live" | "batch">("live");

  return (
    <div className="p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Operations Hub</h1>
            <p className="text-sm text-muted-foreground">
              Deploy, monitor jobs, view logs, check compliance
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live/Batch Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              <Button
                variant={dataMode === "live" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 gap-1.5"
                onClick={() => setDataMode("live")}
              >
                <Radio className="size-3.5" />
                Live
              </Button>
              <Button
                variant={dataMode === "batch" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 gap-1.5"
                onClick={() => setDataMode("batch")}
              >
                <Database className="size-3.5" />
                Batch
              </Button>
            </div>

            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button
              size="sm"
              className="gap-2"
              style={{ backgroundColor: "var(--surface-ops)" }}
            >
              <Rocket className="size-4" />
              Deploy Service
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--status-live)]/10">
                  <CheckCircle2
                    className="size-5"
                    style={{ color: "var(--status-live)" }}
                  />
                </div>
                <div>
                  <p className="text-2xl font-semibold">47</p>
                  <p className="text-xs text-muted-foreground">Jobs Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--status-running)]/10">
                  <Activity
                    className="size-5"
                    style={{ color: "var(--status-running)" }}
                  />
                </div>
                <div>
                  <p className="text-2xl font-semibold">12</p>
                  <p className="text-xs text-muted-foreground">Running</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--status-critical)]/10">
                  <XCircle
                    className="size-5"
                    style={{ color: "var(--status-critical)" }}
                  />
                </div>
                <div>
                  <p className="text-2xl font-semibold">3</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--status-warning)]/10">
                  <AlertTriangle
                    className="size-5"
                    style={{ color: "var(--status-warning)" }}
                  />
                </div>
                <div>
                  <p className="text-2xl font-semibold">1</p>
                  <p className="text-xs text-muted-foreground">Version Drift</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="deploy" className="space-y-6">
          <TabsList>
            <TabsTrigger value="deploy" className="gap-2">
              <Rocket className="size-4" />
              Deploy
            </TabsTrigger>
            <TabsTrigger value="observe" className="gap-2">
              <Activity className="size-4" />
              Observe
            </TabsTrigger>
            <TabsTrigger value="compliance" className="gap-2">
              <Shield className="size-4" />
              Compliance
            </TabsTrigger>
          </TabsList>

          {/* Deploy Tab */}
          <TabsContent value="deploy" className="space-y-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Services Grid */}
              <Card className="col-span-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Services</CardTitle>
                    <Badge variant="outline">{services.length} services</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {services.map((service) => (
                      <div
                        key={service.name}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`size-2 rounded-full ${
                              service.status === "healthy"
                                ? "bg-[var(--status-live)]"
                                : service.status === "drift"
                                  ? "bg-[var(--status-warning)]"
                                  : "bg-[var(--status-idle)]"
                            }`}
                          />
                          <div>
                            <EntityLink
                              type="service"
                              id={service.name}
                              label={service.name}
                              className="font-mono text-sm"
                            />
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground">
                                {service.env}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Deployed {service.lastDeploy}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-mono text-sm">
                              {service.version}
                            </div>
                            {service.version !== service.expectedVersion && (
                              <div className="text-xs text-[var(--status-warning)]">
                                Expected: {service.expectedVersion}
                              </div>
                            )}
                          </div>
                          <Button variant="ghost" size="sm">
                            <ArrowRight className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Deployments */}
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle className="text-lg">Recent Deployments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentDeploys.map((deploy, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2
                          className="size-4"
                          style={{ color: "var(--status-live)" }}
                        />
                        <div>
                          <p className="text-sm font-mono">{deploy.service}</p>
                          <p className="text-xs text-muted-foreground">
                            {deploy.version} &bull; {deploy.env}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {deploy.time}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Observe Tab */}
          <TabsContent value="observe" className="space-y-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Batch Jobs */}
              <Card className="col-span-7">
                <CardHeader>
                  <CardTitle className="text-lg">Batch Jobs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {batchJobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {job.status === "running" && (
                            <RefreshCw className="size-4 animate-spin text-[var(--status-running)]" />
                          )}
                          {job.status === "complete" && (
                            <CheckCircle2 className="size-4 text-[var(--status-live)]" />
                          )}
                          {job.status === "failed" && (
                            <XCircle className="size-4 text-[var(--status-critical)]" />
                          )}
                          <span className="font-medium">{job.name}</span>
                        </div>
                        <Badge
                          variant={
                            job.status === "complete"
                              ? "default"
                              : job.status === "running"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {job.status}
                        </Badge>
                      </div>
                      <Progress value={job.progress} className="h-2 mb-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Started: {job.startedAt}</span>
                        {job.eta && <span>{job.eta}</span>}
                        {job.completedAt && (
                          <span>Completed: {job.completedAt}</span>
                        )}
                        {job.error && (
                          <span className="text-[var(--status-critical)]">
                            {job.error}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Data Completeness Heatmap */}
              <Card className="col-span-5">
                <CardHeader>
                  <CardTitle className="text-lg">Data Completeness</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <span className="w-36">Service</span>
                      <span className="flex-1 grid grid-cols-4 gap-2 text-center">
                        <span>-3d</span>
                        <span>-2d</span>
                        <span>-1d</span>
                        <span>Today</span>
                      </span>
                    </div>
                    {dataCompleteness.map((row) => (
                      <div
                        key={row.service}
                        className="flex items-center gap-4"
                      >
                        <span className="w-36 text-sm font-mono truncate">
                          {row.service}
                        </span>
                        <div className="flex-1 grid grid-cols-4 gap-2">
                          {row.days.map((pct, i) => (
                            <div
                              key={i}
                              className={`h-6 rounded flex items-center justify-center text-xs font-medium ${
                                pct === 100
                                  ? "bg-[var(--status-live)]/20 text-[var(--status-live)]"
                                  : pct >= 80
                                    ? "bg-[var(--status-warning)]/20 text-[var(--status-warning)]"
                                    : "bg-[var(--status-critical)]/20 text-[var(--status-critical)]"
                              }`}
                            >
                              {pct}%
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Event Stream */}
            <EventStreamViewer />

            {/* Venue Connectivity */}
            <VenueConnectivity />
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Audit Trail */}
              <Card className="col-span-8">
                <CardHeader>
                  <CardTitle className="text-lg">Audit Trail</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {auditLog.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {entry.type === "config" && (
                          <Server className="size-4 text-[var(--surface-config)]" />
                        )}
                        {entry.type === "intervention" && (
                          <AlertTriangle className="size-4 text-[var(--status-warning)]" />
                        )}
                        {entry.type === "deploy" && (
                          <GitBranch className="size-4 text-[var(--surface-ops)]" />
                        )}
                        <div>
                          <p className="font-medium">{entry.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.entity} &bull; by {entry.actor}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {entry.time}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Links */}
              <div className="col-span-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Compliance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2"
                    >
                      <Shield className="size-4" />
                      MiFID II Reporting
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2"
                    >
                      <FileText className="size-4" />
                      FCA Transaction Reports
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2"
                    >
                      <CheckCircle2 className="size-4" />
                      Best Execution Checks
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">CI/CD</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2"
                    >
                      <GitBranch className="size-4" />
                      Pipeline Status
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2"
                    >
                      <CheckCircle2 className="size-4" />
                      Quality Gates
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
