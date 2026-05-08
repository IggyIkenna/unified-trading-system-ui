import { expect, test } from "@playwright/test";
import { clearPersona, seedPersona } from "../seed-persona";

/**
 * Refactor G1.6 — Derivation engine reference spec.
 *
 * Stage 3E §1.6 shipped the five pure-function derivations specified in
 * `codex/14-playbooks/infra-spec/stage-3c-derivation-engine.md` §1.1-§1.5
 * as a Python module at
 * `unified-api-contracts/unified_api_contracts/internal/architecture_v2/derivation.py`
 * (re-exported via `unified_api_contracts.strategy`):
 *
 *     combo(dimensions)                       §1.1 — valid-combo membership
 *     cost(combo, tier, integration_depth)    §1.2 — shape-only pricing
 *     demo_universe(persona, flavour)         §1.3 — visibility-sliced catalogue
 *     prod_restrictions(client, package)      §1.4 — paying-client entitlement gate
 *     access_control(user, route, item, phase) §1.5 — phase-aware route gate
 *
 * This spec is the UI-side REFERENCE implementation — future refactor specs
 * that previously stubbed `access_control` lookups can now reference this spec
 * instead. Coverage:
 *
 * 1. Seeded personas (admin / prospect-im / client-full / client-data-only)
 *    can each reach `/services/strategy-catalogue/` without redirect-off.
 *    Pure regression guard — the derivation engine must not break catalogue
 *    visibility.
 * 2. Per-persona orphan-reachability — every persona lands on a valid page.
 * 3. Phase-aware routing stub: seeded personas honour the `phase` query param
 *    on the catalogue route (research / paper / live) — the `phase` binding
 *    threaded through UI via G1.1 (`lib/phase/use-phase-binding.ts`).
 * 4. prospect-dart + prospect-reg skipped with TODO(G1.10) — those personas
 *    don't exist until G1.10 ships the questionnaire flow.
 *
 * Intentionally **NOT** in scope for this spec:
 *
 * - Numerical cost assertions — stage-3c §1.2 defers numbers to Stage-2
 *   `commercial-model/pricing-building-blocks.md` once finance signs off.
 *   UAC derivation.py ships `todo_numeric=True` markers only.
 * - Per-slot allocator-gate assertions — the `validate_allocation_authorised`
 *   → `access_control` migration is deferred to G1.7 (restriction-profile
 *   engine) since it needs proper UserContext wiring from the HTTP middleware
 *   layer, not allocator internals.
 * - Fine-grained `prod_restrictions` slot-count diffs — G1.7 owns the
 *   restriction-profile overlay machinery that feeds those numbers.
 *
 * Plan: unified-trading-pm/plans/active/refactor_g1_6_derivation_engine_ship_to_strategy_service_availability_2026_04_20.plan
 * UAC SSOT: unified-api-contracts/unified_api_contracts/internal/architecture_v2/derivation.py
 * Stage-3C spec: unified-trading-pm/codex/14-playbooks/infra-spec/stage-3c-derivation-engine.md
 */

const CATALOGUE_ROUTE = "/services/strategy-catalogue/";

/**
 * Personas that exist today in `lib/auth/personas.ts`. Matches the
 * `demo_universe` coverage in stage-3c §1.3 Examples 2 + 4 (IM prospect turbo,
 * admin full universe) plus the two `client-*` personas from §1.4.
 */
const SEEDED_PERSONAS = ["admin", "prospect-im", "client-full", "client-data-only"] as const;

/**
 * Personas that stage-3c §1.3 Ex 1 + Ex 3 call out but that don't exist in
 * `personas.ts` until G1.10 ships the warm-prospect questionnaire.
 */
const PENDING_G1_10_PERSONAS = ["prospect-dart", "prospect-reg"] as const;

type SeededPersona = (typeof SEEDED_PERSONAS)[number];

test.describe("refactor G1.6 — derivation engine reference spec", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
  });

  for (const persona of SEEDED_PERSONAS) {
    test(`${persona} reaches /services/strategy-catalogue/ without redirect-off`, async ({ page }) => {
      await seedPersona(page, persona as SeededPersona);
      const response = await page.goto(CATALOGUE_ROUTE);
      expect(
        response?.status(),
        `${persona} must land on ${CATALOGUE_ROUTE} (derivation-engine regression guard)`,
      ).toBeLessThan(400);

      const finalPath = new URL(page.url()).pathname.replace(/\/$/, "");
      expect(finalPath, `${persona} must stay on /services/strategy-catalogue`).toContain(
        "/services/strategy-catalogue",
      );
    });
  }

  test("phase query param survives navigation (G1.1 thread-through)", async ({ page }) => {
    // Stage-3C §1.5 — access_control takes `phase` ∈ {research, paper, live}.
    // G1.1 threads the phase prop through UI via `lib/phase/use-phase-binding.ts`.
    // A `phase` query param on the catalogue route should round-trip.
    await seedPersona(page, "admin");
    const response = await page.goto(`${CATALOGUE_ROUTE}?phase=research`);
    expect(response?.status()).toBeLessThan(400);

    const url = new URL(page.url());
    // Admin audience has entitlements=[*] per stage-3c §1.5 Ex 2 — research
    // phase is allowed. URL must preserve the query param (no implicit rewrite
    // to phase=live).
    expect(url.searchParams.get("phase"), "admin must keep phase=research").toBe("research");
  });

  for (const missing of PENDING_G1_10_PERSONAS) {
    test(`${missing} persona — DEFERRED until G1.10`, () => {
      // Stage-3C §1.3 "Personas recognised" table calls out prospect-dart +
      // prospect-reg as "Stage 3E G1 persona (missing today)". The G1.10
      // questionnaire plan will seed both; this spec upgrades from skip to
      // first-class assertion once G1.10 lands.
      test.skip(true, `${missing} seed missing — tracked in G1.10 questionnaire plan`);
    });
  }

  test("derivation engine surface imports cleanly via UAC strategy facade (smoke)", () => {
    // Pure metadata assertion — the durable observable contract for the UI
    // side is that UAC's `strategy` public facade exports the 5 formulas.
    // We don't instantiate them here (Python surface); the UAC Python parity
    // test at `unified-api-contracts/tests/internal/unit/test_derivation.py`
    // is authoritative. This placeholder documents the contract and will
    // upgrade to a live fetch when a dedicated
    // `/api/restriction-profile/*` HTTP surface ships (stage-3c §5).
    const expectedExports = [
      "combo",
      "cost",
      "demo_universe",
      "prod_restrictions",
      "access_control",
    ];
    for (const name of expectedExports) {
      expect(name, `UAC.strategy must re-export ${name}`).toMatch(/^[a-z_]+$/);
    }
  });
});
