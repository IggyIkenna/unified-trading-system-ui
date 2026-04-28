/**
 * Playwright E2E: DART tile split — verifies the two-tile dashboard renders
 * correctly per persona per the codex SSOT.
 *
 * Personas covered:
 *   - admin            → both DART tiles visible
 *   - internal-trader  → both DART tiles visible
 *   - client-full      → both DART tiles visible (has strategy-full + ml-full)
 *   - client-data-only → DART Terminal visible, DART Research hidden (no DART access)
 *   - prospect-dart    → both DART tiles visible (has strategy-full + ml-full)
 *   - prospect-regulatory → both DART tiles hidden (reg-only persona)
 *
 * SSOT: unified-trading-pm/codex/14-playbooks/dart/dart-terminal-vs-research.md
 */

import { expect, test } from "@playwright/test";
import { clearPersona, seedPersona } from "./seed-persona";

interface ExpectedShape {
  readonly tile: "visible" | "locked" | "hidden";
}

interface PersonaCase {
  readonly persona:
    | "admin"
    | "internal-trader"
    | "client-full"
    | "client-data-only"
    | "prospect-dart"
    | "prospect-regulatory";
  readonly terminal: ExpectedShape["tile"];
  readonly research: ExpectedShape["tile"];
  readonly description: string;
}

const PERSONA_MATRIX: readonly PersonaCase[] = [
  { persona: "admin", terminal: "visible", research: "visible", description: "Admin (wildcard) — both tiles visible" },
  {
    persona: "internal-trader",
    terminal: "visible",
    research: "visible",
    description: "Internal trader — both tiles visible",
  },
  {
    persona: "client-full",
    terminal: "visible",
    research: "visible",
    description: "DART Full client — both tiles visible (has strategy-full + ml-full)",
  },
  {
    persona: "client-data-only",
    terminal: "visible",
    research: "hidden",
    description: "Data-only client — Terminal visible, Research hidden",
  },
  {
    persona: "prospect-dart",
    terminal: "visible",
    research: "visible",
    description: "Prospect DART (sarah.quant) — both tiles visible",
  },
  {
    persona: "prospect-regulatory",
    terminal: "hidden",
    research: "hidden",
    description: "Prospect regulatory — both tiles hidden (reg-only)",
  },
];

test.describe("DART tile split — persona × tile matrix", () => {
  test.beforeEach(async ({ page }) => {
    await clearPersona(page);
  });

  for (const matrix of PERSONA_MATRIX) {
    test(matrix.description, async ({ page }) => {
      await seedPersona(page, matrix.persona);
      await page.goto("/dashboard");
      // The dashboard tile renderer reads `tile.key as DashboardTileId` and
      // attaches `data-tile-id` attributes. Match by key — the new tile keys
      // are dart-terminal + dart-research per services.ts SERVICE_REGISTRY.
      const terminalTile = page.locator('[data-tile-id="dart-terminal"]');
      const researchTile = page.locator('[data-tile-id="dart-research"]');

      // The dashboard renderer drops "hidden" tiles entirely (filtered out
      // before rendering) — so for a hidden expectation we assert the tile
      // is not present in the DOM. For visible/locked, the tile is present
      // and its lock affordance differs.
      if (matrix.terminal === "hidden") {
        await expect(terminalTile).toHaveCount(0);
      } else {
        await expect(terminalTile).toBeVisible();
      }

      if (matrix.research === "hidden") {
        await expect(researchTile).toHaveCount(0);
      } else {
        await expect(researchTile).toBeVisible();
        if (matrix.research === "locked") {
          // Padlocked-visible: tile renders with a lock affordance + upgrade
          // CTA. The exact selector depends on ServiceTile primitive — match
          // the lock icon by accessible attribute.
          await expect(researchTile.getByRole("img", { name: /lock|locked/i })).toBeVisible();
        }
      }
    });
  }
});
