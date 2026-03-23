import { test, expect } from '@playwright/test'

/**
 * STATIC SMOKE TESTS - Every page renders without crash
 *
 * Runs against Tier 0 (port 3100) with NEXT_PUBLIC_MOCK_API=true.
 * No backend required. Tests that every page:
 *   1. Returns HTTP 200
 *   2. Renders without uncaught JS exceptions
 *   3. Has visible content (not a blank page)
 *   4. No "Cannot read properties of undefined" or similar runtime crashes
 *
 * Run: PLAYWRIGHT_BASE_URL=http://localhost:3100 npx playwright test e2e/static-smoke.spec.ts
 */

// ─── Complete route registry ────────────────────────────────────────────────

const PUBLIC_PAGES = [
  { path: '/', name: 'Home (Landing)' },
  { path: '/login', name: 'Login' },
  { path: '/signup', name: 'Sign Up' },
  { path: '/contact', name: 'Contact' },
  { path: '/docs', name: 'Docs' },
  { path: '/demo', name: 'Demo' },
  { path: '/privacy', name: 'Privacy Policy' },
  { path: '/terms', name: 'Terms of Service' },
  { path: '/health', name: 'Health Check' },
]

const PLATFORM_PAGES = [
  { path: '/dashboard', name: 'Dashboard (Service Hub)' },
  { path: '/settings', name: 'Settings' },
  { path: '/investor-relations', name: 'Investor Relations' },
]

const DATA_PAGES = [
  { path: '/services/data/overview', name: 'Data Overview' },
  { path: '/services/data/coverage', name: 'Data Coverage' },
  { path: '/services/data/venues', name: 'Data Venues' },
  { path: '/services/data/logs', name: 'Data Logs' },
  { path: '/services/data/missing', name: 'Data Missing' },
]

const RESEARCH_PAGES = [
  { path: '/services/research/overview', name: 'Research Overview' },
  { path: '/services/research/quant', name: 'Quant Workspace' },
  { path: '/services/research/ml', name: 'ML Dashboard' },
  { path: '/services/research/ml/overview', name: 'ML Overview' },
  { path: '/services/research/ml/experiments', name: 'ML Experiments' },
  { path: '/services/research/ml/training', name: 'ML Training' },
  { path: '/services/research/ml/features', name: 'ML Features' },
  { path: '/services/research/ml/validation', name: 'ML Validation' },
  { path: '/services/research/ml/registry', name: 'ML Registry' },
  { path: '/services/research/ml/monitoring', name: 'ML Monitoring' },
  { path: '/services/research/ml/deploy', name: 'ML Deploy' },
  { path: '/services/research/ml/governance', name: 'ML Governance' },
  { path: '/services/research/ml/config', name: 'ML Config' },
  { path: '/services/research/strategy/overview', name: 'Strategy Overview' },
  { path: '/services/research/strategy/backtests', name: 'Strategy Backtests' },
  { path: '/services/research/strategy/candidates', name: 'Strategy Candidates' },
  { path: '/services/research/strategy/compare', name: 'Strategy Compare' },
  { path: '/services/research/strategy/handoff', name: 'Strategy Handoff' },
  { path: '/services/research/strategy/heatmap', name: 'Strategy Heatmap' },
  { path: '/services/research/strategy/results', name: 'Strategy Results' },
]

const TRADING_PAGES = [
  { path: '/services/trading/overview', name: 'Trading Overview (Command Center)' },
  { path: '/services/trading/terminal', name: 'Trading Terminal' },
  { path: '/services/trading/positions', name: 'Trading Positions' },
  { path: '/services/trading/orders', name: 'Trading Orders' },
  { path: '/services/trading/book', name: 'Book Trade' },
  { path: '/services/trading/accounts', name: 'Trading Accounts' },
  { path: '/services/trading/pnl', name: 'Trading P&L Breakdown' },
  { path: '/services/trading/alerts', name: 'Trading Alerts' },
  { path: '/services/trading/risk', name: 'Trading Risk' },
  { path: '/services/trading/strategies', name: 'Trading Strategies' },
  { path: '/services/trading/strategies/grid', name: 'Strategy Grid' },
]

const EXECUTION_PAGES = [
  { path: '/services/execution/overview', name: 'Execution Overview' },
  { path: '/services/execution/algos', name: 'Execution Algos' },
  { path: '/services/execution/venues', name: 'Execution Venues' },
  { path: '/services/execution/tca', name: 'Execution TCA' },
  { path: '/services/execution/benchmarks', name: 'Execution Benchmarks' },
  { path: '/services/execution/candidates', name: 'Execution Candidates' },
  { path: '/services/execution/handoff', name: 'Execution Handoff' },
]

const OBSERVE_PAGES = [
  { path: '/services/observe/risk', name: 'Observe Risk Dashboard' },
  { path: '/services/observe/alerts', name: 'Observe Alerts' },
  { path: '/services/observe/health', name: 'Observe System Health' },
  { path: '/services/observe/news', name: 'Observe News' },
  { path: '/services/observe/strategy-health', name: 'Observe Strategy Health' },
]

const MANAGE_PAGES = [
  { path: '/services/manage/clients', name: 'Manage Clients' },
  { path: '/services/manage/mandates', name: 'Manage Mandates' },
  { path: '/services/manage/fees', name: 'Manage Fees' },
  { path: '/services/manage/users', name: 'Manage Users' },
  { path: '/services/manage/compliance', name: 'Manage Compliance' },
]

const REPORTS_PAGES = [
  { path: '/services/reports/overview', name: 'Reports Overview' },
  { path: '/services/reports/executive', name: 'Reports Executive' },
  { path: '/services/reports/settlement', name: 'Reports Settlement' },
  { path: '/services/reports/reconciliation', name: 'Reports Reconciliation' },
  { path: '/services/reports/regulatory', name: 'Reports Regulatory' },
]

const OPS_PAGES = [
  { path: '/admin', name: 'Admin' },
  { path: '/admin/data', name: 'Admin Data' },
  { path: '/config', name: 'Config' },
  { path: '/devops', name: 'DevOps' },
  { path: '/engagement', name: 'Engagement' },
  { path: '/internal', name: 'Internal' },
  { path: '/internal/data-etl', name: 'Internal Data ETL' },
  { path: '/ops', name: 'Operations' },
  { path: '/ops/jobs', name: 'Ops Jobs' },
  { path: '/ops/services', name: 'Ops Services' },
]

const ALL_PAGES = [
  ...PUBLIC_PAGES,
  ...PLATFORM_PAGES,
  ...DATA_PAGES,
  ...RESEARCH_PAGES,
  ...TRADING_PAGES,
  ...EXECUTION_PAGES,
  ...OBSERVE_PAGES,
  ...MANAGE_PAGES,
  ...REPORTS_PAGES,
  ...OPS_PAGES,
]

// ─── Tests ──────────────────────────────────────────────────────────────────

// First, login once before all tests
test.beforeEach(async ({ page }) => {
  // Navigate to login and authenticate with demo persona
  await page.goto('/login')
  await page.waitForLoadState('domcontentloaded')

  // Click the first persona card to log in (admin persona)
  const personaCard = page.locator('[data-testid="persona-card"], button:has-text("admin@odum"), button:has-text("Admin")')
  if (await personaCard.count() > 0) {
    await personaCard.first().click()
    await page.waitForTimeout(500)
  }
})

for (const { path, name } of ALL_PAGES) {
  test(`${name} (${path}) renders without crash`, async ({ page }) => {
    const jsErrors: string[] = []
    const consoleErrors: string[] = []

    // Capture uncaught exceptions
    page.on('pageerror', (error) => {
      jsErrors.push(error.message)
    })

    // Capture console.error calls
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // Ignore known non-critical warnings
        if (
          text.includes('Warning:') ||
          text.includes('DevTools') ||
          text.includes('Download the React DevTools') ||
          text.includes('Failed to load resource') ||  // expected in mock mode for some assets
          text.includes('[mock]') ||  // our own mock handler logs
          text.includes('IGNORE_NOTHING_PLACEHOLDER')  // placeholder — all React warnings are now caught
        ) return
        consoleErrors.push(text)
      }
    })

    // Navigate to the page
    const response = await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 15000 })

    // 1. HTTP status should be 200 (or 304)
    expect(response?.status(), `${name} returned ${response?.status()}`).toBeLessThan(400)

    // 2. Wait for client-side rendering (React hydration + data fetch)
    await page.waitForTimeout(2000)

    // 3. Page should have visible content (not blank)
    const body = page.locator('body')
    await expect(body).not.toBeEmpty()

    // 4. No error banners or crash messages (React error boundaries, Next.js errors)
    const crashTexts = [
      'Cannot read properties of undefined',
      'Cannot read properties of null',
      'is not a function',
      'Something went wrong',
      'Unhandled Runtime Error',
      'Application error',
      'Rendered more hooks than',
      'change in the order of Hooks',
    ]
    for (const text of crashTexts) {
      const bannerCount = await page.locator(`text=${text}`).count()
      expect(bannerCount, `${name} shows error: "${text}"`).toBe(0)
    }

    // 5. No uncaught JS exceptions
    const criticalJsErrors = jsErrors.filter(e =>
      !e.includes('ResizeObserver') &&  // benign browser warning
      !e.includes('hydration') &&  // Next.js dev mode hydration mismatches
      !e.includes('Performance') &&  // browser Performance API timing edge cases
      !e.includes('negative time stamp')  // Performance.measure with zero-width invisible chars
    )

    if (criticalJsErrors.length > 0) {
      console.log(`  JS errors on ${path}:`, criticalJsErrors)
    }

    expect(criticalJsErrors, `${name} has JS errors: ${criticalJsErrors.join('; ')}`).toHaveLength(0)

    // 6. No React-level console errors that indicate broken rendering
    const renderErrors = consoleErrors.filter(e =>
      e.includes('toFixed') ||
      e.includes('Cannot read properties') ||
      e.includes('is not a function') ||
      e.includes('Rendered more hooks') ||
      e.includes('order of Hooks') ||
      e.includes('two children with the same key') ||
      e.includes('toLocaleString')
    )
    expect(renderErrors, `${name} has React render errors: ${renderErrors.join('; ')}`).toHaveLength(0)

    // 7. Page should have meaningful content (not just a blank shell)
    const contentIndicators = page.locator('h1, h2, h3, table, [class*="card"], [class*="Card"], [role="tablist"], main')
    const contentCount = await contentIndicators.count()
    expect(contentCount, `${name} has no visible content`).toBeGreaterThan(0)

    // 8. No stub pages — "Coming Soon" or "TODO" should not appear
    const stubTexts = await page.locator('text=Coming Soon').count()
    const todoTexts = await page.locator('text=TODO:').count()
    expect(stubTexts + todoTexts, `${name} still has stub/placeholder content`).toBe(0)

    // 9. No unhandled mock API routes (indicates missing mock data)
    const unhandledRoutes = consoleErrors.filter(e => e.includes('Unhandled API route'))
    if (unhandledRoutes.length > 0) {
      console.log(`  Unhandled mock routes on ${path}:`, unhandledRoutes)
    }
    // Note: we warn but don't fail — some routes are called by shared components on every page
  })
}

// ─── 404 test ───────────────────────────────────────────────────────────────

test('Invalid route returns 404 or redirects', async ({ page }) => {
  const response = await page.goto('/this-route-definitely-does-not-exist-xyz123')
  const status = response?.status()
  expect(status === 404 || status === 200).toBeTruthy()
})
