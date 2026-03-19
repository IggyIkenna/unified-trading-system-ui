import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeploymentFrequencyChart } from "./DeploymentFrequencyChart";

vi.mock("./ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card">{children}</div>
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
}));

describe("DeploymentFrequencyChart", () => {
  it("renders the card with correct title", () => {
    render(<DeploymentFrequencyChart />);
    expect(screen.getByText("Deployment Frequency (7d)")).toBeInTheDocument();
  });

  it("renders the chart container", () => {
    render(<DeploymentFrequencyChart />);
    expect(
      screen.getByTestId("deployment-frequency-chart"),
    ).toBeInTheDocument();
  });

  it("renders a BarChart", () => {
    render(<DeploymentFrequencyChart />);
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("renders bars for successful, failed, and rolled_back", () => {
    render(<DeploymentFrequencyChart />);
    expect(screen.getByTestId("bar-successful")).toBeInTheDocument();
    expect(screen.getByTestId("bar-failed")).toBeInTheDocument();
    expect(screen.getByTestId("bar-rolled_back")).toBeInTheDocument();
  });

  it("renders the total deploys count", () => {
    render(<DeploymentFrequencyChart />);
    // 8+1+0 + 12+0+1 + 6+2+0 + 15+0+0 + 10+1+1 + 4+0+0 + 9+0+0 = 70
    expect(screen.getByText("70")).toBeInTheDocument();
  });

  it("renders the success rate (excludes failed + rolled_back)", () => {
    render(<DeploymentFrequencyChart />);
    // (70 - 4 failed - 3 rolled_back) / 70 * 100 = 90.0%
    expect(screen.getByText("90.0%")).toBeInTheDocument();
  });

  it("renders axes", () => {
    render(<DeploymentFrequencyChart />);
    expect(screen.getByTestId("x-axis")).toBeInTheDocument();
    expect(screen.getByTestId("y-axis")).toBeInTheDocument();
  });

  it("renders legend", () => {
    render(<DeploymentFrequencyChart />);
    expect(screen.getByTestId("legend")).toBeInTheDocument();
  });

  it("renders the responsive container", () => {
    render(<DeploymentFrequencyChart />);
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });
});
