import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BacktestComparisonPanel } from "@/components/signal-broadcast";
import { MOCK_BACKTEST_COMPARISON } from "@/lib/signal-broadcast";

describe("BacktestComparisonPanel", () => {
  it("renders the container with the canonical data-testid", () => {
    render(<BacktestComparisonPanel rows={MOCK_BACKTEST_COMPARISON} />);
    expect(
      screen.getByTestId("signal-broadcast-backtest-comparison-panel"),
    ).toBeInTheDocument();
  });

  it("renders one row per fixture slot", () => {
    render(<BacktestComparisonPanel rows={MOCK_BACKTEST_COMPARISON} />);
    for (const row of MOCK_BACKTEST_COMPARISON) {
      expect(
        screen.getByTestId(`backtest-row-${row.slot_label}`),
      ).toBeInTheDocument();
    }
  });

  it("formats the sharpe + return correctly", () => {
    render(<BacktestComparisonPanel rows={MOCK_BACKTEST_COMPARISON} />);
    // Fixture slot 0 = sharpe 1.82, return 14.3%.
    expect(screen.getByText("1.82")).toBeInTheDocument();
    expect(screen.getByText("14.3%")).toBeInTheDocument();
  });
});
