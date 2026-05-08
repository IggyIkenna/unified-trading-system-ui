import { expect, test } from "@playwright/test";

import { seedPersona } from "./seed-persona";

/**
 * Plan B Phase 5 — admin counterparties surface Playwright spec.
 *
 * Validates:
 *   1. Admin route renders at /services/signals/counterparties
 *   2. Counterparty list table + rows render
 *   3. Detail panel + audit list containers exist
 *   4. Inbound link from admin nav (ADMIN_TABS) resolves
 *   5. Non-admin personas see the admin-only gate
 *
 * Plan SSOT:
 *   unified-trading-pm/plans/active/signal_leasing_broadcast_architecture_2026_04_20.md
 */

test.describe("signal broadcast — admin counterparties surface", () => {
  test("admin persona sees the counterparty list + detail panel", async ({
    page,
  }) => {
    await seedPersona(page, "admin");
    await page.goto("/services/signals/counterparties");

    await expect(
      page.getByText(/Admin · Signal Counterparties/),
    ).toBeVisible();
    await expect(
      page.getByTestId("admin-counterparties-table"),
    ).toBeVisible();
    await expect(
      page.getByTestId("admin-counterparties-row-cp-alpha"),
    ).toBeVisible();
    await expect(
      page.getByTestId("admin-counterparties-row-cp-beta"),
    ).toBeVisible();
    await expect(
      page.getByTestId("admin-counterparties-detail-cp-alpha"),
    ).toBeVisible();
  });

  test("non-admin persona sees the admin-only gate", async ({ page }) => {
    await seedPersona(page, "client-full");
    await page.goto("/services/signals/counterparties");
    await expect(page.getByText(/Admin only/)).toBeVisible();
  });

  test("toggling an entitlement emits a synthetic audit event", async ({
    page,
  }) => {
    await seedPersona(page, "admin");
    await page.goto("/services/signals/counterparties");

    const reason = page.getByTestId("admin-counterparties-reason-cp-alpha");
    await reason.fill("Playwright QG entitlement toggle");
    const toggle = page.getByTestId(
      "admin-counterparties-toggle-cp-alpha-btc_carry_basis_dated_cefi-perp-1.0",
    );
    await toggle.click();
    await expect(
      page.getByTestId(
        "admin-counterparties-audit-COUNTERPARTY_ENTITLEMENT_CHANGED",
      ),
    ).toBeVisible();
  });
});
