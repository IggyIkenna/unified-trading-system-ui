"use client";

import { useState, useRef, useCallback, useEffect, useId } from "react";
import { useAuth } from "@/hooks/use-auth";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import { registerConnection, unregisterConnection } from "@/hooks/use-protocol-status";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseSSEOptions<T> {
  /** Whether the SSE connection is enabled (default: true). */
  enabled?: boolean;
  /** Called on every incoming event with the parsed payload. */
  onMessage?: (data: T) => void;
  /** Called when the EventSource emits an error. */
  onError?: (error: Event) => void;
  /**
   * When `isMockDataMode()` is true, this generator supplies simulated events
   * that are emitted on a 2-5 s random interval.
   */
  mockGenerator?: () => T[];
}

export interface UseSSEReturn<T> {
  /** Most recently received event payload. */
  data: T | null;
  /** Alias kept for symmetry — identical to `data`. */
  lastEvent: T | null;
  /** Whether the EventSource is currently open. */
  isConnected: boolean;
  /** Last error event, if any. */
  error: Event | null;
  /** Number of automatic reconnections that have occurred. */
  reconnectCount: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;
const HEARTBEAT_TIMEOUT_MS = 60_000;
const MOCK_MIN_INTERVAL_MS = 2_000;
const MOCK_MAX_INTERVAL_MS = 5_000;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Generic React hook for consuming Server-Sent Events.
 *
 * Features:
 * - Auto-reconnect with exponential backoff (1 s -> 30 s cap).
 * - Mock-mode interception via `mockGenerator`.
 * - Heartbeat monitoring — reconnects if silent for 60 s.
 * - Auth token injection via the same `useAuth()` pattern used by API hooks.
 * - Cleanup on unmount.
 */
export function useSSE<T>(
  path: string,
  options: UseSSEOptions<T> = {},
): UseSSEReturn<T> {
  const {
    enabled = true,
    onMessage,
    onError,
    mockGenerator,
  } = options;

  const { token } = useAuth();
  const isMock = typeof window !== "undefined" && isMockDataMode();
  const connId = useId();

  // State
  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  // Refs for stable callbacks & timers
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(INITIAL_BACKOFF_MS);
  const mockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep callback refs fresh
  useEffect(() => {
    onMessageRef.current = onMessage;
  });
  useEffect(() => {
    onErrorRef.current = onError;
  });

  // Register connection status with protocol indicator
  useEffect(() => {
    if (enabled) {
      registerConnection(connId, "SSE", isConnected);
    }
    return () => {
      unregisterConnection(connId);
    };
  }, [connId, enabled, isConnected]);

  // ---------------------------------------------------------------------------
  // Heartbeat helpers
  // ---------------------------------------------------------------------------
  const resetHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) clearTimeout(heartbeatTimerRef.current);
    heartbeatTimerRef.current = setTimeout(() => {
      // No event for 60 s — force reconnect
      esRef.current?.close();
    }, HEARTBEAT_TIMEOUT_MS);
  }, []);

  // ---------------------------------------------------------------------------
  // Real SSE connection
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!enabled || isMock) return;

    let disposed = false;

    function connect() {
      if (disposed) return;

      // Build URL with auth token as query param (EventSource does not support
      // custom headers; the gateway accepts `token` as a query parameter).
      const baseUrl = path.startsWith("http") ? path : path;
      const separator = baseUrl.includes("?") ? "&" : "?";
      const url = token ? `${baseUrl}${separator}token=${encodeURIComponent(token)}` : baseUrl;

      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        if (disposed) return;
        setIsConnected(true);
        setError(null);
        backoffRef.current = INITIAL_BACKOFF_MS;
        resetHeartbeat();
      };

      es.onmessage = (event: MessageEvent) => {
        if (disposed) return;
        resetHeartbeat();
        try {
          const parsed = JSON.parse(event.data as string) as T;
          setData(parsed);
          onMessageRef.current?.(parsed);
        } catch {
          // Non-JSON payload — ignore
        }
      };

      es.onerror = (evt: Event) => {
        if (disposed) return;
        setIsConnected(false);
        setError(evt);
        onErrorRef.current?.(evt);
        es.close();
        esRef.current = null;

        if (heartbeatTimerRef.current) clearTimeout(heartbeatTimerRef.current);

        // Exponential backoff reconnect
        const delay = backoffRef.current;
        backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
        setReconnectCount((c) => c + 1);
        reconnectTimerRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      disposed = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (heartbeatTimerRef.current) clearTimeout(heartbeatTimerRef.current);
      esRef.current?.close();
      esRef.current = null;
      setIsConnected(false);
    };
  }, [enabled, isMock, path, token, resetHeartbeat]);

  // ---------------------------------------------------------------------------
  // Mock mode: emit simulated events from mockGenerator
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!enabled || !isMock || !mockGenerator) return;

    let disposed = false;
    const items = mockGenerator();
    let idx = 0;

    setIsConnected(true);

    function tick() {
      if (disposed || items.length === 0) return;
      const item = items[idx % items.length];
      setData(item);
      onMessageRef.current?.(item);
      idx += 1;

      const delay =
        MOCK_MIN_INTERVAL_MS +
        Math.random() * (MOCK_MAX_INTERVAL_MS - MOCK_MIN_INTERVAL_MS);
      mockTimerRef.current = setTimeout(tick, delay);
    }

    // Emit first event immediately
    tick();

    return () => {
      disposed = true;
      if (mockTimerRef.current) clearTimeout(mockTimerRef.current);
      setIsConnected(false);
    };
  }, [enabled, isMock, mockGenerator]);

  return {
    data,
    lastEvent: data,
    isConnected,
    error,
    reconnectCount,
  };
}
