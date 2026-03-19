import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PerformanceTab } from "./PerformanceTab";

vi.mock("@unified-trading/ui-kit", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("PerformanceTab", () => {
  it('renders "Performance Summary"', () => {
    render(<PerformanceTab />);
    expect(screen.getByText("Performance Summary")).toBeInTheDocument();
  });

  it("shows +18.7% total return", () => {
    render(<PerformanceTab />);
    expect(screen.getByText("+18.7%")).toBeInTheDocument();
    expect(screen.getByText("Total Return")).toBeInTheDocument();
  });

  it("shows 2.34 sharpe ratio", () => {
    render(<PerformanceTab />);
    expect(screen.getByText("2.34")).toBeInTheDocument();
    expect(screen.getByText("Sharpe Ratio")).toBeInTheDocument();
  });

  it("shows -4.2% max drawdown", () => {
    render(<PerformanceTab />);
    expect(screen.getByText("-4.2%")).toBeInTheDocument();
    expect(screen.getByText("Max Drawdown")).toBeInTheDocument();
  });

  it("renders all 3 client names", () => {
    render(<PerformanceTab />);
    expect(screen.getByText("Apex Capital")).toBeInTheDocument();
    expect(screen.getByText("Meridian Fund")).toBeInTheDocument();
    expect(screen.getByText("QuantEdge HK")).toBeInTheDocument();
  });

  it("renders allocation percentages", () => {
    render(<PerformanceTab />);
    expect(screen.getByText("45%")).toBeInTheDocument();
    expect(screen.getByText("35%")).toBeInTheDocument();
    expect(screen.getByText("20%")).toBeInTheDocument();
  });
});
