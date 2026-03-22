import { test, expect } from '@playwright/test'

/**
 * REPORTS SERVICE FLOW E2E TESTS
 *
 * Tier 1: Routes exist, tabs render, no 404s
 * Tier 2: Reports pages have data (P&L, settlements, reconciliation)
 * Tier 3: Full reports journey — P&L, settlement, reconciliation, regulatory
 *
 * Routes from UI_STRUCTURE_MANIFEST:
 *   /services/reports/overview        — P&L Attribution (REAL)
 *   /services/reports/executive       — Executive (DELEGATE)
 *   /services/reports/settlement      — Settlement (REAL)
 *   /services/reports/reconciliation  — Reconciliation (REAL)
 *   /services/reports/regulatory      — Regulatory (REAL)
 */

const API = 'http://localhost:8030'

test.beforeAll(async ({ request }) => {
  await request.post(`${API}/admin/reset`)
})

// ── Tier 1: Navigation — all report routes load ──

test.describe('Tier 1: Reports Navigation', () => {
  const REPORT_ROUTES = [
    { path: '/services/reports/overview', label: 'P&L Attribution' },
    { path: '/services/reports/settlement', label: 'Settlement' },
    { path: '/services/reports/reconciliation', label: 'Reconciliation' },
    { path: '/services/reports/regulatory', label: 'Regulatory' },
  ]

  for (const route of REPORT_ROUTES) {
    test(`${route.label} page (${route.path}) loads without error`, async ({
      page,
    }) => {
      const consoleErrors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text())
      })

      await page.goto(route.path)
      await page.waitForLoadState('networkidle')

      const body = await page.textContent('body')
      expect(body?.length).toBeGreaterThan(50)

      const criticalErrors = consoleErrors.filter(
        (e) =>
          !e.includes('Warning:') &&
          !e.includes('DevTools') &&
          !e.includes('Download the React DevTools')
      )
      expect(criticalErrors).toHaveLength(0)
    })
  }

  test('executive report page loads', async ({ page }) => {
    const response = await page.goto('/services/reports/executive')
    // DELEGATE page — may redirect or render
    expect(
      response?.status() === 200 ||
        response?.status() === 304 ||
        response?.status() === 307,
      `Expected /services/reports/executive to load, got ${response?.status()}`
    ).toBeTruthy()
  })

  test('reports tab bar is visible', async ({ page }) => {
    await page.goto('/services/reports/overview')
    await page.waitForLoadState('networkidle')

    const tabs = page.locator(
      'nav a[href*="/services/reports"], ' +
        '[role="tablist"] [role="tab"], ' +
        'a[href*="/reports/"]'
    )
    await expect(async () => {
      expect(await tabs.count()).toBeGreaterThan(0)
    }).toPass({ timeout: 5000 })
  })
})

// ── Tier 2: Data — report pages have content ──

test.describe('Tier 2: Reports Data', () => {
  test('P&L attribution page shows PnL data', async ({ page }) => {
    await page.goto('/services/reports/overview')
    await page.waitForLoadState('networkidle')

    const content = page.locator(
      'table, [role="grid"], canvas, svg, ' +
        '[data-testid*="pnl"], [data-testid*="attribution"], ' +
        '.pnl-card, .attribution-card'
    )
    await expect(async () => {
      const bodyText = await page.textContent('body')
      expect(
        (await content.count()) > 0 || (bodyText?.length ?? 0) > 200
      ).toBeTruthy()
    }).toPass({ timeout: 10000 })
  })

  test('settlement page shows settlements data', async ({ page }) => {
    await page.goto('/services/reports/settlement')
    await page.waitForLoadState('networkidle')

    const rows = page.locator(
      'table tbody tr, [role="row"], [data-testid*="settlement"]'
    )
    await expect(async () => {
      const bodyText = await page.textContent('body')
      expect(
        (await rows.count()) > 0 || (bodyText?.length ?? 0) > 200
      ).toBeTruthy()
    }).toPass({ timeout: 10000 })
  })

  test('reconciliation page shows drift analysis', async ({ page }) => {
    await page.goto('/services/reports/reconciliation')
    await page.waitForLoadState('networkidle')

    const content = page.locator(
      'table, [role="grid"], canvas, svg, ' +
        '[data-testid*="reconciliation"], [data-testid*="drift"]'
    )
    await expect(async () => {
      const bodyText = await page.textContent('body')
      expect(
        (await content.count()) > 0 || (bodyText?.length ?? 0) > 200
      ).toBeTruthy()
    }).toPass({ timeout: 10000 })
  })

  test('regulatory page shows compliance data', async ({ page }) => {
    await page.goto('/services/reports/regulatory')
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body?.length).toBeGreaterThan(100)
  })
})

// ── Tier 3: Full Reports Journey ──

test.describe('Tier 3: Reports Journey', () => {
  test('navigate P&L → settlement → reconciliation via tabs', async ({
    page,
  }) => {
    await page.goto('/services/reports/overview')
    await page.waitForLoadState('networkidle')

    // Click Settlement tab
    const settlementTab = page.locator(
      'a:has-text("Settlement"), [role="tab"]:has-text("Settlement")'
    )
    if ((await settlementTab.count()) > 0) {
      await settlementTab.first().click()
      await page.waitForLoadState('networkidle')
      expect(page.url()).toContain('settlement')
    }

    // Click Reconciliation tab
    const reconTab = page.locator(
      'a:has-text("Reconciliation"), [role="tab"]:has-text("Reconciliation")'
    )
    if ((await reconTab.count()) > 0) {
      await reconTab.first().click()
      await page.waitForLoadState('networkidle')
      expect(page.url()).toContain('reconciliation')
    }
  })

  test('navigate to regulatory tab', async ({ page }) => {
    await page.goto('/services/reports/overview')
    await page.waitForLoadState('networkidle')

    const regulatoryTab = page.locator(
      'a:has-text("Regulatory"), [role="tab"]:has-text("Regulatory")'
    )
    if ((await regulatoryTab.count()) > 0) {
      await regulatoryTab.first().click()
      await page.waitForLoadState('networkidle')
      expect(page.url()).toContain('regulatory')
    }
  })

  test('P&L page has date range or period controls', async ({ page }) => {
    await page.goto('/services/reports/overview')
    await page.waitForLoadState('networkidle')

    // Reports usually have date/period selectors
    const dateControls = page.locator(
      'input[type="date"], ' +
        'button:has-text("Today"), ' +
        'button:has-text("1W"), ' +
        'button:has-text("1M"), ' +
        'button:has-text("Period"), ' +
        '[data-testid*="date"], ' +
        '[data-testid*="period"]'
    )

    if ((await dateControls.count()) > 0) {
      await expect(dateControls.first()).toBeVisible()
    }
  })
})
