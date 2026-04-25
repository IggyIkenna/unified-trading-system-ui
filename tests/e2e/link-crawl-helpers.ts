/**
 * Shared helpers for full-site link crawling (E2E).
 * Collects anchors including open shadow roots (marketing static shadow host).
 */

/** Patterns that indicate a broken page body (Next / React failures). */
export const BAD_BODY_REGEXES: readonly RegExp[] = [
  /Internal Server Error/i,
  /Unhandled Runtime Error/i,
  /Application error: a client-side exception/i,
  /Application error/i,
  /Rendered more hooks than/i,
  /change in the order of Hooks/i,
];

export function shouldSkipEnqueue(pathname: string): boolean {
  if (pathname.startsWith("/_next/")) return true;
  if (/\.(png|jpe?g|gif|svg|ico|webp|woff2?|ttf|eot|css|js|map|mp4|webm|pdf)$/i.test(pathname)) {
    return true;
  }
  return false;
}

/** Stable queue key: pathname + search (no hash). */
export function internalQueueKey(origin: string, href: string): string | null {
  let u: URL;
  try {
    u = new URL(href, origin);
  } catch {
    return null;
  }
  if (u.origin !== origin) return null;
  if (shouldSkipEnqueue(u.pathname)) return null;
  return `${u.pathname}${u.search}`;
}

export function isExternalHttpUrl(href: string, origin: string): boolean {
  try {
    const u = new URL(href, origin);
    if (u.protocol === "mailto:" || u.protocol === "tel:" || u.protocol === "javascript:") return false;
    return u.origin !== origin && (u.protocol === "http:" || u.protocol === "https:");
  } catch {
    return false;
  }
}

export async function collectAllHrefs(page: import("@playwright/test").Page): Promise<string[]> {
  return page.evaluate(() => {
    const hrefs: string[] = [];
    const visit = (root: Document | ShadowRoot) => {
      root.querySelectorAll("a[href]").forEach((a) => {
        hrefs.push((a as HTMLAnchorElement).href);
      });
      root.querySelectorAll("*").forEach((el) => {
        const sr = (el as HTMLElement).shadowRoot;
        if (sr) visit(sr);
      });
    };
    visit(document);
    return hrefs;
  });
}

/**
 * Open header/nav flyouts so links inside popovers appear in the DOM.
 */
export async function expandHeaderFlyouts(page: import("@playwright/test").Page): Promise<void> {
  const named = [/^Spaces$/, /^DART destinations$/, /^Manage destinations$/, /^Reports destinations$/];
  for (const pattern of named) {
    const btn = page.getByRole("button", { name: pattern });
    const n = await btn.count();
    for (let i = 0; i < n; i++) {
      try {
        await btn.nth(i).click({ timeout: 2000 });
        await page.waitForTimeout(60);
      } catch {
        /* menu may be absent on marketing layout */
      }
    }
  }

  for (let round = 0; round < 6; round++) {
    const collapsed = page.locator('header button[aria-expanded="false"], nav button[aria-expanded="false"]');
    const count = await collapsed.count();
    if (count === 0) break;
    let progressed = false;
    for (let i = 0; i < Math.min(count, 24); i++) {
      try {
        await collapsed.nth(i).click({ timeout: 1200 });
        await page.waitForTimeout(50);
        progressed = true;
      } catch {
        /* ignore */
      }
    }
    if (!progressed) break;
  }

  await page.keyboard.press("Escape").catch(() => {});
}

export async function probeExternalUrl(
  request: import("@playwright/test").APIRequestContext,
  url: string,
): Promise<{ ok: boolean; status: number; note?: string }> {
  try {
    const head = await request.head(url, { timeout: 20_000, maxRedirects: 10 });
    const st = head.status();
    if (st >= 200 && st < 400) return { ok: true, status: st };
    if (st === 405 || st === 403 || st === 404) {
      const get = await request.get(url, { timeout: 20_000, maxRedirects: 10 });
      const gst = get.status();
      return { ok: gst < 500, status: gst, note: "fallback-get" };
    }
    return { ok: st < 500, status: st };
  } catch {
    try {
      const get = await request.get(url, { timeout: 20_000, maxRedirects: 10 });
      return { ok: get.status() < 500, status: get.status(), note: "head-threw" };
    } catch (e2) {
      return { ok: false, status: -1, note: e2 instanceof Error ? e2.message : "unknown" };
    }
  }
}
