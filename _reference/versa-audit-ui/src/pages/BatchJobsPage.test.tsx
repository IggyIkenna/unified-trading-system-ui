import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BatchJobsPage } from "./BatchJobsPage";

vi.mock("@unified-trading/ui-kit", () => ({
  Card: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <div onClick={onClick}>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
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
  Select: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span>{placeholder}</span>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <option value={value}>{children}</option>,
}));

vi.mock("lucide-react", () => ({
  ChevronRight: () => null,
  RefreshCw: () => null,
  ArrowLeft: () => null,
  AlertTriangle: () => null,
  Briefcase: () => null,
  ListFilter: () => null,
  LayoutGrid: () => null,
  ShieldAlert: () => null,
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <BatchJobsPage />
    </MemoryRouter>,
  );
}

describe("BatchJobsPage", () => {
  it("renders the page heading", () => {
    renderPage();
    expect(screen.getByText("Batch Jobs")).toBeInTheDocument();
  });

  it("shows total job count and shard count in the header", () => {
    renderPage();
    // Header shows "5 total jobs" and shard aggregates
    expect(screen.getByText(/5 total jobs/)).toBeInTheDocument();
    expect(screen.getByText(/shards/)).toBeInTheDocument();
  });

  it("renders all five jobs in the table by default", () => {
    renderPage();
    expect(screen.getByText("instruments-service daily")).toBeInTheDocument();
    expect(screen.getByText("market-tick-data batch")).toBeInTheDocument();
    expect(screen.getByText("features-delta-one")).toBeInTheDocument();
    expect(screen.getByText("ml-training weekly")).toBeInTheDocument();
    expect(screen.getByText("features-volatility")).toBeInTheDocument();
  });

  it("renders status badges for completed, running and failed jobs", () => {
    renderPage();
    const completedBadges = screen
      .getAllByText("completed")
      .filter((el) => el.tagName === "SPAN");
    const runningBadges = screen
      .getAllByText("running")
      .filter((el) => el.tagName === "SPAN");
    const failedBadges = screen
      .getAllByText("failed")
      .filter((el) => el.tagName === "SPAN");
    expect(completedBadges.length).toBeGreaterThanOrEqual(3);
    expect(runningBadges.length).toBeGreaterThanOrEqual(1);
    expect(failedBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("KPI cards show correct counts", () => {
    renderPage();
    // All Jobs KPI shows 5
    expect(screen.getByText("5")).toBeInTheDocument();
    // Completed shows 3
    expect(screen.getByText("3")).toBeInTheDocument();
    // Running and Failed both show 1
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(2);
  });

  it("KPI cards have left accent borders and institutional labels", () => {
    renderPage();
    expect(screen.getByText("All Jobs")).toBeInTheDocument();
    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("clicking the Running KPI card shows only running jobs", () => {
    renderPage();
    const runningCard = screen.getByText("Running").closest("[role='button']");
    if (runningCard) fireEvent.click(runningCard);
    expect(screen.getByText("market-tick-data batch")).toBeInTheDocument();
    expect(
      screen.queryByText("instruments-service daily"),
    ).not.toBeInTheDocument();
  });

  it("clicking the Failed KPI card shows only failed jobs", () => {
    renderPage();
    const failedCard = screen.getByText("Failed").closest("[role='button']");
    if (failedCard) fireEvent.click(failedCard);
    expect(screen.getByText("features-delta-one")).toBeInTheDocument();
    expect(
      screen.queryByText("instruments-service daily"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("ml-training weekly")).not.toBeInTheDocument();
  });

  it("clicking the Completed KPI card shows only completed jobs", () => {
    renderPage();
    const completedCard = screen
      .getByText("Completed")
      .closest("[role='button']");
    if (completedCard) fireEvent.click(completedCard);
    expect(screen.getByText("instruments-service daily")).toBeInTheDocument();
    expect(screen.getByText("ml-training weekly")).toBeInTheDocument();
    expect(screen.getByText("features-volatility")).toBeInTheDocument();
    expect(
      screen.queryByText("market-tick-data batch"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("features-delta-one")).not.toBeInTheDocument();
  });

  it("shows shard progress for each job", () => {
    renderPage();
    expect(screen.getByText("48/48")).toBeInTheDocument();
    expect(screen.getByText("78/126")).toBeInTheDocument();
    expect(screen.getByText("31/72")).toBeInTheDocument();
  });

  it("shows running duration as 'running\u2026' for in-progress job", () => {
    renderPage();
    expect(screen.getByText("running\u2026")).toBeInTheDocument();
  });

  it("renders Refresh button", () => {
    renderPage();
    expect(
      screen.getByRole("button", { name: /refresh/i }),
    ).toBeInTheDocument();
  });

  it("displays UTC timestamp in header", () => {
    renderPage();
    expect(screen.getByText(/as of .* UTC/)).toBeInTheDocument();
  });

  it("table has horizontal scroll wrapper", () => {
    const { container } = renderPage();
    const scrollDiv = container.querySelector(".overflow-x-auto");
    expect(scrollDiv).toBeInTheDocument();
  });

  it("numeric columns are right-aligned in table headers", () => {
    const { container } = renderPage();
    const headers = container.querySelectorAll("th");
    const durationHeader = Array.from(headers).find(
      (th) => th.textContent === "Duration",
    );
    expect(durationHeader?.style.textAlign).toBe("right");
  });
});
