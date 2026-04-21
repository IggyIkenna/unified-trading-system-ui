import { test, type Page } from "@playwright/test";

/**
 * Pause at the end of a scenario so a human watching `--project=human` can see
 * the final state before the next action kicks off. No-op for headless/CI.
 *
 * Default 1500ms matches the cadence in the yield-rotation reference spec.
 * Override per call site if a particular scenario needs longer breathing room.
 */
export async function demoPause(page: Page, ms = 1500): Promise<void> {
  if (test.info().project.name === "human") {
    await page.waitForTimeout(ms);
  }
}
