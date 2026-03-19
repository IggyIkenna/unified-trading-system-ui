"use client"

import React, { ReactElement } from "react"
import { render, RenderOptions, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// =============================================================================
// TEST UTILITIES - Common patterns for testing trading dashboard components
// =============================================================================

// Mock trading context for testing
export interface MockTradingContext {
  mode: "live" | "batch"
  organizationIds: string[]
  clientIds: string[]
  strategyIds: string[]
  asOfDatetime?: string
}

export const defaultMockContext: MockTradingContext = {
  mode: "live",
  organizationIds: [],
  clientIds: [],
  strategyIds: [],
}

// Create a wrapper with all providers needed for testing
interface TestWrapperProps {
  children: React.ReactNode
  initialContext?: Partial<MockTradingContext>
}

export function TestWrapper({ children, initialContext }: TestWrapperProps) {
  return <>{children}</>
}

// Custom render function that includes providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { initialContext?: Partial<MockTradingContext> }
) {
  const { initialContext, ...renderOptions } = options || {}
  
  return {
    user: userEvent.setup(),
    ...render(ui, {
      wrapper: ({ children }) => (
        <TestWrapper initialContext={initialContext}>{children}</TestWrapper>
      ),
      ...renderOptions,
    }),
  }
}

// =============================================================================
// BUTTON HANDLER AUDIT UTILITIES
// =============================================================================

/**
 * Finds all interactive elements in the rendered component
 * Returns details about which ones have proper handlers
 */
export function auditInteractiveElements(container: HTMLElement) {
  const results: {
    buttons: { element: HTMLElement; hasHandler: boolean; text: string; disabled: boolean }[]
    links: { element: HTMLElement; hasHref: boolean; text: string }[]
    inputs: { element: HTMLElement; hasHandler: boolean; name: string; type: string }[]
    selects: { element: HTMLElement; hasHandler: boolean; name: string }[]
  } = {
    buttons: [],
    links: [],
    inputs: [],
    selects: [],
  }

  // Audit buttons
  const buttons = container.querySelectorAll("button, [role='button']")
  buttons.forEach((btn) => {
    const element = btn as HTMLElement
    const hasOnClick = element.onclick !== null || element.hasAttribute("onClick")
    const hasHandler = hasOnClick || element.closest("form") !== null
    results.buttons.push({
      element,
      hasHandler,
      text: element.textContent?.trim().slice(0, 50) || "[no text]",
      disabled: element.hasAttribute("disabled"),
    })
  })

  // Audit links
  const links = container.querySelectorAll("a")
  links.forEach((link) => {
    const element = link as HTMLAnchorElement
    results.links.push({
      element,
      hasHref: !!element.href && element.href !== "#",
      text: element.textContent?.trim().slice(0, 50) || "[no text]",
    })
  })

  // Audit inputs
  const inputs = container.querySelectorAll("input, textarea")
  inputs.forEach((input) => {
    const element = input as HTMLInputElement
    const hasHandler = element.onchange !== null || element.oninput !== null
    results.inputs.push({
      element,
      hasHandler,
      name: element.name || element.id || "[unnamed]",
      type: element.type || "text",
    })
  })

  // Audit selects
  const selects = container.querySelectorAll("select, [role='combobox'], [role='listbox']")
  selects.forEach((select) => {
    const element = select as HTMLElement
    const hasHandler = element.onchange !== null
    results.selects.push({
      element,
      hasHandler,
      name: element.getAttribute("name") || element.id || "[unnamed]",
    })
  })

  return results
}

/**
 * Generates a report of all interactive elements and their handler status
 */
export function generateInteractiveElementsReport(container: HTMLElement): string {
  const audit = auditInteractiveElements(container)
  const lines: string[] = ["Interactive Elements Audit Report", "=".repeat(50)]

  // Buttons
  lines.push(`\nButtons (${audit.buttons.length}):`)
  audit.buttons.forEach((btn, i) => {
    const status = btn.disabled ? "DISABLED" : btn.hasHandler ? "OK" : "NO HANDLER"
    lines.push(`  ${i + 1}. [${status}] "${btn.text}"`)
  })

  // Links
  lines.push(`\nLinks (${audit.links.length}):`)
  audit.links.forEach((link, i) => {
    const status = link.hasHref ? "OK" : "NO HREF"
    lines.push(`  ${i + 1}. [${status}] "${link.text}"`)
  })

  // Inputs
  lines.push(`\nInputs (${audit.inputs.length}):`)
  audit.inputs.forEach((input, i) => {
    lines.push(`  ${i + 1}. [${input.type}] "${input.name}"`)
  })

  return lines.join("\n")
}

// =============================================================================
// FILTER PROPAGATION TESTING UTILITIES
// =============================================================================

/**
 * Tests that a filter selection propagates to all child components
 */
export async function testFilterPropagation(
  container: HTMLElement,
  filterSelector: string,
  expectedDataAttribute: string,
  expectedValue: string
) {
  const filterElement = container.querySelector(filterSelector)
  if (!filterElement) {
    throw new Error(`Filter element not found: ${filterSelector}`)
  }

  // Click the filter
  await userEvent.click(filterElement as HTMLElement)

  // Check if data propagated
  const elementsWithData = container.querySelectorAll(`[${expectedDataAttribute}="${expectedValue}"]`)
  return elementsWithData.length > 0
}

// =============================================================================
// MOCK DATA GENERATORS
// =============================================================================

export function createMockStrategy(overrides: Partial<{
  id: string
  name: string
  clientId: string
  status: string
}> = {}) {
  return {
    id: overrides.id || `strategy-${Math.random().toString(36).slice(2)}`,
    name: overrides.name || "Test Strategy",
    clientId: overrides.clientId || "test-client",
    status: overrides.status || "live",
    archetype: "basis-trade",
    assetClass: "DeFi",
    executionMode: "SCE",
    ...overrides,
  }
}

export function createMockClient(overrides: Partial<{
  id: string
  name: string
  organizationId: string
}> = {}) {
  return {
    id: overrides.id || `client-${Math.random().toString(36).slice(2)}`,
    name: overrides.name || "Test Client",
    organizationId: overrides.organizationId || "test-org",
    ...overrides,
  }
}

// =============================================================================
// ASSERTION HELPERS
// =============================================================================

/**
 * Asserts that all buttons in a container have click handlers or are properly disabled
 */
export function assertAllButtonsHaveHandlers(container: HTMLElement) {
  const audit = auditInteractiveElements(container)
  const brokenButtons = audit.buttons.filter((btn) => !btn.hasHandler && !btn.disabled)
  
  if (brokenButtons.length > 0) {
    const details = brokenButtons.map((btn) => `"${btn.text}"`).join(", ")
    throw new Error(`Found ${brokenButtons.length} buttons without handlers: ${details}`)
  }
}

/**
 * Asserts that clicking a filter updates the displayed data
 */
export function assertFilterAffectsData(
  beforeCount: number,
  afterCount: number,
  filterDescription: string
) {
  if (beforeCount === afterCount) {
    throw new Error(`Filter "${filterDescription}" did not affect displayed data (still ${beforeCount} items)`)
  }
}

// Re-export everything from testing-library
export * from "@testing-library/react"
export { userEvent }
