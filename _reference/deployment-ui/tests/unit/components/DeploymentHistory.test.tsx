// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";

vi.mock("../../../src/api/client", () => ({
  getDeployments: vi.fn(),
  bulkDeleteDeployments: vi.fn(),
  cancelDeployment: vi.fn(),
  updateDeploymentTag: vi.fn(),
}));

import { getDeployments } from "../../../src/api/client";
import { DeploymentHistory } from "../../../src/components/DeploymentHistory";

function makeDeployment(overrides: Record<string, unknown> = {}) {
  return {
    id: "dep-001",
    service: "instruments-service",
    status: "completed",
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T11:00:00Z",
    total_shards: 10,
    completed_shards: 10,
    failed_shards: 0,
    parameters: { compute: "vm", mode: "batch" },
    ...overrides,
  };
}

describe("DeploymentHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading spinner initially", async () => {
    let resolveRef!: (v: unknown) => void;
    (getDeployments as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise((r) => (resolveRef = r)),
    );
    render(<DeploymentHistory serviceName="instruments-service" />);
    // Loading state renders a spinner (Loader2 svg) inside the card
    const card = document.querySelector("svg");
    expect(card).toBeTruthy();
    await act(async () => resolveRef({ deployments: [] }));
  });

  it("renders deployment rows after data loads", async () => {
    (getDeployments as ReturnType<typeof vi.fn>).mockResolvedValue({
      deployments: [makeDeployment()],
    });
    render(<DeploymentHistory serviceName="instruments-service" />);
    await waitFor(() => {
      expect(screen.getByText("dep-001")).toBeTruthy();
    });
  });

  it("shows Completed status badge", async () => {
    (getDeployments as ReturnType<typeof vi.fn>).mockResolvedValue({
      deployments: [makeDeployment({ status: "completed" })],
    });
    render(<DeploymentHistory serviceName="instruments-service" />);
    await waitFor(() => {
      expect(screen.getByText("Completed")).toBeTruthy();
    });
  });

  it("shows Running status badge for running deployment", async () => {
    (getDeployments as ReturnType<typeof vi.fn>).mockResolvedValue({
      deployments: [
        makeDeployment({
          id: "dep-002",
          status: "running",
          completed_shards: 3,
          total_shards: 10,
        }),
      ],
    });
    render(<DeploymentHistory serviceName="instruments-service" />);
    await waitFor(() => {
      expect(screen.getByText("Running")).toBeTruthy();
    });
  });

  it("shows Failed status badge", async () => {
    (getDeployments as ReturnType<typeof vi.fn>).mockResolvedValue({
      deployments: [makeDeployment({ id: "dep-003", status: "failed" })],
    });
    render(<DeploymentHistory serviceName="instruments-service" />);
    await waitFor(() => {
      expect(screen.getByText("Failed")).toBeTruthy();
    });
  });

  it("shows error message on API failure", async () => {
    (getDeployments as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error"),
    );
    render(<DeploymentHistory serviceName="instruments-service" />);
    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeTruthy();
    });
  });

  it("shows empty state when no deployments", async () => {
    (getDeployments as ReturnType<typeof vi.fn>).mockResolvedValue({
      deployments: [],
    });
    render(<DeploymentHistory serviceName="instruments-service" />);
    await waitFor(() => {
      expect(screen.getByText(/No deployments/i)).toBeTruthy();
    });
  });

  it("renders progress as completed/total", async () => {
    (getDeployments as ReturnType<typeof vi.fn>).mockResolvedValue({
      deployments: [makeDeployment({ completed_shards: 7, total_shards: 10 })],
    });
    render(<DeploymentHistory serviceName="instruments-service" />);
    await waitFor(() => {
      expect(screen.getByText("7/10")).toBeTruthy();
    });
  });

  it("renders LIVE badge for live mode deployment", async () => {
    (getDeployments as ReturnType<typeof vi.fn>).mockResolvedValue({
      deployments: [
        makeDeployment({
          id: "dep-live",
          parameters: { compute: "cloud_run", mode: "live" },
        }),
      ],
    });
    render(<DeploymentHistory serviceName="instruments-service" />);
    await waitFor(() => {
      expect(screen.getByText("LIVE")).toBeTruthy();
    });
  });
});
