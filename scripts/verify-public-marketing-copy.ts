#!/usr/bin/env npx tsx
/**
 * Verifies public marketing copy stays aligned with
 * `content/public-marketing/sleeve-copy.json` and blocks disallowed substrings
 * on crawled public HTML.
 *
 * Usage: pnpm run verify:public-marketing
 */
import * as fs from "node:fs";
import * as path from "node:path";

const REPO_ROOT = path.resolve(__dirname, "..");
const JSON_PATH = path.join(REPO_ROOT, "content/public-marketing/sleeve-copy.json");
const PUBLIC_DIR = path.join(REPO_ROOT, "public");

type SleeveCopy = {
  readonly galaxy: { readonly sportsNodeSub: string };
  readonly sports: {
    readonly bookmakersLine: string;
    readonly sleeveVenuesList: string;
    readonly domainMatrixVenues: string;
  };
};

function readJson(): SleeveCopy {
  const raw = fs.readFileSync(JSON_PATH, "utf8");
  return JSON.parse(raw) as SleeveCopy;
}

function listHtmlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".html")) continue;
    out.push(path.join(dir, name));
  }
  return out;
}

const FORBIDDEN = /\bPinnacle\b/i;

function main(): void {
  const copy = readJson();
  const htmlFiles = listHtmlFiles(PUBLIC_DIR);
  const violations: string[] = [];

  for (const file of htmlFiles) {
    const text = fs.readFileSync(file, "utf8");
    if (FORBIDDEN.test(text)) {
      violations.push(`${path.relative(REPO_ROOT, file)} contains disallowed bookmaker name`);
    }
  }

  const hp = path.join(PUBLIC_DIR, "homepage.html");
  const st = path.join(PUBLIC_DIR, "strategies.html");
  const wu = path.join(PUBLIC_DIR, "who-we-are.html");
  for (const [label, fpath, needle] of [
    ["homepage galaxy sports sub", hp, copy.galaxy.sportsNodeSub],
    ["strategies sports venues", st, copy.sports.sleeveVenuesList],
    ["strategies domain matrix", st, copy.sports.domainMatrixVenues],
    ["who-we-are sports desc", wu, copy.sports.sleeveVenuesList],
  ] as const) {
    if (!fs.existsSync(fpath)) {
      violations.push(`missing file for check ${label}: ${fpath}`);
      continue;
    }
    const t = fs.readFileSync(fpath, "utf8");
    if (!t.includes(needle)) {
      violations.push(
        `${label}: expected substring not found — sync ${path.relative(REPO_ROOT, fpath)} with sleeve-copy.json`,
      );
    }
  }

  if (violations.length > 0) {
    console.error("[verify-public-marketing-copy] FAILED\n", violations.join("\n"));
    process.exit(1);
  }
  console.log(`[verify-public-marketing-copy] OK (${htmlFiles.length} public HTML files; sleeve-copy.json aligned)`);
}

main();
