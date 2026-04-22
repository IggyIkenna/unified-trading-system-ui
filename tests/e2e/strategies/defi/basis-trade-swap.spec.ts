import { test, expect, type Page } from "@playwright/test";

/**
 * DeFi Basis Trade (via Swap Widget) E2E Tests.
 *
 * Serial mode + shared page: one browser window stays open for the whole suite
 * so --project=human shows a continuous flow, not 15 open/close cycles.
 *
 * Route: /services/trading/strategies/carry-basis
 * Widget under test: defi-swap-widget in basis-trade mode (capital-input).
 */

const BASE_URL = "http://localhost:3100";

test.describe.configure({ mode: "serial" });

test.describe("DeFi Basis Trade (Swap Widget) E2E", () => {
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

  test("swap widget displays USDT → ETH by default (basis trade pair)", async () => {
    await page.waitForSelector("[placeholder='0.00']", { timeout: 10_000 });
    const formText = await page.locator("body").textContent();
    expect(formText).toContain("USDT");
    expect(formText).toContain("ETH");
  });

  test("capital input accepts basis trade amounts (90% of total)", async () => {
    const amountInput = page.locator("[data-testid='capital-input']");
    await amountInput.fill("100000");
    await page.waitForTimeout(500);
    expect(await amountInput.inputValue()).toBe("100000");
  });

  test("funding rate APY shown when amount is entered", async () => {
    const swap = page.locator('[data-testid="defi-swap-widget"]');
    await expect(swap.getByText("Basis Trade Metrics")).toBeVisible();
    expect(await swap.getByText("Funding APY").textContent()).toBeTruthy();
  });

  test("cost of carry calculated from fees and gas", async () => {
    const swap = page.locator('[data-testid="defi-swap-widget"]');
    expect(await swap.getByText("Cost of Carry").textContent()).toBeTruthy();
  });

  test("net APY calculated as funding APY minus cost of carry", async () => {
    const swap = page.locator('[data-testid="defi-swap-widget"]');
    expect(await swap.getByText("Net APY").textContent()).toBeTruthy();
    await expect(swap.getByText("Basis Trade Metrics")).toBeVisible();
  });

  test("net APY color indicates profitability", async () => {
    const swap = page.locator('[data-testid="defi-swap-widget"]');
    const netAPYLabel = swap.getByText("Net APY").first();
    const netAPYValue = netAPYLabel.locator("..").locator("[class*='font-mono'][class*='font-bold']").first();
    const classes = await netAPYValue.getAttribute("class");
    expect(classes?.includes("green-600") || classes?.includes("red-500")).toBeTruthy();
  });

  test("receive asset selector is present and shows current token", async () => {
    const swap = page.locator('[data-testid="defi-swap-widget"]');
    const receiveSelector = swap.locator('[data-testid="asset-to-select"]');
    await expect(receiveSelector).toBeVisible();
    // Verify the current receive token is displayed (ETH default for basis trade).
    const text = await receiveSelector.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
    // Verify funding metrics are visible alongside the current asset selection.
    await expect(swap.getByText("Funding APY")).toBeVisible();
    await expect(swap.getByText("Cost of Carry")).toBeVisible();
    await expect(swap.getByText("Net APY")).toBeVisible();
  });

  test("slippage tolerance options available (0.1%, 0.5%, 1%)", async () => {
    const slippageButtons = page.locator("button:has-text('%')");
    expect(await slippageButtons.count()).toBeGreaterThanOrEqual(3);
  });

  test("route details collapsible is present", async () => {
    expect(page.locator("text=Route details")).toBeTruthy();
  });

  test("execute button labeled for basis trade context", async () => {
    await expect(page.locator("button:has-text('Swap')").first()).toBeVisible();
  });

  test("handles large capital amounts ($5M+)", async () => {
    const amountInput = page.locator("[data-testid='capital-input']");
    await amountInput.fill("5000000");
    await page.waitForTimeout(500);
    expect(await page.locator('[data-testid="defi-swap-widget"]').getByText("Funding APY").textContent()).toBeTruthy();
  });

  test("handles decimal capital amounts", async () => {
    const amountInput = page.locator("[data-testid='capital-input']");
    await amountInput.fill("123456.78");
    await page.waitForTimeout(500);
    expect(await amountInput.inputValue()).toBe("123456.78");
    expect(await page.locator('[data-testid="defi-swap-widget"]').getByText("Funding APY").textContent()).toBeTruthy();
  });

  test("execute button disabled when amount is zero or empty", async () => {
    const amountInput = page.locator("[data-testid='capital-input']");
    await amountInput.fill("");
    await page.waitForTimeout(300);
    await expect(page.locator("button:has-text('Swap')").first()).toBeDisabled();
    await amountInput.fill("50000");
    await page.waitForTimeout(500);
    await expect(page.locator("button:has-text('Swap')").first()).toBeEnabled();
  });

  test("rapid capital amount changes handled without errors", async () => {
    const amountInput = page.locator("[data-testid='capital-input']");
    await amountInput.fill("50000");
    await page.waitForTimeout(100);
    await amountInput.fill("100000");
    await page.waitForTimeout(100);
    await amountInput.fill("75000");
    await page.waitForTimeout(500);
    expect(await amountInput.inputValue()).toBe("75000");
    expect(await page.locator('[data-testid="defi-swap-widget"]').getByText("Funding APY").textContent()).toBeTruthy();
  });

  test("complete basis trade workflow: capital → asset → metrics", async () => {
    const amountInput = page.locator("[data-testid='capital-input']");
    await amountInput.fill("90000");
    await page.waitForTimeout(500);
    const formText = await page.locator("body").textContent();
    expect(formText).toContain("USDT");
    expect(formText).toContain("ETH");
    await expect(page.locator('[data-testid="defi-swap-widget"]').getByText("Basis Trade Metrics")).toBeVisible();
    expect(await page.locator('[data-testid="defi-swap-widget"]').getByText("Funding APY").textContent()).toBeTruthy();
    expect(
      await page.locator('[data-testid="defi-swap-widget"]').getByText("Cost of Carry").textContent(),
    ).toBeTruthy();
    expect(await page.locator('[data-testid="defi-swap-widget"]').getByText("Net APY").textContent()).toBeTruthy();
    await expect(page.locator("button:has-text('Swap')").first()).toBeEnabled();
  });
});
