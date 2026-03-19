import { test, expect } from "@playwright/test";

test.describe("Client Reporting UI - Navigation", () => {
  test("should load home page", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("h1")).toContainText("client-reporting-ui");
  });

  test("should display app description", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByText(/Client performance|portfolio analytics|statements/),
    ).toBeVisible();
  });

  test("should have root app container", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(".app")).toBeVisible();
  });
});
