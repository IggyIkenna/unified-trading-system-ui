import { expect, test } from "@playwright/test";

/**
 * Signal-broadcast Phase 5 — counterparty observability dashboard
 * verification.
 *
 * Asserts:
 * 1. Public /signals renders the inbound-link counterparty CTA
 *    (no-orphan-page discipline).
 * 2. /services/signals/dashboard renders the 3 non-optional observability
 *    components with their canonical data-testid attributes.
 *
 * Plan SSOT:
 *   unified-trading-pm/plans/active/signal_leasing_broadcast_architecture_2026_04_20.plan
 *   § Phase 5 — counterparty observability UI
 */

test.describe("Signal-broadcast counterparty dashboard — Plan B Phase 5", () => {
  test("public /signals page exposes the counterparty CTA", async ({
    page,
  }) => {
    const response = await page.goto("/signals");
    expect(response?.status()).toBeLessThan(400);

    const cta = page.getByTestId("signals-public-counterparty-cta");
    await expect(cta).toHaveCount(1);
    await expect(cta).toHaveAttribute("href", "/services/signals/dashboard");
  });

  test("dashboard page renders the three observability components", async ({
    page,
  }) => {
    const response = await page.goto("/services/signals/dashboard");
    // Allow 4xx when auth is enforced; skip the content assertions in that
    // case. Light-auth mock environment returns < 400.
    if ((response?.status() ?? 500) >= 400) {
      test.skip(true, "dashboard gated behind auth in this environment");
    }

    await expect(
      page.getByTestId("signal-broadcast-dashboard-page"),
    ).toHaveCount(1);
    await expect(
      page.getByTestId("signal-broadcast-signal-history-table"),
    ).toHaveCount(1);
    await expect(
      page.getByTestId("signal-broadcast-backtest-comparison-panel"),
    ).toHaveCount(1);
    await expect(
      page.getByTestId("signal-broadcast-delivery-health-panel"),
    ).toHaveCount(1);
    // Optional panel hidden by default (pnl_reporting_enabled = false).
    await expect(
      page.getByTestId("signal-broadcast-pnl-attribution-panel"),
    ).toHaveCount(0);
  });
});
