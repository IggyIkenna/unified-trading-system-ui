import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { JobCompletionChart } from "./JobCompletionChart";

vi.mock("@unified-trading/ui-kit", () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
  ),
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

vi.mock("recharts", () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <svg data-testid="bar-chart">{children}</svg>
  ),
  Bar: ({ dataKey, name }: { dataKey: string; name: string }) => (
    <g data-testid={`bar-${dataKey}`} data-name={name} />
  ),
  XAxis: () => <g data-testid="x-axis" />,
  YAxis: () => <g data-testid="y-axis" />,
  CartesianGrid: () => <g data-testid="cartesian-grid" />,
  Tooltip: () => <g data-testid="tooltip" />,
  Legend: () => <g data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Cell: () => <rect data-testid="cell" />,
}));

describe("JobCompletionChart", () => {
  it("renders the card with correct title", () => {
    render(<JobCompletionChart />);
    expect(screen.getByText("Shard Completion by Job")).toBeInTheDocument();
  });

  it("renders the chart container", () => {
    render(<JobCompletionChart />);
    expect(screen.getByTestId("job-completion-chart")).toBeInTheDocument();
  });

  it("renders a BarChart", () => {
    render(<JobCompletionChart />);
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("renders bars for completed, failed, and pending", () => {
    render(<JobCompletionChart />);
    expect(screen.getByTestId("bar-shards_completed")).toBeInTheDocument();
    expect(screen.getByTestId("bar-shards_failed")).toBeInTheDocument();
    expect(screen.getByTestId("bar-shards_pending")).toBeInTheDocument();
  });

  it("renders the total shards count", () => {
    render(<JobCompletionChart />);
    // 48+0+0 + 78+0+48 + 31+8+33 + 12+0+0 + 96+2+22 + 18+0+6 + 36+1+3 = 442
    expect(screen.getByText("442")).toBeInTheDocument();
  });

  it("renders the total failed count", () => {
    render(<JobCompletionChart />);
    // 0 + 0 + 8 + 0 + 2 + 0 + 1 = 11
    expect(screen.getByText("11")).toBeInTheDocument();
  });

  it("renders axes", () => {
    render(<JobCompletionChart />);
    expect(screen.getByTestId("x-axis")).toBeInTheDocument();
    expect(screen.getByTestId("y-axis")).toBeInTheDocument();
  });

  it("renders legend", () => {
    render(<JobCompletionChart />);
    expect(screen.getByTestId("legend")).toBeInTheDocument();
  });

  it("renders the responsive container", () => {
    render(<JobCompletionChart />);
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });
});
