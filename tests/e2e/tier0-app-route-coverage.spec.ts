/**
 * Tier 0 route registry audit — fails CI if a static-segment page.tsx under app/ is not listed
 * in e2e/tier0-route-registry.ts. Prevents forgetting new pages in the smoke list.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { expect, test } from "@playwright/test";
import { TIER0_DYNAMIC_SAMPLE_PATHS, TIER0_REGISTRY_PATHS } from "./tier0-route-registry";

function isRouteGroup(segment: string): boolean {
  return segment.startsWith("(") && segment.endsWith(")");
}

function isDynamicSegment(segment: string): boolean {
  return segment.includes("[");
}

/** Collect URLs for every `page.tsx` under `app/` that lives only under static path segments. */
function discoverStaticAppRoutes(appRoot: string): Set<string> {
  const out = new Set<string>();

  function visit(dir: string, urlSegments: string[]) {
    if (!fs.existsSync(dir)) return;

    const pageFile = path.join(dir, "page.tsx");
    if (fs.existsSync(pageFile)) {
      out.add(urlSegments.length === 0 ? "/" : `/${urlSegments.join("/")}`);
    }

    for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!name.isDirectory()) continue;
      if (name.name.startsWith("_")) continue;
      if (isDynamicSegment(name.name)) continue;

      const child = path.join(dir, name.name);
      if (isRouteGroup(name.name)) {
        visit(child, urlSegments);
      } else {
        visit(child, [...urlSegments, name.name]);
      }
    }
  }

  visit(appRoot, []);
  return out;
}

test.describe("Tier 0 app ↔ registry coverage", () => {
  test("every static app page route is in tier0-route-registry", () => {
    const appRoot = path.join(__dirname, "..", "app");
    const discovered = discoverStaticAppRoutes(appRoot);
    const registry = new Set(TIER0_REGISTRY_PATHS);

    const missing = [...discovered].filter((p) => !registry.has(p)).sort();
    expect(
      missing,
      `Add these paths to ALL_TIER0_ROUTES in e2e/tier0-route-registry.ts (then static-smoke will cover them):\n${missing.join("\n")}`,
    ).toEqual([]);
  });

  test("tier0-route-registry has no unexpected static-only paths (except known dynamic samples)", () => {
    const appRoot = path.join(__dirname, "..", "app");
    const discovered = discoverStaticAppRoutes(appRoot);

    const orphans = TIER0_REGISTRY_PATHS.filter((p) => !discovered.has(p) && !TIER0_DYNAMIC_SAMPLE_PATHS.has(p)).sort();

    expect(
      orphans,
      `Remove or fix these registry paths (no matching static app page.tsx):\n${orphans.join("\n")}`,
    ).toEqual([]);
  });
});
