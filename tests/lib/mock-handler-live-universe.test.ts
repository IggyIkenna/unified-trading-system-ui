/**
 * mock-handler — /api/instruments/live-universe route.
 *
 * Plan: unified-trading-pm/plans/ai/watchlist_from_instruments_2026_04_29.plan.md Unit E
 *
 * Validates that mock-handler serves the same envelope shape as the
 * backend — `{ data, asset_group, total, ... }`. The schema-parity
 * test on the backend side (test_live_universe_schema.py) covers
 * the row content; this test covers the URL-routing layer.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { installMockHandler } from "@/lib/api/mock-handler";

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
  installMockHandler();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("mock-handler /api/instruments/live-universe", () => {
  it("serves cefi fixture with envelope shape", async () => {
    const resp = await fetch("/api/instruments/live-universe?asset_group=cefi");
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.asset_group).toBe("cefi");
  });

  it("serves tradfi fixture", async () => {
    const resp = await fetch("/api/instruments/live-universe?asset_group=tradfi");
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.asset_group).toBe("tradfi");
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("serves defi fixture", async () => {
    const resp = await fetch("/api/instruments/live-universe?asset_group=defi");
    expect(resp.status).toBe(200);
    const body = await resp.json();
    expect(body.asset_group).toBe("defi");
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("returns 400 for invalid asset_group", async () => {
    const resp = await fetch("/api/instruments/live-universe?asset_group=sports");
    expect(resp.status).toBe(400);
  });

  it("returns 400 when asset_group is missing", async () => {
    const resp = await fetch("/api/instruments/live-universe");
    expect(resp.status).toBe(400);
  });

  it("CEFI fixture rows include the system-watchlist instrument keys", async () => {
    // The sample fixture is regen'd to always include every key referenced
    // by SYSTEM_WATCHLISTS, plus 50 extras. Check that BTC-USDT (the
    // first chart-tested key) is present.
    const resp = await fetch("/api/instruments/live-universe?asset_group=cefi");
    const body = await resp.json();
    const keys = new Set(body.data.map((r: { instrument_key: string }) => r.instrument_key));
    expect(keys.has("BINANCE-FUTURES:PERPETUAL:BTC-USDT")).toBe(true);
  });
});
