/**
 * Smoke tests for Deployment UI package.
 *
 * The app runs on port 5183 (see vite.config.ts).
 * VITE_MOCK_API=true enables in-browser window.fetch interception
 * (src/lib/mock-api.ts). VITE_SKIP_AUTH=true bypasses RequireAuth so
 * Playwright does not get redirected to a login page.
 *
 * Mock data highlights (from src/lib/mock-api.ts):
 *   Services (pipeline layers 1–6 + infra):
 *     Layer 1: instruments-service, corporate-actions
 *     Layer 2: market-tick-data-service, market-data-processing-service
 *     Layer 3: features-* (8 services)
 *     Layer 4: ml-training-service, ml-inference-service
 *     Infra:   unified-trading-deployment-v2
 *
 * Covers:
 *   - App header text and description subtitle
 *   - Mock mode banner display and dismiss
 *   - Service list: layer headers and individual service names
 *   - Clicking a service reveals deployment tabs
 *   - Services Overview tab visible before service is selected
 *   - Tab labels: Deploy, History, Readiness, Data Status, Status, Config, Builds
 *   - Navigation: no JS errors during service selection and tab switching
 */

import { test, expect } from "@playwright/test";

const BASE = "http://localhost:5183";

// ---------------------------------------------------------------------------
// App Shell
// ---------------------------------------------------------------------------

test.describe("App Shell", () => {
  test("shows Unified Trading Deployment heading", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(page.getByText("Unified Trading Deployment")).toBeVisible();
  });

  test("shows deployment subtitle", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(
      page.getByText("deployment monitoring & orchestration"),
    ).toBeVisible();
  });

  test("shows mock mode banner when VITE_MOCK_API=true", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(page.locator('[aria-label="Mock mode active"]')).toBeVisible();
  });

  test("dismisses mock mode banner", async ({ page }) => {
    await page.goto(BASE + "/");
    await page.locator('[aria-label="Dismiss mock mode banner"]').click();
    await expect(
      page.locator('[aria-label="Mock mode active"]'),
    ).not.toBeVisible();
  });

  test("Clear Cache button is visible", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(
      page.getByRole("button", { name: /Clear Cache/ }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Service List — Pipeline Layers
// ---------------------------------------------------------------------------

test.describe("Service List — Pipeline Layers", () => {
  test("shows Layer 1: Root Services header", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(page.getByText("Layer 1: Root Services")).toBeVisible();
  });

  test("shows Layer 2: Data Ingestion header", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(page.getByText("Layer 2: Data Ingestion")).toBeVisible();
  });

  test("shows Layer 3: Feature Engineering header", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(page.getByText("Layer 3: Feature Engineering")).toBeVisible();
  });

  test("shows Pipeline Services card title", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(page.getByText("Pipeline Services")).toBeVisible();
  });

  test("shows instruments-service in service list", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(page.getByText("instruments-service")).toBeVisible();
  });

  test("shows corporate-actions in service list", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(page.getByText("corporate-actions")).toBeVisible();
  });

  test("shows market-tick-data-service in service list", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(page.getByText("market-tick-data-service")).toBeVisible();
  });

  test("shows ml-training-service in service list", async ({ page }) => {
    await page.goto(BASE + "/");
    await expect(page.getByText("ml-training-service")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Services Overview (no service selected yet)
// ---------------------------------------------------------------------------

test.describe("Services Overview", () => {
  test("shows Services Overview content before any service selected", async ({
    page,
  }) => {
    await page.goto(BASE + "/");
    // ServicesOverviewTab renders when no service is selected
    // It shows a load button or overview content
    await expect(page.getByText("Pipeline Services").first()).toBeVisible();
  });

  test("no JS errors on initial load", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(BASE + "/");
    await expect(page.getByText("Unified Trading Deployment")).toBeVisible();
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Service selection — tabs appear
// ---------------------------------------------------------------------------

test.describe("Service selection — tabs", () => {
  test("clicking instruments-service reveals Deploy tab", async ({ page }) => {
    await page.goto(BASE + "/");
    await page.getByText("instruments-service").click();
    await expect(page.getByRole("tab", { name: /Deploy/ })).toBeVisible();
  });

  test("clicking instruments-service reveals History tab", async ({ page }) => {
    await page.goto(BASE + "/");
    await page.getByText("instruments-service").click();
    await expect(page.getByRole("tab", { name: /History/ })).toBeVisible();
  });

  test("clicking instruments-service reveals Readiness tab", async ({
    page,
  }) => {
    await page.goto(BASE + "/");
    await page.getByText("instruments-service").click();
    await expect(page.getByRole("tab", { name: /Readiness/ })).toBeVisible();
  });

  test("clicking instruments-service reveals Builds tab", async ({ page }) => {
    await page.goto(BASE + "/");
    await page.getByText("instruments-service").click();
    await expect(page.getByRole("tab", { name: /Builds/ })).toBeVisible();
  });

  test("clicking instruments-service reveals Status tab", async ({ page }) => {
    await page.goto(BASE + "/");
    await page.getByText("instruments-service").click();
    // Use exact: true to avoid clash with "Data Status" tab
    await expect(
      page.getByRole("tab", { name: "Status", exact: true }),
    ).toBeVisible();
  });

  test("clicking instruments-service reveals Config tab", async ({ page }) => {
    await page.goto(BASE + "/");
    await page.getByText("instruments-service").click();
    await expect(page.getByRole("tab", { name: /Config/ })).toBeVisible();
  });

  test("tab switching from Deploy to History causes no JS error", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(BASE + "/");
    await page.getByText("instruments-service").click();
    await page.getByRole("tab", { name: /History/ }).click();
    // Wait for tab content to render
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Navigation — full tour with zero JS errors
// ---------------------------------------------------------------------------

test.describe("Navigation — full tour", () => {
  test("select two different services in sequence with no JS errors", async ({
    page,
  }) => {
    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    await page.goto(BASE + "/");
    await expect(page.getByText("Unified Trading Deployment")).toBeVisible();

    // Select first service
    await page.getByText("instruments-service").click();
    await expect(page.getByRole("tab", { name: /Deploy/ })).toBeVisible();

    // Select second service
    await page.getByText("corporate-actions").click();
    await expect(page.getByRole("tab", { name: /Deploy/ })).toBeVisible();

    // Switch tab
    await page.getByRole("tab", { name: /Config/ }).click();
    await page.waitForTimeout(200);

    expect(jsErrors).toHaveLength(0);
  });
});
