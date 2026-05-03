/**
 * Regression: Submit allocator intake button silently failed because the
 * shared validate() required builder-only fields (commercialPath +
 * understandFit/Incubation/Signals) the allocator wizard never renders.
 * This test fills the allocator wizard end-to-end and asserts the submit
 * actually dispatches the network request and lands on the success state.
 */

import { test, expect } from "@playwright/test";

test.describe("Strategy Evaluation — allocator wizard", () => {
  test("Submit allocator intake POSTs and shows success state", async ({ page }) => {
    const submitRequest = page.waitForRequest(
      (req) => req.url().endsWith("/api/strategy-evaluation/submit") && req.method() === "POST",
    );

    await page.goto("/strategy-evaluation?path=allocator");

    // Close the site-header Sheet drawer if it auto-opened, and dismiss the
    // cookie banner (both can intercept pointer events on the wizard).
    const sheetOverlay = page.locator('[data-slot="sheet-overlay"]');
    if (await sheetOverlay.isVisible().catch(() => false)) {
      await page.keyboard.press("Escape");
      await sheetOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => undefined);
    }
    const cookieDialog = page.getByRole("dialog", { name: /Cookie/i });
    if (await cookieDialog.isVisible().catch(() => false)) {
      await cookieDialog.getByRole("button", { name: /^Accept$/ }).click({ force: true });
    }

    // Step 1 — About you. The wizard's <FieldLabel> doesn't carry htmlFor, so
    // getByLabel doesn't resolve; pin to placeholder + neighbour selectors.
    await page.getByPlaceholder(/Pension allocation, Family office mandate/i).fill("Family-office mandate (e2e)");
    await page.locator('label:has-text("Your name") + input').fill("E2E Allocator");
    await page.locator('label:has-text("Email") + input').fill(`e2e-allocator+${Date.now()}@example.com`);
    await page.getByRole("button", { name: /^Next$/ }).click();
    await expect(page.getByRole("heading", { name: /Investor profile \+ appetite/i })).toBeVisible();

    // Step 2 — Investor profile
    await page.locator('label:has-text("Investor type") + input').fill("Family office");
    await page.getByRole("button", { name: /^Next$/ }).click();
    await expect(page.getByRole("heading", { name: /Constraints \+ exclusions|Constraints/i })).toBeVisible();

    // Step 3 — all-optional, advance to step 4.
    await page.getByRole("button", { name: /^Next$/ }).click();
    await expect(page.getByRole("heading", { name: /Capital \+ structure/i })).toBeVisible();

    const submit = page.getByRole("button", { name: /Submit allocator intake/i });
    await submit.click();

    const req = await submitRequest;
    const body = JSON.parse(req.postData() ?? "{}") as Record<string, unknown>;
    expect(body.engagementIntent).toBe("allocator");
    expect(body.allocatorInvestorType).toBe("Family office");

    // The parent _client.tsx renders the "Check your inbox" success page
    // before the allocator wizard's own "Submission received" state, so the
    // post-submit assertion targets the parent's copy.
    await expect(page.getByText(/Check your inbox/i)).toBeVisible({ timeout: 15000 });
  });
});
