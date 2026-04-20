/**
 * Emits static HTML decks under public/presentations/ from the same slide data
 * modules used by the Next.js investor-relations routes.
 *
 * Run: pnpm exec tsx scripts/generate-ir-presentation-html.ts
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { slides as boardSlides } from "../app/(platform)/investor-relations/board-presentation/components/board-presentation-data";
import { slides as investmentSlides } from "../app/(platform)/investor-relations/investment-presentation/data";
import { slides as planSlides } from "../app/(platform)/investor-relations/plan-presentation/data";
import { slides as platformSlides } from "../app/(platform)/investor-relations/platform-presentation/data";
import { slides as regulatorySlides } from "../app/(platform)/investor-relations/regulatory-presentation/data";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public/presentations");

function buildHtml(opts: { filename: string; title: string; subtitle?: string; slides: unknown[] }): string {
  const payload = JSON.stringify(
    { title: opts.title, subtitle: opts.subtitle ?? "", slides: opts.slides },
    null,
    0,
  );
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtmlAttr(opts.title)}</title>
    <link rel="stylesheet" href="ir-deck.css" />
  </head>
  <body>
    <div class="ir-shell">
      <header class="ir-header">
        <div class="ir-brand">
          <img src="../images/odum-logo.png" alt="Odum Research" width="28" height="28" />
          <div>
            <div class="ir-brand-title">ODUM<span class="dot">.</span></div>
            <div class="ir-badge" style="margin-top: 6px">FCA 975797</div>
            <div id="ir-deck-title" style="font-size: 12px; color: var(--ir-muted); margin-top: 6px"></div>
          </div>
        </div>
        <div class="ir-header-right">
          <span id="ir-counter" class="ir-counter"></span>
        </div>
      </header>
      <main class="ir-main" id="ir-slide-main"></main>
      <footer class="ir-footer">
        <button type="button" class="ir-btn" id="ir-prev">← Previous</button>
        <div class="ir-dots" id="ir-dots"></div>
        <button type="button" class="ir-btn" id="ir-next">Next →</button>
      </footer>
    </div>
    <div id="ir-deck-subtitle" style="display: none"></div>
    <script>
      window.IR_DECK = ${payload};
    </script>
    <script src="ir-deck.js"></script>
  </body>
</html>
`;
}

function escapeHtmlAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

const decks: Array<{ filename: string; title: string; subtitle?: string; slides: unknown[] }> = [
  {
    filename: "board-presentation.html",
    title: "Odum Research — Board Presentation",
    slides: boardSlides,
  },
  {
    filename: "platform-presentation.html",
    title: "Odum Research — Trading Platform as a Service",
    slides: platformSlides,
  },
  {
    filename: "plan-presentation.html",
    title: "Odum Research — Plan & Longevity",
    slides: planSlides,
  },
  {
    filename: "investment-presentation.html",
    title: "Odum Research — Investment Management",
    slides: investmentSlides,
  },
  {
    filename: "regulatory-presentation.html",
    title: "Odum Research — Regulatory Umbrella",
    slides: regulatorySlides,
  },
];

for (const d of decks) {
  const path = join(outDir, d.filename);
  writeFileSync(path, buildHtml(d), "utf8");
  console.log("Wrote", path);
}

console.log("Done. Re-run this script after editing slide data in app/(platform)/investor-relations/.");
