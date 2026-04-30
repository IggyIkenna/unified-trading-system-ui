"use client";

/**
 * useCockpitOpsStore — central in-session SSOT for cockpit interactive
 * surfaces in mock-mode.
 *
 * Per the post-assumption-stack audit:
 *
 *   "Click anything → does it respond? Click promote → does it create a
 *    candidate? Click run-backtest → does it progress? Click submit
 *    override → does the bundle panel show it appearing? Right now too
 *    many clicks are no-ops and the demo feels tacky."
 *
 * Solves it by introducing one Zustand store the whole cockpit reads from
 * AND writes to. Every interactive surface (override authoring, promote
 * form, backtest run button, ML training, order ticket) dispatches into
 * this store. Every read surface (release-bundle panel's active overrides,
 * Research/Validate backtest list, Research/Promote candidate list,
 * Terminal/Command recent fills) reads from it.
 *
 * Mock-mode liveness is layered on top via a tick interval that progresses
 * in-flight backtests + ML runs + paper-fill latency.
 *
 * SSOT: this store + plan §13 (mock-mode liveness) + §4.8 (config lifecycle).
 */

import { create } from "zustand";

import type { RuntimeOverride } from "@/lib/architecture-v2/runtime-override";
import type { StrategyReleaseBundle } from "@/lib/architecture-v2/strategy-release-bundle";

// ─────────────────────────────────────────────────────────────────────────────
// Shape
// ─────────────────────────────────────────────────────────────────────────────

export type RunStatus = "queued" | "running" | "completed" | "failed";

export interface BacktestRun {
  readonly id: string;
  readonly strategyId: string;
  readonly assumptionStackId: string;
  readonly proofGoal: string;
  readonly progressPct: number;
  readonly status: RunStatus;
  /** Operating-adjusted Sharpe once the run completes. */
  readonly resultSharpe?: number;
  readonly createdAt: string;
  readonly completedAt?: string;
}

export interface MlTrainingRun {
  readonly id: string;
  readonly modelFamily: string;
  readonly featureSetVersion: string;
  readonly progressPct: number;
  readonly status: RunStatus;
  readonly accuracyPct?: number;
  readonly createdAt: string;
  readonly completedAt?: string;
  readonly promotedToPaper: boolean;
}

export interface PendingOrder {
  readonly id: string;
  readonly strategyId: string;
  readonly side: "buy" | "sell";
  readonly venue: string;
  readonly symbol: string;
  readonly qty: number;
  readonly priceLimit?: number;
  readonly createdAt: string;
}

export interface RecentFill {
  readonly id: string;
  readonly orderId: string;
  readonly strategyId: string;
  readonly side: "buy" | "sell";
  readonly venue: string;
  readonly symbol: string;
  readonly qtyFilled: number;
  readonly priceFill: number;
  readonly slippageBps: number;
  readonly filledAt: string;
}

export interface AuthoredBundleCandidate {
  readonly bundle: StrategyReleaseBundle;
  readonly authoredAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Strategy lifecycle e2e — events emitted by the scenario engine
// ─────────────────────────────────────────────────────────────────────────────

export type StrategyEventKind =
  | "client_deposit"
  | "client_withdrawal"
  | "signal_fired"
  | "entry_decision"
  | "exit_decision"
  | "rebalance"
  | "alert"
  | "kill_switch_trip"
  | "venue_degraded"
  | "drift_warning"
  | "settlement";

export type AssetGroup = "CEFI" | "DEFI" | "TRADFI" | "SPORTS" | "PREDICTION";

export interface StrategyEvent {
  readonly id: string;
  readonly scenarioId: string;
  readonly archetype: string;
  readonly assetGroup: AssetGroup;
  readonly venue: string;
  readonly kind: StrategyEventKind;
  readonly summary: string;
  readonly detail?: string;
  /** Signed P&L impact in USD (positive = gain). */
  readonly pnlImpactUsd?: number;
  readonly tone: "info" | "success" | "warn" | "error";
  readonly timestamp: string;
}

export interface ActiveScenario {
  readonly id: string;
  readonly archetype: string;
  readonly assetGroup: AssetGroup;
  readonly label: string;
  readonly startedAt: string;
  /** Index into the scripted event list — tick increments. */
  readonly cursor: number;
  /** Total events in the script. */
  readonly totalEvents: number;
  readonly status: "running" | "completed";
}

export interface CockpitOpsState {
  readonly runtimeOverrides: readonly RuntimeOverride[];
  readonly bundleCandidates: readonly AuthoredBundleCandidate[];
  readonly backtestRuns: readonly BacktestRun[];
  readonly mlTrainingRuns: readonly MlTrainingRun[];
  readonly pendingOrders: readonly PendingOrder[];
  readonly recentFills: readonly RecentFill[];
  readonly strategyEvents: readonly StrategyEvent[];
  readonly activeScenarios: readonly ActiveScenario[];
  readonly toastMessages: readonly {
    readonly id: string;
    readonly message: string;
    readonly tone: "info" | "success" | "warn" | "error";
  }[];

  // Actions
  appendRuntimeOverride: (override: RuntimeOverride) => void;
  appendBundleCandidate: (bundle: StrategyReleaseBundle) => void;
  startBacktestRun: (input: { strategyId: string; assumptionStackId: string; proofGoal: string }) => string;
  startMlTrainingRun: (input: { modelFamily: string; featureSetVersion: string }) => string;
  promoteMlRunToPaper: (runId: string) => void;
  submitOrder: (input: {
    strategyId: string;
    side: "buy" | "sell";
    venue: string;
    symbol: string;
    qty: number;
    priceLimit?: number;
  }) => string;
  /** Append a strategy lifecycle event (called by the scenario engine). */
  appendStrategyEvent: (event: Omit<StrategyEvent, "id" | "timestamp">) => void;
  /** Register an in-flight scenario (engine starts script, ticker advances). */
  registerActiveScenario: (scenario: Omit<ActiveScenario, "startedAt" | "cursor" | "status">) => void;
  /** Advance scenario cursor; engine calls this after firing each event. */
  advanceScenarioCursor: (scenarioId: string) => void;
  /** Mark a scenario completed once cursor === totalEvents. */
  completeScenario: (scenarioId: string) => void;
  pushToast: (message: string, tone?: "info" | "success" | "warn" | "error") => void;
  dismissToast: (id: string) => void;
  /** Called by the tick interval — progresses in-flight runs + simulates fills. */
  tick: () => void;
  /** Reset all state (used by tests). */
  reset: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function uid(prefix: string): string {
  // Deterministic enough for demos (Date.now + counter) without pulling crypto.
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

function now(): string {
  return new Date().toISOString();
}

// Tick advance per second when called every 1s. Backtests progress 5% per
// tick, ML training 3% per tick, fills land after 1s. Tunable for demos.
const BACKTEST_TICK_PCT = 5;
const ML_TICK_PCT = 3;

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useCockpitOpsStore = create<CockpitOpsState>((set, get) => ({
  runtimeOverrides: [],
  bundleCandidates: [],
  backtestRuns: [],
  mlTrainingRuns: [],
  pendingOrders: [],
  recentFills: [],
  strategyEvents: [],
  activeScenarios: [],
  toastMessages: [],

  appendStrategyEvent: (event) => {
    const fullEvent: StrategyEvent = {
      ...event,
      id: uid("evt"),
      timestamp: now(),
    };
    set((s) => ({
      strategyEvents: [fullEvent, ...s.strategyEvents].slice(0, 100),
      // Surface only WARN / ERROR / SUCCESS events as toasts to avoid noise.
      toastMessages:
        event.tone === "info"
          ? s.toastMessages
          : [
              ...s.toastMessages,
              { id: uid("toast"), message: `${event.archetype}: ${event.summary}`, tone: event.tone },
            ],
    }));
  },

  registerActiveScenario: (scenario) => {
    const active: ActiveScenario = {
      ...scenario,
      startedAt: now(),
      cursor: 0,
      status: "running",
    };
    set((s) => ({
      activeScenarios: [...s.activeScenarios, active],
      toastMessages: [
        ...s.toastMessages,
        { id: uid("toast"), message: `Scenario started: ${scenario.label}`, tone: "info" },
      ],
    }));
  },

  advanceScenarioCursor: (scenarioId) => {
    set((s) => ({
      activeScenarios: s.activeScenarios.map((sc) => (sc.id === scenarioId ? { ...sc, cursor: sc.cursor + 1 } : sc)),
    }));
  },

  completeScenario: (scenarioId) => {
    set((s) => ({
      activeScenarios: s.activeScenarios.map((sc) =>
        sc.id === scenarioId ? { ...sc, status: "completed" as const } : sc,
      ),
      toastMessages: [
        ...s.toastMessages,
        {
          id: uid("toast"),
          message: `Scenario ${scenarioId} completed`,
          tone: "success",
        },
      ],
    }));
  },

  appendRuntimeOverride: (override) => {
    set((s) => ({
      runtimeOverrides: [...s.runtimeOverrides, override],
      toastMessages: [
        ...s.toastMessages,
        {
          id: uid("toast"),
          message: `Runtime override authored: ${override.overrideType}`,
          tone: "success",
        },
      ],
    }));
  },

  appendBundleCandidate: (bundle) => {
    set((s) => ({
      bundleCandidates: [...s.bundleCandidates, { bundle, authoredAt: now() }],
      toastMessages: [
        ...s.toastMessages,
        {
          id: uid("toast"),
          message: `Candidate bundle ${bundle.releaseId} created`,
          tone: "success",
        },
      ],
    }));
  },

  startBacktestRun: ({ strategyId, assumptionStackId, proofGoal }) => {
    const id = uid("bt");
    set((s) => ({
      backtestRuns: [
        ...s.backtestRuns,
        {
          id,
          strategyId,
          assumptionStackId,
          proofGoal,
          progressPct: 0,
          status: "queued",
          createdAt: now(),
        },
      ],
      toastMessages: [...s.toastMessages, { id: uid("toast"), message: `Backtest ${id} queued`, tone: "info" }],
    }));
    return id;
  },

  startMlTrainingRun: ({ modelFamily, featureSetVersion }) => {
    const id = uid("ml");
    set((s) => ({
      mlTrainingRuns: [
        ...s.mlTrainingRuns,
        {
          id,
          modelFamily,
          featureSetVersion,
          progressPct: 0,
          status: "queued",
          createdAt: now(),
          promotedToPaper: false,
        },
      ],
      toastMessages: [...s.toastMessages, { id: uid("toast"), message: `ML training ${id} queued`, tone: "info" }],
    }));
    return id;
  },

  promoteMlRunToPaper: (runId) => {
    set((s) => ({
      mlTrainingRuns: s.mlTrainingRuns.map((r) => (r.id === runId ? { ...r, promotedToPaper: true } : r)),
      toastMessages: [
        ...s.toastMessages,
        {
          id: uid("toast"),
          message: `Model run ${runId} promoted to paper`,
          tone: "success",
        },
      ],
    }));
  },

  submitOrder: ({ strategyId, side, venue, symbol, qty, priceLimit }) => {
    const id = uid("ord");
    set((s) => ({
      pendingOrders: [...s.pendingOrders, { id, strategyId, side, venue, symbol, qty, priceLimit, createdAt: now() }],
      toastMessages: [
        ...s.toastMessages,
        {
          id: uid("toast"),
          message: `${side.toUpperCase()} ${qty} ${symbol} on ${venue} routed`,
          tone: "info",
        },
      ],
    }));
    return id;
  },

  pushToast: (message, tone = "info") => {
    set((s) => ({
      toastMessages: [...s.toastMessages, { id: uid("toast"), message, tone }],
    }));
  },

  dismissToast: (id) => {
    set((s) => ({ toastMessages: s.toastMessages.filter((t) => t.id !== id) }));
  },

  tick: () => {
    const state = get();
    let runtimeOverrides = state.runtimeOverrides;
    let toastMessages = state.toastMessages;

    // Progress backtests
    const backtestRuns = state.backtestRuns.map((r) => {
      if (r.status === "completed" || r.status === "failed") return r;
      const next = Math.min(100, r.progressPct + BACKTEST_TICK_PCT);
      if (next >= 100) {
        // Synthesise a Sharpe based on the proof goal — full-promotion runs
        // converge slightly lower than execution-only runs because more
        // costs apply.
        const baseSharpe = r.proofGoal === "promotion" ? 1.45 : r.proofGoal === "signal" ? 2.4 : 1.85;
        return {
          ...r,
          progressPct: 100,
          status: "completed" as const,
          resultSharpe: Math.round((baseSharpe + (Math.random() - 0.5) * 0.3) * 100) / 100,
          completedAt: now(),
        };
      }
      return { ...r, progressPct: next, status: "running" as const };
    });

    // Progress ML training
    const mlTrainingRuns = state.mlTrainingRuns.map((r) => {
      if (r.status === "completed" || r.status === "failed") return r;
      const next = Math.min(100, r.progressPct + ML_TICK_PCT);
      if (next >= 100) {
        return {
          ...r,
          progressPct: 100,
          status: "completed" as const,
          accuracyPct: Math.round(58 + Math.random() * 10),
          completedAt: now(),
        };
      }
      return { ...r, progressPct: next, status: "running" as const };
    });

    // Simulate paper fills for pending orders older than 1 second
    const cutoff = Date.now() - 1000;
    const stillPending: PendingOrder[] = [];
    const newFills: RecentFill[] = [];
    for (const order of state.pendingOrders) {
      const createdAtMs = new Date(order.createdAt).getTime();
      if (createdAtMs <= cutoff) {
        // Synthesise a fill with realistic slippage
        const basePrice = order.priceLimit ?? 100;
        const slippageBps = Math.round((Math.random() * 6 - 1) * 10) / 10; // -1 to 5 bps
        const priceFill = basePrice * (1 + (slippageBps / 10000) * (order.side === "buy" ? 1 : -1));
        newFills.push({
          id: uid("fill"),
          orderId: order.id,
          strategyId: order.strategyId,
          side: order.side,
          venue: order.venue,
          symbol: order.symbol,
          qtyFilled: order.qty,
          priceFill: Math.round(priceFill * 100) / 100,
          slippageBps,
          filledAt: now(),
        });
      } else {
        stillPending.push(order);
      }
    }

    const recentFills = newFills.length > 0 ? [...newFills, ...state.recentFills].slice(0, 50) : state.recentFills;
    if (newFills.length > 0) {
      toastMessages = [
        ...toastMessages,
        ...newFills.map((f) => ({
          id: uid("toast"),
          message: `${f.side.toUpperCase()} ${f.qtyFilled} ${f.symbol} filled @ ${f.priceFill} on ${f.venue} (${f.slippageBps} bps)`,
          tone: "success" as const,
        })),
      ];
    }

    set({
      runtimeOverrides,
      backtestRuns,
      mlTrainingRuns,
      pendingOrders: stillPending,
      recentFills,
      toastMessages,
    });
  },

  reset: () => {
    set({
      runtimeOverrides: [],
      bundleCandidates: [],
      backtestRuns: [],
      mlTrainingRuns: [],
      pendingOrders: [],
      recentFills: [],
      strategyEvents: [],
      activeScenarios: [],
      toastMessages: [],
    });
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Tick driver — single global interval that progresses all in-flight runs
// + lands paper fills. Started lazily on first store access in the browser.
// ─────────────────────────────────────────────────────────────────────────────

let tickerStarted = false;

export function ensureCockpitOpsTickerStarted(): void {
  if (tickerStarted || typeof window === "undefined") return;
  tickerStarted = true;
  // 1-second tick. Test files that need determinism can call `useCockpitOpsStore.getState().tick()` directly.
  setInterval(() => {
    useCockpitOpsStore.getState().tick();
  }, 1000);
}
