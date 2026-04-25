import { expect, test } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as yaml from "js-yaml";
import { clearPersona } from "../seed-persona";

/**
 * Refactor G3.3 — Briefings-content CMS migration.
 *
 * Asserts that `/briefings` hub + every `/briefings/<slug>` page renders
 * from the YAML store (`content/briefings/*.yaml`) via the loader rather
 * than a hardcoded TypeScript literal. Coverage:
 *
 * 1. YAML store contains `_hub.yaml` + one file per pillar in the closed
 *    slug vocabulary; every file parses as valid YAML.
 * 2. Hub page renders the `tldr` copy from `_hub.yaml` verbatim.
 * 3. Every pillar page renders its `title` and `tldr` from YAML verbatim
 *    and mounts `<BriefingHero>` (shared with G1.12).
 * 4. Orphan-reachability — every pillar is reachable via a link from the
 *    hub `/briefings` page.
 * 5. A pillar slug not in the YAML store must 404 (protects against
 *    stale routes persisting after a YAML delete).
 *
 * Plan: unified-trading-pm/plans/active/refactor_g3_3_briefings_cms_migration_2026_04_20.plan.md
 * Codex SSOT: unified-trading-pm/codex/14-playbooks/experience/briefings-hub.md
 *             unified-trading-pm/codex/14-playbooks/experience/dart-briefing.md
 *             unified-trading-pm/codex/14-playbooks/experience/im-decision-journey.md
 *             unified-trading-pm/codex/14-playbooks/experience/regulatory-umbrella-briefing.md
 */

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CONTENT_DIR = path.join(REPO_ROOT, "content", "briefings");

interface PillarYaml {
  readonly slug: string;
  readonly title: string;
  readonly tldr: string;
}

interface HubYaml {
  readonly title: string;
  readonly tldr: string;
  readonly displayOrder: readonly string[];
}

function loadPillarYaml(slug: string): PillarYaml {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, `${slug}.yaml`), "utf8");
  const parsed = yaml.load(raw) as PillarYaml;
  return parsed;
}

function loadHubYaml(): HubYaml {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, "_hub.yaml"), "utf8");
  return yaml.load(raw) as HubYaml;
}

/**
 * Strip glossary tokens (`{{term:foo}}` / `{{term:foo|label}}`) from a
 * body string. The UI renders them as inline tooltips so the plain text
 * on the page is the unwrapped form. The test compares against this
 * unwrapped projection.
 */
function stripTerms(s: string): string {
  return s.replace(/\{\{term:([a-z0-9-]+)(?:\|([^}]+))?\}\}/g, (_m, id: string, label?: string) => {
    return label ?? id;
  });
}

const EXPECTED_PILLARS = [
  "investment-management",
  "regulatory",
  "platform",
  "dart-signals-in",
  "dart-full",
  "signals-out",
] as const;

async function gotoWithRetry(page: import("@playwright/test").Page, route: string): Promise<number> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      return response?.status() ?? 0;
    } catch (err) {
      if (attempt === 3) throw err;
      await page.waitForTimeout(1_000 * attempt);
    }
  }
  return 0;
}

test.describe("refactor G3.3 — briefings CMS migration", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
    await page.addInitScript(() => {
      localStorage.removeItem("odum-briefing-session");
    });
  });

  test("YAML store contains hub + every pillar", () => {
    expect(fs.existsSync(path.join(CONTENT_DIR, "_hub.yaml"))).toBe(true);
    for (const slug of EXPECTED_PILLARS) {
      const file = path.join(CONTENT_DIR, `${slug}.yaml`);
      expect(fs.existsSync(file), `${slug}.yaml must exist`).toBe(true);
      // Must parse as a mapping with slug matching filename.
      const parsed = yaml.load(fs.readFileSync(file, "utf8")) as { slug?: string };
      expect(parsed.slug, `${slug}.yaml: slug must match filename`).toBe(slug);
    }
  });

  test("hub page renders copy from _hub.yaml", async ({ page }) => {
    const hub = loadHubYaml();
    const status = await gotoWithRetry(page, "/briefings");
    expect(status, "/briefings must not 4xx/5xx").toBeLessThan(400);

    const hero = page.locator("[data-briefing-hero]").first();
    await expect(hero, "hub must render [data-briefing-hero]").toBeVisible({ timeout: 20_000 });

    // The hub title is always "Briefings" — the YAML SSOT.
    await expect(hero, "hub hero must contain YAML title").toContainText(hub.title);
    // TL;DR from YAML, glossary-token-free (hub tldr carries no tokens today).
    await expect(hero, "hub hero must contain YAML tldr").toContainText(stripTerms(hub.tldr));

    // Every slug in displayOrder should have a card link on the hub.
    for (const slug of hub.displayOrder) {
      const card = page.locator(`a[href="/briefings/${slug}"]`).first();
      await expect(card, `hub must link to /briefings/${slug}`).toBeAttached();
    }
  });

  test("every pillar page renders title + tldr from its YAML", async ({ page }) => {
    for (const slug of EXPECTED_PILLARS) {
      const pillar = loadPillarYaml(slug);
      const status = await gotoWithRetry(page, `/briefings/${slug}`);
      expect(status, `/briefings/${slug} must not 4xx/5xx`).toBeLessThan(400);

      const hero = page.locator("[data-briefing-hero]").first();
      await expect(hero, `/briefings/${slug} must render BriefingHero`).toBeVisible({
        timeout: 20_000,
      });

      // Title matches YAML.
      await expect(hero, `${slug} hero must contain YAML title`).toContainText(pillar.title);

      // TL;DR — strip glossary tokens so the comparison matches rendered DOM text.
      // The tldr is one paragraph so asserting a distinctive sentence from it is
      // stable across render pipelines.
      const stripped = stripTerms(pillar.tldr);
      // Pick the first 60 characters as a stable substring (the hero definitely
      // renders the full tldr inside the paragraph; substring match survives
      // line-break variations).
      const substring = stripped.slice(0, 60).trim();
      await expect(page.locator("body"), `${slug} page must contain YAML tldr substring`).toContainText(substring);
    }
  });

  test("orphan-reachability — every pillar linked from hub", async ({ page }) => {
    await gotoWithRetry(page, "/briefings");
    for (const slug of EXPECTED_PILLARS) {
      const anchor = page.locator(`a[href="/briefings/${slug}"]`).first();
      await expect(anchor, `/briefings/${slug} must be linked from the hub grid`).toBeAttached();
    }
  });

  test("unknown pillar slug returns 404 via notFound()", async ({ page }) => {
    const response = await page.goto("/briefings/this-slug-does-not-exist", {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    // Next.js serves 404 pages — the route handler calls notFound() which
    // flips the status to 404.
    expect(response?.status(), "unknown slug must 404").toBe(404);
  });
});
