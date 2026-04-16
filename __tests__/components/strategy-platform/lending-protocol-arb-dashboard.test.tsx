import { render, screen } from "@testing-library/react";
import { LendingArbDashboardWidget } from "@/components/widgets/strategies/lending-arb-dashboard-widget";

const defaultProps = { instanceId: "test-lending-arb" };

describe("LendingArbDashboardWidget", () => {
  it("renders without crashing", () => {
    const { container } = render(<LendingArbDashboardWidget {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it("renders the dashboard title", () => {
    render(<LendingArbDashboardWidget {...defaultProps} />);
    expect(screen.getByText("Lending Protocol Arb Dashboard")).toBeTruthy();
  });

  it("renders the best arb highlight section", () => {
    render(<LendingArbDashboardWidget {...defaultProps} />);
    const bestArbText = screen.getByText(/Best Arb:/);
    expect(bestArbText).toBeTruthy();
  });

  it("renders table column headers", () => {
    render(<LendingArbDashboardWidget {...defaultProps} />);
    expect(screen.getByText("Protocol")).toBeTruthy();
    expect(screen.getByText("Token")).toBeTruthy();
    expect(screen.getByText("Supply APY")).toBeTruthy();
    expect(screen.getByText("Borrow APY")).toBeTruthy();
    expect(screen.getByText("Spread")).toBeTruthy();
    expect(screen.getByText("Util %")).toBeTruthy();
  });

  it("renders protocol names from mock data", () => {
    render(<LendingArbDashboardWidget {...defaultProps} />);
    const aaveRows = screen.getAllByText("Aave V3");
    expect(aaveRows.length).toBeGreaterThan(0);
    const morphoRows = screen.getAllByText("Morpho Blue");
    expect(morphoRows.length).toBeGreaterThan(0);
    const compoundRows = screen.getAllByText("Compound V3");
    expect(compoundRows.length).toBeGreaterThan(0);
  });

  it("renders token symbols from mock data", () => {
    render(<LendingArbDashboardWidget {...defaultProps} />);
    const usdcCells = screen.getAllByText("USDC");
    expect(usdcCells.length).toBeGreaterThan(0);
    const wethCells = screen.getAllByText("WETH");
    expect(wethCells.length).toBeGreaterThan(0);
  });

  it("renders spread badges with bps values", () => {
    render(<LendingArbDashboardWidget {...defaultProps} />);
    // Best arb spread is displayed as a badge (Kamino USDT = 180 bps)
    expect(screen.getByText("180 bps")).toBeTruthy();
  });

  it("renders the correct number of table rows", () => {
    render(<LendingArbDashboardWidget {...defaultProps} />);
    // 16 mock data rows (4 protocols x 4 tokens)
    const rows = screen.getAllByRole("row");
    // +1 for the header row
    expect(rows.length).toBe(17);
  });
});
