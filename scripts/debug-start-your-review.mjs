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
await page.goto((process.env.BASE_URL ?? "http://localhost:3000") + "/start-your-review", { waitUntil: "networkidle" });
await page.waitForSelector("h1", { timeout: 10000 });
await page.waitForTimeout(800);
await page.screenshot({ path: "/tmp/start-your-review.png", fullPage: true });
console.log("saved /tmp/start-your-review.png");
await browser.close();
