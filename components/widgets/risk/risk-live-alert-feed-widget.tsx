"use client";

import { Badge } from "@/components/ui/badge";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { useRiskAlertNotifications } from "@/hooks/api/use-risk-alert-notifications";
import type { RiskAlertStreamEvent } from "@/hooks/api/use-sse-channels";
import type { WidgetComponentProps } from "../widget-registry";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Severity styles
// ---------------------------------------------------------------------------

const SEVERITY_STYLES: Record<RiskAlertStreamEvent["severity"], { badge: string; border: string; dot: string }> = {
  CRITICAL: {
    badge: "bg-rose-500/20 text-rose-400",
    border: "border-l-rose-500",
    dot: "bg-rose-500",
  },
  WARNING: {
    badge: "bg-amber-500/20 text-amber-400",
    border: "border-l-amber-500",
    dot: "bg-amber-500",
  },
  INFO: {
    badge: "bg-sky-500/20 text-sky-400",
    border: "border-l-sky-500",
    dot: "bg-sky-500",
  },
};

function formatAlertTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "UTC",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

export function RiskLiveAlertFeedWidget(_props: WidgetComponentProps) {
  const { alertFeed, isConnected, isActive, clearFeed } = useRiskAlertNotifications();

  if (!isActive) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        Switch to Live mode for real-time alerts
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b shrink-0">
        <div className="flex items-center gap-2">
          <span
            className={cn("size-2 rounded-full", isConnected ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground")}
          />
          <span className="text-micro text-muted-foreground">{isConnected ? "Live" : "Disconnected"}</span>
        </div>
        {alertFeed.length > 0 && (
          <button
            onClick={clearFeed}
            className="text-micro text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear ({alertFeed.length})
          </button>
        )}
      </div>

      {/* Feed */}
      {alertFeed.length === 0 ? (
        <div className="flex items-center justify-center flex-1 text-xs text-muted-foreground">No alerts yet</div>
      ) : (
        <WidgetScroll axes="vertical">
          <div className="space-y-1 p-1">
            {alertFeed.map((alert) => {
              const style = SEVERITY_STYLES[alert.severity];
              return (
                <div key={alert.alert_id} className={cn("rounded-md border border-l-2 bg-card p-2", style.border)}>
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("size-1.5 rounded-full shrink-0", style.dot)} />
                      <Badge className={cn("text-nano h-4", style.badge)}>{alert.severity}</Badge>
                      <span className="text-micro font-medium truncate">{alert.category}</span>
                    </div>
                    <span className="text-nano text-muted-foreground whitespace-nowrap">
                      {formatAlertTime(alert.timestamp)}
                    </span>
                  </div>
                  <p className="text-micro text-muted-foreground leading-tight">{alert.message}</p>
                  {alert.strategy_id && (
                    <span className="text-nano text-muted-foreground mt-0.5 block">Strategy: {alert.strategy_id}</span>
                  )}
                </div>
              );
            })}
          </div>
        </WidgetScroll>
      )}
    </div>
  );
}
