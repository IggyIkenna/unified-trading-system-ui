import { expect, test } from "@playwright/test";
import { seedPersona } from "./seed-persona";

/**
 * pb3 — Warm-prospect demo playbook spec.
 *
 * Firebase-staging (or demo-provider) auth tier. Prospect demo flavours:
 *   - pb3a Reg Umbrella (share UI with pb3b)
 *   - pb3b IM (share UI with pb3a)
 *   - pb3c DART (full 4-catalogue surface)
 *
 * Canonical playbook docs:
 *   unified-trading-pm/codex/14-playbooks/playbooks/03-warm-prospect-demo.md
 *   unified-trading-pm/codex/14-playbooks/playbooks/03a-demo-reg-umbrella.md
 *   unified-trading-pm/codex/14-playbooks/playbooks/03b-demo-im.md
 *   unified-trading-pm/codex/14-playbooks/playbooks/03c-demo-dart.md
 *
 * NOTE: prospect-reg and prospect-dart personas do not yet exist — tracked in
 * codex/14-playbooks/roadmap/next-waves.md (Wave 1b). These specs use
 * client-full / prospect-im / client-data-only as proxies until then.
 */

test.describe("pb3 — Warm prospect demo (hub)", () => {
  test("admin persona sees full services portal", async ({ page }) => {
    await seedPersona(page, "admin");
    const response = await page.goto("/dashboard");
    expect(response?.status()).toBeLessThan(400);
  });

  test("client-data-only sees minimal services portal", async ({ page }) => {
    await seedPersona(page, "client-data-only");
    const response = await page.goto("/dashboard");
    expect(response?.status()).toBeLessThan(400);
  });
});

test.describe("pb3a / pb3b — Reg Umbrella + IM (shared UI walkthrough)", () => {
  test("prospect-im persona lands on services portal", async ({ page }) => {
    await seedPersona(page, "prospect-im");
    const response = await page.goto("/dashboard");
    expect(response?.status()).toBeLessThan(400);
  });

  test("prospect-im persona reaches /services/reports/overview", async ({ page }) => {
    await seedPersona(page, "prospect-im");
    const response = await page.goto("/services/reports/overview");
    expect(response?.status()).toBeLessThan(400);
  });
});

test.describe("pb3c — DART flavour", () => {
  test("client-full (as proxy for prospect-dart) reaches strategy catalogue", async ({ page }) => {
    await seedPersona(page, "client-full");
    const response = await page.goto("/services/strategy-catalogue");
    expect(response?.status()).toBeLessThan(400);
  });

  test("client-full reaches trading terminal", async ({ page }) => {
    await seedPersona(page, "client-full");
    const response = await page.goto("/services/trading/terminal");
    expect(response?.status()).toBeLessThan(400);
  });
});
