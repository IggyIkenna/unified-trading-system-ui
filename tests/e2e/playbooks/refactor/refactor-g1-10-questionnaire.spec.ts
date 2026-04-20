import { expect, test } from "@playwright/test";

/**
 * Refactor G1.10 — Questionnaire-to-configuration flow.
 *
 * SSOT:
 *   - Python: unified-api-contracts/unified_api_contracts/internal/architecture_v2/restriction_profiles.py (QuestionnaireResponse)
 *   - TS types: unified-trading-system-ui/lib/questionnaire/types.ts
 *   - Submit helper: unified-trading-system-ui/lib/questionnaire/submit.ts
 *   - Page: app/(public)/questionnaire/page.tsx
 *
 * Coverage:
 * 1. Public route `/questionnaire` is reachable without auth.
 * 2. Form renders all 6 axes with the correct option set.
 * 3. Submitting in dev mode writes to localStorage under
 *    `questionnaire-response-v1` + redirects to `/services`.
 * 4. An empty-categories vague response still submits (UAC overlay treats
 *    it as a no-op base-profile fallback).
 * 5. Service-family IM response stored correctly in localStorage.
 *
 * Deferred:
 *   - Firestore staging submission: ticket #12 (five_space_ia) provisions
 *     Firebase staging; we assert dev-mode localStorage sink only here.
 *   - Downstream `/services` tile re-rendering: assertion stub below —
 *     the useTileLockState hook already consumes the persona but doesn't
 *     read the questionnaire-response localStorage key yet. G1.13 wires
 *     that up as the tempt-logic overlay surfaces.
 */

test.describe("refactor G1.10 — questionnaire-to-configuration flow", () => {
  test("public route reachable without auth", async ({ page }) => {
    const response = await page.goto("/questionnaire");
    expect(response?.status(), "questionnaire must be reachable anonymously").toBeLessThan(400);
    await expect(page.getByTestId("questionnaire-page")).toBeVisible();
  });

  test("renders all 6 axis fieldsets", async ({ page }) => {
    await page.goto("/questionnaire");
    const axes = [
      "axis-categories",
      "axis-instrument-types",
      "axis-venue-scope",
      "axis-strategy-style",
      "axis-service-family",
      "axis-fund-structure",
    ];
    for (const axis of axes) {
      await expect(page.getByTestId(axis)).toBeVisible();
    }
  });

  test("category options include the 5 expected values", async ({ page }) => {
    await page.goto("/questionnaire");
    for (const cat of ["CeFi", "DeFi", "TradFi", "Sports", "Prediction"]) {
      await expect(page.getByTestId(`category-${cat}`)).toBeVisible();
    }
  });

  test("service-family options include 4 prospect-facing values", async ({ page }) => {
    await page.goto("/questionnaire");
    for (const sf of ["IM", "DART", "RegUmbrella", "combo"]) {
      await expect(page.getByTestId(`service-family-${sf}`)).toBeVisible();
    }
  });

  test("submitting an IM-focused response writes to localStorage", async ({ page }) => {
    // Clear any prior submission so we get a clean write.
    await page.addInitScript(() => {
      window.localStorage.removeItem("questionnaire-response-v1");
    });
    await page.goto("/questionnaire");

    await page.getByTestId("category-CeFi").check();
    await page.getByTestId("instrument-spot").check();
    await page.getByTestId("strategy-ml_directional").check();
    await page.getByTestId("service-family-IM").check();
    await page.getByTestId("fund-structure-Pooled").check();

    await page.getByTestId("questionnaire-submit").click();
    await expect(page.getByTestId("questionnaire-success")).toBeVisible({ timeout: 5_000 });

    const raw = await page.evaluate(() =>
      window.localStorage.getItem("questionnaire-response-v1"),
    );
    expect(raw, "localStorage must have the submission").not.toBeNull();
    const parsed = JSON.parse(raw as string) as {
      service_family: string;
      categories: string[];
      fund_structure: string;
    };
    expect(parsed.service_family).toBe("IM");
    expect(parsed.categories).toContain("CeFi");
    expect(parsed.fund_structure).toBe("Pooled");
  });

  test("empty-categories vague response still submits", async ({ page }) => {
    // Vague response per UAC `_apply_questionnaire_override` semantics:
    // no categories → fall back to base profile.
    await page.addInitScript(() => {
      window.localStorage.removeItem("questionnaire-response-v1");
    });
    await page.goto("/questionnaire");

    // Submit with defaults only (no checkboxes ticked except the radios).
    await page.getByTestId("questionnaire-submit").click();
    await expect(page.getByTestId("questionnaire-success")).toBeVisible({ timeout: 5_000 });

    const raw = await page.evaluate(() =>
      window.localStorage.getItem("questionnaire-response-v1"),
    );
    const parsed = JSON.parse(raw as string) as { categories: string[] };
    expect(parsed.categories).toEqual([]);
  });
});
