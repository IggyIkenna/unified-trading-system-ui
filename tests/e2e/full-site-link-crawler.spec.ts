/**
 * Full-site link crawler (E2E)
 *
 * Phase A — Bounded BFS from seed paths: discovers same-origin links from the
 * live DOM (including open shadow roots), expands header/nav flyouts each hop,
 * asserts HTTP OK + no crash copy. Stops after MAX_BFS_VISITS to keep runtime bounded.
 *
 * Phase B — Visits any tier-0 registry path not reached in Phase A (guarantees
 * CI coverage of the static-smoke route list even if nav omits a link).
 *
 * External http(s) URLs: optional HEAD/GET probe unless CRAWLER_SKIP_EXTERNAL=1.
 *
 * Run:
 *   PLAYWRIGHT_BASE_URL=http://localhost:3100 npx playwright test --project link-crawler --workers=1
 *
 * Tier 0 only (no unified-trading-api on 8030):
 *   PLAYWRIGHT_SKIP_API_WEBSERVER=1 CRAWLER_SKIP_EXTERNAL=1 PLAYWRIGHT_BASE_URL=http://localhost:3100 npx playwright test --project link-crawler --workers=1
 */

import { expect, test, type Page } from "@playwright/test";
import { TIER0_REGISTRY_PATHS } from "./tier0-route-registry";
import {
  BAD_BODY_REGEXES,
  collectAllHrefs,
  expandHeaderFlyouts,
  internalQueueKey,
  isExternalHttpUrl,
  probeExternalUrl,
} from "./link-crawl-helpers";

/** Cap Phase A so the test finishes in predictable wall time (dev server compile varies). */
const MAX_BFS_VISITS = Number(process.env.CRAWLER_MAX_BFS_VISITS ?? "160");
const GOTO_TIMEOUT_MS = Number(process.env.CRAWLER_GOTO_TIMEOUT_MS ?? "60000");
const REGISTRY_GOTO_TIMEOUT_MS = Number(process.env.CRAWLER_REGISTRY_GOTO_TIMEOUT_MS ?? "45000");
const SKIP_EXTERNAL = process.env.CRAWLER_SKIP_EXTERNAL === "1";

const SEED_PATHS: string[] = [
  "/",
  "/dashboard",
  "/briefings",
  "/docs",
  "/login",
  "/signup",
  "/health",
  "/investment-management",
  "/platform",
  "/platform/full",
  "/platform/signals-in",
  "/signals",
  "/regulatory",
  "/who-we-are",
  "/contact",
  "/contact?service=general",
  "/questionnaire",
];

async function waitForDemoReady(page: Page): Promise<void> {
  await page
    .getByText("Preparing demo…")
    .first()
    .waitFor({ state: "hidden", timeout: 120_000 })
    .catch(() => {});
}

async function loginAsAdmin(page: Page, origin: string): Promise<void> {
  await page.goto(`${origin}/login`, { waitUntil: "domcontentloaded", timeout: GOTO_TIMEOUT_MS });
  await waitForDemoReady(page);

  const persona = page.locator('[data-testid="persona-card"]');
  if ((await persona.count()) > 0) {
    await persona.first().click();
    await page.waitForTimeout(800);
    await page.waitForURL(/\/(dashboard|services)/, { timeout: 120_000 }).catch(() => {});
    if (page.url().includes("dashboard") || page.url().includes("services")) return;
  }

  const quick = page.getByRole("button", { name: /admin@odum/i });
  if ((await quick.count()) > 0) {
    await quick.first().click();
    await page.waitForTimeout(800);
    await page.waitForURL(/\/(dashboard|services)/, { timeout: 120_000 }).catch(() => {});
    if (page.url().includes("dashboard") || page.url().includes("services")) return;
  }

  await page.getByRole("textbox", { name: "Email" }).fill("admin@odum.internal");
  await page.getByRole("textbox", { name: "Password" }).fill("demo");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 120_000 });
}

async function visitAndAssert(
  page: Page,
  origin: string,
  pathKey: string,
  failedPages: { path: string; reason: string }[],
  gotoTimeoutMs: number,
): Promise<void> {
  const url = `${origin}${pathKey.startsWith("/") ? pathKey : `/${pathKey}`}`;
  let response;
  try {
    response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: gotoTimeoutMs });
  } catch (e) {
    failedPages.push({ path: pathKey, reason: e instanceof Error ? e.message : "goto failed" });
    return;
  }
  const status = response?.status() ?? 0;
  if (status >= 400) {
    failedPages.push({ path: pathKey, reason: `HTTP ${status}` });
    return;
  }
  await waitForDemoReady(page);
  await page.waitForTimeout(250);
  await expandHeaderFlyouts(page);
  const bodyText = await page
    .locator("body")
    .innerText()
    .catch(() => "");
  for (const rx of BAD_BODY_REGEXES) {
    if (rx.test(bodyText)) {
      failedPages.push({ path: pathKey, reason: `body matched ${rx}` });
      return;
    }
  }
}

test.describe.configure({ mode: "serial" });

test.describe("Full site link crawler", () => {
  test.setTimeout(SKIP_EXTERNAL ? 100 * 60 * 1000 : 120 * 60 * 1000);

  test("Phase A: bounded BFS + Phase B: registry fill + optional externals", async ({
    page,
    context,
    request,
    baseURL,
  }) => {
    const origin = baseURL ?? "http://localhost:3100";
    expect(origin.startsWith("http"), `baseURL must be set (got ${baseURL})`).toBeTruthy();

    await context.addInitScript(() => {
      window.localStorage.setItem("odum-briefing-session", "1");
    });

    await loginAsAdmin(page, origin);

    const visited = new Set<string>();
    const external = new Set<string>();
    const failedPages: { path: string; reason: string }[] = [];

    const enqueue = (pathKey: string, queue: string[]) => {
      if (visited.has(pathKey)) return;
      if (queue.includes(pathKey)) return;
      queue.push(pathKey);
    };

    // ─── Phase A: BFS ─────────────────────────────────────────────────────
    const queue: string[] = [];
    for (const p of [...new Set(SEED_PATHS)]) enqueue(p, queue);

    while (queue.length > 0 && visited.size < MAX_BFS_VISITS) {
      const pathKey = queue.shift()!;
      if (visited.has(pathKey)) continue;
      visited.add(pathKey);

      await visitAndAssert(page, origin, pathKey, failedPages, GOTO_TIMEOUT_MS);
      if (visited.size % 25 === 0) {
        console.info(`[crawler] BFS progress: visited=${visited.size}/${MAX_BFS_VISITS} queue=${queue.length}`);
      }

      let hrefs: string[] = [];
      try {
        hrefs = await collectAllHrefs(page);
      } catch {
        /* ignore extraction errors on transient states */
      }
      for (const href of hrefs) {
        if (isExternalHttpUrl(href, origin)) {
          external.add(href);
          continue;
        }
        const key = internalQueueKey(origin, href);
        if (key && !visited.has(key) && queue.length < 2500) {
          enqueue(key, queue);
        }
      }
    }

    // ─── Phase B: registry gaps ───────────────────────────────────────────
    const missingRegistry = TIER0_REGISTRY_PATHS.filter((p) => !visited.has(p)).sort();
    let registryIdx = 0;
    for (const pathKey of missingRegistry) {
      registryIdx += 1;
      await visitAndAssert(page, origin, pathKey, failedPages, REGISTRY_GOTO_TIMEOUT_MS);
      if (registryIdx % 25 === 0) {
        console.info(`[crawler] registry fill: ${registryIdx}/${missingRegistry.length}`);
      }
    }

    expect(
      failedPages,
      `Pages failed during crawl:\n${failedPages.map((f) => `${f.path}: ${f.reason}`).join("\n")}`,
    ).toEqual([]);

    if (!SKIP_EXTERNAL && external.size > 0) {
      const brokenExternals: { url: string; status: number; note?: string }[] = [];
      for (const url of [...external].sort()) {
        const r = await probeExternalUrl(request, url);
        if (!r.ok) brokenExternals.push({ url, status: r.status, note: r.note });
      }
      expect(
        brokenExternals,
        `External URLs failed probe:\n${brokenExternals.map((b) => `${b.url} -> ${b.status} ${b.note ?? ""}`).join("\n")}`,
      ).toEqual([]);
    }

    console.info(
      `Link crawl: bfsCap=${MAX_BFS_VISITS} visitedUnique=${visited.size} externals=${external.size} gotoTimeoutMs=${GOTO_TIMEOUT_MS}`,
    );
  });
});
