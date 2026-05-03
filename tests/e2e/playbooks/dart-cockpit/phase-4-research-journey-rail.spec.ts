/**
 * Phase 4 — ResearchJourneyRail mount + interactions on Research surfaces.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §5.3 + Phase 4 of §17.
 *
 * Acceptance:
 *   1. The 6-stage rail (Discover · Build · Train · Validate · Allocate ·
 *      Promote) renders on Research routes.
 *   2. URL drives active stage on landing.
 *   3. Click navigates AND flips scope.researchStage + scope.surface.
 *   4. Route → scope auto-sync persists to localStorage.
 */

import { expect, test } from "@playwright/test";
import { clearPersona, seedPersona } from "../seed-persona";

test.describe("Phase 4 — ResearchJourneyRail", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
  });

  test("renders all 6 stage chips on /services/research/strategies", async ({ page }) => {
    await seedPersona(page, "client-full");
    await page.goto("/services/research/strategies");
    await expect(page.getByTestId("research-journey-rail")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("research-stage-discover")).toBeVisible();
    await expect(page.getByTestId("research-stage-build")).toBeVisible();
    await expect(page.getByTestId("research-stage-train")).toBeVisible();
    await expect(page.getByTestId("research-stage-validate")).toBeVisible();
    await expect(page.getByTestId("research-stage-allocate")).toBeVisible();
    await expect(page.getByTestId("research-stage-promote")).toBeVisible();
  });

  test("active stage = Discover on /services/research/strategies", async ({ page }) => {
    await seedPersona(page, "client-full");
    await page.goto("/services/research/strategies");
    await expect(page.getByTestId("research-journey-rail")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("research-journey-rail")).toHaveAttribute("data-active-stage", "discover");
    await expect(page.getByTestId("research-stage-discover-indicator")).toBeVisible();
  });

  test("URL drives stage — landing on /services/research/ml activates Train", async ({ page }) => {
    await seedPersona(page, "client-full");
    await page.goto("/services/research/ml");
    await expect(page.getByTestId("research-journey-rail")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("research-journey-rail")).toHaveAttribute("data-active-stage", "train");
  });

  test("URL drives stage — landing on /services/research/strategy/backtests activates Validate", async ({
    page,
  }) => {
    await seedPersona(page, "client-full");
    await page.goto("/services/research/strategy/backtests");
    await expect(page.getByTestId("research-journey-rail")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("research-journey-rail")).toHaveAttribute("data-active-stage", "validate");
  });

  test("clicking a stage chip navigates to its defaultHref", async ({ page }) => {
    await seedPersona(page, "client-full");
    await page.goto("/services/research/strategies");
    await expect(page.getByTestId("research-journey-rail")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("research-stage-allocate").click();
    await page.waitForURL(/\/services\/research\/allocate/);
    await expect(page.getByTestId("research-journey-rail")).toHaveAttribute("data-active-stage", "allocate");
  });

  test("route → scope auto-sync persists to localStorage", async ({ page }) => {
    await seedPersona(page, "client-full");
    await page.goto("/services/research/strategy/backtests");
    await expect(page.getByTestId("research-journey-rail")).toBeVisible({ timeout: 30_000 });
    await page.waitForFunction(() => {
      const persisted = window.localStorage.getItem("dart-workspace-scope");
      if (!persisted) return false;
      try {
        const parsed = JSON.parse(persisted) as {
          state: { scope: { researchStage: string | null; surface: string } };
        };
        return parsed.state.scope.researchStage === "validate" && parsed.state.scope.surface === "research";
      } catch {
        return false;
      }
    });
  });
});
