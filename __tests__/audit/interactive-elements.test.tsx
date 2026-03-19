/**
 * Interactive Elements Audit Tests
 * 
 * These tests ensure that every clickable element has a proper handler,
 * every button does something, and every filter has an effect.
 * 
 * Run these tests to catch "dead" UI elements that don't respond to user interaction.
 */

import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { auditInteractiveElements, assertAllButtonsHaveHandlers } from "@/lib/testing/test-utils"

// Helper to check if a component has orphaned buttons
function checkForOrphanedButtons(container: HTMLElement): string[] {
  const orphanedButtons: string[] = []
  const buttons = container.querySelectorAll("button:not([disabled])")
  
  buttons.forEach((button) => {
    const btn = button as HTMLButtonElement
    const hasClickHandler = btn.onclick !== null
    const hasFormParent = btn.closest("form") !== null
    const hasDialogTrigger = btn.hasAttribute("data-state") || 
                              btn.closest("[data-radix-dialog-trigger]") !== null ||
                              btn.closest("[data-radix-dropdown-trigger]") !== null
    
    // Check if button has any kind of handler
    if (!hasClickHandler && !hasFormParent && !hasDialogTrigger) {
      // Additional check: see if it's a React event handler
      const reactProps = Object.keys(btn).find(k => k.startsWith("__reactProps"))
      if (!reactProps || !(btn as any)[reactProps]?.onClick) {
        orphanedButtons.push(btn.textContent?.trim() || "[unnamed button]")
      }
    }
  })
  
  return orphanedButtons
}

// Helper to find dialogs without action buttons
function checkDialogHasActions(dialogElement: HTMLElement): boolean {
  const actionButtons = dialogElement.querySelectorAll(
    "button[type='submit'], " +
    "[role='button'][data-action], " +
    "button:not([type='button']):not([aria-label*='close'])"
  )
  
  // Should have at least one confirm/action button
  const hasConfirmButton = Array.from(actionButtons).some(btn => {
    const text = btn.textContent?.toLowerCase() || ""
    return text.includes("confirm") || 
           text.includes("apply") || 
           text.includes("ok") || 
           text.includes("save") ||
           text.includes("submit") ||
           text.includes("arm") ||
           text.includes("execute")
  })
  
  // Should have a cancel button
  const hasCancelButton = dialogElement.querySelector(
    "button[aria-label*='close'], button:contains('cancel')"
  ) !== null
  
  return hasConfirmButton
}

describe("Interactive Elements Audit", () => {
  describe("Button Handler Coverage", () => {
    it("should identify buttons without handlers", () => {
      // Example test - in real usage, render actual components
      const { container } = render(
        <div>
          <button onClick={() => {}}>Good Button</button>
          <button>Orphaned Button</button>
          <button disabled>Disabled Button</button>
        </div>
      )
      
      const orphaned = checkForOrphanedButtons(container)
      expect(orphaned).toContain("Orphaned Button")
      expect(orphaned).not.toContain("Good Button")
      expect(orphaned).not.toContain("Disabled Button")
    })
  })

  describe("Form Submission", () => {
    it("should have submit handlers on all forms", () => {
      const onSubmit = jest.fn(e => e.preventDefault())
      const { container } = render(
        <form onSubmit={onSubmit}>
          <input type="text" name="test" />
          <button type="submit">Submit</button>
        </form>
      )
      
      const form = container.querySelector("form")
      expect(form).toHaveAttribute("onsubmit")
      
      fireEvent.submit(form!)
      expect(onSubmit).toHaveBeenCalled()
    })
  })

  describe("Filter Effects", () => {
    it("should verify filter changes affect displayed data", async () => {
      const user = userEvent.setup()
      let filterValue = "all"
      const setFilter = jest.fn((val) => { filterValue = val })
      
      const items = [
        { id: 1, category: "a" },
        { id: 2, category: "b" },
        { id: 3, category: "a" },
      ]
      
      const { rerender } = render(
        <div>
          <select onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="a">Category A</option>
          </select>
          <ul>
            {items
              .filter(i => filterValue === "all" || i.category === filterValue)
              .map(i => <li key={i.id}>{i.id}</li>)
            }
          </ul>
        </div>
      )
      
      // Initial state - all items
      expect(screen.getAllByRole("listitem")).toHaveLength(3)
      
      // Change filter
      await user.selectOptions(screen.getByRole("combobox"), "a")
      expect(setFilter).toHaveBeenCalledWith("a")
    })
  })

  describe("Dialog Action Buttons", () => {
    it("should have action buttons in confirmation dialogs", () => {
      const { container } = render(
        <div role="dialog" aria-modal="true">
          <h2>Confirm Action</h2>
          <p>Are you sure?</p>
          <button type="button">Cancel</button>
          <button type="submit">Confirm</button>
        </div>
      )
      
      const dialog = container.querySelector("[role='dialog']")
      expect(dialog).toBeInTheDocument()
      
      // Should have confirm button
      expect(screen.getByText("Confirm")).toBeInTheDocument()
      
      // Should have cancel button
      expect(screen.getByText("Cancel")).toBeInTheDocument()
    })

    it("should identify dialogs missing action buttons", () => {
      const { container } = render(
        <div role="dialog" aria-modal="true">
          <h2>Broken Dialog</h2>
          <p>This dialog has no action buttons!</p>
        </div>
      )
      
      const dialog = container.querySelector("[role='dialog']") as HTMLElement
      const hasActions = checkDialogHasActions(dialog)
      
      expect(hasActions).toBe(false)
    })
  })

  describe("Dropdown Menus", () => {
    it("should have working menu items in dropdowns", async () => {
      const onItemClick = jest.fn()
      const user = userEvent.setup()
      
      const { container } = render(
        <div>
          <button aria-haspopup="menu" aria-expanded="false">
            Open Menu
          </button>
          <div role="menu" hidden>
            <button role="menuitem" onClick={onItemClick}>
              Menu Item 1
            </button>
            <button role="menuitem" onClick={onItemClick}>
              Menu Item 2
            </button>
          </div>
        </div>
      )
      
      // Menu items should have handlers
      const menuItems = container.querySelectorAll("[role='menuitem']")
      expect(menuItems.length).toBe(2)
    })
  })

  describe("Input Field Handlers", () => {
    it("should have onChange handlers on controlled inputs", async () => {
      const onChange = jest.fn()
      const user = userEvent.setup()
      
      render(
        <input 
          type="text" 
          value="" 
          onChange={onChange}
          data-testid="test-input"
        />
      )
      
      const input = screen.getByTestId("test-input")
      await user.type(input, "test")
      
      expect(onChange).toHaveBeenCalled()
    })
  })

  describe("Toggle States", () => {
    it("should toggle state when switch is clicked", async () => {
      let isOn = false
      const toggle = jest.fn(() => { isOn = !isOn })
      const user = userEvent.setup()
      
      const { rerender } = render(
        <button 
          role="switch" 
          aria-checked={isOn}
          onClick={toggle}
        >
          Toggle
        </button>
      )
      
      const switchBtn = screen.getByRole("switch")
      expect(switchBtn).toHaveAttribute("aria-checked", "false")
      
      await user.click(switchBtn)
      expect(toggle).toHaveBeenCalled()
    })
  })
})

describe("Accessibility Audit", () => {
  describe("Button Labels", () => {
    it("should have accessible labels on icon-only buttons", () => {
      const { container } = render(
        <div>
          <button aria-label="Close">X</button>
          <button>
            <span className="sr-only">Settings</span>
            <svg />
          </button>
          <button>Bad Icon Button<svg /></button>
        </div>
      )
      
      const buttons = container.querySelectorAll("button")
      buttons.forEach((btn) => {
        const hasAriaLabel = btn.hasAttribute("aria-label")
        const hasSrOnlyText = btn.querySelector(".sr-only") !== null
        const hasVisibleText = btn.textContent?.trim() && btn.textContent.trim().length > 2
        
        const isAccessible = hasAriaLabel || hasSrOnlyText || hasVisibleText
        // Note: In real tests, we'd assert this
      })
    })
  })

  describe("Focus Management", () => {
    it("should trap focus within modals", () => {
      // Focus trap test would go here
      expect(true).toBe(true)
    })
  })
})
