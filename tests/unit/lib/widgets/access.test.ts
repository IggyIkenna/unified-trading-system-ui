import { describe, expect, it } from "vitest";

import { checkWidgetAccess } from "@/lib/widgets/access";
import { getPersonaById } from "@/lib/auth/personas";
import { getWidget } from "@/components/widgets/widget-registry";

// Side-effect imports — register all widgets so getWidget() can resolve them.
import "@/components/widgets/defi/register";

/**
 * Persona × widget access matrix for the Carry & Yield family-entitlement
 * worked example. This is the durable contract: if any of these expectations
 * flip in a refactor, the regression is caught here rather than from a user
 * report.
 *
 * Strategy-family entitlements are mirrored in the carry-{basic,premium}-client
 * personas defined in lib/auth/personas.ts.
 */

const CARRY_YIELD_WIDGETS = [
  "defi-lending",
  "defi-staking",
  "defi-rates-overview",
  "defi-staking-rewards",
  "defi-funding-matrix",
] as const;

// DeFi widgets that are NOT tagged with the Carry & Yield family — should
// remain locked for a family-only client.
const DEFI_OTHER_WIDGETS = ["defi-swap", "defi-liquidity", "defi-flash-loans"] as const;

describe("widget access — Carry & Yield family entitlement", () => {
  const carryBasic = getPersonaById("carry-yield-basic-client");
  const carryPremium = getPersonaById("carry-yield-premium-client");

  it("personas are registered", () => {
    expect(carryBasic).toBeDefined();
    expect(carryPremium).toBeDefined();
  });

  it("Carry Basic client unlocks all 5 Carry & Yield widgets", () => {
    for (const id of CARRY_YIELD_WIDGETS) {
      const def = getWidget(id);
      expect(def, `widget ${id} should be registered`).toBeDefined();
      expect(checkWidgetAccess(carryBasic!, def!), `${id} should unlock for Carry Basic`).toBe(true);
    }
  });

  it("Carry Basic client is locked out of non-family DeFi widgets", () => {
    for (const id of DEFI_OTHER_WIDGETS) {
      const def = getWidget(id);
      expect(def, `widget ${id} should be registered`).toBeDefined();
      expect(checkWidgetAccess(carryBasic!, def!), `${id} should stay locked for Carry Basic`).toBe(false);
    }
  });

  it("Carry Premium tier covers Basic — same widgets unlock", () => {
    for (const id of CARRY_YIELD_WIDGETS) {
      const def = getWidget(id);
      expect(checkWidgetAccess(carryPremium!, def!), `${id} should unlock for Carry Premium`).toBe(true);
    }
  });

  it("admin sees every widget regardless of tags", () => {
    const admin = getPersonaById("admin");
    expect(admin).toBeDefined();
    for (const id of [...CARRY_YIELD_WIDGETS, ...DEFI_OTHER_WIDGETS]) {
      const def = getWidget(id);
      expect(checkWidgetAccess(admin!, def!), `${id} should unlock for admin`).toBe(true);
    }
  });

  it("user with no entitlements is locked out of every gated widget", () => {
    const noEnts = { role: "client", entitlements: [] as never[] };
    for (const id of [...CARRY_YIELD_WIDGETS, ...DEFI_OTHER_WIDGETS]) {
      const def = getWidget(id);
      expect(checkWidgetAccess(noEnts, def!), `${id} should lock for empty entitlements`).toBe(false);
    }
  });
});
