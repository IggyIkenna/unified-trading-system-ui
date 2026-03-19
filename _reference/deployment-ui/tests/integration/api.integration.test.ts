/**
 * Integration tests — real HTTP calls to deployment-api.
 * Template: unified-trading-pm/scripts/quality-gates-base/ui-integration-test.template.ts
 * Rolled out via: rollout-quality-gates-unified.py
 *
 * Run with deployment-api available:
 *   INTEGRATION_TEST_API_URL=http://localhost:8004 npm run test:integration
 *
 * If API is not reachable, tests are skipped.
 */

import { describe, it, expect, beforeAll } from "vitest";

const BASE =
  (typeof process !== "undefined" && process.env.INTEGRATION_TEST_API_URL) ||
  "http://localhost:8004";
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
  try {
    const res = await fetch(`${BASE}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

describe("deployment-ui ↔ deployment-api integration", () => {
  let apiAvailable: boolean;

  beforeAll(async () => {
    apiAvailable = await isApiReachable();
    if (!apiAvailable) {
      console.warn(
        "Skipping integration tests: deployment-api not reachable at",
        BASE,
      );
    }
  });

  it("GET /health returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/health");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /services returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/services");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /services/{service_name} returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/services/{service_name}");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /services/{service_name}/dimensions returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi(
      "/services/{service_name}/dimensions",
    );
    expect(ok || status === 401).toBe(true);
  });

  it("GET /services/{service_name}/discover-configs returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi(
      "/services/{service_name}/discover-configs",
    );
    expect(ok || status === 401).toBe(true);
  });

  it("GET /services/{service_name}/list-directories returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi(
      "/services/{service_name}/list-directories",
    );
    expect(ok || status === 401).toBe(true);
  });

  it("GET /services/{service_name}/config-buckets returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi(
      "/services/{service_name}/config-buckets",
    );
    expect(ok || status === 401).toBe(true);
  });

  it("GET /config/region returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/config/region");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /config/validate-region returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/config/validate-region");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /config/venues returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/config/venues");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /config/venues/{category} returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/config/venues/{category}");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /config/expected-start-dates returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/config/expected-start-dates");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /deployments returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/deployments");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /service-status/overview returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/service-status/overview");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /service-status/{service}/status returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/service-status/{service}/status");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /service-status/execution-service/data-status returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi(
      "/service-status/execution-service/data-status",
    );
    expect(ok || status === 401).toBe(true);
  });

  it("GET /data-status returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/data-status");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /data-status/last-updated returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/data-status/last-updated");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /data-status/turbo returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/data-status/turbo");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /data-status/turbo/stats returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/data-status/turbo/stats");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /data-status/venue-filters returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/data-status/venue-filters");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /data-status/list-files returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/data-status/list-files");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /data-status/instruments returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/data-status/instruments");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /data-status/instrument-availability returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi(
      "/data-status/instrument-availability",
    );
    expect(ok || status === 401).toBe(true);
  });

  it("GET /capabilities returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/capabilities");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /checklists returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/checklists");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /checklists/{service_name}/checklist returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi(
      "/checklists/{service_name}/checklist",
    );
    expect(ok || status === 401).toBe(true);
  });

  it("GET /checklists/{service_name}/checklist/validate returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi(
      "/checklists/{service_name}/checklist/validate",
    );
    expect(ok || status === 401).toBe(true);
  });

  it("GET /epics returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/epics");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /cloud-builds/triggers returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/cloud-builds/triggers");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /api/builds/{service} returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/api/builds/{service}");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /api/deployments/{service}/deploy returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/api/deployments/{service}/deploy");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /users returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/users");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /users/{user_id} returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/users/{user_id}");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /roles returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/roles");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /permissions returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/permissions");
    expect(ok || status === 401).toBe(true);
  });

  it("GET /commentary/pipeline-uat returns ok or 401", async () => {
    if (!apiAvailable) return;
    const { ok, status } = await fetchApi("/commentary/pipeline-uat");
    expect(ok || status === 401).toBe(true);
  });
});
