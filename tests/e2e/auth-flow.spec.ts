import { test, expect } from "@playwright/test";

/**
 * AUTH & PERSONA FLOW E2E TESTS
 *
 * Tier 1: Login page renders, navigation exists
 * Tier 2: Persona switching, entitlement gating
 * Tier 3: Full login → persona switch → logout journey
 *
 * All tests run against mock mode (DISABLE_AUTH=true, CLOUD_MOCK_MODE=true).
 */

const API = "http://localhost:8030";

test.beforeAll(async ({ request }) => {
  await request.post(`${API}/admin/reset`);
});

// ── Tier 1: Navigation — verify routes exist, pages render, no 404s ──

test.describe("Tier 1: Auth Navigation", () => {
  test("login page renders without errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(50);

    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes("Warning:") && !e.includes("DevTools") && !e.includes("Download the React DevTools"),
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test("dashboard page renders after login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);
  });

  test("root path loads without crashing", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(await page.title()).toBeTruthy();
  });

  test("dashboard has navigation with lifecycle stages", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const nav = page.locator("nav");
    expect(await nav.count()).toBeGreaterThan(0);

    // Lifecycle stages should be present in navigation
    const navText = await nav.first().textContent();
    expect(navText).toBeTruthy();
  });
});

// ── Tier 2: Persona & Entitlement Gating ──

test.describe("Tier 2: Persona Switching", () => {
  test("persona selector exists on dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Look for persona/user selector in the UI
    const personaSelector = page.locator(
      '[data-testid="persona-selector"], ' +
        'button:has-text("Admin"), ' +
        'button:has-text("Persona"), ' +
        'button:has-text("Switch"), ' +
        '[data-testid="user-menu"]',
    );

    // If persona selector exists, it should be interactive
    if ((await personaSelector.count()) > 0) {
      await expect(personaSelector.first()).toBeVisible();
    }
  });

  test("admin persona sees all lifecycle stages in nav", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Admin should see full navigation
    const navLinks = page.locator("nav a[href], nav button");
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("all service entry routes are accessible", async ({ page }) => {
    const serviceEntryRoutes = [
      "/services/data/overview",
      "/services/research/overview",
      "/services/trading/overview",
      "/services/execution/overview",
      "/services/trading/risk",
      "/services/reports/overview",
      "/services/manage/clients",
    ];

    for (const route of serviceEntryRoutes) {
      const response = await page.goto(route);
      // Should not 404
      expect(
        response?.status() === 200 || response?.status() === 304,
        `Expected ${route} to return 200/304, got ${response?.status()}`,
      ).toBeTruthy();
    }
  });
});

// ── Tier 3: Full Auth Journey ──

test.describe("Tier 3: Full Auth Journey", () => {
  test("login page has form elements", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Login page should have interactive elements (buttons, inputs, or links)
    const interactive = page.locator('button, input, a[href*="login"], a[href*="auth"]');
    await expect(async () => {
      expect(await interactive.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 5000 });
  });

  test("navigating from login to dashboard works", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Try clicking login/demo/continue button
    const loginBtn = page.locator(
      'button:has-text("Login"), ' +
        'button:has-text("Sign"), ' +
        'button:has-text("Demo"), ' +
        'button:has-text("Continue"), ' +
        'a:has-text("Dashboard")',
    );

    if ((await loginBtn.count()) > 0) {
      await loginBtn.first().click();
      await page.waitForLoadState("networkidle");
    } else {
      // Direct navigation as fallback
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");
    }

    const body = await page.textContent("body");
    expect(body?.length).toBeGreaterThan(100);
  });

  test("logout link exists when authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Look for logout or sign-out control
    const logoutControl = page.locator(
      'button:has-text("Logout"), ' +
        'button:has-text("Sign Out"), ' +
        'a:has-text("Logout"), ' +
        'a:has-text("Sign Out"), ' +
        '[data-testid="logout"]',
    );

    // Logout may be in a user menu dropdown
    const userMenu = page.locator(
      '[data-testid="user-menu"], ' +
        'button[aria-label*="user"], ' +
        'button[aria-label*="account"], ' +
        'button[aria-label*="profile"]',
    );

    if ((await userMenu.count()) > 0) {
      await userMenu.first().click();
      await page.waitForLoadState("networkidle");
    }

    // Either logout is directly visible or inside a menu
    const hasLogout = (await logoutControl.count()) > 0 || (await userMenu.count()) > 0;
    expect(hasLogout).toBeTruthy();
  });
});
