import { test, expect, type Page } from "@playwright/test";

/**
 * DeFi Basis Trade (Swap leg) — trader workflow E2E.
 *
 * Simulates what a trader does when executing the CARRY_BASIS_PERP spot leg:
 *   1. Open the carry-basis route, confirm swap widget and all metric panels are ready
 *   2. Enter capital amount and review key metrics (Funding APY, Cost of Carry, Net APY)
 *   3. Execute the SWAP, verify the trade row is added to history
 *
 * The perp SHORT leg is covered in carry-basis-perp.spec.ts.
 *
 * Serial mode + shared page: one browser for the whole suite.
 *
 * UI validation (input acceptance, button enable/disable, slippage options, etc.)
 * belongs in tests/unit/widgets/defi/defi-swap-widget.test.tsx — not here.
 */

const BASE_URL = "http://localhost:3100";

test.describe.configure({ mode: "serial" });

test.describe("DeFi Basis Trade Swap — trader workflow", () => {
  test.setTimeout(120_000);

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("portal_user", JSON.stringify({ id: "internal-trader", email: "trader@odum.internal" }));
      localStorage.setItem("portal_token", "demo-token-internal-trader");
    });
    await page.goto(`${BASE_URL}/services/trading/strategies/carry-basis`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.keyboard.press("Escape").catch(() => undefined);
    await page.waitForSelector('[data-testid="defi-swap-widget"]', { timeout: 30_000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  const swap = () => page.locator('[data-testid="defi-swap-widget"]');

  // ── Baseline ──────────────────────────────────────────────────────────────

  test("swap widget ready — default pair USDT→ETH, all metric panels visible", async () => {
    await expect(swap()).toBeVisible();

    // Trader checks the default pair before entry.
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).toContain("USDT");
    expect(bodyText).toContain("ETH");

    // All metrics a basis-trade operator cares about must be present.
    await expect(swap().getByText("Basis Trade Metrics")).toBeVisible();
    await expect(swap().getByText("Funding APY")).toBeVisible();
    await expect(swap().getByText("Cost of Carry")).toBeVisible();
    await expect(swap().getByText("Net APY")).toBeVisible();

    // Swap button present but disabled before an amount is entered.
    await expect(page.locator("button:has-text('Swap')").first()).toBeDisabled();
  });

  // ── Trade execution ────────────────────────────────────────────────────────

  test("enter $100k capital, review basis trade metrics, execute swap, trade row added", async () => {
    const amountInput = page.locator("[data-testid='capital-input']");
    await amountInput.fill("100000");
    await page.waitForTimeout(500);

    // Trader reviews the three key metrics before clicking Swap.
    const fundingText = (await swap().getByText("Funding APY").textContent()) ?? "";
    expect(fundingText).toBeTruthy();

    const costText = (await swap().getByText("Cost of Carry").textContent()) ?? "";
    expect(costText).toBeTruthy();

    const netApySection = swap().getByText("Net APY").first();
    await expect(netApySection).toBeVisible();

    // Net APY colour indicates whether the trade is profitable.
    const netApyValue = netApySection.locator("..").locator("[class*='font-mono'][class*='font-bold']").first();
    const classes = await netApyValue.getAttribute("class");
    expect(classes?.includes("green-600") || classes?.includes("red-500")).toBeTruthy();

    // Execute the swap and verify a trade row appears in history.
    const beforeRows = await page.locator('[data-testid="trade-history-row"]').count();
    await expect(page.locator("button:has-text('Swap')").first()).toBeEnabled();
    await page.locator("button:has-text('Swap')").first().click();
    await page.waitForTimeout(500);
    await expect
      .poll(() => page.locator('[data-testid="trade-history-row"]').count(), { timeout: 5_000 })
      .toBeGreaterThanOrEqual(beforeRows + 1);
  });
});
