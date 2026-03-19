/**
 * Interactive Elements Audit Tests
 *
 * Tests that key interactive components render and have functioning elements.
 */

import { render } from "@testing-library/react"
import { KillSwitchPanel } from "@/components/trading/kill-switch-panel"

describe("Interactive Elements Audit", () => {
  describe("KillSwitchPanel", () => {
    it("renders buttons that are interactive", () => {
      const { container } = render(<KillSwitchPanel />)
      const buttons = container.querySelectorAll("button")
      expect(buttons.length).toBeGreaterThan(0)
    })

    it("renders without console errors", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {})
      render(<KillSwitchPanel />)
      // Filter out React internal warnings
      const realErrors = consoleSpy.mock.calls.filter(
        (call) => !String(call[0]).includes("Warning:")
      )
      expect(realErrors).toHaveLength(0)
      consoleSpy.mockRestore()
    })
  })
})
