"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { isMockDataMode } from "@/lib/runtime/data-mode";

export type WebSocketStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

interface WebSocketMessage {
  channel?: string;
  type?: string;
  instrument?: string;
  price?: number;
  volume?: number;
  bid?: number;
  ask?: number;
  timestamp?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

interface UseWebSocketOptions {
  url: string;
  enabled?: boolean;
  onMessage?: (msg: WebSocketMessage) => void;
  reconnectInterval?: number;
}

export function useWebSocket({
  url,
  enabled = true,
  onMessage,
  reconnectInterval = 5000,
}: UseWebSocketOptions) {
  // Disable WebSocket in static mock mode — no backend to connect to
  const isMockMode = typeof window !== "undefined" && isMockDataMode();
  if (isMockMode) enabled = false;
  const [status, setStatus] = useState<WebSocketStatus>("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);

  // Sync callback ref in effect (React 19 strict mode compliant)
  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    if (!enabled) {
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }

    let disposed = false;

    function connect() {
      if (disposed || wsRef.current?.readyState === WebSocket.OPEN) return;

      try {
        setStatus("connecting");
        const ws = new WebSocket(url);

        ws.onopen = () => {
          if (!disposed) setStatus("connected");
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data) as WebSocketMessage;
            onMessageRef.current?.(msg);
          } catch {
            // non-JSON message
          }
        };

        ws.onclose = () => {
          if (disposed) return;
          setStatus("disconnected");
          wsRef.current = null;
          reconnectTimerRef.current = setTimeout(connect, reconnectInterval);
        };

        ws.onerror = () => {
          setStatus("error");
          ws.close();
        };

        wsRef.current = ws;
      } catch {
        if (!disposed) setStatus("error");
      }
    }

    connect();

    return () => {
      disposed = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [enabled, url, reconnectInterval]);

  const send = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const subscribe = useCallback(
    (instruments: string[]) => {
      send({ action: "subscribe", instruments });
    },
    [send],
  );

  const unsubscribe = useCallback(
    (instruments: string[]) => {
      send({ action: "unsubscribe", instruments });
    },
    [send],
  );

  return { status, send, subscribe, unsubscribe };
}
