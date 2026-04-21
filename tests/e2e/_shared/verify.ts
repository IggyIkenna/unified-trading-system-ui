import { expect, type Page } from "@playwright/test";
import type { ScenarioExpectation } from "./fixtures";

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
