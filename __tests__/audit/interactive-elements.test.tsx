/**
 * Interactive Elements Audit Tests
 *
 * Tests that key interactive components render and have functioning elements.
 */

import { vi } from "vitest";
import { render } from "@testing-library/react";
import { KillSwitchPanel } from "@/components/trading/kill-switch-panel";
import { TestWrapper as Wrapper } from "@/__tests__/helpers/test-wrapper";

describe("Interactive Elements Audit", () => {
  describe("KillSwitchPanel", () => {
    it("renders buttons that are interactive", () => {
      const { container } = render(<KillSwitchPanel />, { wrapper: Wrapper });
      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("renders without console errors", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      render(<KillSwitchPanel />, { wrapper: Wrapper });
      // Filter out React internal warnings
      const realErrors = consoleSpy.mock.calls.filter(
        (call) => !String(call[0]).includes("Warning:"),
      );
      expect(realErrors).toHaveLength(0);
      consoleSpy.mockRestore();
    });
  });
});
