"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Box, RefreshCw, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { services } from "./devops-data";
import { getStatusIcon } from "./devops-status-icon";

export function ServicesPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Services</h1>
          <p className="text-xs text-muted-foreground">Service health and resource monitoring</p>
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
                <tr key={service.name} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{service.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{getStatusIcon(service.status)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[10px]">
                      {service.version}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "font-mono",
                        service.cpu > 80 ? "text-destructive" : service.cpu > 60 ? "text-warning" : "",
                      )}
                    >
                      {service.cpu}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "font-mono",
                        service.memory > 80 ? "text-destructive" : service.memory > 60 ? "text-warning" : "",
                      )}
                    >
                      {service.memory}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{service.replicas}</td>
                  <td className="px-4 py-3 text-right font-mono">{service.latency}</td>
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
