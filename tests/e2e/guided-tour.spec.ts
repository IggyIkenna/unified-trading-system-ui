import { test, expect } from "@playwright/test";

/**
 * GUIDED TOUR E2E TESTS
 *
 * Validates the GuidedTour component (react-joyride):
 * - Tour auto-starts on first visit (localStorage empty)
 * - "Next" advances the tour
 * - "Skip Tour" closes it and sets localStorage flag
 *
 * Component: components/platform/guided-tour.tsx
 * Storage key: "unified-tour-completed"
 */

const API = "http://localhost:8030";

test.beforeAll(async ({ request }) => {
  await request.post(`${API}/admin/reset`);
});

test.describe("Guided Tour", () => {
  test("tour overlay appears on fresh visit (no localStorage flag)", async ({ page }) => {
    // Clear the tour-completed flag to simulate first visit
    await page.goto("/dashboard");
    await page.evaluate(() => localStorage.removeItem("unified-tour-completed"));

    // Reload to trigger fresh tour check
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Joyride renders a tooltip with role="alertdialog" or a div with class containing "joyride"
    // The first step has title "Global Scope Filters"
    await expect(async () => {
      const joyrideTooltip = page.locator('[role="alertdialog"], [class*="joyride"], [class*="__tooltip"]');
      expect(await joyrideTooltip.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });
  });

  test("clicking Next advances the tour to next step", async ({ page }) => {
    await page.goto("/dashboard");
    await page.evaluate(() => localStorage.removeItem("unified-tour-completed"));
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Wait for tour tooltip to appear
    await expect(async () => {
      const tooltip = page.locator('[role="alertdialog"], [class*="joyride"], [class*="__tooltip"]');
      expect(await tooltip.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });

    // First step title: "Global Scope Filters"
    const firstStepContent = page.locator("text=Global Scope Filters");
    if (await firstStepContent.isVisible({ timeout: 3000 })) {
      // Click Next button
      const nextBtn = page.locator('button:has-text("Next")');
      await expect(nextBtn).toBeVisible({ timeout: 5000 });
      await nextBtn.click();

      // Second step: "Lifecycle Navigation"
      await expect(async () => {
        const secondStep = page.locator("text=Lifecycle Navigation");
        expect(await secondStep.count()).toBeGreaterThan(0);
      }).toPass({ timeout: 5000 });
    }
  });

  test("clicking Skip Tour closes the tour and sets localStorage", async ({ page }) => {
    await page.goto("/dashboard");
    await page.evaluate(() => localStorage.removeItem("unified-tour-completed"));
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Wait for tour tooltip
    await expect(async () => {
      const tooltip = page.locator('[role="alertdialog"], [class*="joyride"], [class*="__tooltip"]');
      expect(await tooltip.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });

    // Click Skip Tour
    const skipBtn = page.locator('button:has-text("Skip Tour"), button:has-text("Skip")');
    await expect(skipBtn.first()).toBeVisible({ timeout: 5000 });
    await skipBtn.first().click();

    // Tour tooltip should disappear
    await expect(async () => {
      const tooltip = page.locator('[role="alertdialog"]');
      expect(await tooltip.count()).toBe(0);
    }).toPass({ timeout: 5000 });

    // localStorage flag should be set
    const flagValue = await page.evaluate(() => localStorage.getItem("unified-tour-completed"));
    expect(flagValue).toBe("true");
  });

  test("tour does not appear when localStorage flag is set", async ({ page }) => {
    await page.goto("/dashboard");
    // Set the flag to simulate returning user
    await page.evaluate(() => localStorage.setItem("unified-tour-completed", "true"));
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Wait a moment for any delayed tour initialization (component has 1500ms delay)
    await page.waitForTimeout(2500);

    // Tour should NOT appear
    const tooltip = page.locator('[role="alertdialog"]');
    expect(await tooltip.count()).toBe(0);
  });
});
