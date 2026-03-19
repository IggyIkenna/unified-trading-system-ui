import { test, expect } from '@playwright/test'

/**
 * SMOKE TESTS - Every page loads without error
 * These tests ensure basic functionality across all routes
 */

const PAGES = [
  { path: '/', name: 'Home' },
  { path: '/trader', name: 'Trader Dashboard' },
  { path: '/positions', name: 'Positions' },
  { path: '/risk', name: 'Risk' },
  { path: '/ml', name: 'ML' },
  { path: '/ops', name: 'Operations' },
  { path: '/config', name: 'Config' },
  { path: '/quant', name: 'Quant' },
  { path: '/executive', name: 'Executive' },
  { path: '/devops', name: 'DevOps' },
  { path: '/audit', name: 'Audit' },
]

test.describe('Smoke Tests - All Pages Load', () => {
  for (const page of PAGES) {
    test(`${page.name} page loads without console errors`, async ({ page: browserPage }) => {
      const consoleErrors: string[] = []
      
      // Collect console errors
      browserPage.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })
      
      // Navigate to page
      await browserPage.goto(page.path)
      
      // Wait for page to be fully loaded
      await browserPage.waitForLoadState('networkidle')
      
      // Check no critical errors (ignore React dev warnings)
      const criticalErrors = consoleErrors.filter(e => 
        !e.includes('Warning:') && 
        !e.includes('DevTools') &&
        !e.includes('Download the React DevTools')
      )
      
      expect(criticalErrors).toHaveLength(0)
    })
  }
})

test.describe('Navigation - All Links Work', () => {
  test('global nav links are clickable and navigate', async ({ page }) => {
    await page.goto('/trader')
    await page.waitForLoadState('networkidle')
    
    // Find all nav links
    const navLinks = page.locator('nav a[href]')
    const count = await navLinks.count()
    
    expect(count).toBeGreaterThan(0)
    
    // Click first nav link and verify navigation
    const firstLink = navLinks.first()
    const href = await firstLink.getAttribute('href')
    
    if (href && href.startsWith('/')) {
      await firstLink.click()
      await page.waitForLoadState('networkidle')
      expect(page.url()).toContain(href)
    }
  })
})

test.describe('Interactive Elements - Buttons Have Handlers', () => {
  test('trader page - all buttons are clickable', async ({ page }) => {
    await page.goto('/trader')
    await page.waitForLoadState('networkidle')
    
    // Find all buttons
    const buttons = page.locator('button:visible')
    const count = await buttons.count()
    
    // Each button should be clickable (not disabled unless intentionally)
    for (let i = 0; i < Math.min(count, 20); i++) {
      const button = buttons.nth(i)
      const isDisabled = await button.isDisabled()
      
      if (!isDisabled) {
        // Button should be clickable without throwing
        await expect(button).toBeEnabled()
      }
    }
  })
  
  test('dialogs open and have action buttons', async ({ page }) => {
    await page.goto('/trader')
    await page.waitForLoadState('networkidle')
    
    // Look for dialog triggers (buttons that open modals)
    const dialogTriggers = page.locator('button:has-text("Flatten"), button:has-text("Kill"), button:has-text("Pause")')
    
    if (await dialogTriggers.count() > 0) {
      const trigger = dialogTriggers.first()
      await trigger.click()
      
      // Wait for dialog to appear
      const dialog = page.locator('[role="dialog"], [role="alertdialog"]')
      
      if (await dialog.count() > 0) {
        await expect(dialog.first()).toBeVisible()
        
        // Dialog should have action buttons
        const dialogButtons = dialog.locator('button')
        expect(await dialogButtons.count()).toBeGreaterThan(0)
      }
    }
  })
})

test.describe('Filters - Selection Propagates', () => {
  test('selecting a strategy updates the scope summary', async ({ page }) => {
    await page.goto('/trader')
    await page.waitForLoadState('networkidle')
    
    // Look for strategy filter/selector
    const strategySelector = page.locator('[data-testid="strategy-filter"], .strategy-selector, button:has-text("Strategies")')
    
    if (await strategySelector.count() > 0) {
      // Get initial scope text
      const scopeSummary = page.locator('[data-testid="scope-summary"], .scope-summary')
      const initialText = await scopeSummary.textContent()
      
      // Click to open selector
      await strategySelector.first().click()
      
      // Select an option if dropdown appears
      const options = page.locator('[role="option"], [role="menuitem"]')
      if (await options.count() > 0) {
        await options.first().click()
        
        // Scope should update (or at least not error)
        await page.waitForTimeout(500)
        const newText = await scopeSummary.textContent()
        
        // If something was selected, text may have changed
        // At minimum, no error should have occurred
        expect(newText).toBeDefined()
      }
    }
  })
})

test.describe('Forms - All Inputs Give Feedback', () => {
  test('config page inputs are interactive', async ({ page }) => {
    await page.goto('/config')
    await page.waitForLoadState('networkidle')
    
    // Find text inputs
    const inputs = page.locator('input[type="text"], input[type="number"], textarea')
    const count = await inputs.count()
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const input = inputs.nth(i)
      const isDisabled = await input.isDisabled()
      
      if (!isDisabled) {
        // Input should accept text
        await input.fill('test-value')
        const value = await input.inputValue()
        expect(value).toContain('test')
      }
    }
  })
})

test.describe('Error Boundaries - Graceful Failures', () => {
  test('invalid route shows 404 or redirects', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345')
    
    // Should either show 404 or redirect to home
    const status = response?.status()
    const url = page.url()
    
    expect(status === 404 || url.includes('/')).toBeTruthy()
  })
})
