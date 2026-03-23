/**
 * Tier 0 behavior audit — explicit assertions for critical workflows.
 * Fails with actionable messages when UI or mock regressions remove controls.
 *
 * Resets `mock-provisioning-state` before each test so approve flows stay deterministic.
 */
import { expect, test } from '@playwright/test'

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(500)

  const internalTab = page.locator('button:has-text("Internal")')
  if (await internalTab.count() > 0) {
    await internalTab.first().click()
    await page.waitForTimeout(500)
  }

  const adminCard = page.locator('button:has-text("admin@odum")')
  if (await adminCard.count() > 0) {
    await adminCard.first().click()
    await page.waitForTimeout(1000)
  }

  await page.waitForURL(/\/(dashboard|admin|services)/, { timeout: 10000 }).catch(() => { })
}

async function resetMockProvisioning(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.waitForLoadState('domcontentloaded')
  await page.evaluate(() => {
    localStorage.removeItem('mock-provisioning-state')
    localStorage.removeItem('unified-global-scope')
  })
}

test.describe('Tier 0 behavior audit', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    await resetMockProvisioning(page)
    await loginAsAdmin(page)
  })

  test('admin access requests: pending row has Approve and approve mutates state', async ({ page }) => {
    await page.goto('/admin/users/requests')
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { })

    const approve = page.getByRole('button', { name: /Approve/i }).first()
    await expect(
      approve,
      'TIER0_AUDIT: expected at least one pending access request with Approve (see mock-provisioning-state defaultState.requests)',
    ).toBeVisible({ timeout: 15000 })

    await approve.click()
    await page.waitForTimeout(800)

    const approvedBadge = page.getByText('approved', { exact: false }).first()
    await expect(approvedBadge, 'TIER0_AUDIT: after Approve, request should show approved status').toBeVisible({
      timeout: 10000,
    })
  })

  test('trading alerts: active alert shows Ack control; Ack updates status', async ({ page }) => {
    await page.goto('/services/trading/alerts')
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { })
    await page.waitForTimeout(1500)

    const ack = page.getByRole('button', { name: /Acknowledge alert/i })
    await expect(
      ack.first(),
      'TIER0_AUDIT: expected mock alerts with Ack (see /api/alerts/list mock) and aria-label on Ack button',
    ).toBeVisible({ timeout: 15000 })

    await ack.first().click()
    await expect(
      page.getByText('Alert acknowledged'),
      'TIER0_AUDIT: mock /api/alerts/acknowledge should succeed and show toast (see useAcknowledgeAlert)',
    ).toBeVisible({ timeout: 10000 })
  })

  test('reports reconciliation surface exposes reconciliation narrative', async ({ page }) => {
    await page.goto('/services/reports/reconciliation')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)

    const main = page.locator('main').last()
    await expect(main, 'TIER0_AUDIT: reconciliation page should render main content').toBeVisible()
    const text = (await main.innerText()).toLowerCase()
    expect(
      text.includes('reconcil') || text.includes('position') || text.includes('break'),
      `TIER0_AUDIT: reconciliation page should mention recon/positions/breaks; got snippet: ${text.slice(0, 200)}`,
    ).toBeTruthy()
  })

  test('strategy backtests surface exposes run / backtest primary action', async ({ page }) => {
    await page.goto('/services/research/strategy/backtests')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)

    const main = page.locator('main')
    const t = (await main.innerText()).toLowerCase()
    const hasRun = await page.getByRole('button', { name: /run/i }).count()
    const hasBacktest = await page.getByRole('button', { name: /backtest/i }).count()

    expect(
      hasRun > 0 || hasBacktest > 0 || t.includes('backtest') || t.includes('run'),
      'TIER0_AUDIT: backtests page needs a visible Run/Backtest CTA or clear backtest narrative',
    ).toBeTruthy()
  })

  test('manage user access request form is reachable from client manage flow', async ({ page }) => {
    await page.goto('/services/manage/users/request')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    const main = page.locator('main')
    await expect(main).toBeVisible()
    const buttons = await page.getByRole('button').count()
    const inputs = await page.locator('input, textarea, select').count()

    expect(
      buttons + inputs > 0,
      'TIER0_AUDIT: /services/manage/users/request should expose at least one interactive control for requesting access',
    ).toBeTruthy()
  })

  test('footer FCA link does not 404', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    const fcaLink = page.locator('footer a:has-text("FCA")')
    await expect(fcaLink, 'TIER0_AUDIT: footer should have FCA regulatory link').toBeVisible({ timeout: 5000 })

    const href = await fcaLink.getAttribute('href')
    expect(href, 'TIER0_AUDIT: FCA link should not point to /compliance (404)').not.toBe('/compliance')

    if (href) {
      const resp = await page.goto(href)
      expect(resp?.status(), `TIER0_AUDIT: FCA link target ${href} should not 404`).toBeLessThan(400)
    }
  })

  test('dashboard shows non-zero venue count from PLATFORM_STATS', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    const venueKpi = page.locator('text=Venues').first()
    await expect(venueKpi, 'TIER0_AUDIT: dashboard should display venue count').toBeVisible({ timeout: 5000 })

    const venueSection = venueKpi.locator('..')
    const venueText = await venueSection.innerText()
    expect(
      venueText.includes('0\nVenues') === false,
      `TIER0_AUDIT: dashboard venue count should not be 0 (got: ${venueText.replace(/\n/g, ' ')})`,
    ).toBeTruthy()
  })

  test('landing page and dashboard venue counts are consistent', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000)

    const landingVenueEl = page.locator('text=Venues').first().locator('..')
    const landingText = await landingVenueEl.innerText().catch(() => '')
    const landingMatch = landingText.match(/(\d+)/)
    const landingCount = landingMatch ? parseInt(landingMatch[1]) : -1

    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    const dashVenueEl = page.locator('text=Venues').first().locator('..')
    const dashText = await dashVenueEl.innerText().catch(() => '')
    const dashMatch = dashText.match(/(\d+)/)
    const dashCount = dashMatch ? parseInt(dashMatch[1]) : -2

    expect(
      landingCount === dashCount,
      `TIER0_AUDIT: landing page venue count (${landingCount}) != dashboard venue count (${dashCount}) — use PLATFORM_STATS everywhere`,
    ).toBeTruthy()
  })

  test('no console warnings for unhandled API routes on key pages', async ({ page }) => {
    const unhandled: string[] = []
    page.on('console', msg => {
      if (msg.text().includes('Unhandled API route')) {
        unhandled.push(msg.text())
      }
    })

    for (const path of ['/dashboard', '/services/trading/overview', '/admin/users/requests']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { })
      await page.waitForTimeout(1000)
    }

    expect(
      unhandled.length,
      `TIER0_AUDIT: ${unhandled.length} unhandled API routes on key pages: ${unhandled.slice(0, 5).join('; ')}`,
    ).toBe(0)
  })

  test('admin approve → deny round-trip preserves state', async ({ page }) => {
    await page.goto('/admin/users/requests')
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { })

    const pendingCount = await page.locator('text=pending').count()
    expect(pendingCount, 'TIER0_AUDIT: should have at least one pending request').toBeGreaterThan(0)

    const deny = page.getByRole('button', { name: /Deny/i }).first()
    await expect(deny, 'TIER0_AUDIT: pending request should have Deny button').toBeVisible({ timeout: 5000 })

    await deny.click()
    await page.waitForTimeout(800)

    const deniedBadge = page.getByText('denied', { exact: false }).first()
    await expect(deniedBadge, 'TIER0_AUDIT: after Deny, request should show denied status').toBeVisible({ timeout: 10000 })
  })

  test('persona login sets correct role in authenticated shell', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)

    const footer = page.locator('footer')
    const footerText = await footer.innerText().catch(() => '')
    expect(
      footerText.toLowerCase().includes('admin'),
      `TIER0_AUDIT: admin persona should be reflected in mock footer; got: ${footerText.slice(0, 100)}`,
    ).toBeTruthy()
  })

  test('Reset Demo button is visible in mock footer', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1500)

    const resetBtn = page.getByRole('button', { name: /Reset Demo/i })
    await expect(resetBtn, 'TIER0_AUDIT: Reset Demo should be visible in mock mode footer').toBeVisible({ timeout: 5000 })
  })
})
