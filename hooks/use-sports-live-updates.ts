"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MOCK_FIXTURES } from "@/lib/mocks/fixtures/sports-data";
import { isMockDataMode } from "@/lib/runtime/data-mode";
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
  events: Array<{
    minute: number;
    type: string;
    team: "home" | "away";
    player: string;
    detail?: string;
  }>;
  timestamp: number;
}

interface UseSportsLiveUpdatesOptions {
  enabled?: boolean;
}

// ─── Mock Simulation Seed Data ────────────────────────────────────────────────

interface MockFixtureSeed {
  fixture_id: string;
  league_id: string;
  home_team: string;
  away_team: string;
  home_short: string;
  away_short: string;
  homePlayers: string[];
  awayPlayers: string[];
  baseOdds: { home: number; draw: number; away: number };
}

const MOCK_SEEDS: MockFixtureSeed[] = MOCK_FIXTURES.filter(
  (f) => f.status !== "FT",
).map((f) => ({
  fixture_id: f.id,
  league_id: f.league,
  home_team: f.home.name,
  away_team: f.away.name,
  home_short: f.home.shortName,
  away_short: f.away.shortName,
  homePlayers: f.lineups?.home.startingXI ?? [
    "Player 1", "Player 2", "Player 3", "Player 4", "Player 5",
    "Player 6", "Player 7", "Player 8", "Player 9", "Player 10", "Player 11",
  ],
  awayPlayers: f.lineups?.away.startingXI ?? [
    "Player 1", "Player 2", "Player 3", "Player 4", "Player 5",
    "Player 6", "Player 7", "Player 8", "Player 9", "Player 10", "Player 11",
  ],
  baseOdds: { home: 2.2, draw: 3.3, away: 3.1 },
}));

// Seeded pseudo-random for deterministic but varied results per fixture
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface SimState {
  minute: number;
  status: string;
  scoreHome: number;
  scoreAway: number;
  htScoreHome: number;
  htScoreAway: number;
  possession: number; // home possession 0-100
  shotsHome: number;
  shotsAway: number;
  shotsOnTargetHome: number;
  shotsOnTargetAway: number;
  cornersHome: number;
  cornersAway: number;
  events: Array<{
    minute: number;
    type: string;
    team: "home" | "away";
    player: string;
    detail?: string;
  }>;
  oddsHome: number;
  oddsDraw: number;
  oddsAway: number;
  htPauseTicks: number;
  rand: () => number;
}

function initSimState(seed: MockFixtureSeed, index: number): SimState {
  const rand = seededRandom(index * 7919 + 42);
  return {
    minute: 0,
    status: "NS",
    scoreHome: 0,
    scoreAway: 0,
    htScoreHome: 0,
    htScoreAway: 0,
    possession: 50,
    shotsHome: 0,
    shotsAway: 0,
    shotsOnTargetHome: 0,
    shotsOnTargetAway: 0,
    cornersHome: 0,
    cornersAway: 0,
    events: [],
    oddsHome: seed.baseOdds.home,
    oddsDraw: seed.baseOdds.draw,
    oddsAway: seed.baseOdds.away,
    htPauseTicks: 0,
    rand,
  };
}

function tickSimulation(state: SimState, seed: MockFixtureSeed): SimState {
  const s = { ...state, events: [...state.events] };
  const r = s.rand;

  // Advance minute
  s.minute += 1;

  // Status transitions
  if (s.minute === 1) {
    s.status = "1H";
  } else if (s.minute === 45) {
    s.status = "HT";
    s.htScoreHome = s.scoreHome;
    s.htScoreAway = s.scoreAway;
    return s; // Pause at HT
  } else if (s.minute === 46) {
    s.status = "2H";
  } else if (s.minute >= 90) {
    s.status = "FT";
    return s;
  }

  if (s.status === "HT") return s; // Don't generate events during HT

  // Possession drift
  s.possession = Math.max(30, Math.min(70, s.possession + (r() - 0.5) * 4));

  // Shot generation (~0.25 per minute total, split by possession)
  const homeShotChance = (s.possession / 100) * 0.28;
  const awayShotChance = ((100 - s.possession) / 100) * 0.28;

  if (r() < homeShotChance) {
    s.shotsHome += 1;
    if (r() < 0.45) s.shotsOnTargetHome += 1;
  }
  if (r() < awayShotChance) {
    s.shotsAway += 1;
    if (r() < 0.42) s.shotsOnTargetAway += 1;
  }

  // Corner generation (~0.12 per minute total)
  if (r() < 0.065) s.cornersHome += 1;
  if (r() < 0.058) s.cornersAway += 1;

  // Goal generation (~2.7 goals per 90 min average = 0.03 per minute)
  const goalProb = 0.032;
  const homeGoalBias = s.possession / 100;

  if (r() < goalProb) {
    const isHome = r() < homeGoalBias;
    const team = isHome ? "home" as const : "away" as const;
    const players = isHome ? seed.homePlayers : seed.awayPlayers;
    // Pick an attacker (indices 7-10 typically)
    const scorerIdx = 7 + Math.floor(r() * 4);
    const scorer = players[Math.min(scorerIdx, players.length - 1)];

    if (isHome) {
      s.scoreHome += 1;
      s.shotsHome += 1;
      s.shotsOnTargetHome += 1;
    } else {
      s.scoreAway += 1;
      s.shotsAway += 1;
      s.shotsOnTargetAway += 1;
    }

    // Pick an assister sometimes
    const hasAssist = r() < 0.7;
    const assistIdx = 5 + Math.floor(r() * 5);
    const assister = hasAssist ? players[Math.min(assistIdx, players.length - 1)] : undefined;

    s.events.push({
      minute: s.minute,
      type: "goal",
      team,
      player: scorer,
      detail: assister ? `assist: ${assister}` : undefined,
    });

    // Odds shift after goal: scoring team gets shorter odds
    const shiftPct = 0.15 + r() * 0.15; // 15-30%
    if (isHome) {
      s.oddsHome = Math.max(1.05, s.oddsHome * (1 - shiftPct));
      s.oddsAway = s.oddsAway * (1 + shiftPct * 0.8);
      s.oddsDraw = s.oddsDraw * (1 + shiftPct * 0.4);
    } else {
      s.oddsAway = Math.max(1.05, s.oddsAway * (1 - shiftPct));
      s.oddsHome = s.oddsHome * (1 + shiftPct * 0.8);
      s.oddsDraw = s.oddsDraw * (1 + shiftPct * 0.4);
    }
  }

  // Yellow card (~0.04 per minute = ~3.6 per match)
  if (r() < 0.04) {
    const isHome = r() < 0.5;
    const team = isHome ? "home" as const : "away" as const;
    const players = isHome ? seed.homePlayers : seed.awayPlayers;
    const playerIdx = 2 + Math.floor(r() * 8); // defenders/midfielders
    s.events.push({
      minute: s.minute,
      type: "yellow_card",
      team,
      player: players[Math.min(playerIdx, players.length - 1)],
    });
  }

  // Natural odds drift toward time decay (draw becomes less likely late)
  if (s.minute > 70) {
    s.oddsDraw *= 1.005;
  }

  // Clamp odds
  s.oddsHome = parseFloat(Math.max(1.01, s.oddsHome).toFixed(2));
  s.oddsDraw = parseFloat(Math.max(1.01, s.oddsDraw).toFixed(2));
  s.oddsAway = parseFloat(Math.max(1.01, s.oddsAway).toFixed(2));

  return s;
}

function stateToUpdate(state: SimState, seed: MockFixtureSeed): FixtureLiveUpdate {
  return {
    fixture_id: seed.fixture_id,
    league_id: seed.league_id,
    status: state.status,
    minute: state.minute,
    score: { home: state.scoreHome, away: state.scoreAway },
    home_team: seed.home_team,
    away_team: seed.away_team,
    home_short: seed.home_short,
    away_short: seed.away_short,
    odds: {
      "FT Result": {
        [`Home (${seed.home_team})`]: { bet365: state.oddsHome, pinnacle: parseFloat((state.oddsHome * (1 + (state.rand() - 0.5) * 0.02)).toFixed(2)) },
        Draw: { bet365: state.oddsDraw, pinnacle: parseFloat((state.oddsDraw * (1 + (state.rand() - 0.5) * 0.02)).toFixed(2)) },
        [`Away (${seed.away_team})`]: { bet365: state.oddsAway, pinnacle: parseFloat((state.oddsAway * (1 + (state.rand() - 0.5) * 0.02)).toFixed(2)) },
      },
    },
    stats: {
      home: {
        possession: Math.round(state.possession),
        shots: state.shotsHome,
        shots_on_target: state.shotsOnTargetHome,
        corners: state.cornersHome,
      },
      away: {
        possession: Math.round(100 - state.possession),
        shots: state.shotsAway,
        shots_on_target: state.shotsOnTargetAway,
        corners: state.cornersAway,
      },
    },
    events: state.events,
    timestamp: Date.now(),
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSportsLiveUpdates({ enabled = true }: UseSportsLiveUpdatesOptions = {}) {
  const [updates, setUpdates] = useState<Map<string, FixtureLiveUpdate>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<FixtureLiveUpdate | null>(null);
  const hasSubscribed = useRef(false);

  const isMock = typeof window !== "undefined" && isMockDataMode();

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

  // Real WebSocket — only when NOT in mock mode
  const { status: wsStatus, send } = useWebSocket({
    url: wsUrl,
    enabled: enabled && !isMock,
    onMessage,
  });

  useEffect(() => {
    if (wsStatus === "connected" && !hasSubscribed.current) {
      send({ action: "subscribe", channel: "sports-live" });
      hasSubscribed.current = true;
    }
    if (wsStatus === "disconnected" || wsStatus === "error") {
      hasSubscribed.current = false;
    }
  }, [wsStatus, send]);

  // ─── Mock simulation engine ───────────────────────────────────────────────
  const simStatesRef = useRef<Map<string, SimState> | null>(null);

  useEffect(() => {
    if (!isMock || !enabled) return;

    // Initialize simulation states once
    if (!simStatesRef.current) {
      const states = new Map<string, SimState>();
      MOCK_SEEDS.forEach((seed, idx) => {
        states.set(seed.fixture_id, initSimState(seed, idx));
      });
      simStatesRef.current = states;
    }

    const interval = setInterval(() => {
      const states = simStatesRef.current;
      if (!states) return;

      const nextUpdates = new Map<string, FixtureLiveUpdate>();
      let latestUpdate: FixtureLiveUpdate | null = null;

      for (const seed of MOCK_SEEDS) {
        const current = states.get(seed.fixture_id);
        if (!current || current.status === "FT") {
          // If FT, still emit the final state
          if (current) {
            const update = stateToUpdate(current, seed);
            nextUpdates.set(seed.fixture_id, update);
          }
          continue;
        }

        // HT pause: stay at HT for 3 ticks (15 seconds), then advance to 46
        if (current.status === "HT" && current.minute === 45) {
          if (current.htPauseTicks < 3) {
            const paused = { ...current, htPauseTicks: current.htPauseTicks + 1 };
            states.set(seed.fixture_id, paused);
            const update = stateToUpdate(paused, seed);
            nextUpdates.set(seed.fixture_id, update);
            latestUpdate = update;
            continue;
          }
          // Reset counter before advancing past HT
          const resumed = { ...current, htPauseTicks: 0 };
          states.set(seed.fixture_id, resumed);
        }

        const next = tickSimulation(current, seed);
        states.set(seed.fixture_id, next);

        const update = stateToUpdate(next, seed);
        nextUpdates.set(seed.fixture_id, update);
        latestUpdate = update;
      }

      setUpdates(nextUpdates);
      if (latestUpdate) setLastUpdate(latestUpdate);
    }, 5000); // Tick every 5 seconds = 1 match minute

    return () => clearInterval(interval);
  }, [isMock, enabled]);

  const status: WebSocketStatus = isMock ? "connected" : wsStatus;

  return { updates, lastUpdate, status };
}
