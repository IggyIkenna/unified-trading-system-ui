"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Server, XCircle } from "lucide-react";
import { resourceUsage, systemHealth } from "./devops-data";

export function HealthPage() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold">System Health</h1>
        <p className="text-xs text-muted-foreground">Overall infrastructure health monitoring</p>
      </div>

      <div className="grid gap-4 grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-positive mx-auto" />
            <div className="text-3xl font-bold mt-2">{systemHealth.healthy}</div>
            <div className="text-xs text-muted-foreground">Healthy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-warning mx-auto" />
            <div className="text-3xl font-bold mt-2">{systemHealth.degraded}</div>
            <div className="text-xs text-muted-foreground">Degraded</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="h-8 w-8 text-destructive mx-auto" />
            <div className="text-3xl font-bold mt-2">{systemHealth.unhealthy}</div>
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
                <span className="font-mono">{resourceUsage.memory.current}%</span>
              </div>
              <Progress value={resourceUsage.memory.current} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Storage</span>
                <span className="font-mono">
                  {resourceUsage.storage.current}TB / {resourceUsage.storage.limit}TB
                </span>
              </div>
              <Progress value={(resourceUsage.storage.current / resourceUsage.storage.limit) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Network I/O</span>
                <span className="font-mono text-xs">
                  {resourceUsage.network.in} in / {resourceUsage.network.out} out
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
