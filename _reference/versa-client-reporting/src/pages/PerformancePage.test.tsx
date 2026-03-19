import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { PerformancePage } from "./PerformancePage";

vi.mock("recharts", () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ReferenceLine: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const mockData = {
  period: "2026 Q1",
  totalReturn: 0.035,
  sharpe: 1.42,
  maxDrawdown: 0.012,
  byClient: [
    { client: "Client A", return: 0.035, allocation: 0.6 },
    { client: "Client B", return: -0.012, allocation: 0.4 },
  ],
  monthly: [
    { month: "2026-01", return: 0.035 },
    { month: "2026-02", return: -0.012 },
  ],
};

// Use empty summary by default so fetch completes and cleanup works
beforeEach(() =>
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(null),
  } as Response),
);

describe("PerformancePage", () => {
  it("renders loading state initially", () => {
    render(<PerformancePage />);
    expect(screen.getByText(/Loading performance/i)).toBeInTheDocument();
  });

  it("renders heading after data loads", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockData),
    } as unknown as Response);
    render(<PerformancePage />);
    await waitFor(() => screen.getByText(/Performance — 2026 Q1/));
    expect(screen.getByText(/Performance — 2026 Q1/)).toBeInTheDocument();
  });

  it("renders chart container after data loads", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockData),
    } as unknown as Response);
    render(<PerformancePage />);
    await waitFor(() => screen.getByTestId("bar-chart"));
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("renders sharpe ratio and drawdown", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockData),
    } as unknown as Response);
    render(<PerformancePage />);
    await waitFor(() => screen.getByText("1.42"));
    expect(screen.getByText("1.42")).toBeInTheDocument();
  });
});
