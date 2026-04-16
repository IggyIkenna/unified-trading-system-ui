"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWebSocket, type WebSocketStatus } from "./use-websocket";

export interface FixtureLiveUpdate {
  fixture_id: string;
  league_id: string;
  status: string;
  minute: number | null;
  score: { home: number; away: number };
  home_team: string;
  away_team: string;
  home_short?: string;
  away_short?: string;
  odds: Record<string, Record<string, Record<string, number>>>;
  stats: {
    home: { possession: number; shots: number; shots_on_target: number; corners: number };
    away: { possession: number; shots: number; shots_on_target: number; corners: number };
  };
  timestamp: number;
}

interface UseSportsLiveUpdatesOptions {
  enabled?: boolean;
}

export function useSportsLiveUpdates({ enabled = true }: UseSportsLiveUpdatesOptions = {}) {
  const [updates, setUpdates] = useState<Map<string, FixtureLiveUpdate>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<FixtureLiveUpdate | null>(null);
  const hasSubscribed = useRef(false);

  const wsUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`
      : "ws://localhost:8004/ws";

  const onMessage = useCallback(
    (msg: Record<string, unknown>) => {
      if (msg.channel !== "sports-live" || msg.type !== "fixture-update") return;
      const data = msg.data as FixtureLiveUpdate | undefined;
      if (!data?.fixture_id) return;

      setUpdates((prev) => {
        const next = new Map(prev);
        next.set(data.fixture_id, data);
        return next;
      });
      setLastUpdate(data);
    },
    [],
  );

  const { status, send } = useWebSocket({
    url: wsUrl,
    enabled,
    onMessage,
  });

  useEffect(() => {
    if (status === "connected" && !hasSubscribed.current) {
      send({ action: "subscribe", channel: "sports-live" });
      hasSubscribed.current = true;
    }
    if (status === "disconnected" || status === "error") {
      hasSubscribed.current = false;
    }
  }, [status, send]);

  return { updates, lastUpdate, status };
}
