import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { TRADING_DOMAINS, type TradingDomain } from "@/lib/config/auth";

const REPO_ROOT = join(__dirname, "..", "..");
const WIDGETS_DIR = join(REPO_ROOT, "components", "widgets");

/**
 * Expected trading domain per widget category directory.
 * Categories not listed here are not trading-domain gated (e.g. investor pages)
 * or use a mix via const arrays (pnl, markets, predictions).
 */
const CATEGORY_DOMAIN: Record<string, TradingDomain> = {
  defi: "trading-defi",
  sports: "trading-sports",
  options: "trading-options",
  predictions: "trading-predictions",
  markets: "trading-common",
  pnl: "trading-common",
  overview: "trading-common",
  positions: "trading-common",
  orders: "trading-common",
  alerts: "trading-common",
  book: "trading-common",
  risk: "trading-common",
  accounts: "trading-common",
  instructions: "trading-common",
  bundles: "trading-common",
  terminal: "trading-common",
  strategies: "trading-common",
};

function readRegister(category: string): string {
  return readFileSync(join(WIDGETS_DIR, category, "register.ts"), "utf8");
}

describe("Widget register.ts — entitlement wiring", () => {
  it.each(Object.keys(CATEGORY_DOMAIN))("%s/register.ts uses only its expected trading domain", (category) => {
    const src = readRegister(category);
    const expectedDomain = CATEGORY_DOMAIN[category];

    // Collect all trading domains referenced as entitlements in this register
    const foundDomains = new Set<string>();
    for (const domain of TRADING_DOMAINS) {
      // Match: domain: "trading-xxx" (with or without surrounding quotes on domain key)
      const pattern = new RegExp(`domain:\\s*["']${domain}["']`, "g");
      if (pattern.test(src)) foundDomains.add(domain);
    }

    // Every referenced domain must be the expected one for this category
    for (const d of foundDomains) {
      expect(d, `${category}/register.ts references unexpected domain "${d}"`).toBe(expectedDomain);
    }

    // At least one entitlement must be present (widgets should be gated)
    expect(foundDomains.size, `${category}/register.ts has no TradingEntitlement references`).toBeGreaterThan(0);
  });

  it("every register.ts uses tier: basic or premium only", () => {
    const categories = readdirSync(WIDGETS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const cat of categories) {
      let src: string;
      try {
        src = readRegister(cat);
      } catch {
        continue; // directory without register.ts — skip
      }
      const tierMatches = src.match(/tier:\s*["'](\w+)["']/g) ?? [];
      for (const m of tierMatches) {
        const tier = m.match(/["'](\w+)["']/)?.[1];
        expect(["basic", "premium"], `${cat}/register.ts has invalid tier "${tier}"`).toContain(tier);
      }
    }
  });

  it("no register.ts references the old flat trading entitlement strings", () => {
    const categories = readdirSync(WIDGETS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    const deadStrings = [
      '"defi-trading"',
      '"sports-trading"',
      '"options-trading"',
      '"predictions-trading"',
      '"markets-data"',
    ];

    for (const cat of categories) {
      let src: string;
      try {
        src = readRegister(cat);
      } catch {
        continue;
      }
      for (const dead of deadStrings) {
        expect(src, `${cat}/register.ts still references ${dead}`).not.toContain(dead);
      }
    }
  });
});

// 2026-05-01 Phase 9 wave 2 — the per-asset-group trading layouts (defi /
// sports / options / predictions) were removed; PageEntitlementGate
// responsibilities migrated to the cockpit's StrategyAvailabilityResolver
// (see lib/cockpit/use-strategy-visibility.ts + lib/architecture-v2/
// strategy-availability-resolver.ts). The widget-register entitlement-
// wiring invariants below are the remaining SSOT for "every widget must
// declare a trading-domain entitlement".

describe("Registry dead-code check", () => {
  it("ENTITLEMENTS const does not contain old trading strings", async () => {
    const { ENTITLEMENTS } = await import("@/lib/config/auth");
    const dead = ["defi-trading", "sports-trading", "options-trading", "predictions-trading", "markets-data"];
    for (const d of dead) {
      expect(ENTITLEMENTS as readonly string[]).not.toContain(d);
    }
  });

  it("ui-reference-data.json does not contain old trading strings", () => {
    const refPath = join(REPO_ROOT, "lib", "registry", "ui-reference-data.json");
    const raw = readFileSync(refPath, "utf8");
    const parsed = JSON.parse(raw) as { uic_enums: { Entitlement: string[] } };
    const ents = parsed.uic_enums.Entitlement;
    for (const d of ["defi-trading", "sports-trading", "options-trading", "predictions-trading", "markets-data"]) {
      expect(ents, `ui-reference-data.json still lists "${d}"`).not.toContain(d);
    }
  });
});
