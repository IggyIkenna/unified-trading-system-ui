/**
 * Widget Chrome Presets — visual style combinations for widget separation.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  To test: change ACTIVE_PRESET to any letter (A–T).            │
 * │  Phase 2: sub-variants A1, A2, B1, B2 etc. under each group.  │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * See docs/audits/findings/widget-chrome-presets.md for full comparison.
 */

export interface WidgetChromePreset {
  /** Human-readable name */
  name: string;
  /** Short description */
  description: string;
  /** Classes for the widget container div */
  container: string;
  /** Classes for the header row div */
  header: string;
  /** Grid margin [x, y] in pixels between widgets */
  margin: [number, number];
}

export const PRESETS = {
  // ═══════════════════════════════════════════════════════════════════
  // GROUP 1: SHADOW VARIATIONS (border unchanged, test shadow alone)
  // ═══════════════════════════════════════════════════════════════════

  A: {
    name: "A: Baseline",
    description: "Current production. No shadow, faint border, 2px gap.",
    container: "rounded-lg border border-border bg-card",
    header: "border-b border-border bg-card/80",
    margin: [2, 2],
  },
  B: {
    name: "B: Shadow sm",
    description: "Baseline + shadow-sm.",
    container: "rounded-lg border border-border bg-card shadow-sm",
    header: "border-b border-border bg-card/80",
    margin: [2, 2],
  },
  C: {
    name: "C: Shadow md",
    description: "Baseline + shadow-md. Stronger depth.",
    container: "rounded-lg border border-border bg-card shadow-md",
    header: "border-b border-border bg-card/80",
    margin: [2, 2],
  },
  D: {
    name: "D: Shadow lg",
    description: "Baseline + shadow-lg. Heavy lift effect.",
    container: "rounded-lg border border-border bg-card shadow-lg",
    header: "border-b border-border bg-card/80",
    margin: [2, 2],
  },

  // ═══════════════════════════════════════════════════════════════════
  // GROUP 2: BORDER STRENGTH (no shadow, test border contrast alone)
  // ═══════════════════════════════════════════════════════════════════

  E: {
    name: "E: Border muted-fg/15",
    description: "Subtle stronger border using muted-foreground at 15%.",
    container: "rounded-lg border border-muted-foreground/15 bg-card",
    header: "border-b border-muted-foreground/10 bg-card/80",
    margin: [2, 2],
  },
  F: {
    name: "F: Border muted-fg/25",
    description: "Medium stronger border using muted-foreground at 25%.",
    container: "rounded-lg border border-muted-foreground/25 bg-card",
    header: "border-b border-muted-foreground/20 bg-card/80",
    margin: [2, 2],
  },
  G: {
    name: "G: Border muted-fg/35",
    description: "Prominent border. Very clear edges.",
    container: "rounded-lg border border-muted-foreground/35 bg-card",
    header: "border-b border-muted-foreground/25 bg-card/80",
    margin: [2, 2],
  },
  H: {
    name: "H: Double ring",
    description: "Default border + ring-1 outline. Two-layer edge.",
    container: "rounded-lg border border-border ring-1 ring-muted-foreground/10 bg-card",
    header: "border-b border-border bg-card/80",
    margin: [2, 2],
  },

  // ═══════════════════════════════════════════════════════════════════
  // GROUP 3: GAP / SPACING (baseline style, test gap alone)
  // ═══════════════════════════════════════════════════════════════════

  I: {
    name: "I: Gap 4px",
    description: "Baseline border + 4px gap.",
    container: "rounded-lg border border-border bg-card",
    header: "border-b border-border bg-card/80",
    margin: [4, 4],
  },
  J: {
    name: "J: Gap 6px",
    description: "Baseline border + 6px gap. Noticeable whitespace.",
    container: "rounded-lg border border-border bg-card",
    header: "border-b border-border bg-card/80",
    margin: [6, 6],
  },
  K: {
    name: "K: Gap 8px",
    description: "Baseline border + 8px gap. Wide breathing room.",
    container: "rounded-lg border border-border bg-card",
    header: "border-b border-border bg-card/80",
    margin: [8, 8],
  },

  // ═══════════════════════════════════════════════════════════════════
  // GROUP 4: HEADER TINT (test header differentiation alone)
  // ═══════════════════════════════════════════════════════════════════

  L: {
    name: "L: Header muted/30",
    description: "Light header tint. Subtle anchor.",
    container: "rounded-lg border border-border bg-card",
    header: "border-b border-border bg-muted/30",
    margin: [2, 2],
  },
  M: {
    name: "M: Header muted/50",
    description: "Medium header tint. Clear widget start.",
    container: "rounded-lg border border-border bg-card",
    header: "border-b border-border bg-muted/50",
    margin: [2, 2],
  },
  N: {
    name: "N: Header muted/70",
    description: "Strong header tint. Header clearly distinct from body.",
    container: "rounded-lg border border-border bg-card",
    header: "border-b border-border bg-muted/70",
    margin: [2, 2],
  },

  // ═══════════════════════════════════════════════════════════════════
  // GROUP 5: COMBINED — best-of picks from groups 1-4
  // ═══════════════════════════════════════════════════════════════════

  O: {
    name: "O: Shadow + Bold border",
    description: "shadow-sm + muted-fg/20 border. Depth + edges.",
    container: "rounded-lg border border-muted-foreground/20 bg-card shadow-sm",
    header: "border-b border-muted-foreground/15 bg-card/80",
    margin: [2, 2],
  },
  P: {
    name: "P: Shadow + Gap",
    description: "shadow-sm + 6px gap. Depth + whitespace.",
    container: "rounded-lg border border-border bg-card shadow-sm",
    header: "border-b border-border bg-card/80",
    margin: [6, 6],
  },
  Q: {
    name: "Q: Shadow + Tinted header + Gap",
    description: "shadow-sm + muted/40 header + 4px gap. Balanced combo.",
    container: "rounded-lg border border-border bg-card shadow-sm",
    header: "border-b border-border bg-muted/40",
    margin: [4, 4],
  },
  R: {
    name: "R: Bold border + Tinted header + Gap",
    description: "muted-fg/20 border + muted/40 header + 4px gap. No shadow.",
    container: "rounded-lg border border-muted-foreground/30 bg-card",
    header: "border-b border-muted-foreground/65 bg-muted/100",
    margin: [4, 4],
  },
  S: {
    name: "S: Full card (shadow-md)",
    description: "Strong border + shadow-md + tinted header + 4px gap. Max separation.",
    container: "rounded-lg border border-muted-foreground/15 bg-card shadow-md",
    header: "border-b border-muted-foreground/10 bg-muted/30",
    margin: [4, 4],
  },
  T: {
    name: "T: Full card (shadow-lg)",
    description: "Strong border + shadow-lg + tinted header + 6px gap. Heaviest.",
    container: "rounded-lg border border-muted-foreground/20 bg-card shadow-lg",
    header: "border-b border-muted-foreground/15 bg-muted/40",
    margin: [6, 6],
  },
} as const satisfies Record<string, WidgetChromePreset>;

export type PresetKey = keyof typeof PRESETS;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Change this letter to switch presets (A–T). Refresh to see changes.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const ACTIVE_PRESET: PresetKey = "R";

export function getActivePreset(): WidgetChromePreset {
  return PRESETS[ACTIVE_PRESET];
}
