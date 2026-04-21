import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AdminRegistryFetchError,
  CatalogueTruthinessAdapter,
} from "@/lib/admin/truthiness";

/**
 * Live-mode tests for the CatalogueTruthinessAdapter.
 *
 * These cover the 4 behaviours required by the Phase-7 follow-up:
 *   1. Live-mode fetch succeeds → live data returned (`status: "LIVE"`).
 *   2. Live-mode 401 → mock fallback with `status: "AUTH_ERROR"`.
 *   3. Live-mode network error → mock fallback with `status: "UNREACHABLE"`.
 *   4. Mock-mode (env absent) → seeded mock returned with `mock: true`.
 *
 * Plus partial-env (token but no URL) → mock fallback.
 */

describe("CatalogueTruthinessAdapter — live mode", () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it("returns live data when backend responds 200 with valid payload", async () => {
    const fetchSpy = vi.fn(async (url: RequestInfo | URL) => {
      const u = String(url);
      if (u.endsWith("/api/v1/registry/archetypes")) {
        return new Response(
          JSON.stringify({
            rows: [
              {
                archetype: "ML_DIRECTIONAL_CONTINUOUS",
                family: "ML_DIRECTIONAL",
                status: "LIVE",
                last_updated: "2026-04-21T00:00:00Z",
                deployment_health: "healthy",
                live_strategy_count: 7,
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (u.endsWith("/api/v1/registry/ml-models")) {
        return new Response(
          JSON.stringify({
            rows: [
              {
                model_id: "live-model-1",
                archetype: "ML_DIRECTIONAL_CONTINUOUS",
                status: "LIVE",
                last_training_timestamp: "2026-04-21T00:00:00Z",
                deployment_health: "healthy",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (u.endsWith("/api/v1/registry/features")) {
        return new Response(
          JSON.stringify({
            rows: [
              {
                feature_group: "onchain_tvl_metrics",
                service_key: "features-onchain",
                status: "LIVE",
                last_computed_at: "2026-04-21T00:00:00Z",
                consumers: ["strategy-service"],
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      throw new Error(`unexpected url: ${u}`);
    });
    globalThis.fetch = fetchSpy as typeof fetch;

    const adapter = new CatalogueTruthinessAdapter({
      adminToken: "live-token",
      strategyServiceBaseUrl: "https://strategy.test",
      featuresServiceBaseUrls: {
        "features-onchain": "https://features-onchain.test",
      },
      mockMode: false,
    });
    expect(adapter.isMockMode).toBe(false);

    const snap = await adapter.fetchSnapshot();
    expect(snap.status).toBe("LIVE");
    expect(snap.mode).toBe("live");
    expect(snap.mock).toBe(false);
    const liveArchetype = snap.archetypes.find(
      (a) => a.archetype === "ML_DIRECTIONAL_CONTINUOUS",
    );
    expect(liveArchetype?.source).toBe("live");
    expect(liveArchetype?.liveStrategyCount).toBe(7);
    expect(snap.mlModels.some((m) => m.modelId === "live-model-1")).toBe(true);
    expect(
      snap.features.some((f) => f.serviceKey === "features-onchain"),
    ).toBe(true);
    // every call carried the admin token
    for (const call of fetchSpy.mock.calls) {
      const init = (call as unknown as [unknown, RequestInit | undefined])[1];
      const headers = init?.headers as Record<string, string> | undefined;
      expect(headers?.["X-Admin-Token"]).toBe("live-token");
    }
  });

  it("falls back to mock with status=AUTH_ERROR on 401", async () => {
    const fetchSpy = vi.fn(
      async () =>
        new Response("unauthorised", {
          status: 401,
          statusText: "Unauthorized",
        }),
    );
    globalThis.fetch = fetchSpy as typeof fetch;

    const adapter = new CatalogueTruthinessAdapter({
      adminToken: "wrong-token",
      strategyServiceBaseUrl: "https://strategy.test",
      featuresServiceBaseUrls: {
        "features-onchain": "https://features-onchain.test",
      },
      mockMode: false,
    });

    const snap = await adapter.fetchSnapshot();
    expect(snap.status).toBe("AUTH_ERROR");
    expect(snap.mode).toBe("mock");
    expect(snap.mock).toBe(true);
    // mock seeds still returned — admin page does not crash
    expect(snap.archetypes.length).toBe(18);
    expect(
      snap.warnings.some((w) => w.toLowerCase().includes("rejected")),
    ).toBe(true);
  });

  it("falls back to mock with status=UNREACHABLE on network failure", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }) as typeof fetch;

    const adapter = new CatalogueTruthinessAdapter({
      adminToken: "live-token",
      strategyServiceBaseUrl: "https://offline.test",
      featuresServiceBaseUrls: {
        "features-onchain": "https://features-onchain.test",
      },
      mockMode: false,
    });

    const snap = await adapter.fetchSnapshot();
    expect(snap.status).toBe("UNREACHABLE");
    expect(snap.mode).toBe("mock");
    expect(snap.mock).toBe(true);
    expect(snap.archetypes.length).toBe(18);
    expect(
      snap.warnings.some(
        (w) =>
          w.toLowerCase().includes("unreachable") ||
          w.toLowerCase().includes("fetch"),
      ),
    ).toBe(true);
  });

  it("returns mock seed with status=MOCK when env absent (no token, no URL)", async () => {
    const adapter = new CatalogueTruthinessAdapter({
      adminToken: undefined,
      strategyServiceBaseUrl: undefined,
      featuresServiceBaseUrls: {},
    });
    expect(adapter.isMockMode).toBe(true);
    const snap = await adapter.fetchSnapshot();
    expect(snap.status).toBe("MOCK");
    expect(snap.mode).toBe("mock");
    expect(snap.mock).toBe(true);
    expect(snap.archetypes.every((a) => a.source === "mock")).toBe(true);
  });

  it("partial env (token but no URL) → mock fallback", async () => {
    const adapter = new CatalogueTruthinessAdapter({
      adminToken: "live-token",
      strategyServiceBaseUrl: undefined,
      featuresServiceBaseUrls: {},
    });
    // hasLiveWiring = token && strategyUrl.length > 0 → false → mockMode
    expect(adapter.isMockMode).toBe(true);
    const snap = await adapter.fetchSnapshot();
    expect(snap.status).toBe("MOCK");
  });

  it("AdminRegistryFetchError surfaces kind + status", () => {
    const authErr = new AdminRegistryFetchError(
      "auth",
      "https://strategy.test/api/v1/registry/archetypes",
      "bad token",
      401,
    );
    expect(authErr.kind).toBe("auth");
    expect(authErr.status).toBe(401);
    const netErr = new AdminRegistryFetchError(
      "network",
      "https://offline.test",
      "ECONNREFUSED",
    );
    expect(netErr.kind).toBe("network");
    expect(netErr.status).toBeUndefined();
  });
});
