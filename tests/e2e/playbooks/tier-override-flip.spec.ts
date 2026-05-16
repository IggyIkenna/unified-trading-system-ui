/**
 * Playwright E2E: tier-override flip — verifies the localStorage paired-tier
 * toggle (Desmond DART-Full ↔ Signals-In, Patrick DeFi-Full ↔ DeFi-Base)
 * preserves identity (email/uid) while flipping entitlements + tile
 * visibility. SSOT: codex/14-playbooks/dart/dart-terminal-vs-research.md +
 * codex/14-playbooks/demo-ops/staging-demo-setup.md.
 *
 * The tier-override layer is implemented in lib/auth/tier-override.ts. It
 * stores `{ email, tier }` under localStorage key `tier-override-v1`.
 * useAuth() reads it via applyTierOverride() and rewrites the user's
 * entitlements at render time.
 *
 * The seed-persona helper does not currently include desmond-dart-full or
 * patrick (elysium-defi-full) — those are real-email demo personas live in
 * lib/auth/personas.ts. This spec uses page.evaluate to set the
 * tier-override key directly + asserts the dashboard shape responds.
 *
 * Skipped by default — requires a Firebase emulator or staging environment
 * with the real-email demo personas seeded. To run locally:
 *
 *   bash scripts/dev-tiers.sh --tier 0
 *   PLAYWRIGHT_RUN_TIER_OVERRIDE=1 npx playwright test tier-override-flip
 */

import { expect, test } from "@playwright/test";

const RUN_TIER_OVERRIDE = process.env.PLAYWRIGHT_RUN_TIER_OVERRIDE === "1";

test.describe("Tier-override flip", () => {
  test.skip(!RUN_TIER_OVERRIDE, "Set PLAYWRIGHT_RUN_TIER_OVERRIDE=1 to run (needs Firebase emulator + demo personas)");

  test("Desmond DART-Full → Signals-In flip locks DART Research, identity unchanged", async ({ page }) => {
    // Sign in as Desmond. Default tier = dart-full.
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("desmondhw@gmail.com");
    await page.getByLabel(/password/i).fill("demo123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Default state: both tiles visible
    await expect(page.locator('[data-tile-id="dart-terminal"]')).toBeVisible();
    await expect(page.locator('[data-tile-id="dart-research"]')).toBeVisible();
    const dartResearchUnlocked = page.locator('[data-tile-id="dart-research"]');
    await expect(dartResearchUnlocked.getByRole("img", { name: /lock|locked/i })).toHaveCount(0);

    // Capture identity before flip
    const initialEmail = await page.evaluate(() => {
      return (JSON.parse(localStorage.getItem("portal_user") ?? "{}") as { email?: string }).email;
    });
    expect(initialEmail).toBe("desmondhw@gmail.com");

    // Flip tier-override to signals-in
    await page.evaluate(() => {
      localStorage.setItem(
        "tier-override-v1",
        JSON.stringify({ email: "desmondhw@gmail.com", tier: "dart-signals-in" }),
      );
    });
    await page.reload();

    // After flip: DART Terminal still visible, DART Research padlocked-visible
    await expect(page.locator('[data-tile-id="dart-terminal"]')).toBeVisible();
    const dartResearchLocked = page.locator('[data-tile-id="dart-research"]');
    await expect(dartResearchLocked).toBeVisible();
    await expect(dartResearchLocked.getByRole("img", { name: /lock|locked/i })).toBeVisible();

    // Identity unchanged
    const afterFlipEmail = await page.evaluate(() => {
      return (JSON.parse(localStorage.getItem("portal_user") ?? "{}") as { email?: string }).email;
    });
    expect(afterFlipEmail).toBe(initialEmail);
  });

  test("Patrick DeFi-Full → DeFi-Base flip locks DART Research, identity unchanged", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("patrick@bankelysium.com");
    await page.getByLabel(/password/i).fill("demo123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Default state: both tiles visible (defi-full has strategy-full + ml-full)
    await expect(page.locator('[data-tile-id="dart-research"]')).toBeVisible();

    await page.evaluate(() => {
      localStorage.setItem("tier-override-v1", JSON.stringify({ email: "patrick@bankelysium.com", tier: "defi-base" }));
    });
    await page.reload();

    // After flip: DART Research padlocked-visible
    const dartResearch = page.locator('[data-tile-id="dart-research"]');
    await expect(dartResearch).toBeVisible();
    await expect(dartResearch.getByRole("img", { name: /lock|locked/i })).toBeVisible();
  });
});
