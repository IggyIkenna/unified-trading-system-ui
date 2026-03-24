"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  AlertTriangle,
  Box,
  CheckCircle,
  ChevronRight,
  Clock,
  Cloud,
  Database,
  FileText,
  GitBranch,
  GitCommit,
  HardDrive,
  History,
  Layers,
  Play,
  PlayCircle,
  RefreshCw,
  Rocket,
  RotateCcw,
  Server,
  Terminal,
  XCircle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DevOpsDashboardProps {
  currentPage: string;
}

// Mock data
const systemHealth = { healthy: 42, degraded: 3, unhealthy: 2, total: 47 };

const services = [
  {
    name: "execution-service",
    status: "healthy",
    cpu: 34,
    memory: 62,
    replicas: "3/3",
    latency: "12ms",
    version: "v2.14.3",
  },
  {
    name: "market-data-api",
    status: "healthy",
    cpu: 45,
    memory: 71,
    replicas: "5/5",
    latency: "8ms",
    version: "v1.8.0",
  },
  {
    name: "ml-inference",
    status: "degraded",
    cpu: 89,
    memory: 85,
    replicas: "2/3",
    latency: "145ms",
    version: "v3.2.1",
  },
  {
    name: "risk-service",
    status: "healthy",
    cpu: 28,
    memory: 45,
    replicas: "2/2",
    latency: "23ms",
    version: "v2.1.0",
  },
  {
    name: "strategy-service",
    status: "healthy",
    cpu: 56,
    memory: 68,
    replicas: "4/4",
    latency: "18ms",
    version: "v4.5.2",
  },
  {
    name: "position-monitor",
    status: "unhealthy",
    cpu: 12,
    memory: 34,
    replicas: "0/2",
    latency: "-",
    version: "v1.2.0",
  },
  {
    name: "alerting-service",
    status: "healthy",
    cpu: 22,
    memory: 38,
    replicas: "2/2",
    latency: "5ms",
    version: "v2.0.1",
  },
  {
    name: "pnl-attribution",
    status: "healthy",
    cpu: 41,
    memory: 55,
    replicas: "2/2",
    latency: "89ms",
    version: "v1.5.4",
  },
];

const recentDeployments = [
  {
    id: "DEP-1842",
    service: "execution-service",
    version: "v2.14.3",
    env: "prod",
    status: "success",
    time: "12m ago",
    commit: "a3f7c21",
    cloud: "AWS",
  },
  {
    id: "DEP-1841",
    service: "market-data-api",
    version: "v1.8.0",
    env: "prod",
    status: "success",
    time: "45m ago",
    commit: "b2e9f45",
    cloud: "GCP",
  },
  {
    id: "DEP-1840",
    service: "ml-inference",
    version: "v3.2.1",
    env: "staging",
    status: "running",
    time: "1h ago",
    commit: "c4d8a12",
    cloud: "AWS",
  },
  {
    id: "DEP-1839",
    service: "risk-service",
    version: "v2.1.0",
    env: "prod",
    status: "failed",
    time: "2h ago",
    commit: "e7f9b34",
    cloud: "AWS",
  },
  {
    id: "DEP-1838",
    service: "strategy-service",
    version: "v4.5.2",
    env: "prod",
    status: "success",
    time: "3h ago",
    commit: "f1a2c56",
    cloud: "GCP",
  },
];

const jobs = [
  {
    id: "JOB-892",
    name: "daily-reconciliation",
    status: "running",
    progress: 67,
    startTime: "2h ago",
    duration: "45m",
    schedule: "Daily 00:00 UTC",
  },
  {
    id: "JOB-891",
    name: "feature-pipeline",
    status: "completed",
    progress: 100,
    startTime: "3h ago",
    duration: "28m",
    schedule: "Hourly",
  },
  {
    id: "JOB-890",
    name: "model-training",
    status: "queued",
    progress: 0,
    startTime: "-",
    duration: "-",
    schedule: "Weekly",
  },
  {
    id: "JOB-889",
    name: "data-backup",
    status: "completed",
    progress: 100,
    startTime: "6h ago",
    duration: "15m",
    schedule: "Daily 06:00 UTC",
  },
  {
    id: "JOB-888",
    name: "report-generation",
    status: "failed",
    progress: 34,
    startTime: "8h ago",
    duration: "12m",
    schedule: "Daily 08:00 UTC",
  },
];

const versionBranches = [
  {
    service: "execution-service",
    branches: ["main", "v2.14.x", "v2.13.x", "feat/new-algo"],
    current: "main",
  },
  {
    service: "market-data-api",
    branches: ["main", "v1.8.x", "v1.7.x", "fix/latency"],
    current: "main",
  },
  {
    service: "ml-inference",
    branches: ["main", "v3.2.x", "v3.1.x", "experiment/gpt5"],
    current: "main",
  },
  {
    service: "risk-service",
    branches: ["main", "v2.1.x", "v2.0.x"],
    current: "main",
  },
];

const alerts = [
  {
    id: 1,
    severity: "critical",
    message: "position-monitor service down (0/2 replicas)",
    time: "5m ago",
    service: "position-monitor",
  },
  {
    id: 2,
    severity: "warning",
    message: "ml-inference CPU usage at 89%",
    time: "12m ago",
    service: "ml-inference",
  },
  {
    id: 3,
    severity: "warning",
    message: "market-data-api latency spike detected",
    time: "18m ago",
    service: "market-data-api",
  },
  {
    id: 4,
    severity: "info",
    message: "Scheduled maintenance window in 2 hours",
    time: "30m ago",
    service: "system",
  },
];

const resourceUsage = {
  cpu: { current: 45, limit: 100 },
  memory: { current: 62, limit: 100 },
  storage: { current: 1.2, limit: 2.0 },
  network: { in: "1.2 GB/s", out: "890 MB/s" },
};

function getStatusIcon(status: string) {
  switch (status) {
    case "healthy":
    case "success":
    case "completed":
      return <CheckCircle className="h-4 w-4 text-positive" />;
    case "degraded":
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case "unhealthy":
    case "failed":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "running":
      return <RefreshCw className="h-4 w-4 animate-spin text-info" />;
    case "queued":
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

// Main DevOps Dashboard
function DevOpsOverview() {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">DevOps Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            Infrastructure and deployment management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
          <Button size="sm">
            <Rocket className="h-3.5 w-3.5 mr-1.5" />
            New Deploy
          </Button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-6 gap-3">
        <Card className="col-span-2">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                System Health
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-5 w-5 text-positive" />
                  <span className="text-2xl font-semibold">
                    {systemHealth.healthy}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <span className="text-2xl font-semibold">
                    {systemHealth.degraded}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="text-2xl font-semibold">
                    {systemHealth.unhealthy}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold">{systemHealth.total}</span>
              <p className="text-xs text-muted-foreground">Total Services</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              CPU Usage
            </div>
            <div className="text-xl font-bold">
              {resourceUsage.cpu.current}%
            </div>
            <Progress
              value={resourceUsage.cpu.current}
              className="mt-2 h-1.5"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Memory
            </div>
            <div className="text-xl font-bold">
              {resourceUsage.memory.current}%
            </div>
            <Progress
              value={resourceUsage.memory.current}
              className="mt-2 h-1.5"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Active Deploys
            </div>
            <div className="text-xl font-bold">2</div>
            <div className="text-[10px] text-muted-foreground mt-1">
              1 prod, 1 staging
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              Pending Alerts
            </div>
            <div className="text-xl font-bold text-warning">4</div>
            <div className="text-[10px] text-muted-foreground mt-1">
              1 critical
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 grid-cols-12">
        {/* Services */}
        <Card className="col-span-5">
          <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Box className="h-4 w-4" />
              Services
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-6 text-xs">
              View All <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[280px]">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 sticky top-0">
                  <tr className="text-muted-foreground">
                    <th className="px-3 py-2 text-left font-medium">Service</th>
                    <th className="px-3 py-2 text-center font-medium">
                      Status
                    </th>
                    <th className="px-3 py-2 text-right font-medium">CPU</th>
                    <th className="px-3 py-2 text-right font-medium">Mem</th>
                    <th className="px-3 py-2 text-right font-medium">
                      Replicas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr
                      key={service.name}
                      className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Box className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{service.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {getStatusIcon(service.status)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={cn(
                            "font-mono",
                            service.cpu > 80
                              ? "text-destructive"
                              : service.cpu > 60
                                ? "text-warning"
                                : "",
                          )}
                        >
                          {service.cpu}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={cn(
                            "font-mono",
                            service.memory > 80
                              ? "text-destructive"
                              : service.memory > 60
                                ? "text-warning"
                                : "",
                          )}
                        >
                          {service.memory}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                        {service.replicas}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Deployments */}
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              Recent Deployments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[280px]">
              {recentDeployments.map((dep, idx) => (
                <div
                  key={dep.id}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 cursor-pointer",
                    idx !== recentDeployments.length - 1 &&
                      "border-b border-border/50",
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{dep.service}</span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {dep.version}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <GitCommit className="h-3 w-3" />
                      <span className="font-mono">{dep.commit}</span>
                      <Cloud className="h-3 w-3" />
                      <span>{dep.cloud}</span>
                      <Clock className="h-3 w-3" />
                      <span>{dep.time}</span>
                    </div>
                  </div>
                  {getStatusIcon(dep.status)}
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="col-span-3 border-warning/30">
          <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Active Alerts
            </CardTitle>
            <Badge variant="destructive" className="text-[10px] px-1.5">
              4
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[280px]">
              {alerts.map((alert, idx) => (
                <div
                  key={alert.id}
                  className={cn(
                    "flex items-start gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer",
                    idx !== alerts.length - 1 && "border-b border-border/50",
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "h-3.5 w-3.5 mt-0.5 shrink-0",
                      alert.severity === "critical"
                        ? "text-destructive"
                        : alert.severity === "warning"
                          ? "text-warning"
                          : "text-info",
                    )}
                  />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs leading-tight line-clamp-2">
                      {alert.message}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {alert.service} - {alert.time}
                    </span>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Services Page
function ServicesPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Services</h1>
          <p className="text-xs text-muted-foreground">
            Service health and resource monitoring
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Service</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Version</th>
                <th className="px-4 py-3 text-right font-medium">CPU</th>
                <th className="px-4 py-3 text-right font-medium">Memory</th>
                <th className="px-4 py-3 text-right font-medium">Replicas</th>
                <th className="px-4 py-3 text-right font-medium">Latency</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr
                  key={service.name}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{service.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getStatusIcon(service.status)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[10px]">
                      {service.version}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "font-mono",
                        service.cpu > 80
                          ? "text-destructive"
                          : service.cpu > 60
                            ? "text-warning"
                            : "",
                      )}
                    >
                      {service.cpu}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "font-mono",
                        service.memory > 80
                          ? "text-destructive"
                          : service.memory > 60
                            ? "text-warning"
                            : "",
                      )}
                    >
                      {service.memory}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {service.replicas}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {service.latency}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Terminal className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// Deployments Page with Cloud Selection
function DeploymentsPage() {
  const [selectedCloud, setSelectedCloud] = React.useState("all");
  const [selectedEnv, setSelectedEnv] = React.useState("all");

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Deployments</h1>
          <p className="text-xs text-muted-foreground">
            Deployment history and management
          </p>
        </div>
        <Button size="sm">
          <Rocket className="h-3.5 w-3.5 mr-1.5" />
          New Deployment
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select value={selectedCloud} onValueChange={setSelectedCloud}>
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue placeholder="Cloud" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clouds</SelectItem>
            <SelectItem value="aws">AWS</SelectItem>
            <SelectItem value="gcp">GCP</SelectItem>
            <SelectItem value="azure">Azure</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedEnv} onValueChange={setSelectedEnv}>
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue placeholder="Environment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Environments</SelectItem>
            <SelectItem value="prod">Production</SelectItem>
            <SelectItem value="staging">Staging</SelectItem>
            <SelectItem value="dev">Development</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Deployment</th>
                <th className="px-4 py-3 text-left font-medium">Service</th>
                <th className="px-4 py-3 text-center font-medium">Version</th>
                <th className="px-4 py-3 text-center font-medium">
                  Environment
                </th>
                <th className="px-4 py-3 text-center font-medium">Cloud</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Time</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentDeployments.map((dep) => (
                <tr
                  key={dep.id}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {dep.id}
                      </span>
                      <GitCommit className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-xs">{dep.commit}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{dep.service}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[10px]">
                      {dep.version}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={dep.env === "prod" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {dep.env.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[10px]">
                      {dep.cloud}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getStatusIcon(dep.status)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {dep.time}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Rollback
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// Jobs Page
function JobsPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Batch Jobs</h1>
          <p className="text-xs text-muted-foreground">
            Scheduled and ad-hoc job management
          </p>
        </div>
        <Button size="sm">
          <Play className="h-3.5 w-3.5 mr-1.5" />
          Run Job
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Job</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Progress</th>
                <th className="px-4 py-3 text-left font-medium">Schedule</th>
                <th className="px-4 py-3 text-right font-medium">Started</th>
                <th className="px-4 py-3 text-right font-medium">Duration</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{job.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {job.id}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getStatusIcon(job.status)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Progress value={job.progress} className="h-1.5 w-20" />
                      <span className="text-xs font-mono">{job.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">{job.schedule}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {job.startTime}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {job.duration}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// Health Page
function HealthPage() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold">System Health</h1>
        <p className="text-xs text-muted-foreground">
          Overall infrastructure health monitoring
        </p>
      </div>

      <div className="grid gap-4 grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-positive mx-auto" />
            <div className="text-3xl font-bold mt-2">
              {systemHealth.healthy}
            </div>
            <div className="text-xs text-muted-foreground">Healthy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-warning mx-auto" />
            <div className="text-3xl font-bold mt-2">
              {systemHealth.degraded}
            </div>
            <div className="text-xs text-muted-foreground">Degraded</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="h-8 w-8 text-destructive mx-auto" />
            <div className="text-3xl font-bold mt-2">
              {systemHealth.unhealthy}
            </div>
            <div className="text-xs text-muted-foreground">Unhealthy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Server className="h-8 w-8 text-muted-foreground mx-auto" />
            <div className="text-3xl font-bold mt-2">{systemHealth.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cluster Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">CPU</span>
                <span className="font-mono">{resourceUsage.cpu.current}%</span>
              </div>
              <Progress value={resourceUsage.cpu.current} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Memory</span>
                <span className="font-mono">
                  {resourceUsage.memory.current}%
                </span>
              </div>
              <Progress value={resourceUsage.memory.current} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Storage</span>
                <span className="font-mono">
                  {resourceUsage.storage.current}TB /{" "}
                  {resourceUsage.storage.limit}TB
                </span>
              </div>
              <Progress
                value={
                  (resourceUsage.storage.current /
                    resourceUsage.storage.limit) *
                  100
                }
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Network I/O</span>
                <span className="font-mono text-xs">
                  {resourceUsage.network.in} in / {resourceUsage.network.out}{" "}
                  out
                </span>
              </div>
              <Progress value={65} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Logs Page
function LogsPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Logs</h1>
          <p className="text-xs text-muted-foreground">
            Service and system logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[160px] h-8">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map((s) => (
                <SelectItem key={s.name} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select defaultValue="info">
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="font-mono text-xs bg-muted/30 p-4 h-[500px] overflow-auto">
            <div className="text-muted-foreground">
              [2024-01-15 14:32:15] [INFO] [execution-service] Order executed:
              BUY 0.5 BTC @ 43245
            </div>
            <div className="text-muted-foreground">
              [2024-01-15 14:32:14] [INFO] [risk-service] Position updated for
              btc-basis-v3
            </div>
            <div className="text-warning">
              [2024-01-15 14:32:12] [WARN] [ml-inference] High latency detected:
              145ms
            </div>
            <div className="text-muted-foreground">
              [2024-01-15 14:32:10] [INFO] [market-data-api] Tick received:
              BTC-USD 43245
            </div>
            <div className="text-destructive">
              [2024-01-15 14:32:08] [ERROR] [position-monitor] Failed to connect
              to database
            </div>
            <div className="text-muted-foreground">
              [2024-01-15 14:32:05] [INFO] [alerting-service] Alert triggered:
              margin_utilization_high
            </div>
            <div className="text-muted-foreground">
              [2024-01-15 14:32:02] [DEBUG] [strategy-service] Processing signal
              for eth-staked
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Rollback Page
function RollbackPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Rollback Center</h1>
          <p className="text-xs text-muted-foreground">
            Version management and rollback
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Service Versions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {versionBranches.map((svc) => (
              <div
                key={svc.service}
                className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Box className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{svc.service}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Select defaultValue={svc.current}>
                    <SelectTrigger className="w-[180px] h-8">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {svc.branches.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-3 w-3" />
                            {branch}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                    Rollback
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function DevOpsDashboard({ currentPage }: DevOpsDashboardProps) {
  switch (currentPage) {
    case "services":
      return <ServicesPage />;
    case "deployments":
      return <DeploymentsPage />;
    case "jobs":
      return <JobsPage />;
    case "health":
      return <HealthPage />;
    case "logs":
      return <LogsPage />;
    case "rollback":
      return <RollbackPage />;
    case "dashboard":
    default:
      return <DevOpsOverview />;
  }
}
