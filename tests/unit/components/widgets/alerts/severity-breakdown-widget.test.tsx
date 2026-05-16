import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import type { Alert } from "@/components/widgets/alerts/alerts-data-context";

const useAlertsDataMock = vi.fn();
vi.mock("@/components/widgets/alerts/alerts-data-context", () => ({
  useAlertsData: () => useAlertsDataMock(),
}));

// Recharts internals don't render in happy-dom (ResponsiveContainer measures
// to 0×0). Stub the whole module — the component contract under test is the
// per-bucket counting + render decision, not the SVG output.
vi.mock("recharts", () => ({
  Cell: ({ "data-testid": testid }: { "data-testid"?: string }) => <div data-testid={testid ?? "cell"} />,
  Pie: ({ children }: { children?: React.ReactNode }) => <div data-testid="pie">{children}</div>,
  PieChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Tooltip: () => null,
  Legend: () => null,
}));

import { SeverityBreakdownWidget } from "@/components/widgets/alerts/severity-breakdown-widget";

const widgetProps = {} as React.ComponentProps<typeof SeverityBreakdownWidget>;

function makeAlert(overrides: Partial<Alert>): Alert {
  return {
    id: overrides.id ?? "x",
    severity: overrides.severity ?? "medium",
    status: overrides.status ?? "active",
    title: overrides.title ?? "t",
    description: overrides.description ?? "d",
    source: overrides.source ?? "s",
    entity: overrides.entity ?? "e",
    alertType: overrides.alertType ?? "GENERIC",
    timestamp: overrides.timestamp ?? "2026-05-08T00:00:00Z",
    value: overrides.value,
    threshold: overrides.threshold,
  };
}

describe("SeverityBreakdownWidget", () => {
  it("renders loading state", () => {
    useAlertsDataMock.mockReturnValue({ alerts: [], isLoading: true });
    render(<SeverityBreakdownWidget {...widgetProps} />);
    const node = screen.getByTestId("severity-breakdown-widget");
    expect(node.textContent).toContain("Loading");
  });

  it("renders empty state when no active alerts", () => {
    useAlertsDataMock.mockReturnValue({
      alerts: [makeAlert({ id: "1", status: "resolved", severity: "critical" })],
      isLoading: false,
    });
    render(<SeverityBreakdownWidget {...widgetProps} />);
    const node = screen.getByTestId("severity-breakdown-widget");
    expect(node.getAttribute("data-empty")).toBe("true");
    expect(node.textContent).toContain("No active alerts");
  });

  it("counts active alerts by severity (skips non-active)", () => {
    useAlertsDataMock.mockReturnValue({
      alerts: [
        makeAlert({ id: "1", severity: "critical", status: "active" }),
        makeAlert({ id: "2", severity: "critical", status: "active" }),
        makeAlert({ id: "3", severity: "high", status: "active" }),
        makeAlert({ id: "4", severity: "medium", status: "acknowledged" }), // skipped
        makeAlert({ id: "5", severity: "low", status: "resolved" }), // skipped
      ],
      isLoading: false,
    });
    render(<SeverityBreakdownWidget {...widgetProps} />);

    const node = screen.getByTestId("severity-breakdown-widget");
    expect(node.getAttribute("data-total-active")).toBe("3");
    expect(node.getAttribute("data-empty")).toBeNull();

    // The rendered cells correspond to non-zero buckets — critical + high.
    expect(screen.getByTestId("severity-breakdown-slice-critical")).toBeTruthy();
    expect(screen.getByTestId("severity-breakdown-slice-high")).toBeTruthy();
    expect(screen.queryByTestId("severity-breakdown-slice-medium")).toBeNull();
    expect(screen.queryByTestId("severity-breakdown-slice-low")).toBeNull();
  });
});
