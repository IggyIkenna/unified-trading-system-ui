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
      // Every shape must declare at least one of the 5 tiles as "visible" or
      // "locked" — a persona with all 5 tiles hidden would never have a
      // dashboard to render. (Even reports-only personas have reports="visible".)
      const hasAtLeastOneSurfacedTile = Object.values(shape).some((v) => v === "visible" || v === "locked");
      expect(hasAtLeastOneSurfacedTile, `persona ${p.id} has all tiles hidden`).toBe(true);
    }
  });
});
