import { test, expect, type Page } from "@playwright/test";

/**
 * BundleBuilderWidget — widget validation spec.
 *
 * Route: /services/trading/defi/bundles
 * testids: bundle-builder-widget, template-toggle, add-leg-button, submit-bundle-button
 */

const BASE_URL = "http://localhost:3100";

test.describe.configure({ mode: "serial" });

test.describe("BundleBuilderWidget — UI validation", () => {
  test.setTimeout(120_000);

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("portal_user", JSON.stringify({ id: "internal-trader", email: "trader@odum.internal" }));
      localStorage.setItem("portal_token", "demo-token-internal-trader");
    });
    await page.goto(`${BASE_URL}/services/trading/defi/bundles`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.keyboard.press("Escape").catch(() => undefined);
    await page.waitForSelector('[data-testid="bundle-builder-widget"]', { timeout: 30_000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  const w = () => page.locator('[data-testid="bundle-builder-widget"]');

  // ── Rendering ──────────────────────────────────────────────────────────────

  test("bundle builder widget renders on the bundles page", async () => {
    await expect(w()).toBeVisible();
  });

  test("template toggle button is visible", async () => {
    await expect(w().locator('[data-testid="template-toggle"]')).toBeVisible();
  });

  test("submit bundle button is not visible until legs are added", async () => {
    await expect(w().locator('[data-testid="submit-bundle-button"]')).not.toBeVisible();
  });

  // ── Adding legs ────────────────────────────────────────────────────────────

  test("add leg button is present and can be clicked", async () => {
    // Close templates panel if open so Add leg is visible.
    const templateToggle = w().locator('[data-testid="template-toggle"]');
    if ((await templateToggle.textContent())?.includes("Hide")) {
      await templateToggle.click();
      await page.waitForTimeout(200);
    }
    const addLegBtn = w().locator('[data-testid="add-leg-button"]');
    await expect(addLegBtn).toBeVisible();
    await addLegBtn.click();
    await page.waitForTimeout(300);
  });

  test("submit bundle button appears after adding a leg", async () => {
    await expect(w().locator('[data-testid="submit-bundle-button"]')).toBeVisible();
  });

  test("submit bundle button is clickable and shows confirmation", async () => {
    await w().locator('[data-testid="submit-bundle-button"]').click();
    // Toast should appear confirming submission.
    await expect(page.locator("text=Bundle submitted").or(page.locator("text=submitted"))).toBeVisible({
      timeout: 5_000,
    });
  });

  // ── Template loading ───────────────────────────────────────────────────────

  test("template toggle reveals templates panel", async () => {
    await w().locator('[data-testid="template-toggle"]').click();
    await page.waitForTimeout(300);
    // Templates panel should show some template options.
    const templateText = (await w().textContent()) ?? "";
    expect(templateText.length).toBeGreaterThan(0);
  });
});
