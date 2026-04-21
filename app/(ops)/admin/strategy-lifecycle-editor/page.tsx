"use client";

/**
 * Strategy Lifecycle Editor — Tier-2 admin maturity + routing editor.
 *
 * Plan B Phase 2 (plans/active/strategy_catalogue_3tier_surface_2026_04_21.plan.md).
 * Surface: /admin/strategy-lifecycle-editor → mounts
 * `<StrategyCatalogueSurface viewMode="admin-editor" />`.
 *
 * Row editors (maturity + routing inline dropdowns, bulk-edit, audit toast)
 * are scaffolded inside the shared surface but stay **disabled** until Plan A
 * Phase 3 ships `PATCH /api/v1/registry/strategy-instances/{id}/lifecycle`.
 * Follow-up todo `p2-followup-enable-editor` unblocks once the PATCH endpoint
 * is live. Admin + internal-trader only.
 */

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { StrategyCatalogueSurface } from "@/components/strategy-catalogue/StrategyCatalogueSurface";
import {
  EMPTY_CATALOGUE_FILTER,
  type StrategyCatalogueFilter,
} from "@/lib/architecture-v2/catalogue-filter";

export default function StrategyLifecycleEditorPage() {
  const [filter, setFilter] = useState<StrategyCatalogueFilter>(
    EMPTY_CATALOGUE_FILTER,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-page-title font-semibold tracking-tight">
              Strategy Lifecycle Editor
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              Tier 2 · admin mutate
            </Badge>
            <Badge variant="outline" className="font-mono text-[10px] text-amber-500">
              Editors enabled when Plan A Phase 3 PATCH ships
            </Badge>
          </div>
          <p className="text-body text-muted-foreground max-w-3xl">
            Mutate <code className="font-mono text-xs">maturity_phase</code> and{" "}
            <code className="font-mono text-xs">product_routing</code> on each
            instance. Forward-only transitions (plus retire). Bulk-edit via
            filter + apply. Every change audit-logged with a 5-second undo.
          </p>
        </header>

        <StrategyCatalogueSurface
          viewMode="admin-editor"
          filter={filter}
          onFilterChange={setFilter}
        />
      </div>
    </div>
  );
}
