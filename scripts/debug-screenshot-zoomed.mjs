/**
 * Crop-zoomed screenshots of specific page sections.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "/tmp/debug-screenshot-pages";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await ctx.addInitScript(() => {
  try {
    window.localStorage.setItem("odum-cookie-consent", "accepted");
    window.localStorage.setItem("odum.nav.dismissed", "1");
  } catch {
    /* noop */
  }
});

// /story timeline closeup
await page.goto(BASE_URL + "/story", { waitUntil: "load" });
await page.waitForTimeout(1_500);
const timelineHeading = await page.getByText("Timeline").first();
await timelineHeading.scrollIntoViewIfNeeded();
const timelineHandle = await timelineHeading.evaluateHandle((el) => el.closest("div"));
const tBox = await timelineHandle.asElement()?.boundingBox();
if (tBox) {
  await page.screenshot({
    path: `${OUT}/story-timeline-zoom.png`,
    clip: {
      x: tBox.x - 8,
      y: tBox.y - 8,
      width: Math.min(900, tBox.width + 200),
      height: Math.min(800, tBox.height + 16),
    },
  });
  console.log(`saved story-timeline-zoom.png (${tBox.width}x${tBox.height})`);
}

// /platform DASHBOARD/API + adjacent-routes section closeup
await page.goto(BASE_URL + "/platform", { waitUntil: "load" });
await page.waitForTimeout(1_500);
const dashHeading = await page.getByText("Dashboard", { exact: true }).first();
await dashHeading.scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy({ top: -120, behavior: "instant" }));
await page.waitForTimeout(300);
const pBox = await dashHeading.evaluate((el) => {
  const r = el.getBoundingClientRect();
  return { x: 0, y: r.top + window.scrollY - 80, width: window.innerWidth, height: 700 };
});
await page.screenshot({
  path: `${OUT}/platform-middle-zoom.png`,
  clip: pBox,
});
console.log(`saved platform-middle-zoom.png`);

await browser.close();
