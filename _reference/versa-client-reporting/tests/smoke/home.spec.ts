import { test, expect } from "@playwright/test";

test.describe("Client Reporting UI - Home Page", () => {
  test("should display main heading", async ({ page }) => {
    await page.goto("/");

    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("client-reporting-ui");
  });

  test("should display reporting description", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByText(
        "Client performance reports, portfolio analytics, statements",
      ),
    ).toBeVisible();
  });

  test("should render app without crash", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#root")).toBeVisible();
    await expect(page.locator(".app")).toBeVisible();
  });
});
