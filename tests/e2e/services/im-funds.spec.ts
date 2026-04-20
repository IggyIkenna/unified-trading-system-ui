import { test, expect } from "@playwright/test";

/**
 * IM Funds (fund-administration) happy-path smoke in mock mode.
 *
 * Walks:
 *   /services/im/funds  →  Subscriptions (open dialog, submit)  →  row visible
 *                       →  Allocations (Rebalance button visible + enabled)
 *
 * Runs against the mock-mode UI (`VITE_MOCK_API=true`). No backend required.
 */

test.describe("IM Funds — happy path (mock mode)", () => {
  test("overview → subscriptions new → allocations rebalance-button", async ({ page }) => {
    await page.goto("/services/im/funds");
    await expect(page.getByTestId("im-funds-overview-page")).toBeVisible();
    await expect(page.getByTestId("im-funds-overview-link-subscriptions")).toBeVisible();

    await page.getByTestId("im-funds-overview-link-subscriptions").click();
    await expect(page.getByTestId("im-funds-subscriptions-page")).toBeVisible();
    await expect(page.getByTestId("im-funds-sub-table")).toBeVisible();

    await page.getByTestId("im-funds-sub-new-open").click();
    await expect(page.getByTestId("im-funds-sub-new-dialog")).toBeVisible();
    await page.getByTestId("im-funds-sub-field-subscription_id").fill("sub-e2e-1");
    await page.getByTestId("im-funds-sub-field-allocator_id").fill("client-e2e");
    await page.getByTestId("im-funds-sub-field-requested_amount_usd").fill("42000");
    await page.getByTestId("im-funds-sub-submit").click();

    await expect(page.getByTestId("im-funds-sub-row-sub-e2e-1")).toBeVisible();

    await page.goto("/services/im/funds/allocations");
    await expect(page.getByTestId("im-funds-allocations-page")).toBeVisible();
    await expect(page.getByTestId("im-funds-alloc-rebalance-button")).toBeVisible();
  });
});
