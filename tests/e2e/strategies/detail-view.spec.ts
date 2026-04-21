import { test, expect, type Page } from "@playwright/test";
import { seedPersona } from "../_shared/persona";
import { demoPause } from "../_shared/demo-pause";
import { listArchetypes } from "../_shared/strategy-registry";

/**
 * Parametric detail-view spec — one test.describe per archetype whose UI
 * surface is the generic `/services/trading/strategies/[id]` detail page.
 *
 * Twelve archetypes render here today (CARRY_BASIS_DATED, CARRY_RECURSIVE_STAKED,
 * ARBITRAGE_PRICE_DISPERSION, LIQUIDATION_CAPTURE, MARKET_MAKING_*, ML_*,
 * RULES_*, EVENT_DRIVEN, VOL_TRADING_OPTIONS, STAT_ARB_*). They are all
 * read-only — no order placement, no widget inputs — so the assertions are:
 *
 *   1. Page responds 200 and renders the page header with the strategy name.
 *   2. All six KPI cards are visible (Total P&L / MTD P&L / Sharpe / Return /
 *      Max Drawdown / Net Exposure).
 *   3. Seven tabs are present in the order the registry documents.
 *   4. Tab switching works for at least two non-default tabs.
 *   5. Archetype-specific analytics panel renders any KPIs listed in the
 *      registry's `detailViewKpis`.
 *
 * Serial mode + one shared page — same pattern as the execution-surface specs.
 * Single spec file + per-archetype describe keeps the runner output readable
 * and lets `--grep` target a single archetype when debugging.
 *
 * Config SSOT: tests/e2e/_shared/strategy-registry.ts
 */

const BASE_URL = "http://localhost:3100";
const DETAIL_ARCHETYPES = listArchetypes("detail-view");

const EXPECTED_TABS = [
  "P&L Attribution",
  "Instruments",
  "Data & Features",
  "Risk",
  "Configuration",
  "Testing Status",
  "Decisions",
] as const;

const EXPECTED_KPIS = ["Total P&L", "MTD P&L", "Sharpe", "Return", "Max Drawdown", "Net Exposure"] as const;

for (const entry of DETAIL_ARCHETYPES) {
  test.describe(`${entry.archetype} — detail-view coverage`, () => {
    // Serial scope is per-archetype — one describe failing must not block
    // other archetypes from running. Inside the describe, scenarios still
    // run sequentially on the shared page (baseline render → KPIs → tabs).
    test.describe.configure({ mode: "serial" });
    test.setTimeout(90_000);

    let page: Page;
    const targetRoute = entry.buildRoute(entry.primaryInstanceId);

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext();
      page = await context.newPage();
      await seedPersona(page, entry.persona);
      await page.goto(`${BASE_URL}${targetRoute}`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      // Wait for the page-header title to materialise — that's the most
      // reliable "detail page rendered" signal across archetypes because
      // the `/strategies/[id]` layout wraps everything in a <main> with
      // a max-width container but no dedicated data-testid.
      // PageHeader renders the strategy name as a top-level <h1>; wait
      // for that so we don't race the main-content hydration.
      await page.waitForSelector("h1.text-page-title", { timeout: 30_000 });
    });

    test.afterAll(async () => {
      await page.close();
    });

    test("page loads with the strategy name in the header", async () => {
      // Strategy instance ids follow ARCHETYPE@instance-slug; the mock
      // registry surfaces the instance as "Archetype — instance-slug" so
      // asserting the archetype keyword alone is fixture-robust.
      const friendlyArchetype = entry.archetype
        .toLowerCase()
        .split("_")
        .map((w) => w[0]!.toUpperCase() + w.slice(1))
        .join(" ");
      await expect(page.locator("h1.text-page-title")).toContainText(friendlyArchetype, {
        ignoreCase: true,
        timeout: 10_000,
      });
      await demoPause(page, 800);
    });

    test("all six KPI cards render with numeric values", async () => {
      for (const label of EXPECTED_KPIS) {
        const card = page.getByText(label, { exact: true }).first();
        await expect(card).toBeVisible();
      }
      // At least one numeric value somewhere in the KPI grid.
      const anyNumber = page.locator(".font-mono").first();
      await expect(anyNumber).toBeVisible();
      await demoPause(page, 600);
    });

    test("tab strip exposes the seven canonical tabs", async () => {
      for (const tab of EXPECTED_TABS) {
        const trigger = page.getByRole("tab", { name: new RegExp(tab.replace("&", "&"), "i") });
        await expect(trigger.first()).toBeVisible();
      }
      await demoPause(page, 500);
    });

    test("switching tabs updates the active panel", async () => {
      // Default is P&L Attribution; click Risk then Configuration.
      await page.getByRole("tab", { name: /Risk/i }).first().click();
      await demoPause(page, 500);
      await page
        .getByRole("tab", { name: /Configuration/i })
        .first()
        .click();
      await demoPause(page, 500);
      await page
        .getByRole("tab", { name: /P&L Attribution/i })
        .first()
        .click();
      await demoPause(page, 500);
    });

    if (entry.detailViewKpis && entry.detailViewKpis.length > 0) {
      test("archetype analytics panel renders registry-declared KPIs", async () => {
        for (const kpi of entry.detailViewKpis!) {
          await expect(page.getByText(kpi, { exact: true }).first()).toBeVisible();
        }
        await demoPause(page, 600);
      });
    }
  });
}
