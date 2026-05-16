"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/spinner";
import type { WidgetComponentProps } from "../widget-registry";
import type { Alert, AlertSeverity } from "../alerts/alerts-data-context";
import { useAlertsData } from "../alerts/alerts-data-context";
import { AlertCircle, AlertTriangle, Bell, ExternalLink, Info, XCircle } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import Link from "next/link";

const ALERT_SEVERITY_RANK: Record<AlertSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const ALERT_SEVERITY_META: Record<
  AlertSeverity,
  { label: string; chipClass: string; iconClass: string; Icon: typeof XCircle }
> = {
  critical: {
    label: "CRIT",
    chipClass: "text-rose-400 border-rose-400/40 bg-rose-400/10",
    iconClass: "text-rose-400",
    Icon: XCircle,
  },
  high: {
    label: "HIGH",
    chipClass: "text-amber-400 border-amber-400/40 bg-amber-400/10",
    iconClass: "text-amber-400",
    Icon: AlertTriangle,
  },
  medium: {
    label: "MED",
    chipClass: "text-sky-400 border-sky-400/40 bg-sky-400/10",
    iconClass: "text-sky-400",
    Icon: AlertCircle,
  },
  low: {
    label: "LOW",
    chipClass: "text-zinc-400 border-zinc-400/40 bg-zinc-400/10",
    iconClass: "text-zinc-400",
    Icon: Bell,
  },
  info: {
    label: "INFO",
    chipClass: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
    iconClass: "text-emerald-400",
    Icon: Info,
  },
};

function alertTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function AlertsPreviewWidget(_props: WidgetComponentProps) {
  const { alerts, isLoading } = useAlertsData();

  const activeAlerts = React.useMemo(() => alerts.filter((a) => a.status === "active"), [alerts]);

  const severityCounts = React.useMemo(() => {
    const counts: Record<AlertSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const a of activeAlerts) counts[a.severity] += 1;
    return counts;
  }, [activeAlerts]);

  const recentAlerts = React.useMemo(() => {
    return [...activeAlerts]
      .sort((a, b) => {
        const r = ALERT_SEVERITY_RANK[a.severity] - ALERT_SEVERITY_RANK[b.severity];
        if (r !== 0) return r;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      })
      .slice(0, 3);
  }, [activeAlerts]);

  const hasCounts = activeAlerts.length > 0;

  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Bell className="size-3.5" />
          <span>{hasCounts ? `${activeAlerts.length} active` : "All clear"}</span>
        </div>
        <Link href="/services/workspace?surface=terminal&tm=command">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View All
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Spinner className="size-4 mr-2" />
        </div>
      ) : !hasCounts ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-xs">No active alerts</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(Object.keys(ALERT_SEVERITY_META) as AlertSeverity[])
              .filter((sev) => severityCounts[sev] > 0)
              .map((sev) => {
                const meta = ALERT_SEVERITY_META[sev];
                return (
                  <Badge
                    key={sev}
                    variant="outline"
                    className={cn("text-nano px-1.5 py-0 h-5 font-mono gap-1", meta.chipClass)}
                  >
                    <span>{meta.label}</span>
                    <span className="font-semibold">{severityCounts[sev]}</span>
                  </Badge>
                );
              })}
          </div>

          <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto">
            {recentAlerts.map((a: Alert) => {
              const meta = ALERT_SEVERITY_META[a.severity];
              const Icon = meta.Icon;
              return (
                <div
                  key={a.id}
                  className="flex items-start gap-2 rounded-md border border-border/40 hover:border-border hover:bg-muted/30 transition-colors px-2 py-1.5 group"
                >
                  <Icon className={cn("size-3.5 mt-0.5 shrink-0", meta.iconClass)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate select-text">{a.title}</div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-nano text-muted-foreground select-text">
                      <span className="font-mono truncate">{a.source}</span>
                      <span>·</span>
                      <span suppressHydrationWarning>{alertTimeAgo(a.timestamp)}</span>
                    </div>
                  </div>
                  <Link
                    href="/services/workspace?surface=terminal&tm=command"
                    className="shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="View in alerts tab"
                  >
                    <ExternalLink className="size-3.5 text-muted-foreground hover:text-foreground" />
                  </Link>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
