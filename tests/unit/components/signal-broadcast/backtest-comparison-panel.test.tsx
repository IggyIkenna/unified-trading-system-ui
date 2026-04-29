import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BacktestComparisonPanel } from "@/components/signal-broadcast";
import { MOCK_BACKTEST_PAPER_LIVE } from "@/lib/signal-broadcast";

describe("BacktestComparisonPanel (backtest / paper / live)", () => {
  it("renders the container with the canonical data-testid", () => {
    render(<BacktestComparisonPanel rows={MOCK_BACKTEST_PAPER_LIVE} />);
    expect(screen.getByTestId("signal-broadcast-backtest-comparison-panel")).toBeInTheDocument();
  });

  it("renders one row per fixture slot", () => {
    render(<BacktestComparisonPanel rows={MOCK_BACKTEST_PAPER_LIVE} />);
    for (const row of MOCK_BACKTEST_PAPER_LIVE) {
      expect(screen.getByTestId(`backtest-row-${row.slot_label}`)).toBeInTheDocument();
    }
  });

  it("formats backtest sharpe + return correctly", () => {
    render(<BacktestComparisonPanel rows={MOCK_BACKTEST_PAPER_LIVE} />);
    // Fixture slot 0 — backtest sharpe 1.82, return 14.3%.
    expect(screen.getByText("1.82")).toBeInTheDocument();
    expect(screen.getByText("14.3%")).toBeInTheDocument();
  });

  it("renders paper columns (sharpe + return + signals)", () => {
    render(<BacktestComparisonPanel rows={MOCK_BACKTEST_PAPER_LIVE} />);
    // Fixture slot 0 — paper sharpe 1.64, return 12.1%, signals 108.
    expect(screen.getByText("1.64")).toBeInTheDocument();
    expect(screen.getByText("12.1%")).toBeInTheDocument();
    expect(screen.getByText("108")).toBeInTheDocument();
  });

  it("renders dash for null paper metrics on BACKTESTED-only slots", () => {
    render(<BacktestComparisonPanel rows={MOCK_BACKTEST_PAPER_LIVE} />);
    // Component renders ASCII hyphen "-" for each null cell. With 3 null
    // paper cells per BACKTESTED-only slot + 1 null live_return cell,
    // expect at least 4 dashes visible.
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });

  it("shows the shared period window", () => {
    render(<BacktestComparisonPanel rows={MOCK_BACKTEST_PAPER_LIVE} />);
    const windowEl = screen.getByTestId("backtest-comparison-window");
    expect(windowEl.textContent).toMatch(/Window: \d{4}-\d{2}-\d{2} → \d{4}-\d{2}-\d{2}/);
  });

  it("renders the three-way section headings", () => {
    render(<BacktestComparisonPanel rows={MOCK_BACKTEST_PAPER_LIVE} />);
    expect(screen.getByText("Backtest")).toBeInTheDocument();
    expect(screen.getByText("Paper")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
  });
});
