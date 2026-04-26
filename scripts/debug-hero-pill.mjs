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
await page.screenshot({ path: "/tmp/home-hero.png", clip: { x: 0, y: 0, width: 1440, height: 700 } });
console.log("saved /tmp/home-hero.png");
await browser.close();
