import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HealthStatusBar } from "./health-status-bar";

// Mock import.meta.env for mock mode tests
const mockEnv = { VITE_MOCK_API: "false" };
vi.stubGlobal("import", { meta: { env: mockEnv } });

describe("HealthStatusBar", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockEnv.VITE_MOCK_API = "false";
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders with service name", async () => {
    const healthResponse = {
      status: "ok",
      service: "deployment-api",
      cloud_provider: "gcp",
      mock_mode: false,
      data_freshness: {
        last_processed_date: "2026-03-16",
        stale: false,
      },
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(healthResponse),
    } as Response);

    render(
      <HealthStatusBar
        healthUrl="http://localhost:8004/health"
        serviceName="Deployment API"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Deployment API")).toBeInTheDocument();
    });
  });

  it("shows healthy status when API returns ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "ok",
          service: "test-api",
        }),
    } as Response);

    render(<HealthStatusBar healthUrl="http://localhost:8004/health" />);

    await waitFor(() => {
      expect(screen.getByText("Healthy")).toBeInTheDocument();
    });
  });

  it("shows down status when fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    render(<HealthStatusBar healthUrl="http://localhost:8004/health" />);

    await waitFor(() => {
      expect(screen.getByText("Down")).toBeInTheDocument();
    });
  });

  it("shows down status when API returns non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);

    render(<HealthStatusBar healthUrl="http://localhost:8004/health" />);

    await waitFor(() => {
      expect(screen.getByText("Down")).toBeInTheDocument();
    });
  });

  it("shows checking state initially", () => {
    // Make fetch hang forever
    vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));

    render(<HealthStatusBar healthUrl="http://localhost:8004/health" />);

    expect(screen.getByText("Checking...")).toBeInTheDocument();
  });

  it("expands detail panel on click", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "ok",
          service: "test-api",
          cloud_provider: "gcp",
          data_freshness: {
            last_processed_date: "2026-03-16",
            stale: false,
          },
          dependencies: [{ name: "database", status: "healthy", latencyMs: 5 }],
        }),
    } as Response);

    render(
      <HealthStatusBar
        healthUrl="http://localhost:8004/health"
        serviceName="Test API"
      />,
    );

    // Wait for healthy state
    await waitFor(() => {
      expect(screen.getByText("Healthy")).toBeInTheDocument();
    });

    // Click the status bar text area to expand (not the refresh button)
    await user.click(screen.getByText("Test API"));

    // Dependency should appear
    expect(screen.getByText("database")).toBeInTheDocument();
    expect(screen.getByText("5ms")).toBeInTheDocument();
    expect(screen.getByText("2026-03-16")).toBeInTheDocument();
  });

  it("has a refresh button", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "ok",
          service: "test-api",
        }),
    } as Response);

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<HealthStatusBar healthUrl="http://localhost:8004/health" />);

    await waitFor(() => {
      expect(screen.getByText("Healthy")).toBeInTheDocument();
    });

    // First call was the initial check
    const initialCalls = fetchSpy.mock.calls.length;

    // Click refresh
    const refreshBtn = screen.getByLabelText("Refresh health status");
    await user.click(refreshBtn);

    await waitFor(() => {
      expect(fetchSpy.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });

  it("renders health dot element", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "ok",
          service: "test-api",
        }),
    } as Response);

    render(<HealthStatusBar healthUrl="http://localhost:8004/health" />);

    await waitFor(() => {
      expect(screen.getByTestId("health-dot")).toBeInTheDocument();
    });
  });

  it("shows degraded status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "degraded",
          service: "test-api",
        }),
    } as Response);

    render(<HealthStatusBar healthUrl="http://localhost:8004/health" />);

    await waitFor(() => {
      expect(screen.getByText("Degraded")).toBeInTheDocument();
    });
  });

  it("shows stale data freshness indicator", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          status: "ok",
          service: "test-api",
          data_freshness: {
            last_processed_date: "2026-03-10",
            stale: true,
          },
        }),
    } as Response);

    render(
      <HealthStatusBar
        healthUrl="http://localhost:8004/health"
        serviceName="Stale API"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Healthy")).toBeInTheDocument();
    });

    // Expand by clicking service name
    await user.click(screen.getByText("Stale API"));

    expect(screen.getByText(/2026-03-10.*stale/)).toBeInTheDocument();
  });
});
