import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useCockpitOpsStore } from "@/lib/mocks/cockpit-ops-store";
import type { RuntimeOverride } from "@/lib/architecture-v2/runtime-override";
import { EMPTY_WORKSPACE_SCOPE } from "@/lib/architecture-v2/workspace-scope";

const sampleOverride: RuntimeOverride = {
  overrideId: "ov-test",
  releaseId: "rb-test-v1",
  scope: EMPTY_WORKSPACE_SCOPE,
  overrideType: "size_multiplier",
  value: { multiplier: 0.5 },
  reason: "test reason",
  createdBy: "test",
  createdAt: "2026-04-30T00:00:00Z",
  requiresApproval: false,
  preOverrideState: {},
  postOverrideState: {},
  auditEventId: "evt-test",
};

describe("useCockpitOpsStore", () => {
  beforeEach(() => {
    useCockpitOpsStore.getState().reset();
  });
  afterEach(() => {
    useCockpitOpsStore.getState().reset();
  });

  describe("appendRuntimeOverride", () => {
    it("appends an override and emits a success toast", () => {
      useCockpitOpsStore.getState().appendRuntimeOverride(sampleOverride);
      const state = useCockpitOpsStore.getState();
      expect(state.runtimeOverrides).toHaveLength(1);
      expect(state.runtimeOverrides[0]?.overrideId).toBe("ov-test");
      expect(state.toastMessages).toHaveLength(1);
      expect(state.toastMessages[0]?.tone).toBe("success");
      expect(state.toastMessages[0]?.message).toContain("size_multiplier");
    });

    it("preserves existing overrides on subsequent appends", () => {
      const store = useCockpitOpsStore.getState();
      store.appendRuntimeOverride(sampleOverride);
      store.appendRuntimeOverride({ ...sampleOverride, overrideId: "ov-test-2" });
      expect(useCockpitOpsStore.getState().runtimeOverrides).toHaveLength(2);
    });
  });

  describe("startBacktestRun + tick progression", () => {
    it("queues a backtest then progresses to running on tick", () => {
      const id = useCockpitOpsStore
        .getState()
        .startBacktestRun({ strategyId: "S1", assumptionStackId: "A1", proofGoal: "promotion" });
      expect(useCockpitOpsStore.getState().backtestRuns).toHaveLength(1);
      expect(useCockpitOpsStore.getState().backtestRuns[0]?.status).toBe("queued");
      expect(useCockpitOpsStore.getState().backtestRuns[0]?.progressPct).toBe(0);

      useCockpitOpsStore.getState().tick();
      const run = useCockpitOpsStore.getState().backtestRuns.find((r) => r.id === id);
      expect(run?.status).toBe("running");
      expect(run?.progressPct).toBeGreaterThan(0);
    });

    it("completes a backtest after enough ticks and assigns a Sharpe", () => {
      useCockpitOpsStore
        .getState()
        .startBacktestRun({ strategyId: "S1", assumptionStackId: "A1", proofGoal: "promotion" });
      // 5%/tick → 20 ticks → 100%.
      for (let i = 0; i < 25; i += 1) useCockpitOpsStore.getState().tick();
      const run = useCockpitOpsStore.getState().backtestRuns[0];
      expect(run?.status).toBe("completed");
      expect(run?.progressPct).toBe(100);
      expect(run?.resultSharpe).toBeTypeOf("number");
      expect(run?.completedAt).toBeTypeOf("string");
    });
  });

  describe("startMlTrainingRun + promoteMlRunToPaper", () => {
    it("transitions a completed ML run to promoted=true on user action", () => {
      const id = useCockpitOpsStore
        .getState()
        .startMlTrainingRun({ modelFamily: "xgboost", featureSetVersion: "fs-v1" });
      // Drive to completion
      for (let i = 0; i < 40; i += 1) useCockpitOpsStore.getState().tick();
      expect(useCockpitOpsStore.getState().mlTrainingRuns[0]?.status).toBe("completed");
      expect(useCockpitOpsStore.getState().mlTrainingRuns[0]?.promotedToPaper).toBe(false);

      useCockpitOpsStore.getState().promoteMlRunToPaper(id);
      expect(useCockpitOpsStore.getState().mlTrainingRuns[0]?.promotedToPaper).toBe(true);
      const lastToast = useCockpitOpsStore.getState().toastMessages.at(-1);
      expect(lastToast?.message).toContain("promoted to paper");
    });
  });

  describe("submitOrder + paper-fill simulation", () => {
    it("creates a pending order then simulates a fill after >1s", async () => {
      // Force a deterministic createdAt in the past so tick() promotes to fill on first call.
      const id = useCockpitOpsStore
        .getState()
        .submitOrder({
          strategyId: "S1",
          side: "buy",
          venue: "binance",
          symbol: "BTC-USDT",
          qty: 1,
          priceLimit: 70_000,
        });
      // Mutate the order's createdAt to >1s ago via a fresh store hack: pop + push older.
      useCockpitOpsStore.setState((s) => {
        const order = s.pendingOrders.find((o) => o.id === id);
        if (!order) return s;
        return {
          ...s,
          pendingOrders: s.pendingOrders.map((o) =>
            o.id === id ? { ...o, createdAt: new Date(Date.now() - 5_000).toISOString() } : o,
          ),
        };
      });
      useCockpitOpsStore.getState().tick();
      const state = useCockpitOpsStore.getState();
      expect(state.pendingOrders.find((o) => o.id === id)).toBeUndefined();
      expect(state.recentFills.length).toBeGreaterThan(0);
      const fill = state.recentFills[0];
      expect(fill?.symbol).toBe("BTC-USDT");
      expect(fill?.qtyFilled).toBe(1);
      expect(fill?.priceFill).toBeGreaterThan(0);
    });
  });

  describe("appendBundleCandidate", () => {
    it("appends a candidate and emits a success toast referencing the releaseId", () => {
      useCockpitOpsStore.getState().appendBundleCandidate({
        releaseId: "rb-new-candidate-v1",
      } as never);
      const state = useCockpitOpsStore.getState();
      expect(state.bundleCandidates).toHaveLength(1);
      expect(state.bundleCandidates[0]?.bundle.releaseId).toBe("rb-new-candidate-v1");
      const lastToast = state.toastMessages.at(-1);
      expect(lastToast?.message).toContain("rb-new-candidate-v1");
      expect(lastToast?.tone).toBe("success");
    });
  });

  describe("dismissToast", () => {
    it("removes a single toast by id", () => {
      useCockpitOpsStore.getState().pushToast("hello", "info");
      const id = useCockpitOpsStore.getState().toastMessages[0]?.id;
      expect(id).toBeTypeOf("string");
      useCockpitOpsStore.getState().dismissToast(id!);
      expect(useCockpitOpsStore.getState().toastMessages).toHaveLength(0);
    });
  });

  describe("reset", () => {
    it("clears all collections and toasts", () => {
      useCockpitOpsStore.getState().pushToast("hello");
      useCockpitOpsStore.getState().appendRuntimeOverride(sampleOverride);
      useCockpitOpsStore.getState().reset();
      const s = useCockpitOpsStore.getState();
      expect(s.runtimeOverrides).toHaveLength(0);
      expect(s.bundleCandidates).toHaveLength(0);
      expect(s.backtestRuns).toHaveLength(0);
      expect(s.mlTrainingRuns).toHaveLength(0);
      expect(s.pendingOrders).toHaveLength(0);
      expect(s.recentFills).toHaveLength(0);
      expect(s.toastMessages).toHaveLength(0);
    });
  });
});
