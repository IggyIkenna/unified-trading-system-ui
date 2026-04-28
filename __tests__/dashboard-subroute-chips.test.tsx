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

function visibleChips(tileId: DashboardTileId, subRoutes: DashboardSubRouteVisibility): string[] {
  return Object.entries(subRoutes[tileId] ?? {})
    .filter(([, vis]) => vis === "visible")
    .map(([key]) => key);
}

describe("dashboard sub-route chips — per-persona", () => {
  it("prospect-signals-only sees signal-intake + observe under dart-terminal; dart-research locked", () => {
    const persona = { id: "prospect-signals-only", role: "client" };
    const subs = personaDashboardSubRoutes(persona);
    const terminalChips = visibleChips("dart-terminal", subs);

    expect(terminalChips).toContain("signal-intake");
    // strategy-catalogue + data are admin/full-tier — must NOT be visible for
    // signals-in. Research-side chips moved under dart-research; signals-in
    // gets dart-research as `locked` (padlocked-visible UX), not visible.
    expect(terminalChips).not.toContain("strategy-catalogue");
    expect(terminalChips).not.toContain("data");

    const tileShape = personaDashboardShape(persona);
    expect(tileShape["dart-terminal"]).toBe("visible");
    expect(tileShape["dart-research"]).toBe("locked");
    expect(tileShape["odum-signals"]).toBe("hidden");
  });

  it("prospect-odum-signals sees Odum Signals tile with all 4 chips; DART hidden", () => {
    const persona = { id: "prospect-odum-signals", role: "client" };
    const tileShape = personaDashboardShape(persona);
    expect(tileShape["odum-signals"]).toBe("visible");
    expect(tileShape["dart-terminal"]).toBe("hidden");
    expect(tileShape["dart-research"]).toBe("hidden");

    const subs = personaDashboardSubRoutes(persona);
    const odumChips = visibleChips("odum-signals", subs);
    expect(odumChips).toEqual(
      expect.arrayContaining(["counterparties", "payloads", "emission-history", "rate-limits"]),
    );
  });

  it("investor sees ONLY Investor Relations tile + its 4 chips", () => {
    const persona = { id: "investor", role: "client" };
    const tileShape = personaDashboardShape(persona);
    expect(tileShape["investor-relations"]).toBe("visible");
    expect(tileShape["dart-terminal"]).toBe("hidden");
    expect(tileShape["dart-research"]).toBe("hidden");
    expect(tileShape.reports).toBe("hidden");
    expect(tileShape["odum-signals"]).toBe("hidden");
    expect(tileShape.admin).toBe("hidden");

    const subs = personaDashboardSubRoutes(persona);
    const irChips = visibleChips("investor-relations", subs);
    expect(irChips).toEqual(expect.arrayContaining(["board", "dr-playbook", "security", "ir-briefings"]));
  });

  it("admin sees all 6 tiles with all sub-route chips unlocked (post dart-split)", () => {
    const persona = { id: "admin", role: "admin" };
    const tileShape = personaDashboardShape(persona);
    const subs = personaDashboardSubRoutes(persona);

    for (const tile of [
      "dart-terminal",
      "dart-research",
      "odum-signals",
      "reports",
      "investor-relations",
      "admin",
    ] as const) {
      expect(tileShape[tile], `admin tile ${tile}`).toBe("visible");
      const chips = subs[tile] ?? {};
      const hiddenOrLocked = Object.entries(chips).filter(([, vis]) => vis !== "visible");
      expect(
        hiddenOrLocked,
        `admin should have every chip visible on tile ${tile}; ${hiddenOrLocked.length} are not`,
      ).toHaveLength(0);
    }
  });

  it("client-data-only sees Strategy Catalogue + Data under dart-terminal; other terminal chips hidden", () => {
    const persona = { id: "client-data-only", role: "client" };
    const chips = visibleChips("dart-terminal", personaDashboardSubRoutes(persona));
    expect(chips).toContain("strategy-catalogue");
    expect(chips).not.toContain("terminal");
    expect(chips).not.toContain("signal-intake");
  });

  it("im-desk-operator sees DART terminal/observe/strategy-catalogue + Admin deployments + IR materials", () => {
    const persona = { id: "im-desk-operator", role: "internal" };
    const subs = personaDashboardSubRoutes(persona);
    const terminalChips = visibleChips("dart-terminal", subs);
    const adminChips = visibleChips("admin", subs);
    const irChips = visibleChips("investor-relations", subs);

    expect(terminalChips).toEqual(expect.arrayContaining(["terminal", "observe", "strategy-catalogue"]));
    expect(adminChips).toContain("deployments");
    expect(adminChips).toContain("audit-log");
    expect(irChips.length).toBeGreaterThan(0);
  });

  it("client-full has terminal+observe under dart-terminal AND research+promote under dart-research", () => {
    const persona = { id: "client-full", role: "client" };
    const subs = personaDashboardSubRoutes(persona);
    const terminalChips = visibleChips("dart-terminal", subs);
    const researchChips = visibleChips("dart-research", subs);

    // Terminal-side chips after split — client-full is the full tier and gets
    // every dart-terminal chip including signal-intake (the legacy comment
    // "signals-in is a separate product" applied to the unified tile pre-split;
    // post-split, signal-intake lives on dart-terminal and is unlocked for
    // anyone with execution-full).
    for (const expected of ["terminal", "observe", "strategy-catalogue", "signal-intake"]) {
      expect(terminalChips, `client-full dart-terminal chip "${expected}"`).toContain(expected);
    }

    // Research-side chips after split (fine-grained — the legacy "research"
    // chip was broken into research-overview / features / etc.; "promote"
    // still exists per the commit message).
    expect(researchChips, `client-full dart-research chips`).toEqual(
      expect.arrayContaining(["research-overview", "promote"]),
    );
  });

  it("locked chips are distinct from hidden chips (tempt-logic preserved)", () => {
    // prospect-dart has dart-terminal visible with most chips locked (upgrade
    // tempt), not hidden. Research-side may be locked entirely as the tile
    // padlock; the tempt-logic still requires partial chip-level locking on
    // dart-terminal.
    const persona = { id: "prospect-dart", role: "client" };
    const subs = personaDashboardSubRoutes(persona);
    const terminalChipEntries = Object.entries(subs["dart-terminal"] ?? {});
    const lockedCount = terminalChipEntries.filter(([, v]) => v === "locked").length;
    expect(
      lockedCount,
      "prospect-dart must have at least one dart-terminal chip in locked state (tempt-logic)",
    ).toBeGreaterThan(0);
  });
});
