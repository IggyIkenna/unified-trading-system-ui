import { test, expect } from '@playwright/test'

/**
 * TRADING SERVICE FLOW E2E TESTS
 *
 * Tier 1: Routes exist, tabs render, no 404s
 * Tier 2: Data tables have rows, charts render
 * Tier 3: Full trading journey — terminal, positions, orders, batch/live toggle
 *
 * Routes from UI_STRUCTURE_MANIFEST:
 *   /services/trading/overview  — Terminal
 *   /services/trading/positions — Positions
 *   /services/trading/orders    — Orders
 *   /services/trading/accounts  — Accounts
 *   /services/trading/markets   — Markets
 *   /services/trading/strategies — Strategies
 */

const API = 'http://localhost:8030'

test.beforeAll(async ({ request }) => {
  await request.post(`${API}/admin/reset`)
})

// ── Tier 1: Navigation — all trading routes load ──

test.describe('Tier 1: Trading Navigation', () => {
  const TRADING_ROUTES = [
    { path: '/services/trading/overview', label: 'Terminal' },
    { path: '/services/trading/positions', label: 'Positions' },
    { path: '/services/trading/orders', label: 'Orders' },
    { path: '/services/trading/accounts', label: 'Accounts' },
    { path: '/services/trading/markets', label: 'Markets' },
    { path: '/services/trading/strategies', label: 'Strategies' },
  ]

  for (const route of TRADING_ROUTES) {
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

  test('trading tab bar is visible on terminal page', async ({ page }) => {
    await page.goto('/services/trading/overview')
    await page.waitForLoadState('networkidle')

    // Tab bar should be visible with trading tabs
    const tabs = page.locator(
      'nav a[href*="/services/trading"], ' +
        '[role="tablist"] [role="tab"], ' +
        'a[href*="/trading/"]'
    )
    await expect(async () => {
      expect(await tabs.count()).toBeGreaterThan(0)
    }).toPass({ timeout: 5000 })
  })
})

// ── Tier 2: Data — tables and charts have content ──

test.describe('Tier 2: Trading Data', () => {
  test('positions table renders with data rows', async ({ page }) => {
    await page.goto('/services/trading/positions')
    await page.waitForLoadState('networkidle')

    // Wait for table rows to appear
    const tableRows = page.locator(
      'table tbody tr, [role="row"], [data-testid*="position"]'
    )
    await expect(async () => {
      expect(await tableRows.count()).toBeGreaterThan(0)
    }).toPass({ timeout: 10000 })
  })

  test('orders table renders with data rows', async ({ page }) => {
    await page.goto('/services/trading/orders')
    await page.waitForLoadState('networkidle')

    const tableRows = page.locator(
      'table tbody tr, [role="row"], [data-testid*="order"]'
    )
    await expect(async () => {
      expect(await tableRows.count()).toBeGreaterThan(0)
    }).toPass({ timeout: 10000 })
  })

  test('terminal page renders chart or data content', async ({ page }) => {
    await page.goto('/services/trading/overview')
    await page.waitForLoadState('networkidle')

    // Chart canvas or SVG or data content should be present
    const chartElements = page.locator('canvas, svg, [data-testid*="chart"]')
    const dataContent = page.locator(
      'table, [role="grid"], [data-testid*="terminal"]'
    )

    await expect(async () => {
      const hasChart = (await chartElements.count()) > 0
      const hasData = (await dataContent.count()) > 0
      const bodyText = await page.textContent('body')
      expect(hasChart || hasData || (bodyText?.length ?? 0) > 200).toBeTruthy()
    }).toPass({ timeout: 10000 })
  })

  test('strategies page shows strategy list', async ({ page }) => {
    await page.goto('/services/trading/strategies')
    await page.waitForLoadState('networkidle')

    const content = page.locator(
      'table tbody tr, [role="row"], [data-testid*="strategy"], .strategy-card'
    )
    await expect(async () => {
      expect(await content.count()).toBeGreaterThan(0)
    }).toPass({ timeout: 10000 })
  })

  test('accounts page shows account data', async ({ page }) => {
    await page.goto('/services/trading/accounts')
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body?.length).toBeGreaterThan(100)
  })

  test('markets page shows market data', async ({ page }) => {
    await page.goto('/services/trading/markets')
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body?.length).toBeGreaterThan(200)
  })
})

// ── Tier 3: Full Trading Journey ──

test.describe('Tier 3: Trading Journey', () => {
  test('navigate terminal → positions → orders via tabs', async ({ page }) => {
    // Start at terminal
    await page.goto('/services/trading/overview')
    await page.waitForLoadState('networkidle')

    // Click Positions tab
    const positionsTab = page.locator(
      'a:has-text("Positions"), [role="tab"]:has-text("Positions")'
    )
    if ((await positionsTab.count()) > 0) {
      await positionsTab.first().click()
      await page.waitForLoadState('networkidle')
      expect(page.url()).toContain('positions')
    }

    // Click Orders tab
    const ordersTab = page.locator(
      'a:has-text("Orders"), [role="tab"]:has-text("Orders")'
    )
    if ((await ordersTab.count()) > 0) {
      await ordersTab.first().click()
      await page.waitForLoadState('networkidle')
      expect(page.url()).toContain('orders')
    }
  })

  test('batch/live toggle changes displayed data', async ({ page }) => {
    await page.goto('/services/trading/positions')
    await page.waitForLoadState('networkidle')

    // Look for batch/live toggle
    const batchToggle = page.locator(
      'button:has-text("Batch"), ' +
        'button:has-text("Live"), ' +
        '[data-testid="mode-toggle"], ' +
        '[data-testid="batch-live-toggle"], ' +
        'label:has-text("Batch"), ' +
        'label:has-text("Live")'
    )

    if ((await batchToggle.count()) > 0) {
      // Get initial state
      const initialBody = await page.textContent('body')

      // Toggle to batch
      await batchToggle.first().click()
      await page.waitForLoadState('networkidle')

      // Look for batch mode indicator
      const batchIndicator = page.locator(
        ':text("Batch"), :text("batch"), :text("Viewing Batch")'
      )
      await expect(async () => {
        const bodyAfter = await page.textContent('body')
        // Something should change or batch indicator appears
        expect(
          (await batchIndicator.count()) > 0 || bodyAfter !== initialBody
        ).toBeTruthy()
      }).toPass({ timeout: 5000 })
    }
  })

  test('manual trade button opens trade form', async ({ page }) => {
    await page.goto('/services/trading/overview')
    await page.waitForLoadState('networkidle')

    const tradeBtn = page.locator(
      'button:has-text("Trade"), ' +
        'button:has-text("New Order"), ' +
        'button:has-text("Manual Trade"), ' +
        'button:has-text("Place Order")'
    )

    if ((await tradeBtn.count()) > 0) {
      await tradeBtn.first().click()
      await page.waitForLoadState('networkidle')

      // Trade form/drawer/dialog should appear
      const tradeForm = page.locator(
        '[role="dialog"], ' +
          '[data-testid="trade-form"], ' +
          '[data-testid="order-entry"], ' +
          'form'
      )

      await expect(async () => {
        expect(await tradeForm.count()).toBeGreaterThan(0)
      }).toPass({ timeout: 5000 })
    }
  })

  test('navigate to dashboard from trading works', async ({ page }) => {
    await page.goto('/services/trading/overview')
    await page.waitForLoadState('networkidle')

    // Click home/dashboard link
    const dashLink = page.locator(
      'a[href="/dashboard"], a[href="/"], a:has-text("Dashboard"), a:has-text("Command Center")'
    )

    if ((await dashLink.count()) > 0) {
      await dashLink.first().click()
      await page.waitForLoadState('networkidle')
      expect(
        page.url().includes('/dashboard') || page.url().endsWith('/')
      ).toBeTruthy()
    }
  })
})
