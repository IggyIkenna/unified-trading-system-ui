import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await ctx.addInitScript(() => {
  try {
    window.localStorage.setItem("odum-cookie-consent", "accepted");
    window.localStorage.setItem("odum.nav.dismissed", "1");
  } catch {}
});
await page.goto((process.env.BASE_URL ?? "http://localhost:3000") + "/", { waitUntil: "load" });
await page.waitForTimeout(2000);
const sec = page.locator('[aria-labelledby="engagement-routes-heading"]');
await sec.scrollIntoViewIfNeeded();
const box = await sec.boundingBox();
if (box) {
  await page.screenshot({
    path: "/tmp/home-engagement-routes.png",
    clip: {
      x: Math.max(0, box.x - 8),
      y: box.y - 8,
      width: Math.min(1440, box.width + 16),
      height: Math.min(1100, box.height + 16),
    },
  });
  console.log(`saved /tmp/home-engagement-routes.png  (${Math.round(box.width)}x${Math.round(box.height)})`);
}
await browser.close();
