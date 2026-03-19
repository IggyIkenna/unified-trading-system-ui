import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CompliancePage } from "./CompliancePage";

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
      <CompliancePage />
    </MemoryRouter>,
  );
}

describe("CompliancePage", () => {
  it("renders the page heading", () => {
    renderPage();
    expect(screen.getByText("Compliance")).toBeInTheDocument();
  });

  it("renders all four tab buttons", () => {
    renderPage();
    expect(
      screen.getByRole("button", { name: /summary/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /orphan events/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /tts records/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /error events/i }),
    ).toBeInTheDocument();
  });

  it("summary tab is active by default and shows counts", () => {
    renderPage();
    // Summary cards: orphan_event_count=4, tts_record_count=12, error_event_count=7
    // "4" appears both in the summary card and as a tab badge — use getAllByText
    expect(screen.getAllByText("4").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("12").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("7").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Orphan Events").length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getAllByText("TTS Records").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Error Events").length).toBeGreaterThanOrEqual(
      1,
    );
  });

  it("shows violation services in summary", () => {
    renderPage();
    expect(screen.getByText("Services With Violations")).toBeInTheDocument();
    expect(screen.getByText("features-delta-one-service")).toBeInTheDocument();
    expect(screen.getByText("market-tick-data-service")).toBeInTheDocument();
  });

  it("violation service badges have error variant", () => {
    renderPage();
    const violationBadge = screen.getByText("features-delta-one-service");
    expect(violationBadge).toHaveAttribute("data-variant", "error");
  });

  it("clicking Orphan Events tab shows orphan table", () => {
    renderPage();
    const orphanTab = screen.getByRole("button", { name: /orphan events/i });
    fireEvent.click(orphanTab);

    // Should show orphan rows
    expect(
      screen.getByText("No matching BATCH_STARTED correlation chain"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Parent BATCH_STARTED event missing — job terminated mid-run",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("TICK_RECEIVED")).toBeInTheDocument();
    expect(screen.getByText("SHARD_COMPLETED")).toBeInTheDocument();
    // Summary content should be gone
    expect(
      screen.queryByText("Services With Violations"),
    ).not.toBeInTheDocument();
  });

  it("clicking TTS Records tab shows TTS table with resolved/open badges", () => {
    renderPage();
    const ttsTab = screen.getByRole("button", { name: /tts records/i });
    fireEvent.click(ttsTab);

    expect(screen.getByText("BEST_EXECUTION_REVIEW")).toBeInTheDocument();
    expect(screen.getByText("RISK_LIMIT_BREACH")).toBeInTheDocument();
    expect(screen.getByText("ALGO_AUDIT")).toBeInTheDocument();

    const resolvedBadge = screen.getByText("resolved");
    expect(resolvedBadge).toHaveAttribute("data-variant", "success");
    const openBadges = screen.getAllByText("open");
    expect(openBadges.length).toBe(2);
    openBadges.forEach((b) => {
      expect(b).toHaveAttribute("data-variant", "warning");
    });
  });

  it("clicking Error Events tab shows error table", () => {
    renderPage();
    const errorsTab = screen.getByRole("button", { name: /error events/i });
    fireEvent.click(errorsTab);

    expect(screen.getByText("QUOTA_EXCEEDED")).toBeInTheDocument();
    expect(screen.getByText("UPSTREAM_DISCONNECT")).toBeInTheDocument();
    expect(screen.getByText("FEATURE_MISSING")).toBeInTheDocument();
    expect(
      screen.getByText("VM instance quota exhausted in asia-northeast1-c"),
    ).toBeInTheDocument();
    // Error code badges should have error variant
    expect(screen.getByText("QUOTA_EXCEEDED")).toHaveAttribute(
      "data-variant",
      "error",
    );
  });

  it("summary card click on Orphan Events navigates to orphans tab", () => {
    renderPage();
    // "Orphan Events" appears in both the tab button label and the summary card label.
    // Grab the first element whose text is exactly "Orphan Events" inside a DIV
    // (the summary card label), not a button (tab).
    const allOrphanEls = screen.getAllByText("Orphan Events");
    const cardLabel = allOrphanEls.find((el) => el.tagName !== "BUTTON");
    const card = cardLabel?.closest("div[class]")?.parentElement;
    if (card) fireEvent.click(card);

    expect(
      screen.getByText("No matching BATCH_STARTED correlation chain"),
    ).toBeInTheDocument();
  });

  it("summary card click on Error Events navigates to errors tab", () => {
    renderPage();
    const allErrorEls = screen.getAllByText("Error Events");
    const cardLabel = allErrorEls.find((el) => el.tagName !== "BUTTON");
    const card = cardLabel?.closest("div[class]")?.parentElement;
    if (card) fireEvent.click(card);

    expect(screen.getByText("QUOTA_EXCEEDED")).toBeInTheDocument();
  });
});
