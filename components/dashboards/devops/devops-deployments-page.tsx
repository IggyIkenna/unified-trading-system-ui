"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitCommit, Rocket, RotateCcw } from "lucide-react";
import { recentDeployments } from "./devops-data";
import { getStatusIcon } from "./devops-status-icon";

export function DeploymentsPage() {
  const [selectedCloud, setSelectedCloud] = React.useState("all");
  const [selectedEnv, setSelectedEnv] = React.useState("all");

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Deployments</h1>
          <p className="text-xs text-muted-foreground">Deployment history and management</p>
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
                <th className="px-4 py-3 text-center font-medium">Environment</th>
                <th className="px-4 py-3 text-center font-medium">Cloud</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Time</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentDeployments.map((dep) => (
                <tr key={dep.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{dep.id}</span>
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
                    <Badge variant={dep.env === "prod" ? "default" : "secondary"} className="text-[10px]">
                      {dep.env.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[10px]">
                      {dep.cloud}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">{getStatusIcon(dep.status)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{dep.time}</td>
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
