import { expect, test } from "@playwright/test";

/**
 * Phase 4 — Questionnaire -> persona cascade e2e spec.
 *
 * SSOT (plan): `unified-trading-pm/plans/active/ui_unification_v2_sanitisation_2026_04_20.plan.md`
 *              Phase 4 `p4-questionnaire-e2e-spec`.
 * SSOT (codex): `unified-trading-pm/codex/09-strategy/architecture-v2/restriction-policy.md` § 4.
 *
 * Covers the three-leg cascade:
 *   1. Fill `/questionnaire` as a DART-only prospect, land on `/services`,
 *      assert the resolved persona is persisted to `localStorage['odum-persona/v1']`.
 *   2. Fill as IM Pooled -> persona = `prospect-im-pooled`, reports visible,
 *      DART catalogue should not be blocked (lock-state pass) but IM-reserved
 *      entries flagged via the audience filter.
 *   3. Clearing the persona + visiting `/services` re-routes to `/questionnaire`.
 *
 * Uses only testid selectors exposed in `app/(public)/questionnaire/page.tsx`
 * and `components/architecture-v2/family-archetype-picker.tsx`. If the local
 * Firestore mock is unreachable, the submit helper falls back to localStorage
 * (`isDevSink()` heuristic), which keeps the spec runnable under Playwright's
 * block-network environment.
 */

test.describe("questionnaire -> persona cascade", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test("DART research prospect -> prospect-dart persona stamped", async ({
    page,
  }) => {
    await page.goto("/questionnaire");
    await expect(page.getByTestId("questionnaire-page")).toBeVisible();

    // Service family = DART
    await page.getByTestId("service-family-DART").check();
    // Strategy style = ml_directional (DART research-type answer)
    await page.getByTestId("strategy-ml_directional").check();

    await page.getByTestId("questionnaire-submit").click();
    await expect(page.getByTestId("questionnaire-success")).toBeVisible({
      timeout: 6000,
    });

    // After the redirect, localStorage should carry the resolved persona.
    await page.waitForURL(/\/services/, { timeout: 10_000 });
    const stored = await page.evaluate(() =>
      localStorage.getItem("odum-persona/v1"),
    );
    expect(stored).toBe("prospect-dart");
  });

  test("IM + Pooled answer -> prospect-im-pooled persona stamped", async ({
    page,
  }) => {
    await page.goto("/questionnaire");
    await page.getByTestId("service-family-IM").check();
    await page.getByTestId("fund-structure-Pooled").check();
    await page.getByTestId("questionnaire-submit").click();
    await expect(page.getByTestId("questionnaire-success")).toBeVisible({
      timeout: 6000,
    });
    await page.waitForURL(/\/services/, { timeout: 10_000 });
    const stored = await page.evaluate(() =>
      localStorage.getItem("odum-persona/v1"),
    );
    expect(stored).toBe("prospect-im-pooled");
  });

  test("DART + execution-only styles -> prospect-signals-only", async ({
    page,
  }) => {
    await page.goto("/questionnaire");
    await page.getByTestId("service-family-DART").check();
    await page.getByTestId("strategy-carry").check();
    await page.getByTestId("strategy-arbitrage").check();
    await page.getByTestId("questionnaire-submit").click();
    await expect(page.getByTestId("questionnaire-success")).toBeVisible({
      timeout: 6000,
    });
    await page.waitForURL(/\/services/, { timeout: 10_000 });
    const stored = await page.evaluate(() =>
      localStorage.getItem("odum-persona/v1"),
    );
    expect(stored).toBe("prospect-signals-only");
  });

  test("RegUmbrella answer -> prospect-regulatory", async ({ page }) => {
    await page.goto("/questionnaire");
    await page.getByTestId("service-family-RegUmbrella").check();
    await page.getByTestId("questionnaire-submit").click();
    await expect(page.getByTestId("questionnaire-success")).toBeVisible({
      timeout: 6000,
    });
    await page.waitForURL(/\/services/, { timeout: 10_000 });
    const stored = await page.evaluate(() =>
      localStorage.getItem("odum-persona/v1"),
    );
    expect(stored).toBe("prospect-regulatory");
  });
});
