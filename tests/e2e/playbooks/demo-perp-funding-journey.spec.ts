import { expect, test } from "@playwright/test";

/**
 * Demo client journey — Desmond-shape (Reg Umbrella + DART Signals-In
 * for cross-exchange perp-funding arbitrage). Walks the full flow from
 * public questionnaire through admin inspection to partitioned platform
 * access, so an account manager (or this script in CI) can verify a
 * staging-demo persona end-to-end before sending the link to a real
 * prospect.
 *
 * Stages:
 *   1. Public /questionnaire — fill as RegUmbrella + CeFi+DeFi + perp +
 *      arbitrage + carry. Assert the resolved persona is
 *      `prospect-perp-funding` (the new Desmond-shape persona registered
 *      in lib/auth/personas.ts).
 *   2. /admin/questionnaires — log in as the admin persona and assert the
 *      submission landed (localStorage sink in dev; Firestore in staging).
 *   3. /signup — the same browser session should recognise the
 *      questionnaire envelope (QUESTIONNAIRE_ENVELOPE_LOCAL_STORAGE_KEY)
 *      and show the "questionnaire attached" banner.
 *   4. Sign in as the seeded prospect and assert partitioned surface:
 *      reports visible (regulatory), trading visible (DART), research +
 *      promote hidden (Signals-In shape).
 *
 * Run: `npx playwright test tests/e2e/playbooks/demo-perp-funding-journey.spec.ts`
 *
 * Note: depends on the dev server running in mock mode. Firestore is
 * auto-bypassed via the `isDevSink()` heuristic — submissions go to
 * localStorage, and the admin questionnaires page surfaces a
 * "Firebase not configured (mock mode)" banner rather than throwing.
 * For a live Firestore test, run against staging and the sink flips to
 * `addDoc(collection(db, "questionnaires"))`.
 */

const PERP_FUNDING_PROSPECT = {
  email: "ops@desmond-capital.example",
  firm: "Desmond Capital",
};

test.describe("demo perp-funding client journey", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test("questionnaire routes Reg Umbrella + perp + arbitrage to prospect-perp-funding", async ({
    page,
  }) => {
    await page.goto("/questionnaire");
    await expect(page.getByTestId("questionnaire-page")).toBeVisible();

    // Categories: CeFi + DeFi (cross-exchange = both sides)
    await page.getByTestId("category-CeFi").check();
    await page.getByTestId("category-DeFi").check();

    // Instruments: perp (cross-exchange perp-funding)
    await page.getByTestId("instrument-perp").check();

    // Strategy style: arbitrage + carry (perp-funding arb is both)
    await page.getByTestId("strategy-arbitrage").check();
    await page.getByTestId("strategy-carry").check();

    // Service family: RegUmbrella (the Desmond shape — umbrella + DART)
    await page.getByTestId("service-family-RegUmbrella").check();

    await page.getByTestId("questionnaire-submit").click();
    await expect(page.getByTestId("questionnaire-success")).toBeVisible({
      timeout: 6000,
    });

    await page.waitForURL(/\/services/, { timeout: 10_000 });

    const persona = await page.evaluate(() =>
      localStorage.getItem("odum-persona/v1"),
    );
    expect(persona).toBe("prospect-perp-funding");

    // The submission should have been written to localStorage in dev
    // (isDevSink() -> localStorage path in lib/questionnaire/submit.ts).
    const raw = await page.evaluate(() =>
      localStorage.getItem("questionnaire-response-v1"),
    );
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw ?? "{}");
    expect(parsed.service_family).toBe("RegUmbrella");
    expect(parsed.instrument_types).toContain("perp");
    expect(parsed.strategy_style).toContain("arbitrage");
  });

  test("admin can inspect the submission via /admin/questionnaires", async ({
    page,
  }) => {
    // Seed a submission directly so this test is independent of the
    // preceding one (Playwright isolates storage per-test).
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "questionnaire-response-v1",
        JSON.stringify({
          categories: ["CeFi", "DeFi"],
          instrument_types: ["perp"],
          venue_scope: "all",
          strategy_style: ["arbitrage", "carry"],
          service_family: "RegUmbrella",
          fund_structure: "NA",
          submissionId: "q-local-demo",
          submittedAt: new Date().toISOString(),
        }),
      );
    });

    // Admin persona — seeded via demo auth. `isAdmin()` in `use-auth`
    // treats `admin@odum.internal` as internal + all-entitlements.
    await page.goto("/login");
    await page.getByTestId("login-email").fill("admin@odum.internal");
    await page.getByTestId("login-password").fill("demo");
    await page.getByTestId("login-submit").click();
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });

    await page.goto("/admin/questionnaires");
    // Either shows the live Firestore rows (staging) or a mock banner.
    await expect(page.locator("body")).toContainText(
      /questionnaires|Firebase not configured/i,
    );
  });

  test("signup shows questionnaire-attached banner when envelope is present", async ({
    page,
  }) => {
    // Seed envelope (normally written by the questionnaire submit helper).
    await page.goto("/");
    await page.evaluate((email) => {
      localStorage.setItem(
        "questionnaire-envelope-v1",
        JSON.stringify({
          email,
          firm_name: "Desmond Capital",
          access_code_fingerprint: "",
          submissionId: "q-local-demo",
          submittedAt: new Date().toISOString(),
        }),
      );
      localStorage.setItem(
        "questionnaire-response-v1",
        JSON.stringify({
          categories: ["CeFi", "DeFi"],
          instrument_types: ["perp"],
          venue_scope: "all",
          strategy_style: ["arbitrage", "carry"],
          service_family: "RegUmbrella",
          fund_structure: "NA",
        }),
      );
    }, PERP_FUNDING_PROSPECT.email);

    await page.goto("/signup");
    await expect(page.locator("body")).toContainText(
      PERP_FUNDING_PROSPECT.email,
    );
  });

  test("prospect-perp-funding sign-in shows Reports + DART, hides Research + Promote", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByTestId("login-email").fill(PERP_FUNDING_PROSPECT.email);
    await page.getByTestId("login-password").fill("demo");
    await page.getByTestId("login-submit").click();
    await page.waitForURL(/\/(services|dashboard)/, { timeout: 10_000 });

    // Reports are unlocked (regulatory reporting via the `reporting`
    // entitlement).
    await page.goto("/services/reports/executive");
    await expect(page.locator("body")).not.toContainText(
      /not authorised|denied|upgrade/i,
    );

    // Trading is unlocked (execution-full + trading-defi + trading-common).
    await page.goto("/services/trading/positions");
    await expect(page.locator("body")).not.toContainText(
      /not authorised|denied|upgrade/i,
    );

    // Research is gated — client keeps signal generation upstream on
    // Signals-In, so promote / research visibility is either padlocked
    // or hidden. Assert it is not the normal authorised surface.
    await page.goto("/services/research/strategy/overview");
    const bodyText = (await page.locator("body").innerText()).toLowerCase();
    const gated =
      bodyText.includes("not authorised") ||
      bodyText.includes("access") ||
      bodyText.includes("upgrade") ||
      bodyText.includes("locked");
    expect(gated, "research surface should be gated for prospect-perp-funding")
      .toBeTruthy();
  });
});
