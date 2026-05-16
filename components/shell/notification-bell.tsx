"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { typedFetch } from "@/lib/api/typed-fetch";
import { cn } from "@/lib/utils";
import { AlertDetailModal, type AlertDetailModalProps } from "@/components/widgets/alerts/alert-detail-modal";
import type { Alert as ContextAlert, AlertType } from "@/components/widgets/alerts/alerts-data-context";

/** Wire-format alert as returned by `GET /api/alerts/active`. */
interface BellAlert {
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  status?: "active" | "acknowledged" | "resolved" | "muted";
  message?: string;
  title?: string;
  description?: string;
  source?: string;
  entity?: string;
  alertType?: AlertType;
  timestamp: string;
  acknowledged?: boolean;
  value?: string;
  threshold?: string;
  recommendedAction?: string;
}

const severityColors: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-blue-500",
  info: "bg-blue-500",
};

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * Coerce the wire-format alert into the canonical context shape so the
 * AlertDetailModal can be reused without per-call adapters. Defaults are
 * conservative: missing alertType becomes GENERIC, missing status becomes
 * `active` (the bell only ever shows unacknowledged alerts so this is the
 * right default).
 */
function toContextAlert(a: BellAlert): ContextAlert {
  const titleFromMessage = a.message?.split(": ")[0];
  return {
    id: a.id,
    severity: a.severity === "info" ? "info" : a.severity,
    status: a.status ?? (a.acknowledged ? "acknowledged" : "active"),
    title: a.title ?? titleFromMessage ?? a.message ?? a.id,
    description: a.description ?? a.message ?? "",
    source: a.source ?? "alerting-service",
    entity: a.entity ?? "",
    alertType: a.alertType ?? ("GENERIC" as AlertType),
    timestamp: a.timestamp,
    value: a.value,
    threshold: a.threshold,
    recommendedAction: a.recommendedAction,
  };
}

/**
 * Poll interval for the active alerts panel. Plan spec
 * `unified-trading-pm/plans/active/alerting_service_live_rules_2026_05_07.md`
 * Phase 5: 10s. Exposed for unit tests + analytics.
 */
export const ACTIVE_ALERTS_POLL_INTERVAL_MS = 10_000;

export function NotificationBell() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAlert, setSelectedAlert] = React.useState<ContextAlert | null>(null);

  const { data: alerts } = useQuery<BellAlert[]>({
    queryKey: ["alerts-active", user?.id],
    queryFn: async () => {
      try {
        const res = await typedFetch<{ alerts: BellAlert[] }>("/api/alerts/active?acknowledged=false", token);
        return (res as { alerts: BellAlert[] })?.alerts ?? [];
      } catch {
        return [];
      }
    },
    enabled: !!user,
    refetchInterval: ACTIVE_ALERTS_POLL_INTERVAL_MS,
  });

  const ackMutation = useMutation({
    mutationFn: (alertId: string) =>
      typedFetch<unknown>(`/api/alerts/${alertId}/acknowledge`, token, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts-active"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const escalateMutation = useMutation({
    mutationFn: (alertId: string) =>
      typedFetch<unknown>(`/api/alerts/${alertId}/escalate`, token, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts-active"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (alertId: string) =>
      typedFetch<unknown>(`/api/alerts/${alertId}/resolve`, token, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts-active"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const allAlerts = alerts ?? [];
  // Plan spec: badge count = unack-critical (operator pages on critical only;
  // medium/high stay visible in the dropdown but don't drive the badge).
  const criticalCount = allAlerts.filter((a) => a.severity === "critical").length;
  const totalCount = allAlerts.length;
  const recentAlerts = allAlerts.slice(0, 5);

  const modalActions: Pick<
    AlertDetailModalProps,
    "onAcknowledge" | "onEscalate" | "onResolve" | "acknowledgePending" | "escalatePending" | "resolvePending"
  > = {
    onAcknowledge: (id: string) => ackMutation.mutate(id),
    onEscalate: (a) => escalateMutation.mutate(a.id),
    onResolve: (id: string) => resolveMutation.mutate(id),
    acknowledgePending: ackMutation.isPending,
    escalatePending: escalateMutation.isPending,
    resolvePending: resolveMutation.isPending,
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative size-8"
            aria-label={
              criticalCount > 0
                ? `${criticalCount} unacknowledged critical alert${criticalCount === 1 ? "" : "s"}`
                : `${totalCount} active alert${totalCount === 1 ? "" : "s"}`
            }
            data-testid="notification-bell"
            data-critical-count={criticalCount}
            data-total-count={totalCount}
          >
            <Bell className="size-4" />
            {criticalCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center"
                data-testid="notification-bell-badge"
              >
                {criticalCount > 9 ? "9+" : criticalCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-1rem)]">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Active alerts</span>
            <div className="flex items-center gap-1">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="text-[10px]">
                  {criticalCount} critical
                </Badge>
              )}
              {totalCount > 0 && (
                <Badge variant="outline" className="text-[10px]">
                  {totalCount} total
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {recentAlerts.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">No active alerts</div>
          ) : (
            recentAlerts.map((alert) => (
              <DropdownMenuItem
                key={alert.id}
                data-testid="notification-bell-alert-item"
                data-alert-id={alert.id}
                data-severity={alert.severity}
                onSelect={(e) => {
                  e.preventDefault();
                  setSelectedAlert(toContextAlert(alert));
                }}
                className="flex items-start gap-2 py-2 cursor-pointer"
              >
                <span
                  className={cn("mt-1.5 size-2 rounded-full shrink-0", severityColors[alert.severity] ?? "bg-blue-500")}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{alert.title ?? alert.message ?? alert.id}</p>
                  <p className="text-[10px] text-muted-foreground">{formatRelativeTime(alert.timestamp)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    ackMutation.mutate(alert.id);
                  }}
                  title="Acknowledge"
                  aria-label={`Acknowledge ${alert.title ?? alert.id}`}
                >
                  <Check className="size-3" />
                </Button>
              </DropdownMenuItem>
            ))
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              href="/services/workspace?surface=terminal&tm=command"
              className="justify-center text-xs text-primary"
            >
              View all alerts
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDetailModal
        alert={selectedAlert}
        open={selectedAlert !== null}
        onClose={() => setSelectedAlert(null)}
        {...modalActions}
      />
    </>
  );
}
