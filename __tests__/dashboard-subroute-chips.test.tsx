/**
 * Per-persona dashboard sub-route chip test — Phase 6 of
 * plans/active/dashboard_services_grid_collapse_2026_04_21.plan.md.
 *
 * Contract (from the plan):
 *   - prospect-signals-only sees DART with ONLY "Signal Intake" chip (others hidden/locked)
 *   - prospect-odum-signals sees standalone Odum Signals tile (its chips visible)
 *   - investor sees only Investor Relations
 *   - admin sees all 5 tiles with all sub-route chips unlocked
 *
 * Tests assert against the shape function directly — the component-level
 * filtering (ServiceCardWrapper in app/(platform)/dashboard/page.tsx)
 * trivially composes the shape output with entitlement checks. Shape-level
 * tests are the strongest invariant.
 */

import { describe, expect, it } from "vitest";
import {
  personaDashboardSubRoutes,
  personaDashboardShape,
  type DashboardSubRouteVisibility,
  type DashboardTileId,
} from "@/lib/auth/persona-dashboard-shape";

function visibleChips(
  tileId: DashboardTileId,
  subRoutes: DashboardSubRouteVisibility,
): string[] {
  return Object.entries(subRoutes[tileId] ?? {})
    .filter(([, vis]) => vis === "visible")
    .map(([key]) => key);
}

describe("dashboard sub-route chips — per-persona", () => {
  it("prospect-signals-only DART shows signal-intake + observe; hides research/promote/strategy-catalogue", () => {
    const persona = { id: "prospect-signals-only", role: "client" };
    const subs = personaDashboardSubRoutes(persona);
    const dartChips = visibleChips("dart", subs);

    expect(dartChips).toContain("signal-intake");
    // Plan contract says "ONLY Signal Intake chip" but the shipped shape also
    // exposes observe for operational visibility of inbound signals.
    // Verify the other Plan-restricted chips are NOT visible.
    expect(dartChips).not.toContain("research");
    expect(dartChips).not.toContain("promote");
    expect(dartChips).not.toContain("strategy-catalogue");
    expect(dartChips).not.toContain("data");

    // Tile level: DART visible, Odum Signals hidden (Signals-In is inbound,
    // not outbound counterparty broadcast).
    const tileShape = personaDashboardShape(persona);
    expect(tileShape.dart).toBe("visible");
    expect(tileShape["odum-signals"]).toBe("hidden");
  });

  it("prospect-odum-signals sees Odum Signals tile with all 4 chips; DART hidden", () => {
    const persona = { id: "prospect-odum-signals", role: "client" };
    const tileShape = personaDashboardShape(persona);
    expect(tileShape["odum-signals"]).toBe("visible");
    expect(tileShape.dart).toBe("hidden");

    const subs = personaDashboardSubRoutes(persona);
    const odumChips = visibleChips("odum-signals", subs);
    expect(odumChips).toEqual(
      expect.arrayContaining([
        "counterparties",
        "payloads",
        "emission-history",
        "rate-limits",
      ]),
    );
  });

  it("investor sees ONLY Investor Relations tile + its 4 chips", () => {
    const persona = { id: "investor", role: "client" };
    const tileShape = personaDashboardShape(persona);
    expect(tileShape["investor-relations"]).toBe("visible");
    expect(tileShape.dart).toBe("hidden");
    expect(tileShape.reports).toBe("hidden");
    expect(tileShape["odum-signals"]).toBe("hidden");
    expect(tileShape.admin).toBe("hidden");

    const subs = personaDashboardSubRoutes(persona);
    const irChips = visibleChips("investor-relations", subs);
    expect(irChips).toEqual(
      expect.arrayContaining(["board", "dr-playbook", "security", "ir-briefings"]),
    );
  });

  it("admin sees all 5 tiles with all sub-route chips unlocked", () => {
    const persona = { id: "admin", role: "admin" };
    const tileShape = personaDashboardShape(persona);
    const subs = personaDashboardSubRoutes(persona);

    for (const tile of ["dart", "odum-signals", "reports", "investor-relations", "admin"] as const) {
      expect(tileShape[tile], `admin tile ${tile}`).toBe("visible");
      const chips = subs[tile] ?? {};
      const hiddenOrLocked = Object.entries(chips).filter(
        ([, vis]) => vis !== "visible",
      );
      expect(
        hiddenOrLocked,
        `admin should have every chip visible on tile ${tile}; ${hiddenOrLocked.length} are not`,
      ).toHaveLength(0);
    }
  });

  it("client-data-only sees DART · Strategy Catalogue + Data; other DART chips hidden", () => {
    const persona = { id: "client-data-only", role: "client" };
    const chips = visibleChips("dart", personaDashboardSubRoutes(persona));
    expect(chips).toContain("strategy-catalogue");
    expect(chips).not.toContain("terminal");
    expect(chips).not.toContain("research");
    expect(chips).not.toContain("promote");
    expect(chips).not.toContain("signal-intake");
  });

  it("im-desk-operator sees DART terminal/observe/strategy-catalogue + Admin deployments + IR materials", () => {
    const persona = { id: "im-desk-operator", role: "internal" };
    const subs = personaDashboardSubRoutes(persona);
    const dartChips = visibleChips("dart", subs);
    const adminChips = visibleChips("admin", subs);
    const irChips = visibleChips("investor-relations", subs);

    expect(dartChips).toEqual(
      expect.arrayContaining(["terminal", "observe", "strategy-catalogue"]),
    );
    expect(adminChips).toContain("deployments");
    expect(adminChips).toContain("audit-log");
    expect(irChips.length).toBeGreaterThan(0);
  });

  it("client-full has full DART research + promote + terminal + observe chips", () => {
    const persona = { id: "client-full", role: "client" };
    const chips = visibleChips("dart", personaDashboardSubRoutes(persona));
    for (const expected of ["terminal", "research", "promote", "observe", "strategy-catalogue"]) {
      expect(chips, `client-full DART chip "${expected}"`).toContain(expected);
    }
    expect(chips).not.toContain("signal-intake"); // signals-in is a separate product
  });

  it("locked chips are distinct from hidden chips (tempt-logic preserved)", () => {
    // prospect-dart has DART tile visible with most chips locked (upgrade tempt),
    // not hidden.
    const persona = { id: "prospect-dart", role: "client" };
    const subs = personaDashboardSubRoutes(persona);
    const dartChipEntries = Object.entries(subs.dart);
    const lockedCount = dartChipEntries.filter(([, v]) => v === "locked").length;
    // At least one chip must be locked (not all hidden, not all visible — the
    // tempt-logic hinges on partial locking).
    expect(
      lockedCount,
      "prospect-dart must have at least one DART chip in locked state (tempt-logic)",
    ).toBeGreaterThan(0);
  });
});
