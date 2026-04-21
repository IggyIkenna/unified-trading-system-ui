import { LockStateBadge } from "@/components/architecture-v2";
import { Badge } from "@/components/ui/badge";
import { ARCHETYPE_COVERAGE } from "@/lib/architecture-v2/coverage";
import type {
  ArchetypeCoverage,
  CoverageCell,
  CoverageStatus,
  InstrumentTypeV2,
} from "@/lib/architecture-v2/coverage";
import type {
  LockState,
  StrategyArchetype,
  StrategyFamily,
  VenueCategoryV2,
} from "@/lib/architecture-v2";
import { listFamiliesOrdered } from "@/lib/architecture-v2/families";

/**
 * Strategy-family × archetype × (category × instrument-type) catalogue.
 *
 * Source: codex/09-strategy/architecture-v2/category-instrument-coverage.md
 * Coverage SSOT: lib/architecture-v2/coverage.ts (auto-generated from UAC
 * archetype_capability_manifest.json). Lock state is derived per the
 * path-to-$100M lock matrix: only STAT_ARB_PAIRS_FIXED × CEFI × (spot|perp)
 * is PUBLIC; every other SUPPORTED/PARTIAL cell is INVESTMENT_MANAGEMENT_RESERVED
 * by default. BLOCKED cells route to the block-list; cells with no coverage
 * entry at all render as NEEDS_BUILD.
 *
 * Renders inside the `/briefings/dart-full` pillar, already gated by
 * BriefingAccessGate at the briefings layout level.
 */

type CellLockState = LockState | "NEEDS_BUILD";

const CATEGORIES: readonly VenueCategoryV2[] = [
  "CEFI",
  "DEFI",
  "TRADFI",
  "SPORTS",
  "PREDICTION",
] as const;

const CATEGORY_LABELS: Readonly<Record<VenueCategoryV2, string>> = {
  CEFI: "Crypto",
  DEFI: "DeFi",
  TRADFI: "Traditional",
  SPORTS: "Sports",
  PREDICTION: "Prediction",
};

const INSTRUMENT_TYPES: readonly InstrumentTypeV2[] = [
  "spot",
  "perp",
  "dated_future",
  "option",
  "lending",
  "staking",
  "lp",
  "event_settled",
] as const;

const INSTRUMENT_TYPE_LABELS: Readonly<Record<InstrumentTypeV2, string>> = {
  spot: "Spot",
  perp: "Perp",
  dated_future: "Dated future",
  option: "Option",
  lending: "Lending",
  staking: "Staking",
  lp: "LP",
  event_settled: "Event-settled",
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

/**
 * Path-to-$100M lock matrix (codex-private pricing notebook): the only cells
 * carved out as PUBLIC are STAT_ARB_PAIRS_FIXED × CEFI × spot|perp — mean-
 * reversion commodity access. Everything else on a SUPPORTED/PARTIAL coverage
 * cell defaults to INVESTMENT_MANAGEMENT_RESERVED.
 */
function deriveLockState(cell: CoverageCell | null, status: CoverageStatus | "NONE"): CellLockState {
  if (status === "NONE") return "NEEDS_BUILD";
  if (status === "BLOCKED") return "RETIRED"; // re-used for visual: blocked cells render a distinct chip below
  if (!cell) return "NEEDS_BUILD";
  const publicTriple =
    cell.archetype === "STAT_ARB_PAIRS_FIXED" &&
    cell.category === "CEFI" &&
    (cell.instrumentType === "spot" || cell.instrumentType === "perp");
  if (publicTriple && (status === "SUPPORTED" || status === "PARTIAL")) return "PUBLIC";
  return "INVESTMENT_MANAGEMENT_RESERVED";
}

function getCell(
  archetype: StrategyArchetype,
  category: VenueCategoryV2,
  instrumentType: InstrumentTypeV2,
): CoverageCell | null {
  const coverage: ArchetypeCoverage = ARCHETYPE_COVERAGE[archetype];
  return (
    coverage.cells.find(
      (c) => c.category === category && c.instrumentType === instrumentType,
    ) ?? null
  );
}

function cellStatus(cell: CoverageCell | null): CoverageStatus | "NONE" {
  if (!cell) return "NONE";
  return cell.status;
}

function cellGlyph(status: CoverageStatus | "NONE"): {
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
      title: "Partial — adapter or config gap; not every instrument live.",
    };
  }
  if (status === "BLOCKED") {
    return {
      symbol: "×",
      className: "text-rose-500",
      title: "Blocked — a structural reason prevents this cell (named in the codex block-list).",
    };
  }
  return {
    symbol: "·",
    className: "text-muted-foreground/30",
    title: "Not built yet.",
  };
}

interface CellChipProps {
  cell: CoverageCell | null;
  status: CoverageStatus | "NONE";
}

function CellChip({ cell, status }: CellChipProps) {
  const glyph = cellGlyph(status);
  const lock = deriveLockState(cell, status);
  const href = cell && cell.representativeSlotLabels.length > 0
    ? `/services/strategy-catalogue/strategies/${cell.archetype}/${encodeURIComponent(cell.representativeSlotLabels[0])}`
    : null;

  const inner = (
    <span
      className="inline-flex items-center gap-1"
      title={glyph.title}
    >
      <span className={`font-mono ${glyph.className}`} aria-hidden>
        {glyph.symbol}
      </span>
      {status === "BLOCKED" && (
        <Badge
          variant="outline"
          className="border-transparent bg-rose-500/15 text-rose-600 dark:text-rose-400 px-1.5 py-0 text-[10px]"
        >
          Blocked
        </Badge>
      )}
      {status === "NONE" && (
        <Badge
          variant="outline"
          className="border-transparent bg-muted text-muted-foreground px-1.5 py-0 text-[10px]"
        >
          Needs build
        </Badge>
      )}
      {lock === "PUBLIC" && (
        <LockStateBadge state="PUBLIC" className="px-1.5 py-0 text-[10px]" />
      )}
      {lock === "INVESTMENT_MANAGEMENT_RESERVED" && (
        <LockStateBadge
          state="INVESTMENT_MANAGEMENT_RESERVED"
          className="px-1.5 py-0 text-[10px]"
        />
      )}
    </span>
  );

  if (href) {
    return (
      <a
        href={href}
        className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-sm"
      >
        {inner}
      </a>
    );
  }
  return inner;
}

interface ArchetypeRowProps {
  archetype: StrategyArchetype;
}

function ArchetypeRow({ archetype }: ArchetypeRowProps) {
  return (
    <tr className="border-b border-border/40 last:border-b-0">
      <th
        scope="row"
        className="sticky left-0 z-10 bg-background px-3 py-2 text-left text-sm font-medium text-foreground/90"
      >
        {ARCHETYPE_LABELS[archetype]}
      </th>
      {CATEGORIES.flatMap((category) =>
        INSTRUMENT_TYPES.map((instrumentType) => {
          const cell = getCell(archetype, category, instrumentType);
          const status = cellStatus(cell);
          return (
            <td
              key={`${category}-${instrumentType}`}
              className="px-2 py-2 text-center align-middle"
            >
              <CellChip cell={cell} status={status} />
            </td>
          );
        }),
      )}
    </tr>
  );
}

interface FamilyGroupProps {
  family: StrategyFamily;
  label: string;
  archetypes: readonly StrategyArchetype[];
  accentClass: string;
}

function FamilyGroup({ family, label, archetypes, accentClass }: FamilyGroupProps) {
  return (
    <tbody data-family={family}>
      <tr>
        <th
          scope="rowgroup"
          colSpan={CATEGORIES.length * INSTRUMENT_TYPES.length + 1}
          className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide ${accentClass}`}
        >
          {label}
        </th>
      </tr>
      {archetypes.map((archetype) => (
        <ArchetypeRow key={archetype} archetype={archetype} />
      ))}
    </tbody>
  );
}

/**
 * Static catalogue matrix — 18 archetypes × 5 categories × 8 instrument types.
 *
 * Mounted inside `/briefings/dart-full`; gating comes from the
 * `BriefingAccessGate` wrapping the briefings layout.
 */
export function StrategyFamilyCatalogue() {
  // Three-band family grouping (codex architecture-v2 narrative):
  //   Directional  : ML_DIRECTIONAL, RULES_DIRECTIONAL
  //   Relative-Value: CARRY_AND_YIELD, ARBITRAGE_STRUCTURAL, STAT_ARB_PAIRS, MARKET_MAKING
  //   Event-Driven : EVENT_DRIVEN, VOL_TRADING
  const families = listFamiliesOrdered();
  const byFamily: Record<string, typeof families[number]> = {};
  for (const f of families) byFamily[f.family] = f;

  const BANDS: readonly {
    label: string;
    families: readonly StrategyFamily[];
  }[] = [
    { label: "Directional", families: ["ML_DIRECTIONAL", "RULES_DIRECTIONAL"] },
    {
      label: "Relative-Value",
      families: [
        "CARRY_AND_YIELD",
        "ARBITRAGE_STRUCTURAL",
        "STAT_ARB_PAIRS",
        "MARKET_MAKING",
      ],
    },
    { label: "Event-Driven", families: ["EVENT_DRIVEN", "VOL_TRADING"] },
  ];

  return (
    <div
      data-testid="strategy-family-catalogue"
      className="space-y-4"
      role="region"
      aria-label="Strategy family and archetype catalogue"
    >
      <div className="overflow-x-auto rounded-md border border-border/60">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Strategy archetype × category × instrument-type coverage matrix,
            grouped by strategy family band. Each cell shows coverage status
            and lock state.
          </caption>
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th
                scope="col"
                rowSpan={2}
                className="sticky left-0 z-20 bg-muted/30 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Archetype
              </th>
              {CATEGORIES.map((category) => (
                <th
                  key={category}
                  scope="colgroup"
                  colSpan={INSTRUMENT_TYPES.length}
                  className="border-l border-border/40 px-2 py-1 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {CATEGORY_LABELS[category]}
                </th>
              ))}
            </tr>
            <tr className="border-b border-border/40 bg-muted/20">
              {CATEGORIES.flatMap((category) =>
                INSTRUMENT_TYPES.map((instrumentType) => (
                  <th
                    key={`${category}-${instrumentType}`}
                    scope="col"
                    className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80"
                  >
                    {INSTRUMENT_TYPE_LABELS[instrumentType]}
                  </th>
                )),
              )}
            </tr>
          </thead>
          {BANDS.flatMap((band) =>
            band.families
              .map((familyKey) => {
                const meta = byFamily[familyKey];
                if (!meta) return null;
                return (
                  <FamilyGroup
                    key={familyKey}
                    family={familyKey}
                    label={`${band.label} — ${meta.label}`}
                    archetypes={meta.archetypes}
                    accentClass={meta.accentClass}
                  />
                );
              })
              .filter((x): x is React.JSX.Element => x !== null),
          )}
        </table>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="font-mono text-emerald-500">●</span> Supported
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="font-mono text-amber-500">◐</span> Partial
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="font-mono text-rose-500">×</span> Blocked (see codex block-list)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="font-mono text-muted-foreground/30">·</span> Needs build
        </span>
        <span className="inline-flex items-center gap-1.5">
          <LockStateBadge state="PUBLIC" className="px-1.5 py-0 text-[10px]" /> Public slot
        </span>
        <span className="inline-flex items-center gap-1.5">
          <LockStateBadge
            state="INVESTMENT_MANAGEMENT_RESERVED"
            className="px-1.5 py-0 text-[10px]"
          />{" "}
          IM-reserved by default
        </span>
      </div>

      <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
        Rows link to the per-strategy detail page in the platform catalogue for
        allocators and admins with access; prospects without a platform seat
        see the row but cannot deep-link. Lock state is the default posture —
        client-exclusive carve-outs are negotiated per mandate and surfaced on
        the per-strategy page, not here.
      </p>
    </div>
  );
}
