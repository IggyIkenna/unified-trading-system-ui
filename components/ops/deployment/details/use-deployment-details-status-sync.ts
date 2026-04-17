"use client";

import { useEffect, useRef } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { useDeployEventStream } from "@/hooks/api/use-sse-channels";
import type { DeploymentStatusData, ShardDetail } from "./deployment-details-types";

export function useDeploymentDetailsStatusSync({
  deploymentId,
  setStatus,
  setError,
  setLoading,
  refetchStatusRef,
  status,
  allShards,
  loadAllShards,
  fetchLiveHealth,
}: {
  deploymentId: string;
  setStatus: Dispatch<SetStateAction<DeploymentStatusData | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  refetchStatusRef: MutableRefObject<(() => Promise<void>) | null>;
  status: DeploymentStatusData | null;
  allShards: ShardDetail[] | null;
  loadAllShards: () => Promise<void>;
  fetchLiveHealth: () => Promise<void>;
}) {
  // SSE: deploy event stream with auto-reconnect and heartbeat monitoring.
  // Replaces the old raw EventSource block. When connected, polling slows to 30s.
  const { isConnected: sseConnected } = useDeployEventStream({
    onMessage: () => {
      refetchStatusRef.current?.();
    },
  });

  useEffect(() => {
    let mounted = true;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let pollCount = 0;
    // When SSE is connected, skip fast-poll phase and use 30s fallback polling.
    // When SSE is disconnected, use fast (3s) for first 18s then slow (15s).
    const maxFastPolls = sseConnected ? 0 : 6;
    const slowPollMs = sseConnected ? 30_000 : 15_000;
    const fastPollMs = 3_000;

    const poll = async () => {
      if (!mounted) return;

      pollCount++;
      const isFastPolling = !sseConnected && pollCount <= maxFastPolls;

      try {
        const response = await fetch(`/api/deployments/${deploymentId}?skip_logs=true&summary=true`);
        if (!mounted) return;

        if (response.ok) {
          const data = await response.json();
          setStatus((prev) => {
            if (prev?.shards && !data.shards) {
              return {
                ...data,
                shards: prev.shards,
                shards_by_category: prev.shards_by_category,
              };
            }
            return data;
          });
          setError(null);
          setLoading(false);

          const hasWorkRemaining = (data.running_shards || 0) > 0 || (data.pending_shards || 0) > 0;
          if (hasWorkRemaining && (pollCount === 1 || pollCount % 2 === 0)) {
            try {
              await fetch(`/api/deployments/${deploymentId}/refresh`, {
                method: "POST",
              });
            } catch {
              // continue polling
            }
          }

          const terminalStates = [
            "completed",
            "completed_pending_delete",
            "failed",
            "cancelled",
            "clean",
            "completed_with_warnings",
            "completed_with_errors",
          ];
          const isTerminal = terminalStates.includes(data.status) || terminalStates.includes(data.status_detail);
          if (isTerminal && !hasWorkRemaining) {
            if (pollInterval) clearInterval(pollInterval);
            pollInterval = null;
            return;
          }
        } else if (response.status === 404) {
          if (!isFastPolling) {
            setError(`Deployment ${deploymentId} not found`);
            setLoading(false);
          }
        } else {
          const err = await response.json();
          throw new Error(err.detail || "Failed to fetch status");
        }
      } catch (err) {
        if (mounted && pollCount > maxFastPolls) {
          setError(err instanceof Error ? err.message : "Failed to fetch status");
          setLoading(false);
        }
      }

      // Adjust polling interval: fast phase -> slow phase
      if (!sseConnected && isFastPolling && pollCount === maxFastPolls && pollInterval) {
        clearInterval(pollInterval);
        pollInterval = setInterval(poll, slowPollMs);
      }
    };

    refetchStatusRef.current = poll;
    poll();
    // Start polling: fast (3s) when no SSE, slow (30s) when SSE is connected
    const initialInterval = sseConnected ? slowPollMs : fastPollMs;
    pollInterval = setInterval(poll, initialInterval);

    return () => {
      mounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };
  }, [deploymentId, sseConnected, refetchStatusRef, setError, setLoading, setStatus]);

  const prevStatusRef = useRef<string | null>(null);
  useEffect(() => {
    if (!status) return;

    const terminalStates = [
      "completed",
      "completed_pending_delete",
      "failed",
      "cancelled",
      "clean",
      "completed_with_warnings",
      "completed_with_errors",
    ];
    const isNowTerminal =
      terminalStates.includes(status.status) || (status.status_detail && terminalStates.includes(status.status_detail));
    const wasNotTerminal = prevStatusRef.current && !terminalStates.includes(prevStatusRef.current);

    if (isNowTerminal && wasNotTerminal && allShards !== null) {
      void loadAllShards();
    }

    prevStatusRef.current = status.status;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omit `status` object to avoid re-running on every status poll
  }, [status?.status, status?.status_detail, loadAllShards, allShards]);

  useEffect(() => {
    if (status?.deploy_mode !== "live" || status?.status !== "running") return;
    void fetchLiveHealth();
    const interval = setInterval(() => {
      void fetchLiveHealth();
    }, 15000);
    return () => clearInterval(interval);
  }, [status?.deploy_mode, status?.status, fetchLiveHealth]);

  return { prevStatusRef, sseConnected };
}
