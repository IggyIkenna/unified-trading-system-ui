import { describe, expect, it } from "vitest";

import {
  ALL_ENTITLEMENTS,
  CLIENT_TIER_FEATURES,
  STRATEGY_FAMILY_KEYS,
  TRADING_DOMAINS,
  TRADING_TIERS,
  checkStrategyFamilyEntitlement,
  checkTradingEntitlement,
  deriveClientTier,
  isStrategyFamilyEntitlement,
  isTradingEntitlement,
  type EntitlementOrWildcard,
  type StrategyFamilyEntitlement,
  type TradingEntitlement,
} from "@/lib/config/auth";

describe("isTradingEntitlement", () => {
  it("returns true for well-formed trading entitlement", () => {
    const e: TradingEntitlement = { domain: "trading-defi", tier: "basic" };
    expect(isTradingEntitlement(e)).toBe(true);
  });

  it("returns false for wildcard string", () => {
    expect(isTradingEntitlement("*")).toBe(false);
  });

  it("returns false for plain entitlement string", () => {
    expect(isTradingEntitlement("data-pro")).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isTradingEntitlement(null)).toBe(false);
    expect(isTradingEntitlement(undefined)).toBe(false);
  });

  it("returns false when domain or tier invalid", () => {
    expect(isTradingEntitlement({ domain: "bad", tier: "basic" })).toBe(false);
    expect(isTradingEntitlement({ domain: "trading-defi", tier: "bad" })).toBe(false);
  });

  it("returns false for an object missing required keys", () => {
    expect(isTradingEntitlement({ domain: "trading-defi" })).toBe(false);
    expect(isTradingEntitlement({ tier: "basic" })).toBe(false);
    expect(isTradingEntitlement({})).toBe(false);
  });
});

describe("checkTradingEntitlement", () => {
  it("wildcard user satisfies anything", () => {
    expect(checkTradingEntitlement(["*"] as const, { domain: "trading-defi", tier: "premium" })).toBe(true);
  });

  it("exact match (basic) satisfies basic requirement", () => {
    expect(
      checkTradingEntitlement([{ domain: "trading-defi", tier: "basic" }], {
        domain: "trading-defi",
        tier: "basic",
      }),
    ).toBe(true);
  });

  it("premium tier satisfies basic requirement", () => {
    expect(
      checkTradingEntitlement([{ domain: "trading-defi", tier: "premium" }], {
        domain: "trading-defi",
        tier: "basic",
      }),
    ).toBe(true);
  });

  it("basic tier does NOT satisfy premium requirement", () => {
    expect(
      checkTradingEntitlement([{ domain: "trading-defi", tier: "basic" }], {
        domain: "trading-defi",
        tier: "premium",
      }),
    ).toBe(false);
  });

  it("wrong domain never satisfies", () => {
    expect(
      checkTradingEntitlement([{ domain: "trading-sports", tier: "premium" }], {
        domain: "trading-defi",
        tier: "basic",
      }),
    ).toBe(false);
  });

  it("plain entitlements in the list do not falsely satisfy", () => {
    const ents: readonly (EntitlementOrWildcard | TradingEntitlement)[] = ["data-pro", "execution-full"];
    expect(checkTradingEntitlement(ents, { domain: "trading-defi", tier: "basic" })).toBe(false);
  });
});

describe("isStrategyFamilyEntitlement", () => {
  it("returns true for well-formed strategy family entitlement", () => {
    const e: StrategyFamilyEntitlement = { family: "CARRY_AND_YIELD", tier: "basic" };
    expect(isStrategyFamilyEntitlement(e)).toBe(true);
  });

  it("returns false for trading entitlement (different shape)", () => {
    expect(isStrategyFamilyEntitlement({ domain: "trading-defi", tier: "basic" })).toBe(false);
  });

  it("returns false for invalid family / tier", () => {
    expect(isStrategyFamilyEntitlement({ family: "NOT_A_FAMILY", tier: "basic" })).toBe(false);
    expect(isStrategyFamilyEntitlement({ family: "CARRY_AND_YIELD", tier: "ultra" })).toBe(false);
  });

  it("returns false for null / wildcard / plain string", () => {
    expect(isStrategyFamilyEntitlement(null)).toBe(false);
    expect(isStrategyFamilyEntitlement("*")).toBe(false);
    expect(isStrategyFamilyEntitlement("data-pro")).toBe(false);
  });
});

describe("checkStrategyFamilyEntitlement", () => {
  it("wildcard user satisfies any family", () => {
    expect(checkStrategyFamilyEntitlement(["*"] as const, { family: "CARRY_AND_YIELD", tier: "premium" })).toBe(true);
  });

  it("exact match satisfies", () => {
    expect(
      checkStrategyFamilyEntitlement([{ family: "CARRY_AND_YIELD", tier: "basic" }], {
        family: "CARRY_AND_YIELD",
        tier: "basic",
      }),
    ).toBe(true);
  });

  it("premium tier satisfies basic", () => {
    expect(
      checkStrategyFamilyEntitlement([{ family: "CARRY_AND_YIELD", tier: "premium" }], {
        family: "CARRY_AND_YIELD",
        tier: "basic",
      }),
    ).toBe(true);
  });

  it("basic does not satisfy premium", () => {
    expect(
      checkStrategyFamilyEntitlement([{ family: "CARRY_AND_YIELD", tier: "basic" }], {
        family: "CARRY_AND_YIELD",
        tier: "premium",
      }),
    ).toBe(false);
  });

  it("wrong family never satisfies", () => {
    expect(
      checkStrategyFamilyEntitlement([{ family: "ML_DIRECTIONAL", tier: "premium" }], {
        family: "CARRY_AND_YIELD",
        tier: "basic",
      }),
    ).toBe(false);
  });

  it("trading entitlements in the list do not falsely satisfy", () => {
    expect(
      checkStrategyFamilyEntitlement([{ domain: "trading-defi", tier: "premium" }], {
        family: "CARRY_AND_YIELD",
        tier: "basic",
      }),
    ).toBe(false);
  });
});

describe("STRATEGY_FAMILY_KEYS", () => {
  it("contains the 8 v2 families", () => {
    expect(STRATEGY_FAMILY_KEYS).toHaveLength(8);
    expect(STRATEGY_FAMILY_KEYS).toContain("CARRY_AND_YIELD");
    expect(STRATEGY_FAMILY_KEYS).toContain("ML_DIRECTIONAL");
  });
});

describe("deriveClientTier", () => {
  it("returns Client Full for wildcard", () => {
    expect(deriveClientTier(["*" as const])).toBe("Client Full");
  });

  it("returns DeFi Client when user has a trading-defi entitlement", () => {
    expect(deriveClientTier([{ domain: "trading-defi", tier: "basic" }, "data-pro"])).toBe("DeFi Client");
  });

  it("returns Client Full for full bundle", () => {
    expect(deriveClientTier(["data-pro", "execution-full", "ml-full", "strategy-full", "reporting"])).toBe(
      "Client Full",
    );
  });

  it("returns Client Premium for premium bundle (no ml)", () => {
    expect(deriveClientTier(["data-pro", "execution-full", "strategy-full"])).toBe("Client Premium");
  });

  it("returns Data Pro for data-pro only", () => {
    expect(deriveClientTier(["data-pro"])).toBe("Data Pro");
  });

  it("returns Data Basic for data-basic only", () => {
    expect(deriveClientTier(["data-basic"])).toBe("Data Basic");
  });

  it("returns Custom for anything else", () => {
    expect(deriveClientTier(["execution-basic"])).toBe("Custom");
    expect(deriveClientTier([])).toBe("Custom");
  });
});

describe("CLIENT_TIER_FEATURES", () => {
  it("has an entry for every ClientTier", () => {
    expect(CLIENT_TIER_FEATURES["Client Full"].length).toBeGreaterThan(0);
    expect(CLIENT_TIER_FEATURES["Client Premium"].length).toBeGreaterThan(0);
    expect(CLIENT_TIER_FEATURES["DeFi Client"].length).toBeGreaterThan(0);
    expect(CLIENT_TIER_FEATURES["Data Pro"].length).toBeGreaterThan(0);
    expect(CLIENT_TIER_FEATURES["Data Basic"].length).toBeGreaterThan(0);
    expect(CLIENT_TIER_FEATURES.Custom.length).toBeGreaterThan(0);
  });
});

describe("exported constants", () => {
  it("TRADING_DOMAINS contains expected domains", () => {
    expect(TRADING_DOMAINS).toContain("trading-defi");
    expect(TRADING_DOMAINS).toContain("trading-sports");
  });

  it("TRADING_TIERS is exactly basic + premium", () => {
    expect(TRADING_TIERS).toEqual(["basic", "premium"]);
  });

  it("ALL_ENTITLEMENTS wildcard constant", () => {
    expect(ALL_ENTITLEMENTS).toBe("*");
  });
});
