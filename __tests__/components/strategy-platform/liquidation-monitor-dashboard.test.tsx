import { render, screen } from "@testing-library/react";
import { LiquidationMonitorWidget } from "@/components/widgets/strategies/liquidation-monitor-widget";

const defaultProps = { instanceId: "test-liq-monitor" };

describe("LiquidationMonitorWidget", () => {
  it("renders without crashing", () => {
    const { container } = render(<LiquidationMonitorWidget {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it("renders the dashboard title", () => {
    render(<LiquidationMonitorWidget {...defaultProps} />);
    expect(screen.getByText("Liquidation Cascade Monitor")).toBeTruthy();
  });

  it("renders KPI cards", () => {
    render(<LiquidationMonitorWidget {...defaultProps} />);
    expect(screen.getByText("At Risk")).toBeTruthy();
    expect(screen.getByText("Cascade Zone")).toBeTruthy();
    expect(screen.getByText("24h Liquidated")).toBeTruthy();
  });

  it("renders at-risk count from mock positions", () => {
    render(<LiquidationMonitorWidget {...defaultProps} />);
    // 5 positions have HF < 1.5: 1.18, 1.08, 1.25, 1.12, 1.02
    expect(screen.getByText("5")).toBeTruthy();
  });

  it("renders cascade zone value", () => {
    render(<LiquidationMonitorWidget {...defaultProps} />);
    expect(screen.getByText("$2,740")).toBeTruthy();
  });

  it("renders 24h liquidated value", () => {
    render(<LiquidationMonitorWidget {...defaultProps} />);
    expect(screen.getByText("$4.2M")).toBeTruthy();
  });

  it("renders table column headers", () => {
    render(<LiquidationMonitorWidget {...defaultProps} />);
    expect(screen.getByText("Protocol")).toBeTruthy();
    expect(screen.getByText("Collateral")).toBeTruthy();
    expect(screen.getByText("Debt")).toBeTruthy();
    expect(screen.getByText("HF")).toBeTruthy();
    expect(screen.getByText("Liq. Price")).toBeTruthy();
    expect(screen.getByText("Distance")).toBeTruthy();
  });

  it("renders protocol names in position rows", () => {
    render(<LiquidationMonitorWidget {...defaultProps} />);
    const aaveRows = screen.getAllByText("Aave V3");
    expect(aaveRows.length).toBeGreaterThan(0);
    const morphoRows = screen.getAllByText("Morpho Blue");
    expect(morphoRows.length).toBeGreaterThan(0);
  });

  it("renders health factor badges", () => {
    render(<LiquidationMonitorWidget {...defaultProps} />);
    // Health factor 1.02 (critically low)
    expect(screen.getByText("1.02")).toBeTruthy();
    // Health factor 2.15 (healthy)
    expect(screen.getByText("2.15")).toBeTruthy();
  });

  it("renders the correct number of position rows", () => {
    render(<LiquidationMonitorWidget {...defaultProps} />);
    // 8 mock positions + 1 header row
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(9);
  });
});
