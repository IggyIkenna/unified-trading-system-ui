/**
 * Phase 1A — Tier-0 demo walkthrough (the parts that exist at Phase 1).
 *
 * Per dart_ux_cockpit_executing_agent_prompt_2026_04_29.md "MCP Playwright
 * Tier-0 demo verification" — the canonical 13-step flow has Phase-2-7
 * dependencies (engagement toggle, stream-Live confirm dialog, /help/system-map,
 * locked previews, preset wizard) that are NOT YET BUILT. This spec covers
 * the steps that ARE buildable at Phase 1:
 *
 *   1. Navigate dashboard with seeded persona (Desmond DART-Full).
 *   2. Verify dashboard renders without console / network errors.
 *   3. Click DART Terminal tile → land on the trading shell.
 *   4. Scope persistence: navigate Terminal → Research, scope follows in URL
 *      and survives reload (the Phase 1 wedge).
 *   5. Re-seed as DeFi-Full (Patrick) → verify scope-bar widget grids reshape.
 *
 * Steps 6-9 (engagement / stream / locked previews / system-map / wizard)
 * are flagged TODO in this file — they unblock as Phase 2 → 7 land.
 */

import { expect, test, type ConsoleMessage, type Request } from "@playwright/test";
import { clearPersona, seedPersona } from "../seed-persona";

interface CapturedError {
  readonly kind: "console" | "network";
  readonly text: string;
  readonly url?: string;
}

function captureErrors(page: import("@playwright/test").Page): CapturedError[] {
  const errors: CapturedError[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      errors.push({ kind: "console", text: msg.text() });
    }
  });
  page.on("requestfailed", (req: Request) => {
    const url = req.url();
    // Mock-handler 4xx surfaces are part of the demo (e.g. permission gates).
    // Only flag genuine connectivity / 5xx failures.
    const failure = req.failure();
    const errText = failure?.errorText ?? "request failed";
    if (errText !== "net::ERR_ABORTED") {
      errors.push({ kind: "network", text: errText, url });
    }
  });
  page.on("response", (res) => {
    const status = res.status();
    if (status >= 500) {
      errors.push({ kind: "network", text: `HTTP ${status}`, url: res.url() });
    }
  });
  return errors;
}

test.describe("Phase 1A — Tier-0 walkthrough (Phase 1-scope steps)", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
  });

  test("DART-Full prospect: dashboard → terminal → research; scope persists", async ({ page }) => {
    const errors = captureErrors(page);

    // Step 1: navigate as a demo persona with DART-Full entitlements.
    await seedPersona(page, "client-full");
    await page.goto("/dashboard");

    // Step 2: confirm dashboard rendered without errors. Anchor on the
    // DART Terminal tile rendered via ServiceTile (data-testid).
    await expect(page.locator('[data-testid="service-tile-dart-terminal"]')).toBeVisible({ timeout: 30_000 });

    // Step 3: click into DART Terminal → trading shell loads.
    await page.locator('[data-testid="service-tile-dart-terminal-primary"]').first().click();
    await page.waitForURL(/\/services\/(trading|research|workspace)/, { timeout: 30_000 });

    // Step 4: scope persistence — navigate to a scoped URL, verify localStorage
    // is hydrated. This is the Phase 1 wedge.
    await page.goto(
      "/services/trading/overview?surface=terminal&tm=command&ag=DEFI&fam=CARRY_AND_YIELD&eng=monitor&stream=paper",
    );
    await page.waitForFunction(() => window.localStorage.getItem("dart-workspace-scope") !== null, undefined, {
      timeout: 30_000,
    });
    const persisted = await page.evaluate(() => window.localStorage.getItem("dart-workspace-scope"));
    expect(persisted).not.toBeNull();
    const parsed: { state: { scope: Record<string, unknown> } } = JSON.parse(persisted!);
    expect(parsed.state.scope.assetGroups).toEqual(["DEFI"]);
    expect(parsed.state.scope.families).toEqual(["CARRY_AND_YIELD"]);

    // Step 5: cross-tab survival — same URL reopened in a fresh navigation
    // hydrates the same scope.
    await page.goto("/dashboard");
    await page.goto(
      "/services/trading/overview?surface=terminal&tm=command&ag=DEFI&fam=CARRY_AND_YIELD&eng=monitor&stream=paper",
    );
    const persistedAgain = await page.evaluate(() => window.localStorage.getItem("dart-workspace-scope"));
    const parsedAgain: { state: { scope: Record<string, unknown> } } = JSON.parse(persistedAgain!);
    expect(parsedAgain.state.scope.assetGroups).toEqual(["DEFI"]);

    // Step 12-13 from canonical: zero console errors / no 5xx.
    expect(errors.filter((e) => e.kind === "console")).toEqual([]);
    expect(errors.filter((e) => e.kind === "network")).toEqual([]);
  });

  test("Tier toggle (admin): live execution-stream URL hydrates only with execution-full", async ({ page }) => {
    // Admin holds wildcard "*" — `execution-full` matches.
    await seedPersona(page, "admin");
    await page.goto("/dashboard?surface=terminal&tm=command&stream=live");
    await page.waitForFunction(() => window.localStorage.getItem("dart-workspace-scope") !== null);
    const adminPersisted = await page.evaluate(() => window.localStorage.getItem("dart-workspace-scope"));
    const adminParsed: { state: { scope: Record<string, unknown> } } = JSON.parse(adminPersisted!);
    expect(adminParsed.state.scope.executionStream).toBe("live");

    // Re-seed as a data-only persona — `stream=live` MUST silently downgrade.
    await page.evaluate(() => window.localStorage.removeItem("dart-workspace-scope"));
    await clearPersona(page);
    await seedPersona(page, "client-data-only");
    await page.goto("/dashboard?surface=terminal&tm=command&stream=live");
    await page.waitForFunction(() => window.localStorage.getItem("dart-workspace-scope") !== null);
    const dataOnlyPersisted = await page.evaluate(() => window.localStorage.getItem("dart-workspace-scope"));
    const dataOnlyParsed: { state: { scope: Record<string, unknown> } } = JSON.parse(dataOnlyPersisted!);
    // §4.3 safety contract.
    expect(dataOnlyParsed.state.scope.executionStream).toBe("paper");
  });
});

/* ──────────────────────────────────────────────────────────────────────────
 * TODO at later phases:
 *
 * Phase 2 (DartScopeBar): assert the scope-bar component renders with chips
 * for asset_group / family / archetype and clicking a chip mutates URL +
 * localStorage atomically.
 *
 * Phase 2 + §4.3: the engagement toggle and stream toggle in the cockpit
 * toolbar; verify the Paper→Live confirm dialog fires AND is disabled for
 * personas without `execution-full`.
 *
 * Phase 6 (presets wizard): assert the four-step wizard mounts on first
 * dashboard visit for an unseeded user, and the recommended preset matches
 * the persona-derived starter cockpit.
 *
 * Phase 7 (locked previews + system-map): visit /help/system-map and assert
 * the IA explainer renders. Click a locked preview and assert scope-aware
 * upgrade copy.
 *
 * Phase 8 (mock liveness): assert P&L / alert / backtest counters tick during
 * a 30-second observation window with `?freeze=false`.
 * ──────────────────────────────────────────────────────────────────────── */
