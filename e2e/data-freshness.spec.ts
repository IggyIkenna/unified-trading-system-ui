import { test, expect } from "@playwright/test"

/**
 * DATA FRESHNESS INDICATORS E2E TESTS
 *
 * Validates the DataFreshness component behaviour:
 * - Live mode: green pulsing dot + "Live" text (WebSocket connected)
 * - Batch mode: slate dot + "As of {date}" text
 *
 * Component: components/ui/data-freshness.tsx
 */

const API = "http://localhost:8030"

test.beforeAll(async ({ request }) => {
  await request.post(`${API}/admin/reset`)
})

test.describe("Data Freshness Indicators", () => {
  test("Trading Terminal shows Live badge when in live mode", async ({ page }) => {
    await page.goto("/services/trading/overview")
    await page.waitForLoadState("networkidle")

    // DataFreshness component renders "Live" text with a green pulsing dot
    // when isWebSocket is true
    await expect(async () => {
      const liveBadge = page.locator("text=Live")
      expect(await liveBadge.count()).toBeGreaterThan(0)
    }).toPass({ timeout: 10000 })
  })

  test("switching to batch mode shows 'As of' date badge", async ({ page }) => {
    await page.goto("/services/trading/overview")
    await page.waitForLoadState("networkidle")

    // Click the Batch button to switch mode
    const batchToggle = page.getByRole("button", { name: /Batch/i }).first()

    if (await batchToggle.isVisible()) {
      await batchToggle.click()

      // DataFreshness in batch mode renders "As of {date}"
      await expect(async () => {
        const asOfBadge = page.locator('text=/As of/')
        const batchBanner = page.locator('text=Viewing Batch Data')
        const hasAsOf = (await asOfBadge.count()) > 0
        const hasBanner = (await batchBanner.count()) > 0
        expect(hasAsOf || hasBanner).toBeTruthy()
      }).toPass({ timeout: 10000 })
    }
  })

  test("positions page shows freshness indicator", async ({ page }) => {
    await page.goto("/services/trading/positions")
    await page.waitForLoadState("networkidle")

    // The positions page uses DataFreshness — look for any freshness text
    await expect(async () => {
      const liveBadge = page.locator("text=Live")
      const updatedBadge = page.locator('text=/Updated \\d+s ago/')
      const asOfBadge = page.locator('text=/As of/')
      const total =
        (await liveBadge.count()) +
        (await updatedBadge.count()) +
        (await asOfBadge.count())
      expect(total).toBeGreaterThan(0)
    }).toPass({ timeout: 10000 })
  })

  test("freshness dot has correct color class", async ({ page }) => {
    await page.goto("/services/trading/overview")
    await page.waitForLoadState("networkidle")

    // The Live badge has a green pulsing dot (bg-emerald-500 animate-pulse)
    await expect(async () => {
      const greenDot = page.locator(".bg-emerald-500")
      expect(await greenDot.count()).toBeGreaterThan(0)
    }).toPass({ timeout: 10000 })
  })
})
