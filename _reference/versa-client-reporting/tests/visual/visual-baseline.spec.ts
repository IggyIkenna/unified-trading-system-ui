import { test, expect } from "@playwright/test";

/**
 * Visual baseline screenshots for client-reporting-ui.
 * Run with: VITE_MOCK_API=true npx playwright test tests/visual/
 * Screenshots saved to tests/visual/screenshots/
 */

test.use({ viewport: { width: 1920, height: 1080 } });

const PAGES = [
  { name: "reports", path: "/reports" },
  { name: "performance", path: "/performance" },
  { name: "generate-report", path: "/generate" },
  { name: "deployments", path: "/deployments" },
];

for (const page of PAGES) {
  test(`visual baseline: ${page.name}`, async ({ page: p }) => {
    await p.goto(page.path, { waitUntil: "networkidle" });
    await p.waitForTimeout(500);
    await expect(p).toHaveScreenshot(`${page.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
}
