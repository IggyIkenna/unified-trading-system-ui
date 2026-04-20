import { beforeEach, describe, expect, it } from "vitest";

import {
  deployDefiStrategy,
  getDefiStrategyConfig,
  getDefiStrategyConfigs,
  pauseDefiStrategy,
  resetDefiStrategyConfigs,
  saveDefiStrategyConfig,
} from "@/lib/stores/defi-strategy-store";

/**
 * Coverage lift for lib/stores/defi-strategy-store.ts.
 * The module is a localStorage-backed mutable singleton; call the exported
 * functions and assert state changes + emitted CustomEvents.
 */

describe("defi-strategy-store", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDefiStrategyConfigs();
  });

  it("getDefiStrategyConfigs returns the default fixture", () => {
    const configs = getDefiStrategyConfigs();
    expect(configs.length).toBeGreaterThan(0);
    expect(configs.find((c) => c.strategy_id === "AAVE_LENDING")).toBeTruthy();
  });

  it("getDefiStrategyConfig returns a known strategy by id", () => {
    const c = getDefiStrategyConfig("AAVE_LENDING");
    expect(c).toBeTruthy();
    expect(c?.share_class).toBe("USDT");
  });

  it("getDefiStrategyConfig returns undefined for unknown id", () => {
    expect(getDefiStrategyConfig("__no_such__")).toBeUndefined();
  });

  it("saveDefiStrategyConfig updates an existing strategy and dispatches event", () => {
    const events: string[] = [];
    const handler = (e: Event) => {
      const { strategyId } = (e as CustomEvent).detail as { strategyId: string };
      events.push(strategyId);
    };
    window.addEventListener("defi-config-saved", handler);

    saveDefiStrategyConfig("AAVE_LENDING", { min_apy_threshold: 9 });
    const c = getDefiStrategyConfig("AAVE_LENDING");
    expect(c?.config.min_apy_threshold).toBe(9);
    expect(events).toContain("AAVE_LENDING");

    window.removeEventListener("defi-config-saved", handler);
  });

  it("saveDefiStrategyConfig inserts a new strategy when id is unknown", () => {
    saveDefiStrategyConfig("__NEW_STRAT__", { foo: 1 });
    const c = getDefiStrategyConfig("__NEW_STRAT__");
    expect(c).toBeTruthy();
    expect(c?.status).toBe("draft");
    expect(c?.deployed_at).toBeNull();
    expect(c?.config.foo).toBe(1);
  });

  it("deployDefiStrategy flips status to deployed and emits event", () => {
    const events: string[] = [];
    const handler = (e: Event) => {
      events.push((e as CustomEvent).detail.strategyId as string);
    };
    window.addEventListener("defi-strategy-deployed", handler);

    // Start from a draft state.
    saveDefiStrategyConfig("__DEPLOY_ME__", {});
    expect(getDefiStrategyConfig("__DEPLOY_ME__")?.status).toBe("draft");

    deployDefiStrategy("__DEPLOY_ME__");
    const c = getDefiStrategyConfig("__DEPLOY_ME__");
    expect(c?.status).toBe("deployed");
    expect(c?.deployed_at).toBeTruthy();
    expect(events).toContain("__DEPLOY_ME__");

    window.removeEventListener("defi-strategy-deployed", handler);
  });

  it("deployDefiStrategy is a no-op for unknown strategies", () => {
    const before = getDefiStrategyConfigs().length;
    deployDefiStrategy("__no_such__");
    expect(getDefiStrategyConfigs().length).toBe(before);
  });

  it("pauseDefiStrategy flips status to paused", () => {
    pauseDefiStrategy("AAVE_LENDING");
    expect(getDefiStrategyConfig("AAVE_LENDING")?.status).toBe("paused");
  });

  it("pauseDefiStrategy is a no-op for unknown strategies", () => {
    const before = getDefiStrategyConfigs().length;
    pauseDefiStrategy("__no_such__");
    expect(getDefiStrategyConfigs().length).toBe(before);
  });

  it("resetDefiStrategyConfigs restores defaults + clears mutations", () => {
    saveDefiStrategyConfig("__TEMP__", {});
    expect(getDefiStrategyConfig("__TEMP__")).toBeTruthy();
    resetDefiStrategyConfigs();
    expect(getDefiStrategyConfig("__TEMP__")).toBeUndefined();
  });
});
