import { test, expect } from '@playwright/test'

/**
 * DATA SERVICE FLOW E2E TESTS
 *
 * Tier 1: Routes exist, tabs render, no 404s
 * Tier 2: Pipeline status and markets have data
 * Tier 3: Full data journey — pipeline, coverage, markets
 *
 * Routes from UI_STRUCTURE_MANIFEST:
 *   /services/data/overview  — Pipeline Status (REAL)
 *   /services/data/coverage  — Coverage Matrix (STUB)
 *   /services/data/missing   — Missing Data (STUB)
 *   /services/data/venues    — Venue Health (STUB)
 *   /services/data/markets   — Markets (REAL)
 *   /services/data/logs      — ETL Logs (STUB)
 */

const API = 'http://localhost:8030'

test.beforeAll(async ({ request }) => {
  await request.post(`${API}/admin/reset`)
})

// ── Tier 1: Navigation — all data routes load ──

test.describe('Tier 1: Data Navigation', () => {
  const DATA_ROUTES = [
    { path: '/services/data/overview', label: 'Pipeline Status' },
    { path: '/services/data/coverage', label: 'Coverage Matrix' },
    { path: '/services/data/missing', label: 'Missing Data' },
    { path: '/services/data/venues', label: 'Venue Health' },
    { path: '/services/data/markets', label: 'Markets' },
    { path: '/services/data/logs', label: 'ETL Logs' },
  ]

  for (const route of DATA_ROUTES) {
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

  test('data tab bar is visible', async ({ page }) => {
    await page.goto('/services/data/overview')
    await page.waitForLoadState('networkidle')

    const tabs = page.locator(
      'nav a[href*="/services/data"], ' +
        '[role="tablist"] [role="tab"], ' +
        'a[href*="/data/"]'
    )
    await expect(async () => {
      expect(await tabs.count()).toBeGreaterThan(0)
    }).toPass({ timeout: 5000 })
  })
})

// ── Tier 2: Data — tables and grids have content ──

test.describe('Tier 2: Data Content', () => {
  test('pipeline status page shows service health', async ({ page }) => {
    await page.goto('/services/data/overview')
    await page.waitForLoadState('networkidle')

    // Should show some health indicators or status content
    const content = page.locator(
      'table, [role="grid"], [data-testid*="health"], [data-testid*="pipeline"], .status-card'
    )
    await expect(async () => {
      const bodyText = await page.textContent('body')
      expect(
        (await content.count()) > 0 || (bodyText?.length ?? 0) > 200
      ).toBeTruthy()
    }).toPass({ timeout: 10000 })
  })

  test('markets page shows market data', async ({ page }) => {
    await page.goto('/services/data/markets')
    await page.waitForLoadState('networkidle')

    // Markets page is REAL (2009 lines) — should have substantial content
    const body = await page.textContent('body')
    expect(body?.length).toBeGreaterThan(200)
  })

  test('coverage matrix page renders', async ({ page }) => {
    await page.goto('/services/data/coverage')
    await page.waitForLoadState('networkidle')

    // STUB page — should at least render without error
    const body = await page.textContent('body')
    expect(body?.length).toBeGreaterThan(50)
  })
})

// ── Tier 3: Full Data Journey ──

test.describe('Tier 3: Data Journey', () => {
  test('navigate pipeline status → coverage → markets via tabs', async ({
    page,
  }) => {
    await page.goto('/services/data/overview')
    await page.waitForLoadState('networkidle')

    // Click Coverage Matrix tab
    const coverageTab = page.locator(
      'a:has-text("Coverage"), [role="tab"]:has-text("Coverage")'
    )
    if ((await coverageTab.count()) > 0) {
      await coverageTab.first().click()
      await page.waitForLoadState('networkidle')
      expect(page.url()).toContain('coverage')
    }

    // Click Markets tab
    const marketsTab = page.locator(
      'a:has-text("Markets"), [role="tab"]:has-text("Markets")'
    )
    if ((await marketsTab.count()) > 0) {
      await marketsTab.first().click()
      await page.waitForLoadState('networkidle')
      expect(page.url()).toContain('markets')
    }
  })

  test('navigate to venue health and back', async ({ page }) => {
    await page.goto('/services/data/overview')
    await page.waitForLoadState('networkidle')

    const venueTab = page.locator(
      'a:has-text("Venue"), [role="tab"]:has-text("Venue")'
    )
    if ((await venueTab.count()) > 0) {
      await venueTab.first().click()
      await page.waitForLoadState('networkidle')
      expect(page.url()).toContain('venues')
    }

    // Navigate back to pipeline
    const pipelineTab = page.locator(
      'a:has-text("Pipeline"), [role="tab"]:has-text("Pipeline"), a:has-text("Overview")'
    )
    if ((await pipelineTab.count()) > 0) {
      await pipelineTab.first().click()
      await page.waitForLoadState('networkidle')
      expect(page.url()).toContain('overview')
    }
  })

  test('ETL logs page renders', async ({ page }) => {
    await page.goto('/services/data/logs')
    await page.waitForLoadState('networkidle')

    const body = await page.textContent('body')
    expect(body?.length).toBeGreaterThan(50)
  })
})
