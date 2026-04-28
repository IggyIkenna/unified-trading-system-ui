/**
 * Playwright E2E: instrument-type view gating — verifies the trading sub-domain
 * pages (Options/Sports/DeFi/Predictions) gate correctly per persona based on
 * the user's effective instrument types / asset_groups (FOMO mode default).
 *
 * SSOT: unified-trading-pm/codex/14-playbooks/dart/dart-terminal-vs-research.md
 */

import { expect, test } from "@playwright/test";
import { clearPersona, seedPersona } from "./seed-persona";

interface RouteCase {
  readonly route: string;
  readonly featureName: string;
}

const GATED_ROUTES: readonly RouteCase[] = [
  { route: "/services/trading/options", featureName: "Options & Futures" },
  { route: "/services/trading/sports", featureName: "Sports Trading" },
  { route: "/services/trading/defi", featureName: "DeFi Trading" },
  { route: "/services/trading/predictions", featureName: "Prediction Markets" },
];

test.describe("Instrument-type view gating — admin sees all", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
    await seedPersona(page, "admin");
  });

  for (const { route, featureName } of GATED_ROUTES) {
    test(`admin can see ${featureName} content (no FOMO overlay)`, async ({ page }) => {
      await page.goto(route);
      // Admin (wildcard) bypasses the gate; the FOMO overlay must NOT render.
      // The overlay's signature is the "requires an upgrade" header text.
      await expect(
        page.getByRole("heading", { name: new RegExp(`${featureName} requires an upgrade`, "i") }),
      ).toHaveCount(0);
    });
  }
});

test.describe("Instrument-type view gating — client-data-only locked everywhere", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
    await seedPersona(page, "client-data-only");
  });

  for (const { route, featureName } of GATED_ROUTES) {
    test(`client-data-only sees FOMO overlay on ${featureName}`, async ({ page }) => {
      await page.goto(route);
      // No assigned_strategies → empty derivation → instrument-type gate fails
      // → FOMO overlay renders. Match the canonical "requires an upgrade"
      // header from PageEntitlementGate.
      await expect(
        page.getByRole("heading", { name: new RegExp(`${featureName} requires an upgrade`, "i") }),
      ).toBeVisible({ timeout: 10_000 });
    });
  }
});
