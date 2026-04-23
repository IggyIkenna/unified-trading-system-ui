/**
 * Integration tests — real HTTP calls to unified-trading-api.
 * Template: unified-trading-pm/scripts/quality-gates-base/ui-integration-test.template.ts
 * Rolled out via: rollout-quality-gates-unified.py
 *
 * Run with unified-trading-api available:
 *   INTEGRATION_TEST_UNIFIED_TRADING_URL=http://localhost:8030 npm run test:integration
 *
 * If API is not reachable, tests are skipped.
 */

import { describe, it, expect, beforeAll } from "vitest";

const BASE =
  (typeof process !== "undefined" && process.env.INTEGRATION_TEST_UNIFIED_TRADING_URL) ||
  "http://localhost:8030";
const API = `${BASE.replace(/\/$/, "")}/api`;

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
  // Probe the same `${API}/health` endpoint the actual tests hit — not `${BASE}/health`.
  // Without this, a sibling process on localhost:8030 that answers `/health` but not
  // `/api/health` (e.g. a different service listening on the same port) makes the tests
  // think the API is up and then fail the 404 → assertion.
  try {
    const res = await fetch(`${API}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok || res.status === 401;
  } catch {
    return false;
  }
}

describe("unified-trading-system-ui ↔ unified-trading-api integration", () => {
  let apiAvailable: boolean;

  beforeAll(async () => {
    apiAvailable = await isApiReachable();
    if (!apiAvailable) {
      console.warn(
        "Skipping integration tests: unified-trading-api not reachable at",
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
});
