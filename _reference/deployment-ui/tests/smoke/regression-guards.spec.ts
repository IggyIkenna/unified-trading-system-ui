import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      await route.fulfill({ json: {} });
    },
  );

  (page as any).__runtimeErrors = errors;
});

test("route / renders without ErrorBoundary crash", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Something went wrong")).not.toBeVisible();
  await expect(
    page.getByText(/Unknown Error|TypeError|Cannot read/i),
  ).not.toBeVisible();

  const root = page.locator("#root");
  await expect(root).not.toBeEmpty();

  const errors = (page as any).__runtimeErrors as string[];
  expect(errors).toEqual([]);
});
