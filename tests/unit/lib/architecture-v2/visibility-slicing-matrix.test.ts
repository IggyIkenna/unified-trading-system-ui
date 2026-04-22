/**
 * Visibility-slicing matrix parity (G3.6).
 *
 * The Playwright spec at `tests/e2e/playbooks/visibility-slicing.spec.ts`
 * reads the pure-function matrix defined in
 * `tests/e2e/playbooks/visibility-slicing-expected.ts`. The e2e tree is
 * excluded from vitest + tsconfig — but the matrix is the single source of
 * truth for the test contract, so we re-run its assertions here under vitest
 * to get coverage, fail-loud-on-drift, and QG blast-radius inside the
 * standard `bash scripts/quality-gates.sh` run.
 *
 * This test intentionally imports via the relative path (same shape the e2e
 * spec uses) to prove the pure functions are portable across runners.
 */

import { describe, expect, it } from "vitest";

import {
  buildMatrix,
  buildPhaseMatrix,
  computeCell,
  countStateBreakdown,
  FALLBACK_PERSONA_ID,
  FLAVOUR_COLUMNS,
  MATRIX_SIZE,
  PERSONA_ROWS,
  PHASE_MATRIX_SIZE,
  ROUTE_ROWS,
  KNOWN_PROFILE_IDS,
} from "../../../../tests/e2e/playbooks/visibility-slicing-expected";
import {
  DASHBOARD_CASES,
  LOCKED_VISIBLE_CELLS,
  MATRIX_CELLS,
  ORPHAN_REACHABILITY_CASES,
  PHASE_CELLS,
  isStagingFirebaseUnavailable,
} from "../../../../tests/e2e/playbooks/visibility-slicing-fixtures";
import { RESTRICTION_PROFILES } from "@/lib/architecture-v2/restriction-profiles";

describe("G3.6 — visibility-slicing matrix parity", () => {
  it("covers ≥7 personas", () => {
    expect(PERSONA_ROWS.length).toBeGreaterThanOrEqual(7);
  });

  it("covers 3 flavour columns (base + turbo + deep_dive)", () => {
    expect(FLAVOUR_COLUMNS.length).toBe(3);
    expect(FLAVOUR_COLUMNS[0]).toBeUndefined();
    expect(FLAVOUR_COLUMNS[1]).toBe("turbo");
    expect(FLAVOUR_COLUMNS[2]).toBe("deep_dive");
  });

  it("covers ≥25 routes", () => {
    expect(ROUTE_ROWS.length).toBeGreaterThanOrEqual(25);
  });

  it("matrix size = personas × flavours × routes", () => {
    expect(MATRIX_SIZE).toBe(PERSONA_ROWS.length * FLAVOUR_COLUMNS.length * ROUTE_ROWS.length);
    expect(MATRIX_CELLS.length).toBe(MATRIX_SIZE);
  });

  it("every cell is in the closed tile-state enum", () => {
    const allowed = new Set(["unlocked", "padlocked-visible", "hidden"]);
    for (const cell of buildMatrix()) {
      expect(allowed.has(cell.tileState)).toBe(true);
    }
  });

  it("every persona.profileId resolves to a known restriction profile", () => {
    for (const persona of PERSONA_ROWS) {
      expect(
        KNOWN_PROFILE_IDS.includes(persona.profileId),
        `${persona.seedId}.profileId=${persona.profileId} missing from restriction-profile registry`,
      ).toBe(true);
      expect(RESTRICTION_PROFILES[persona.profileId]).toBeDefined();
    }
  });

  it("fallback persona-id maps to the anon profile (hidden everywhere)", () => {
    expect(FALLBACK_PERSONA_ID).toBe("anon");
    const anon = RESTRICTION_PROFILES.anon;
    expect(anon).toBeDefined();
    for (const state of Object.values(anon.tiles)) {
      expect(state).toBe("hidden");
    }
  });

  it("admin profile is unlocked for every tile (universe-wide)", () => {
    const admin = RESTRICTION_PROFILES.admin;
    for (const state of Object.values(admin.tiles)) {
      expect(state).toBe("unlocked");
    }
  });

  it("matrix contains at least one padlocked-visible cell (G1.3 contract)", () => {
    const breakdown = countStateBreakdown();
    expect(breakdown["padlocked-visible"]).toBeGreaterThan(0);
  });

  it("matrix contains at least one hidden cell (anon fallback)", () => {
    expect(countStateBreakdown().hidden).toBeGreaterThan(0);
  });

  it("matrix contains at least one unlocked cell (admin)", () => {
    expect(countStateBreakdown().unlocked).toBeGreaterThan(0);
  });

  it("computeCell is deterministic — same input, same output", () => {
    for (let i = 0; i < 5; i++) {
      const first = computeCell(PERSONA_ROWS[0]!, FLAVOUR_COLUMNS[0], ROUTE_ROWS[0]!);
      const second = computeCell(PERSONA_ROWS[0]!, FLAVOUR_COLUMNS[0], ROUTE_ROWS[0]!);
      expect(first).toEqual(second);
    }
  });

  it("phase sub-matrix = phase-sensitive routes × 3", () => {
    const phaseSensitiveRoutes = ROUTE_ROWS.filter((r) => r.phaseSensitive).length;
    expect(PHASE_MATRIX_SIZE).toBe(phaseSensitiveRoutes * 3);
    expect(PHASE_CELLS.length).toBe(PHASE_MATRIX_SIZE);
    expect(buildPhaseMatrix().length).toBe(PHASE_MATRIX_SIZE);
  });

  it("dashboard cases = personas × flavours", () => {
    expect(DASHBOARD_CASES.length).toBe(PERSONA_ROWS.length * FLAVOUR_COLUMNS.length);
  });

  it("locked-visible cells are de-duplicated by (profileId, flavour, tileId)", () => {
    const keys = new Set<string>();
    for (const c of LOCKED_VISIBLE_CELLS) {
      const key = `${c.persona.profileId}|${c.flavour ?? "base"}|${c.tileId}`;
      expect(keys.has(key), `duplicate LOCKED_VISIBLE key ${key}`).toBe(false);
      keys.add(key);
    }
  });

  it("orphan-reachability cases only include cells expected to be reachable", () => {
    for (const orphan of ORPHAN_REACHABILITY_CASES) {
      // At least one flavour must resolve to unlocked for this (persona, route)
      // — matches the fixture construction.
      const someUnlocked = FLAVOUR_COLUMNS.some(
        (f) => computeCell(orphan.persona, f, orphan.route).tileState === "unlocked",
      );
      expect(someUnlocked).toBe(true);
    }
  });

  it("staging emulator is unavailable until refactor_g2_6 lands", () => {
    // Default dev env: NEXT_PUBLIC_USE_FIREBASE_AUTH unset and no staging URL.
    // The helper should correctly identify this as unavailable.
    const origFirebase = process.env.NEXT_PUBLIC_USE_FIREBASE_AUTH;
    const origStagingA = process.env.STAGING_FIREBASE_BASE_URL;
    const origStagingB = process.env.PLAYWRIGHT_STAGING_BASE_URL;
    try {
      delete process.env.NEXT_PUBLIC_USE_FIREBASE_AUTH;
      delete process.env.STAGING_FIREBASE_BASE_URL;
      delete process.env.PLAYWRIGHT_STAGING_BASE_URL;
      expect(isStagingFirebaseUnavailable()).toBe(true);

      process.env.NEXT_PUBLIC_USE_FIREBASE_AUTH = "true";
      process.env.STAGING_FIREBASE_BASE_URL = "https://odum-staging.example";
      expect(isStagingFirebaseUnavailable()).toBe(false);
    } finally {
      if (origFirebase === undefined) delete process.env.NEXT_PUBLIC_USE_FIREBASE_AUTH;
      else process.env.NEXT_PUBLIC_USE_FIREBASE_AUTH = origFirebase;
      if (origStagingA === undefined) delete process.env.STAGING_FIREBASE_BASE_URL;
      else process.env.STAGING_FIREBASE_BASE_URL = origStagingA;
      if (origStagingB === undefined) delete process.env.PLAYWRIGHT_STAGING_BASE_URL;
      else process.env.PLAYWRIGHT_STAGING_BASE_URL = origStagingB;
    }
  });
});
