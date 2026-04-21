"use client";

import * as React from "react";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";
import {
  STRATEGY_FAMILIES_V2,
  type StrategyArchetype,
  type StrategyFamily,
} from "@/lib/architecture-v2/enums";
import { FAMILY_METADATA } from "@/lib/architecture-v2/families";
import {
  ARCHETYPE_COVERAGE,
  type CoverageCell,
} from "@/lib/architecture-v2/coverage";
import { useCatalogueTruthiness } from "@/hooks/admin/use-catalogue-truthiness";
import type {
  ArchetypeRegistryRow,
  CatalogueStatus,
} from "@/lib/admin/truthiness";

/**
 * Admin full-catalogue overview — renders every (family × archetype × cell)
 * combination with representative strategy IDs + representative venues, plus
 * a truthiness badge (LIVE / IN_DEVELOPMENT / PLANNED_NOT_IMPLEMENTED / RETIRED)
 * sourced from the live backend registries via CatalogueTruthinessAdapter.
 *
 * Admins see every status bucket; client personas do not reach this page
 * (ops layout gate). Mirrors plan p7-admin-full-catalogue-view +
 * p6-admin-sees-full-catalogue.
 */

const STATUS_STYLES: Record<CatalogueStatus, string> = {
  LIVE: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  IN_DEVELOPMENT: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  RETIRED: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  PLANNED_NOT_IMPLEMENTED:
    "bg-rose-500/20 text-rose-300 border-rose-500/40",
};

const STATUS_LABEL: Record<CatalogueStatus, string> = {
  LIVE: "Live",
  IN_DEVELOPMENT: "In development",
  RETIRED: "Retired",
  PLANNED_NOT_IMPLEMENTED: "Planned",
};

function StatusBadge({
  status,
  source,
}: {
  status: CatalogueStatus;
  source: "live" | "mock";
}) {
  return (
    <Badge
      variant="outline"
      className={`${STATUS_STYLES[status]} font-mono text-[10px] uppercase tracking-wider`}
      data-testid={`archetype-status-${status}`}
    >
      {source === "mock" ? "(mock) " : ""}
      {STATUS_LABEL[status]}
    </Badge>
  );
}

interface ArchetypeCardData {
  readonly archetype: StrategyArchetype;
  readonly status: CatalogueStatus;
  readonly source: "live" | "mock";
  readonly liveStrategyCount: number;
  readonly cells: readonly CoverageCell[];
}

function buildArchetypeCards(
  family: StrategyFamily,
  registryRows: readonly ArchetypeRegistryRow[],
): readonly ArchetypeCardData[] {
  const meta = FAMILY_METADATA[family];
  const registryByArchetype = new Map(
    registryRows.map((row) => [row.archetype, row]),
  );
  return meta.archetypes.map((archetype) => {
    const reg = registryByArchetype.get(archetype);
    const coverage = ARCHETYPE_COVERAGE[archetype];
    const cells = coverage.cells.filter((cell) => cell.status !== "BLOCKED");
    return {
      archetype,
      status: reg?.status ?? "PLANNED_NOT_IMPLEMENTED",
      source: reg?.source ?? "mock",
      liveStrategyCount: reg?.liveStrategyCount ?? 0,
      cells: cells.slice(0, 5),
    };
  });
}

export default function AdminStrategyCatalogueOverviewPage() {
  const { snapshot, isLoading, error } = useCatalogueTruthiness();

  return (
    <div
      className="flex flex-col gap-6 p-6"
      data-testid="admin-strategy-catalogue-overview"
    >
      <PageHeader
        title="Strategy Catalogue — Admin Overview"
        description="Every family × archetype × cell with representative strategy IDs + representative venues. Admin bypass is active — persona filters do not apply."
      />

      {snapshot?.mode === "mock" ? (
        <Alert
          className="border-amber-500/40 bg-amber-500/10"
          data-testid="catalogue-mock-banner"
        >
          <Info className="h-4 w-4 text-amber-300" />
          <AlertTitle>Mock mode</AlertTitle>
          <AlertDescription>
            {snapshot.warnings.join(" ")}
            {" "}Set <code>NEXT_PUBLIC_ADMIN_API_TOKEN</code> and point
            <code> NEXT_PUBLIC_STRATEGY_SERVICE_URL</code> at a reachable
            strategy-service instance to see live registry state.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert
          className="border-rose-500/40 bg-rose-500/10"
          data-testid="catalogue-error-banner"
        >
          <AlertTriangle className="h-4 w-4 text-rose-300" />
          <AlertTitle>Registry fetch failed</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">
          Loading backend registry state…
        </p>
      ) : null}

      <div className="flex flex-col gap-8">
        {STRATEGY_FAMILIES_V2.map((family) => {
          const meta = FAMILY_METADATA[family];
          const cards = buildArchetypeCards(
            family,
            snapshot?.archetypes ?? [],
          );
          return (
            <section
              key={family}
              data-testid={`admin-catalogue-family-${meta.slug}`}
              className="flex flex-col gap-3"
            >
              <div className="flex items-baseline justify-between border-b border-border/50 pb-2">
                <div>
                  <h2 className="text-lg font-semibold">{meta.label}</h2>
                  <p className="text-xs text-muted-foreground max-w-3xl">
                    {meta.shortDescription}
                  </p>
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {cards.length} archetype{cards.length === 1 ? "" : "s"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((card) => (
                  <Card
                    key={card.archetype}
                    className={`${meta.accentClass} border-2`}
                    data-testid={`admin-archetype-card-${card.archetype}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-sm font-mono">
                            {card.archetype}
                          </CardTitle>
                          <CardDescription>
                            {card.liveStrategyCount} live strateg
                            {card.liveStrategyCount === 1 ? "y" : "ies"}
                          </CardDescription>
                        </div>
                        <StatusBadge
                          status={card.status}
                          source={card.source}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {card.cells.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No non-blocked cells.
                        </p>
                      ) : (
                        <ul className="space-y-1.5">
                          {card.cells.map((cell) => (
                            <li
                              key={`${cell.archetype}-${cell.category}-${cell.instrumentType}`}
                              className="flex items-start gap-2 text-xs"
                              data-testid="admin-catalogue-cell"
                            >
                              <span className="font-mono text-muted-foreground w-28 shrink-0">
                                {cell.category}·{cell.instrumentType}
                              </span>
                              <span className="flex-1">
                                {cell.representativeSlotLabels.slice(0, 2).join(", ") ||
                                  "(no representative slot labels)"}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                {cell.representativeVenueIds.slice(0, 3).join(", ")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="pt-2 border-t border-border/30">
                        <Link
                          href={`/services/strategy-catalogue/coverage?archetype=${card.archetype}`}
                          className="text-xs text-primary hover:underline"
                          data-testid={`admin-archetype-drilldown-${card.archetype}`}
                        >
                          View in Strategy Catalogue →
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
