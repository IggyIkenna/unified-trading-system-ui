import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiConnectionBadge } from "./api-connection-badge";

describe("ApiConnectionBadge", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows checking state initially", () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => undefined));
    render(<ApiConnectionBadge healthUrl="http://localhost:8004/health" />);
    expect(screen.getByTitle(/checking/i)).toBeInTheDocument();
  });

  it("shows connected state when health endpoint returns ok", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok", version: "1.0.0" }),
    } as Response);
    render(<ApiConnectionBadge healthUrl="http://localhost:8004/health" />);
    await waitFor(() => {
      expect(screen.getByTitle(/connected/i)).toBeInTheDocument();
    });
  });

  it("shows disconnected state when fetch fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("refused"));
    render(<ApiConnectionBadge healthUrl="http://localhost:8004/health" />);
    await waitFor(() => {
      expect(screen.getByTitle(/disconnected/i)).toBeInTheDocument();
    });
  });

  it("shows disconnected state when health returns non-ok", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);
    render(<ApiConnectionBadge healthUrl="http://localhost:8004/health" />);
    await waitFor(() => {
      expect(screen.getByTitle(/disconnected/i)).toBeInTheDocument();
    });
  });
});
