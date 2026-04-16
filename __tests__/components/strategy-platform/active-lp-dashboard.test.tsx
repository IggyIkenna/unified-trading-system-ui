import { render, screen } from "@testing-library/react";
import { ActiveLPDashboardWidget } from "@/components/widgets/strategies/active-lp-dashboard-widget";

const defaultProps = { instanceId: "test-active-lp" };

describe("ActiveLPDashboardWidget", () => {
  it("renders without crashing", () => {
    const { container } = render(<ActiveLPDashboardWidget {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it("renders the dashboard title", () => {
    render(<ActiveLPDashboardWidget {...defaultProps} />);
    expect(screen.getByText("Active LP Dashboard")).toBeTruthy();
  });

  it("renders KPI cards", () => {
    render(<ActiveLPDashboardWidget {...defaultProps} />);
    expect(screen.getByText("Total TVL")).toBeTruthy();
    expect(screen.getByText("Active Positions")).toBeTruthy();
    expect(screen.getByText("24h Fees")).toBeTruthy();
    expect(screen.getByText("IL MTD")).toBeTruthy();
  });

  it("renders active positions count", () => {
    render(<ActiveLPDashboardWidget {...defaultProps} />);
    // 6 mock positions
    expect(screen.getByText("6")).toBeTruthy();
  });

  it("renders rebalance warning for out-of-range positions", () => {
    render(<ActiveLPDashboardWidget {...defaultProps} />);
    // SOL-USDC and ETH-USDT are out of range
    expect(screen.getByText(/Rebalance Needed/)).toBeTruthy();
    expect(screen.getByText(/2 positions out of range/)).toBeTruthy();
  });

  it("renders table column headers", () => {
    render(<ActiveLPDashboardWidget {...defaultProps} />);
    expect(screen.getByText("Pool")).toBeTruthy();
    expect(screen.getByText("Range")).toBeTruthy();
    expect(screen.getByText("In Range")).toBeTruthy();
    expect(screen.getByText("TVL")).toBeTruthy();
    expect(screen.getByText("Fees 24h")).toBeTruthy();
    expect(screen.getByText("IL %")).toBeTruthy();
    expect(screen.getByText("Rebalance")).toBeTruthy();
  });

  it("renders pool names from mock data", () => {
    render(<ActiveLPDashboardWidget {...defaultProps} />);
    expect(screen.getByText("ETH-USDC")).toBeTruthy();
    expect(screen.getByText("BTC-USDC")).toBeTruthy();
    expect(screen.getByText("SOL-USDC")).toBeTruthy();
  });

  it("renders in-range status badges", () => {
    render(<ActiveLPDashboardWidget {...defaultProps} />);
    const yesBadges = screen.getAllByText("Yes");
    const noBadges = screen.getAllByText("No");
    expect(yesBadges.length).toBe(4); // 4 in-range
    expect(noBadges.length).toBe(2); // 2 out-of-range
  });

  it("renders the correct number of position rows", () => {
    render(<ActiveLPDashboardWidget {...defaultProps} />);
    // 6 mock positions + 1 header row
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(7);
  });
});
