import * as fs from "node:fs";
import * as path from "node:path";
import type { PersonaKey } from "./persona";

/**
 * Deterministic fixture shape for a strategy flow spec.
 *
 * One JSON file per strategy lives in tests/e2e/fixtures/strategies/.
 * Specs stay dumb — they just iterate `scenarios[]`, drive the widget with the
 * inputs, and hand the expected block to the verify helpers.
 */
export interface StrategyFixture {
  /** Human-readable strategy name, for logs and playbook cross-references. */
  readonly name: string;
  /** Persona to seed before navigation. */
  readonly persona: PersonaKey;
  /** Route to visit relative to the base URL (e.g. "/services/trading/defi"). */
  readonly route: string;
  /** `data-testid` of the primary widget this spec exercises. */
  readonly rootSelector: string;
  /** Playbook doc path (for human readers — not used at runtime). */
  readonly playbook?: string;
  /** Ordered scenarios to run in a single continuous browser session. */
  readonly scenarios: readonly StrategyScenario[];
}

export interface StrategyScenario {
  /** Scenario label shown in the test title. */
  readonly name: string;
  /** Widget inputs, shape depends on the widget under test. */
  readonly inputs: Readonly<Record<string, string | number | boolean | null>>;
  /** Expected outcomes — consumed by verify helpers. */
  readonly expected: ScenarioExpectation;
}

export interface ScenarioExpectation {
  /** Trade-history row type this scenario should produce (e.g. "LEND"). */
  readonly tradeType?: string;
  /** Minimum net row count added to the ledger (usually 1). */
  readonly minRowsAdded?: number;
  /** Substring the row's data-trade-venue should contain. */
  readonly venueContains?: string;
  /** Free-form notes for humans. */
  readonly notes?: string;
}

const FIXTURE_DIR = path.join(process.cwd(), "tests/e2e/fixtures/strategies");

/**
 * Load + validate a strategy fixture by slug (filename without .json).
 *
 * Throws at test-collection time if the file is missing so you fail fast rather
 * than getting a confusing runtime "cannot read property X" midway through a run.
 */
export function loadStrategyFixture(slug: string): StrategyFixture {
  const file = path.join(FIXTURE_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`[fixtures] strategy fixture not found: ${file}`);
  }
  const raw = fs.readFileSync(file, "utf8");
  const parsed = JSON.parse(raw) as StrategyFixture;
  if (!parsed.scenarios?.length) {
    throw new Error(`[fixtures] ${slug}.json has no scenarios`);
  }
  return parsed;
}
