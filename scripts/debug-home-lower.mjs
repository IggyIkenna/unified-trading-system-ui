import { chromium } from "playwright";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await ctx.addInitScript(() => {
  try {
    window.localStorage.setItem("odum-cookie-consent", "accepted");
    window.localStorage.setItem("odum.nav.dismissed", "1");
  } catch {}
});
await page.goto((process.env.BASE_URL ?? "http://localhost:3000") + "/", { waitUntil: "load" });
await page.waitForTimeout(2500);

const targets = [
  { id: "engagement-routes-heading", name: "engagement-routes" },
  { id: "why-odum-heading", name: "why-odum" },
  { id: "engagement-journey-heading", name: "engagement-journey" },
  { id: "governance-heading", name: "governance" },
  { id: "final-cta-heading", name: "final-cta" },
];

for (const t of targets) {
  const sec = page.locator(`[aria-labelledby="${t.id}"]`);
  await sec.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const box = await sec.boundingBox();
  if (!box) {
    console.log(`SKIP ${t.name} — no bbox`);
    continue;
  }
  const out = `/tmp/home-${t.name}.png`;
  await page.screenshot({
    path: out,
    clip: { x: 0, y: Math.max(0, box.y), width: 1440, height: Math.min(1100, box.height) },
  });
  console.log(`saved ${out}  (h=${Math.round(box.height)})`);
}

await browser.close();
