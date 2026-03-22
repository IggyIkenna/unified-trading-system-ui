import { test, expect } from "@playwright/test"

/**
 * TRADING & EXECUTION E2E TESTS
 *
 * Tests the Trading Terminal, Positions, Orders, and Execution pages.
 * Runs against the UI (port 3000) with mock API (port 8030).
 */

const BASE = "http://localhost:3000"

/** Log in as admin before each test. */
async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto(`${BASE}/login?persona=admin`)
  await page.click('button:has-text("Sign In")')
  await page.waitForURL("**/dashboard")
}

// ── 1. Trading Terminal Overview ─────────────────────────────────────

test.describe("Trading Terminal Overview", () => {
  test("renders candlestick chart, order book, and order entry form", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`${BASE}/services/trading/overview`)
    await page.waitForLoadState("networkidle")

    // Candlestick chart container — the card with "Price Chart" title
    await expect(page.locator("text=Price Chart")).toBeVisible()
    // Chart type buttons confirm the chart area rendered
    await expect(page.getByRole("button", { name: "candles" })).toBeVisible()
    await expect(page.getByRole("button", { name: "line" })).toBeVisible()

    // Order Book — the OrderBook component renders bid/ask data
    await expect(page.locator("text=Order Book").first()).toBeVisible()

    // Order Entry form — has Buy/Sell buttons and Limit/Market tabs
    await expect(page.locator("text=Order Entry")).toBeVisible()
    await expect(page.getByRole("button", { name: "Buy" }).first()).toBeVisible()
    await expect(page.getByRole("button", { name: "Sell" }).first()).toBeVisible()
    await expect(page.getByRole("tab", { name: "Limit" }).first()).toBeVisible()
    await expect(page.getByRole("tab", { name: "Market" }).first()).toBeVisible()
  })
})

// ── 2. Manual Trade Sheet ────────────────────────────────────────────

test.describe("Manual Trade Sheet", () => {
  test("clicking Manual Trade opens sheet drawer with trade form fields", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`${BASE}/services/trading/overview`)
    await page.waitForLoadState("networkidle")

    // Click the "Manual Trade" button to open the Sheet drawer
    const manualTradeBtn = page.getByRole("button", { name: /Manual Trade/i })
    await expect(manualTradeBtn).toBeVisible()
    await manualTradeBtn.click()

    // Sheet title confirms it opened
    await expect(page.locator("text=Manual Trade Entry")).toBeVisible()

    // Verify form fields are present: Instrument, Side (Buy/Sell), Quantity, Price
    await expect(page.locator("label:has-text('Instrument')")).toBeVisible()
    await expect(page.locator("label:has-text('Quantity')")).toBeVisible()

    // Buy and Sell buttons inside the sheet
    const sheetContent = page.locator('[class*="SheetContent"], [data-slot="sheet-content"], [role="dialog"]')
    const buyButton = sheetContent.getByRole("button", { name: "Buy" })
    const sellButton = sheetContent.getByRole("button", { name: "Sell" })
    await expect(buyButton).toBeVisible()
    await expect(sellButton).toBeVisible()

    // Venue selector
    await expect(page.locator("label:has-text('Venue')")).toBeVisible()

    // Preview Order button
    await expect(page.getByRole("button", { name: /Preview Order/i })).toBeVisible()
  })
})

// ── 3. Batch Mode Banner ─────────────────────────────────────────────

test.describe("Batch Mode Banner", () => {
  test("switching to batch mode shows 'Viewing Batch Data' banner", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`${BASE}/services/trading/overview`)
    await page.waitForLoadState("networkidle")

    // Click the Batch button in the live/batch toggle
    const batchToggle = page.getByRole("button", { name: /Batch/i }).first()
    await expect(batchToggle).toBeVisible()
    await batchToggle.click()

    // Wait for the banner to appear
    await expect(page.locator("text=Viewing Batch Data")).toBeVisible({ timeout: 5000 })
  })
})

// ── 4. Positions Tab ─────────────────────────────────────────────────

test.describe("Positions Tab", () => {
  test("positions page renders table with data rows", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`${BASE}/services/trading/positions`)
    await page.waitForLoadState("networkidle")

    // Table should be visible
    const table = page.locator("table")
    await expect(table.first()).toBeVisible({ timeout: 10000 })

    // Table header row should have column headers
    const headerCells = table.first().locator("thead th")
    expect(await headerCells.count()).toBeGreaterThan(0)

    // Table body should have data rows (mock data)
    const dataRows = table.first().locator("tbody tr")
    await expect(dataRows.first()).toBeVisible({ timeout: 10000 })
    expect(await dataRows.count()).toBeGreaterThan(0)
  })
})

// ── 5. Orders Tab ────────────────────────────────────────────────────

test.describe("Orders Tab", () => {
  test("orders page renders table with data rows", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`${BASE}/services/trading/orders`)
    await page.waitForLoadState("networkidle")

    // Table should be visible
    const table = page.locator("table")
    await expect(table.first()).toBeVisible({ timeout: 10000 })

    // Table header row should have column headers
    const headerCells = table.first().locator("thead th")
    expect(await headerCells.count()).toBeGreaterThan(0)

    // Table body should have data rows (mock seed data)
    const dataRows = table.first().locator("tbody tr")
    await expect(dataRows.first()).toBeVisible({ timeout: 10000 })
    expect(await dataRows.count()).toBeGreaterThan(0)
  })
})

// ── 6. Execution Analytics ───────────────────────────────────────────

test.describe("Execution Analytics", () => {
  test("execution overview renders platform heading and metric cards", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`${BASE}/services/execution/overview`)
    await page.waitForLoadState("networkidle")

    // Page heading
    await expect(page.locator("h1:has-text('Execution Platform')")).toBeVisible({ timeout: 10000 })

    // Descriptive subtitle
    await expect(
      page.locator("text=Real-time execution quality monitoring")
    ).toBeVisible()

    // KPI metric cards should render (Orders Today, Volume Traded, etc.)
    await expect(page.locator("text=Orders Today")).toBeVisible()
    await expect(page.locator("text=Volume Traded")).toBeVisible()
  })
})

// ── 7. Execution Venues ──────────────────────────────────────────────

test.describe("Execution Venues", () => {
  test("venues page renders Venue Matrix heading and venue data", async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`${BASE}/services/execution/venues`)
    await page.waitForLoadState("networkidle")

    // Page heading
    await expect(page.locator("h1:has-text('Venue Matrix')")).toBeVisible({ timeout: 10000 })

    // Descriptive subtitle
    await expect(
      page.locator("text=Real-time venue comparison for optimal order routing")
    ).toBeVisible()

    // Instrument selector should be present
    await expect(page.getByRole("combobox").first()).toBeVisible()

    // Refresh button
    await expect(page.getByRole("button", { name: /Refresh/i })).toBeVisible()

    // Venue status cards or table should render
    const cards = page.locator('[class*="CardContent"]')
    expect(await cards.count()).toBeGreaterThan(0)
  })
})
