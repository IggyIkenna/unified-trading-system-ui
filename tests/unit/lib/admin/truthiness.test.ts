import { describe, expect, it } from "vitest";

import {
  CATALOGUE_STATUSES,
  CatalogueTruthinessAdapter,
} from "@/lib/admin/truthiness";

describe("CatalogueTruthinessAdapter", () => {
  it("exports the 4 canonical catalogue statuses", () => {
    expect(CATALOGUE_STATUSES).toEqual([
      "LIVE",
      "IN_DEVELOPMENT",
      "RETIRED",
      "PLANNED_NOT_IMPLEMENTED",
    ]);
  });

  it("falls back to mock mode when no admin token is set", async () => {
    const adapter = new CatalogueTruthinessAdapter({
      adminToken: undefined,
      strategyServiceBaseUrl: undefined,
      featuresServiceBaseUrls: {},
    });
    expect(adapter.isMockMode).toBe(true);
    const snapshot = await adapter.fetchSnapshot();
    expect(snapshot.mode).toBe("mock");
    expect(snapshot.archetypes.length).toBe(18); // all 18 archetypes reconciled
    expect(
      snapshot.archetypes.every((row) => row.source === "mock"),
    ).toBe(true);
    expect(
      snapshot.archetypes.some((row) => row.status === "LIVE"),
    ).toBe(true);
    expect(snapshot.warnings.some((w) => w.toLowerCase().includes("mock"))).toBe(true);
  });

  it("mock mock-ml-model seed includes LIVE + IN_DEVELOPMENT + PLANNED entries", async () => {
    const adapter = new CatalogueTruthinessAdapter({ mockMode: true });
    const rows = await adapter.fetchMlModels();
    const statuses = new Set(rows.map((r) => r.status));
    expect(statuses.has("LIVE")).toBe(true);
    expect(statuses.has("IN_DEVELOPMENT")).toBe(true);
    expect(statuses.has("PLANNED_NOT_IMPLEMENTED")).toBe(true);
    expect(rows.every((r) => r.source === "mock")).toBe(true);
  });

  it("mock feature-catalogue seed spans multiple service_keys", async () => {
    const adapter = new CatalogueTruthinessAdapter({ mockMode: true });
    const rows = await adapter.fetchFeatures();
    const services = new Set(rows.map((r) => r.serviceKey));
    expect(services.size).toBeGreaterThan(1);
    expect(rows.every((r) => r.source === "mock")).toBe(true);
  });

  it("explicit mockMode=true wins even when a token is provided", async () => {
    const adapter = new CatalogueTruthinessAdapter({
      adminToken: "test-token",
      strategyServiceBaseUrl: "https://example.test",
      mockMode: true,
    });
    expect(adapter.isMockMode).toBe(true);
    const archetypes = await adapter.fetchArchetypes();
    expect(archetypes.every((r) => r.source === "mock")).toBe(true);
  });
});
