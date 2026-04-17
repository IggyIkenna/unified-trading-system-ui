import { render, screen } from "@testing-library/react";
import { CommodityRegimeWidget } from "@/components/widgets/strategies/commodity-regime-widget";

const defaultProps = { instanceId: "test-commodity" };

describe("CommodityRegimeWidget", () => {
  it("renders without crashing", () => {
    const { container } = render(<CommodityRegimeWidget {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it("renders the dashboard title", () => {
    render(<CommodityRegimeWidget {...defaultProps} />);
    expect(screen.getByText("Commodity Regime Dashboard")).toBeTruthy();
  });

  it("renders the current regime badge", () => {
    render(<CommodityRegimeWidget {...defaultProps} />);
    // Current regime is "Trending"
    const trendingBadges = screen.getAllByText("Trending");
    expect(trendingBadges.length).toBeGreaterThan(0);
  });

  it("renders factor scores section", () => {
    render(<CommodityRegimeWidget {...defaultProps} />);
    expect(screen.getByText("Factor Scores")).toBeTruthy();
  });

  it("renders factor score table headers", () => {
    render(<CommodityRegimeWidget {...defaultProps} />);
    expect(screen.getByText("Factor")).toBeTruthy();
    expect(screen.getByText("Score")).toBeTruthy();
    expect(screen.getByText("Signal")).toBeTruthy();
    expect(screen.getByText("Weight")).toBeTruthy();
  });

  it("renders all 5 factor names", () => {
    render(<CommodityRegimeWidget {...defaultProps} />);
    expect(screen.getByText("Rig Count")).toBeTruthy();
    expect(screen.getByText("COT Positioning")).toBeTruthy();
    expect(screen.getByText("Storage Levels")).toBeTruthy();
    expect(screen.getByText("Price Momentum")).toBeTruthy();
    expect(screen.getByText("Weather Impact")).toBeTruthy();
  });

  it("renders signal badges (BULLISH, BEARISH, NEUTRAL)", () => {
    render(<CommodityRegimeWidget {...defaultProps} />);
    const bullishBadges = screen.getAllByText("BULLISH");
    expect(bullishBadges.length).toBe(3); // Rig Count, COT Positioning, Price Momentum
    expect(screen.getByText("BEARISH")).toBeTruthy(); // Storage Levels
    expect(screen.getByText("NEUTRAL")).toBeTruthy(); // Weather Impact
  });

  it("renders active positions section", () => {
    render(<CommodityRegimeWidget {...defaultProps} />);
    expect(screen.getByText("Active Positions")).toBeTruthy();
  });

  it("renders position table headers", () => {
    render(<CommodityRegimeWidget {...defaultProps} />);
    expect(screen.getByText("Commodity")).toBeTruthy();
    expect(screen.getByText("Dir")).toBeTruthy();
    expect(screen.getByText("Entry")).toBeTruthy();
    expect(screen.getByText("Current")).toBeTruthy();
    const pnlHeaders = screen.getAllByText("P&L");
    expect(pnlHeaders.length).toBeGreaterThan(0);
    expect(screen.getByText("Regime")).toBeTruthy();
  });

  it("renders commodity names from mock positions", () => {
    render(<CommodityRegimeWidget {...defaultProps} />);
    expect(screen.getByText("WTI Crude")).toBeTruthy();
    expect(screen.getByText("Natural Gas")).toBeTruthy();
    expect(screen.getByText("Gold")).toBeTruthy();
    expect(screen.getByText("Copper")).toBeTruthy();
    expect(screen.getByText("Soybeans")).toBeTruthy();
  });

  it("renders direction badges (LONG/SHORT)", () => {
    render(<CommodityRegimeWidget {...defaultProps} />);
    const longBadges = screen.getAllByText("LONG");
    const shortBadges = screen.getAllByText("SHORT");
    expect(longBadges.length).toBe(3); // WTI Crude, Gold, Copper
    expect(shortBadges.length).toBe(2); // Natural Gas, Soybeans
  });

  it("renders P&L values with formatting", () => {
    render(<CommodityRegimeWidget {...defaultProps} />);
    const bodyText = document.body.textContent || "";
    // Copper has negative P&L: $-18.4K (formatted with dollar sign before minus)
    expect(bodyText).toMatch(/\$-18\.4K/);
    // WTI Crude has positive P&L: +$58.0K
    expect(bodyText).toMatch(/\+\$58\.0K/);
  });
});
