/**
 * Unit tests for `lib/architecture-v2/user-instrument-types.ts`.
 *
 * Covers the 5-persona derivation matrix from the DART tile-split plan:
 * admin (wildcard bypass), DART-Full client (entitled-only reality), Signals-In
 * client (FOMO mode adds teaser views), DeFi-only client (asset-group scoped),
 * data-only client (empty derivation).
 *
 * SSOT: codex/14-playbooks/dart/dart-terminal-vs-research.md.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthUser } from "@/lib/auth/types";
import type { StrategyInstrumentsJson } from "@/lib/architecture-v2/envelope-loader";

const FIXTURE: StrategyInstrumentsJson = {
  schema_version: "1",
  generated_at: "2026-04-28T00:00:00Z",
  source_script: "test-fixture",
  resolver: "test-fixture",
  slot_count: 6,
  slots: {
    "ML_DIRECTIONAL_CONTINUOUS@cefi-spot-binance": {
      archetype_id: "ML_DIRECTIONAL_CONTINUOUS",
      category: "cefi",
      instrument_type: "spot",
      venue: "binance",
      instrument_bucket: null,
      instruments: ["BTCUSDT"],
      source: "test",
    },
    "VOL_TRADING_OPTIONS@cefi-option-deribit": {
      archetype_id: "VOL_TRADING_OPTIONS",
      category: "cefi",
      instrument_type: "option",
      venue: "deribit",
      instrument_bucket: null,
      instruments: ["BTC-30JUN-50000-C"],
      source: "test",
    },
    "ARBITRAGE_FUNDING_RATE@defi-perp-hyperliquid": {
      archetype_id: "ARBITRAGE_FUNDING_RATE",
      category: "defi",
      instrument_type: "perp",
      venue: "hyperliquid",
      instrument_bucket: null,
      instruments: ["BTC-PERP"],
      source: "test",
    },
    "EVENT_DRIVEN_SPORTS@sports-fixed_odds-betfair": {
      archetype_id: "EVENT_DRIVEN_SPORTS",
      category: "sports",
      instrument_type: "fixed_odds",
      venue: "betfair",
      instrument_bucket: "EPL",
      instruments: ["MAN-CHE-2026"],
      source: "test",
    },
    "STAT_ARB_PAIRS_PREDICTION@prediction-event-polymarket": {
      archetype_id: "STAT_ARB_PAIRS_PREDICTION",
      category: "prediction",
      instrument_type: "prediction_event",
      venue: "polymarket",
      instrument_bucket: null,
      instruments: ["election-2028"],
      source: "test",
    },
    "CARRY_BASIS_PERP@cefi-perp-bybit": {
      archetype_id: "CARRY_BASIS_PERP",
      category: "cefi",
      instrument_type: "perp",
      venue: "bybit",
      instrument_bucket: null,
      instruments: ["BTCUSDT"],
      source: "test",
    },
  },
};

const loadStrategyInstrumentsMock = vi.fn<() => Promise<StrategyInstrumentsJson>>(async () => FIXTURE);

vi.mock("@/lib/architecture-v2/envelope-loader", () => ({
  loadStrategyInstruments: () => loadStrategyInstrumentsMock(),
}));

// Resolve after mock is in place so the import binds to the mocked module.
let instrumentTypesForUser: typeof import("@/lib/architecture-v2/user-instrument-types").instrumentTypesForUser;
let assetGroupsForUser: typeof import("@/lib/architecture-v2/user-instrument-types").assetGroupsForUser;
let teaserStrategiesForUser: typeof import("@/lib/architecture-v2/user-instrument-types").teaserStrategiesForUser;

beforeEach(async () => {
  loadStrategyInstrumentsMock.mockClear();
  loadStrategyInstrumentsMock.mockResolvedValue(FIXTURE);
  ({ instrumentTypesForUser, assetGroupsForUser, teaserStrategiesForUser } =
    await import("@/lib/architecture-v2/user-instrument-types"));
});

afterEach(() => {
  vi.clearAllMocks();
});

function makeUser(overrides: Partial<AuthUser>): AuthUser {
  return {
    uid: "test-uid",
    email: "test@odum.test",
    displayName: "Test User",
    role: "client",
    org: { id: "test-org", name: "Test Org" },
    entitlements: [],
    assigned_strategies: [],
    ...overrides,
  } as AuthUser;
}

describe("instrumentTypesForUser", () => {
  it("admin (wildcard) returns ALL instrument types + ALL asset groups", async () => {
    const admin = makeUser({ entitlements: ["*"] });
    const result = await instrumentTypesForUser(admin);
    expect(result.instrumentTypes.has("option")).toBe(true);
    expect(result.instrumentTypes.has("perp")).toBe(true);
    expect(result.instrumentTypes.has("fixed_odds")).toBe(true);
    expect(result.assetGroups).toEqual(new Set(["CEFI", "DEFI", "SPORTS", "TRADFI", "PREDICTION"]));
    // Admin path skips the GCS lookup entirely.
    expect(loadStrategyInstrumentsMock).not.toHaveBeenCalled();
  });

  it("DART-Full client (reality mode) returns only entitled-strategy types", async () => {
    const user = makeUser({
      entitlements: ["strategy-full", "ml-full", "execution-full"],
      assigned_strategies: ["ML_DIRECTIONAL_CONTINUOUS@cefi-spot-binance", "VOL_TRADING_OPTIONS@cefi-option-deribit"],
    });
    const result = await instrumentTypesForUser(user, "reality");
    expect(result.instrumentTypes).toEqual(new Set(["spot", "option"]));
    expect(result.assetGroups).toEqual(new Set(["CEFI"]));
  });

  it("Signals-In client in FOMO mode unlocks teaser strategies' instrument types", async () => {
    const user = makeUser({
      entitlements: ["execution-full", "data-pro"],
      // Only entitled to one carry-basis-perp slot
      assigned_strategies: ["CARRY_BASIS_PERP@cefi-perp-bybit"],
    });
    const reality = await instrumentTypesForUser(user, "reality");
    expect(reality.instrumentTypes).toEqual(new Set(["perp"]));
    expect(reality.assetGroups).toEqual(new Set(["CEFI"]));

    const fomo = await instrumentTypesForUser(user, "fomo");
    // FOMO adds the first 4 slots that are NOT in assigned_strategies. With
    // the fixture sorted by slot key, those are: ARBITRAGE_FUNDING_RATE@defi,
    // EVENT_DRIVEN_SPORTS@sports, ML_DIRECTIONAL@cefi, STAT_ARB@prediction.
    expect(fomo.instrumentTypes.has("perp")).toBe(true);
    expect(fomo.instrumentTypes.has("fixed_odds")).toBe(true);
    expect(fomo.instrumentTypes.has("spot")).toBe(true);
    expect(fomo.instrumentTypes.has("prediction_event")).toBe(true);
    expect(fomo.assetGroups.has("CEFI")).toBe(true);
    expect(fomo.assetGroups.has("DEFI")).toBe(true);
    expect(fomo.assetGroups.has("SPORTS")).toBe(true);
    expect(fomo.assetGroups.has("PREDICTION")).toBe(true);
  });

  it("DeFi-only client (Patrick base / elysium-defi) returns DEFI asset group only in reality mode", async () => {
    const user = makeUser({
      entitlements: ["execution-full", { domain: "trading-defi", tier: "basic" }],
      assigned_strategies: ["ARBITRAGE_FUNDING_RATE@defi-perp-hyperliquid"],
    });
    const result = await instrumentTypesForUser(user, "reality");
    expect(result.instrumentTypes).toEqual(new Set(["perp"]));
    expect(result.assetGroups).toEqual(new Set(["DEFI"]));
  });

  it("data-only client with no assigned_strategies returns empty sets", async () => {
    const user = makeUser({
      entitlements: ["data-basic"],
      assigned_strategies: [],
    });
    const result = await instrumentTypesForUser(user, "reality");
    expect(result.instrumentTypes.size).toBe(0);
    expect(result.assetGroups.size).toBe(0);
  });

  it("returns empty sets for null user", async () => {
    const result = await instrumentTypesForUser(null);
    expect(result.instrumentTypes.size).toBe(0);
    expect(result.assetGroups.size).toBe(0);
  });
});

describe("assetGroupsForUser", () => {
  it("convenience wrapper yields the asset_groups slice only", async () => {
    const user = makeUser({
      entitlements: ["strategy-full", "ml-full"],
      assigned_strategies: ["EVENT_DRIVEN_SPORTS@sports-fixed_odds-betfair"],
    });
    const result = await assetGroupsForUser(user, "reality");
    expect(result).toEqual(new Set(["SPORTS"]));
  });
});

describe("teaserStrategiesForUser", () => {
  it("returns the first N slot keys not in assigned_strategies, sorted ascending", async () => {
    const user = makeUser({
      assigned_strategies: ["CARRY_BASIS_PERP@cefi-perp-bybit"],
    });
    const teasers = await teaserStrategiesForUser(user);
    // 6 slots in fixture - 1 assigned = 5 candidates. Default count = 4.
    expect(teasers.length).toBe(4);
    // Sorted ascending; CARRY_BASIS_PERP was assigned, so the next four
    // alphabetically are ARBITRAGE_*, EVENT_DRIVEN_*, ML_DIRECTIONAL_*, STAT_ARB_*.
    expect(teasers[0]).toBe("ARBITRAGE_FUNDING_RATE@defi-perp-hyperliquid");
    expect(teasers[1]).toBe("EVENT_DRIVEN_SPORTS@sports-fixed_odds-betfair");
    expect(teasers[2]).toBe("ML_DIRECTIONAL_CONTINUOUS@cefi-spot-binance");
    expect(teasers[3]).toBe("STAT_ARB_PAIRS_PREDICTION@prediction-event-polymarket");
  });

  it("respects the count argument", async () => {
    const user = makeUser({});
    const teasers = await teaserStrategiesForUser(user, 2);
    expect(teasers.length).toBe(2);
  });

  it("returns empty when count <= 0", async () => {
    const user = makeUser({});
    const teasers = await teaserStrategiesForUser(user, 0);
    expect(teasers).toEqual([]);
  });
});
