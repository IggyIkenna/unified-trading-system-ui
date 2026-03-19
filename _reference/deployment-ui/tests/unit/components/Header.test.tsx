// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Header } from "../../../src/components/Header";

// Mock the hooks and API
vi.mock("../../../src/hooks/useHealth", () => ({
  useHealth: vi.fn(),
}));
vi.mock("../../../src/api/client", () => ({
  clearCache: vi.fn().mockResolvedValue(undefined),
}));

import { useHealth } from "../../../src/hooks/useHealth";

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the app title", () => {
    (useHealth as ReturnType<typeof vi.fn>).mockReturnValue({
      health: null,
      isHealthy: false,
      error: null,
    });
    render(<Header />);
    expect(screen.getByText("Unified Trading Deployment")).toBeTruthy();
  });

  it("renders API status label", () => {
    (useHealth as ReturnType<typeof vi.fn>).mockReturnValue({
      health: null,
      isHealthy: false,
      error: null,
    });
    render(<Header />);
    // "API" text appears in the status area
    const apiLabels = screen.getAllByText("API");
    expect(apiLabels.length).toBeGreaterThan(0);
  });

  it("shows Connected badge when API is healthy", () => {
    (useHealth as ReturnType<typeof vi.fn>).mockReturnValue({
      health: { status: "ok", version: "1.0.0", config_dir: "/config" },
      isHealthy: true,
      error: null,
    });
    render(<Header />);
    expect(screen.getByText("Connected")).toBeTruthy();
  });

  it("shows Disconnected badge when API has error", () => {
    (useHealth as ReturnType<typeof vi.fn>).mockReturnValue({
      health: null,
      isHealthy: false,
      error: "Connection refused",
    });
    render(<Header />);
    expect(screen.getByText("Disconnected")).toBeTruthy();
  });

  it("shows version when health data available", () => {
    (useHealth as ReturnType<typeof vi.fn>).mockReturnValue({
      health: { status: "ok", version: "2.3.1", config_dir: "/config" },
      isHealthy: true,
      error: null,
    });
    render(<Header />);
    expect(screen.getByText("v2.3.1")).toBeTruthy();
  });

  it("renders Clear Cache button", () => {
    (useHealth as ReturnType<typeof vi.fn>).mockReturnValue({
      health: null,
      isHealthy: false,
      error: null,
    });
    render(<Header />);
    expect(screen.getByText("Clear Cache")).toBeTruthy();
  });

  it("shows Cleared! after clicking Clear Cache", async () => {
    (useHealth as ReturnType<typeof vi.fn>).mockReturnValue({
      health: null,
      isHealthy: false,
      error: null,
    });
    const { clearCache } = await import("../../../src/api/client");
    (clearCache as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(<Header />);
    fireEvent.click(screen.getByText("Clear Cache"));
    await waitFor(() => {
      expect(screen.getByText("Cleared!")).toBeTruthy();
    });
  });

  it("shows GCS Fuse badge when gcs_fuse is active", () => {
    (useHealth as ReturnType<typeof vi.fn>).mockReturnValue({
      health: {
        status: "ok",
        version: "1.0.0",
        config_dir: "/config",
        gcs_fuse: { active: true, reason: "mounted" },
      },
      isHealthy: true,
      error: null,
    });
    render(<Header />);
    expect(screen.getByText("GCS Fuse")).toBeTruthy();
  });

  it("shows GCS API badge when gcs_fuse is inactive", () => {
    (useHealth as ReturnType<typeof vi.fn>).mockReturnValue({
      health: {
        status: "ok",
        version: "1.0.0",
        config_dir: "/config",
        gcs_fuse: { active: false, reason: "not mounted" },
      },
      isHealthy: true,
      error: null,
    });
    render(<Header />);
    expect(screen.getByText("GCS API")).toBeTruthy();
  });
});
