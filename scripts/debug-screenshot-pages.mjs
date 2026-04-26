/**
 * Quick screenshot harness — load specified routes against a base URL,
 * scroll-and-snap the full page, write to /tmp for review.
 *
 * Usage:
 *   node scripts/debug-screenshot-pages.mjs                 # localhost:3000
 *   BASE_URL=https://uat.odum-research.com node scripts/debug-screenshot-pages.mjs
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUT_DIR = "/tmp/debug-screenshot-pages";
mkdirSync(OUT_DIR, { recursive: true });

const ROUTES = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ["/platform", "/story"];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await ctx.addInitScript(() => {
  try {
    window.localStorage.setItem("odum-cookie-consent", "accepted");
    window.localStorage.setItem("odum.nav.dismissed", "1");
  } catch {
    /* noop */
  }
});

for (const route of ROUTES) {
  const url = BASE_URL + route;
  const safeName = route.replace(/^\//, "").replace(/[^a-z0-9-]/gi, "-") || "root";
  const out = `${OUT_DIR}/${safeName}.png`;
  console.log(`→ ${url}`);
  await page.goto(url, { waitUntil: "load", timeout: 30_000 });
  await page.waitForTimeout(1_500);
  await page.screenshot({ path: out, fullPage: true });
  console.log(`  saved ${out}`);
}

await browser.close();
console.log("\ndone.");
