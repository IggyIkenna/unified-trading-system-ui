import { expect, test } from "@playwright/test";
import { seedPersona } from "./_shared/persona";

/**
 * Alerting Phase 5 — DART top-bar Active Alerts ack-flow.
 *
 * Spec: unified-trading-pm/plans/active/alerting_service_live_rules_2026_05_07.md § Phase 5.
 *
 * Walks the `live-operator` persona through the ack flow on a synthetic
 * CRITICAL alert (seeded as `alert-003` HEALTH_FACTOR_CRITICAL in
 * `lib/mocks/fixtures/mock-data-seed.ts`). Asserts:
 *   - Notification bell badge exposes a critical-only count via
 *     `data-critical-count` (per plan: badge = unack-critical, not total).
 *   - Clicking an alert in the dropdown opens the per-alert detail modal.
 *   - The detail modal renders the AlertCode + runbook deep-link.
 *   - Acknowledge moves the alert to `acknowledged` state, the alert
 *     disappears from the active dropdown, and the bell badge decrements.
 */

test.describe("Alerting Phase 5 — DART ack flow", () => {
  test.beforeEach(async ({ page }) => {
    await seedPersona(page, "live-operator");
  });

  test("live-operator acknowledges a CRITICAL alert via bell → modal", async ({ page }) => {
    // Land somewhere the platform shell + lifecycle nav (which mounts the
    // notification bell) renders. Any platform route works; observe-flow
    // already smoke-tests this surface so it's the safest landing spot.
    await page.goto("/services/trading/alerts");
    await page.waitForLoadState("networkidle");

    const bell = page.getByTestId("notification-bell");
    await expect(bell).toBeVisible({ timeout: 15_000 });

    // Mock seed has exactly one CRITICAL active alert (alert-003) by default.
    // Wait for the polling cycle to land at least one fetch.
    await expect
      .poll(async () => bell.getAttribute("data-critical-count"), {
        timeout: 15_000,
        message: "bell never reported a critical-count attribute",
      })
      .toMatch(/^\d+$/);

    const initialCriticalRaw = (await bell.getAttribute("data-critical-count")) ?? "0";
    const initialCritical = Number.parseInt(initialCriticalRaw, 10);
    expect(initialCritical).toBeGreaterThanOrEqual(1);

    // Open the dropdown — Radix dropdown items render under the trigger.
    await bell.click();

    // alert-003 is the seeded HEALTH_FACTOR_CRITICAL row. Find it by
    // testid + alert-id so the spec doesn't break if neighbouring alerts
    // shuffle around.
    const targetItem = page.locator('[data-testid="notification-bell-alert-item"][data-alert-id="alert-003"]').first();
    await expect(targetItem).toBeVisible({ timeout: 5_000 });
    await expect(targetItem).toHaveAttribute("data-severity", "critical");

    // Click opens the per-alert detail modal.
    await targetItem.click();

    const modal = page.getByTestId("alert-detail-modal");
    await expect(modal).toBeVisible({ timeout: 5_000 });

    const code = page.getByTestId("alert-detail-code");
    await expect(code).toHaveText("HEALTH_FACTOR_CRITICAL");

    // Runbook deep-link: must be present + point at the playbook file in PM.
    const runbookLink = page.getByTestId("alert-detail-runbook-link");
    await expect(runbookLink).toBeVisible();
    const href = await runbookLink.getAttribute("href");
    expect(href).toContain("/codex/15-runbooks/alerting/defi_health_factor_critical.md");

    // Acknowledge — modal closes itself, mutation fires, bell badge ticks down.
    await page.getByTestId("alert-detail-ack").click();

    await expect(modal).toBeHidden({ timeout: 5_000 });

    // Wait for the next poll cycle to refresh the bell's badge.
    await expect
      .poll(async () => Number.parseInt((await bell.getAttribute("data-critical-count")) ?? "0", 10), {
        timeout: 20_000,
        message: "bell critical-count never decremented after ack",
      })
      .toBeLessThan(initialCritical);

    // Reopen the dropdown and verify the acknowledged alert is gone from
    // the active list (the panel filters on acknowledged=false).
    await bell.click();
    await expect(page.locator('[data-testid="notification-bell-alert-item"][data-alert-id="alert-003"]')).toHaveCount(
      0,
    );
  });
});
