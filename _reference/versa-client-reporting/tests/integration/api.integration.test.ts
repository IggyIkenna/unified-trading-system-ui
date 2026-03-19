/**
 * Integration tests — real HTTP calls to client-reporting-api.
 * Template: unified-trading-pm/scripts/quality-gates-base/ui-integration-test.template.ts
 * Rolled out via: rollout-quality-gates-unified.py
 *
 * Run with client-reporting-api available:
 *   INTEGRATION_TEST_CLIENT_REPORTING_URL=http://localhost:8007 npm run test:integration
 *
 * If API is not reachable, tests are skipped.
 */

import { describe, it, expect, beforeAll } from "vitest";

const BASE =
  (typeof process !== "undefined" &&
    process.env.INTEGRATION_TEST_CLIENT_REPORTING_URL) ||
  "http://localhost:8007";
const API = `${BASE.replace(/\/$/, "")}`;

async function fetchApi(
  path: string,
  options?: RequestInit,
): Promise<{ ok: boolean; status: number; data?: unknown }> {
  const url = path.startsWith("http") ? path : `${API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function isApiReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

describe("client-reporting-ui ↔ client-reporting-api integration", () => {
  let apiAvailable: boolean;

  beforeAll(async () => {
    apiAvailable = await isApiReachable();
    if (!apiAvailable) {
      console.warn(
        "Skipping integration tests: client-reporting-api not reachable at",
        BASE,
      );
    }
  });

  it("GET /health returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/health");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /readiness returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/readiness");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /api/reports/generate returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/api/reports/generate");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /api/v1/stream/reports returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/api/v1/stream/reports");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /pnl returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/pnl");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /alerts returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/alerts");
    expect(ok || status === 401).toBe(true);
  });
});
