import { Term } from "@/components/marketing/term";
import { ARCHETYPE_COVERAGE } from "@/lib/architecture-v2/coverage";
import type {
  ArchetypeCoverage,
  CoverageCell,
  CoverageStatus,
} from "@/lib/architecture-v2/coverage";
import type { StrategyArchetype, VenueCategoryV2 } from "@/lib/architecture-v2/enums";

/**
 * Strategy-family × category coverage matrix for the briefings surface.
 *
 * Renders the full archetype × category map so a prospect reading a briefing
 * can see the breadth of what Odum actually runs across asset classes. Pulls
 * from `ARCHETYPE_COVERAGE` (SSOT — auto-generated from UAC manifest). No
 * venue names, no slot labels, no pricing — the matrix conveys shape only.
 *
 * Rule 06: pre-BACKTESTED slots are not visible externally; this matrix
 * shows coverage status only, not maturity. Rule 08: no pricing.
 *
 * Codex: unified-trading-pm/codex/09-strategy/architecture-v2/category-instrument-coverage.md
 */

const CATEGORIES: readonly VenueCategoryV2[] = [
  "CEFI",
  "DEFI",
  "TRADFI",
  "SPORTS",
  "PREDICTION",
];

const CATEGORY_GLOSSARY_ID: Readonly<Record<VenueCategoryV2, string | null>> = {
  CEFI: "cefi",
  DEFI: "defi",
  TRADFI: "tradfi",
  SPORTS: null,
  PREDICTION: null,
};

const CATEGORY_LABELS: Readonly<Record<VenueCategoryV2, string>> = {
  CEFI: "CeFi",
  DEFI: "DeFi",
  TRADFI: "TradFi",
  SPORTS: "Sports",
  PREDICTION: "Prediction",
};

const ARCHETYPE_LABELS: Readonly<Record<StrategyArchetype, string>> = {
  ML_DIRECTIONAL_CONTINUOUS: "ML directional (continuous)",
  ML_DIRECTIONAL_EVENT_SETTLED: "ML directional (event-settled)",
  RULES_DIRECTIONAL_CONTINUOUS: "Rules-based directional",
  RULES_DIRECTIONAL_EVENT_SETTLED: "Rules-based event-driven",
  CARRY_BASIS_DATED: "Basis carry (dated futures)",
  CARRY_BASIS_PERP: "Funding carry (perps)",
  CARRY_STAKED_BASIS: "Staked basis (3-leg atomic)",
  CARRY_RECURSIVE_STAKED: "Recursive staking",
  YIELD_ROTATION_LENDING: "Yield rotation (lending)",
  YIELD_STAKING_SIMPLE: "Staking",
  ARBITRAGE_PRICE_DISPERSION: "Cross-venue arbitrage",
  LIQUIDATION_CAPTURE: "Liquidation capture",
  MARKET_MAKING_CONTINUOUS: "Market making (continuous)",
  MARKET_MAKING_EVENT_SETTLED: "Market making (event-settled)",
  EVENT_DRIVEN: "Event-driven",
  VOL_TRADING_OPTIONS: "Volatility trading",
  STAT_ARB_PAIRS_FIXED: "Pairs stat-arb",
  STAT_ARB_CROSS_SECTIONAL: "Cross-sectional stat-arb",
};

function bestStatusForCell(
  archetype: StrategyArchetype,
  category: VenueCategoryV2,
): CoverageStatus | null {
  const coverage: ArchetypeCoverage = ARCHETYPE_COVERAGE[archetype];
  const matching = coverage.cells.filter((c: CoverageCell) => c.category === category);
  if (matching.length === 0) return null;
  if (matching.some((c) => c.status === "SUPPORTED")) return "SUPPORTED";
  if (matching.some((c) => c.status === "PARTIAL")) return "PARTIAL";
  if (matching.some((c) => c.status === "BLOCKED")) return "BLOCKED";
  return "NOT_APPLICABLE";
}

function statusGlyph(status: CoverageStatus | null): {
  symbol: string;
  className: string;
  title: string;
} {
  if (status === "SUPPORTED") {
    return {
      symbol: "●",
      className: "text-emerald-500",
      title: "Supported — strategies run live in this cell.",
    };
  }
  if (status === "PARTIAL") {
    return {
      symbol: "◐",
      className: "text-amber-500",
      title: "Partial — adapter or config gap; not every instrument in this cell is live.",
    };
  }
  if (status === "BLOCKED") {
    return {
      symbol: "—",
      className: "text-muted-foreground/40",
      title: "Blocked — a structural reason prevents this cell (named in the codex).",
    };
  }
  return {
    symbol: "·",
    className: "text-muted-foreground/20",
    title: "Not applicable in this category.",
  };
}

export interface StrategyCoverageMatrixProps {
  /**
   * Optional filter on which archetypes to show. Default: all 18 archetypes.
   * Pass an explicit list when tailoring to a briefing (e.g. IM surface may
   * hide low-frequency market-making rows).
   */
  readonly archetypes?: readonly StrategyArchetype[];
}

export function StrategyCoverageMatrix({ archetypes }: StrategyCoverageMatrixProps = {}) {
  const rows: readonly StrategyArchetype[] =
    archetypes && archetypes.length > 0
      ? archetypes
      : (Object.keys(ARCHETYPE_COVERAGE) as StrategyArchetype[]);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Strategy family
              </th>
              {CATEGORIES.map((c) => {
                const glossaryId = CATEGORY_GLOSSARY_ID[c];
                return (
                  <th
                    key={c}
                    className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {glossaryId ? (
                      <Term id={glossaryId}>{CATEGORY_LABELS[c]}</Term>
                    ) : (
                      CATEGORY_LABELS[c]
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((archetype) => (
              <tr key={archetype} className="border-b border-border/40 last:border-b-0">
                <td className="px-3 py-2 text-foreground/85">
                  {ARCHETYPE_LABELS[archetype]}
                </td>
                {CATEGORIES.map((category) => {
                  const status = bestStatusForCell(archetype, category);
                  const glyph = statusGlyph(status);
                  return (
                    <td
                      key={category}
                      className="px-3 py-2 text-center"
                      title={glyph.title}
                    >
                      <span className={`font-mono ${glyph.className}`}>{glyph.symbol}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>
          <span className="font-mono text-emerald-500">●</span> Supported
        </span>
        <span>
          <span className="font-mono text-amber-500">◐</span> Partial
        </span>
        <span>
          <span className="font-mono text-muted-foreground/40">—</span> Blocked (by design or venue)
        </span>
        <span>
          <span className="font-mono text-muted-foreground/20">·</span> Not applicable
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Hover the column headers for what each category covers.
      </p>
    </div>
  );
}
