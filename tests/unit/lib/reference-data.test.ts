import { describe, expect, it } from "vitest";

import {
  ACCESS_MODES,
  DATA_FLOWS,
  EXECUTION_ALGORITHMS,
  PNL_FACTORS,
  SERVICES,
  SERVICE_PORTS,
  STRATEGY_ARCHETYPES,
  STRATEGY_TYPES,
  UNDERLYINGS,
  VENUE_ACCESS_MODES,
  VENUE_CATEGORIES,
  asset_group_LABELS,
  formatCurrency,
  formatPercent,
  getBetStatusColor,
  getDataFlowsByDomain,
  getDataFlowsByMode,
  getDeploymentStatusColor,
  getInstrumentTypesForVenue,
  getOrderStatusColor,
  getRiskStatusColor,
  getServicesByDomain,
  getServicesByType,
  getUnderlyingsByType,
  getVenueAccessMode,
  getVenueAssetGroup,
  getVenueAssetGroupColor,
  getVenuesByAssetGroup,
  isExchangeVenue,
  isSportsVenue,
  isZeroAlphaVenue,
} from "@/lib/reference-data";

describe("reference-data — exported constants", () => {
  it("VENUE_CATEGORIES covers the expected keys", () => {
    expect(VENUE_CATEGORIES.cefi).toBe("CeFi");
    expect(VENUE_CATEGORIES.tradfi).toBe("TradFi");
    expect(VENUE_CATEGORIES.defi).toBe("DeFi");
    expect(VENUE_CATEGORIES.sports).toBe("Sports");
    expect(VENUE_CATEGORIES.prediction).toBe("Prediction");
  });

  it("ACCESS_MODES covers 4 modes", () => {
    expect(ACCESS_MODES).toEqual(["rest_polling", "streaming_websocket", "batch_file", "graphql"]);
  });

  it("VENUE_ACCESS_MODES maps named venues", () => {
    expect(VENUE_ACCESS_MODES.POLYMARKET).toBe("streaming_websocket");
    expect(VENUE_ACCESS_MODES.DATABENTO).toBe("streaming_websocket");
    expect(VENUE_ACCESS_MODES.TARDIS).toBe("batch_file");
    expect(VENUE_ACCESS_MODES.THEGRAPH).toBe("graphql");
  });

  it("asset_group_LABELS covers the core asset classes", () => {
    expect(asset_group_LABELS.crypto).toBe("Crypto");
    expect(asset_group_LABELS.equity).toBe("Equity");
    expect(asset_group_LABELS.fx).toBe("FX");
  });

  it("SERVICE_PORTS has known services mapped to ports", () => {
    expect(SERVICE_PORTS["deployment-api"]).toBe(8004);
    expect(SERVICE_PORTS["execution-service"]).toBe(8011);
    expect(SERVICE_PORTS["strategy-service"]).toBe(8025);
  });

  it("STRATEGY_ARCHETYPES contains 9 entries", () => {
    expect(STRATEGY_ARCHETYPES.length).toBe(9);
    for (const a of STRATEGY_ARCHETYPES) {
      expect(typeof a.id).toBe("string");
      expect(typeof a.label).toBe("string");
      expect(typeof a.color).toBe("string");
    }
  });

  it("STRATEGY_TYPES entries have archetype + domain", () => {
    for (const t of STRATEGY_TYPES) {
      expect(typeof t.id).toBe("string");
      expect(typeof t.archetype).toBe("string");
      expect(typeof t.domain).toBe("string");
    }
  });

  it("DATA_FLOWS is a non-empty list of flow descriptors", () => {
    expect(DATA_FLOWS.length).toBeGreaterThan(0);
    for (const f of DATA_FLOWS) {
      expect(typeof f.id).toBe("string");
      expect(typeof f.domain).toBe("string");
    }
  });

  it("SERVICES lists at least 20 services", () => {
    expect(SERVICES.length).toBeGreaterThanOrEqual(20);
  });

  it("PNL_FACTORS + EXECUTION_ALGORITHMS + UNDERLYINGS non-empty", () => {
    expect(PNL_FACTORS.length).toBeGreaterThan(0);
    expect(EXECUTION_ALGORITHMS.length).toBeGreaterThan(0);
    expect(UNDERLYINGS.length).toBeGreaterThan(0);
  });
});

describe("getVenueAccessMode", () => {
  it("returns registered mode for known venue", () => {
    expect(getVenueAccessMode("POLYMARKET")).toBe("streaming_websocket");
  });

  it("returns default 'rest_polling' for unknown venue", () => {
    expect(getVenueAccessMode("__no-such-venue__")).toBe("rest_polling");
  });
});

describe("getVenuesByAssetGroup / getVenueAssetGroup", () => {
  it("getVenuesByAssetGroup('sports') returns only sports venues", () => {
    const sports = getVenuesByAssetGroup("sports");
    for (const v of sports) {
      expect(getVenueAssetGroup(v)).toBe("sports");
    }
  });

  it("getVenueAssetGroup returns undefined for unknown venue", () => {
    expect(getVenueAssetGroup("__no-such-venue__")).toBeUndefined();
  });
});

describe("getInstrumentTypesForVenue", () => {
  it("returns an array (empty for unknown venue)", () => {
    expect(getInstrumentTypesForVenue("__no-such-venue__")).toEqual([]);
  });
});

describe("venue predicates", () => {
  it("isExchangeVenue is false for unknown venue", () => {
    expect(isExchangeVenue("__none__")).toBe(false);
  });

  it("isSportsVenue is false for unknown venue", () => {
    expect(isSportsVenue("__none__")).toBe(false);
  });

  it("isZeroAlphaVenue is false for unknown venue", () => {
    expect(isZeroAlphaVenue("__none__")).toBe(false);
  });
});

describe("status color helpers", () => {
  it("getRiskStatusColor", () => {
    expect(getRiskStatusColor("OK")).toContain("status-live");
    expect(getRiskStatusColor("WARNING")).toContain("status-warning");
    expect(getRiskStatusColor("CRITICAL")).toContain("status-critical");
    expect(getRiskStatusColor("UNKNOWN")).toContain("muted-foreground");
  });

  it("getOrderStatusColor covers each branch", () => {
    expect(getOrderStatusColor("filled")).toContain("status-live");
    expect(getOrderStatusColor("partially_filled")).toContain("status-warning");
    expect(getOrderStatusColor("open")).toContain("status-running");
    expect(getOrderStatusColor("pending")).toContain("status-running");
    expect(getOrderStatusColor("cancelled")).toContain("status-idle");
    expect(getOrderStatusColor("expired")).toContain("status-idle");
    expect(getOrderStatusColor("rejected")).toContain("status-critical");
    expect(getOrderStatusColor("other")).toContain("muted-foreground");
  });

  it("getBetStatusColor covers each branch", () => {
    expect(getBetStatusColor("settled_win")).toContain("pnl-positive");
    expect(getBetStatusColor("settled_loss")).toContain("pnl-negative");
    expect(getBetStatusColor("matched")).toContain("status-live");
    expect(getBetStatusColor("partially_matched")).toContain("status-warning");
    expect(getBetStatusColor("pending")).toContain("status-running");
    expect(getBetStatusColor("placed")).toContain("status-running");
    expect(getBetStatusColor("cancelled")).toContain("status-idle");
    expect(getBetStatusColor("settled_void")).toContain("status-idle");
    expect(getBetStatusColor("rejected")).toContain("status-critical");
    expect(getBetStatusColor("other")).toContain("muted-foreground");
  });

  it("getDeploymentStatusColor covers each branch", () => {
    expect(getDeploymentStatusColor("completed")).toContain("status-live");
    expect(getDeploymentStatusColor("running")).toContain("status-running");
    expect(getDeploymentStatusColor("pending")).toContain("status-idle");
    expect(getDeploymentStatusColor("failed")).toContain("status-critical");
    expect(getDeploymentStatusColor("timed_out")).toContain("status-critical");
    expect(getDeploymentStatusColor("cancelled")).toContain("status-warning");
    expect(getDeploymentStatusColor("other")).toContain("muted-foreground");
  });

  it("getVenueAssetGroupColor covers each branch", () => {
    expect(getVenueAssetGroupColor("cefi")).toContain("surface-trading");
    expect(getVenueAssetGroupColor("tradfi")).toContain("surface-markets");
    expect(getVenueAssetGroupColor("defi")).toContain("surface-config");
    expect(getVenueAssetGroupColor("sports")).toContain("surface-strategy");
    expect(getVenueAssetGroupColor("onchain_perps")).toContain("muted-foreground");
  });
});

describe("getDataFlowsByDomain / getDataFlowsByMode", () => {
  it("filters flows by domain", () => {
    const mlFlows = getDataFlowsByDomain("ml");
    for (const f of mlFlows) {
      expect(f.domain).toBe("ml");
    }
  });

  it("filters flows by mode", () => {
    const live = getDataFlowsByMode("live");
    const batch = getDataFlowsByMode("batch");
    for (const f of live) expect(f.mode).toBe("live");
    for (const f of batch) expect(f.mode).toBe("batch");
  });
});

describe("getServicesByDomain / getServicesByType", () => {
  it("filters services by domain", () => {
    const features = getServicesByDomain("features");
    for (const s of features) expect(s.domain).toBe("features");
    expect(features.length).toBeGreaterThan(0);
  });

  it("filters services by type", () => {
    const apis = getServicesByType("api-service");
    for (const s of apis) expect(s.type).toBe("api-service");
    expect(apis.length).toBeGreaterThan(0);
  });
});

describe("getUnderlyingsByType", () => {
  it("filters underlyings by type", () => {
    const crypto = getUnderlyingsByType("CRYPTO");
    for (const u of crypto) expect(u.type).toBe("CRYPTO");
    expect(crypto.length).toBeGreaterThan(0);
  });
});

describe("formatCurrency (reference-data's compact formatter)", () => {
  it("formats billions", () => {
    expect(formatCurrency(2_500_000_000)).toBe("3B");
    expect(formatCurrency(2_500_000_000, 1)).toBe("2.5B");
  });

  it("formats millions", () => {
    expect(formatCurrency(1_500_000, 1)).toBe("1.5M");
  });

  it("formats thousands", () => {
    expect(formatCurrency(2_500, 1)).toBe("2.5K");
  });

  it("formats plain", () => {
    expect(formatCurrency(42)).toBe("42");
  });

  it("handles negative values via absolute comparison", () => {
    expect(formatCurrency(-2_500_000, 1)).toBe("-2.5M");
  });
});

describe("formatPercent (reference-data)", () => {
  it("formats positive with + sign", () => {
    expect(formatPercent(12.34)).toBe("+12.34%");
  });

  it("formats negative without explicit + sign", () => {
    expect(formatPercent(-1.5)).toBe("-1.50%");
  });

  it("honours custom decimals", () => {
    expect(formatPercent(1.2345, 3)).toBe("+1.234%");
  });

  it("zero is treated as non-negative (+)", () => {
    expect(formatPercent(0)).toBe("+0.00%");
  });
});
