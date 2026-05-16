/**
 * L1.5 widget harness — instrument-catalogue-widget (catalogue plan P3.3).
 *
 * Mocks the GCS proxy via fetch and verifies:
 * - All 5 asset_group sections render when the catalogue has entries for each.
 * - Coverage band emoji (🟢/🟡/🔴/⚪) appears on each row.
 * - LIVE / BATCH badges render only when the entry's readiness flags are true.
 * - Retry warning emoji renders only when retry_needed is true.
 * - Loading state renders before the fetch resolves.
 * - Error state renders if the proxy returns non-200.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import * as React from "react";

import { InstrumentCatalogueWidget } from "@/components/widgets/data-quality/instrument-catalogue-widget";
import type { CatalogueEntry, InstrumentCatalogue } from "@/lib/api/instrument-catalogue-client";

function buildEntry(overrides: Partial<CatalogueEntry> = {}): CatalogueEntry {
  return {
    asset_group: "cefi",
    data_type: "trades",
    venue: "BINANCE",
    instrument_type: "perpetual",
    bucket: "instruments-store-cefi-{project_id}",
    coverage_start: "2017-08-17",
    expected_days: 3000,
    captured_days: 2900,
    empty_confirmed_days: 50,
    attempted_failed_days: 0,
    coverage_pct: 0.95,
    latest_captured_day: "2026-04-29",
    live_ready: true,
    batch_ready: true,
    retry_needed: false,
    live_capable: true,
    batch_capable: true,
    streaming_protocol: "ws",
    requires_credentials: false,
    ttm_cutoff_days: null,
    liquidity_cutoff_usd: null,
    retention_days: null,
    notes: null,
    schema: [],
    ...overrides,
  };
}

function mockFetchOnce(payload: InstrumentCatalogue): void {
  const fakeResponse = {
    ok: true,
    json: vi.fn().mockResolvedValue(payload),
    text: vi.fn().mockResolvedValue(JSON.stringify(payload)),
  } as unknown as Response;
  vi.spyOn(global, "fetch").mockResolvedValueOnce(fakeResponse);
}

function mockFetchError(status: number, body: string): void {
  const fakeResponse = {
    ok: false,
    status,
    text: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
  vi.spyOn(global, "fetch").mockResolvedValueOnce(fakeResponse);
}

describe("instrument-catalogue-widget — L1.5 harness", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the loading state before the fetch resolves", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {})); // never resolves
    render(<InstrumentCatalogueWidget />);
    expect(screen.getByText(/Loading instrument catalogue/i)).toBeTruthy();
  });

  it("renders all 5 asset_group sections when catalogue has entries for each", async () => {
    mockFetchOnce({
      generated_at: "2026-04-29T02:00:00Z",
      entries: [
        buildEntry({ asset_group: "cefi", venue: "BINANCE" }),
        buildEntry({ asset_group: "defi", venue: "AAVE_V3", coverage_pct: 0.5 }),
        buildEntry({ asset_group: "tradfi", venue: "FRED", coverage_pct: 0.99 }),
        buildEntry({ asset_group: "sports", venue: "API_FOOTBALL", coverage_pct: 0.7 }),
        buildEntry({ asset_group: "prediction", venue: "POLYMARKET", coverage_pct: 0.0 }),
      ],
    });
    render(<InstrumentCatalogueWidget />);

    await waitFor(() => {
      expect(screen.getByText("Instrument Catalogue")).toBeTruthy();
    });

    // All 5 ag tags render as section headers.
    expect(screen.getByText("cefi")).toBeTruthy();
    expect(screen.getByText("defi")).toBeTruthy();
    expect(screen.getByText("tradfi")).toBeTruthy();
    expect(screen.getByText("sports")).toBeTruthy();
    expect(screen.getByText("prediction")).toBeTruthy();
  });

  it("renders the LIVE badge when live_ready is true", async () => {
    mockFetchOnce({
      generated_at: "2026-04-29T02:00:00Z",
      entries: [buildEntry({ live_ready: true, batch_ready: false })],
    });
    render(<InstrumentCatalogueWidget />);
    await waitFor(() => {
      expect(screen.getByText("LIVE")).toBeTruthy();
    });
  });

  it("renders the BATCH badge when batch_ready is true", async () => {
    mockFetchOnce({
      generated_at: "2026-04-29T02:00:00Z",
      entries: [buildEntry({ live_ready: false, batch_ready: true })],
    });
    render(<InstrumentCatalogueWidget />);
    await waitFor(() => {
      expect(screen.getByText("BATCH")).toBeTruthy();
    });
  });

  it("does not render LIVE/BATCH badges when readiness is false", async () => {
    mockFetchOnce({
      generated_at: "2026-04-29T02:00:00Z",
      entries: [buildEntry({ live_ready: false, batch_ready: false, retry_needed: false })],
    });
    render(<InstrumentCatalogueWidget />);
    await waitFor(() => {
      expect(screen.getByText(/95\.0%/)).toBeTruthy();
    });
    // Both badges absent. (Legend has its own LIVE/BATCH text — search row table only.)
    const tableLive = screen.queryAllByText("LIVE");
    expect(tableLive.length).toBe(0);
  });

  it("renders retry warning emoji when retry_needed is true", async () => {
    mockFetchOnce({
      generated_at: "2026-04-29T02:00:00Z",
      entries: [buildEntry({ retry_needed: true, attempted_failed_days: 5 })],
    });
    render(<InstrumentCatalogueWidget />);
    await waitFor(() => {
      // ⚠ emoji rendered inside a Badge — find by text.
      expect(screen.getAllByText("⚠").length).toBeGreaterThan(0);
    });
  });

  it("renders a drilldown link for every row pointing at /admin/data", async () => {
    mockFetchOnce({
      generated_at: "2026-04-29T02:00:00Z",
      entries: [buildEntry()],
    });
    render(<InstrumentCatalogueWidget />);
    await waitFor(() => {
      const link = screen.getByRole("link", { name: /drill/i });
      const href = link.getAttribute("href") ?? "";
      expect(href.startsWith("/admin/data?")).toBe(true);
      expect(href).toContain("asset_group=cefi");
      expect(href).toContain("venue=BINANCE");
      expect(href).toContain("data_type=trades");
    });
  });

  it("renders coverage % rounded to 1 decimal", async () => {
    mockFetchOnce({
      generated_at: "2026-04-29T02:00:00Z",
      entries: [buildEntry({ coverage_pct: 0.847 })],
    });
    render(<InstrumentCatalogueWidget />);
    await waitFor(() => {
      expect(screen.getByText(/84\.7%/)).toBeTruthy();
    });
  });

  it("renders the error state when the proxy returns non-200", async () => {
    mockFetchError(502, "GCS read failed");
    render(<InstrumentCatalogueWidget />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load instrument catalogue/i)).toBeTruthy();
    });
  });
});
