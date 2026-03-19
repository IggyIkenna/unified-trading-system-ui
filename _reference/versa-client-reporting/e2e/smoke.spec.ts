import { test, expect } from "@playwright/test";

test.describe("Client Reporting UI — Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("/api/**", async (route) => {
      const json = (d: unknown) =>
        route.fulfill({
          contentType: "application/json",
          body: JSON.stringify(d),
        });
      const url = route.request().url();
      if (url.includes("/api/reports"))
        return json({
          reports: [
            {
              id: "rpt-001",
              name: "Apex Capital — February 2026",
              client: "Apex Capital",
              type: "monthly",
              status: "delivered",
              period: "2026-02",
              generatedAt: "2026-03-01T09:00:00Z",
            },
          ],
        });
      if (url.includes("/api/performance"))
        return json({
          totalReturn: 0.187,
          sharpe: 2.34,
          maxDrawdown: 0.042,
          byClient: [],
          monthly: [],
        });
      if (url.includes("/api/clients"))
        return json({ clients: ["Apex Capital", "Meridian Fund"] });
      return json({});
    });
  });

  test("shows mock mode banner", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[aria-label="Mock mode active"]')).toBeVisible();
  });

  test("loads Client Reporting header", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Client Reporting")).toBeVisible();
  });

  test("shows all three tabs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("tab", { name: "Reports" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Performance" })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Generate Report" }),
    ).toBeVisible();
  });

  test("reports tab is active by default", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Client Reports")).toBeVisible();
  });

  test("reports table shows data", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Apex Capital — February 2026")).toBeVisible();
    await expect(page.getByText("Apex Capital").first()).toBeVisible();
  });

  test("reports stats cards visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Total Reports")).toBeVisible();
    await expect(page.getByText("Delivered").first()).toBeVisible();
    await expect(page.getByText("Pending").first()).toBeVisible();
  });

  test("switches to performance tab", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Performance" }).click();
    await expect(page.getByText("Performance Summary")).toBeVisible();
    await expect(page.getByText("Total Return")).toBeVisible();
    await expect(page.getByText("Sharpe Ratio")).toBeVisible();
    await expect(page.getByText("Max Drawdown")).toBeVisible();
  });

  test("performance tab shows client breakdown", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Performance" }).click();
    await expect(page.getByText("By Client")).toBeVisible();
  });

  test("switches to generate tab", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Generate Report" }).click();
    await expect(
      page.getByRole("heading", { name: "Generate Report" }),
    ).toBeVisible();
    await expect(page.getByText("Client").first()).toBeVisible();
    await expect(page.getByText("Report Type").first()).toBeVisible();
    await expect(page.getByText("Period").first()).toBeVisible();
  });

  test("generate button disabled without selection", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Generate Report" }).click();
    await expect(
      page.getByRole("button", { name: "Generate Report" }),
    ).toBeDisabled();
  });

  test("mock mode banner dismissable", async ({ page }) => {
    await page.goto("/");
    await page.locator('[aria-label="Dismiss mock mode banner"]').click();
    await expect(
      page.locator('[aria-label="Mock mode active"]'),
    ).not.toBeVisible();
  });

  test("reports table shows all three report rows", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Apex Capital — February 2026")).toBeVisible();
    await expect(page.getByText("Meridian Fund — February 2026")).toBeVisible();
    await expect(page.getByText("QuantEdge Q4 2025")).toBeVisible();
  });

  test("reports table shows delivered and pending status badges", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText("delivered").first()).toBeVisible();
    await expect(page.getByText("pending").first()).toBeVisible();
  });

  test("reports table shows quarterly report type", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("quarterly")).toBeVisible();
  });

  test("performance tab shows correct metric values", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Performance" }).click();
    // Values from mock data: totalReturn 0.187 = 18.7%, sharpe 2.34, maxDrawdown 0.042 = 4.2%
    await expect(page.getByText(/18\.7|0\.187/)).toBeVisible();
    await expect(page.getByText(/2\.34/)).toBeVisible();
  });

  test("generate tab shows period selector", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Generate Report" }).click();
    await expect(page.getByText("Period").first()).toBeVisible();
  });
});
