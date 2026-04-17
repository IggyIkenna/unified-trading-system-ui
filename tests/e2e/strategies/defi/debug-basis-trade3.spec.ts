import { test, expect } from "@playwright/test";

test("debug: find what text is on page", async ({ page }) => {
  // Set up mock authentication
  await page.addInitScript(() => {
    localStorage.setItem("portal_user", "demo-user");
    localStorage.setItem("portal_token", "demo-token");
  });

  // Navigate
  await page.goto("http://localhost:3100/services/trading/strategies/basis-trade", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  await page.waitForTimeout(3000);

  // Get all text
  const body = await page.locator("body").evaluate(() => document.body.innerText);
  console.log("BODY TEXT:", body.substring(0, 2000));

  // Check for specific elements
  const inputs = await page.locator("input").count();
  const buttons = await page.locator("button").count();
  const selects = await page.locator("select").count();

  console.log("INPUTS:", inputs, "BUTTONS:", buttons, "SELECTS:", selects);

  await page.screenshot({ path: "/tmp/debug-basis-trade3.png" });

  expect(buttons).toBeGreaterThan(0);
});
