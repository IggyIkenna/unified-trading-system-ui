import { test, expect } from "@playwright/test";

test("debug: page loads and content renders", async ({ page }) => {
  // Set up mock authentication
  await page.addInitScript(() => {
    localStorage.setItem("portal_user", "demo-user");
    localStorage.setItem("portal_token", "demo-token");
  });

  // Navigate to Basis Trade strategy page
  await page.goto("http://localhost:3100/services/trading/strategies/basis-trade", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  // Wait for page to settle
  await page.waitForTimeout(2000);

  // Get page content
  const body = await page.locator("body").textContent();
  console.log("PAGE CONTENT:", body?.substring(0, 800));

  // Check for heading
  const heading = await page.locator("h2").textContent();
  console.log("HEADING:", heading);

  // Check all divs
  const divCount = await page.locator("div").count();
  console.log("DIV COUNT:", divCount);

  // Take screenshot
  await page.screenshot({ path: "/tmp/debug-basis-trade.png" });

  expect(divCount).toBeGreaterThan(0);
});
