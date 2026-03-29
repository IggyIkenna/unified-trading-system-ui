"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusDot } from "@/components/shared/status-badge";

type HealthStatus = "live" | "warning" | "critical" | "idle";

export interface ServiceHealth {
  name: string;
  freshness: number; // seconds
  sla: number; // seconds
  status: HealthStatus;
}

interface HealthStatusGridProps {
  services: ServiceHealth[];
  onServiceClick?: (serviceName: string) => void;
  className?: string;
}

function getStatus(freshness: number, sla: number): HealthStatus {
  if (freshness <= 0) return "idle";
  if (freshness <= sla) return "live";
  if (freshness <= sla * 2) return "warning";
  return "critical";
}

function formatFreshness(seconds: number): string {
  if (seconds <= 0) return "--";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

export function HealthStatusGrid({ services, onServiceClick, className }: HealthStatusGridProps) {
  return (
    <div className={cn("border border-border rounded-lg overflow-hidden", className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Service</TableHead>
            <TableHead className="font-semibold text-right">Freshness</TableHead>
            <TableHead className="font-semibold text-right">SLA</TableHead>
            <TableHead className="font-semibold text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => {
            const status = getStatus(service.freshness, service.sla);
            const isOverSLA = service.freshness > service.sla && service.freshness > 0;

            return (
              <TableRow
                key={service.name}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-muted/30",
                  isOverSLA && "bg-[var(--status-warning)]/5",
                )}
                onClick={() => onServiceClick?.(service.name)}
              >
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell className={cn("text-right font-mono tabular-nums", isOverSLA && "status-warning")}>
                  {formatFreshness(service.freshness)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                  {formatFreshness(service.sla)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-1.5">
                    <StatusDot status={status} />
                    <span className="text-xs">
                      {status === "live"
                        ? "ok"
                        : status === "warning"
                          ? "lag"
                          : status === "critical"
                            ? "STALE"
                            : "idle"}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
