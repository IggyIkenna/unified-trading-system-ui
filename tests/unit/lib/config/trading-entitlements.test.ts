import { describe, it, expect } from "vitest";
import {
  checkTradingEntitlement,
  isTradingEntitlement,
  TRADING_DOMAINS,
  TRADING_TIERS,
  type TradingEntitlement,
  type EntitlementOrWildcard,
} from "@/lib/config/auth";
import { hasAnyEntitlement } from "@/components/platform/entitlement-gate";

describe("isTradingEntitlement", () => {
  it("returns true for valid TradingEntitlement objects", () => {
    expect(isTradingEntitlement({ domain: "trading-defi", tier: "basic" })).toBe(true);
    expect(isTradingEntitlement({ domain: "trading-common", tier: "premium" })).toBe(true);
  });

  it("returns false for flat entitlement strings", () => {
    expect(isTradingEntitlement("data-pro")).toBe(false);
    expect(isTradingEntitlement("*")).toBe(false);
    expect(isTradingEntitlement("execution-full")).toBe(false);
  });

  it("returns false for invalid object shapes", () => {
    expect(isTradingEntitlement(null)).toBe(false);
    expect(isTradingEntitlement(undefined)).toBe(false);
    expect(isTradingEntitlement({})).toBe(false);
    expect(isTradingEntitlement({ domain: "trading-defi" })).toBe(false);
    expect(isTradingEntitlement({ tier: "basic" })).toBe(false);
  });

  it("returns false for objects with invalid domain or tier values", () => {
    expect(isTradingEntitlement({ domain: "defi-trading", tier: "basic" })).toBe(false);
    expect(isTradingEntitlement({ domain: "trading-defi", tier: "pro" })).toBe(false);
    expect(isTradingEntitlement({ domain: "trading-unknown", tier: "basic" })).toBe(false);
  });
});

describe("checkTradingEntitlement — tier hierarchy", () => {
  const basicDefi: TradingEntitlement = { domain: "trading-defi", tier: "basic" };
  const premiumDefi: TradingEntitlement = { domain: "trading-defi", tier: "premium" };
  const basicSports: TradingEntitlement = { domain: "trading-sports", tier: "basic" };

  it("basic user satisfies basic requirement", () => {
    expect(checkTradingEntitlement([basicDefi], basicDefi)).toBe(true);
  });

  it("premium user satisfies basic requirement (premium ≥ basic)", () => {
    expect(checkTradingEntitlement([premiumDefi], basicDefi)).toBe(true);
  });

  it("premium user satisfies premium requirement", () => {
    expect(checkTradingEntitlement([premiumDefi], premiumDefi)).toBe(true);
  });

  it("basic user does NOT satisfy premium requirement", () => {
    expect(checkTradingEntitlement([basicDefi], premiumDefi)).toBe(false);
  });

  it("cross-domain entitlement does NOT grant access", () => {
    expect(checkTradingEntitlement([basicSports], basicDefi)).toBe(false);
    expect(checkTradingEntitlement([premiumDefi], basicSports)).toBe(false);
  });

  it("wildcard '*' grants any trading entitlement", () => {
    const userEnts: readonly EntitlementOrWildcard[] = ["*"];
    expect(checkTradingEntitlement(userEnts, basicDefi)).toBe(true);
    expect(checkTradingEntitlement(userEnts, premiumDefi)).toBe(true);
  });

  it("empty entitlements list never satisfies", () => {
    expect(checkTradingEntitlement([], basicDefi)).toBe(false);
  });

  it("mixed array — only matching TradingEntitlement counts", () => {
    const mixed: readonly (EntitlementOrWildcard | TradingEntitlement)[] = ["data-pro", "execution-full", basicDefi];
    expect(checkTradingEntitlement(mixed, basicDefi)).toBe(true);
    expect(checkTradingEntitlement(mixed, basicSports)).toBe(false);
  });
});

describe("hasAnyEntitlement — mixed required arrays", () => {
  const alwaysFalse = () => false;
  const accept = (accepted: string[]) => (e: string) => accepted.includes(e);

  it("returns true when any required entitlement is satisfied", () => {
    const required = ["data-pro", { domain: "trading-defi", tier: "basic" } as TradingEntitlement];
    const userEnts = [{ domain: "trading-defi", tier: "basic" } as TradingEntitlement];
    expect(hasAnyEntitlement(required, alwaysFalse, userEnts)).toBe(true);
  });

  it("returns true for string entitlement match via checker", () => {
    const required = ["data-pro"];
    expect(hasAnyEntitlement(required, accept(["data-pro"]), [])).toBe(true);
  });

  it("returns true for data-basic → data-pro hierarchy", () => {
    const required = ["data-basic"];
    expect(hasAnyEntitlement(required, accept(["data-pro"]), [])).toBe(true);
  });

  it("returns false when nothing matches", () => {
    const required = ["data-pro", { domain: "trading-defi", tier: "basic" } as TradingEntitlement];
    expect(hasAnyEntitlement(required, alwaysFalse, [])).toBe(false);
  });
});

describe("constants integrity", () => {
  it("has the expected 5 trading domains", () => {
    expect(TRADING_DOMAINS).toEqual([
      "trading-common",
      "trading-defi",
      "trading-sports",
      "trading-options",
      "trading-predictions",
    ]);
  });

  it("has exactly 2 tiers in ascending order", () => {
    expect(TRADING_TIERS).toEqual(["basic", "premium"]);
  });
});
