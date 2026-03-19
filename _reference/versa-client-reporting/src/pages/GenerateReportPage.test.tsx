import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { GenerateReportPage } from "./GenerateReportPage";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => mockFetch.mockReset());

describe("GenerateReportPage", () => {
  it("renders heading", () => {
    render(<GenerateReportPage />);
    expect(screen.getByText("Generate Report")).toBeInTheDocument();
  });

  it("renders period month input", () => {
    render(<GenerateReportPage />);
    expect(screen.getByPlaceholderText("2025-01")).toBeInTheDocument();
  });

  it("renders report type select with default option", () => {
    render(<GenerateReportPage />);
    expect(screen.getByText("Executive Summary")).toBeInTheDocument();
  });

  it("renders Generate button", () => {
    render(<GenerateReportPage />);
    expect(
      screen.getByRole("button", { name: "Generate" }),
    ).toBeInTheDocument();
  });

  it("shows success status on successful generation", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    } as unknown as Response);
    render(<GenerateReportPage />);
    fireEvent.change(screen.getByPlaceholderText("2025-01"), {
      target: { value: "2026-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    await waitFor(() => screen.getByText("Report generated successfully."));
  });

  it("shows error status on failed generation", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.resolve({ message: "Server error" }),
    } as unknown as Response);
    render(<GenerateReportPage />);
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    await waitFor(() => screen.getByText("Error generating report."));
  });

  it("shows error on fetch failure", async () => {
    // Return a response that triggers ApiClientError (non-2xx) instead of a
    // rejected promise, since vitest treats immediate rejections as unhandled.
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: () => Promise.resolve({ message: "Service Unavailable" }),
    } as unknown as Response);
    render(<GenerateReportPage />);
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    await waitFor(() =>
      expect(screen.getByText("Error generating report.")).toBeInTheDocument(),
    );
  });

  it("shows Generating... while in progress", async () => {
    let resolveRef!: (v: Response) => void;
    mockFetch.mockReturnValue(new Promise<Response>((r) => (resolveRef = r)));
    render(<GenerateReportPage />);
    fireEvent.click(screen.getByRole("button", { name: "Generate" }));
    expect(screen.getByText("Generating...")).toBeInTheDocument();
    // resolve to allow cleanup
    await act(async () =>
      resolveRef({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      } as unknown as Response),
    );
  });
});
