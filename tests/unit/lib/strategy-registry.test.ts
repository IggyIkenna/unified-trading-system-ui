import { describe, expect, it } from "vitest";

import {
  EXECUTION_MODES,
  STRATEGIES,
  getStrategiesByArchetype,
  getStrategiesByAssetClass,
  getStrategiesByClientId,
  getStrategiesByExecutionMode,
  getStrategiesByStatus,
  getStrategiesByVenue,
  getStrategyById,
  getTotalAUM,
  getTotalMTDPnL,
  getTotalPnL,
} from "@/lib/strategy-registry";

describe("EXECUTION_MODES registry", () => {
  it("has all three execution modes", () => {
    expect(EXECUTION_MODES.live).toBeDefined();
    expect(EXECUTION_MODES.paper).toBeDefined();
    expect(EXECUTION_MODES.batch).toBeDefined();
  });

  it("each mode has matching mode key, dataSource, latency and description", () => {
    for (const [key, cfg] of Object.entries(EXECUTION_MODES)) {
      expect(cfg.mode).toBe(key);
      expect(typeof cfg.dataSource).toBe("string");
      expect(typeof cfg.latency).toBe("string");
      expect(typeof cfg.description).toBe("string");
    }
  });

  it("live + paper share pubsub data source, batch uses gcs", () => {
    expect(EXECUTION_MODES.live.dataSource).toBe("pubsub");
    expect(EXECUTION_MODES.paper.dataSource).toBe("pubsub");
    expect(EXECUTION_MODES.batch.dataSource).toBe("gcs");
  });
});

describe("getStrategyById", () => {
  it("returns undefined for unknown id", () => {
    expect(getStrategyById("non-existent-id")).toBeUndefined();
  });

  it("returns the matching strategy when id exists", () => {
    if (STRATEGIES.length === 0) return;
    const sample = STRATEGIES[0];
    const found = getStrategyById(sample.id);
    expect(found?.id).toBe(sample.id);
  });
});

describe("getStrategiesByAssetClass", () => {
  it("filters strategies by asset class", () => {
    if (STRATEGIES.length === 0) return;
    const assetClass = STRATEGIES[0].assetClass;
    const filtered = getStrategiesByAssetClass(assetClass);
    for (const s of filtered) {
      expect(s.assetClass).toBe(assetClass);
    }
    expect(filtered.length).toBeGreaterThan(0);
  });
});

describe("getStrategiesByArchetype", () => {
  it("filters strategies by archetype", () => {
    if (STRATEGIES.length === 0) return;
    const arch = STRATEGIES[0].archetype;
    const filtered = getStrategiesByArchetype(arch);
    for (const s of filtered) {
      expect(s.archetype).toBe(arch);
    }
  });
});

describe("getStrategiesByStatus", () => {
  it("filters strategies by status", () => {
    if (STRATEGIES.length === 0) return;
    const status = STRATEGIES[0].status;
    const filtered = getStrategiesByStatus(status);
    for (const s of filtered) {
      expect(s.status).toBe(status);
    }
  });
});

describe("getStrategiesByVenue", () => {
  it("filters strategies that include the given venue", () => {
    if (STRATEGIES.length === 0) return;
    const venue = STRATEGIES[0].venues[0];
    if (!venue) return;
    const filtered = getStrategiesByVenue(venue);
    for (const s of filtered) {
      expect(s.venues).toContain(venue);
    }
  });

  it("returns empty array for a venue no strategy uses", () => {
    expect(getStrategiesByVenue("__no-such-venue__")).toEqual([]);
  });
});

describe("getStrategiesByClientId", () => {
  it("filters strategies by client id", () => {
    if (STRATEGIES.length === 0) return;
    const clientId = STRATEGIES[0].clientId;
    const filtered = getStrategiesByClientId(clientId);
    for (const s of filtered) {
      expect(s.clientId).toBe(clientId);
    }
  });
});

describe("getStrategiesByExecutionMode", () => {
  it("filters strategies by execution mode", () => {
    if (STRATEGIES.length === 0) return;
    const mode = STRATEGIES[0].executionMode;
    const filtered = getStrategiesByExecutionMode(mode);
    for (const s of filtered) {
      expect(s.executionMode).toBe(mode);
    }
  });
});

describe("portfolio aggregation helpers", () => {
  it("getTotalAUM sums absolute net exposures", () => {
    const total = getTotalAUM();
    expect(total).toBeGreaterThanOrEqual(0);
    // Custom slice behaviour
    expect(getTotalAUM([])).toBe(0);
  });

  it("getTotalPnL sums pnlTotal across strategies", () => {
    const total = getTotalPnL();
    expect(typeof total).toBe("number");
    expect(getTotalPnL([])).toBe(0);
  });

  it("getTotalMTDPnL sums pnlMTD across strategies", () => {
    const total = getTotalMTDPnL();
    expect(typeof total).toBe("number");
    expect(getTotalMTDPnL([])).toBe(0);
  });
});
