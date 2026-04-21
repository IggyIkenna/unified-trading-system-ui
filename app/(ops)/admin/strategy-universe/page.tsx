"use client";

/**
 * Strategy Universe — Tier-1 admin read-only catalogue.
 *
 * Plan B Phase 2 (plans/active/strategy_catalogue_3tier_surface_2026_04_21.plan.md).
 * Surface: /admin/strategy-universe → mounts
 * `<StrategyCatalogueSurface viewMode="admin-universe" />`.
 *
 * Read-only diagnostic view of every instance UAC expresses (currently 84 from
 * Plan A Phase 1, ~200-300 post-expansion). Admin + internal-trader +
 * im-desk-operator get read-only access via the Admin & Ops tile sub-route.
 */

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { StrategyCatalogueSurface } from "@/components/strategy-catalogue/StrategyCatalogueSurface";
import {
  EMPTY_CATALOGUE_FILTER,
  type StrategyCatalogueFilter,
} from "@/lib/architecture-v2/catalogue-filter";

export default function StrategyUniversePage() {
  const [filter, setFilter] = useState<StrategyCatalogueFilter>(
    EMPTY_CATALOGUE_FILTER,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-page-title font-semibold tracking-tight">
              Strategy Universe
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              Tier 1 · admin read-only
            </Badge>
          </div>
          <p className="text-body text-muted-foreground max-w-3xl">
            Every instance the UAC registry expresses — the 5-dimensional
            family × archetype × venue-set × instrument-type × share-class
            possibility space. This view is diagnostic; use{" "}
            <a
              href="/admin/strategy-lifecycle-editor"
              className="text-primary underline-offset-2 hover:underline"
            >
              Strategy Lifecycle Editor
            </a>{" "}
            to change maturity phase or product routing.
          </p>
        </header>

        <StrategyCatalogueSurface
          viewMode="admin-universe"
          filter={filter}
          onFilterChange={setFilter}
        />
      </div>
    </div>
  );
}
