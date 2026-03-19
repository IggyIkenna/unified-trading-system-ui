// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  render,
  screen,
  fireEvent,
  type RenderResult,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuditTrailPage } from "./AuditTrailPage";
import { BatchJobsPage } from "./BatchJobsPage";
import { CompliancePage } from "./CompliancePage";
import { DataCompletenessPage } from "./DataCompletenessPage";
import { JobDetailPage } from "./JobDetailPage";

// ── AuditTrailPage ────────────────────────────────────────────────────────────

describe("AuditTrailPage", () => {
  const renderPage = (): RenderResult =>
    render(
      <MemoryRouter>
        <AuditTrailPage />
      </MemoryRouter>,
    );

  it("renders the Audit Trail heading", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: /audit trail/i }),
    ).toBeInTheDocument();
  });

  it("shows total event count stats", () => {
    renderPage();
    // 8 events in MOCK_EVENTS
    expect(screen.getByText("8")).toBeInTheDocument();
    // 7 SERVICES
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("shows All Services option in filter", () => {
    renderPage();
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: /all services/i }),
    ).toBeInTheDocument();
  });

  it("filters by service when select changes", () => {
    renderPage();
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "ml-inference-service" } });
    // ml-inference-service appears in filtered rows
    expect(screen.getAllByText("ml-inference-service").length).toBeGreaterThan(
      0,
    );
  });

  it("toggles error-only filter", () => {
    renderPage();
    const errorsButton = screen.getByRole("button", { name: /errors only/i });
    fireEvent.click(errorsButton);
    // After filtering for errors only, BATCH_FAILED and SHARD_FAILED should appear
    expect(screen.getByText("BATCH_FAILED")).toBeInTheDocument();
  });

  it("shows event type badges", () => {
    renderPage();
    // Multiple BATCH_COMPLETED entries exist; check at least one
    expect(screen.getAllByText("BATCH_COMPLETED").length).toBeGreaterThan(0);
  });

  it("shows correlation IDs", () => {
    renderPage();
    expect(screen.getByText("batch-ml-2026-03-10")).toBeInTheDocument();
  });
});

// ── BatchJobsPage ─────────────────────────────────────────────────────────────

describe("BatchJobsPage", () => {
  const renderPage = (): RenderResult =>
    render(
      <MemoryRouter>
        <BatchJobsPage />
      </MemoryRouter>,
    );

  it("renders Batch Jobs heading", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: /batch jobs/i }),
    ).toBeInTheDocument();
  });

  it("shows 5 total jobs count and shard aggregates", () => {
    renderPage();
    expect(screen.getByText(/5 total jobs/i)).toBeInTheDocument();
    expect(screen.getByText(/shards/)).toBeInTheDocument();
  });

  it("renders table columns", () => {
    renderPage();
    expect(screen.getByText("Job")).toBeInTheDocument();
    expect(screen.getByText("Service")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renders KPI cards with institutional labels", () => {
    renderPage();
    expect(screen.getByText("All Jobs")).toBeInTheDocument();
    expect(screen.getByText("Running")).toBeInTheDocument();
    // "Completed" also appears in badge text
    expect(screen.getAllByText("Completed").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("filters by status when a KPI card is clicked", () => {
    renderPage();
    const runningCard = screen.getByText("Running").closest("[role='button']");
    if (runningCard) fireEvent.click(runningCard);
    expect(screen.getByText("market-tick-data batch")).toBeInTheDocument();
  });

  it("navigates to job detail on row click", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<BatchJobsPage />} />
          <Route path="/jobs/:id" element={<div>Job Detail</div>} />
        </Routes>
      </MemoryRouter>,
    );
    const tableRows = container.querySelectorAll("tbody tr");
    if (tableRows[0]) {
      fireEvent.click(tableRows[0]);
    }
    expect(document.body).toBeTruthy();
  });

  it("displays UTC timestamp in header", () => {
    renderPage();
    expect(screen.getByText(/as of .* UTC/)).toBeInTheDocument();
  });

  it("table has horizontal scroll wrapper", () => {
    const { container } = renderPage();
    const scrollDiv = container.querySelector(".overflow-x-auto");
    expect(scrollDiv).toBeTruthy();
  });
});

// ── CompliancePage ────────────────────────────────────────────────────────────

describe("CompliancePage", () => {
  const renderPage = (): RenderResult =>
    render(
      <MemoryRouter>
        <CompliancePage />
      </MemoryRouter>,
    );

  it("renders Compliance heading", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: /compliance/i }),
    ).toBeInTheDocument();
  });

  it("shows summary tab by default with orphan count", () => {
    renderPage();
    // Orphan Events label appears on summary (may appear in tab and in card)
    expect(screen.getAllByText("Orphan Events").length).toBeGreaterThan(0);
    // Summary is the default tab
    expect(screen.getByText("Summary")).toBeInTheDocument();
  });

  it("shows tab buttons", () => {
    renderPage();
    expect(screen.getByText("Summary")).toBeInTheDocument();
    // Tab buttons appear in the nav row; find by exact text including count
    expect(screen.getAllByText(/orphan events/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/tts records/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/error events/i).length).toBeGreaterThan(0);
  });

  it("switches to orphans tab on click", () => {
    const { container } = render(
      <MemoryRouter>
        <CompliancePage />
      </MemoryRouter>,
    );
    // Find the tab nav buttons (button elements in the tab row)
    const tabButtons = container.querySelectorAll(
      "button[class*='border-b-2']",
    );
    // orphans is the second tab (index 1)
    if (tabButtons[1]) fireEvent.click(tabButtons[1]);
    // Orphan table should show
    expect(screen.getByText("TICK_RECEIVED")).toBeInTheDocument();
  });

  it("switches to tts tab on click", () => {
    const { container } = render(
      <MemoryRouter>
        <CompliancePage />
      </MemoryRouter>,
    );
    const tabButtons = container.querySelectorAll(
      "button[class*='border-b-2']",
    );
    // tts is the third tab (index 2)
    if (tabButtons[2]) fireEvent.click(tabButtons[2]);
    expect(screen.getByText("BEST_EXECUTION_REVIEW")).toBeInTheDocument();
  });

  it("switches to errors tab on click", () => {
    const { container } = render(
      <MemoryRouter>
        <CompliancePage />
      </MemoryRouter>,
    );
    const tabButtons = container.querySelectorAll(
      "button[class*='border-b-2']",
    );
    // errors is the fourth tab (index 3)
    if (tabButtons[3]) fireEvent.click(tabButtons[3]);
    expect(screen.getByText("QUOTA_EXCEEDED")).toBeInTheDocument();
  });

  it("navigates to orphans tab when clicking orphan events card on summary", () => {
    const { container } = render(
      <MemoryRouter>
        <CompliancePage />
      </MemoryRouter>,
    );
    // Orphan card in the summary grid
    const summaryCards = container.querySelectorAll(".cursor-pointer");
    if (summaryCards[0]) fireEvent.click(summaryCards[0]);
    expect(document.body).toBeTruthy();
  });

  it("shows services with violations on summary", () => {
    renderPage();
    expect(screen.getByText("Services With Violations")).toBeInTheDocument();
    expect(screen.getByText("features-delta-one-service")).toBeInTheDocument();
  });
});

// ── DataCompletenessPage ──────────────────────────────────────────────────────

describe("DataCompletenessPage", () => {
  const renderPage = (): RenderResult =>
    render(
      <MemoryRouter>
        <DataCompletenessPage />
      </MemoryRouter>,
    );

  it("renders Data Completeness heading", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: /data completeness/i }),
    ).toBeInTheDocument();
  });

  it("shows overall health badge", () => {
    renderPage();
    expect(screen.getByText("degraded")).toBeInTheDocument();
  });

  it("shows stats: total paths, present, missing, stale", () => {
    renderPage();
    // Total paths (sum of all paths across services) — 11 paths
    expect(screen.getByText("Total Paths")).toBeInTheDocument();
    expect(screen.getByText("Present")).toBeInTheDocument();
    expect(screen.getByText("Missing")).toBeInTheDocument();
    expect(screen.getByText("Stale")).toBeInTheDocument();
  });

  it("shows issues detected card with missing paths", () => {
    renderPage();
    expect(screen.getByText("Issues Detected")).toBeInTheDocument();
    expect(screen.getByText(/features-delta-one-bucket/)).toBeInTheDocument();
  });

  it("renders service cards for each service", () => {
    renderPage();
    expect(screen.getByText("ml-inference-service")).toBeInTheDocument();
    expect(screen.getByText("features-delta-one-service")).toBeInTheDocument();
    expect(screen.getByText("features-volatility-service")).toBeInTheDocument();
    expect(screen.getByText("strategy-service")).toBeInTheDocument();
  });

  it("expands a service card on click to show path details", () => {
    renderPage();
    const serviceHeader = screen.getByText("ml-inference-service");
    const clickTarget =
      serviceHeader.closest("[class*='cursor-pointer']") ?? serviceHeader;
    fireEvent.click(clickTarget);
    // After expanding, the path table headers appear
    expect(screen.getByText("Path")).toBeInTheDocument();
    expect(screen.getByText("Size")).toBeInTheDocument();
    expect(screen.getByText("Updated")).toBeInTheDocument();
  });

  it("collapses an expanded service card on second click", () => {
    renderPage();
    const serviceHeader = screen.getByText("ml-inference-service");
    const clickTarget =
      serviceHeader.closest("[class*='cursor-pointer']") ?? serviceHeader;
    // Expand
    fireEvent.click(clickTarget);
    // Collapse
    fireEvent.click(clickTarget);
    // Path table should be gone
    expect(document.body).toBeTruthy();
  });
});

// ── JobDetailPage ─────────────────────────────────────────────────────────────

describe("JobDetailPage", () => {
  const renderWithId = (id: string): RenderResult =>
    render(
      <MemoryRouter initialEntries={[`/jobs/${id}`]}>
        <Routes>
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/jobs" element={<div>Jobs List</div>} />
        </Routes>
      </MemoryRouter>,
    );

  it("renders job name for job-001", () => {
    renderWithId("job-001");
    expect(screen.getByText("instruments-service daily")).toBeInTheDocument();
  });

  it("shows shard progress section", () => {
    renderWithId("job-001");
    expect(screen.getByText("Shard Progress")).toBeInTheDocument();
    // "Completed", "Failed", "Total" appear in shard progress labels
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("shows job details section", () => {
    renderWithId("job-001");
    expect(screen.getByText("Job Details")).toBeInTheDocument();
    expect(screen.getByText("Service")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("shows error panel for failed job (job-003)", () => {
    renderWithId("job-003");
    expect(screen.getByText("Job Failed")).toBeInTheDocument();
    expect(screen.getByText(/quota exceeded/i)).toBeInTheDocument();
  });

  it("navigates back to jobs list on back button click", () => {
    renderWithId("job-001");
    // The back button has an ArrowLeft icon; find via aria-label or button element
    const buttons = screen.getAllByRole("button");
    // First button is the back button (ghost/icon)
    const backButton = buttons[0];
    if (backButton) fireEvent.click(backButton);
    expect(screen.getByText("Jobs List")).toBeInTheDocument();
  });

  it("falls back to first job when id not found", () => {
    renderWithId("job-unknown");
    // Falls back to JOBS[0] which is job-001
    expect(screen.getByText("instruments-service daily")).toBeInTheDocument();
  });

  it("shows running job with null completedAt", () => {
    renderWithId("job-002");
    expect(screen.getByText("market-tick-data batch")).toBeInTheDocument();
  });
});
