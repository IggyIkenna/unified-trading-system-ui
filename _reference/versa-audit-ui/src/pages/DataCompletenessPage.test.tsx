import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DataCompletenessPage } from "./DataCompletenessPage";

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
  CardHeader: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <div onClick={onClick}>{children}</div>,
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
      <DataCompletenessPage />
    </MemoryRouter>,
  );
}

describe("DataCompletenessPage", () => {
  it("renders the page heading", () => {
    renderPage();
    expect(screen.getByText("Data Completeness")).toBeInTheDocument();
  });

  it("shows the date in the subtitle", () => {
    renderPage();
    expect(
      screen.getByText(/GCS path presence grid — 2026-03-10/),
    ).toBeInTheDocument();
  });

  it("renders overall health badge with 'degraded'", () => {
    renderPage();
    const healthBadge = screen.getByText("degraded");
    expect(healthBadge).toBeInTheDocument();
    expect(healthBadge).toHaveAttribute("data-variant", "warning");
  });

  it("renders summary stat cards with correct path counts", () => {
    renderPage();
    // Total paths: ml-inference(3) + delta-one(2) + volatility(2) + strategy(2) = 9
    expect(screen.getByText("Total Paths")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    // Present: 7 (excluding 1 missing + 1 stale)
    expect(screen.getByText("Present")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    // Missing: 2 (from missing_paths array)
    expect(screen.getByText("Missing")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    // Stale: 1
    expect(screen.getByText("Stale")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows Issues Detected card with missing paths", () => {
    renderPage();
    expect(screen.getByText("Issues Detected")).toBeInTheDocument();
    expect(
      screen.getByText(
        "gs://features-delta-one-bucket/batch/2026-03-10/features.parquet",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "gs://features-onchain-bucket/batch/2026-03-10/onchain_features.parquet",
      ),
    ).toBeInTheDocument();
  });

  it("shows Issues Detected card with stale paths", () => {
    renderPage();
    expect(
      screen.getByText(
        "gs://ml-inference-bucket/live/events/2026-03-10/ml-inference-service/",
      ),
    ).toBeInTheDocument();
    // The stale badge should appear
    const staleBadges = screen
      .getAllByText("stale")
      .filter((el) => el.tagName === "SPAN");
    expect(staleBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the missing badge in Issues Detected", () => {
    renderPage();
    const missingBadges = screen
      .getAllByText("missing")
      .filter((el) => el.tagName === "SPAN");
    expect(missingBadges.length).toBeGreaterThanOrEqual(1);
    missingBadges.forEach((b) => {
      expect(b).toHaveAttribute("data-variant", "error");
    });
  });

  it("renders service names as collapsed cards by default", () => {
    renderPage();
    expect(screen.getByText("ml-inference-service")).toBeInTheDocument();
    expect(screen.getByText("features-delta-one-service")).toBeInTheDocument();
    expect(screen.getByText("features-volatility-service")).toBeInTheDocument();
    expect(screen.getByText("strategy-service")).toBeInTheDocument();
    // Expanded table content should NOT be visible yet
    expect(
      screen.queryByText("batch/2026-03-10/signals.parquet"),
    ).not.toBeInTheDocument();
  });

  it("clicking a service card expands it to show path detail table", () => {
    renderPage();
    const serviceTitle = screen.getByText("ml-inference-service");
    // The CardHeader wraps the title and has the onClick
    const cardHeader = serviceTitle.closest("div");
    if (cardHeader) fireEvent.click(cardHeader);

    expect(
      screen.getByText("batch/2026-03-10/signals.parquet"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("live/events/2026-03-10/ml-inference-service/"),
    ).toBeInTheDocument();
    expect(screen.getByText("12.4 MB")).toBeInTheDocument();
    expect(screen.getByText("0.8 MB")).toBeInTheDocument();
  });

  it("clicking expanded service card again collapses it", () => {
    renderPage();
    const serviceTitle = screen.getByText("ml-inference-service");
    const cardHeader = serviceTitle.closest("div");
    if (cardHeader) {
      fireEvent.click(cardHeader);
      // Now expanded — click again to collapse
      fireEvent.click(cardHeader);
    }
    expect(
      screen.queryByText("batch/2026-03-10/signals.parquet"),
    ).not.toBeInTheDocument();
  });

  it("missing path row shows em-dash for size and updated_at when null", () => {
    renderPage();
    const serviceTitle = screen.getByText("features-delta-one-service");
    const cardHeader = serviceTitle.closest("div");
    if (cardHeader) fireEvent.click(cardHeader);

    expect(
      screen.getByText("batch/2026-03-10/features.parquet"),
    ).toBeInTheDocument();
    // null size_mb and null updated_at both render as "—"
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });
});
