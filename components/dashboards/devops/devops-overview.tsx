"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Box,
  CheckCircle,
  ChevronRight,
  Clock,
  Cloud,
  GitCommit,
  RefreshCw,
  Rocket,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { alerts, recentDeployments, resourceUsage, services, systemHealth } from "./devops-data";
import { getStatusIcon } from "./devops-status-icon";

export function DevOpsOverview() {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">DevOps Dashboard</h1>
          <p className="text-xs text-muted-foreground">Infrastructure and deployment management</p>
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
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">System Health</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-5 w-5 text-positive" />
                  <span className="text-2xl font-semibold">{systemHealth.healthy}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <span className="text-2xl font-semibold">{systemHealth.degraded}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="text-2xl font-semibold">{systemHealth.unhealthy}</span>
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
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">CPU Usage</div>
            <div className="text-xl font-bold">{resourceUsage.cpu.current}%</div>
            <Progress value={resourceUsage.cpu.current} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Memory</div>
            <div className="text-xl font-bold">{resourceUsage.memory.current}%</div>
            <Progress value={resourceUsage.memory.current} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Active Deploys</div>
            <div className="text-xl font-bold">2</div>
            <div className="text-[10px] text-muted-foreground mt-1">1 prod, 1 staging</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Pending Alerts</div>
            <div className="text-xl font-bold text-warning">4</div>
            <div className="text-[10px] text-muted-foreground mt-1">1 critical</div>
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
                    <th className="px-3 py-2 text-center font-medium">Status</th>
                    <th className="px-3 py-2 text-right font-medium">CPU</th>
                    <th className="px-3 py-2 text-right font-medium">Mem</th>
                    <th className="px-3 py-2 text-right font-medium">Replicas</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.name} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Box className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{service.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">{getStatusIcon(service.status)}</td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={cn(
                            "font-mono",
                            service.cpu > 80 ? "text-destructive" : service.cpu > 60 ? "text-warning" : "",
                          )}
                        >
                          {service.cpu}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={cn(
                            "font-mono",
                            service.memory > 80 ? "text-destructive" : service.memory > 60 ? "text-warning" : "",
                          )}
                        >
                          {service.memory}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">{service.replicas}</td>
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
                    idx !== recentDeployments.length - 1 && "border-b border-border/50",
                  )}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{dep.service}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
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
                    <span className="text-xs leading-tight line-clamp-2">{alert.message}</span>
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
