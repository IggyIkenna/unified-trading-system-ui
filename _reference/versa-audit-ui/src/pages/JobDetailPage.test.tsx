import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { JobDetailPage } from "./JobDetailPage";

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

function renderJob(jobId: string) {
  return render(
    <MemoryRouter initialEntries={[`/jobs/${jobId}`]}>
      <Routes>
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/jobs" element={<div>Jobs List</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("JobDetailPage", () => {
  it("renders job name for job-001", () => {
    renderJob("job-001");
    expect(screen.getByText("instruments-service daily")).toBeInTheDocument();
  });

  it("shows job-001 service and id metadata", () => {
    renderJob("job-001");
    expect(
      screen.getByText(/job-001 · instruments-service/),
    ).toBeInTheDocument();
  });

  it("renders 'completed' status badge for job-001", () => {
    renderJob("job-001");
    const badge = screen.getByText("completed");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("data-variant", "success");
  });

  it("shows shard progress section for job-001 with correct counts", () => {
    renderJob("job-001");
    expect(screen.getByText("Shard Progress")).toBeInTheDocument();
    // shardsCompleted = 48, shardsFailed = 0, shardsTotal = 48
    // Both completed and total are "48" so use getAllByText
    expect(screen.getAllByText("48").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("shows Job Details card with service, category, date fields", () => {
    renderJob("job-001");
    expect(screen.getByText("Job Details")).toBeInTheDocument();
    expect(screen.getByText("Service")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("equity")).toBeInTheDocument();
    expect(screen.getByText("2026-03-09")).toBeInTheDocument();
  });

  it("shows error banner for failed job-003", () => {
    renderJob("job-003");
    expect(screen.getByText("Job Failed")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Quota exceeded: VM instance quota in asia-northeast1-c",
      ),
    ).toBeInTheDocument();
  });

  it("does not show error banner for successful job-001", () => {
    renderJob("job-001");
    expect(screen.queryByText("Job Failed")).not.toBeInTheDocument();
  });

  it("renders back button that navigates to /jobs", () => {
    renderJob("job-001");
    const backBtn = screen.getByRole("button");
    fireEvent.click(backBtn);
    expect(screen.getByText("Jobs List")).toBeInTheDocument();
  });

  it("shows 'running' status badge for job-002", () => {
    renderJob("job-002");
    const badge = screen.getByText("running");
    expect(badge).toHaveAttribute("data-variant", "running");
  });

  it("shows em-dash for Completed field when job has no completedAt (job-002)", () => {
    renderJob("job-002");
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
