import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
const page = await ctx.newPage();
await ctx.addInitScript(() => {
  try {
    window.localStorage.setItem("odum-cookie-consent", "accepted");
    window.localStorage.setItem("odum.nav.dismissed", "1");
  } catch {}
});
await page.goto((process.env.BASE_URL ?? "http://localhost:3000") + "/story", { waitUntil: "load" });
await page.waitForTimeout(2000);
const firstYear = page.locator("ol > li").first();
await firstYear.scrollIntoViewIfNeeded();
const box = await firstYear.boundingBox();
if (box) {
  await page.screenshot({
    path: "/tmp/story-bullet-tight.png",
    clip: { x: Math.max(0, box.x - 40), y: box.y - 4, width: 360, height: Math.min(80, box.height + 8) },
  });
  console.log("saved /tmp/story-bullet-tight.png");
}
await browser.close();
