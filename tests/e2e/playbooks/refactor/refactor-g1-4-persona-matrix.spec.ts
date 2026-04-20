import { expect, test } from "@playwright/test";

import { PERSONAS } from "@/lib/auth/personas";

/**
 * Refactor G1.4 — Persona combinatorial expansion (11 → 17).
 *
 * Wave F expansion of `lib/auth/personas.ts`. Six new personas cover the
 * questionnaire-axis combinations previously absent:
 *
 *   - prospect-dart         (CeFi ML-directional warm DART prospect)
 *   - client-regulatory     (Reg Umbrella emerging-manager client)
 *   - client-im-pooled      (IM client on pooled-fund share class)
 *   - client-im-sma         (IM client on SMA structure)
 *   - prospect-signals-only (DART signals-only prospect — block-6 excluded)
 *   - im-desk-operator      (rule 12 IM_desk service family)
 *
 * Each persona's entitlement set respects rule 12 service-family scope
 * (validated by the UAC `check_service_family_scope` unit suite).
 *
 * Deferred to follow-ups:
 *   - Restriction-profile YAML additions for brand-new audience shapes
 *     — all 6 new personas reuse existing YAML profiles (prospect-dart,
 *     prospect-im, prospect-regulatory, admin). A dedicated `IM_desk.yaml`
 *     + `client-im-pooled.yaml` is G2.x scope.
 *   - Screenshot regeneration across the full 17 personas — tier-0
 *     `screenshots.spec.ts` iterates the PERSONAS array; this spec
 *     asserts the set size + coverage, leaving the screenshot pass to
 *     the existing CI job.
 *   - Staging Firebase provisioning — ticket #12 scope.
 */

const EXPECTED_NEW_PERSONAS = [
  "prospect-dart",
  "client-regulatory",
  "client-im-pooled",
  "client-im-sma",
  "prospect-signals-only",
  "im-desk-operator",
] as const;

test.describe("refactor G1.4 — persona matrix expansion", () => {
  test("PERSONAS registry has 17 entries (11 base + 6 new)", () => {
    expect(PERSONAS.length).toBe(17);
  });

  test("every new persona has a unique id", () => {
    const ids = new Set(PERSONAS.map((p) => p.id));
    expect(ids.size).toBe(PERSONAS.length);
    for (const id of EXPECTED_NEW_PERSONAS) {
      expect(ids.has(id), `persona '${id}' must exist in registry`).toBe(true);
    }
  });

  test("every persona has a realistic email + displayName + role", () => {
    for (const persona of PERSONAS) {
      expect(persona.email, `persona ${persona.id} must have email`).toMatch(/@/);
      expect(persona.displayName.length, `persona ${persona.id} displayName non-empty`).toBeGreaterThan(
        0,
      );
      expect(
        ["admin", "client", "internal"],
        `persona ${persona.id} role must be admin|client|internal`,
      ).toContain(persona.role);
    }
  });

  test("new IM-family personas have reporting + IR-adjacent entitlements only", () => {
    const pooled = PERSONAS.find((p) => p.id === "client-im-pooled");
    expect(pooled).toBeDefined();
    if (pooled === undefined) return;
    // IM clients must have reporting; must NOT have strategy-full (that's DART).
    const entitlementStrings = pooled.entitlements.map((e) =>
      typeof e === "string" ? e : e.domain,
    );
    expect(entitlementStrings).toContain("reporting");
    expect(entitlementStrings).not.toContain("strategy-full");
    expect(entitlementStrings).not.toContain("ml-full");
  });

  test("prospect-dart persona has full DART entitlement set", () => {
    const pd = PERSONAS.find((p) => p.id === "prospect-dart");
    expect(pd).toBeDefined();
    if (pd === undefined) return;
    const entitlementStrings = pd.entitlements.map((e) =>
      typeof e === "string" ? e : e.domain,
    );
    // DART prospects see data + research + ml + strategy + reporting.
    expect(entitlementStrings).toEqual(
      expect.arrayContaining(["data-pro", "ml-full", "strategy-full", "reporting"]),
    );
  });

  test("im-desk-operator has wildcard entitlements (rule 12 IM_desk)", () => {
    const desk = PERSONAS.find((p) => p.id === "im-desk-operator");
    expect(desk).toBeDefined();
    if (desk === undefined) return;
    expect(desk.entitlements).toContain("*");
    expect(desk.role).toBe("internal");
  });

  test("prospect-signals-only excludes research/ml-full (block-6 not purchased)", () => {
    const sig = PERSONAS.find((p) => p.id === "prospect-signals-only");
    expect(sig).toBeDefined();
    if (sig === undefined) return;
    const entitlementStrings = sig.entitlements.map((e) =>
      typeof e === "string" ? e : e.domain,
    );
    // Signals-only prospects buy execution + data + reporting, NOT research.
    expect(entitlementStrings).toContain("execution-full");
    expect(entitlementStrings).toContain("reporting");
    expect(entitlementStrings).not.toContain("ml-full");
    expect(entitlementStrings).not.toContain("strategy-full");
  });
});
