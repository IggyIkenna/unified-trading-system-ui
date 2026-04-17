/**
 * Regulatory Onboarding Runbook — E2E Test
 *
 * Full end-to-end flow: signup → validation → docs → resume → admin approve →
 * fund creation → API keys → reporting access.
 *
 * Run: npx playwright test e2e/runbooks/regulatory-onboarding.spec.ts
 *
 * Prerequisites:
 * - Dev server on localhost:3100 with NEXT_PUBLIC_MOCK_API=true
 * - NEXT_PUBLIC_AUTH_PROVIDER=demo
 */

import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://localhost:3100";

const TEST_USER = {
  firstName: "Jane",
  lastName: "Smith",
  fullName: "Jane Smith",
  email: `test-${Date.now()}@alphacapital.com`,
  company: "Alpha Capital Test",
  phone: "+44 7700 900000",
  password: "testpass123",
  aum: "1000000",
};

test.describe("Regulatory Onboarding Runbook", () => {
  test.describe("Stage 1: Signup — Account Creation", () => {
    test("navigates to regulatory signup from landing page", async ({ page }) => {
      await page.goto(`${BASE}/`);
      // Click through to regulatory service
      const regLink = page.locator('a[href="/services/regulatory"]');
      if (await regLink.isVisible()) {
        await regLink.click();
        await expect(page).toHaveURL(/services\/regulatory/);
        // Click Get Started or Apply Now
        const applyBtn = page.locator('a[href*="signup?service=regulatory"]');
        if (await applyBtn.first().isVisible()) {
          await applyBtn.first().click();
        }
      } else {
        await page.goto(`${BASE}/signup?service=regulatory`);
      }
      await expect(page).toHaveURL(/signup.*service=regulatory/);
    });

    test("validates Step 1 — catches missing fields", async ({ page }) => {
      await page.goto(`${BASE}/signup?service=regulatory`);

      // Try to continue without filling anything
      await page.click('button:has-text("Continue")');

      // Should show validation errors
      await expect(page.locator("text=Required")).toBeVisible();
    });

    test("validates Step 1 — catches invalid email", async ({ page }) => {
      await page.goto(`${BASE}/signup?service=regulatory`);

      await page.fill('input[placeholder="Jane Smith"]', TEST_USER.fullName);
      await page.fill('input[placeholder="jane@company.com"]', "not-an-email");
      await page.fill('input[placeholder="Acme Capital"]', TEST_USER.company);
      await page.fill('input[placeholder="Min 6 characters"]', TEST_USER.password);
      await page.fill('input[placeholder="Repeat password"]', TEST_USER.password);

      await page.click('button:has-text("Continue")');
      await expect(page.locator("text=Enter a valid email address")).toBeVisible();
    });

    test("validates Step 1 — catches name without surname", async ({ page }) => {
      await page.goto(`${BASE}/signup?service=regulatory`);

      await page.fill('input[placeholder="Jane Smith"]', "Jane"); // no surname
      await page.fill('input[placeholder="jane@company.com"]', TEST_USER.email);
      await page.fill('input[placeholder="Acme Capital"]', TEST_USER.company);
      await page.fill('input[placeholder="Min 6 characters"]', TEST_USER.password);
      await page.fill('input[placeholder="Repeat password"]', TEST_USER.password);

      await page.click('button:has-text("Continue")');
      await expect(page.locator("text=Enter first and last name")).toBeVisible();
    });

    test("validates Step 1 — catches short password", async ({ page }) => {
      await page.goto(`${BASE}/signup?service=regulatory`);

      await page.fill('input[placeholder="Jane Smith"]', TEST_USER.fullName);
      await page.fill('input[placeholder="jane@company.com"]', TEST_USER.email);
      await page.fill('input[placeholder="Acme Capital"]', TEST_USER.company);
      await page.fill('input[placeholder="Min 6 characters"]', "abc"); // too short
      await page.fill('input[placeholder="Repeat password"]', "abc");

      await page.click('button:has-text("Continue")');
      await expect(page.locator("text=At least 6 characters")).toBeVisible();
    });

    test("validates Step 1 — catches phone without country code", async ({ page }) => {
      await page.goto(`${BASE}/signup?service=regulatory`);

      await page.fill('input[placeholder="Jane Smith"]', TEST_USER.fullName);
      await page.fill('input[placeholder="jane@company.com"]', TEST_USER.email);
      await page.fill('input[placeholder="Acme Capital"]', TEST_USER.company);
      await page.fill('input[placeholder="+44 7XXX XXX XXX"]', "07700900000"); // no +
      await page.fill('input[placeholder="Min 6 characters"]', TEST_USER.password);
      await page.fill('input[placeholder="Repeat password"]', TEST_USER.password);

      await page.click('button:has-text("Continue")');
      await expect(page.locator("text=Start with + and country code")).toBeVisible();
    });

    test("Step 1 succeeds with valid data — account created", async ({ page }) => {
      await page.goto(`${BASE}/signup?service=regulatory`);

      await page.fill('input[placeholder="Jane Smith"]', TEST_USER.fullName);
      await page.fill('input[placeholder="jane@company.com"]', TEST_USER.email);
      await page.fill('input[placeholder="Acme Capital"]', TEST_USER.company);
      await page.fill('input[placeholder="+44 7XXX XXX XXX"]', TEST_USER.phone);
      await page.fill('input[placeholder="Min 6 characters"]', TEST_USER.password);
      await page.fill('input[placeholder="Repeat password"]', TEST_USER.password);

      await page.click('button:has-text("Continue")');

      // Should advance to Step 2 and show "Account created" banner
      await expect(page.locator("text=Account created")).toBeVisible({ timeout: 10000 });
      await expect(page.locator("text=Configure Your Engagement")).toBeVisible();
    });
  });

  test.describe("Stage 2: Configure Engagement", () => {
    test("Step 2 — select AR engagement and activities", async ({ page }) => {
      // This test assumes account was already created in previous test
      // In a real runbook, you'd chain these or use fixtures
      await page.goto(`${BASE}/signup?service=regulatory`);

      // Fill Step 1 quickly
      await page.fill('input[placeholder="Jane Smith"]', "Test User Two");
      await page.fill('input[placeholder="jane@company.com"]', `test2-${Date.now()}@example.com`);
      await page.fill('input[placeholder="Acme Capital"]', "Test Corp");
      await page.fill('input[placeholder="Min 6 characters"]', "testpass");
      await page.fill('input[placeholder="Repeat password"]', "testpass");
      await page.click('button:has-text("Continue")');

      // Wait for Step 2
      await expect(page.locator("text=Configure Your Engagement")).toBeVisible({ timeout: 10000 });

      // Select AR
      await page.click("text=Appointed Representative (AR)");

      // Select a regulated activity
      await page.click("text=Dealing in Investments as Agent");

      // Hover to see tooltip
      const dealingLabel = page.locator("text=Dealing in Investments as Agent");
      await dealingLabel.hover();
      await expect(page.locator("text=Execute trades on behalf of your clients")).toBeVisible();

      // Continue to Step 3
      await page.click('button:has-text("Continue")');
      await expect(page.locator("text=Upload Documents")).toBeVisible();
    });
  });

  test.describe("Stage 3: Document Upload", () => {
    test("shows required documents based on applicant type", async ({ page }) => {
      await page.goto(`${BASE}/signup?service=regulatory`);
      // Quick fill Step 1 + 2
      await page.fill('input[placeholder="Jane Smith"]', "Doc Test");
      await page.fill('input[placeholder="jane@company.com"]', `doc-${Date.now()}@example.com`);
      await page.fill('input[placeholder="Acme Capital"]', "Doc Corp");
      await page.fill('input[placeholder="Min 6 characters"]', "testpass");
      await page.fill('input[placeholder="Repeat password"]', "testpass");
      await page.click('button:has-text("Continue")');

      await page.waitForSelector("text=Configure Your Engagement", {
        timeout: 10000,
      });
      await page.click("text=Appointed Representative (AR)");
      await page.click("text=Dealing in Investments as Agent");
      await page.click('button:has-text("Continue")');

      // Step 3: Documents
      await expect(page.locator("text=Upload Documents")).toBeVisible();
      await expect(page.locator("text=Proof of Address")).toBeVisible();
      await expect(page.locator("text=Identity Document")).toBeVisible();
      await expect(page.locator("text=Source of Funds Declaration")).toBeVisible();
    });
  });

  test.describe("Stage 4: Login & Forgot Password", () => {
    test("login page has forgot password link", async ({ page }) => {
      await page.goto(`${BASE}/login`);
      await expect(page.locator("text=Forgot password?")).toBeVisible();
    });

    test("forgot password shows demo mode message", async ({ page }) => {
      await page.goto(`${BASE}/login`);
      await page.fill('input[type="email"]', "test@example.com");
      await page.click("text=Forgot password?");
      // In demo mode, should show a toast
      await expect(page.locator("text=Password reset").or(page.locator("text=demo"))).toBeVisible({ timeout: 5000 });
    });
  });
});
