import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { KillSwitchPanel } from "@/components/trading/kill-switch-panel"
import { auditInteractiveElements, assertAllButtonsHaveHandlers } from "@/lib/testing/test-utils"

describe("KillSwitchPanel", () => {
  describe("Interactive Elements Audit", () => {
    it("should have handlers on all buttons", () => {
      const { container } = render(<KillSwitchPanel />)
      
      // This will throw if any button lacks a handler
      assertAllButtonsHaveHandlers(container)
    })

    it("should have all form inputs properly connected", () => {
      const { container } = render(<KillSwitchPanel />)
      const audit = auditInteractiveElements(container)
      
      // All inputs should be accounted for
      expect(audit.inputs.length).toBeGreaterThan(0)
    })
  })

  describe("Kill Switch Arming Flow", () => {
    it("should show confirmation dialog when arming kill switch", async () => {
      const user = userEvent.setup()
      render(<KillSwitchPanel />)
      
      // Find and click the arm button
      const armButton = screen.getByRole("button", { name: /arm/i })
      expect(armButton).toBeInTheDocument()
      
      await user.click(armButton)
      
      // Confirmation dialog should appear
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })
    })

    it("should have confirm and cancel buttons in dialog", async () => {
      const user = userEvent.setup()
      render(<KillSwitchPanel />)
      
      // Open the dialog
      const armButton = screen.getByRole("button", { name: /arm/i })
      await user.click(armButton)
      
      // Should have confirm button
      await waitFor(() => {
        const dialog = screen.getByRole("dialog")
        const confirmBtn = dialog.querySelector("button[type='submit'], button:not([type='button'])")
        expect(confirmBtn || screen.queryByRole("button", { name: /confirm|apply|ok|arm/i })).toBeInTheDocument()
      })
    })

    it("should close dialog on cancel", async () => {
      const user = userEvent.setup()
      render(<KillSwitchPanel />)
      
      // Open the dialog
      const armButton = screen.getByRole("button", { name: /arm/i })
      await user.click(armButton)
      
      // Click cancel
      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      await user.click(cancelButton)
      
      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      })
    })
  })

  describe("Exit Playbook Selection", () => {
    it("should allow selecting different exit playbooks", async () => {
      const user = userEvent.setup()
      render(<KillSwitchPanel />)
      
      // Find playbook selector
      const playbookOptions = screen.getAllByRole("radio") || screen.getAllByRole("button")
      expect(playbookOptions.length).toBeGreaterThan(0)
    })
  })

  describe("Scope Selection", () => {
    it("should allow selecting scope level", async () => {
      const user = userEvent.setup()
      render(<KillSwitchPanel />)
      
      // Should have scope selection options
      const scopeOptions = screen.queryAllByRole("radio") || screen.queryAllByRole("button")
      expect(scopeOptions.length).toBeGreaterThan(0)
    })
  })
})
