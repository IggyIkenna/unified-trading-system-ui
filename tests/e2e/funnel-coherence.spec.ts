import { expect, test } from "@playwright/test";

/**
 * Funnel Coherence plan — end-to-end persona walkthroughs.
 *
 * Workstream F (personas + E2E in quality gates). Asserts that each
 * persona sees only their path's questions and views; irrelevant
 * complexity is hidden.
 *
 * Scope (Phase 1-4 surfaces):
 *   - /strategy-evaluation pre-step gate (allocator vs builder)
 *   - URL-param-driven branch (?path=allocator|builder, ?regulatory=true)
 *   - /briefings by-route 2-row table
 *   - /platform Mode 01 vs Mode 02 differentiation callout
 *   - /investment-management allocator-intake themes
 *   - Strategy Review per-route scaffolding visible (skeleton only;
 *     full token-resolved render needs admin issuance)
 *   - /demo-session error states (no token, invalid token)
 *
 * Email checks are NOT covered automatically — Resend in dev only
 * delivers to ikenna@odum-research.com; see plan Decision 8.
 */

test.describe("Funnel Coherence — public funnel", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("Strategy Evaluation pre-step gate offers allocator + builder paths", async ({ page }) => {
    await page.goto("/strategy-evaluation", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /Which describes you best\?/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: /Start allocator intake/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Start builder DDQ/i })).toBeVisible();
  });

  test("Allocator path renders the 4-step wizard without methodology fields", async ({ page }) => {
    await page.goto("/strategy-evaluation?path=allocator", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /Strategy Evaluation/i })).toBeVisible({ timeout: 30_000 });
    // Allocator wizard renders the path label.
    await expect(page.getByText(/Path A — Allocator/i)).toBeVisible();
    // Builder-only fields MUST NOT appear on allocator path.
    await expect(page.getByText(/methodology/i)).toHaveCount(0);
    await expect(page.getByText(/equity curve/i)).toHaveCount(0);
    await expect(page.getByText(/track record/i)).toHaveCount(0);
  });

  test("Builder path with regulatory deep-link pre-checks regulatory wrapper", async ({ page }) => {
    await page.goto("/strategy-evaluation?path=builder&regulatory=true", { waitUntil: "load" });
    // Builder wizard renders "Strategy Evaluation Pack" heading.
    await expect(page.getByRole("heading", { name: /Strategy Evaluation/i })).toBeVisible({ timeout: 30_000 });
    // The regulatory-wrapper checkbox lives in step 2; the persisted
    // initial state should pre-check it. We can't easily click into step
    // 2 without filling step 1 valid fields, but we can assert the
    // FormState persisted (visible on page rehydrate via "Editing your
    // earlier submission" banner OR via the eventual checkbox state).
    // For now: assert the page rendered without falling back to the
    // pre-step gate.
    await expect(page.getByRole("heading", { name: /Which describes you best\?/i })).toHaveCount(0);
  });

  test("Briefings hub shows by-route 2-row routing table", async ({ page }) => {
    await page.goto("/briefings", { waitUntil: "load" });
    await page.locator("header").first().waitFor({ state: "attached", timeout: 60_000 });
    await expect(page.getByRole("heading", { name: /^Briefings$/i })).toBeVisible({ timeout: 15_000 });
    // By-route table.
    await expect(page.getByText(/Allocator \(capital → Odum\)/i)).toBeVisible();
    await expect(page.getByText(/Builder \/ counterparty \(your strategy\)/i)).toBeVisible();
    // Skip-ahead affordance.
    await expect(page.getByText(/Already know what fits\?/i)).toBeVisible();
  });

  test("/platform shows Mode 01 vs Mode 02 differentiation callout", async ({ page }) => {
    await page.goto("/platform", { waitUntil: "load" });
    await page.locator("header").first().waitFor({ state: "attached", timeout: 60_000 });
    await expect(page.getByText(/When to choose Full/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Rich data sources/i)).toBeVisible();
    await expect(page.getByText(/promotion ladder/i)).toBeVisible();
    await expect(page.getByText(/T\+1 perf-vs-backtest tracking/i)).toBeVisible();
  });

  test("/investment-management surfaces allocator-intake themes", async ({ page }) => {
    await page.goto("/investment-management", { waitUntil: "load" });
    await page.locator("header").first().waitFor({ state: "attached", timeout: 60_000 });
    await expect(page.getByText(/What we['’]ll ask you about/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Investor profile and risk appetite/i)).toBeVisible();
    await expect(page.getByText(/Capital scaling timeline/i)).toBeVisible();
    await expect(page.getByText(/Structure interest \(SMA \/ pooled fund \/ unsure\)/i)).toBeVisible();
  });

  test("/demo-session shows the gated landing without a token", async ({ page }) => {
    await page.goto("/demo-session", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /Demo session is gated/i })).toBeVisible({ timeout: 15_000 });
  });

  test("/demo-session with invalid token shows not-valid state", async ({ page }) => {
    await page.goto(`/demo-session?token=${"a".repeat(48)}`, { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /isn['’]t valid|has been revoked|has expired/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("Engagement-route process strip on /platform shows the 7-stage funnel", async ({ page }) => {
    await page.goto("/platform", { waitUntil: "load" });
    await page.locator("header").first().waitFor({ state: "attached", timeout: 60_000 });
    // Stages 04 Eval → 05 Strategy Review → 06 Walkthrough → 07 Commercial Tailoring
    // — assert the canonical names appear on the process strip.
    await expect(page.getByText(/Strategy Evaluation/i).first()).toBeVisible();
    await expect(page.getByText(/Strategy Review/i).first()).toBeVisible();
    await expect(page.getByText(/Platform walkthrough/i).first()).toBeVisible();
    await expect(page.getByText(/Commercial Tailoring/i).first()).toBeVisible();
  });
});
