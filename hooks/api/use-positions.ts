import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { typedFetch, type GatewayApiResponse } from "@/lib/api/typed-fetch";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";
import {
  usePositionStream,
  type PositionStreamEvent,
} from "./use-sse-channels";

type PositionsResponse = GatewayApiResponse<"/api/positions/active">;
type PositionsSummaryResponse = GatewayApiResponse<"/api/positions/summary">;
type BalancesResponse = GatewayApiResponse<"/api/positions/balances">;

/** Polling interval used as fallback when SSE is not connected (ms). */
const REST_POLL_INTERVAL_MS = 10_000;

/**
 * Merge an SSE position update into the cached positions response.
 *
 * The REST response is `{ [key: string]: unknown }` — in practice an object
 * with a `positions` array.  We match by instrument+venue and patch in-place;
 * if no match is found the event is appended (new position opened).
 */
function mergePositionEvent(
  prev: PositionsResponse | undefined,
  event: PositionStreamEvent,
): PositionsResponse | undefined {
  if (!prev) return prev;

  // The response object is untyped (`Record<string, unknown>`).  The
  // gateway returns `{ positions: [...], ... }` by convention.
  const raw = prev as Record<string, unknown>;
  const positions = Array.isArray(raw["positions"])
    ? ([...raw["positions"]] as Record<string, unknown>[])
    : undefined;

  if (!positions) return prev;

  const idx = positions.findIndex(
    (p) => p["instrument"] === event.instrument && p["venue"] === event.venue,
  );

  const patch: Record<string, unknown> = {
    instrument: event.instrument,
    venue: event.venue,
    side: event.side,
    quantity: event.quantity,
    entry_price: event.entry_price,
    mark_price: event.mark_price,
    unrealised_pnl: event.unrealised_pnl,
    timestamp: event.timestamp,
  };

  if (idx >= 0) {
    positions[idx] = { ...positions[idx], ...patch };
  } else {
    positions.push(patch);
  }

  return { ...raw, positions } as PositionsResponse;
}

export function usePositions(mode?: string, asOf?: string) {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();
  const queryClient = useQueryClient();

  const params = new URLSearchParams();
  if (mode) params.set("mode", mode);
  if (asOf) params.set("as_of", asOf);
  const qs = params.toString();

  // Resolve effective mode: explicit param wins, then global scope.
  const effectiveMode = mode ?? scope.mode;
  const isLive = effectiveMode === "live";

  // SSE stream — only active in live mode.
  const { isConnected: sseConnected } = usePositionStream({
    enabled: !!user && isLive,
    onMessage: (event) => {
      queryClient.setQueryData<PositionsResponse>(
        ["positions", mode, asOf, user?.id],
        (prev) => mergePositionEvent(prev, event),
      );
    },
  });

  // Fall back to REST polling when SSE is not connected in live mode.
  const pollInterval =
    isLive && !sseConnected ? REST_POLL_INTERVAL_MS : false;

  return useQuery<PositionsResponse>({
    queryKey: ["positions", mode, asOf, user?.id],
    queryFn: () =>
      typedFetch<PositionsResponse>(
        `/api/positions/active${qs ? `?${qs}` : ""}`,
        token,
      ),
    enabled: !!user,
    refetchInterval: pollInterval,
  });
}

export function usePositionsSummary() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();
  const queryClient = useQueryClient();

  const isLive = scope.mode === "live";

  // SSE events update the summary cache by invalidating it so React Query
  // re-fetches the aggregated summary from the gateway.  We debounce the
  // invalidation to avoid hammering the API on rapid-fire events.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isConnected: sseConnected } = usePositionStream({
    enabled: !!user && isLive,
    onMessage: () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["positions-summary", user?.id] });
      }, 1_000);
    },
  });

  // Cleanup debounce timer on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const pollInterval =
    isLive && !sseConnected ? REST_POLL_INTERVAL_MS : false;

  return useQuery<PositionsSummaryResponse>({
    queryKey: ["positions-summary", user?.id],
    queryFn: () =>
      typedFetch<PositionsSummaryResponse>("/api/positions/summary", token),
    enabled: !!user,
    refetchInterval: pollInterval,
  });
}

export function useBalances() {
  const { user, token } = useAuth();
  const scope = useWorkspaceScope();
  const queryClient = useQueryClient();

  const isLive = scope.mode === "live";

  // Reuse position stream to keep balances fresh — a position change implies
  // balance change.  Debounce invalidation like the summary hook.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isConnected: sseConnected } = usePositionStream({
    enabled: !!user && isLive,
    onMessage: () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["balances", user?.id] });
      }, 1_000);
    },
  });

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const pollInterval =
    isLive && !sseConnected ? REST_POLL_INTERVAL_MS : false;

  return useQuery<BalancesResponse>({
    queryKey: ["balances", user?.id],
    queryFn: () =>
      typedFetch<BalancesResponse>("/api/positions/balances", token),
    enabled: !!user,
    refetchInterval: pollInterval,
  });
}
