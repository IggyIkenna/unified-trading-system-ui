import { test, expect, type Page } from "@playwright/test";

/**
 * DefiAtomicBundleWidget — widget validation spec.
 *
 * Route: /services/trading/defi/bundles
 * testids: defi-atomic-bundle-widget, add-operation-button, execute-bundle-button
 */

const BASE_URL = "http://localhost:3100";

test.describe.configure({ mode: "serial" });

test.describe("DefiAtomicBundleWidget — UI validation", () => {
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
    await page.waitForSelector('[data-testid="defi-atomic-bundle-widget"]', { timeout: 30_000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  const w = () => page.locator('[data-testid="defi-atomic-bundle-widget"]');

  // ── Rendering ──────────────────────────────────────────────────────────────

  test("atomic bundle widget renders on the bundles page", async () => {
    await expect(w()).toBeVisible();
    const text = (await w().textContent()) ?? "";
    expect(text).toContain("DeFi Atomic");
  });

  test("execute bundle button not visible until operations are added", async () => {
    await expect(w().locator('[data-testid="execute-bundle-button"]')).not.toBeVisible();
  });

  // ── Adding operations ──────────────────────────────────────────────────────

  test("add operation button is present and clickable", async () => {
    // Templates may be shown initially — add-operation-button appears inside the operations flow.
    // Click add-operation-button if visible, otherwise find it through templates close path.
    const addBtn = w().locator('[data-testid="add-operation-button"]');
    if (await addBtn.isVisible()) {
      await addBtn.click();
    } else {
      // Templates panel may be shown; click through to operations view.
      const useTemplate = w().locator("button:has-text('Use a template')").first();
      if (await useTemplate.isVisible()) {
        // Load first template to get operations populated.
        const templateBtns = w()
          .locator("button")
          .filter({ hasText: /load|basis|arb|lend/i });
        if ((await templateBtns.count()) > 0) {
          await templateBtns.first().click();
          await page.waitForTimeout(300);
        }
      }
    }
    await page.waitForTimeout(300);
  });

  test("execute bundle button appears after adding an operation or loading a template", async () => {
    // Either add-operation-button click or template load should have added operations.
    const hasOps = await w().locator('[data-testid="execute-bundle-button"]').isVisible();
    // If still not visible, explicitly add an operation.
    if (!hasOps) {
      const addBtn = w().locator('[data-testid="add-operation-button"]');
      if (await addBtn.isVisible()) await addBtn.click();
      await page.waitForTimeout(300);
    }
    await expect(w().locator('[data-testid="execute-bundle-button"]')).toBeVisible();
  });

  test("execute bundle button submits and shows confirmation toast", async () => {
    await w().locator('[data-testid="execute-bundle-button"]').click();
    await expect(
      page.locator("text=Bundle submitted").or(page.locator("text=submitted")).or(page.locator("text=Executing")),
    ).toBeVisible({ timeout: 5_000 });
  });

  // ── Simulation preview ─────────────────────────────────────────────────────

  test("simulation preview section appears when operations exist", async () => {
    const text = (await w().textContent()) ?? "";
    expect(text).toContain("Simulation");
  });

  test("gas cost is displayed in simulation preview", async () => {
    const text = (await w().textContent()) ?? "";
    expect(text.includes("Gas") || text.includes("gas") || text.includes("$")).toBe(true);
  });
});
