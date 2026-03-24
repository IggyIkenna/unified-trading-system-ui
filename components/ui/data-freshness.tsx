"use client";

import { useTickingNowMs } from "@/hooks/use-ticking-now";
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

function getDotColor(seconds: number): string {
  if (seconds < 5) return "bg-emerald-500";
  if (seconds <= 30) return "bg-amber-500";
  return "bg-red-500";
}

export function DataFreshness({
  lastUpdated,
  isWebSocket = false,
  isBatch = false,
  asOfDate,
}: DataFreshnessProps) {
  const nowMs = useTickingNowMs(1000);
  const secondsAgo =
    lastUpdated && !isBatch && !isWebSocket
      ? getSecondsAgo(nowMs, lastUpdated)
      : 0;

  // Batch mode: show "As of {date}" badge
  if (isBatch) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="size-2 rounded-full bg-slate-400" />
        As of {asOfDate ?? "unknown"}
      </span>
    );
  }

  // WebSocket connected: green dot + "Live" badge
  if (isWebSocket) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500">
        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
        Live
      </span>
    );
  }

  // Disconnected: no lastUpdated and not batch
  if (!lastUpdated) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-red-500">
        <span className="size-2 rounded-full bg-red-500" />
        Disconnected
      </span>
    );
  }

  // REST-fetched with staleness coloring
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs",
        getStalenessColor(secondsAgo),
      )}
    >
      <span className={cn("size-2 rounded-full", getDotColor(secondsAgo))} />
      Updated {secondsAgo}s ago
    </span>
  );
}
