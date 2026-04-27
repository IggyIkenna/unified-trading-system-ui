import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useGlobalScope } from "@/lib/stores/global-scope-store";

/**
 * Coverage lift for lib/stores/global-scope-store.ts (was 19.35%).
 * Exercises every setter + derived-mode behaviour + migrate fallback.
 */

describe("global-scope-store", () => {
  beforeEach(() => {
    act(() => useGlobalScope.getState().reset());
  });

  it("initial state is empty arrays + live mode + no asOf", () => {
    const s = useGlobalScope.getState().scope;
    expect(s.organizationIds).toEqual([]);
    expect(s.clientIds).toEqual([]);
    expect(s.strategyIds).toEqual([]);
    expect(s.assetGroupIds).toEqual([]);
    expect(s.strategyFamilyIdsV2).toEqual([]);
    expect(s.strategyArchetypeIds).toEqual([]);
    expect(s.underlyingIds).toEqual([]);
    expect(s.mode).toBe("live");
    expect(s.asOfDatetime).toBeUndefined();
  });

  it("setOrganizationIds replaces the array", () => {
    act(() => useGlobalScope.getState().setOrganizationIds(["odum", "elysium"]));
    expect(useGlobalScope.getState().scope.organizationIds).toEqual(["odum", "elysium"]);
  });

  it("setClientIds replaces the array", () => {
    act(() => useGlobalScope.getState().setClientIds(["delta-one"]));
    expect(useGlobalScope.getState().scope.clientIds).toEqual(["delta-one"]);
  });

  it("setStrategyIds replaces the array", () => {
    act(() => useGlobalScope.getState().setStrategyIds(["a", "b"]));
    expect(useGlobalScope.getState().scope.strategyIds).toEqual(["a", "b"]);
  });

  it("setAssetGroupIds replaces the array", () => {
    act(() => useGlobalScope.getState().setAssetGroupIds(["DeFi", "CeFi"]));
    expect(useGlobalScope.getState().scope.assetGroupIds).toEqual(["DeFi", "CeFi"]);
  });

  it("setStrategyFamilyIdsV2 replaces the array", () => {
    act(() => useGlobalScope.getState().setStrategyFamilyIdsV2(["CARRY_AND_YIELD", "ML_DIRECTIONAL"]));
    expect(useGlobalScope.getState().scope.strategyFamilyIdsV2).toEqual(["CARRY_AND_YIELD", "ML_DIRECTIONAL"]);
  });

  it("setStrategyArchetypeIds replaces the array", () => {
    act(() => useGlobalScope.getState().setStrategyArchetypeIds(["CARRY_BASIS_PERP"]));
    expect(useGlobalScope.getState().scope.strategyArchetypeIds).toEqual(["CARRY_BASIS_PERP"]);
  });

  it("setUnderlyingIds replaces the array", () => {
    act(() => useGlobalScope.getState().setUnderlyingIds(["BTC"]));
    expect(useGlobalScope.getState().scope.underlyingIds).toEqual(["BTC"]);
  });

  it("setStrategyFamily stores the single v2 family pick", () => {
    act(() => useGlobalScope.getState().setStrategyFamily("CARRY_AND_YIELD"));
    expect(useGlobalScope.getState().scope.strategyFamily).toBe("CARRY_AND_YIELD");
  });

  it("setStrategyFamily(undefined) clears downstream archetype", () => {
    act(() => {
      useGlobalScope.getState().setStrategyFamily("CARRY_AND_YIELD");
      useGlobalScope.getState().setStrategyArchetype("CARRY_BASIS_PERP");
      useGlobalScope.getState().setStrategyFamily(undefined);
    });
    const s = useGlobalScope.getState().scope;
    expect(s.strategyFamily).toBeUndefined();
    expect(s.strategyArchetype).toBeUndefined();
  });

  it("setStrategyArchetype stores the archetype without mutating family", () => {
    act(() => {
      useGlobalScope.getState().setStrategyFamily("ML_DIRECTIONAL");
      useGlobalScope.getState().setStrategyArchetype("ML_DIRECTIONAL_CONTINUOUS");
    });
    const s = useGlobalScope.getState().scope;
    expect(s.strategyFamily).toBe("ML_DIRECTIONAL");
    expect(s.strategyArchetype).toBe("ML_DIRECTIONAL_CONTINUOUS");
  });

  it("setMode to batch seeds an as-of when none present", () => {
    act(() => useGlobalScope.getState().setMode("batch"));
    const s = useGlobalScope.getState().scope;
    expect(s.mode).toBe("batch");
    expect(typeof s.asOfDatetime).toBe("string");
    expect(s.asOfDatetime?.length).toBeGreaterThan(0);
  });

  it("setMode to batch preserves existing as-of", () => {
    act(() => {
      useGlobalScope.getState().setAsOfDatetime("2026-04-20T10:00");
      useGlobalScope.getState().setMode("batch");
    });
    expect(useGlobalScope.getState().scope.asOfDatetime).toBe("2026-04-20T10:00");
  });

  it("setMode back to live clears as-of", () => {
    act(() => {
      useGlobalScope.getState().setAsOfDatetime("2026-04-20T10:00");
      useGlobalScope.getState().setMode("batch");
      useGlobalScope.getState().setMode("live");
    });
    expect(useGlobalScope.getState().scope.asOfDatetime).toBeUndefined();
  });

  it("setAsOfDatetime(undefined) clears the field", () => {
    act(() => {
      useGlobalScope.getState().setAsOfDatetime("2026-04-20T10:00");
      useGlobalScope.getState().setAsOfDatetime(undefined);
    });
    expect(useGlobalScope.getState().scope.asOfDatetime).toBeUndefined();
  });

  it("clearAll restores initial scope", () => {
    act(() => {
      useGlobalScope.getState().setOrganizationIds(["x"]);
      useGlobalScope.getState().setMode("batch");
      useGlobalScope.getState().clearAll();
    });
    const s = useGlobalScope.getState().scope;
    expect(s.organizationIds).toEqual([]);
    expect(s.mode).toBe("live");
    expect(s.asOfDatetime).toBeUndefined();
  });

  it("reset equivalent to clearAll", () => {
    act(() => {
      useGlobalScope.getState().setStrategyIds(["s1"]);
      useGlobalScope.getState().reset();
    });
    expect(useGlobalScope.getState().scope.strategyIds).toEqual([]);
  });
});
