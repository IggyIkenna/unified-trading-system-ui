import { render, screen } from "@testing-library/react";
import { DeFiBasisTradeWidget } from "@/components/widgets/defi/defi-basis-trade-widget";

/**
 * DeFiBasisTradeWidget requires the DeFi data context for executeDeFiOrder
 * and tradeHistory. We mock the context hook to isolate widget behavior.
 */
vi.mock("@/components/widgets/defi/defi-data-context", () => ({
  useDeFiData: () => ({
    executeDeFiOrder: vi.fn(),
    tradeHistory: [],
  }),
}));

const defaultProps = { instanceId: "test-basis" };

describe("DeFiBasisTradeWidget", { timeout: 30000 }, () => {
  it("renders without crashing", () => {
    const { container } = render(<DeFiBasisTradeWidget {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it("renders asset selection", () => {
    render(<DeFiBasisTradeWidget {...defaultProps} />);
    expect(screen.getByText("Asset")).toBeTruthy();
  });

  it("renders capital input field", () => {
    render(<DeFiBasisTradeWidget {...defaultProps} />);
    expect(screen.getByText("Capital Amount (USDT)")).toBeTruthy();
    const capitalInput = screen.getByTestId("capital-input");
    expect(capitalInput).toBeTruthy();
  });

  it("renders slippage input field", () => {
    render(<DeFiBasisTradeWidget {...defaultProps} />);
    expect(screen.getByText("Max Slippage (bps)")).toBeTruthy();
    const slippageInput = screen.getByTestId("slippage-input");
    expect(slippageInput).toBeTruthy();
  });

  it("renders hedge ratio input field", () => {
    render(<DeFiBasisTradeWidget {...defaultProps} />);
    expect(screen.getByText("Hedge Ratio (%)")).toBeTruthy();
    const hedgeInput = screen.getByTestId("hedge-ratio-input");
    expect(hedgeInput).toBeTruthy();
  });

  it("renders operation selection", () => {
    render(<DeFiBasisTradeWidget {...defaultProps} />);
    expect(screen.getByText("Operation")).toBeTruthy();
  });

  it("renders strategy metrics section", () => {
    render(<DeFiBasisTradeWidget {...defaultProps} />);
    expect(screen.getByText("Strategy Metrics")).toBeTruthy();
    expect(screen.getByText("Expected Output")).toBeTruthy();
    expect(screen.getByText("Margin Usage")).toBeTruthy();
    expect(screen.getByText("Funding APY")).toBeTruthy();
    expect(screen.getByText("Cost of Carry")).toBeTruthy();
    expect(screen.getByText("Net APY")).toBeTruthy();
    expect(screen.getByText("Breakeven Funding")).toBeTruthy();
  });

  it("renders execute button", () => {
    render(<DeFiBasisTradeWidget {...defaultProps} />);
    const executeButton = screen.getByTestId("execute-button");
    expect(executeButton).toBeTruthy();
    expect(executeButton.textContent).toMatch(/Execute/);
  });

  it("renders trade history section", () => {
    render(<DeFiBasisTradeWidget {...defaultProps} />);
    expect(screen.getByText("Trade History (0 trades)")).toBeTruthy();
  });

  it("renders profitability badge", () => {
    render(<DeFiBasisTradeWidget {...defaultProps} />);
    const bodyText = document.body.textContent || "";
    // Should show either Profitable or Unprofitable
    expect(bodyText).toMatch(/Profitable|Unprofitable/);
  });
});
