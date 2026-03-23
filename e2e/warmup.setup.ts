import { chromium } from '@playwright/test'

/**
 * Global setup: warm Turbopack cache by hitting every page once sequentially.
 * This ensures all pages are compiled before parallel tests run,
 * eliminating cold-compile timeout flakes.
 */
async function globalSetup() {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100'
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Login first
  await page.goto(`${baseURL}/login`)
  await page.waitForLoadState('domcontentloaded')
  const card = page.locator('button:has-text("admin@odum"), button:has-text("Admin")')
  if (await card.count() > 0) {
    await card.first().click()
    await page.waitForTimeout(500)
  }

  // Hit every route to warm the compiler cache
  const routes = [
    '/', '/login', '/signup', '/contact', '/docs', '/demo', '/privacy', '/terms',
    '/health', '/dashboard', '/settings', '/investor-relations',
    '/services/data/overview', '/services/data/coverage', '/services/data/venues',
    '/services/data/logs', '/services/data/missing',
    '/services/research/overview', '/services/research/ml', '/services/research/ml/overview',
    '/services/research/strategy/backtests', '/services/research/quant',
    '/services/trading/overview', '/services/trading/terminal', '/services/trading/positions',
    '/services/trading/orders', '/services/trading/alerts', '/services/trading/pnl',
    '/services/execution/overview', '/services/execution/algos',
    '/services/observe/risk', '/services/observe/alerts', '/services/observe/health',
    '/services/manage/clients', '/services/manage/mandates',
    '/services/reports/overview', '/services/reports/settlement',
    '/admin', '/config', '/devops', '/ops', '/ops/jobs',
  ]

  console.log(`Warming ${routes.length} routes...`)
  for (const route of routes) {
    try {
      await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    } catch {
      // Some routes may redirect — that's fine
    }
  }
  console.log('Cache warm.')

  await browser.close()
}

export default globalSetup
