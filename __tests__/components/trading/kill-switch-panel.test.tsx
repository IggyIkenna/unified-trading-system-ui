import { render, screen } from "@testing-library/react";
import { KillSwitchPanel } from "@/components/trading/kill-switch-panel";
import { TestWrapper as Wrapper } from "@/__tests__/helpers/test-wrapper";

describe("KillSwitchPanel", () => {
  it("renders without crashing", () => {
    const { container } = render(<KillSwitchPanel />, { wrapper: Wrapper });
    expect(container).toBeTruthy();
  });

  it("renders the kill switch card with title", () => {
    render(<KillSwitchPanel />, { wrapper: Wrapper });
    const matches = screen.getAllByText(/kill switch/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("renders arm/disarm button", () => {
    render(<KillSwitchPanel />, { wrapper: Wrapper });
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
    const armDisarm = buttons.find((b) =>
      /arm|disarm/i.test(b.textContent || ""),
    );
    expect(armDisarm).toBeTruthy();
  });

  it("renders exit playbook options", () => {
    render(<KillSwitchPanel />, { wrapper: Wrapper });
    const text = document.body.textContent || "";
    expect(text).toMatch(/stop new|fast unwind|gradual|market neutral/i);
  });

  it("renders arm button", () => {
    render(<KillSwitchPanel />, { wrapper: Wrapper });
    const text = document.body.textContent || "";
    expect(text).toMatch(/arm/i);
  });
});
