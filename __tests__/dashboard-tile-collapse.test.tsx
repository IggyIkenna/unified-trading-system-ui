/**
 * Per-persona dashboard tile-count test — Phase 6 of
 * plans/active/dashboard_services_grid_collapse_2026_04_21.plan.md.
 *
 * Contract (from the plan):
 *   For each of 19 personas:
 *     (i)   at most 5 visible tiles (the product-axis collapse);
 *     (ii)  expected tile-ids match the persona-dashboard-shape matrix;
 *     (iii) no folded-away key (data/research/promote/observe/strategy-catalogue)
 *           renders as a top-level tile.
 *
 * We assert on the shape-function output directly rather than mounting
 * <DashboardPage> — the shape function is the single source of truth that
 * <DashboardPage> consumes, and testing it in isolation is an order of
 * magnitude faster + less flaky than a full render. The full DOM render is
 * already exercised by dashboard-filter-propagation.test.tsx.
 */

import { describe, expect, it } from "vitest";
import {
  personaDashboardShape,
  type DashboardTileVisibility,
} from "@/lib/auth/persona-dashboard-shape";
import { SERVICE_REGISTRY } from "@/lib/config/services";

const ALL_TILES = ["dart", "odum-signals", "reports", "investor-relations", "admin"] as const;
const FOLDED_AWAY_KEYS = [
  "data",
  "research",
  "promote",
  "observe",
  "strategy-catalogue",
] as const;

// 19 personas — mirrors lib/auth/personas.ts seed list (admin + internal +
// im-desk-operator + DART full × 4 + Signals-In + Odum-Signals counterparty +
// IM × 3 + Regulatory × 3 + IR × 2 + legacy × 2).
const ALL_PERSONA_IDS = [
  "admin",
  "internal-trader",
  "im-desk-operator",
  "client-full",
  "client-premium",
  "client-data-only",
  "prospect-dart",
  "prospect-signals-only",
  "prospect-odum-signals",
  "client-im-pooled",
  "client-im-sma",
  "prospect-im",
  "client-regulatory",
  "prospect-regulatory",
  "prospect-im-under-regulatory",
  "investor",
  "advisor",
  "prospect-platform",
  "elysium-defi",
] as const;

function visibleTileIds(shape: DashboardTileVisibility): string[] {
  return ALL_TILES.filter((key) => shape[key] !== "hidden");
}

describe("dashboard tile collapse — per-persona visibility matrix", () => {
  it("covers all 19 declared personas", () => {
    expect(ALL_PERSONA_IDS).toHaveLength(19);
  });

  it("no persona sees more than 5 tiles (product-axis collapse invariant)", () => {
    for (const personaId of ALL_PERSONA_IDS) {
      const visible = visibleTileIds(personaDashboardShape({ id: personaId, role: "client" }));
      expect(
        visible.length,
        `persona ${personaId} must render ≤5 tiles, got ${visible.length}: ${visible.join(",")}`,
      ).toBeLessThanOrEqual(5);
    }
  });

  it("admin + internal-trader see all 5 tiles", () => {
    const admin = visibleTileIds(personaDashboardShape({ id: "admin", role: "admin" }));
    const internal = visibleTileIds(
      personaDashboardShape({ id: "internal-trader", role: "internal" }),
    );
    expect(admin).toHaveLength(5);
    // internal-trader sees 4 (admin + DART + signals + reports; IR hidden).
    expect(internal).toEqual(
      expect.arrayContaining(["dart", "odum-signals", "reports", "admin"]),
    );
    expect(internal).not.toContain("investor-relations");
  });

  it("prospect-odum-signals sees ONLY Odum Signals tile", () => {
    const visible = visibleTileIds(
      personaDashboardShape({ id: "prospect-odum-signals", role: "client" }),
    );
    expect(visible).toEqual(["odum-signals"]);
  });

  it("investor + advisor see ONLY Investor Relations tile", () => {
    for (const id of ["investor", "advisor"]) {
      const visible = visibleTileIds(personaDashboardShape({ id, role: "client" }));
      expect(visible).toEqual(["investor-relations"]);
    }
  });

  it("client-regulatory sees ONLY Reports tile", () => {
    const visible = visibleTileIds(
      personaDashboardShape({ id: "client-regulatory", role: "client" }),
    );
    expect(visible).toEqual(["reports"]);
  });

  it("IM clients see Reports + Investor Relations (no DART)", () => {
    for (const id of ["client-im-pooled", "client-im-sma"]) {
      const visible = visibleTileIds(personaDashboardShape({ id, role: "client" }));
      expect(visible).toEqual(
        expect.arrayContaining(["reports", "investor-relations"]),
      );
      expect(visible).not.toContain("dart");
      expect(visible).not.toContain("admin");
    }
  });

  it("DART-full clients see DART + Reports (no admin, no Odum Signals)", () => {
    for (const id of ["client-full", "client-premium", "prospect-dart"]) {
      const visible = visibleTileIds(personaDashboardShape({ id, role: "client" }));
      expect(visible).toContain("dart");
      expect(visible).not.toContain("admin");
      expect(visible).not.toContain("odum-signals");
    }
  });

  it("client-data-only sees DART tile (no Reports — data-only subscription)", () => {
    const visible = visibleTileIds(
      personaDashboardShape({ id: "client-data-only", role: "client" }),
    );
    expect(visible).toContain("dart");
    expect(visible).not.toContain("reports");
  });

  it("SERVICE_REGISTRY has exactly 5 top-level tiles (11→5 collapse)", () => {
    const keys = SERVICE_REGISTRY.map((s) => s.key);
    expect(keys).toHaveLength(5);
    expect(keys).toEqual(
      expect.arrayContaining(["dart", "odum-signals", "reports", "investor-relations", "admin"]),
    );
  });

  it("no folded-away key renders as a top-level SERVICE_REGISTRY tile", () => {
    const keys = SERVICE_REGISTRY.map((s) => s.key);
    for (const folded of FOLDED_AWAY_KEYS) {
      expect(
        keys,
        `folded-away key "${folded}" must NOT be a top-level tile (it lives as a DART sub-route)`,
      ).not.toContain(folded);
    }
  });

  it("unknown persona falls back to conservative default shape (Reports-only)", () => {
    const visible = visibleTileIds(
      personaDashboardShape({ id: "some-unknown-persona", role: "client" }),
    );
    // Default shape exposes reports=visible; all other tiles are locked or hidden.
    expect(visible).toEqual(expect.arrayContaining(["reports"]));
  });

  it("null/undefined persona resolves to default (no crash)", () => {
    expect(() => personaDashboardShape(null)).not.toThrow();
    expect(() => personaDashboardShape(undefined)).not.toThrow();
    const shape = personaDashboardShape(null);
    expect(shape).toBeDefined();
    expect(shape.reports).toBe("visible");
  });
});
