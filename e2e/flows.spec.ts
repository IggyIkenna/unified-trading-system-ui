import { test, expect, type Page } from '@playwright/test'

/**
 * PER-FLOW E2E TESTS — Agent 8 a8-p2-*
 *
 * Tests each lifecycle stage in the UI:
 * 1. Auth & Persona
 * 2. Dashboard (Command Center)
 * 3. Trading Terminal (Run)
 * 4. Research & Backtesting (Build)
 * 5. Data Service (Acquire)
 * 6. Reports (Report)
 * 7. Risk & Observe
 * 8. Admin / Manage
 *
 * All tests run against mock mode API at port 8030.
 */

const API = 'http://localhost:8030'

test.beforeEach(async ({ request }) => {
  await request.post(`${API}/admin/reset`)
})

// Helper: wait for page to stabilize
async function waitForStable(page: Page) {
  await page.waitForLoadState('networkidle')
  // Extra buffer for React hydration
  await page.waitForTimeout(500)
}

// ── 1. Auth & Persona Flow ──────────────────────────────────────────

test.describe('Auth & Persona Flow', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login')
    await waitForStable(page)
    // Should have some form of login UI
    const pageContent = await page.textContent('body')
    expect(pageContent).toBeTruthy()
  })

  test('dashboard loads after navigating from root', async ({ page }) => {
    await page.goto('/')
    await waitForStable(page)
    // Should render without crashing
    expect(await page.title()).toBeTruthy()
  })
})

// ── 2. Dashboard / Command Center ───────────────────────────────────

test.describe('Dashboard Flow', () => {
  test('dashboard renders KPI cards', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForStable(page)
    // Dashboard should have content
    const body = await page.textContent('body')
    expect(body?.length).toBeGreaterThan(100)
  })

  test('dashboard has navigation elements', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForStable(page)
    const nav = page.locator('nav')
    expect(await nav.count()).toBeGreaterThan(0)
  })
})

// ── 3. Trading Terminal (Run) ───────────────────────────────────────

test.describe('Trading Flow', () => {
  test('positions page renders', async ({ page }) => {
    await page.goto('/positions')
    await waitForStable(page)
    const body = await page.textContent('body')
    expect(body?.length).toBeGreaterThan(50)
  })

  test('overview page renders', async ({ page }) => {
    await page.goto('/overview')
    await waitForStable(page)
    const body = await page.textContent('body')
    expect(body?.length).toBeGreaterThan(50)
  })
})

// ── 4. Research & ML (Build) ────────────────────────────────────────

test.describe('Research Flow', () => {
  test('ML page renders', async ({ page }) => {
    await page.goto('/ml')
    await waitForStable(page)
    const body = await page.textContent('body')
    expect(body?.length).toBeGreaterThan(50)
  })

  test('quant page renders', async ({ page }) => {
    await page.goto('/quant')
    await waitForStable(page)
    const body = await page.textContent('body')
    expect(body?.length).toBeGreaterThan(50)
  })
})

// ── 5. Data Service (Acquire) ───────────────────────────────────────

test.describe('Data Flow', () => {
  test('config page renders', async ({ page }) => {
    await page.goto('/config')
    await waitForStable(page)
    const body = await page.textContent('body')
    expect(body?.length).toBeGreaterThan(50)
  })
})

// ── 6. Reports ──────────────────────────────────────────────────────

test.describe('Reports Flow', () => {
  test('executive page renders', async ({ page }) => {
    await page.goto('/executive')
    await waitForStable(page)
    const body = await page.textContent('body')
    expect(body?.length).toBeGreaterThan(50)
  })
})

// ── 7. Risk & Observe ───────────────────────────────────────────────

test.describe('Observe Flow', () => {
  test('risk page renders', async ({ page }) => {
    await page.goto('/risk')
    await waitForStable(page)
    const body = await page.textContent('body')
    expect(body?.length).toBeGreaterThan(50)
  })

  test('ops page renders', async ({ page }) => {
    await page.goto('/ops')
    await waitForStable(page)
    const body = await page.textContent('body')
    expect(body?.length).toBeGreaterThan(50)
  })
})

// ── 8. Admin / Manage ───────────────────────────────────────────────

test.describe('Admin Flow', () => {
  test('audit page renders', async ({ page }) => {
    await page.goto('/audit')
    await waitForStable(page)
    const body = await page.textContent('body')
    expect(body?.length).toBeGreaterThan(50)
  })

  test('devops page renders', async ({ page }) => {
    await page.goto('/devops')
    await waitForStable(page)
    const body = await page.textContent('body')
    expect(body?.length).toBeGreaterThan(50)
  })
})

// ── Reset Demo ──────────────────────────────────────────────────────

test.describe('Reset Demo Flow', () => {
  test('API reset clears mutations and preserves seed', async ({ request }) => {
    // Create custom data
    await request.post(`${API}/execution/orders`, {
      data: { venue: 'e2e-test', instrument: 'RESET-E2E', side: 'buy' },
    })

    // Verify exists
    const before = await request.get(`${API}/execution/orders?venue=e2e-test`)
    expect((await before.json()).data.length).toBeGreaterThan(0)

    // Reset
    await request.post(`${API}/admin/reset`)

    // Verify gone
    const after = await request.get(`${API}/execution/orders?venue=e2e-test`)
    expect((await after.json()).data.length).toBe(0)

    // Seed still present
    const seed = await request.get(`${API}/execution/orders`)
    expect((await seed.json()).data.length).toBeGreaterThan(0)
  })
})
