import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useFilterStore } from "@/lib/stores/filter-store";

/**
 * Existing stores.test.ts covers assetGroup/venue/instrument setters + reset.
 * Line 32 (setDateRange) is not touched — this file adds that coverage plus
 * explicit null-clearing cases to fill the branch gaps.
 */
describe("filter-store — setDateRange + edge cases", () => {
  beforeEach(() => {
    act(() => useFilterStore.getState().reset());
  });

  it("setDateRange stores the range", () => {
    const range = { start: "2026-01-01", end: "2026-01-31" };
    act(() => useFilterStore.getState().setDateRange(range));
    expect(useFilterStore.getState().dateRange).toEqual(range);
  });

  it("setDateRange(null) clears the range", () => {
    act(() => {
      useFilterStore.getState().setDateRange({ start: "2026-01-01", end: "2026-01-31" });
      useFilterStore.getState().setDateRange(null);
    });
    expect(useFilterStore.getState().dateRange).toBeNull();
  });

  it("setInstrument(null) works without touching venue/assetGroup", () => {
    act(() => {
      useFilterStore.getState().setAssetGroup("CEFI");
      useFilterStore.getState().setVenue("Binance");
      useFilterStore.getState().setInstrument("BTC/USDT");
      useFilterStore.getState().setInstrument(null);
    });
    const s = useFilterStore.getState();
    expect(s.instrument).toBeNull();
    expect(s.venue).toBe("Binance");
    expect(s.assetGroup).toBe("CEFI");
  });

  it("setAssetGroup preserves dateRange (only assetGroup/venue/instrument are cleared)", () => {
    const range = { start: "2026-02-01", end: "2026-02-28" };
    act(() => {
      useFilterStore.getState().setDateRange(range);
      useFilterStore.getState().setAssetGroup("DEFI");
    });
    expect(useFilterStore.getState().dateRange).toEqual(range);
    expect(useFilterStore.getState().assetGroup).toBe("DEFI");
  });

  it("reset also clears dateRange", () => {
    act(() => {
      useFilterStore.getState().setDateRange({ start: "2026-03-01", end: "2026-03-31" });
      useFilterStore.getState().reset();
    });
    expect(useFilterStore.getState().dateRange).toBeNull();
  });
});
