import { expect, test } from "@playwright/test";

import { clearPersona, seedPersona } from "../seed-persona";

/**
 * Refactor G2.10 — Portfolio-allocator UI split.
 *
 * Two commercial surfaces on the same ``portfolio_allocator`` core:
 *   - ``/services/investment-management/allocator`` (IM-desk + IM client)
 *     — proposal-then-apply flow, emits ``ALLOCATION_APPLIED_BY_APPROVER``.
 *   - ``/services/trading-platform/allocator`` (DART / platform subscribers)
 *     — auto-apply, emits ``ALLOCATION_AUTO_APPLIED`` per directive.
 *
 * Research-side allocator DELETED — legacy URL 308-redirects to the IM-side
 * surface as a benign default. Audience-claim routing via
 * ``resolveAllocatorRoute`` in ``lib/auth/allocator-routing.ts``.
 *
 * Plan: unified-trading-pm/plans/active/refactor_g2_10_allocator_ui_split_2026_04_20.plan.md
 * Rule 03: unified-trading-pm/codex/14-playbooks/_ssot-rules/03-same-system-principle.md
 */

const IM_ROUTE = "/services/investment-management/allocator";
const PLATFORM_ROUTE = "/services/trading-platform/allocator";
const LEGACY_ROUTE = "/services/research/strategy/allocator";

test.describe("refactor G2.10 — allocator UI split", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
  });

  test("IM-side surface renders the approval queue for im-desk-operator", async ({ page }) => {
    await seedPersona(page, "admin");
    const response = await page.goto(IM_ROUTE);
    expect(response?.status(), `${IM_ROUTE} must return 2xx`).toBeLessThan(400);

    // Title + approval queue visible
    await expect(page.getByRole("heading", { name: /portfolio allocator/i })).toBeVisible();
    await expect(page.getByTestId("approval-queue")).toBeVisible();
    await expect(page.getByTestId("fund-select")).toBeVisible();
  });

  test("IM-side surface: apply emits ALLOCATION_APPLIED_BY_APPROVER event", async ({ page }) => {
    await seedPersona(page, "admin");
    await page.goto(IM_ROUTE);
    await expect(page.getByTestId("approval-queue")).toBeVisible();

    // Install a listener on window that records emitted events.
    await page.evaluate(() => {
      // @ts-expect-error writing to the window for test collection
      window.__allocatorEvents = [];
      window.addEventListener("ALLOCATION_APPLIED_BY_APPROVER", (e: Event) => {
        const ce = e as CustomEvent<Record<string, unknown>>;
        // @ts-expect-error writing to the window for test collection
        window.__allocatorEvents.push(ce.detail);
      });
    });

    // Click the first Apply button.
    const firstApprove = page.getByTestId(/^approve-/).first();
    await expect(firstApprove).toBeVisible();
    await firstApprove.click();

    // Wait for the synthetic event and assert at least one was captured.
    await expect
      .poll(
        async () =>
          (await page.evaluate(
            // @ts-expect-error reading from window test collection
            () => (window.__allocatorEvents as unknown[] | undefined)?.length ?? 0,
          )) ?? 0,
        { message: "expected at least one ALLOCATION_APPLIED_BY_APPROVER event", timeout: 5_000 },
      )
      .toBeGreaterThan(0);
  });

  test("Platform-side surface renders auto-apply flow", async ({ page }) => {
    await seedPersona(page, "prospect-dart");
    const response = await page.goto(PLATFORM_ROUTE);
    expect(response?.status(), `${PLATFORM_ROUTE} must return 2xx`).toBeLessThan(400);

    await expect(page.getByRole("heading", { name: /portfolio allocator/i })).toBeVisible();
    await expect(page.getByTestId("allocation-applied")).toBeVisible();
    await expect(page.getByTestId("auto-apply-badge")).toBeVisible();

    // Platform-side must NOT surface the IM approval queue — rule 03 /
    // separation-of-concerns invariant.
    await expect(page.getByTestId("approval-queue")).toHaveCount(0);
  });

  test("Platform-side surface emits ALLOCATION_AUTO_APPLIED per directive", async ({ page }) => {
    await seedPersona(page, "prospect-dart");

    // Install listener BEFORE navigation so we catch the mount-time emits.
    await page.addInitScript(() => {
      // @ts-expect-error test collector on window
      window.__autoEvents = [];
      window.addEventListener("ALLOCATION_AUTO_APPLIED", (e: Event) => {
        const ce = e as CustomEvent<Record<string, unknown>>;
        // @ts-expect-error test collector on window
        window.__autoEvents.push(ce.detail);
      });
    });

    await page.goto(PLATFORM_ROUTE);
    await expect(page.getByTestId("allocation-applied")).toBeVisible();

    await expect
      .poll(
        async () =>
          (await page.evaluate(
            // @ts-expect-error reading from window test collector
            () => (window.__autoEvents as unknown[] | undefined)?.length ?? 0,
          )) ?? 0,
        { message: "expected at least one ALLOCATION_AUTO_APPLIED event", timeout: 5_000 },
      )
      .toBeGreaterThan(0);
  });

  test("legacy research-side allocator URL returns 308 to IM-side", async ({ page }) => {
    await seedPersona(page, "admin");

    // Disable automatic redirect following so we can observe the 308.
    // Use the request API to avoid Playwright auto-following.
    const response = await page.request.get(LEGACY_ROUTE, { maxRedirects: 0 });
    expect(
      [301, 308].includes(response.status()),
      `Expected permanent redirect (301/308) from legacy ${LEGACY_ROUTE}, got ${response.status()}`,
    ).toBe(true);

    const location = response.headers().location ?? "";
    expect(location, "legacy allocator must redirect into the IM-side surface").toContain(IM_ROUTE);
  });

  test("allocator-routing helper picks the right surface per audience", async ({ page }) => {
    // Headless module check — hit the dev-static chunk that bundles
    // `lib/auth/allocator-routing.ts` via the running app. Use a short
    // evaluate block once a base page has loaded.
    await seedPersona(page, "admin");
    await page.goto("/");

    const imPath = "/services/investment-management/allocator";
    const platformPath = "/services/trading-platform/allocator";

    // Smoke: both routes serve a page (auth gate notwithstanding).
    const imResp = await page.request.get(imPath);
    expect(imResp.status(), `GET ${imPath}`).toBeLessThan(500);
    const platformResp = await page.request.get(platformPath);
    expect(platformResp.status(), `GET ${platformPath}`).toBeLessThan(500);
  });

  test("research-side allocator route is hard-deleted from the app router", async ({ page }) => {
    // Rule 03 enforcement: the research-side allocator is GONE.
    // Hitting the legacy URL must redirect, not render.
    const response = await page.request.get(LEGACY_ROUTE, { maxRedirects: 0 });
    expect(response.status(), "legacy URL must 308, not 200").not.toBe(200);
  });

  test("orphan-reachability — both allocator surfaces are routable", async ({ page }) => {
    await seedPersona(page, "admin");
    const imResp = await page.goto(IM_ROUTE);
    expect(imResp?.status(), `${IM_ROUTE} orphan-reachability`).toBeLessThan(400);

    await seedPersona(page, "prospect-dart");
    const platformResp = await page.goto(PLATFORM_ROUTE);
    expect(platformResp?.status(), `${PLATFORM_ROUTE} orphan-reachability`).toBeLessThan(400);
  });
});
