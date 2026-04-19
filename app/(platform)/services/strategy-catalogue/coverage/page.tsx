"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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
  CardDescription,
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
import type {
  ArchetypeCoverage,
  CoverageCell,
  CoverageStatus,
  InstrumentTypeV2,
  VenueCategoryV2,
  StrategyArchetypeV2,
} from "@/lib/architecture-v2";
import {
  ARCHETYPE_COVERAGE,
  FAMILY_METADATA,
  INSTRUMENT_TYPES_V2,
  getFamilyForArchetype,
} from "@/lib/architecture-v2";
import { cn } from "@/lib/utils";

const CATEGORIES: readonly VenueCategoryV2[] = [
  "CEFI",
  "DEFI",
  "TRADFI",
  "SPORTS",
  "PREDICTION",
] as const;

const STATUS_FILTER_VALUES = [
  "ALL",
  "SUPPORTED",
  "PARTIAL",
  "BLOCKED",
] as const;
type StatusFilter = (typeof STATUS_FILTER_VALUES)[number];

function findCell(
  coverage: ArchetypeCoverage,
  category: VenueCategoryV2,
  instrumentType: InstrumentTypeV2,
): CoverageCell | undefined {
  return coverage.cells.find(
    (cell) => cell.category === category && cell.instrumentType === instrumentType,
  );
}

function cellStatus(cell: CoverageCell | undefined): CoverageStatus {
  return cell?.status ?? "NOT_APPLICABLE";
}

function shouldRender(status: CoverageStatus, filter: StatusFilter): boolean {
  if (filter === "ALL") return true;
  return status === filter;
}

const STATUS_CELL_STYLES: Record<CoverageStatus, string> = {
  SUPPORTED: "bg-green-500/10 border-green-500/40",
  PARTIAL: "bg-amber-500/10 border-amber-500/40",
  BLOCKED: "bg-red-500/10 border-red-500/30",
  NOT_APPLICABLE: "bg-muted/20 border-border/40",
};

export default function StrategyCatalogueCoveragePage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedCell, setSelectedCell] = useState<CoverageCell | null>(null);

  const archetypesByFamily = useMemo(() => {
    const grouped = new Map<string, StrategyArchetypeV2[]>();
    (Object.keys(ARCHETYPE_COVERAGE) as StrategyArchetypeV2[]).forEach(
      (archetype) => {
        const family = getFamilyForArchetype(archetype);
        const bucket = grouped.get(family) ?? [];
        bucket.push(archetype);
        grouped.set(family, bucket);
      },
    );
    return Array.from(grouped.entries());
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        <PageHeader
          title="Coverage matrix"
          description="Archetypes × (category × instrument type). Every cell is a capability statement. Click a cell to inspect venues, signal variants, roll mode, and representative slot labels."
        >
          <Badge variant="outline">SSOT</Badge>
          <Badge variant="outline" className="font-mono text-xs">
            codex/09-strategy/architecture-v2/category-instrument-coverage.md
          </Badge>
        </PageHeader>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value === "ALL" ? "All statuses" : value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block size-3 rounded bg-green-500/30" /> Supported
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-3 rounded bg-amber-500/30" /> Partial
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-3 rounded bg-red-500/30" /> Blocked
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block size-3 rounded bg-muted" /> N/A
            </span>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="flex-1 overflow-auto rounded-lg border border-border/60">
            <table className="w-full text-xs" data-testid="coverage-matrix-table">
              <thead className="bg-muted/40">
                <tr>
                  <th className="sticky left-0 z-10 bg-muted/40 p-2 text-left font-medium">
                    Archetype
                  </th>
                  {CATEGORIES.flatMap((category) =>
                    INSTRUMENT_TYPES_V2.map((instrumentType) => (
                      <th
                        key={`${category}-${instrumentType}`}
                        className="p-1 text-center font-medium"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <CategoryChip category={category} />
                          <InstrumentTypeChip instrumentType={instrumentType} />
                        </div>
                      </th>
                    )),
                  )}
                </tr>
              </thead>
              <tbody>
                {archetypesByFamily.map(([family, archetypes]) => (
                  <ArchetypeFamilyRows
                    key={family}
                    family={family}
                    archetypes={archetypes}
                    statusFilter={statusFilter}
                    onCellClick={setSelectedCell}
                    activeCell={selectedCell}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {selectedCell ? (
            <aside className="w-80 shrink-0" data-testid="coverage-cell-detail">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {selectedCell.archetype}
                  </CardTitle>
                  <CardDescription className="flex gap-2">
                    <CategoryChip category={selectedCell.category} />
                    <InstrumentTypeChip instrumentType={selectedCell.instrumentType} />
                    <StatusBadge status={selectedCell.status} />
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  {selectedCell.rollMode !== "n/a" ? (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Roll mode:</span>
                      <RollModeBadge rollMode={selectedCell.rollMode} />
                    </div>
                  ) : null}

                  {selectedCell.signalVariants.length > 0 ? (
                    <div>
                      <div className="text-muted-foreground">Signal variants</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedCell.signalVariants.map((variant) => (
                          <Badge key={variant} variant="secondary" className="font-mono text-[0.65rem]">
                            {variant}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {selectedCell.representativeVenueIds.length > 0 ? (
                    <div>
                      <div className="text-muted-foreground">Venues</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedCell.representativeVenueIds.map((venue) => (
                          <Badge key={venue} variant="outline" className="font-mono text-[0.65rem]">
                            {venue}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {selectedCell.representativeSlotLabels.length > 0 ? (
                    <div>
                      <div className="text-muted-foreground">Representative slot labels</div>
                      <ul className="mt-1 space-y-1 font-mono text-[0.65rem]">
                        {selectedCell.representativeSlotLabels.map((slot) => (
                          <li key={slot} className="break-all text-foreground">
                            {slot}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {selectedCell.blockListRefs.length > 0 ? (
                    <div>
                      <div className="text-muted-foreground">Block-list references</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedCell.blockListRefs.map((ref) => (
                          <Link
                            key={ref}
                            href="/services/strategy-catalogue/coverage/blocked"
                            className="text-red-500 underline-offset-4 hover:underline"
                          >
                            {ref}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {selectedCell.notes ? (
                    <div>
                      <div className="text-muted-foreground">Notes</div>
                      <p className="mt-1 text-foreground">{selectedCell.notes}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );

  function ArchetypeFamilyRows({
    family,
    archetypes,
    statusFilter,
    onCellClick,
    activeCell,
  }: {
    family: string;
    archetypes: StrategyArchetypeV2[];
    statusFilter: StatusFilter;
    onCellClick: (cell: CoverageCell) => void;
    activeCell: CoverageCell | null;
  }) {
    const familyMeta = FAMILY_METADATA[family as keyof typeof FAMILY_METADATA];
    return (
      <>
        <tr className="bg-muted/10">
          <th
            colSpan={CATEGORIES.length * INSTRUMENT_TYPES_V2.length + 1}
            className="px-2 py-1 text-left text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground"
          >
            {familyMeta?.label ?? family}
          </th>
        </tr>
        {archetypes.map((archetype) => {
          const coverage = ARCHETYPE_COVERAGE[archetype];
          return (
            <tr key={archetype} className="border-t border-border/40">
              <th className="sticky left-0 z-10 whitespace-nowrap bg-background px-2 py-1 text-left font-normal">
                {archetype}
              </th>
              {CATEGORIES.flatMap((category) =>
                INSTRUMENT_TYPES_V2.map((instrumentType) => {
                  const cell = findCell(coverage, category, instrumentType);
                  const status = cellStatus(cell);
                  const isActive =
                    activeCell &&
                    activeCell.archetype === archetype &&
                    activeCell.category === category &&
                    activeCell.instrumentType === instrumentType;
                  const render = shouldRender(status, statusFilter);
                  return (
                    <td
                      key={`${category}-${instrumentType}`}
                      className={cn(
                        "border p-0 transition-colors",
                        STATUS_CELL_STYLES[status],
                        isActive && "ring-2 ring-ring",
                        !render && "opacity-25",
                      )}
                    >
                      <button
                        type="button"
                        disabled={!cell}
                        onClick={() => cell && onCellClick(cell)}
                        className={cn(
                          "flex h-8 w-full items-center justify-center text-[0.6rem] uppercase tracking-wide",
                          cell ? "cursor-pointer hover:bg-background/30" : "cursor-default",
                        )}
                        aria-label={`${archetype} × ${category} × ${instrumentType}: ${status}`}
                      >
                        {status === "SUPPORTED"
                          ? "·"
                          : status === "PARTIAL"
                            ? "◔"
                            : status === "BLOCKED"
                              ? "×"
                              : ""}
                      </button>
                    </td>
                  );
                }),
              )}
            </tr>
          );
        })}
      </>
    );
  }
}
