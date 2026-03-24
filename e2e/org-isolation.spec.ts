import { test, expect } from "@playwright/test";

/**
 * ORG ISOLATION MATRIX E2E TESTS
 *
 * CRITICAL for demo credibility — clients must NEVER see each other's data.
 *
 * Tests that:
 * - admin sees all orgs' data
 * - client-full (acme) sees only acme data
 * - client-data-only (beta) sees only beta data
 * - org filtering cascades across all service pages
 *
 * Uses X-Demo-Persona header for persona switching in API calls.
 */

const API = "http://localhost:8030";

test.beforeAll(async ({ request }) => {
  await request.post(`${API}/admin/reset`);
});

test.describe("API-level org isolation", () => {
  test("admin sees data from multiple orgs", async ({ request }) => {
    const response = await request.get(`${API}/execution/orders`, {
      headers: { "X-Demo-Persona": "admin" },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const orgIds = new Set(
      body.data.map((o: Record<string, string>) => o.org_id),
    );
    expect(orgIds.size).toBeGreaterThan(1);
  });

  test("client-full (acme) sees only acme data in orders", async ({
    request,
  }) => {
    const response = await request.get(`${API}/execution/orders`, {
      headers: { "X-Demo-Persona": "client-full" },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    for (const order of body.data) {
      expect(order.org_id).toBe("acme");
    }
  });

  test("client-data-only (beta) sees only beta data in orders", async ({
    request,
  }) => {
    const response = await request.get(`${API}/execution/orders`, {
      headers: { "X-Demo-Persona": "client-data-only" },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    for (const order of body.data) {
      expect(order.org_id).toBe("beta");
    }
  });

  test("client-full sees only acme positions", async ({ request }) => {
    const response = await request.get(`${API}/positions/active`, {
      headers: { "X-Demo-Persona": "client-full" },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const positions = body.data || body.positions || [];
    for (const pos of positions) {
      expect(pos.org_id).toBe("acme");
    }
  });

  test("client-full sees only acme alerts", async ({ request }) => {
    const response = await request.get(`${API}/alerts/list`, {
      headers: { "X-Demo-Persona": "client-full" },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    for (const alert of body.data) {
      expect(alert.org_id).toBe("acme");
    }
  });

  test("client-full sees only acme strategies", async ({ request }) => {
    const response = await request.get(`${API}/analytics/performance`, {
      headers: { "X-Demo-Persona": "client-full" },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const strategies = body.data || body.strategies || [];
    for (const strat of strategies) {
      if (strat.org_id) {
        expect(strat.org_id).toBe("acme");
      }
    }
  });
});

test.describe("Cross-service org isolation (all domains)", () => {
  const ENDPOINTS_WITH_ORG = [
    { path: "/execution/orders", dataKey: "data" },
    { path: "/execution/fills", dataKey: "data" },
    { path: "/positions/active", dataKey: "data" },
    { path: "/alerts/list", dataKey: "data" },
    { path: "/risk/limits", dataKey: "data" },
  ];

  for (const endpoint of ENDPOINTS_WITH_ORG) {
    test(`${endpoint.path} — acme persona sees only acme`, async ({
      request,
    }) => {
      const response = await request.get(`${API}${endpoint.path}`, {
        headers: { "X-Demo-Persona": "client-full" },
      });
      expect(response.status()).toBe(200);
      const body = await response.json();
      const records = body[endpoint.dataKey] || [];
      for (const record of records) {
        if (record.org_id) {
          expect(record.org_id).toBe("acme");
        }
      }
    });

    test(`${endpoint.path} — beta persona sees only beta`, async ({
      request,
    }) => {
      const response = await request.get(`${API}${endpoint.path}`, {
        headers: { "X-Demo-Persona": "client-data-only" },
      });
      expect(response.status()).toBe(200);
      const body = await response.json();
      const records = body[endpoint.dataKey] || [];
      for (const record of records) {
        if (record.org_id) {
          expect(record.org_id).toBe("beta");
        }
      }
    });
  }
});
