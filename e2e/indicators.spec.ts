import { test, expect } from "@playwright/test"

/**
 * TECHNICAL INDICATORS E2E TESTS
 *
 * Validates that the Trading Terminal renders candlestick charts and
 * indicator overlays (SMA, EMA) toggle on/off correctly.
 *
 * The trading overview page imports sma/ema/bollingerBands from
 * lib/utils/indicators.ts and renders toggle buttons for each.
 */

const API = "http://localhost:8030"

test.beforeAll(async ({ request }) => {
  await request.post(`${API}/admin/reset`)
})

test.describe("Technical Indicators on Trading Terminal", () => {
  test("candlestick chart area renders", async ({ page }) => {
    await page.goto("/services/trading/overview")
    await page.waitForLoadState("networkidle")

    // The chart container should render — look for Price Chart heading
    await expect(page.locator("text=Price Chart")).toBeVisible({ timeout: 10000 })

    // Chart type buttons confirm the chart area exists
    await expect(page.getByRole("button", { name: "candles" })).toBeVisible()
    await expect(page.getByRole("button", { name: "line" })).toBeVisible()
  })

  test("SMA 20 indicator toggle activates overlay", async ({ page }) => {
    await page.goto("/services/trading/overview")
    await page.waitForLoadState("networkidle")

    // Find the SMA 20 toggle button
    const sma20Btn = page.getByRole("button", { name: "SMA 20" })
    await expect(sma20Btn).toBeVisible({ timeout: 10000 })

    // Initially should be ghost variant (not active)
    // Click to activate
    await sma20Btn.click()

    // After activation, the button should switch to secondary variant
    // and have a colored bottom border indicating the indicator is active
    await expect(async () => {
      const style = await sma20Btn.getAttribute("style")
      const className = await sma20Btn.getAttribute("class")
      // Active indicators get a border-bottom style or secondary class
      const isActive =
        (style && style.includes("border-bottom")) ||
        (className && className.includes("secondary"))
      expect(isActive).toBeTruthy()
    }).toPass({ timeout: 5000 })
  })

  test("SMA 50 indicator toggle activates overlay", async ({ page }) => {
    await page.goto("/services/trading/overview")
    await page.waitForLoadState("networkidle")

    const sma50Btn = page.getByRole("button", { name: "SMA 50" })
    await expect(sma50Btn).toBeVisible({ timeout: 10000 })

    await sma50Btn.click()

    await expect(async () => {
      const style = await sma50Btn.getAttribute("style")
      const className = await sma50Btn.getAttribute("class")
      const isActive =
        (style && style.includes("border-bottom")) ||
        (className && className.includes("secondary"))
      expect(isActive).toBeTruthy()
    }).toPass({ timeout: 5000 })
  })

  test("toggling indicator off removes overlay", async ({ page }) => {
    await page.goto("/services/trading/overview")
    await page.waitForLoadState("networkidle")

    const sma20Btn = page.getByRole("button", { name: "SMA 20" })
    await expect(sma20Btn).toBeVisible({ timeout: 10000 })

    // Activate
    await sma20Btn.click()

    await expect(async () => {
      const style = await sma20Btn.getAttribute("style")
      expect(style).toContain("border-bottom")
    }).toPass({ timeout: 5000 })

    // Deactivate
    await sma20Btn.click()

    // Button should revert to ghost (no border-bottom style)
    await expect(async () => {
      const style = await sma20Btn.getAttribute("style")
      const hasNoBorder = !style || !style.includes("border-bottom")
      expect(hasNoBorder).toBeTruthy()
    }).toPass({ timeout: 5000 })
  })
})
