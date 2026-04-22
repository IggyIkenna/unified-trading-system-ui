import { expect, type Locator, type Page } from "@playwright/test";
import type { ObservationWidgetSpec, ScenarioExpectation, StrategyFixture } from "./fixtures";

/**
 * Shared verification helpers for strategy flow specs.
 *
 * Widgets are responsible for decorating their rendered rows with stable
 * data-testid + data-* attributes; these helpers just poll/assert against them.
 * Keep the assertions loose enough that fixture renames don't snap tests —
 * "count went up" + "a row with type=X exists" is the usual contract.
 */

const TRADE_ROW = '[data-testid="trade-history-row"]';

export async function countTradeRows(page: Page): Promise<number> {
  return page.locator(TRADE_ROW).count();
}

/**
 * Wait until at least `minAdded` new rows have appeared since `beforeCount`,
 * or fail with a clear message. Mock ledger fills after ~200 ms so 5s of slack
 * is plenty under normal CI pressure.
 */
export async function expectRowsAdded(page: Page, beforeCount: number, minAdded = 1, timeout = 5_000): Promise<void> {
  await expect.poll(() => countTradeRows(page), { timeout }).toBeGreaterThanOrEqual(beforeCount + minAdded);
}

/**
 * Assert a trade-history row exists for the given type (and optionally a venue
 * substring match). Visibility is deliberately not asserted — the ledger is a
 * scroll container, so off-screen rows are still "present" in the DOM.
 */
export async function expectTradeRow(
  page: Page,
  expected: Pick<ScenarioExpectation, "tradeType" | "venueContains">,
): Promise<void> {
  if (!expected.tradeType) return;
  const rows = page.locator(`${TRADE_ROW}[data-trade-type="${expected.tradeType}"]`);
  const count = await rows.count();
  expect(count, `expected at least one row with data-trade-type="${expected.tradeType}"`).toBeGreaterThan(0);

  if (expected.venueContains) {
    const first = rows.first();
    const venue = (await first.getAttribute("data-trade-venue")) ?? "";
    expect(
      venue.toUpperCase().includes(expected.venueContains.toUpperCase()),
      `expected data-trade-venue to contain "${expected.venueContains}", got "${venue}"`,
    ).toBe(true);
  }
}

/**
 * End-to-end scenario verification: wait for rows to appear, then assert the
 * newest row of the expected type.
 */
export async function verifyScenarioOutcome(
  page: Page,
  beforeCount: number,
  expected: ScenarioExpectation,
): Promise<void> {
  if (expected.minRowsAdded !== undefined && expected.minRowsAdded > 0) {
    await expectRowsAdded(page, beforeCount, expected.minRowsAdded);
  }
  await expectTradeRow(page, expected);
}

// ---------------------------------------------------------------------------
// Observation-widget helpers
//
// Read-only widgets mount alongside the execution widget on each strategy
// route. At baseline we only assert visibility. For mutating scenarios callers
// can snapshot the widget text content pre-execute and re-assert post-execute
// to confirm the widget reacted to the new ledger state.
// ---------------------------------------------------------------------------

/**
 * Assert every `observationWidgets[*]` entry in the fixture is visible on the
 * page. Skips gracefully when the fixture does not declare any.
 */
export async function verifyObservationWidgetsVisible(page: Page, fixture: StrategyFixture): Promise<void> {
  for (const spec of fixture.observationWidgets ?? []) {
    if (spec.assertVisible === false) continue;
    const loc = page.locator(`[data-testid="${spec.testid}"]`);
    await expect(loc, `observation widget "${spec.testid}" should be visible`).toBeVisible();
  }
}

/** Map from observation-widget testid to its pre-execute textContent snapshot. */
export type ObservationSnapshot = Map<string, string>;

/**
 * Capture text content for every observation widget whose `assertsUpdatedAfter`
 * list includes `tradeType`. Call *before* executing the instruction; pair
 * with `verifyObservationsUpdated(...)` after.
 */
export async function snapshotObservationWidgets(
  page: Page,
  fixture: StrategyFixture,
  tradeType: string,
): Promise<ObservationSnapshot> {
  const snapshot: ObservationSnapshot = new Map();
  for (const spec of fixture.observationWidgets ?? []) {
    if (!spec.assertsUpdatedAfter?.includes(tradeType)) continue;
    const loc: Locator = page.locator(`[data-testid="${spec.testid}"]`);
    if ((await loc.count()) === 0) continue;
    snapshot.set(spec.testid, (await loc.textContent()) ?? "");
  }
  return snapshot;
}

/**
 * Assert that every snapshot captured by `snapshotObservationWidgets()` has
 * changed textContent post-execute. Silent if the snapshot is empty (no widgets
 * opted into delta tracking for this trade type).
 */
export async function verifyObservationsUpdated(
  page: Page,
  snapshot: ObservationSnapshot,
  timeout = 4_000,
): Promise<void> {
  for (const [testid, before] of snapshot) {
    const loc = page.locator(`[data-testid="${testid}"]`);
    await expect
      .poll(async () => (await loc.textContent()) ?? "", {
        timeout,
        message: `observation widget "${testid}" should re-render after execute (text snapshot unchanged)`,
      })
      .not.toBe(before);
  }
}

/**
 * Convenience wrapper used by specs that only want baseline visibility + a
 * single post-execute delta check (no pre-snapshot). Waits for any widget
 * listed for `tradeType` to become visible, then polls until its text content
 * is non-empty — catches empty skeleton states but does not enforce delta.
 */
export async function verifyObservationWidgetsResponsive(
  page: Page,
  fixture: StrategyFixture,
  tradeType: string,
): Promise<void> {
  const relevant: ObservationWidgetSpec[] = (fixture.observationWidgets ?? []).filter((s) =>
    s.assertsUpdatedAfter?.includes(tradeType),
  );
  for (const spec of relevant) {
    const loc = page.locator(`[data-testid="${spec.testid}"]`);
    await expect(loc).toBeVisible();
    await expect
      .poll(async () => ((await loc.textContent()) ?? "").trim().length, { timeout: 4_000 })
      .toBeGreaterThan(0);
  }
}
