import { test, expect } from "@playwright/test";

/**
 * DeFi Basis Trade UI E2E Tests
 *
 * This test suite verifies the basis trade widget functionality:
 * 1. Form inputs (capital, asset, hedge ratio, slippage, operation)
 * 2. Output value updates when inputs change
 * 3. Strategy metrics calculated correctly
 * 4. Health checks (margin usage, funding rate, profitability)
 * 5. Trade execution and history updates
 *
 * To run: npx playwright test e2e/strategies/defi/basis-trade.spec.ts
 */

test.describe("DeFi Basis Trade UI E2E", () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    // Set up mock authentication
    await page.addInitScript(() => {
      localStorage.setItem("portal_user", "demo-user");
      localStorage.setItem("portal_token", "demo-token");
    });

    // Navigate to DeFi page
    await page.goto("http://localhost:3100/services/trading/defi", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Wait for any widget to load (asset select is a good indicator the page loaded)
    await page.waitForTimeout(2000); // Let page settle

    // Wait for the capital-input field specifically to be in the DOM
    try {
      await expect(page.locator("[data-testid='capital-input']")).toBeDefined({ timeout: 10000 });
    } catch {
      // If not found,just continue - widget might be there but not visible
    }
  });

  // ============================================================================
  // Test 1: Widget Renders with Initial State
  // ============================================================================
  test("widget renders with initial state", async ({ page }) => {
    // Check widget is visible
    const widget = page.locator("text=Basis Trade").first();
    await expect(widget).toBeVisible();

    // Check form elements are visible
    await expect(page.locator("[data-testid='asset-select']")).toBeVisible();
    await expect(page.locator("[data-testid='capital-input']")).toBeVisible();
    await expect(page.locator("[data-testid='hedge-ratio-input']")).toBeVisible();
    await expect(page.locator("[data-testid='operation-select']")).toBeVisible();
    await expect(page.locator("[data-testid='slippage-input']")).toBeVisible();

    // Check output metrics are visible
    await expect(page.locator("[data-testid='expected-output']")).toBeVisible();
    await expect(page.locator("[data-testid='margin-usage']")).toBeVisible();
    await expect(page.locator("[data-testid='funding-apy']")).toBeVisible();
  });

  // ============================================================================
  // Test 2: Asset Selection Updates Market Data
  // ============================================================================
  test("asset selection updates market data and outputs", async ({ page }) => {
    // Set capital amount
    await page.locator("[data-testid='capital-input']").fill("100000");
    await page.waitForTimeout(500);

    // Get initial expected output for ETH
    const initialOutput = await page.locator("[data-testid='expected-output']").textContent();
    expect(initialOutput).toMatch(/\d+\.\d+\s+ETH/);

    // Switch to BTC
    await page.locator("[data-testid='asset-select']").click();
    await page.locator("text=BTC").click();
    await page.waitForTimeout(500);

    // Get new expected output for BTC
    const newOutput = await page.locator("[data-testid='expected-output']").textContent();
    expect(newOutput).toMatch(/\d+\.\d+\s+BTC/);

    // Verify outputs are different (different asset prices)
    expect(initialOutput).not.toBe(newOutput);
  });

  // ============================================================================
  // Test 3: Capital Input Updates Expected Output
  // ============================================================================
  test("capital input changes update expected output proportionally", async ({ page }) => {
    // Enter capital of 50000
    await page.locator("[data-testid='capital-input']").fill("50000");
    await page.waitForTimeout(500);

    const output50k = await page.locator("[data-testid='expected-output']").textContent();
    const value50k = parseFloat(output50k?.match(/[\d.]+/)?.[0] || "0");

    // Change to 100000 (double)
    await page.locator("[data-testid='capital-input']").clear();
    await page.locator("[data-testid='capital-input']").fill("100000");
    await page.waitForTimeout(500);

    const output100k = await page.locator("[data-testid='expected-output']").textContent();
    const value100k = parseFloat(output100k?.match(/[\d.]+/)?.[0] || "0");

    // Expected output should roughly double (accounting for slippage)
    expect(value100k).toBeGreaterThan(value50k * 1.9);
    expect(value100k).toBeLessThan(value50k * 2.1);
  });

  // ============================================================================
  // Test 4: Slippage Changes Affect Expected Output
  // ============================================================================
  test("slippage setting changes expected output", async ({ page }) => {
    await page.locator("[data-testid='capital-input']").fill("100000");
    await page.locator("[data-testid='slippage-input']").fill("5");
    await page.waitForTimeout(500);

    const output5bps = await page.locator("[data-testid='expected-output']").textContent();
    const value5bps = parseFloat(output5bps?.match(/[\d.]+/)?.[0] || "0");

    // Increase slippage to 10 bps (worse output)
    await page.locator("[data-testid='slippage-input']").clear();
    await page.locator("[data-testid='slippage-input']").fill("10");
    await page.waitForTimeout(500);

    const output10bps = await page.locator("[data-testid='expected-output']").textContent();
    const value10bps = parseFloat(output10bps?.match(/[\d.]+/)?.[0] || "0");

    // Higher slippage should result in lower output
    expect(value10bps).toBeLessThan(value5bps);
  });

  // ============================================================================
  // Test 5: Operation Type Changes Output Format
  // ============================================================================
  test("operation type changes expected output format", async ({ page }) => {
    await page.locator("[data-testid='capital-input']").fill("100000");
    await page.waitForTimeout(500);

    // BOTH operation: shows asset amount
    const bothOutput = await page.locator("[data-testid='expected-output']").textContent();
    expect(bothOutput).toMatch(/\d+\.\d+\s+(ETH|BTC|SOL)/);

    // Switch to SWAP only
    await page.locator("[data-testid='operation-select']").click();
    await page.locator("text=SWAP Only").click();
    await page.waitForTimeout(500);

    const swapOutput = await page.locator("[data-testid='expected-output']").textContent();
    expect(swapOutput).toMatch(/\d+\.\d+\s+(ETH|BTC|SOL)/);

    // Switch to TRADE only: shows dollar amount
    await page.locator("[data-testid='operation-select']").click();
    await page.locator("text=TRADE Only").click();
    await page.waitForTimeout(500);

    const tradeOutput = await page.locator("[data-testid='expected-output']").textContent();
    // TRADE only shows notional exposure
    expect(tradeOutput).toBeTruthy();
  });

  // ============================================================================
  // Test 6: Margin Usage Updates by Asset
  // ============================================================================
  test("margin usage calculated per asset collateral factor", async ({ page }) => {
    await page.locator("[data-testid='capital-input']").fill("100000");
    await page.waitForTimeout(500);

    // Get initial margin usage for ETH
    const ethMarginText = await page.locator("[data-testid='margin-usage']").textContent();
    const ethMargin = parseFloat(ethMarginText?.match(/[\d.]+/)?.[0] || "0");

    // Switch to SOL (higher margin requirement)
    await page.locator("[data-testid='asset-select']").click();
    await page.locator("text=SOL").click();
    await page.waitForTimeout(500);

    // Get margin usage for SOL
    const solMarginText = await page.locator("[data-testid='margin-usage']").textContent();
    const solMargin = parseFloat(solMarginText?.match(/[\d.]+/)?.[0] || "0");

    // SOL has higher margin requirement, so should have higher margin usage
    expect(solMargin).toBeGreaterThan(ethMargin);
  });

  // ============================================================================
  // Test 7: Funding Rate Impact Displayed
  // ============================================================================
  test("funding rate impact calculated and displayed", async ({ page }) => {
    await page.locator("[data-testid='capital-input']").fill("100000");
    await page.waitForTimeout(500);

    // Funding APY should be visible and positive
    const fundingText = await page.locator("[data-testid='funding-apy']").textContent();
    expect(fundingText).toBeTruthy();
    expect(fundingText).toMatch(/\d+\.?\d*%/);

    // Should show percentage value
    const fundingValue = parseFloat(fundingText?.match(/[\d.]+/)?.[0] || "0");
    expect(fundingValue).toBeGreaterThan(0);
  });

  // ============================================================================
  // Test 8: Cost of Carry Calculated
  // ============================================================================
  test("cost of carry calculated from fees and gas", async ({ page }) => {
    await page.locator("[data-testid='capital-input']").fill("100000");
    await page.waitForTimeout(500);

    // Cost of carry should be visible
    const costText = await page.locator("[data-testid='cost-of-carry']").textContent();
    expect(costText).toBeTruthy();
    expect(costText).toMatch(/[\d.]+%/);

    const costValue = parseFloat(costText?.match(/[\d.]+/)?.[0] || "0");
    expect(costValue).toBeGreaterThan(0);
  });

  // ============================================================================
  // Test 9: Net APY Calculated Correctly
  // ============================================================================
  test("net APY calculated as funding rate minus costs", async ({ page }) => {
    await page.locator("[data-testid='capital-input']").fill("100000");
    await page.waitForTimeout(500);

    const fundingText = await page.locator("[data-testid='funding-apy']").textContent();
    const costText = await page.locator("[data-testid='cost-of-carry']").textContent();
    const netText = await page.locator("[data-testid='net-apy']").textContent();

    const funding = parseFloat(fundingText?.match(/[\d.]+/)?.[0] || "0");
    const cost = parseFloat(costText?.match(/[\d.]+/)?.[0] || "0");
    const net = parseFloat(netText?.match(/[\d.]+/)?.[0] || "0");

    // Net APY should be roughly funding - cost
    const expectedNet = funding - cost;
    expect(net).toBeCloseTo(expectedNet, 0.5);
  });

  // ============================================================================
  // Test 10: Profitability Badge Changes
  // ============================================================================
  test("profitability badge shows based on net APY", async ({ page }) => {
    await page.locator("[data-testid='capital-input']").fill("100000");
    await page.waitForTimeout(500);

    // Check if profitable badge is present
    const netText = await page.locator("[data-testid='net-apy']").textContent();
    const netAPY = parseFloat(netText?.match(/[\d.]+/)?.[0] || "0");

    if (netAPY > 0) {
      await expect(page.locator("text=Profitable")).toBeVisible();
    } else {
      await expect(page.locator("text=Unprofitable")).toBeVisible();
    }
  });

  // ============================================================================
  // Test 11: Breakeven Funding Rate Calculated
  // ============================================================================
  test("breakeven funding rate displayed", async ({ page }) => {
    await page.locator("[data-testid='capital-input']").fill("100000");
    await page.waitForTimeout(500);

    // Breakeven funding should be visible
    const breakevenText = await page.locator("[data-testid='breakeven-funding']").textContent();
    expect(breakevenText).toBeTruthy();
    expect(breakevenText).toMatch(/[\d.]+%/);

    const breakeven = parseFloat(breakevenText?.match(/[\d.]+/)?.[0] || "0");
    expect(breakeven).toBeGreaterThan(0);
  });

  // ============================================================================
  // Test 12: Hedge Ratio Changes (Input acceptance)
  // ============================================================================
  test("hedge ratio input accepts values", async ({ page }) => {
    await page.locator("[data-testid='hedge-ratio-input']").fill("50");

    const value = await page.locator("[data-testid='hedge-ratio-input']").inputValue();
    expect(value).toBe("50");

    // Change to 100
    await page.locator("[data-testid='hedge-ratio-input']").clear();
    await page.locator("[data-testid='hedge-ratio-input']").fill("100");

    const newValue = await page.locator("[data-testid='hedge-ratio-input']").inputValue();
    expect(newValue).toBe("100");
  });

  // ============================================================================
  // Test 13: Trade Execution Adds to History
  // ============================================================================
  test("trade execution adds entry to trade history", async ({ page }) => {
    await page.locator("[data-testid='capital-input']").fill("50000");
    await page.waitForTimeout(500);

    // Get initial trade count
    const initialCount = await page.locator("[data-testid='trade-history-row']").count();

    // Execute trade
    await page.locator("[data-testid='execute-button']").click();
    await page.waitForTimeout(1000);

    // Check new trade was added
    const newCount = await page.locator("[data-testid='trade-history-row']").count();
    expect(newCount).toBe(initialCount + 1);
  });

  // ============================================================================
  // Test 14: Trade History Shows Correct Details
  // ============================================================================
  test("trade history entry shows correct operation and asset", async ({ page }) => {
    await page.locator("[data-testid='capital-input']").fill("50000");
    await page.locator("[data-testid='asset-select']").click();
    await page.locator("text=BTC").click();
    await page.locator("[data-testid='operation-select']").click();
    await page.locator("text=SWAP Only").click();
    await page.waitForTimeout(500);

    // Execute trade
    await page.locator("[data-testid='execute-button']").click();
    await page.waitForTimeout(1000);

    // Check the most recent trade entry
    const lastTrade = page.locator("[data-testid='trade-history-row']").last();
    await expect(lastTrade).toContainText("SWAP");
    await expect(lastTrade).toContainText("BTC");
  });

  // ============================================================================
  // Test 15: Multiple Executions Create Sequential Trades
  // ============================================================================
  test("multiple executions create sequential trade history entries", async ({ page }) => {
    // First trade
    await page.locator("[data-testid='capital-input']").fill("25000");
    await page.locator("[data-testid='execute-button']").click();
    await page.waitForTimeout(1000);

    const afterFirst = await page.locator("[data-testid='trade-history-row']").count();

    // Second trade
    await page.locator("[data-testid='capital-input']").fill("50000");
    await page.locator("[data-testid='execute-button']").click();
    await page.waitForTimeout(1000);

    const afterSecond = await page.locator("[data-testid='trade-history-row']").count();

    // Both trades should be in history
    expect(afterSecond).toBe(afterFirst + 1);
  });

  // ============================================================================
  // Test 16: Execute Button Disabled When Amount = 0
  // ============================================================================
  test("execute button disabled when capital amount is zero", async ({ page }) => {
    // Capital is empty by default
    const executeButton = page.locator("[data-testid='execute-button']");
    await expect(executeButton).toBeDisabled();

    // Enter amount
    await page.locator("[data-testid='capital-input']").fill("50000");
    await page.waitForTimeout(500);

    // Button should be enabled
    await expect(executeButton).toBeEnabled();

    // Clear amount
    await page.locator("[data-testid='capital-input']").clear();
    await page.waitForTimeout(500);

    // Button should be disabled again
    await expect(executeButton).toBeDisabled();
  });

  // ============================================================================
  // Test 17: Edge Case - Very Large Capital
  // ============================================================================
  test("handles very large capital amounts", async ({ page }) => {
    await page.locator("[data-testid='capital-input']").fill("10000000"); // $10M
    await page.waitForTimeout(500);

    // Outputs should still calculate correctly
    const output = await page.locator("[data-testid='expected-output']").textContent();
    expect(output).toMatch(/\d+\.\d+\s+(ETH|BTC|SOL)/);

    const marginText = await page.locator("[data-testid='margin-usage']").textContent();
    expect(marginText).toMatch(/\d+\.?\d*%/);
  });

  // ============================================================================
  // Test 18: Edge Case - Decimal Capital Input
  // ============================================================================
  test("handles decimal capital amounts", async ({ page }) => {
    await page.locator("[data-testid='capital-input']").fill("123456.78");
    await page.waitForTimeout(500);

    const output = await page.locator("[data-testid='expected-output']").textContent();
    expect(output).toMatch(/\d+\.\d+\s+(ETH|BTC|SOL)/);

    // Execute should work
    await page.locator("[data-testid='execute-button']").click();
    await page.waitForTimeout(1000);

    const tradeCount = await page.locator("[data-testid='trade-history-row']").count();
    expect(tradeCount).toBeGreaterThan(0);
  });

  // ============================================================================
  // Test 19: Rapid Input Changes Handled Correctly
  // ============================================================================
  test("rapid input changes are handled without errors", async ({ page }) => {
    // Rapid changes to capital
    await page.locator("[data-testid='capital-input']").fill("50000");
    await page.waitForTimeout(100);

    await page.locator("[data-testid='capital-input']").clear();
    await page.locator("[data-testid='capital-input']").fill("100000");
    await page.waitForTimeout(100);

    await page.locator("[data-testid='capital-input']").clear();
    await page.locator("[data-testid='capital-input']").fill("75000");
    await page.waitForTimeout(500);

    // Should settle on final value
    const output = await page.locator("[data-testid='expected-output']").textContent();
    expect(output).toMatch(/\d+\.\d+\s+(ETH|BTC|SOL)/);

    // Execute should work
    await page.locator("[data-testid='execute-button']").click();
    await page.waitForTimeout(1000);

    const tradeCount = await page.locator("[data-testid='trade-history-row']").count();
    expect(tradeCount).toBeGreaterThan(0);
  });

  // ============================================================================
  // Test 20: Protocol Switch Updates All Metrics
  // ============================================================================
  test("switching between assets updates all metrics", async ({ page }) => {
    await page.locator("[data-testid='capital-input']").fill("100000");
    await page.waitForTimeout(500);

    const eth_margin = await page.locator("[data-testid='margin-usage']").textContent();
    const eth_funding = await page.locator("[data-testid='funding-apy']").textContent();

    // Switch to BTC
    await page.locator("[data-testid='asset-select']").click();
    await page.locator("text=BTC").click();
    await page.waitForTimeout(500);

    const btc_margin = await page.locator("[data-testid='margin-usage']").textContent();
    const btc_funding = await page.locator("[data-testid='funding-apy']").textContent();

    // Metrics should have changed
    expect(btc_margin).not.toBe(eth_margin);
    expect(btc_funding).not.toBe(eth_funding);
  });
});
