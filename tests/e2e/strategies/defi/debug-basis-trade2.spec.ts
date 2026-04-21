import { test, expect } from "@playwright/test";

test("debug: check page structure", async ({ page }) => {
  // Set up mock authentication
  await page.addInitScript(() => {
    localStorage.setItem("portal_user", "demo-user");
    localStorage.setItem("portal_token", "demo-token");
  });

  // Listen for console errors
  page.on("console", (msg) => console.log("CONSOLE:", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

  // Navigate to Carry Basis strategy page (renamed from basis-trade)
  const response = await page.goto("http://localhost:3100/services/trading/strategies/carry-basis", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  console.log("RESPONSE STATUS:", response?.status());

  // Wait for page to settle
  await page.waitForTimeout(3000);

  // Get raw HTML
  const html = await page.content();
  console.log("HTML LENGTH:", html.length);
  console.log("HTML PREVIEW:", html.substring(0, 1000));

  // Check for specific text
  const hasBasisTrade = await page.getByText("Basis Trade").count();
  console.log("FOUND 'Basis Trade':", hasBasisTrade);

  // Take screenshot
  await page.screenshot({ path: "/tmp/debug-basis-trade2.png" });

  expect(html.length).toBeGreaterThan(100);
});
