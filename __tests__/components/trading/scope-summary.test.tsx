import { ScopeSummary } from "@/components/trading/scope-summary";
import { render, screen } from "@testing-library/react";

describe("ScopeSummary", () => {
  const defaultProps = {
    organizations: [] as { id: string; name: string }[],
    clients: [] as { id: string; name: string }[],
    strategies: [] as { id: string; name: string; status: string }[],
    selectedStrategyIds: [] as string[],
    totalStrategies: 17,
    totalCapital: 50000000,
    totalExposure: 45000000,
    mode: "live" as const,
  };

  it("renders without crashing", () => {
    const { container } = render(<ScopeSummary {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it("shows total strategy count when no filters selected", () => {
    render(<ScopeSummary {...defaultProps} />);
    expect(screen.getByText(/17 strategies/i)).toBeInTheDocument();
  });

  it("shows organization name when single org is selected", () => {
    render(
      <ScopeSummary
        {...defaultProps}
        organizations={[{ id: "odum", name: "Odum Capital" }]}
      />,
    );
    expect(screen.getByText(/odum capital/i)).toBeInTheDocument();
  });

  it("shows org count when multiple orgs selected", () => {
    render(
      <ScopeSummary
        {...defaultProps}
        organizations={[
          { id: "odum", name: "Odum Capital" },
          { id: "alpha", name: "Alpha Capital" },
        ]}
      />,
    );
    expect(screen.getByText(/2 orgs/i)).toBeInTheDocument();
  });

  it("shows client name when single client selected", () => {
    render(
      <ScopeSummary
        {...defaultProps}
        clients={[{ id: "delta-one", name: "Delta One Desk" }]}
      />,
    );
    expect(screen.getByText(/delta one desk/i)).toBeInTheDocument();
  });

  it("shows Live indicator when mode is live", () => {
    render(<ScopeSummary {...defaultProps} mode="live" />);
    expect(screen.getByText(/live/i)).toBeInTheDocument();
  });

  it("shows Batch indicator when mode is batch", () => {
    render(
      <ScopeSummary
        {...defaultProps}
        mode="batch"
        asOfDatetime="2026-03-17T10:00:00Z"
      />,
    );
    expect(screen.getByText(/batch/i)).toBeInTheDocument();
  });
});
