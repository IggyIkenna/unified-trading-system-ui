import { describe, expect, it } from "vitest";

import { checkWidgetAccess } from "@/lib/widgets/access";
import { getPersonaById } from "@/lib/auth/personas";
import { getWidget } from "@/components/widgets/widget-registry";

// Side-effect imports — register all widgets so getWidget() can resolve them.
import "@/components/widgets/defi/register";

/**
 * Persona × widget access matrix for Patrick (Elysium) and Desmond.
 *
 * These two personas are the canonical real-client demos for closed-list
 * scope: each has an `assigned_strategies` field that pins their access to
 * specific (archetype, venue) slots. The widget access predicate uses three
 * layers — entitlement OR-list, AND-list, slot-label match — and these tests
 * exercise the third (slot match) on top of the existing OR-list checks.
 *
 * Patrick (elysium-defi base):  CARRY_BASIS_PERP, CARRY_STAKED_BASIS
 * Patrick (elysium-defi-full): + CARRY_RECURSIVE_STAKED, YIELD_ROTATION_LENDING ×2
 * Desmond (dart-full):  CARRY_BASIS_PERP ×4, ARBITRAGE_PRICE_DISPERSION ×3,
 *                       STAT_ARB_CROSS_SECTIONAL ×2, ML_DIRECTIONAL_CONTINUOUS ×2
 * Desmond (signals-in): same 11 slots, fewer entitlements
 *
 * Both Patrick personas already hold {trading-defi: basic} which on its own
 * unlocks all 5 currently-tagged Carry widgets via the OR-list. The slot-
 * match path is mainly a safety net for closed-list-only personas (none in
 * the codebase yet) — but the test still asserts the matrix as it stands so
 * a regression in the OR-list behaviour would surface here.
 */

const CARRY_WIDGETS_DEFI = [
  "defi-lending",
  "defi-staking",
  "defi-rates-overview",
  "defi-staking-rewards",
  "defi-funding-matrix",
] as const;

describe("widget access — Patrick (elysium-defi)", () => {
  const patrick = getPersonaById("elysium-defi");
  const patrickFull = getPersonaById("elysium-defi-full");

  it("personas exist and carry assigned_strategies", () => {
    expect(patrick?.assigned_strategies?.length).toBe(2);
    expect(patrickFull?.assigned_strategies?.length).toBe(5);
  });

  it("Patrick base unlocks all 5 Carry widgets via trading-defi domain", () => {
    // The OR-list path: {trading-defi: basic} is in his entitlements.
    for (const id of CARRY_WIDGETS_DEFI) {
      const def = getWidget(id);
      expect(def, `widget ${id} should exist`).toBeDefined();
      expect(checkWidgetAccess(patrick!, def!), `${id} should unlock for Patrick base`).toBe(true);
    }
  });

  it("Patrick full unlocks all 5 Carry widgets (same as base + strategy-full)", () => {
    for (const id of CARRY_WIDGETS_DEFI) {
      const def = getWidget(id);
      expect(checkWidgetAccess(patrickFull!, def!), `${id} should unlock for Patrick full`).toBe(true);
    }
  });
});

describe("widget access — Desmond", () => {
  const desmondDart = getPersonaById("desmond-dart-full");
  const desmondSignals = getPersonaById("desmond-signals-in");

  it("both Desmond personas carry the same 11 assigned_strategies", () => {
    expect(desmondDart?.assigned_strategies?.length).toBe(11);
    expect(desmondSignals?.assigned_strategies).toEqual(desmondDart?.assigned_strategies);
  });

  it("Desmond unlocks defi-funding-matrix via trading-defi domain", () => {
    const def = getWidget("defi-funding-matrix");
    expect(def?.archetypes).toContain("CARRY_BASIS_PERP");
    expect(checkWidgetAccess(desmondDart!, def!)).toBe(true);
    expect(checkWidgetAccess(desmondSignals!, def!)).toBe(true);
  });

  it("Desmond unlocks the other 4 DeFi-tagged Carry widgets via trading-defi domain", () => {
    for (const id of ["defi-lending", "defi-staking", "defi-rates-overview", "defi-staking-rewards"] as const) {
      const def = getWidget(id);
      expect(checkWidgetAccess(desmondDart!, def!), `${id} should unlock for Desmond DART Full`).toBe(true);
    }
  });
});

describe("widget access — slot-match path (closed-list-only persona)", () => {
  // Synthetic persona with NO trading-defi entitlement, only a slot label.
  // Verifies the slot-match path unlocks a widget when the OR-list would fail.
  it("slot-match unlocks a widget when broad entitlements would fail", () => {
    const slotOnlyUser = {
      role: "client",
      entitlements: ["data-pro" as const],
      assigned_strategies: ["YIELD_ROTATION_LENDING@aave-multichain-usdc-prod"] as const,
    };
    const def = getWidget("defi-lending");
    expect(def?.archetypes).toContain("YIELD_ROTATION_LENDING");
    expect(checkWidgetAccess(slotOnlyUser, def!), "defi-lending should unlock via slot match alone").toBe(true);
  });

  it("slot-match does NOT unlock a widget whose archetype is unrelated", () => {
    const slotOnlyUser = {
      role: "client",
      entitlements: ["data-pro" as const],
      assigned_strategies: ["YIELD_ROTATION_LENDING@aave-multichain-usdc-prod"] as const,
    };
    // defi-funding-matrix is tagged CARRY_BASIS_PERP — not in our slot list.
    const def = getWidget("defi-funding-matrix");
    expect(def?.archetypes).toEqual(["CARRY_BASIS_PERP"]);
    expect(checkWidgetAccess(slotOnlyUser, def!), "defi-funding-matrix should stay locked").toBe(false);
  });

  it("slot-match honours `requiredEntitlementsAll` (AND-list still blocks)", () => {
    // Synthetic widget that requires both an OR-list match AND an AND-list match.
    // The slot-match path replaces the OR-list, but the AND-list still applies.
    const def = {
      requiredEntitlements: [{ family: "CARRY_AND_YIELD" as const, tier: "basic" as const }],
      requiredEntitlementsAll: ["execution-full" as const],
      archetypes: ["YIELD_ROTATION_LENDING" as const],
    };
    const slotOnlyMissingAndList = {
      role: "client",
      entitlements: ["data-pro" as const],
      assigned_strategies: ["YIELD_ROTATION_LENDING@aave-prod"] as const,
    };
    // Slot match satisfies OR-list, but no execution-full → AND-list fails.
    expect(checkWidgetAccess(slotOnlyMissingAndList, def)).toBe(false);

    const slotMatchWithAndList = {
      role: "client",
      entitlements: ["data-pro" as const, "execution-full" as const],
      assigned_strategies: ["YIELD_ROTATION_LENDING@aave-prod"] as const,
    };
    expect(checkWidgetAccess(slotMatchWithAndList, def)).toBe(true);
  });
});
