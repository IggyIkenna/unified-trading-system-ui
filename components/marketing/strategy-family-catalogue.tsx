import type { ReactElement } from "react";

import { LockStateBadge } from "@/components/architecture-v2";
import { ARCHETYPE_COVERAGE } from "@/lib/architecture-v2/coverage";
import type { ArchetypeCoverage, CoverageCell, CoverageStatus, InstrumentTypeV2 } from "@/lib/architecture-v2/coverage";
import type { LockState, StrategyArchetype, StrategyFamily, VenueCategoryV2 } from "@/lib/architecture-v2";
import { listFamiliesOrdered, type FamilyMetadata } from "@/lib/architecture-v2/families";
import { cn } from "@/lib/utils";

/**
 * Strategy-family × archetype × (category × instrument-type) catalogue.
 *
 * Grid: rows = archetypes (grouped by family band), columns = instrument types only.
 * Each cell aggregates all asset classes (CeFi, DeFi, …): marker color = asset class,
 * marker shape = supported (●) vs partial (▲). Blocked combinations are omitted; empty
 * cells = nothing to show. Public vs IM-reserved: public markers get a thin ring.
 *
 * Renders inside `/briefings/dart-full`; gated by BriefingAccessGate on the layout.
 */

type CellLockState = LockState | "NEEDS_BUILD";

const CATEGORIES: readonly VenueCategoryV2[] = ["CEFI", "DEFI", "TRADFI", "SPORTS", "PREDICTION"] as const;

const CATEGORY_LABELS: Readonly<Record<VenueCategoryV2, string>> = {
  CEFI: "Crypto",
  DEFI: "DeFi",
  TRADFI: "Traditional",
  SPORTS: "Sports",
  PREDICTION: "Prediction",
};

/**
 * Marker colour per asset class — same hex tokens as `public/homepage.html` explorer
 * nav dots (:root --emerald, --violet, --cyan, --amber, --rose).
 */
const CATEGORY_GLYPH_CLASS: Readonly<Record<VenueCategoryV2, string>> = {
  CEFI: "text-[#4ade80]",
  DEFI: "text-[#a78bfa]",
  TRADFI: "text-[#22d3ee]",
  SPORTS: "text-[#fbbf24]",
  PREDICTION: "text-[#fb7185]",
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

function deriveLockState(cell: CoverageCell | null, status: CoverageStatus | "NONE"): CellLockState {
  if (status === "NONE") return "NEEDS_BUILD";
  if (status === "BLOCKED") return "RETIRED";
  if (!cell) return "NEEDS_BUILD";
  const publicTriple =
    cell.archetype === "STAT_ARB_PAIRS_FIXED" &&
    cell.assetGroup === "CEFI" &&
    (cell.instrumentType === "spot" || cell.instrumentType === "perp");
  if (publicTriple && (status === "SUPPORTED" || status === "PARTIAL")) return "PUBLIC";
  return "INVESTMENT_MANAGEMENT_RESERVED";
}

function lockSummary(lock: CellLockState, status: CoverageStatus | "NONE"): string | null {
  if (status !== "SUPPORTED" && status !== "PARTIAL") return null;
  if (lock === "PUBLIC") return "Public slot.";
  if (lock === "INVESTMENT_MANAGEMENT_RESERVED") return "IM-reserved by default.";
  return null;
}

function getCell(
  archetype: StrategyArchetype,
  category: VenueCategoryV2,
  instrumentType: InstrumentTypeV2,
): CoverageCell | null {
  const coverage: ArchetypeCoverage = ARCHETYPE_COVERAGE[archetype];
  return coverage.cells.find((c) => c.category === category && c.instrumentType === instrumentType) ?? null;
}

function cellStatus(cell: CoverageCell | null): CoverageStatus | "NONE" {
  if (!cell) return "NONE";
  return cell.status;
}

/** Supported / partial only — blocked omitted from the grid */
function shapeForStatus(status: CoverageStatus): { symbol: string; label: string } | null {
  if (status === "SUPPORTED") {
    return { symbol: "\u25CF", label: "Supported — live in this cell." };
  }
  if (status === "PARTIAL") {
    return { symbol: "\u25B2", label: "Partial — adapter or config gap." };
  }
  return null;
}

/**
 * Catalogue marker visuals — change these only; cells and legend compose from the same tokens.
 *
 * - `CATALOGUE_MARKER_GLYPH`: typography for ● / ▲ (add category colour or `text-foreground`).
 * - `CATALOGUE_PUBLIC_MARKER_RING`: public-slot outline; ring/box size lives here only.
 * - `CATALOGUE_MARKER_LINK`: focus/hover wrapper for linked markers in the grid.
 */
const CATALOGUE_MARKER_GLYPH = "font-mono text-sm font-semibold leading-none";

const CATALOGUE_PUBLIC_MARKER_RING =
  "inline-flex aspect-square h-[1.06em] w-[1.06em] shrink-0 items-center justify-center rounded-full text-sm ring-1 ring-primary/65 ring-offset-0";

const CATALOGUE_MARKER_LINK =
  "inline-flex min-h-4 min-w-4 items-center justify-center rounded-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

const CATALOGUE_MARKER_PLAIN_WRAP = "inline-flex items-center justify-center";

/** Single implementation for matrix dots + public ring — cells and legend must use this only. */
function CatalogueMatrixMarker({
  category,
  symbol,
  variant,
}: {
  category: VenueCategoryV2;
  symbol: string;
  variant: "public" | "im_reserved";
}) {
  const inner = (
    <span className={cn(CATALOGUE_MARKER_GLYPH, CATEGORY_GLYPH_CLASS[category])} aria-hidden>
      {symbol}
    </span>
  );
  if (variant === "public") {
    return (
      <span className={CATALOGUE_PUBLIC_MARKER_RING} aria-hidden>
        {inner}
      </span>
    );
  }
  return <span className={CATALOGUE_MARKER_PLAIN_WRAP}>{inner}</span>;
}

interface InstrumentAggregateCellProps {
  archetype: StrategyArchetype;
  instrumentType: InstrumentTypeV2;
}

function InstrumentAggregateCell({ archetype, instrumentType }: InstrumentAggregateCellProps) {
  const markers: ReactElement[] = [];
  const tipParts: string[] = [];

  for (const category of CATEGORIES) {
    const cell = getCell(archetype, category, instrumentType);
    const status = cellStatus(cell);
    if (status === "BLOCKED" || status === "NONE") continue;

    const shape = shapeForStatus(status);
    if (!shape) continue;

    const lock = deriveLockState(cell, status);
    const href =
      cell && cell.representativeSlotLabels.length > 0
        ? `/services/strategy-catalogue/strategies/${cell.archetype}/${encodeURIComponent(cell.representativeSlotLabels[0])}`
        : null;

    const lockLine = lockSummary(lock, status);
    const markerTitle = [
      `${CATEGORY_LABELS[category]} · ${INSTRUMENT_TYPE_LABELS[instrumentType]}`,
      shape.label,
      lockLine,
    ]
      .filter(Boolean)
      .join(" ");

    tipParts.push(markerTitle);

    const glyph = (
      <CatalogueMatrixMarker
        category={category}
        symbol={shape.symbol}
        variant={lock === "PUBLIC" ? "public" : "im_reserved"}
      />
    );

    const body = href ? (
      <a key={category} href={href} title={markerTitle} className={CATALOGUE_MARKER_LINK}>
        {glyph}
      </a>
    ) : (
      <span key={category} title={markerTitle} className={CATALOGUE_MARKER_PLAIN_WRAP}>
        {glyph}
      </span>
    );

    markers.push(body);
  }

  const tdClass = cn(
    "min-h-[1.5rem] min-w-[3rem] max-w-[7rem] border-b border-border/40 px-1 py-1 align-middle",
    "bg-background/90",
  );

  const emptyTitle = `No shown coverage for ${INSTRUMENT_TYPE_LABELS[instrumentType]} (blocked / not built / N/A are hidden).`;

  return (
    <td className={tdClass} title={markers.length > 0 ? tipParts.join("\n") : emptyTitle}>
      {markers.length > 0 ? (
        <div className="flex flex-wrap items-center justify-center gap-x-0.5 gap-y-0.5">{markers}</div>
      ) : null}
    </td>
  );
}

const catalogueScrollClass =
  "max-h-[min(72vh,36rem)] overflow-auto overscroll-contain rounded-md border border-border/60 md:max-h-[min(80vh,44rem)] [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]";

/** Keeps first data column aligned with sticky header + band rows (horizontal scroll). */
const stickyFirstColWidth = "min-w-[9rem] max-w-[min(36vw,14rem)]";

const stickyArchetypeTh =
  "sticky left-0 z-[12] border-b border-r border-border/40 bg-background px-2 py-1.5 text-left text-xs font-medium text-foreground/90 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.3)]";

/** Family band label: must be its own first-column cell — a single colspan row cannot stick on the left. */
const stickyFamilyBandTh =
  "sticky left-0 z-[12] border-b border-r border-border/50 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide shadow-[4px_0_8px_-4px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.3)]";

const stickyCornerTh =
  "sticky left-0 top-0 z-30 border-b border-r border-border/60 bg-card px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)] dark:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.35)]";

const stickyInstrumentTh =
  "sticky top-0 z-20 border-b border-border/50 bg-card px-1 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground";

interface ArchetypeRowProps {
  archetype: StrategyArchetype;
}

function ArchetypeRow({ archetype }: ArchetypeRowProps) {
  return (
    <tr>
      <th scope="row" className={cn(stickyArchetypeTh, stickyFirstColWidth)}>
        {ARCHETYPE_LABELS[archetype]}
      </th>
      {INSTRUMENT_TYPES.map((instrumentType) => (
        <InstrumentAggregateCell key={instrumentType} archetype={archetype} instrumentType={instrumentType} />
      ))}
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
        <th scope="rowgroup" className={cn(stickyFamilyBandTh, stickyFirstColWidth, accentClass)}>
          {label}
        </th>
        <td
          colSpan={INSTRUMENT_TYPES.length}
          className={cn("border-b border-border/50 px-2 py-1.5", accentClass)}
          aria-hidden
        />
      </tr>
      {archetypes.map((archetype) => (
        <ArchetypeRow key={archetype} archetype={archetype} />
      ))}
    </tbody>
  );
}

interface CatalogueBandTablesProps {
  readonly byFamily: Record<string, FamilyMetadata>;
  readonly BANDS: readonly { label: string; families: readonly StrategyFamily[] }[];
}

function CatalogueTable({ byFamily, BANDS }: CatalogueBandTablesProps) {
  return (
    <div className={catalogueScrollClass}>
      <table className="min-w-max w-full border-separate border-spacing-0 text-sm">
        <caption className="sr-only">
          Archetype rows by instrument type. Each cell lists one marker per asset class with live or partial coverage;
          marker colour is asset class, shape is coverage level; blocked states are not shown.
        </caption>
        <thead>
          <tr>
            <th scope="col" className={cn(stickyCornerTh, stickyFirstColWidth, "align-bottom")}>
              Archetype
            </th>
            {INSTRUMENT_TYPES.map((instrumentType) => (
              <th key={instrumentType} scope="col" className={stickyInstrumentTh}>
                {INSTRUMENT_TYPE_LABELS[instrumentType]}
              </th>
            ))}
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
            .filter((x): x is ReactElement => x !== null),
        )}
      </table>
    </div>
  );
}

export function StrategyFamilyCatalogue() {
  const families = listFamiliesOrdered();
  const byFamily: Record<string, FamilyMetadata> = {};
  for (const f of families) byFamily[f.family] = f;

  const BANDS: readonly {
    label: string;
    families: readonly StrategyFamily[];
  }[] = [
    { label: "Directional", families: ["ML_DIRECTIONAL", "RULES_DIRECTIONAL"] },
    {
      label: "Relative-Value",
      families: ["CARRY_AND_YIELD", "ARBITRAGE_STRUCTURAL", "STAT_ARB_PAIRS", "MARKET_MAKING"],
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
      <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
        Columns are instrument types (Spot, Perp, …). Each cell stacks up to one marker per asset class: colour = Crypto
        / DeFi / Traditional / Sports / Prediction; ● = supported, ▲ = partial. Blocked cells are omitted. Blank cells
        mean nothing to show. How public vs IM-reserved slots are encoded is spelled out under Lock below.
      </p>

      <CatalogueTable byFamily={byFamily} BANDS={BANDS} />

      <div className="space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Shapes (coverage)</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className={cn(CATALOGUE_MARKER_GLYPH, "text-foreground")}>{"\u25CF"}</span> Supported
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className={cn(CATALOGUE_MARKER_GLYPH, "text-foreground")}>{"\u25B2"}</span> Partial
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground/85">Empty — nothing to show</span>
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Marker colours</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {CATEGORIES.map((c) => (
            <span key={c} className="inline-flex items-center gap-2">
              <span className={cn(CATALOGUE_MARKER_GLYPH, CATEGORY_GLYPH_CLASS[c])}>{"\u25CF"}</span>
              {CATEGORY_LABELS[c]}
            </span>
          ))}
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Lock</p>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p className="max-w-3xl leading-relaxed">
            Ringed dot = public slot; plain dot (same asset-class colour) = IM-reserved. The same two states appear as
            lock badges elsewhere:
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="inline-flex items-center gap-2" aria-hidden>
              <CatalogueMatrixMarker category="CEFI" symbol={"\u25CF"} variant="public" />
              <CatalogueMatrixMarker category="CEFI" symbol={"\u25CF"} variant="im_reserved" />
            </span>
            <span className="text-muted-foreground/60" aria-hidden>
              ·
            </span>
            <LockStateBadge state="PUBLIC" className="px-1.5 py-0 text-[10px]" />
            <LockStateBadge state="INVESTMENT_MANAGEMENT_RESERVED" className="px-1.5 py-0 text-[10px]" />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
        Rows link to the per-strategy detail page when a slot exists; hover a marker for detail. Client-exclusive
        carve-outs are negotiated per mandate and surfaced on the per-strategy page, not here.
      </p>
    </div>
  );
}
