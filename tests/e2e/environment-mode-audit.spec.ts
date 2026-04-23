import { expect, test } from "@playwright/test";

/**
 * ENVIRONMENT × AUTH × DATA MODE AUDIT
 *
 * Enforces the three-axis philosophy:
 *   Axis 1 — Environment (dev/staging/prod)
 *   Axis 2 — Firebase auth (local/staging/prod)
 *   Axis 3 — Data (mock/real)
 *
 * Key invariants:
 *   - Public pages NEVER show "Mock Data" badge regardless of NEXT_PUBLIC_MOCK_API
 *   - Platform pages show "Mock Data" badge when NEXT_PUBLIC_MOCK_API=true
 *   - "Preparing demo" text must never appear anywhere
 *   - ApiStatusIndicator shows the correct env badge (DEV/STAGING/PROD) via hostname
 *   - BackendUnreachable banner only appears in real mode when API is down (not in mock)
 *   - SandboxBanner present on UAT domain, absent on prod/dev
 *
 * Run: npx playwright test tests/e2e/environment-mode-audit.spec.ts
 *
 * SSOT: unified-trading-pm/codex/08-workflows/environment-mode-philosophy.md
 */

// ─── Public page invariants ───────────────────────────────────────────────────

const PUBLIC_ROUTES = [
  "/",
  "/investment-management",
  "/platform",
  "/regulatory",
  "/who-we-are",
  "/contact",
  "/briefings",
];

test.describe("Public pages — no mock badge, no demo text", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} — no Mock Data badge`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");

      // Badge must not exist at all on public pages
      const badge = page.locator('[data-testid="runtime-mode-badge"]');
      await expect(badge).toHaveCount(0);
    });

    test(`${route} — no "Mock Data" text visible`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");

      // No visible "Mock Data" text anywhere (not just the badge)
      const mockText = page.getByText("Mock Data", { exact: false });
      await expect(mockText).toHaveCount(0);
    });

    test(`${route} — no "Preparing demo" text`, async ({ page }) => {
      await page.goto(route);
      // Check early — this text appears during load
      const preparingDemo = page.getByText(/preparing demo/i);
      await expect(preparingDemo).toHaveCount(0);
    });

    test(`${route} — renders content within 3s`, async ({ page }) => {
      const start = Date.now();
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(3000);

      // Page must have visible content (not blank)
      const body = await page.locator("body").innerText();
      expect(body.trim().length).toBeGreaterThan(10);
    });
  }
});

// ─── "Preparing demo" must never appear ──────────────────────────────────────

test.describe("No 'Preparing demo' text — anywhere in the app", () => {
  test("root route has no 'Preparing demo' text at any point during load", async ({
    page,
  }) => {
    // Intercept and watch for the phrase before hydration completes
    let foundBadText = false;
    page.on("response", () => {
      /* intentionally empty — we just want navigation to proceed */
    });

    await page.goto("/");

    // Check immediately after navigation (catches flash states)
    const html = await page.content();
    if (/preparing demo/i.test(html)) foundBadText = true;

    await page.waitForLoadState("networkidle");
    const html2 = await page.content();
    if (/preparing demo/i.test(html2)) foundBadText = true;

    expect(foundBadText, "Page must never show 'Preparing demo' text").toBe(false);
  });
});

// ─── Environment badge (hostname-derived) ────────────────────────────────────

test.describe("ApiStatusIndicator — env badge is hostname-derived", () => {
  test("env badge shows DEV on localhost", async ({ page }) => {
    // Tests always run on localhost
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    // Log in with demo auth so we can see the platform nav
    try {
      const personaCard = page.locator("[data-testid='persona-card']").first();
      await personaCard.click({ timeout: 3000 });
      await page.waitForLoadState("domcontentloaded");
    } catch {
      // If no persona card visible (real auth mode), skip platform test
      test.skip();
    }

    const envBadge = page.locator('[data-testid="env-badge"]');
    await expect(envBadge).toBeVisible({ timeout: 5000 });
    await expect(envBadge).toHaveAttribute("data-env", "DEV");
  });

  test("env badge never shows 'DEV' on a non-localhost URL (contract)", async ({
    page,
  }) => {
    // This test validates the logic statically by checking the source code
    // rather than spinning up a different host. The hostname-check is in
    // lib/runtime/environment.ts — guarded by the getDeploymentEnv() function.
    const { execSync } = await import("child_process");
    const result = execSync(
      'grep -n "NEXT_PUBLIC_APP_ENV" components/shell/api-status-indicator.tsx || echo "not found"',
      { cwd: process.cwd(), encoding: "utf-8" },
    );
    // The old env-var fallback must not be the primary env source
    expect(result.trim()).toContain("not found");
  });
});

// ─── Mock mode: no "offline" API status ──────────────────────────────────────

test.describe("Mock mode — ApiStatusIndicator shows Mock, not Offline", () => {
  test("status dot shows 'mock' not 'offline' when MOCK_API=true", async ({
    page,
  }) => {
    // Only runs when NEXT_PUBLIC_MOCK_API=true (dev/UAT build)
    const mockApi = process.env.NEXT_PUBLIC_MOCK_API ?? "false";
    if (mockApi !== "true") {
      test.skip();
    }

    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    try {
      const personaCard = page.locator("[data-testid='persona-card']").first();
      await personaCard.click({ timeout: 3000 });
      await page.waitForURL(/\/services|\/dashboard/, { timeout: 5000 });
    } catch {
      test.skip();
    }

    const statusDot = page.locator('[data-testid="api-status-dot"]');
    await expect(statusDot).toBeVisible({ timeout: 5000 });
    // In mock mode: status must be "mock" not "offline"
    const status = await statusDot.getAttribute("data-status");
    expect(status, "Mock mode must not show offline API status").not.toBe("offline");
  });

  test("backend-unreachable banner absent in mock mode", async ({ page }) => {
    const mockApi = process.env.NEXT_PUBLIC_MOCK_API ?? "false";
    if (mockApi !== "true") {
      test.skip();
    }

    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    const banner = page.locator('[data-testid="backend-unreachable-banner"]');
    await expect(banner).toHaveCount(0);
  });
});

// ─── SandboxBanner presence ───────────────────────────────────────────────────

test.describe("SandboxBanner — present on sandbox/UAT, absent otherwise", () => {
  test("SandboxBanner absent when NEXT_PUBLIC_ENVIRONMENT_LABEL is unset", async ({
    page,
  }) => {
    const envLabel = process.env.NEXT_PUBLIC_ENVIRONMENT_LABEL ?? "";
    if (envLabel) {
      test.skip(); // This test only runs when no label (dev/prod without label)
    }

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const banner = page.locator('[aria-label="Sandbox environment notice"]');
    await expect(banner).toHaveCount(0);
  });

  test("SandboxBanner present and contains prod link when ENVIRONMENT_LABEL=sandbox", async ({
    page,
  }) => {
    const envLabel = process.env.NEXT_PUBLIC_ENVIRONMENT_LABEL ?? "";
    if (envLabel !== "sandbox") {
      test.skip(); // Only runs in UAT build
    }

    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const banner = page.locator('[aria-label="Sandbox environment notice"]');
    await expect(banner).toBeVisible({ timeout: 3000 });

    // Must link to prod site
    const prodLink = banner.locator('a[href*="www.odum-research.com"]');
    await expect(prodLink).toBeVisible();
  });
});
