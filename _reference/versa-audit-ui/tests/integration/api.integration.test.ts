/**
 * Integration tests — real HTTP calls to batch-audit-api.
 * Template: unified-trading-pm/scripts/quality-gates-base/ui-integration-test.template.ts
 * Rolled out via: rollout-quality-gates-unified.py
 *
 * Run with batch-audit-api available:
 *   INTEGRATION_TEST_BATCH_AUDIT_URL=http://localhost:8013 npm run test:integration
 *
 * If API is not reachable, tests are skipped.
 */

import { describe, it, expect, beforeAll } from "vitest";

const BASE =
  (typeof process !== "undefined" &&
    process.env.INTEGRATION_TEST_BATCH_AUDIT_URL) ||
  "http://localhost:8013";
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

describe("batch-audit-ui ↔ batch-audit-api integration", () => {
  let apiAvailable: boolean;

  beforeAll(async () => {
    apiAvailable = await isApiReachable();
    if (!apiAvailable) {
      console.warn(
        "Skipping integration tests: batch-audit-api not reachable at",
        BASE,
      );
    }
  });

  it("GET /health returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/health");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /batch/jobs returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/batch/jobs");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /batch/jobs/{job_id} returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/batch/jobs/{job_id}");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /batch/jobs/services/{service_name}/history returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi(
      "/batch/jobs/services/{service_name}/history",
    );
    expect(ok || status === 401).toBe(true);
  });

  it("GET /audit/trail returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/audit/trail");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /audit/trail/services returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/audit/trail/services");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /audit/trail/summary returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/audit/trail/summary");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /audit/compliance returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/audit/compliance");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /audit/compliance/orphans returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/audit/compliance/orphans");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /audit/compliance/tts returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/audit/compliance/tts");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /audit/compliance/errors returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/audit/compliance/errors");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /audit/data-health returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/audit/data-health");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /audit/data-health/retention returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/audit/data-health/retention");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /audit/data-health/services/{service_name} returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi(
      "/audit/data-health/services/{service_name}",
    );
    expect(ok || status === 401).toBe(true);
  });

  it("GET /api/v1/logs returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/api/v1/logs");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /api/v1/services returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/api/v1/services");
    expect(ok || status === 401).toBe(true);
  });
});
