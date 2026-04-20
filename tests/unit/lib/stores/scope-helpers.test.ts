import { describe, expect, it } from "vitest";

import {
  getClientIdsForOrgs,
  getStrategyIdsForClients,
  getStrategyIdsForScope,
  orgSeed,
} from "@/lib/stores/scope-helpers";
import { CLIENTS } from "@/lib/mocks/fixtures/trading-data";
import { STRATEGIES } from "@/lib/strategy-registry";

/**
 * Coverage lift for lib/stores/scope-helpers.ts (was 0%).
 * All four helpers are pure — no mocks needed, just exercise each branch.
 */

describe("scope-helpers — getClientIdsForOrgs", () => {
  it("returns [] on empty org list", () => {
    expect(getClientIdsForOrgs([])).toEqual([]);
  });

  it("returns ids of clients that belong to one org", () => {
    // odum is a known org id in the CLIENTS fixture.
    const ids = getClientIdsForOrgs(["odum"]);
    const expected = CLIENTS.filter((c) => c.orgId === "odum").map((c) => c.id);
    expect(ids.sort()).toEqual(expected.sort());
    expect(ids.length).toBeGreaterThan(0);
  });

  it("returns [] when org id is unknown", () => {
    expect(getClientIdsForOrgs(["__nope__"])).toEqual([]);
  });
});

describe("scope-helpers — getStrategyIdsForClients", () => {
  it("returns [] on empty client list", () => {
    expect(getStrategyIdsForClients([])).toEqual([]);
  });

  it("returns strategy ids belonging to the given client ids", () => {
    const client = STRATEGIES[0].clientId;
    const ids = getStrategyIdsForClients([client]);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      const strat = STRATEGIES.find((s) => s.id === id);
      expect(strat?.clientId).toBe(client);
    }
  });

  it("returns [] for unknown client", () => {
    expect(getStrategyIdsForClients(["__not-a-client__"])).toEqual([]);
  });
});

describe("scope-helpers — getStrategyIdsForScope", () => {
  it("returns explicit strategyIds when set", () => {
    expect(
      getStrategyIdsForScope({
        organizationIds: [],
        clientIds: [],
        strategyIds: ["S1", "S2"],
      }),
    ).toEqual(["S1", "S2"]);
  });

  it("falls through clientIds when strategy list empty", () => {
    const client = STRATEGIES[0].clientId;
    const ids = getStrategyIdsForScope({
      organizationIds: [],
      clientIds: [client],
      strategyIds: [],
    });
    expect(ids.length).toBeGreaterThan(0);
  });

  it("derives clients from orgs when clientIds empty", () => {
    const ids = getStrategyIdsForScope({
      organizationIds: ["odum"],
      clientIds: [],
      strategyIds: [],
    });
    // odum has multiple clients each with strategies.
    expect(ids.length).toBeGreaterThan(0);
  });

  it("returns [] when no scope restriction applied", () => {
    expect(
      getStrategyIdsForScope({
        organizationIds: [],
        clientIds: [],
        strategyIds: [],
      }),
    ).toEqual([]);
  });

  it("returns [] when orgs have no clients", () => {
    expect(
      getStrategyIdsForScope({
        organizationIds: ["__unknown-org__"],
        clientIds: [],
        strategyIds: [],
      }),
    ).toEqual([]);
  });
});

describe("scope-helpers — orgSeed", () => {
  it("returns 0 for empty list", () => {
    expect(orgSeed([])).toBe(0);
  });

  it("returns a fraction in [0, 1) for non-empty list", () => {
    const seed = orgSeed(["odum"]);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThan(1);
  });

  it("is deterministic — same ids produce the same seed", () => {
    const a = orgSeed(["odum", "elysium"]);
    const b = orgSeed(["odum", "elysium"]);
    expect(a).toBe(b);
  });

  it("is order-independent (sorts input before hashing)", () => {
    const a = orgSeed(["odum", "elysium"]);
    const b = orgSeed(["elysium", "odum"]);
    expect(a).toBe(b);
  });

  it("different ids produce different seeds", () => {
    const a = orgSeed(["odum"]);
    const b = orgSeed(["elysium"]);
    expect(a).not.toBe(b);
  });
});
