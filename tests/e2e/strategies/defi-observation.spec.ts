import { test, expect, type Page } from "@playwright/test";
import { seedPersona } from "../_shared/persona";
import { loadStrategyFixture } from "../_shared/fixtures";
import { verifyObservationWidgetsVisible } from "../_shared/verify";

/**
 * Route-level observation-widget smoke spec.
 *
 * For every DeFi execution-surface fixture that declares `observationWidgets`,
 * navigate to the route and assert each declared widget mounts and passes a
 * visibility check. Catches widgets that ship broken or get unmounted by a
 * regression, independent of any execution flow.
 *
 * Intentionally split from the flow specs: this one runs even when the
 * execution specs are quarantined, giving us a cheap green/red signal that
 * the read-only surface still renders.
 */

const BASE_URL = "http://localhost:3100";
const WORKSPACE_STORAGE_KEY = "unified-workspace-layouts";

/**
 * The YIELD_ROTATION_LENDING and MARKET_MAKING_CONTINUOUS fixtures both point
 * at /services/trading/defi. The wallet-summary widget is in the `defi-default`
 * preset, so the lending fixture works out of the box. Liquidity-widget-based
 * fixtures need the `defi-advanced` preset (pre-seeded into localStorage).
 */
async function seedWorkspaceActivePreset(page: Page, tab: string, preset: string): Promise<void> {
  await page.addInitScript(
    ({ key, tab, preset }) => {
      const existingRaw = localStorage.getItem(key);
      const existing = existingRaw
        ? (JSON.parse(existingRaw) as { state?: Record<string, unknown>; version?: number })
        : null;
      const state = (existing?.state ?? {}) as Record<string, unknown>;
      const activeWorkspaceId = (state.activeWorkspaceId as Record<string, string> | undefined) ?? {};
      state.activeWorkspaceId = { ...activeWorkspaceId, [tab]: preset };
      localStorage.setItem(key, JSON.stringify({ state, version: existing?.version ?? 2 }));
    },
    { key: WORKSPACE_STORAGE_KEY, tab, preset },
  );
}

const FIXTURES = [
  { slug: "yield-rotation-lending", presetTab: null as null | [string, string] },
  { slug: "yield-staking-simple", presetTab: null as null | [string, string] },
  { slug: "carry-basis-perp", presetTab: null as null | [string, string] },
  { slug: "carry-staked-basis", presetTab: null as null | [string, string] },
  { slug: "market-making-continuous-amm-lp", presetTab: ["defi", "defi-advanced"] as [string, string] },
];

test.describe("DeFi observation widgets — route-level smoke", () => {
  test.describe.configure({ mode: "parallel" });

  for (const { slug, presetTab } of FIXTURES) {
    const fixture = loadStrategyFixture(slug);
    const widgetCount = fixture.observationWidgets?.length ?? 0;
    if (widgetCount === 0) continue;

    test(`${fixture.name} — ${widgetCount} observation widget${widgetCount === 1 ? "" : "s"} render on ${fixture.route}`, async ({
      browser,
    }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      try {
        await seedPersona(page, fixture.persona);
        if (presetTab) {
          await seedWorkspaceActivePreset(page, presetTab[0], presetTab[1]);
        }
        await page.goto(`${BASE_URL}${fixture.route}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
        await page.keyboard.press("Escape").catch(() => undefined);
        // Wait for the execution widget root before asserting observation panels —
        // guarantees the route has fully mounted and DeFiDataProvider has hydrated.
        await page.waitForSelector(fixture.rootSelector, { timeout: 30_000 });

        await verifyObservationWidgetsVisible(page, fixture);

        // Assert each widget has non-empty text content (catches empty skeletons
        // that resolve `assertVisible` because the bounding div exists).
        for (const spec of fixture.observationWidgets ?? []) {
          if (spec.assertVisible === false) continue;
          const loc = page.locator(`[data-testid="${spec.testid}"]`);
          const text = ((await loc.textContent()) ?? "").trim();
          expect(text.length, `observation widget "${spec.testid}" rendered empty`).toBeGreaterThan(0);
        }
      } finally {
        await page.close();
        await context.close();
      }
    });
  }
});
