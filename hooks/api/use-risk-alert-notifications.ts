"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { toast } from "sonner";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";
import {
  useRiskAlertStream,
  type RiskAlertStreamEvent,
} from "@/hooks/api/use-sse-channels";

// ---------------------------------------------------------------------------
// Severity styling
// ---------------------------------------------------------------------------

const SEVERITY_CONFIG: Record<
  RiskAlertStreamEvent["severity"],
  { icon: string; label: string }
> = {
  CRITICAL: { icon: "\u{1F534}", label: "CRITICAL" },
  WARNING: { icon: "\u{1F7E1}", label: "WARNING" },
  INFO: { icon: "\u{1F535}", label: "INFO" },
};

// ---------------------------------------------------------------------------
// Alert feed accumulator — keeps the last N alerts for display in the
// risk dashboard live feed panel.
// ---------------------------------------------------------------------------

const MAX_FEED_SIZE = 50;

/**
 * Hook that subscribes to the risk-alert SSE channel and surfaces incoming
 * alerts as sonner toast notifications. Only active in "live" mode.
 *
 * Also accumulates a rolling feed of alerts for inline dashboard display.
 */
export function useRiskAlertNotifications() {
  const scope = useWorkspaceScope();
  const isLive = scope.mode === "live";

  const [alertFeed, setAlertFeed] = useState<RiskAlertStreamEvent[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const handleMessage = useCallback((event: RiskAlertStreamEvent) => {
    // Deduplicate by alert_id
    if (seenIdsRef.current.has(event.alert_id)) return;
    seenIdsRef.current.add(event.alert_id);

    // Cap the seen-IDs set so it doesn't grow unbounded
    if (seenIdsRef.current.size > MAX_FEED_SIZE * 2) {
      const entries = [...seenIdsRef.current];
      seenIdsRef.current = new Set(entries.slice(entries.length - MAX_FEED_SIZE));
    }

    // Accumulate into feed (newest first)
    setAlertFeed((prev) => [event, ...prev].slice(0, MAX_FEED_SIZE));

    // Show toast
    const cfg = SEVERITY_CONFIG[event.severity];
    const title = `${cfg.icon} Risk Alert: ${event.category}`;
    const description = [
      event.message,
      event.strategy_id ? `Strategy: ${event.strategy_id}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    switch (event.severity) {
      case "CRITICAL":
        toast.error(title, { description, duration: 10_000 });
        break;
      case "WARNING":
        toast.warning(title, { description, duration: 7_000 });
        break;
      case "INFO":
        toast.info(title, { description, duration: 5_000 });
        break;
    }
  }, []);

  const { isConnected, lastEvent } = useRiskAlertStream({
    enabled: isLive,
    onMessage: handleMessage,
  });

  // Clear feed when switching away from live mode
  useEffect(() => {
    if (!isLive) {
      setAlertFeed([]);
      seenIdsRef.current.clear();
    }
  }, [isLive]);

  return {
    /** Whether the SSE stream is connected. */
    isConnected,
    /** Whether alerts are active (live mode). */
    isActive: isLive,
    /** Rolling feed of recent alerts (newest first). */
    alertFeed,
    /** Most recently received alert event. */
    lastEvent,
    /** Clear the accumulated feed. */
    clearFeed: useCallback(() => setAlertFeed([]), []),
  };
}
