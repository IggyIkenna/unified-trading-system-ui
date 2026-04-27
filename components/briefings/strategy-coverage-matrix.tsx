import { Term } from "@/components/marketing/term";
import { ARCHETYPE_COVERAGE } from "@/lib/architecture-v2/coverage";
import { cn } from "@/lib/utils";
import type { ArchetypeCoverage, CoverageCell, CoverageStatus } from "@/lib/architecture-v2/coverage";
import type { StrategyArchetype, VenueAssetGroupV2 } from "@/lib/architecture-v2/enums";

/**
 * Strategy-family × asset group coverage matrix for the briefings surface.
 *
 * Renders the full archetype × asset group map so a prospect reading a briefing
 * can see the breadth of what Odum actually runs across asset classes. Pulls
 * from `ARCHETYPE_COVERAGE` (SSOT — auto-generated from UAC manifest). No
 * venue names, no slot labels, no pricing — the matrix conveys shape only.
 *
 * Rule 06: pre-BACKTESTED slots are not visible externally; this matrix
 * shows coverage status only, not maturity. Rule 08: no pricing.
 *
 * Codex: unified-trading-pm/codex/09-strategy/architecture-v2/category-instrument-coverage.md
 */

const ASSET_GROUPS: readonly VenueAssetGroupV2[] = ["CEFI", "DEFI", "TRADFI", "SPORTS", "PREDICTION"];

const ASSET_GROUP_GLOSSARY_ID: Readonly<Record<VenueAssetGroupV2, string | null>> = {
  CEFI: "cefi",
  DEFI: "defi",
  TRADFI: "tradfi",
  SPORTS: null,
  PREDICTION: null,
};

const ASSET_GROUP_LABELS: Readonly<Record<VenueAssetGroupV2, string>> = {
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

function bestStatusForCell(archetype: StrategyArchetype, assetGroup: VenueAssetGroupV2): CoverageStatus | null {
  const coverage: ArchetypeCoverage = ARCHETYPE_COVERAGE[archetype];
  const matching = coverage.cells.filter((c: CoverageCell) => c.assetGroup === assetGroup);
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
      title: "Supported: strategies run live in this cell.",
    };
  }
  if (status === "PARTIAL") {
    return {
      symbol: "◐",
      className: "text-amber-500",
      title: "Partial: adapter or config gap; not every instrument in this cell is live.",
    };
  }
  if (status === "BLOCKED") {
    return {
      symbol: "-",
      className: "text-muted-foreground/40",
      title: "Blocked: a structural reason prevents this cell (named in the codex).",
    };
  }
  return {
    symbol: "·",
    className: "text-muted-foreground/20",
    title: "Not applicable in this asset group.",
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
    archetypes && archetypes.length > 0 ? archetypes : (Object.keys(ARCHETYPE_COVERAGE) as StrategyArchetype[]);

  const stickyCornerTh =
    "sticky left-0 top-0 z-30 border-b border-r border-border/60 bg-card px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)] dark:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.35)]";
  const stickyTopTh =
    "sticky top-0 z-20 border-b border-border/60 bg-card px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground";
  const stickyFirstTd =
    "sticky left-0 z-10 border-b border-r border-border/40 bg-background px-3 py-2 text-left text-foreground/85 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.3)]";

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "max-h-[min(72vh,36rem)] overflow-auto overscroll-contain rounded-md border border-border/60 md:max-h-[min(80vh,44rem)]",
          "[scrollbar-width:thin] [-webkit-overflow-scrolling:touch]",
        )}
      >
        <table className="min-w-max w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th
                className={cn(stickyCornerTh, "min-w-[10.5rem] max-w-[min(42vw,14rem)] sm:max-w-none sm:min-w-[12rem]")}
              >
                Strategy family
              </th>
              {ASSET_GROUPS.map((c) => {
                const glossaryId = ASSET_GROUP_GLOSSARY_ID[c];
                return (
                  <th key={c} className={cn(stickyTopTh, "whitespace-nowrap")}>
                    {glossaryId ? <Term id={glossaryId}>{ASSET_GROUP_LABELS[c]}</Term> : ASSET_GROUP_LABELS[c]}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((archetype, rowIdx) => {
              const isLastRow = rowIdx === rows.length - 1;
              const rowBorder = !isLastRow ? "border-b border-border/40" : "";
              return (
                <tr key={archetype}>
                  <td
                    className={cn(
                      stickyFirstTd,
                      "min-w-[10.5rem] max-w-[min(42vw,14rem)] sm:max-w-none sm:min-w-[12rem]",
                      isLastRow && "!border-b-0",
                    )}
                  >
                    {ARCHETYPE_LABELS[archetype]}
                  </td>
                  {ASSET_GROUPS.map((assetGroup) => {
                    const status = bestStatusForCell(archetype, assetGroup);
                    const glyph = statusGlyph(status);
                    return (
                      <td key={assetGroup} className={cn("px-3 py-2 text-center", rowBorder)} title={glyph.title}>
                        <span className={`font-mono ${glyph.className}`}>{glyph.symbol}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
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
          <span className="font-mono text-muted-foreground/40">-</span> Blocked (by design or venue)
        </span>
        <span>
          <span className="font-mono text-muted-foreground/20">·</span> Not applicable
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Hover the column headers for what each asset group covers.
      </p>
    </div>
  );
}
