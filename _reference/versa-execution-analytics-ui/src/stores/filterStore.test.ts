import { describe, it, expect, beforeEach } from "vitest";
import { useFilterStore } from "./filterStore";
import { act } from "@testing-library/react";

// Reset store state between tests by calling resetFilters each time
function getStore() {
  return useFilterStore.getState();
}

describe("filterStore", () => {
  beforeEach(() => {
    act(() => {
      useFilterStore.getState().resetFilters();
    });
  });

  it("has correct initial state", () => {
    const state = getStore();
    expect(state.category).toBe("All");
    expect(state.asset).toBe("All");
    expect(state.strategy).toBe("All");
    expect(state.mode).toBe("All");
    expect(state.timeframe).toBe("All");
    expect(state.instructionType).toBe("All");
    expect(state.algorithm).toBe("All");
    expect(state.dateStart).toBe("");
    expect(state.dateEnd).toBe("");
  });

  it("setCategory updates category", () => {
    act(() => {
      getStore().setCategory("Crypto");
    });
    expect(getStore().category).toBe("Crypto");
  });

  it("setAsset updates asset", () => {
    act(() => {
      getStore().setAsset("BTC");
    });
    expect(getStore().asset).toBe("BTC");
  });

  it("setStrategy updates strategy", () => {
    act(() => {
      getStore().setStrategy("StatArb");
    });
    expect(getStore().strategy).toBe("StatArb");
  });

  it("setMode updates mode", () => {
    act(() => {
      getStore().setMode("backtest");
    });
    expect(getStore().mode).toBe("backtest");
  });

  it("setTimeframe updates timeframe", () => {
    act(() => {
      getStore().setTimeframe("1h");
    });
    expect(getStore().timeframe).toBe("1h");
  });

  it("setInstructionType updates instructionType", () => {
    act(() => {
      getStore().setInstructionType("TWAP");
    });
    expect(getStore().instructionType).toBe("TWAP");
  });

  it("setAlgorithm updates algorithm", () => {
    act(() => {
      getStore().setAlgorithm("v3");
    });
    expect(getStore().algorithm).toBe("v3");
  });

  it("setDateStart updates dateStart", () => {
    act(() => {
      getStore().setDateStart("2024-01-01");
    });
    expect(getStore().dateStart).toBe("2024-01-01");
  });

  it("setDateEnd updates dateEnd", () => {
    act(() => {
      getStore().setDateEnd("2024-12-31");
    });
    expect(getStore().dateEnd).toBe("2024-12-31");
  });

  it("resetFilters resets all fields to initial state", () => {
    act(() => {
      getStore().setCategory("Crypto");
      getStore().setAsset("ETH");
      getStore().setDateStart("2024-01-01");
      getStore().setDateEnd("2024-12-31");
    });
    act(() => {
      getStore().resetFilters();
    });
    const state = getStore();
    expect(state.category).toBe("All");
    expect(state.asset).toBe("All");
    expect(state.dateStart).toBe("");
    expect(state.dateEnd).toBe("");
  });

  it("multiple fields can be set independently", () => {
    act(() => {
      getStore().setCategory("Crypto");
      getStore().setMode("live");
    });
    expect(getStore().category).toBe("Crypto");
    expect(getStore().mode).toBe("live");
    // Other fields unchanged
    expect(getStore().asset).toBe("All");
  });
});
