import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await ctx.addInitScript(() => {
  try {
    window.localStorage.setItem("odum-cookie-consent", "accepted");
    window.localStorage.setItem("odum.nav.dismissed", "1");
  } catch {}
});

// Sign in via /login
await page.goto((process.env.BASE_URL ?? "http://localhost:3000") + "/login", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
const emailInput = page.locator('input[type="email"]').first();
const passwordInput = page.locator('input[type="password"]').first();
await emailInput.fill("admin@odum.internal");
await passwordInput.fill("demo123");
await page.locator('button[type="submit"]').first().click();
await page.waitForLoadState("networkidle");
await page.waitForTimeout(1500);

// Try /dashboard
await page.goto((process.env.BASE_URL ?? "http://localhost:3000") + "/dashboard", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);

const tileCount = await page.locator('[data-testid^="service-tile-"], [data-service-key]').count();
const subtitleText = await page
  .locator("h1, h2")
  .first()
  .textContent()
  .catch(() => null);
console.log("subtitle:", subtitleText);
console.log("tile count:", tileCount);

await page.screenshot({ path: "/tmp/dashboard-admin.png", fullPage: false });
console.log("saved /tmp/dashboard-admin.png");
await browser.close();
