import { test, expect, type Page } from "@playwright/test";

/**
 * DeFiWalletSummaryWidget — widget validation spec.
 *
 * Route: /services/trading/defi (defi-default preset mounts wallet summary at top)
 * testids: defi-wallet-summary-widget (root only — inner rows are generated from data)
 *
 * The wallet summary is a read-only display widget: it shows balances, USD values,
 * and chain context. These tests verify it renders and contains meaningful content.
 * Post-execute update behaviour is covered in the strategy workflow specs via
 * verifyObservationsUpdated().
 */

const BASE_URL = "http://localhost:3100";

test.describe.configure({ mode: "serial" });

test.describe("DeFiWalletSummaryWidget — UI validation", () => {
  test.setTimeout(60_000);

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("portal_user", JSON.stringify({ id: "internal-trader", email: "trader@odum.internal" }));
      localStorage.setItem("portal_token", "demo-token-internal-trader");
    });
    await page.goto(`${BASE_URL}/services/trading/defi`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.keyboard.press("Escape").catch(() => undefined);
    await page.waitForSelector('[data-testid="defi-wallet-summary-widget"]', { timeout: 30_000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  test("wallet summary widget renders at the top of the DeFi page", async () => {
    await expect(page.locator('[data-testid="defi-wallet-summary-widget"]')).toBeVisible();
  });

  test("wallet summary contains non-empty text content (balances displayed)", async () => {
    const widget = page.locator('[data-testid="defi-wallet-summary-widget"]');
    const text = (await widget.textContent()) ?? "";
    expect(text.trim().length).toBeGreaterThan(10);
  });

  test("wallet summary shows at least one token balance (e.g. ETH or USDT)", async () => {
    const widget = page.locator('[data-testid="defi-wallet-summary-widget"]');
    const text = (await widget.textContent()) ?? "";
    const hasToken = ["ETH", "USDT", "USDC", "BTC", "SOL"].some((t) => text.includes(t));
    expect(hasToken).toBe(true);
  });

  test("wallet summary shows a USD value ($ sign present)", async () => {
    const widget = page.locator('[data-testid="defi-wallet-summary-widget"]');
    const text = (await widget.textContent()) ?? "";
    expect(text).toContain("$");
  });

  // ── Also visible on the staking page ─────────────────────────────────────

  test("wallet summary also renders on the DeFi staking page", async () => {
    await page.goto(`${BASE_URL}/services/trading/defi/staking`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.keyboard.press("Escape").catch(() => undefined);
    await expect(page.locator('[data-testid="defi-wallet-summary-widget"]')).toBeVisible({ timeout: 15_000 });
  });
});
