import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
// Match the user's viewport — stacked layout means narrow (768px-ish).
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();
await ctx.addInitScript(() => {
  try {
    window.localStorage.setItem("odum-cookie-consent", "accepted");
    window.localStorage.setItem("odum.nav.dismissed", "1");
  } catch {}
});
await page.goto((process.env.BASE_URL ?? "http://localhost:3000") + "/story", { waitUntil: "load" });
await page.waitForTimeout(2000);
const ol = page.locator("ol").first();
await ol.scrollIntoViewIfNeeded();
const box = await ol.boundingBox();
if (box) {
  await page.screenshot({
    path: "/tmp/story-timeline-fresh.png",
    clip: { x: Math.max(0, box.x - 40), y: box.y - 8, width: 700, height: Math.min(900, box.height + 16) },
  });
  console.log(
    `saved /tmp/story-timeline-fresh.png  (ol box: ${Math.round(box.x)}, ${Math.round(box.y)}, ${Math.round(box.width)}x${Math.round(box.height)})`,
  );
}
await browser.close();
