import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";

import { STRATEGY_MATURITY_PHASE, STRATEGY_MATURITY_PUBLIC_BULLETS } from "@/lib/marketing/strategy-maturity";
import sleeveCopy from "../../content/public-marketing/sleeve-copy.json";

const REPO = path.resolve(__dirname, "../..");
const FORBIDDEN = /\bPinnacle\b/i;

describe("public marketing sleeve-copy.json", () => {
  it("exposes sports venue lines without blocked bookmaker names", () => {
    const json = JSON.stringify(sleeveCopy);
    expect(FORBIDDEN.test(json)).toBe(false);
    expect(sleeveCopy.sports.sleeveVenuesList).toContain("Smarkets");
  });

  it("has galaxy sports sub for Next marketing galaxies", () => {
    expect(sleeveCopy.galaxy.sportsNodeSub).toContain("Betfair");
    expect(sleeveCopy.galaxy.sportsNodeSub).toContain("Smarkets");
  });
});

describe("marketing galaxy components (public-facing)", () => {
  it("does not name Pinnacle in sports node copy", () => {
    for (const rel of [
      "components/marketing/galaxy-canvas.tsx",
      "components/marketing/market-galaxy.tsx",
      "components/marketing/arbitrage-galaxy.tsx",
    ]) {
      const text = fs.readFileSync(path.join(REPO, rel), "utf8");
      expect(FORBIDDEN.test(text), rel).toBe(false);
      expect(text).toContain("Betfair");
    }
  });
});

describe("public/*.html", () => {
  const publicDir = path.join(REPO, "public");
  const files = fs
    .readdirSync(publicDir)
    .filter((f) => f.endsWith(".html"))
    .map((f) => path.join(publicDir, f));

  it("does not name Pinnacle on marketing HTML", () => {
    for (const file of files) {
      const text = fs.readFileSync(file, "utf8");
      expect({ file: path.basename(file), hasPinnacle: FORBIDDEN.test(text) }).toEqual({
        file: path.basename(file),
        hasPinnacle: false,
      });
    }
  });
});

describe("strategy maturity public bullets", () => {
  it("stays in lockstep with STRATEGY_MATURITY_PHASE ids (codex strategy-lifecycle-maturity.md §1; retired is terminal)", () => {
    const forward = new Set((Object.values(STRATEGY_MATURITY_PHASE) as string[]).filter((p) => p !== "retired"));
    const bulletPhases = STRATEGY_MATURITY_PUBLIC_BULLETS.map((b) => b.phase);
    expect(bulletPhases).toContain("retired");
    for (const p of forward) {
      expect(bulletPhases).toContain(p);
    }
    expect(bulletPhases.length).toBe(10);
  });
});
