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
await page.goto((process.env.BASE_URL ?? "http://localhost:3000") + "/platform", { waitUntil: "load" });
await page.waitForTimeout(2000);
const dash = page.getByText("Dashboard", { exact: true }).first();
await dash.scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy({ top: -260, behavior: "instant" }));
await page.waitForTimeout(400);
await page.screenshot({ path: "/tmp/platform-mid.png" });
console.log("saved /tmp/platform-mid.png");
await browser.close();
