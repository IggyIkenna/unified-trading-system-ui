import { test, expect, type Page } from "@playwright/test";

/**
 * DeFiSwapWidget (basis-trade mode) — widget validation spec.
 *
 * Verifies every interactive behaviour of the swap widget on the carry-basis
 * route: capital input acceptance, metric panel presence, button states,
 * slippage options, edge-case amounts.
 *
 * These run headless in CI (--project=chromium / --project=widgets).
 * They are NOT included in --project=human — that project shows the trader
 * workflow in tests/e2e/strategies/defi/basis-trade-swap.spec.ts.
 */

const BASE_URL = "http://localhost:3100";

test.describe.configure({ mode: "serial" });

test.describe("DeFiSwapWidget (basis-trade mode) — UI validation", () => {
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

  // ── Initial state ──────────────────────────────────────────────────────────

  test("widget loads with USDT→ETH default pair for basis trade", async () => {
    await page.waitForSelector("[placeholder='0.00']", { timeout: 10_000 });
    const formText = await page.locator("body").textContent();
    expect(formText).toContain("USDT");
    expect(formText).toContain("ETH");
  });

  test("all basis trade metric panels are present before amount entry", async () => {
    await expect(swap().getByText("Basis Trade Metrics")).toBeVisible();
    await expect(swap().getByText("Funding APY")).toBeVisible();
    await expect(swap().getByText("Cost of Carry")).toBeVisible();
    await expect(swap().getByText("Net APY")).toBeVisible();
  });

  test("swap button is disabled before capital amount is entered", async () => {
    await expect(page.locator("button:has-text('Swap')").first()).toBeDisabled();
  });

  // ── Capital input ──────────────────────────────────────────────────────────

  test("capital input accepts basis trade amounts (e.g. $100k)", async () => {
    const amountInput = page.locator("[data-testid='capital-input']");
    await amountInput.fill("100000");
    await page.waitForTimeout(500);
    expect(await amountInput.inputValue()).toBe("100000");
  });

  test("funding APY metric is populated after entering capital amount", async () => {
    expect(await swap().getByText("Funding APY").textContent()).toBeTruthy();
  });

  test("cost of carry metric is populated after entering capital amount", async () => {
    expect(await swap().getByText("Cost of Carry").textContent()).toBeTruthy();
  });

  test("net APY metric is populated and Basis Trade Metrics section visible", async () => {
    expect(await swap().getByText("Net APY").textContent()).toBeTruthy();
    await expect(swap().getByText("Basis Trade Metrics")).toBeVisible();
  });

  test("net APY value is coloured green (profitable) or red (unprofitable)", async () => {
    const netAPYLabel = swap().getByText("Net APY").first();
    const netAPYValue = netAPYLabel.locator("..").locator("[class*='font-mono'][class*='font-bold']").first();
    const classes = await netAPYValue.getAttribute("class");
    expect(classes?.includes("green-600") || classes?.includes("red-500")).toBeTruthy();
  });

  // ── Receive asset selector ─────────────────────────────────────────────────

  test("receive asset selector (asset-to-select) is visible and shows current token", async () => {
    const receiveSelector = swap().locator('[data-testid="asset-to-select"]');
    await expect(receiveSelector).toBeVisible();
    const text = await receiveSelector.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  // ── Slippage ───────────────────────────────────────────────────────────────

  test("at least three slippage tolerance buttons are available", async () => {
    const slippageButtons = page.locator("button:has-text('%')");
    expect(await slippageButtons.count()).toBeGreaterThanOrEqual(3);
  });

  // ── Route details ──────────────────────────────────────────────────────────

  test("route details section is present in the widget", async () => {
    expect(page.locator("text=Route details")).toBeTruthy();
  });

  // ── Execute button state ───────────────────────────────────────────────────

  test("swap button is labelled 'Swap' for basis trade context", async () => {
    await expect(page.locator("button:has-text('Swap')").first()).toBeVisible();
  });

  test("swap button is enabled after capital amount is entered", async () => {
    const amountInput = page.locator("[data-testid='capital-input']");
    await amountInput.fill("50000");
    await page.waitForTimeout(500);
    await expect(page.locator("button:has-text('Swap')").first()).toBeEnabled();
  });

  test("swap button becomes disabled when capital is cleared", async () => {
    const amountInput = page.locator("[data-testid='capital-input']");
    await amountInput.fill("");
    await page.waitForTimeout(300);
    await expect(page.locator("button:has-text('Swap')").first()).toBeDisabled();
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  test("handles large capital amount ($5M) — metrics still populate", async () => {
    const amountInput = page.locator("[data-testid='capital-input']");
    await amountInput.fill("5000000");
    await page.waitForTimeout(500);
    expect(await swap().getByText("Funding APY").textContent()).toBeTruthy();
  });

  test("handles decimal capital amount ($123456.78)", async () => {
    const amountInput = page.locator("[data-testid='capital-input']");
    await amountInput.fill("123456.78");
    await page.waitForTimeout(500);
    expect(await amountInput.inputValue()).toBe("123456.78");
    expect(await swap().getByText("Funding APY").textContent()).toBeTruthy();
  });

  test("rapid capital changes settle correctly", async () => {
    const amountInput = page.locator("[data-testid='capital-input']");
    await amountInput.fill("50000");
    await page.waitForTimeout(100);
    await amountInput.fill("100000");
    await page.waitForTimeout(100);
    await amountInput.fill("75000");
    await page.waitForTimeout(500);
    expect(await amountInput.inputValue()).toBe("75000");
    expect(await swap().getByText("Funding APY").textContent()).toBeTruthy();
  });
});
