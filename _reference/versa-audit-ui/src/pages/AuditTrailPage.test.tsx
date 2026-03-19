import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuditTrailPage } from "./AuditTrailPage";

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
    variant,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: string;
  }) => (
    <button data-variant={variant} onClick={onClick}>
      {children}
    </button>
  ),
  Select: ({
    children,
    onValueChange,
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (v: string) => void;
  }) => (
    <select
      onChange={(e) => onValueChange?.(e.target.value)}
      defaultValue="all"
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
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
      <AuditTrailPage />
    </MemoryRouter>,
  );
}

describe("AuditTrailPage", () => {
  it("renders the page heading", () => {
    renderPage();
    expect(screen.getByText("Audit Trail")).toBeInTheDocument();
  });

  it("shows total event count in the subtitle", () => {
    renderPage();
    expect(screen.getByText(/8 events today/)).toBeInTheDocument();
  });

  it("renders summary stat cards with correct counts", () => {
    renderPage();
    expect(screen.getByText("Total Events")).toBeInTheDocument();
    expect(screen.getByText("Errors")).toBeInTheDocument();
    expect(screen.getByText("Services")).toBeInTheDocument();
    // 8 total events, 2 errors, 7 services
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("renders all events in the table by default", () => {
    renderPage();
    expect(
      screen.getByText("Batch inference completed: 1,248 signals generated"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Quota exceeded: VM instance quota in asia-northeast1-c",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Health check passed: model loaded, features available"),
    ).toBeInTheDocument();
  });

  it("renders BATCH_COMPLETED badge with success variant for non-error events", () => {
    renderPage();
    const completedBadges = screen
      .getAllByText("BATCH_COMPLETED")
      .filter((el) => el.hasAttribute("data-variant"));
    // evt-001 and evt-005 and evt-008 are BATCH_COMPLETED and non-error -> success
    completedBadges.forEach((badge) => {
      expect(badge).toHaveAttribute("data-variant", "success");
    });
  });

  it("renders BATCH_FAILED badge with error variant", () => {
    renderPage();
    const failedBadge = screen.getByText("BATCH_FAILED");
    expect(failedBadge).toHaveAttribute("data-variant", "error");
  });

  it("renders SHARD_FAILED badge with error variant", () => {
    renderPage();
    const shardFailedBadge = screen.getByText("SHARD_FAILED");
    expect(shardFailedBadge).toHaveAttribute("data-variant", "error");
  });

  it("renders BATCH_STARTED badge with running variant", () => {
    renderPage();
    const startedBadge = screen.getByText("BATCH_STARTED");
    expect(startedBadge).toHaveAttribute("data-variant", "running");
  });

  it("filters events by service using the select dropdown", () => {
    renderPage();
    const select = screen.getByRole("combobox");
    fireEvent.change(select, {
      target: { value: "ml-inference-service" },
    });
    // ml-inference-service has evt-001, evt-007 — messages:
    expect(
      screen.getByText("Batch inference completed: 1,248 signals generated"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Health check passed: model loaded, features available"),
    ).toBeInTheDocument();
    // strategy-service event should not appear
    expect(
      screen.queryByText(
        "Strategy batch started: date=2026-03-10, category=all",
      ),
    ).not.toBeInTheDocument();
  });

  it("errors-only toggle hides non-error events", () => {
    renderPage();
    // The errors-only toggle is now a checkbox inside a <label class="toggle-switch">
    const errorsOnlyCheckbox = screen.getByRole("checkbox");
    fireEvent.click(errorsOnlyCheckbox);

    // Only error events should remain: evt-002, evt-006
    expect(
      screen.getByText(
        "Quota exceeded: VM instance quota in asia-northeast1-c",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Shard 42 failed: upstream WebSocket disconnect"),
    ).toBeInTheDocument();
    // Non-error events should be gone
    expect(
      screen.queryByText("Batch inference completed: 1,248 signals generated"),
    ).not.toBeInTheDocument();
  });

  it("re-clicking errors-only toggle restores all events", () => {
    renderPage();
    const errorsOnlyCheckbox = screen.getByRole("checkbox");
    fireEvent.click(errorsOnlyCheckbox);
    fireEvent.click(errorsOnlyCheckbox);

    expect(
      screen.getByText("Batch inference completed: 1,248 signals generated"),
    ).toBeInTheDocument();
  });
});
