import { expect, test } from "@playwright/test";

/**
 * Auth / IA smoke for **local dev** (`pnpm dev` on the UI, demo auth).
 *
 * - **Staging** (`NEXT_PUBLIC_STAGING_AUTH`, demo Firebase keys): set `PLAYWRIGHT_BASE_URL` in the environment
 *   (see `playwright.config.ts`) — e.g. `https://odumresearch.co.uk` — after passing the staging gate manually
 *   or seeding `localStorage` (`staging-authenticated`).
 * **Production** (Firebase, real users): do **not** automate credential entry; use supervised
 * manual QA or SSO-backed test principals only.
 */

test.describe("Auth + five-space shell (dev)", () => {
  test("public marketing header includes Spaces + Briefings opens access dialog", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await page.getByRole("button", { name: /Spaces/i }).click();
    await expect(page.getByRole("menuitem", { name: /Briefings hub/i })).toBeVisible();
    await page.getByRole("menuitem", { name: /Briefings hub/i }).click();
    await expect(page.getByRole("dialog", { name: /Briefings Hub/i })).toBeVisible();
    await expect(page.getByTestId("locked-item-code-input")).toBeVisible();
    await expect(page.getByTestId("locked-item-contact")).toBeVisible();
    await expect(page.getByTestId("locked-item-demo")).toBeVisible();
  });

  test("demo investor persona reaches investor relations", async ({ page }) => {
    await page.goto(`${base}/login`, { waitUntil: "load" });
    await page.locator("#email").fill("investor@odum-research.co.uk");
    await page.locator("#password").fill("demo");
    await page.getByRole("button", { name: /^Sign In$/i }).click();
    await page.goto("/investor-relations", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /Investor Relations/i })).toBeVisible({
      timeout: 30_000,
    });
  });
});
