/**
 * Plan D Phase 4 — End-to-end smoke for the DART exclusive subscription
 * lifecycle: subscribe → fork → request-approval → admin approve → rollout.
 *
 * Five steps under MOCK_API=true with `dart_exclusive_enabled=true`:
 *
 *   1. Sign in as DART-Full persona (`client-full`) and open the strategy
 *      catalogue Explore tab.
 *   2. Click Subscribe → the Reality tab gains a `RealityPositionCard` with
 *      a v0 (genesis) `VersionLineageBadge`.
 *   3. From the Reality card overflow menu, click "Fork for research" → the
 *      ForkDialog mounts. Edit a config field, "Save draft", then "Request
 *      approval".
 *   4. Switch to admin persona, navigate to /(ops)/approvals/strategy-versions,
 *      Approve at backtest_1yr maturity, then Rollout.
 *   5. Switch back to DART-Full and visit
 *      /services/trading/strategies/{id}/versions — assert v1 is rolled out
 *      and v0 retired.
 *
 * STATUS: skipped pending two infra pieces. Committing a green-but-disabled
 * spec is honest — see the TODOs below for the missing helpers.
 *
 * TODOs before this can be flipped on:
 *
 *   T1. The mock-handler does not yet wire the strategy-subscriptions Pub/Sub
 *       round-trip. `seedPersona` lands in localStorage, but the Subscribe
 *       click currently writes to the in-memory `_VersionStore` mock without
 *       persistence across persona switches. Need an e2e-only fixture that
 *       persists subscription + version state on `window` so persona swaps
 *       (admin queue) see the rows the DART persona created.
 *
 *   T2. The `dart_exclusive_enabled` feature flag is not yet wired in
 *       UnifiedCloudConfig for local dev — Phase 6 todo
 *       p6-feature-flag-gradual-rollout (HUMAN-gated). Until that lands,
 *       SubscribeButton renders the static "Request allocation" CTA on the
 *       Explore tab.
 *
 * Once T1+T2 land, remove the `.skip` on the test below and verify against
 * the canonical Tier-0 walkthrough in
 * codex/14-playbooks/authentication/firebase-local.md.
 */

import { expect, test } from "@playwright/test";
import { clearPersona, seedPersona } from "../seed-persona";

test.describe("Plan D — subscribe → fork → approve → rollout (DART exclusive)", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
  });

  test.skip("DART-Full → admin loop covers the full version lifecycle", async ({ page }) => {
    // ──────────────────────────────────────────────────────────────────────
    // Step 1 — sign in as DART-Full + reach the strategy catalogue.
    // ──────────────────────────────────────────────────────────────────────
    await seedPersona(page, "client-full");
    await page.goto("/services/strategy-catalogue?tab=explore");
    await expect(page.getByTestId("strategy-catalogue-surface")).toBeVisible({ timeout: 30_000 });

    // ──────────────────────────────────────────────────────────────────────
    // Step 2 — Subscribe on a DART-routed instance; Reality card surfaces.
    // ──────────────────────────────────────────────────────────────────────
    const subscribeBtn = page.getByTestId("subscribe-button").first();
    await expect(subscribeBtn).toBeVisible();
    await subscribeBtn.click();
    await page.goto("/services/strategy-catalogue?tab=reality");
    const realityCard = page.getByTestId("reality-position-card").first();
    await expect(realityCard).toBeVisible();
    // v0 (genesis) badge visible on subscription.
    await expect(realityCard.getByTestId("version-lineage-badge")).toContainText("v0");

    // ──────────────────────────────────────────────────────────────────────
    // Step 3 — Fork-for-research → edit field → Save draft → Request approval.
    // ──────────────────────────────────────────────────────────────────────
    await realityCard.getByTestId("reality-overflow-trigger").click();
    await realityCard.getByTestId("reality-fork-action").click();
    const forkDialog = page.getByTestId("fork-dialog");
    await expect(forkDialog).toBeVisible();
    // Edit the first editable config param. Specific testid TBD by ForkDialog
    // implementation — placeholder selector here:
    await forkDialog.getByRole("textbox").first().fill("8");
    await forkDialog.getByRole("button", { name: /Save draft/i }).click();
    await forkDialog.getByRole("button", { name: /Request approval/i }).click();

    // ──────────────────────────────────────────────────────────────────────
    // Step 4 — Switch to admin persona, approve + rollout.
    // ──────────────────────────────────────────────────────────────────────
    await clearPersona(page);
    await seedPersona(page, "admin");
    await page.goto("/approvals/strategy-versions");
    const firstRow = page.locator('[data-testid^="row-"]').first();
    await expect(firstRow).toBeVisible({ timeout: 30_000 });
    const versionId = await firstRow.getAttribute("data-testid");
    expect(versionId).toMatch(/^row-/);
    const vid = versionId!.replace(/^row-/, "");
    await page.getByTestId(`approve-${vid}`).click();
    await page.getByTestId(`rollout-${vid}`).click();

    // ──────────────────────────────────────────────────────────────────────
    // Step 5 — DART-Full visits the per-instance versions timeline.
    //          Assert v1 ROLLED_OUT, v0 RETIRED.
    // ──────────────────────────────────────────────────────────────────────
    await clearPersona(page);
    await seedPersona(page, "client-full");
    // Instance id flows from Step 2 — for now use a placeholder fixture id
    // that the seed populates; replace with the captured instance id once T1
    // ships.
    const instanceId = "ML_DIRECTIONAL@binance-btc-usdt-5m-prod";
    await page.goto(`/services/trading/strategies/${encodeURIComponent(instanceId)}/versions`);
    await expect(page.getByText(/ROLLED_OUT/i)).toBeVisible();
    await expect(page.getByText(/RETIRED/i)).toBeVisible();
  });
});
