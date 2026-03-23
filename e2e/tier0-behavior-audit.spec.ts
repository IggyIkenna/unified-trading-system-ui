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
  const personaCard = page.locator('[data-testid="persona-card"], button:has-text("admin@odum"), button:has-text("Admin")')
  if (await personaCard.count() > 0) {
    await personaCard.first().click()
    await page.waitForTimeout(500)
  }
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
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})

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
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
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

    const main = page.locator('main')
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
})
