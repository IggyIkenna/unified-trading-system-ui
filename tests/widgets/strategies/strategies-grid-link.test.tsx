/**
 * L1.5 widget harness — strategies-grid-link-widget.
 *
 * Covers:
 * - Renders without crashing.
 * - Link href points to /services/strategy-catalogue.
 * - Button text mentions "DimensionalGrid" / "Batch Analysis".
 * - No data-context dependencies (static CTA widget).
 *
 * Per unified-trading-pm/plans/ai/ui_widget_test_rollout_2026_04_24.plan Phase 5.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className} data-testid="grid-link">
      {children}
    </a>
  ),
}));

import { StrategiesGridLinkWidget } from "@/components/widgets/strategies/strategies-grid-link-widget";
import * as React from "react";

describe("strategies-grid-link — L1.5 harness", () => {
  describe("render", () => {
    it("renders without crashing", () => {
      render(<StrategiesGridLinkWidget instanceId="test" />);
      expect(screen.getByTestId("grid-link")).toBeTruthy();
    });

    it("link href targets /services/strategy-catalogue", () => {
      render(<StrategiesGridLinkWidget instanceId="test" />);
      const link = screen.getByTestId("grid-link");
      expect(link.getAttribute("href")).toBe("/services/strategy-catalogue");
    });

    it("button text mentions DimensionalGrid", () => {
      render(<StrategiesGridLinkWidget instanceId="test" />);
      expect(screen.getByText(/DimensionalGrid/i)).toBeTruthy();
    });

    it("button text mentions Batch Analysis", () => {
      render(<StrategiesGridLinkWidget instanceId="test" />);
      expect(screen.getByText(/Batch Analysis/i)).toBeTruthy();
    });

    it("button is not disabled (always actionable)", () => {
      render(<StrategiesGridLinkWidget instanceId="test" />);
      const btn = screen.getByRole("button");
      expect((btn as HTMLButtonElement).disabled).toBeFalsy();
    });

    it("renders full width container", () => {
      const { container } = render(<StrategiesGridLinkWidget instanceId="test" />);
      const outerDiv = container.firstChild as HTMLElement;
      expect(outerDiv.classList.contains("h-full")).toBe(true);
    });
  });
});
