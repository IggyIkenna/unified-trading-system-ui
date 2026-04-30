import { describe, expect, it, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { useScopedData } from "@/components/widgets/_data/use-scoped-data";
import { useWorkspaceScopeStore } from "@/lib/stores/workspace-scope-store";

beforeEach(() => {
  act(() => {
    useWorkspaceScopeStore.getState().reset();
  });
});

describe("useScopedData — base scope passthrough", () => {
  it("returns the active workspace scope", () => {
    act(() => {
      useWorkspaceScopeStore.getState().setAssetGroups(["DEFI"]);
    });
    const { result } = renderHook(() => useScopedData());
    expect(result.current.scope.assetGroups).toEqual(["DEFI"]);
    expect(result.current.mergedScope.assetGroups).toEqual(["DEFI"]);
  });

  it("matchesScope tolerates rows with no relevant fields populated", () => {
    const { result } = renderHook(() => useScopedData());
    expect(result.current.matchesScope({ strategy_id: "s-1" })).toBe(true);
  });

  it("matchesScope rejects rows whose asset_group conflicts with active scope", () => {
    act(() => {
      useWorkspaceScopeStore.getState().setAssetGroups(["DEFI"]);
    });
    const { result } = renderHook(() => useScopedData());
    expect(result.current.matchesScope({ asset_group: "DEFI", strategy_id: "s-1" })).toBe(true);
    expect(result.current.matchesScope({ asset_group: "CEFI", strategy_id: "s-2" })).toBe(false);
  });
});

describe("useScopedData — slice merging", () => {
  it("union-merges slice.instrumentTypes with active scope", () => {
    const { result } = renderHook(() => useScopedData({ instrumentTypes: ["option"] }));
    expect(result.current.mergedScope.instrumentTypes).toContain("option");
  });

  it("slice union does not duplicate values already in scope", () => {
    act(() => {
      useWorkspaceScopeStore.getState().setInstrumentTypes(["option"]);
    });
    const { result } = renderHook(() => useScopedData({ instrumentTypes: ["option", "future"] }));
    expect(result.current.mergedScope.instrumentTypes).toEqual(["option", "future"]);
  });

  it("compatibility-shim pattern: useOptionsData ≡ useScopedData({instrumentTypes:['option']})", () => {
    const { result } = renderHook(() => useScopedData({ instrumentTypes: ["option"] }));
    // Caller can filter rows by the merged scope:
    expect(result.current.matchesScope({ instrument_type: "option", strategy_id: "x" })).toBe(true);
    expect(result.current.matchesScope({ instrument_type: "spot", strategy_id: "y" })).toBe(false);
  });

  it("filterRows applies matchesScope across an array", () => {
    act(() => {
      useWorkspaceScopeStore.getState().setAssetGroups(["DEFI"]);
    });
    const { result } = renderHook(() => useScopedData());
    const filtered = result.current.filterRows([
      { strategy_id: "a", asset_group: "DEFI" },
      { strategy_id: "b", asset_group: "CEFI" },
      { strategy_id: "c", asset_group: "DEFI" },
    ]);
    expect(filtered.map((r) => r.strategy_id)).toEqual(["a", "c"]);
  });
});

describe("useScopedData — slice union for shareClasses + venue/protocol", () => {
  it("union-merges slice.shareClasses", () => {
    const { result } = renderHook(() => useScopedData({ shareClasses: ["BTC"] }));
    expect(result.current.mergedScope.shareClasses).toContain("BTC");
  });

  it("union-merges slice.venueOrProtocolIds", () => {
    const { result } = renderHook(() => useScopedData({ venueOrProtocolIds: ["aave"] }));
    expect(result.current.mergedScope.venueOrProtocolIds).toContain("aave");
  });
});
