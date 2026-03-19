import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { ReportsPage } from "./ReportsPage";

vi.mock("@unified-trading/ui-kit", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Badge: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => <span data-variant={variant}>{children}</span>,
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock("lucide-react", () => ({
  Download: () => <span>Download</span>,
  Send: () => <span>Send</span>,
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const mockReports = [
  {
    id: "r1",
    name: "Q1 Executive Summary",
    client: "Acme Corp",
    type: "executive_summary",
    status: "delivered",
    period: "2026-02",
    generatedAt: "2026-02-28T10:00:00Z",
    deliveredAt: "2026-02-28T12:00:00Z",
  },
  {
    id: "r2",
    name: "BTC Investor Note",
    client: "Beta Fund",
    type: "btc_investor_note",
    status: "pending",
    period: "2026-01",
    generatedAt: "2026-01-31T10:00:00Z",
    deliveredAt: null,
  },
];

beforeEach(() => {
  mockFetch.mockReset();
});

describe("ReportsPage", () => {
  it("shows loading state initially", async () => {
    let resolveRef!: (v: Response) => void;
    mockFetch.mockReturnValue(new Promise<Response>((r) => (resolveRef = r)));
    render(<ReportsPage />);
    expect(screen.getByText(/Loading reports/i)).toBeInTheDocument();
    await act(async () =>
      resolveRef({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      } as Response),
    );
  });

  it("renders reports table after fetch", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockReports),
    } as Response);
    render(<ReportsPage />);
    await waitFor(() => screen.getByText("2026-02"));
    expect(screen.getByText("Q1 Executive Summary")).toBeInTheDocument();
    expect(screen.getByText("2026-01")).toBeInTheDocument();
  });

  it("renders heading", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    } as Response);
    render(<ReportsPage />);
    await waitFor(() => screen.getByText("Client Reports"));
  });

  it("renders Download button for each report", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockReports),
    } as Response);
    render(<ReportsPage />);
    await waitFor(() => screen.getByText("Q1 Executive Summary"));
    const downloadButtons = screen.getAllByRole("button");
    expect(downloadButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("renders KPI cards with correct labels after fetch", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockReports),
    } as Response);
    render(<ReportsPage />);
    await waitFor(() => screen.getByText("Q1 Executive Summary"));
    expect(screen.getByText("Total Reports")).toBeInTheDocument();
    expect(screen.getByText("Clients")).toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
    expect(screen.getByText("Date Range")).toBeInTheDocument();
  });

  it("KPI cards show correct counts", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockReports),
    } as Response);
    render(<ReportsPage />);
    await waitFor(() => screen.getByText("Q1 Executive Summary"));
    // Total Reports = 2, Clients = 2 (both unique reports and clients)
    expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(2);
    // Delivered = 1
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
  });

  it("shows date range across report periods", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockReports),
    } as Response);
    render(<ReportsPage />);
    await waitFor(() => screen.getByText("Q1 Executive Summary"));
    // Date range: 2026-01 - 2026-02 (rendered with en-dash between)
    expect(screen.getByText(/2026-01.*2026-02/)).toBeInTheDocument();
  });

  it("displays UTC timestamp in header", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockReports),
    } as Response);
    render(<ReportsPage />);
    await waitFor(() => screen.getByText("Q1 Executive Summary"));
    expect(screen.getByText(/as of .* UTC/)).toBeInTheDocument();
  });

  it("table has horizontal scroll wrapper", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockReports),
    } as Response);
    const { container } = render(<ReportsPage />);
    await waitFor(() => screen.getByText("Q1 Executive Summary"));
    const scrollDiv = container.querySelector(".overflow-x-auto");
    expect(scrollDiv).toBeTruthy();
  });

  it("Generated column header is right-aligned", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockReports),
    } as Response);
    const { container } = render(<ReportsPage />);
    await waitFor(() => screen.getByText("Q1 Executive Summary"));
    const headers = container.querySelectorAll("th");
    const genHeader = Array.from(headers).find(
      (th) => th.textContent === "Generated",
    );
    expect(genHeader?.style.textAlign).toBe("right");
  });
});
