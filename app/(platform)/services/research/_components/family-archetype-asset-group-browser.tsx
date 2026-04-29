"use client";

/**
 * FamilyArchetypeAssetGroupBrowser — DART Research strategy-selection drilldown.
 *
 * 2026-04-28 DART tile-split (Phase D.6 page-level): research-side hierarchy
 * is family → archetype → asset_group → instances, in contrast to the public
 * catalogue's asset_group → family → archetype ordering. Rationale: research
 * is family-led (quants think "show me all CARRY_AND_YIELD strategies"
 * across asset groups) while the public catalogue is asset-group-led
 * (drove 3.3× envelope uplift on the catalogue side per
 * feedback_primary_category_first_class_axis.md).
 *
 * Backed by the live `strategy_instruments.json` GCS artefact via
 * `instancesByFamilyArchetypeAssetGroup()` in envelope-loader.ts.
 *
 * Used by:
 *   - /services/research/strategies (top-level browser)
 *   - /services/research/strategy/families (panel below FamilyGridClient)
 *   - /services/research/strategy/families/[family] (panel scoped to family)
 *   - /services/research/strategy/catalog (toggleable v2-hierarchy view)
 *   - /services/research/strategy/overview (sidebar)
 *
 * SSOT: codex/14-playbooks/dart/dart-terminal-vs-research.md.
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  type StrategyInstrumentsSlot,
  instancesByFamilyArchetypeAssetGroup,
} from "@/lib/architecture-v2/envelope-loader";
import type { StrategyArchetype, StrategyFamily } from "@/lib/architecture-v2/enums";
import { useWorkspaceScope, useWorkspaceScopeStore } from "@/lib/stores/workspace-scope-store";

interface FamilyArchetypeAssetGroupBrowserProps {
  /** When set, restricts the top-level family list to this family only —
   * useful inside the per-family drilldown page. */
  scopeFamily?: string;
  /** Optional title override; defaults to "Family → Archetype → Asset group". */
  title?: string;
  /** Optional className. */
  className?: string;
}

type FamilyHierarchy = Map<string, Map<string, Map<string, StrategyInstrumentsSlot[]>>>;

export function FamilyArchetypeAssetGroupBrowser({
  scopeFamily,
  title = "Family → Archetype → Asset group",
  className,
}: FamilyArchetypeAssetGroupBrowserProps) {
  const [hierarchy, setHierarchy] = React.useState<FamilyHierarchy | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Phase 1 of dart_ux_cockpit_refactor_2026_04_29.plan.md §17:
  // lift family/archetype state out of local React state into the unified
  // WorkspaceScope so a selection on `/services/research/strategies` follows
  // the user into `/services/research/strategy/families/{family}` etc.
  const scope = useWorkspaceScope();
  const setFamilies = useWorkspaceScopeStore((s) => s.setFamilies);
  const setArchetypes = useWorkspaceScopeStore((s) => s.setArchetypes);

  const activeFamily = scopeFamily ?? scope.families[0] ?? null;
  const activeArchetype = scope.archetypes[0] ?? null;

  React.useEffect(() => {
    let cancelled = false;
    void instancesByFamilyArchetypeAssetGroup()
      .then((h) => {
        if (cancelled) return;
        setHierarchy(h);
        // Default-select the first family if no scope and none selected
        if (!scopeFamily && scope.families.length === 0) {
          const first = h.keys().next().value;
          if (typeof first === "string") setFamilies([first as StrategyFamily]);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load strategy hierarchy");
      });
    return () => {
      cancelled = true;
    };
    // scopeFamily is allowed to drive a re-fetch; scope.families is intentionally
    // not in deps to prevent loops (the default-select happens once per mount).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeFamily]);

  if (error !== null) {
    return (
      <Card className={cn("border-destructive/40", className)}>
        <CardContent className="pt-5">
          <p className="text-sm text-destructive">Failed to load strategy hierarchy: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (hierarchy === null) {
    return (
      <Card className={className}>
        <CardContent className="pt-5">
          <p className="text-sm text-muted-foreground">Loading strategy hierarchy…</p>
        </CardContent>
      </Card>
    );
  }

  const families = scopeFamily ? [scopeFamily] : Array.from(hierarchy.keys()).sort();
  const familyArchetypes = activeFamily ? hierarchy.get(activeFamily) : null;
  const archetypes = familyArchetypes ? Array.from(familyArchetypes.keys()).sort() : [];
  const archetypeAssetGroups = activeArchetype && familyArchetypes ? familyArchetypes.get(activeArchetype) : null;
  const assetGroups = archetypeAssetGroups ? Array.from(archetypeAssetGroups.keys()).sort() : [];

  return (
    <Card className={className} data-testid="family-archetype-asset-group-browser">
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">research lens · family-led</span>
        </div>

        {/* Level 1: family chips */}
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Family</p>
          <div className="flex flex-wrap gap-1.5">
            {families.map((family) => {
              const archetypeMap = hierarchy.get(family);
              const archetypeCount = archetypeMap?.size ?? 0;
              const isActive = family === activeFamily;
              return (
                <button
                  key={family}
                  type="button"
                  onClick={() => {
                    setFamilies([family as StrategyFamily]);
                    setArchetypes([]);
                  }}
                  data-testid={`family-chip-${family}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-mono transition-colors",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                >
                  {family}
                  <Badge variant="secondary" className="px-1 py-0 text-[9px]">
                    {archetypeCount}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* Level 2: archetype chips for the selected family */}
        {activeFamily ? (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Archetype <span className="text-muted-foreground/60">· in {activeFamily}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {archetypes.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No archetypes catalogued for this family.</p>
              ) : (
                archetypes.map((archetype) => {
                  const agMap = familyArchetypes?.get(archetype);
                  const totalSlots = agMap ? Array.from(agMap.values()).reduce((sum, s) => sum + s.length, 0) : 0;
                  const isActive = archetype === activeArchetype;
                  return (
                    <button
                      key={archetype}
                      type="button"
                      onClick={() => setArchetypes([archetype as StrategyArchetype])}
                      data-testid={`archetype-chip-${archetype}`}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-mono transition-colors",
                        isActive
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                          : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
                      )}
                    >
                      {archetype}
                      <Badge variant="secondary" className="px-1 py-0 text-[9px]">
                        {totalSlots}
                      </Badge>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}

        {/* Level 3: asset_group chips + instance counts for the selected archetype */}
        {activeArchetype && archetypeAssetGroups ? (
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Asset group <span className="text-muted-foreground/60">· in {activeArchetype}</span>
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {assetGroups.map((assetGroup) => {
                const slots = archetypeAssetGroups.get(assetGroup) ?? [];
                return (
                  <Card key={assetGroup} className="border-border/40" data-testid={`asset-group-card-${assetGroup}`}>
                    <CardContent className="space-y-2 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-medium text-foreground">{assetGroup}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {slots.length} {slots.length === 1 ? "instance" : "instances"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {slots.slice(0, 6).map((slot, i) => (
                          <Badge
                            key={`${slot.archetype_id}-${slot.venue}-${i}`}
                            variant="secondary"
                            className="text-[9px] font-mono"
                          >
                            {slot.venue}/{slot.instrument_type}
                          </Badge>
                        ))}
                        {slots.length > 6 ? (
                          <Badge variant="outline" className="text-[9px]">
                            +{slots.length - 6} more
                          </Badge>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
