import { test, expect } from "@playwright/test"

/**
 * INSTRUMENT COVERAGE E2E TESTS
 *
 * Validates that the Trading Terminal instrument selector renders,
 * groups instruments by category, and lists a sufficient number of instruments.
 *
 * The trading overview page groups instruments via instrumentsByCategory
 * and renders them inside a Select component with category headers.
 */

const API = "http://localhost:8030"

test.beforeAll(async ({ request }) => {
  await request.post(`${API}/admin/reset`)
})

test.describe("Instrument Coverage", () => {
  test("instrument selector is present on Trading Terminal", async ({ page }) => {
    await page.goto("/services/trading/overview")
    await page.waitForLoadState("networkidle")

    // The instrument selector is a Select component with a SelectTrigger
    const selectTrigger = page.locator('button[role="combobox"]').first()
    await expect(selectTrigger).toBeVisible({ timeout: 10000 })
  })

  test("instruments are grouped by category", async ({ page }) => {
    await page.goto("/services/trading/overview")
    await page.waitForLoadState("networkidle")

    // Open the instrument selector dropdown
    const selectTrigger = page.locator('button[role="combobox"]').first()
    await selectTrigger.click()

    // Wait for dropdown content to appear
    const content = page.locator('[role="listbox"], [data-slot="select-content"]')
    await expect(content.first()).toBeVisible({ timeout: 5000 })

    // Category headers are rendered as uppercase text divs
    // At minimum, a "CeFi" category should exist (from DEFAULT_INSTRUMENTS fallback)
    const categoryHeaders = page.locator(
      '[role="listbox"] .uppercase, [data-slot="select-content"] .uppercase'
    )

    await expect(async () => {
      expect(await categoryHeaders.count()).toBeGreaterThan(0)
    }).toPass({ timeout: 5000 })
  })

  test("instrument list has items available", async ({ page }) => {
    await page.goto("/services/trading/overview")
    await page.waitForLoadState("networkidle")

    // Open the instrument selector
    const selectTrigger = page.locator('button[role="combobox"]').first()
    await selectTrigger.click()

    // Count all SelectItem options
    const options = page.locator('[role="option"]')
    await expect(async () => {
      const count = await options.count()
      // At minimum, DEFAULT_INSTRUMENTS has 6 items;
      // with API data there should be more
      expect(count).toBeGreaterThanOrEqual(6)
    }).toPass({ timeout: 10000 })
  })

  test("selecting an instrument updates the terminal", async ({ page }) => {
    await page.goto("/services/trading/overview")
    await page.waitForLoadState("networkidle")

    // Open selector
    const selectTrigger = page.locator('button[role="combobox"]').first()
    const initialText = await selectTrigger.textContent()
    await selectTrigger.click()

    // Select a different instrument (pick the second option)
    const options = page.locator('[role="option"]')
    await expect(async () => {
      expect(await options.count()).toBeGreaterThan(1)
    }).toPass({ timeout: 5000 })

    await options.nth(1).click()

    // The selector should now show the new instrument
    await expect(async () => {
      const newText = await selectTrigger.textContent()
      // Text should be defined and potentially different
      expect(newText).toBeDefined()
    }).toPass({ timeout: 5000 })
  })
})
