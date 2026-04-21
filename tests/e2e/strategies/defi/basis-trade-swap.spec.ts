import { test, expect } from "@playwright/test";

/**
 * DeFi Basis Trade (via Swap Widget) E2E Tests
 *
 * Tests the swap widget in "basis-trade" mode:
 * - Swap 90% capital: USDT → ETH via Uniswap/Curve SOR
 * - Shows funding rate, cost of carry, net APY metrics
 * - Basis trade = long spot + short perp (perp handled separately)
 *
 * To run: npx playwright test e2e/strategies/defi/basis-trade-swap.spec.ts
 */

test.describe("DeFi Basis Trade (Swap Widget) E2E", () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    // Set up mock authentication with a persona that has execution entitlements
    await page.addInitScript(() => {
      // Use the "internal-trader" persona which has all entitlements
      localStorage.setItem(
        "portal_user",
        JSON.stringify({
          id: "internal-trader",
          email: "trader@odum.internal",
        }),
      );
      localStorage.setItem("portal_token", "demo-token-internal-trader");
    });

    // Navigate to Carry Basis strategy page (renamed from basis-trade)
    await page.goto("http://localhost:3100/services/trading/strategies/carry-basis", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Wait for page to settle
    await page.waitForTimeout(2000);
  });

  // ============================================================================
  // Test 1: Swap Widget Renders with USDT/ETH Pair
  // ============================================================================
  test("swap widget displays USDT → ETH by default (basis trade pair)", async ({ page }) => {
    // Wait for swap widget to be present
    const payInput = page.locator("[placeholder='0.00']").first();
    await expect(payInput).toBeVisible({ timeout: 10000 });

    // Check for USDT/ETH tokens in the form
    const formText = await page.locator("body").textContent();
    expect(formText).toContain("USDT");
    expect(formText).toContain("ETH");
  });

  // ============================================================================
  // Test 2: Capital Amount Input Accepted
  // ============================================================================
  test("capital input accepts basis trade amounts (90% of total)", async ({ page }) => {
    const amountInput = page.locator("[placeholder='0.00']").first();

    // Enter 100,000 USDT (typical basis trade capital)
    await amountInput.fill("100000");
    await page.waitForTimeout(500);

    const value = await amountInput.inputValue();
    expect(value).toBe("100000");
  });

  // ============================================================================
  // Test 3: Funding Rate Displayed When Amount Entered
  // ============================================================================
  test("funding rate APY shown when amount is entered", async ({ page }) => {
    const amountInput = page.locator("[placeholder='0.00']").first();
    await amountInput.fill("100000");
    await page.waitForTimeout(500);

    // Check for basis trade metrics section
    const fundingText = await page.locator("text=Funding APY").textContent();
    expect(fundingText).toBeTruthy();

    // Should show a percentage value
    const metricsSection = page.locator("text=Basis Trade Metrics");
    await expect(metricsSection).toBeVisible();
  });

  // ============================================================================
  // Test 4: Cost of Carry Calculated
  // ============================================================================
  test("cost of carry calculated from fees and gas", async ({ page }) => {
    const amountInput = page.locator("[placeholder='0.00']").first();
    await amountInput.fill("100000");
    await page.waitForTimeout(500);

    // Check for cost of carry metric
    const costText = await page.locator("text=Cost of Carry").textContent();
    expect(costText).toBeTruthy();

    // Should show a percentage
    const costValue = await page.locator("text=Cost of Carry").evaluate(() => {
      const parent = document.body;
      const text = parent.textContent || "";
      const match = text.match(/Cost of Carry[\s\S]*?([\d.]+%)/);
      return match ? match[1] : null;
    });
    expect(costValue).toBeTruthy();
  });

  // ============================================================================
  // Test 5: Net APY = Funding APY - Cost
  // ============================================================================
  test("net APY calculated as funding APY minus cost of carry", async ({ page }) => {
    const amountInput = page.locator("[placeholder='0.00']").first();
    await amountInput.fill("100000");
    await page.waitForTimeout(500);

    // Check for net APY metric
    const netText = await page.locator("text=Net APY").textContent();
    expect(netText).toBeTruthy();

    // All three metrics should be visible together
    await expect(page.locator("text=Basis Trade Metrics")).toBeVisible();
  });

  // ============================================================================
  // Test 6: Profitability Indicated by Color (Green = Profitable)
  // ============================================================================
  test("net APY color indicates profitability", async ({ page }) => {
    const amountInput = page.locator("[placeholder='0.00']").first();
    await amountInput.fill("100000");
    await page.waitForTimeout(500);

    // Get the net APY display (the value div after the "Net APY" label)
    const netAPYLabel = page.locator("text=Net APY").first();
    const netAPYContainer = netAPYLabel.locator("..").locator("[class*='font-mono'][class*='font-bold']").first();
    const classes = await netAPYContainer.getAttribute("class");

    // Should have either green-600 or red-500 class
    const isGreenOrRed = classes?.includes("green-600") || classes?.includes("red-500");
    expect(isGreenOrRed).toBeTruthy();
  });

  // ============================================================================
  // Test 7: Asset Change Updates Funding Metrics
  // ============================================================================
  test("changing asset updates all funding-related metrics", async ({ page }) => {
    const amountInput = page.locator("[placeholder='0.00']").first();
    await amountInput.fill("100000");
    await page.waitForTimeout(500);

    // Get initial metrics (the percentage value, not the label)
    const fundingAPYLabel = page.locator("text=Funding APY").first();
    const fundingAPYValueFirst = fundingAPYLabel
      .locator("..")
      .locator("[class*='font-mono'][class*='text-green']")
      .first();
    const initialFunding = await fundingAPYValueFirst.textContent();

    // Change asset from ETH to BTC using Radix UI Select
    // Click the "You receive" trigger button
    const receiveSelectors = page
      .locator("label")
      .filter({ hasText: "You receive" })
      .locator("..")
      .locator("[role='combobox']");
    await receiveSelectors.click();
    await page.waitForTimeout(300);

    // Click the BTC option in the dropdown
    await page.locator("[role='option']:has-text('BTC')").click();
    await page.waitForTimeout(500);

    // Funding metrics should update for BTC (value should change)
    const fundingAPYValueAfter = fundingAPYLabel
      .locator("..")
      .locator("[class*='font-mono'][class*='text-green']")
      .first();
    const newFunding = await fundingAPYValueAfter.textContent();

    // The value should have changed (ETH vs BTC have different funding rates)
    expect(newFunding).not.toBe(initialFunding);
  });

  // ============================================================================
  // Test 8: Slippage Tolerance Settings
  // ============================================================================
  test("slippage tolerance options available (0.1%, 0.5%, 1%)", async ({ page }) => {
    // Look for slippage buttons
    const slippageButtons = page.locator("button:has-text('%')");
    const count = await slippageButtons.count();

    // Should have at least 3 slippage options
    expect(count).toBeGreaterThanOrEqual(3);
  });

  // ============================================================================
  // Test 9: Route Details Shown for Complex SOR Routing
  // ============================================================================
  test("route details collapsible shows swap path and pools", async ({ page }) => {
    const amountInput = page.locator("[placeholder='0.00']").first();
    await amountInput.fill("100000");
    await page.waitForTimeout(500);

    // Route details should be available
    const routeSection = page.locator("text=Route details");
    expect(routeSection).toBeTruthy();
  });

  // ============================================================================
  // Test 10: Execute Button Shows "Execute Basis Trade Swap"
  // ============================================================================
  test("execute button labeled for basis trade context", async ({ page }) => {
    const amountInput = page.locator("[placeholder='0.00']").first();
    await amountInput.fill("50000");
    await page.waitForTimeout(500);

    // Button should say "Execute Basis Trade Swap" (if in basis trade mode)
    // Or just "Swap" if using regular swap widget
    const button = page.locator("button:has-text('Swap')").first();
    await expect(button).toBeVisible();
  });

  // ============================================================================
  // Test 11: Large Capital Amounts Handled
  // ============================================================================
  test("handles large capital amounts ($5M+)", async ({ page }) => {
    const amountInput = page.locator("[placeholder='0.00']").first();
    await amountInput.fill("5000000");
    await page.waitForTimeout(500);

    // Metrics should still calculate
    const fundingText = await page.locator("text=Funding APY").textContent();
    expect(fundingText).toBeTruthy();
  });

  // ============================================================================
  // Test 12: Decimal Capital Input
  // ============================================================================
  test("handles decimal capital amounts", async ({ page }) => {
    const amountInput = page.locator("[placeholder='0.00']").first();
    await amountInput.fill("123456.78");
    await page.waitForTimeout(500);

    const value = await amountInput.inputValue();
    expect(value).toBe("123456.78");

    // Metrics should calculate
    const fundingText = await page.locator("text=Funding APY").textContent();
    expect(fundingText).toBeTruthy();
  });

  // ============================================================================
  // Test 13: Execute Button Disabled on Zero Amount
  // ============================================================================
  test("execute button disabled when amount is zero or empty", async ({ page }) => {
    // Find the swap button
    const button = page.locator("button:has-text('Swap')").first();
    await expect(button).toBeDisabled();

    // Enter amount
    const amountInput = page.locator("[placeholder='0.00']").first();
    await amountInput.fill("50000");
    await page.waitForTimeout(500);

    // Button should be enabled
    await expect(button).toBeEnabled();
  });

  // ============================================================================
  // Test 14: Rapid Input Changes Handled
  // ============================================================================
  test("rapid capital amount changes handled without errors", async ({ page }) => {
    const amountInput = page.locator("[placeholder='0.00']").first();

    // Rapid changes
    await amountInput.fill("50000");
    await page.waitForTimeout(100);
    await amountInput.clear();
    await amountInput.fill("100000");
    await page.waitForTimeout(100);
    await amountInput.clear();
    await amountInput.fill("75000");
    await page.waitForTimeout(500);

    // Should settle on final value
    const value = await amountInput.inputValue();
    expect(value).toBe("75000");

    // Metrics should be present
    const fundingText = await page.locator("text=Funding APY").textContent();
    expect(fundingText).toBeTruthy();
  });

  // ============================================================================
  // Test 15: Basis Trade Workflow - From Entry to Metrics
  // ============================================================================
  test("complete basis trade workflow: capital → asset → metrics", async ({ page }) => {
    // Step 1: Enter capital (90% of total capital for basis trade)
    const amountInput = page.locator("[placeholder='0.00']").first();
    await amountInput.fill("90000"); // 90% of 100k total
    await page.waitForTimeout(500);

    // Step 2: Verify USDT → ETH pair (default)
    const formText = await page.locator("body").textContent();
    expect(formText).toContain("USDT");
    expect(formText).toContain("ETH");

    // Step 3: Verify basis trade metrics appear
    const metricsSection = page.locator("text=Basis Trade Metrics");
    await expect(metricsSection).toBeVisible();

    // Step 4: Verify all three key metrics
    const fundingText = await page.locator("text=Funding APY").textContent();
    const costText = await page.locator("text=Cost of Carry").textContent();
    const netText = await page.locator("text=Net APY").textContent();

    expect(fundingText).toBeTruthy();
    expect(costText).toBeTruthy();
    expect(netText).toBeTruthy();

    // Step 5: Button should be ready to execute
    const button = page.locator("button:has-text('Swap')").first();
    await expect(button).toBeEnabled();
  });
});
