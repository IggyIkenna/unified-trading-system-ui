import { render, screen } from "@testing-library/react"
import { KillSwitchPanel } from "@/components/trading/kill-switch-panel"

describe("KillSwitchPanel", () => {
  it("renders without crashing", () => {
    const { container } = render(<KillSwitchPanel />)
    expect(container).toBeTruthy()
  })

  it("renders the kill switch card with title", () => {
    render(<KillSwitchPanel />)
    // Multiple elements may contain "kill switch" — just verify at least one exists
    const matches = screen.getAllByText(/kill switch/i)
    expect(matches.length).toBeGreaterThan(0)
  })

  it("renders arm/disarm button", () => {
    render(<KillSwitchPanel />)
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(0)
    // Should have at least an arm or disarm button
    const armDisarm = buttons.find(
      (b) => /arm|disarm/i.test(b.textContent || "")
    )
    expect(armDisarm).toBeTruthy()
  })

  it("renders exit playbook options", () => {
    render(<KillSwitchPanel />)
    // Exit playbooks are rendered as cards or in a select
    const text = document.body.textContent || ""
    expect(text).toMatch(/stop new|fast unwind|gradual|market neutral/i)
  })

  it("renders arm button", () => {
    render(<KillSwitchPanel />)
    const text = document.body.textContent || ""
    expect(text).toMatch(/arm/i)
  })
})
