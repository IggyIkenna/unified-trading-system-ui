"use client";

import { useTickingNowMs } from "@/hooks/use-ticking-now";
import { StatusDot } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";

interface DataFreshnessProps {
  lastUpdated: Date | null;
  isWebSocket?: boolean;
  isBatch?: boolean;
  asOfDate?: string;
}

function getSecondsAgo(referenceMs: number, date: Date): number {
  return Math.floor((referenceMs - date.getTime()) / 1000);
}

function getStalenessColor(seconds: number): string {
  if (seconds < 5) return "text-emerald-500";
  if (seconds <= 30) return "text-amber-500";
  return "text-red-500";
}

function stalenessStatus(seconds: number): "live" | "warning" | "critical" {
  if (seconds < 5) return "live";
  if (seconds <= 30) return "warning";
  return "critical";
}

export function DataFreshness({ lastUpdated, isWebSocket = false, isBatch = false, asOfDate }: DataFreshnessProps) {
  const nowMs = useTickingNowMs(1000);
  const secondsAgo = lastUpdated && !isBatch && !isWebSocket ? getSecondsAgo(nowMs, lastUpdated) : 0;

  // Batch mode: show "As of {date}" badge
  if (isBatch) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <StatusDot status="idle" className="size-2" />
        As of {asOfDate ?? "unknown"}
      </span>
    );
  }

  // WebSocket connected: green dot + "Live" badge
  if (isWebSocket) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500">
        <StatusDot status="live" className="size-2 animate-pulse" />
        Live
      </span>
    );
  }

  // Disconnected: no lastUpdated and not batch
  if (!lastUpdated) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-red-500">
        <StatusDot status="failed" className="size-2" />
        Disconnected
      </span>
    );
  }

  // REST-fetched with staleness coloring
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", getStalenessColor(secondsAgo))}>
      <StatusDot status={stalenessStatus(secondsAgo)} className="size-2" />
      Updated {secondsAgo}s ago
    </span>
  );
}
