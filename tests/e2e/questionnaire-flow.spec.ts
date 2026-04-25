/**
 * Questionnaire → Deep Dive access-code → /briefings flow.
 *
 * Covers the full prospect funnel as it actually ships:
 *   1. Empty submit blocks with the rose error banner.
 *   2. Partial submit advances the banner one axis at a time.
 *   3. Cookie-consent gate fires AFTER required-field gate.
 *   4. Email confirmation gate (Resend round-trip) blocks unlock if
 *      the API returns !ok — fake emails can't bypass.
 *   5. Successful submit unlocks /briefings via localStorage flag and
 *      shows the "Sign out of Deep Dive" badge.
 *   6. "Already have an access code?" affordance routes to /briefings.
 *
 * Run with:
 *     npx playwright test tests/e2e/questionnaire-flow.spec.ts
 *
 * Against UAT:
 *     PLAYWRIGHT_BASE_URL=https://uat.odum-research.com npx playwright \
 *         test tests/e2e/questionnaire-flow.spec.ts
 *
 * Resend is mocked at the page.route level — these tests DO NOT send
 * email and DO NOT depend on RESEND_API_KEY. The submit endpoint
 * /api/questionnaire/email is intercepted and the response shape is
 * what the page reacts to.
 */

import { expect, test, type Page } from "@playwright/test";

// These tests share localStorage state via addInitScript and lean on the
// dev server's hot-reload being stable across navigations. Running them
// in parallel against a single dev server occasionally races on Sheet
// drawer auto-open timing — serialise the file to keep CI deterministic.
test.describe.configure({ mode: "serial" });

const QUESTIONNAIRE_PATH = "/questionnaire";

/**
 * Pre-accept the cookie banner so consent is not the failure mode under
 * test. Also clear the briefing-session unlock so we always start gated.
 * Force a desktop viewport so the mobile nav Sheet stays closed —
 * otherwise its overlay intercepts pointer events and blocks the form.
 */
async function preflight(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("odum-cookie-consent", "accepted");
      // site-header auto-opens its mobile-nav Sheet on first visit when
      // the viewport is ≥1280px wide; that overlay intercepts pointer
      // events and blocks the form. Set the dismissed flag so the Sheet
      // stays closed.
      window.localStorage.setItem("odum.nav.dismissed", "1");
      window.localStorage.removeItem("odum-briefing-session");
      window.localStorage.removeItem("odum-questionnaire-response");
      window.localStorage.removeItem("odum-questionnaire-envelope");
    } catch {
      /* localStorage unavailable — test will surface its own failure */
    }
  });
}

/** Close any nav Sheet drawer that might be intercepting pointer events. */
async function dismissAnyOpenSheet(page: Page): Promise<void> {
  // Press Escape — Radix Sheet listens for it and closes any open drawer.
  // Idempotent: no-op if no Sheet is open.
  await page.keyboard.press("Escape").catch(() => undefined);
  // Wait for any closing animation to finish before further interactions.
  await page
    .locator('[data-slot="sheet-overlay"]')
    .waitFor({ state: "detached", timeout: 2_000 })
    .catch(() => undefined);
}

/** Stub the Resend round-trip with a configurable success/failure outcome. */
async function mockEmailApi(page: Page, ok: boolean, reason?: string): Promise<void> {
  await page.route("**/api/questionnaire/email", async (route) => {
    await route.fulfill({
      status: ok ? 200 : 502,
      contentType: "application/json",
      body: JSON.stringify({ ok, reason: reason ?? (ok ? "sent" : "resend_502") }),
    });
  });
}

/**
 * Fill every required axis with the canonical "DART path" answers so we
 * land on a state where validateRequired() returns null. Strategy
 * preferences (Q7-Q11) are intentionally LEFT BLANK so the test also
 * proves they're optional.
 */
async function fillCanonicalDartPath(page: Page): Promise<void> {
  await page.getByTestId("category-DeFi").check();
  await page.getByTestId("instrument-spot").check();
  // venue_scope_mode defaults to "all" — no action needed.
  await page.getByTestId("strategy-carry").check();
  // service_family defaults to DART — no action needed.
  await page.getByTestId("fund-structure-SMA").check();
  await page.getByTestId("envelope-email").fill("e2e-prospect@example.com");
  await page.getByTestId("envelope-firm-name").fill("E2E Test Capital");
  await page.getByTestId("firm-location-uk").check();
}

test.describe("Questionnaire required-field gate", () => {
  test.beforeEach(async ({ page }) => {
    await preflight(page);
    await mockEmailApi(page, true);
  });

  test("empty submit blocks with the rose error banner", async ({ page }) => {
    await page.goto(QUESTIONNAIRE_PATH, { waitUntil: "load" });
    await dismissAnyOpenSheet(page);
    await expect(page.getByTestId("questionnaire-form")).toBeVisible();
    await expect(page.getByTestId("questionnaire-error-banner")).toHaveCount(0);

    await page.getByTestId("questionnaire-submit").click();

    await expect(page.getByTestId("questionnaire-error-banner")).toBeVisible();
    await expect(page.getByTestId("questionnaire-error-banner")).toContainText(/category/i);
    // Stays on /questionnaire — no navigation.
    expect(new URL(page.url()).pathname).toBe(QUESTIONNAIRE_PATH);
  });

  test("banner advances one axis at a time as fields are filled", async ({ page }) => {
    await page.goto(QUESTIONNAIRE_PATH, { waitUntil: "load" });
    await dismissAnyOpenSheet(page);

    // Q1 → Q2
    await page.getByTestId("category-DeFi").check();
    await page.getByTestId("questionnaire-submit").click();
    await expect(page.getByTestId("questionnaire-error-banner")).toContainText(/instrument type/i);

    // Q2 → Q4 (Q3 venue_scope defaults to "all" so it's already satisfied)
    await page.getByTestId("instrument-spot").check();
    await page.getByTestId("questionnaire-submit").click();
    await expect(page.getByTestId("questionnaire-error-banner")).toContainText(/strategy style/i);

    // Q4 → Q6
    await page.getByTestId("strategy-carry").check();
    await page.getByTestId("questionnaire-submit").click();
    await expect(page.getByTestId("questionnaire-error-banner")).toContainText(/fund structure/i);

    // Q6 → envelope.email
    await page.getByTestId("fund-structure-SMA").check();
    await page.getByTestId("questionnaire-submit").click();
    await expect(page.getByTestId("questionnaire-error-banner")).toContainText(/work email/i);

    // email shape rejected
    await page.getByTestId("envelope-email").fill("not-an-email");
    await page.getByTestId("questionnaire-submit").click();
    await expect(page.getByTestId("questionnaire-error-banner")).toContainText(/doesn.?t look right/i);

    // envelope.email valid → firm_name
    await page.getByTestId("envelope-email").fill("e2e@example.com");
    await page.getByTestId("questionnaire-submit").click();
    await expect(page.getByTestId("questionnaire-error-banner")).toContainText(/firm name/i);

    // firm_name → firm_location
    await page.getByTestId("envelope-firm-name").fill("E2E Capital");
    await page.getByTestId("questionnaire-submit").click();
    await expect(page.getByTestId("questionnaire-error-banner")).toContainText(/firm is based/i);
  });

  test("explicit venue scope with empty CSV blocks at Q3", async ({ page }) => {
    await page.goto(QUESTIONNAIRE_PATH, { waitUntil: "load" });
    await dismissAnyOpenSheet(page);
    await page.getByTestId("category-DeFi").check();
    await page.getByTestId("instrument-spot").check();
    await page.getByTestId("venue-scope-explicit").check();
    // CSV deliberately left blank
    await page.getByTestId("questionnaire-submit").click();
    await expect(page.getByTestId("questionnaire-error-banner")).toContainText(/venues/i);
  });
});

test.describe("Questionnaire success path", () => {
  test.beforeEach(async ({ page }) => {
    await preflight(page);
  });

  test("valid submit unlocks /briefings and shows the access badge", async ({ page }) => {
    await mockEmailApi(page, true);

    await page.goto(QUESTIONNAIRE_PATH, { waitUntil: "load" });
    await dismissAnyOpenSheet(page);
    await fillCanonicalDartPath(page);
    await page.getByTestId("questionnaire-submit").click();

    // Success span renders, then the page redirects to /briefings.
    await expect(page.getByTestId("questionnaire-success")).toBeVisible({ timeout: 5_000 });
    await page.waitForURL("**/briefings", { timeout: 5_000 });

    // The Deep-Dive access badge proves the briefing-session flag was
    // written by setBriefingSessionActive(). Visible in every env.
    await expect(page.getByTestId("briefings-access-badge")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("briefings-signout-button")).toBeVisible();
  });

  test("Resend rejection holds the user on the form (no unlock)", async ({ page }) => {
    await mockEmailApi(page, false, "no_api_key");

    await page.goto(QUESTIONNAIRE_PATH, { waitUntil: "load" });
    await dismissAnyOpenSheet(page);
    await fillCanonicalDartPath(page);
    await page.getByTestId("questionnaire-submit").click();

    // The Firestore/localStorage write succeeds, but the email gate
    // fails — error renders and we stay on /questionnaire.
    await expect(page.getByTestId("questionnaire-error")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId("questionnaire-error")).toContainText(/email backend|configured/i);
    expect(new URL(page.url()).pathname).toBe(QUESTIONNAIRE_PATH);

    // briefing-session flag should NOT have been set.
    const flag = await page.evaluate(() => window.localStorage.getItem("odum-briefing-session"));
    expect(flag).toBeNull();
  });
});

test.describe("Questionnaire — already-have-code affordance", () => {
  test.beforeEach(async ({ page }) => {
    await preflight(page);
  });

  test("clicking the affordance routes to /briefings", async ({ page }) => {
    await page.goto(QUESTIONNAIRE_PATH, { waitUntil: "load" });
    await dismissAnyOpenSheet(page);
    await expect(page.getByTestId("questionnaire-have-code-affordance")).toBeVisible();
    await page.getByTestId("questionnaire-enter-code-link").click();
    await page.waitForURL("**/briefings");
    expect(new URL(page.url()).pathname).toBe("/briefings");
  });
});

test.describe("Questionnaire cookie-consent gate", () => {
  test("declined cookies blocks submit AFTER required-fields gate", async ({ page }) => {
    // Override preflight()'s "accepted" stub with "declined" — but keep the
    // viewport + nav-dismissed flag so the Sheet drawer doesn't intercept clicks.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("odum-cookie-consent", "declined");
        window.localStorage.setItem("odum.nav.dismissed", "1");
        window.localStorage.removeItem("odum-briefing-session");
      } catch {
        /* noop */
      }
    });
    await mockEmailApi(page, true);

    await page.goto(QUESTIONNAIRE_PATH, { waitUntil: "load" });
    await dismissAnyOpenSheet(page);
    await fillCanonicalDartPath(page);
    await page.getByTestId("questionnaire-submit").click();

    // With every field filled the cookie gate is the next blocker.
    await expect(page.getByTestId("questionnaire-error-banner")).toContainText(/consent banner/i);
  });
});
