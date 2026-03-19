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

  runtimeErrorsMap.set(page, errors);
});

const routes = [
  "/",
  "/jobs",
  "/audit/trail",
  "/audit/compliance",
  "/audit/health",
];

const runtimeErrorsMap = new Map<import("@playwright/test").Page, string[]>();

for (const path of routes) {
  test(`route ${path} renders without ErrorBoundary crash`, async ({
    page,
  }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Something went wrong")).not.toBeVisible();
    await expect(
      page.getByText(/Unknown Error|TypeError|Cannot read/i),
    ).not.toBeVisible();

    const root = page.locator("#root");
    await expect(root).not.toBeEmpty();

    const errors = runtimeErrorsMap.get(page) ?? [];
    expect(errors).toEqual([]);
  });
}
