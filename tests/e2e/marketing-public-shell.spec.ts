import { expect, test } from "@playwright/test";

/** Routes that render `MarketingStaticShadow` (legacy HTML in open shadow root). */
const MARKETING_SHADOW_PATHS = ["/", "/investment-management", "/platform", "/regulatory", "/who-we-are"] as const;

const ALL_PATHS = [...MARKETING_SHADOW_PATHS, "/contact"] as const;

const SHADOW_PATH_SET = new Set<string>(MARKETING_SHADOW_PATHS);

type ShadowAudit =
  | { ok: true; chars: number; badContactSignIn: boolean }
  | { ok: false; reason: string };

test.describe("Public marketing shell", () => {
  test("briefings hub loads under public layout", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/briefings", { waitUntil: "load" });
    await page.locator("header").first().waitFor({ state: "attached", timeout: 60_000 });
    await expect(page.getByRole("heading", { name: /^Briefings$/i })).toBeVisible({ timeout: 15_000 });
  });

  for (const path of ALL_PATHS) {
    test(`header + marketing content on ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path, { waitUntil: "load" });
      await page.locator("header").first().waitFor({ state: "attached", timeout: 60_000 });

      const signIn = page.locator('header a[href="/login"]').first();
      await expect(signIn).toBeAttached();
      await expect(signIn).toHaveAttribute("href", "/login");
      await expect(signIn).toContainText("Sign In");

      if (SHADOW_PATH_SET.has(path)) {
        const host = page.getByTestId("marketing-static-host");
        await expect(host).toBeAttached({ timeout: 30_000 });
        await expect(host).toHaveAttribute("data-marketing-shadow", "ready", { timeout: 30_000 });

        const audit = (await host.evaluate((el): ShadowAudit => {
          const root = (el as HTMLElement).shadowRoot;
          if (!root) return { ok: false, reason: "no_shadow_root" };
          const inner = root.querySelector("[data-testid='marketing-inner']");
          if (!inner) return { ok: false, reason: "no_inner" };
          const html = inner.innerHTML;
          const badContactSignIn = /href=["']\/contact["'][^>]*>\s*Sign In\s*</i.test(html);
          return { ok: true, chars: html.length, badContactSignIn };
        })) as ShadowAudit;

        expect(audit.ok, JSON.stringify(audit)).toBe(true);
        if (audit.ok) {
          expect(audit.badContactSignIn, "shadow must not pair Sign In with /contact").toBe(false);
          expect(audit.chars, "shadow marketing HTML should be substantial").toBeGreaterThan(500);
        }
      } else {
        await expect(page.getByText("Send us a message")).toBeVisible({ timeout: 15_000 });
        await expect(page.locator("form").filter({ has: page.locator("#name") })).toBeAttached();
      }
    });
  }
});
