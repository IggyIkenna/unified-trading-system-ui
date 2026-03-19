import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CloudModeBadge } from "./cloud-mode-badge";

describe("CloudModeBadge", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when health endpoint returns no cloud_provider", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
    const { container } = render(<CloudModeBadge />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it("renders provider badge from health response", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ cloud_provider: "gcp", mock_mode: false }),
    } as Response);
    render(<CloudModeBadge />);
    await waitFor(() => {
      expect(screen.getByText("GCP")).toBeInTheDocument();
    });
  });

  it("renders MOCK badge when mock_mode is true", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ cloud_provider: "gcp", mock_mode: true }),
    } as Response);
    render(<CloudModeBadge />);
    await waitFor(() => {
      expect(screen.getByText("MOCK")).toBeInTheDocument();
    });
  });

  it("renders nothing when fetch fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network error"));
    const { container } = render(<CloudModeBadge />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
