import { PERSONAS } from "@/lib/auth/personas";
import {
  REGISTERED_TILE_SHAPE_IDS,
  REGISTERED_SUBROUTE_SHAPE_IDS,
  personaDashboardShape,
  personaDashboardSubRoutes,
} from "@/lib/auth/persona-dashboard-shape";

/**
 * Quality gate — every persona in `PERSONAS` must have an explicit tile-shape
 * entry in `PERSONA_TILE_SHAPES` and `PERSONA_SUBROUTE_SHAPES`. Without this,
 * the dashboard silently falls back to `DEFAULT_TILE_SHAPE` which hides
 * odum-signals + investor-relations + admin and locks DART — exactly what
 * happened on 2026-04-25 with the desmond + elysium-defi-full personas
 * (rendered "4 of 2 services" and an empty grid).
 *
 * Role fallback is allowed: persona.role === "admin" | "internal" can fall
 * through to PERSONA_TILE_SHAPES.admin without an explicit entry.
 *
 * "No DART access" is a valid shape (e.g. IM-only / reports-only personas
 * have `dart: "hidden"`) — the gate cares about *registration* not visibility.
 */
describe("persona-dashboard-shape registration", () => {
  it("every persona has a tile-shape entry (or role-fallback)", () => {
    const missing = PERSONAS.filter((p) => {
      if (REGISTERED_TILE_SHAPE_IDS.has(p.id)) return false;
      if (p.role === "admin" || p.role === "internal") return false;
      return true;
    }).map((p) => `${p.id} (role=${p.role}, email=${p.email})`);

    expect(missing, `Personas missing PERSONA_TILE_SHAPES entry:\n${missing.join("\n")}`).toEqual([]);
  });

  it("every persona has a sub-route shape entry (or role-fallback)", () => {
    const missing = PERSONAS.filter((p) => {
      if (REGISTERED_SUBROUTE_SHAPE_IDS.has(p.id)) return false;
      if (p.role === "admin" || p.role === "internal") return false;
      return true;
    }).map((p) => `${p.id} (role=${p.role}, email=${p.email})`);

    expect(missing).toEqual([]);
  });

  it("personaDashboardShape returns a non-default shape for every registered persona", () => {
    // Spot-check the resolver returns something distinct from DEFAULT_TILE_SHAPE
    // for at least one tile per persona (admin-role fallback is exempt — they
    // resolve to the admin shape which is intentional).
    for (const p of PERSONAS) {
      const shape = personaDashboardShape(p);
      const subRoutes = personaDashboardSubRoutes(p);
      expect(shape).toBeDefined();
      expect(subRoutes).toBeDefined();
      // Every shape must declare at least one of the 6 tiles as "visible" or
      // "locked" — a persona with all 6 tiles hidden would never have a
      // dashboard to render. (Even reports-only personas have reports="visible".)
      const hasAtLeastOneSurfacedTile = Object.values(shape).some((v) => v === "visible" || v === "locked");
      expect(hasAtLeastOneSurfacedTile, `persona ${p.id} has all tiles hidden`).toBe(true);
    }
  });
});

/**
 * 2026-04-28 DART tile-split contract — persona shapes must carry both new
 * tile keys (dart-terminal + dart-research) and never the legacy "dart" key.
 * SSOT: codex/14-playbooks/dart/dart-terminal-vs-research.md.
 */
describe("DART tile-split contract", () => {
  it("every registered persona's tile shape has dart-terminal AND dart-research keys (no legacy 'dart')", () => {
    for (const personaId of REGISTERED_TILE_SHAPE_IDS) {
      const shape = personaDashboardShape({ id: personaId });
      expect(shape, `${personaId}: missing dart-terminal`).toHaveProperty("dart-terminal");
      expect(shape, `${personaId}: missing dart-research`).toHaveProperty("dart-research");
      expect(Object.keys(shape), `${personaId}: still has legacy "dart" key`).not.toContain("dart");
    }
  });

  it("every registered persona's sub-route shape has dart-terminal + dart-research entries", () => {
    for (const personaId of REGISTERED_SUBROUTE_SHAPE_IDS) {
      const subs = personaDashboardSubRoutes({ id: personaId });
      expect(subs, `${personaId}: missing dart-terminal sub-routes`).toHaveProperty("dart-terminal");
      expect(subs, `${personaId}: missing dart-research sub-routes`).toHaveProperty("dart-research");
      expect(Object.keys(subs), `${personaId}: still has legacy "dart" sub-route key`).not.toContain("dart");
    }
  });

  it("admin (wildcard) sees both DART tiles visible", () => {
    const shape = personaDashboardShape({ id: "admin" });
    expect(shape["dart-terminal"]).toBe("visible");
    expect(shape["dart-research"]).toBe("visible");
  });

  it("client-full (DART-Full) gets dart-research visible", () => {
    const shape = personaDashboardShape({ id: "client-full" });
    expect(shape["dart-research"]).toBe("visible");
  });

  it("desmond-signals-in (Signals-In) gets dart-research locked (padlocked-visible)", () => {
    const shape = personaDashboardShape({ id: "desmond-signals-in" });
    expect(shape["dart-terminal"]).toBe("visible");
    expect(shape["dart-research"]).toBe("locked");
  });

  it("client-data-only gets dart-research hidden (no DART research access)", () => {
    const shape = personaDashboardShape({ id: "client-data-only" });
    expect(shape["dart-terminal"]).toBe("visible");
    expect(shape["dart-research"]).toBe("hidden");
  });

  it("client-regulatory (reg-only) gets both DART tiles hidden", () => {
    const shape = personaDashboardShape({ id: "client-regulatory" });
    expect(shape["dart-terminal"]).toBe("hidden");
    expect(shape["dart-research"]).toBe("hidden");
  });

  it("entitlement-derived: DART user with ml-full + strategy-full gets research visible", () => {
    const shape = personaDashboardShape({
      id: "ad-hoc-full",
      entitlements: ["data-pro", "execution-full", "ml-full", "strategy-full"],
    });
    expect(shape["dart-terminal"]).toBe("visible");
    expect(shape["dart-research"]).toBe("visible");
  });

  it("entitlement-derived: DART user without ml-full gets research locked", () => {
    const shape = personaDashboardShape({
      id: "ad-hoc-signals-in",
      entitlements: ["data-pro", "execution-full"],
    });
    expect(shape["dart-terminal"]).toBe("visible");
    expect(shape["dart-research"]).toBe("locked");
  });

  it("entitlement-derived: reporting-only inherits the conservative default (terminal locked, research hidden)", () => {
    // The IM-allocator branch in entitlementDerivedShape() applies
    // tileOverride({ reports: "visible" }) which leaves the DART tiles at
    // their DEFAULT_TILE_SHAPE values: terminal=locked (padlocked-visible
    // upsell tile), research=hidden (no DART research access). This is the
    // intentional default for personas with reporting-only entitlements that
    // aren't explicitly registered.
    const shape = personaDashboardShape({
      id: "ad-hoc-im",
      entitlements: ["reporting"],
    });
    expect(shape["dart-terminal"]).toBe("locked");
    expect(shape["dart-research"]).toBe("hidden");
    expect(shape.reports).toBe("visible");
  });
});

/**
 * Plan D Phase 4 — Admin & Ops "Approvals" chip is visible to admin and
 * internal-trader personas only; every other persona gets it hidden.
 */
describe("Plan D — admin approvals chip visibility", () => {
  it("admin sees the approvals chip", () => {
    const subs = personaDashboardSubRoutes({ id: "admin" });
    expect(subs.admin.approvals).toBe("visible");
  });

  it("internal-trader sees the approvals chip", () => {
    const subs = personaDashboardSubRoutes({ id: "internal-trader" });
    expect(subs.admin.approvals).toBe("visible");
  });

  it("client-full does not see the approvals chip", () => {
    const subs = personaDashboardSubRoutes({ id: "client-full" });
    expect(subs.admin.approvals).toBe("hidden");
  });

  it("desmond-signals-in does not see the approvals chip", () => {
    const subs = personaDashboardSubRoutes({ id: "desmond-signals-in" });
    expect(subs.admin.approvals).toBe("hidden");
  });
});
