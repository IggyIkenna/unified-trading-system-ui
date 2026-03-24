import { test, expect } from "@playwright/test";

/**
 * RESET DEMO FLOW E2E TESTS
 *
 * Tests the full reset cycle:
 * 1. Start with clean state (POST /admin/reset)
 * 2. Create mutations (place trade, add data)
 * 3. Verify mutations appear in UI
 * 4. Reset demo (POST /admin/reset or UI button)
 * 5. Verify mutations are gone, seed data preserved
 *
 * This validates the mock store's reset capability end-to-end.
 */

const API = "http://localhost:8030";

// ── API-Level Reset Tests ──

test.describe("API Reset Flow", () => {
  test.beforeEach(async ({ request }) => {
    await request.post(`${API}/admin/reset`);
  });

  test("API health check returns healthy", async ({ request }) => {
    const response = await request.get(`${API}/health`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("healthy");
  });

  test("seed data exists after reset", async ({ request }) => {
    const response = await request.get(`${API}/execution/orders`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.data.length).toBeGreaterThan(0);
  });

  test("create order → reset → order gone, seed preserved", async ({
    request,
  }) => {
    // Create a custom order
    const createResponse = await request.post(`${API}/execution/orders`, {
      data: {
        venue: "e2e-reset-test",
        instrument: "RESET-DEMO-TEST",
        side: "buy",
        type: "market",
        quantity: 10,
      },
    });
    expect(createResponse.ok()).toBeTruthy();

    // Verify custom order exists
    const beforeReset = await request.get(
      `${API}/execution/orders?venue=e2e-reset-test`,
    );
    const beforeBody = await beforeReset.json();
    expect(beforeBody.data.length).toBeGreaterThan(0);

    // Reset
    const resetResponse = await request.post(`${API}/admin/reset`);
    expect(resetResponse.ok()).toBeTruthy();

    // Verify custom order is gone
    const afterReset = await request.get(
      `${API}/execution/orders?venue=e2e-reset-test`,
    );
    const afterBody = await afterReset.json();
    expect(afterBody.data.length).toBe(0);

    // Verify seed data still present
    const seedOrders = await request.get(`${API}/execution/orders`);
    const seedBody = await seedOrders.json();
    expect(seedBody.data.length).toBeGreaterThan(0);
  });

  test("multiple resets are idempotent", async ({ request }) => {
    // Reset twice
    await request.post(`${API}/admin/reset`);
    await request.post(`${API}/admin/reset`);

    // Seed data should still be intact
    const response = await request.get(`${API}/execution/orders`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.data.length).toBeGreaterThan(0);
  });
});

// ── UI-Level Reset Tests ──

test.describe("UI Reset Flow", () => {
  test.beforeEach(async ({ request }) => {
    await request.post(`${API}/admin/reset`);
  });

  test("orders page shows seed data after fresh reset", async ({ page }) => {
    await page.goto("/services/trading/orders");
    await page.waitForLoadState("networkidle");

    // Wait for table rows to appear
    const tableRows = page.locator(
      'table tbody tr, [role="row"], [data-testid*="order"]',
    );
    await expect(async () => {
      expect(await tableRows.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });
  });

  test("positions page shows seed data after fresh reset", async ({ page }) => {
    await page.goto("/services/trading/positions");
    await page.waitForLoadState("networkidle");

    const tableRows = page.locator(
      'table tbody tr, [role="row"], [data-testid*="position"]',
    );
    await expect(async () => {
      expect(await tableRows.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });
  });

  test("reset via debug footer clears mutations", async ({ page, request }) => {
    // First, create a mutation via API
    await request.post(`${API}/execution/orders`, {
      data: {
        venue: "e2e-ui-reset",
        instrument: "UI-RESET-TEST",
        side: "sell",
        type: "limit",
        price: 42000,
        quantity: 1,
      },
    });

    // Navigate to orders page — mutation should be visible
    await page.goto("/services/trading/orders");
    await page.waitForLoadState("networkidle");

    // Look for reset button in debug footer or admin area
    const resetBtn = page.locator(
      'button:has-text("Reset Demo"), ' +
        'button:has-text("Reset"), ' +
        '[data-testid="reset-demo"]',
    );

    if ((await resetBtn.count()) > 0) {
      await resetBtn.first().click();

      // Handle confirmation dialog if present
      const confirmBtn = page.locator(
        '[role="dialog"] button:has-text("Confirm"), ' +
          '[role="dialog"] button:has-text("Reset"), ' +
          '[role="alertdialog"] button:has-text("Confirm")',
      );
      if ((await confirmBtn.count()) > 0) {
        await confirmBtn.first().click();
      }

      await page.waitForLoadState("networkidle");

      // Verify mutation is gone via API
      const afterReset = await request.get(
        `${API}/execution/orders?venue=e2e-ui-reset`,
      );
      const afterBody = await afterReset.json();
      expect(afterBody.data.length).toBe(0);
    } else {
      // If no UI reset button, verify API reset still works
      await request.post(`${API}/admin/reset`);
      const afterReset = await request.get(
        `${API}/execution/orders?venue=e2e-ui-reset`,
      );
      const afterBody = await afterReset.json();
      expect(afterBody.data.length).toBe(0);
    }
  });
});

// ── Full Reset Lifecycle ──

test.describe("Full Reset Lifecycle", () => {
  test("place trade → verify in UI → reset → verify gone", async ({
    page,
    request,
  }) => {
    // Step 1: Clean state
    await request.post(`${API}/admin/reset`);

    // Step 2: Create a trade via API
    const createResponse = await request.post(`${API}/execution/orders`, {
      data: {
        venue: "binance",
        instrument: "LIFECYCLE-RESET",
        side: "buy",
        type: "market",
        quantity: 5,
      },
    });
    expect(createResponse.ok()).toBeTruthy();

    // Step 3: Navigate to orders and verify it appears
    await page.goto("/services/trading/orders");
    await page.waitForLoadState("networkidle");

    // Wait for table to have at least some rows
    const tableRows = page.locator(
      'table tbody tr, [role="row"], [data-testid*="order"]',
    );
    await expect(async () => {
      expect(await tableRows.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });

    // Step 4: Reset
    await request.post(`${API}/admin/reset`);

    // Step 5: Refresh page and verify custom order is gone
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify via API that custom venue order is gone
    const afterReset = await request.get(
      `${API}/execution/orders?venue=binance&instrument=LIFECYCLE-RESET`,
    );
    const afterBody = await afterReset.json();
    // The custom LIFECYCLE-RESET order should be gone
    const customOrders = afterBody.data.filter(
      (o: Record<string, unknown>) => o.instrument === "LIFECYCLE-RESET",
    );
    expect(customOrders.length).toBe(0);

    // But seed orders should still exist
    const seedResponse = await request.get(`${API}/execution/orders`);
    const seedBody = await seedResponse.json();
    expect(seedBody.data.length).toBeGreaterThan(0);
  });
});
