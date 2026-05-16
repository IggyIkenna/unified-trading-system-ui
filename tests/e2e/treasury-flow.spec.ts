/**
 * Treasury Flow — e2e Playwright smoke spec.
 *
 * Walks:
 *   /services/treasury         — multi-source rollup page
 *   /services/treasury/{id}    — per-client deep-dive
 *   subscriptions list visible — correct archetypes rendered
 *   custody-ping badges        — all rendered (mock fixtures, stubs OK)
 *   withdrawal request modal   — opens + fields work + submits
 *
 * Runs against NEXT_PUBLIC_MOCK_API=true (mock preset set by playwright.config.ts).
 * No backend required.
 *
 * Reference plan:
 *   unified-trading-pm/plans/active/wallet_treasury_client_flow_2026_05_10.md
 *   Phase 6.D.
 */

import { expect, test } from "@playwright/test";

const TREASURY_ROUTE = "/services/treasury";
const DEMO_CLIENT_ID = "demo-client-001";
const CLIENT_ROUTE = `/services/treasury/${DEMO_CLIENT_ID}`;

test.describe("Treasury Flow", () => {
  // ─── 1. Multi-source rollup page loads ───────────────────────────────────────

  test("treasury landing page renders rollup card", async ({ page }) => {
    await page.goto(TREASURY_ROUTE);

    // Page wrapper renders
    await expect(page.getByTestId("treasury-page")).toBeVisible({ timeout: 30_000 });

    // Rollup card renders
    await expect(page.getByTestId("treasury-rollup-card")).toBeVisible({ timeout: 15_000 });

    // Total NAV figure renders
    await expect(page.getByTestId("treasury-rollup-total-nav")).toBeVisible();

    // Source list renders (at least one row)
    await expect(page.getByTestId("treasury-source-list")).toBeVisible();
  });

  test("treasury rollup card shows multiple source rows", async ({ page }) => {
    await page.goto(TREASURY_ROUTE);
    await expect(page.getByTestId("treasury-rollup-card")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("treasury-source-list")).toBeVisible();

    // At least 3 source rows from mock fixtures
    const rows = page.locator("[data-testid^='treasury-source-row-']");
    await expect(rows).toHaveCount(6, { timeout: 15_000 });
  });

  test("reconciliation badge renders on rollup card", async ({ page }) => {
    await page.goto(TREASURY_ROUTE);
    await expect(page.getByTestId("treasury-rollup-card")).toBeVisible({ timeout: 30_000 });
    // Mock fixture sets reconciliation_ok=true
    await expect(page.getByTestId("treasury-reconciliation-ok")).toBeVisible();
  });

  // ─── 2. Per-client deep-dive navigation ──────────────────────────────────────

  test("clicking client link navigates to per-client deep-dive", async ({ page }) => {
    await page.goto(TREASURY_ROUTE);
    await expect(page.getByTestId("treasury-page")).toBeVisible({ timeout: 30_000 });

    // Client links card renders
    await expect(page.getByTestId("treasury-client-links")).toBeVisible();

    // Click demo client link
    await page
      .getByTestId(`treasury-client-link-${DEMO_CLIENT_ID}`)
      .click();

    // Navigate to per-client page
    await expect(page).toHaveURL(new RegExp(`/services/treasury/${DEMO_CLIENT_ID}`), {
      timeout: 15_000,
    });
    await expect(page.getByTestId("client-treasury-page")).toBeVisible({ timeout: 30_000 });
  });

  // ─── 3. Per-client deep-dive renders all sections ────────────────────────────

  test("per-client page renders treasury card + subscriptions + custody pings", async ({ page }) => {
    await page.goto(CLIENT_ROUTE);

    await expect(page.getByTestId("client-treasury-page")).toBeVisible({ timeout: 30_000 });

    // Treasury card renders with NAV
    await expect(page.getByTestId("client-treasury-card")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("client-treasury-nav")).toBeVisible();

    // Subscriptions list renders
    await expect(page.getByTestId("subscriptions-list-card")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("subscriptions-list")).toBeVisible();

    // Custody pings card renders
    await expect(page.getByTestId("custody-pings-card")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("custody-ping-badges")).toBeVisible();
  });

  test("subscriptions list shows carry_staked_basis and arbitrage_price_dispersion archetypes", async ({ page }) => {
    await page.goto(CLIENT_ROUTE);

    await expect(page.getByTestId("subscriptions-list-card")).toBeVisible({ timeout: 30_000 });

    // Both archetypes from mock fixtures
    await expect(
      page.getByTestId("subscriptions-list").getByTestId("subscription-archetype").first(),
    ).toBeVisible({ timeout: 15_000 });

    // Verify carry_staked_basis row is present
    await expect(page.getByText("carry staked basis")).toBeVisible();
    await expect(page.getByText("arbitrage price dispersion")).toBeVisible();
  });

  test("subscriptions total allocation pct renders as 100%", async ({ page }) => {
    await page.goto(CLIENT_ROUTE);

    await expect(page.getByTestId("subscriptions-total-pct")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("subscriptions-total-pct")).toHaveText("100.00%");
  });

  // ─── 4. Custody ping badges render ───────────────────────────────────────────

  test("custody ping badges render for all mock sources", async ({ page }) => {
    await page.goto(CLIENT_ROUTE);

    await expect(page.getByTestId("custody-pings-card")).toBeVisible({ timeout: 30_000 });

    // At least one OK badge
    const badges = page.locator("[data-testid^='custody-ping-badge-']");
    const count = await badges.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("COPPER custody badge has OK status from mock fixtures", async ({ page }) => {
    await page.goto(CLIENT_ROUTE);

    await expect(page.getByTestId("custody-ping-badge-copper")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("custody-ping-badge-copper")).toHaveAttribute(
      "data-status",
      "OK",
    );
  });

  // ─── 5. Post-trade history renders ───────────────────────────────────────────

  test("post-trade history table renders with rows from mock fixtures", async ({ page }) => {
    await page.goto(CLIENT_ROUTE);

    await expect(page.getByTestId("post-trade-history-card")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("post-trade-table")).toBeVisible({ timeout: 15_000 });

    // At least one trade row from mock fixtures (3 in mock)
    const rows = page.locator("[data-testid^='trade-row-']");
    await expect(rows).toHaveCount(3, { timeout: 15_000 });
  });

  // ─── 6. Withdrawal request button + modal ────────────────────────────────────

  test("withdrawal request button renders on per-client page", async ({ page }) => {
    await page.goto(CLIENT_ROUTE);

    await expect(page.getByTestId("client-treasury-page")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("withdrawal-request-btn")).toBeVisible({ timeout: 15_000 });
  });

  test("withdrawal modal opens and shows source/amount/destination fields", async ({ page }) => {
    await page.goto(CLIENT_ROUTE);

    await expect(page.getByTestId("withdrawal-request-btn")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("withdrawal-request-btn").click();

    await expect(page.getByTestId("withdrawal-request-modal")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("withdrawal-source-select")).toBeVisible();
    await expect(page.getByTestId("withdrawal-amount-input")).toBeVisible();
    await expect(page.getByTestId("withdrawal-destination-input")).toBeVisible();
    await expect(page.getByTestId("withdrawal-submit-btn")).toBeDisabled();
  });

  test("withdrawal modal submit is enabled with valid amount + destination", async ({ page }) => {
    await page.goto(CLIENT_ROUTE);

    await expect(page.getByTestId("withdrawal-request-btn")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("withdrawal-request-btn").click();

    await expect(page.getByTestId("withdrawal-request-modal")).toBeVisible({ timeout: 10_000 });

    await page.getByTestId("withdrawal-amount-input").fill("50000");
    await page.getByTestId("withdrawal-destination-input").fill("0xTestDestinationAddress");

    await expect(page.getByTestId("withdrawal-submit-btn")).toBeEnabled();
  });

  test("withdrawal request submits and shows success in mock mode", async ({ page }) => {
    await page.goto(CLIENT_ROUTE);

    await expect(page.getByTestId("withdrawal-request-btn")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("withdrawal-request-btn").click();

    await expect(page.getByTestId("withdrawal-request-modal")).toBeVisible({ timeout: 10_000 });

    await page.getByTestId("withdrawal-amount-input").fill("25000");
    await page.getByTestId("withdrawal-destination-input").fill("0xTestDest");

    await page.getByTestId("withdrawal-submit-btn").click();

    // Success state renders
    await expect(page.getByTestId("withdrawal-request-success")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Withdrawal requested successfully")).toBeVisible();
  });

  test("withdrawal modal cancel closes without submitting", async ({ page }) => {
    await page.goto(CLIENT_ROUTE);

    await expect(page.getByTestId("withdrawal-request-btn")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("withdrawal-request-btn").click();

    await expect(page.getByTestId("withdrawal-request-modal")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("withdrawal-cancel-btn").click();

    // Modal closes
    await expect(page.getByTestId("withdrawal-request-modal")).not.toBeVisible({ timeout: 5_000 });
  });

  // ─── 7. Back navigation ──────────────────────────────────────────────────────

  test("back link from per-client page navigates to treasury overview", async ({ page }) => {
    await page.goto(CLIENT_ROUTE);

    await expect(page.getByTestId("client-treasury-page")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("treasury-back-link")).toBeVisible();

    await page.getByTestId("treasury-back-link").click();
    await expect(page).toHaveURL(/\/services\/treasury$/, { timeout: 10_000 });
    await expect(page.getByTestId("treasury-page")).toBeVisible({ timeout: 15_000 });
  });
});
