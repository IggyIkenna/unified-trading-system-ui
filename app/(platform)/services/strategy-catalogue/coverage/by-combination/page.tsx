"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import {
  CategoryChip,
  InstrumentTypeChip,
  RollModeBadge,
  StatusBadge,
} from "@/components/architecture-v2";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CoverageCell, InstrumentTypeV2, VenueCategoryV2 } from "@/lib/architecture-v2";
import {
  INSTRUMENT_TYPES_V2,
  cellsForInstrumentPair,
} from "@/lib/architecture-v2";

const CATEGORIES: readonly VenueCategoryV2[] = [
  "CEFI",
  "DEFI",
  "TRADFI",
  "SPORTS",
  "PREDICTION",
] as const;

interface LegPick {
  readonly category: VenueCategoryV2 | "ANY";
  readonly instrumentType: InstrumentTypeV2;
}

function matchesCategory(
  cell: CoverageCell,
  pick: LegPick,
): boolean {
  if (pick.category === "ANY") return true;
  return cell.category === pick.category;
}

function filterByLeg(
  cells: readonly CoverageCell[],
  pick: LegPick,
): readonly CoverageCell[] {
  return cells.filter(
    (cell) => cell.instrumentType === pick.instrumentType && matchesCategory(cell, pick),
  );
}

function encodeSlotLabel(slot: string): string {
  return encodeURIComponent(slot);
}

export default function CombinatoricDiscoveryPage() {
  const [legA, setLegA] = useState<LegPick>({
    category: "CEFI",
    instrumentType: "perp",
  });
  const [legB, setLegB] = useState<LegPick>({
    category: "CEFI",
    instrumentType: "perp",
  });

  const legACells = useMemo(
    () => filterByLeg(cellsForInstrumentPair(legA.instrumentType, legB.instrumentType), legA),
    [legA, legB],
  );
  const legBCells = useMemo(
    () => filterByLeg(cellsForInstrumentPair(legA.instrumentType, legB.instrumentType), legB),
    [legA, legB],
  );

  // Archetypes that appear on both legs — the actual combinatoric matches.
  const matches = useMemo(() => {
    const legAArchetypes = new Set(legACells.map((cell) => cell.archetype));
    const legBArchetypes = new Set(legBCells.map((cell) => cell.archetype));
    const shared = new Set<string>();
    legAArchetypes.forEach((a) => {
      if (legBArchetypes.has(a)) shared.add(a);
    });
    const byArchetype = new Map<
      string,
      { legA: CoverageCell; legB: CoverageCell }
    >();
    shared.forEach((archetype) => {
      const a = legACells.find((c) => c.archetype === archetype);
      const b = legBCells.find((c) => c.archetype === archetype);
      if (a && b) byArchetype.set(archetype, { legA: a, legB: b });
    });
    return Array.from(byArchetype.entries());
  }, [legACells, legBCells]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        <PageHeader
          title="Combinatoric discovery"
          description="Pair-capable archetypes (ARBITRAGE_PRICE_DISPERSION, CARRY_BASIS_*, STAT_ARB_PAIRS_FIXED, STAT_ARB_CROSS_SECTIONAL, CARRY_STAKED_BASIS) indexed by two-leg combinations. Select a category × instrument type for each leg to see every archetype that supports the combination."
        />

        <div
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
          data-testid="leg-picker-grid"
        >
          <LegPicker
            label="Leg A"
            value={legA}
            onChange={setLegA}
            dataTestid="leg-picker-a"
          />
          <LegPicker
            label="Leg B"
            value={legB}
            onChange={setLegB}
            dataTestid="leg-picker-b"
          />
        </div>

        <section className="space-y-3">
          <h2 className="text-heading font-medium">
            {matches.length === 0
              ? "No pair-capable archetype supports this combination"
              : `${matches.length} pair-capable archetype${matches.length === 1 ? "" : "s"} match`}
          </h2>

          <div
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
            data-testid="combinatoric-matches"
          >
            {matches.map(([archetype, { legA: cellA, legB: cellB }]) => (
              <Card key={archetype} data-testid={`combinatoric-match-${archetype}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="font-mono text-sm">{archetype}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <LegSummary title="Leg A" cell={cellA} />
                  <LegSummary title="Leg B" cell={cellB} />
                  {cellA.representativeSlotLabels.length > 0 ? (
                    <div>
                      <div className="text-muted-foreground">Leg A representative slot</div>
                      <Link
                        href={`/services/strategy-catalogue/strategies/${archetype}/${encodeSlotLabel(cellA.representativeSlotLabels[0])}`}
                        className="block break-all font-mono text-[0.65rem] text-primary hover:underline"
                      >
                        {cellA.representativeSlotLabels[0]}
                      </Link>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function LegPicker({
  label,
  value,
  onChange,
  dataTestid,
}: {
  label: string;
  value: LegPick;
  onChange: (leg: LegPick) => void;
  dataTestid: string;
}) {
  return (
    <Card data-testid={dataTestid}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Category</label>
          <Select
            value={value.category}
            onValueChange={(v) =>
              onChange({ ...value, category: v as VenueCategoryV2 | "ANY" })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANY">Any category</SelectItem>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Instrument type</label>
          <Select
            value={value.instrumentType}
            onValueChange={(v) =>
              onChange({ ...value, instrumentType: v as InstrumentTypeV2 })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INSTRUMENT_TYPES_V2.map((instrumentType) => (
                <SelectItem key={instrumentType} value={instrumentType}>
                  {instrumentType}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function LegSummary({ title, cell }: { title: string; cell: CoverageCell }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/20 p-2">
      <div className="flex items-center justify-between">
        <span className="text-[0.65rem] uppercase text-muted-foreground">{title}</span>
        <StatusBadge status={cell.status} />
      </div>
      <div className="mt-1 flex flex-wrap gap-1">
        <CategoryChip category={cell.category} />
        <InstrumentTypeChip instrumentType={cell.instrumentType} />
        {cell.rollMode !== "n/a" ? <RollModeBadge rollMode={cell.rollMode} /> : null}
      </div>
      {cell.representativeVenueIds.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {cell.representativeVenueIds.map((venue) => (
            <Badge
              key={venue}
              variant="outline"
              className="font-mono text-[0.55rem]"
            >
              {venue}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
