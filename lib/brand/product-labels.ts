/**
 * Canonical public-facing product labels. Single source of truth for how
 * each commercial path and product is spelled across nav, briefings, docs,
 * and marketing HTML. Import from here — don't inline the strings.
 *
 * Codex SSOT for the underlying product taxonomy:
 * unified-trading-pm/codex/14-playbooks/glossary.md
 */

export const PRODUCT_LABELS = {
  /** FCA-regulated investment management — SMA or pooled-fund allocation. */
  investmentManagement: "Investment Management",

  /** The operating platform as a whole. Short brand form. */
  dart: "DART",

  /** Long form of DART when spelling out the acronym. */
  dartLong: "Data Analytics, Research & Trading",

  /** DART path — client signals in, Odum execution + reporting. */
  dartSignalsIn: "DART Signals-In",

  /** DART path — full research → execute → reconcile → report pipeline. */
  dartFull: "DART Full Pipeline",

  /** Odum-generated signals delivered out to counterparty execution stacks. */
  odumSignals: "Odum Signals",

  /** FCA umbrella — operate regulated activity under Odum's permissions. */
  regulatoryUmbrella: "Regulatory Umbrella",
} as const;

export type ProductLabel = (typeof PRODUCT_LABELS)[keyof typeof PRODUCT_LABELS];
