/**
 * Single source of truth for e2e test-run tunables.
 *
 * Consumed by:
 *  - playwright.config.ts (project definitions)
 *  - any spec/helper that needs to branch on mode
 *
 * Edit values here; do NOT hard-code them elsewhere.
 */

export const E2E_CONFIG = {
  /**
   * Default project — fast, headless. Used by CI and local `npx playwright test`.
   */
  default: {
    headless: true,
    slowMo: 0,
  },

  /**
   * `--project=human` — visible browser, paced so a human can follow along.
   * Bump slowMo if 700ms feels rushed; drop to ~300ms for faster demo replay.
   * Viewport is large so widgets + ledger fit without scrolling.
   */
  human: {
    headless: false,
    slowMo: 700,
    viewport: { width: 1600, height: 1000 },
  },

  /**
   * Base URL for the Next dev server. Override via PLAYWRIGHT_BASE_URL env.
   */
  baseURL: process.env.PLAYWRIGHT_BASE_URL ?? process.env.BASE_URL ?? "http://localhost:3000",
} as const;
