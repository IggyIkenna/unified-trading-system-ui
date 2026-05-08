"use client";

/**
 * DashboardFilterStrip — family / archetype / venue-set / share-class /
 * instrument-type picker rendered above the /dashboard tile grid.
 *
 * Collapsed-by-default behind a "Filter strategies" ghost button; both the
 * filter values and the disclosure state persist per-user in localStorage
 * (see `lib/context/dashboard-filter-context.tsx`).
 *
 * Reuses `<FamilyArchetypePicker>` for the family+archetype dimensions and
 * adds native `<Select>` pickers for the remaining 3 dimensions. Emits a
 * `dashboardFilter.changed` CustomEvent on every change via the context.
 *
 * SSOTs:
 *   - plans/active/dashboard_services_grid_collapse_2026_04_21.plan Phase 4
 *   - codex/09-strategy/architecture-v2/dashboard-services-grid.md §4
 */

import { ChevronDown, Filter, X } from "lucide-react";
import * as React from "react";

import { FamilyArchetypePicker } from "@/components/architecture-v2/family-archetype-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { INSTRUMENT_TYPES_V2, type InstrumentTypeV2 } from "@/lib/architecture-v2/coverage";
import { ARCHETYPE_TO_FAMILY, type StrategyArchetype, type StrategyFamily } from "@/lib/architecture-v2/enums";
import { SHARE_CLASS_LABEL, loadVenueSetVariants, type VenueSetVariant } from "@/lib/architecture-v2/lifecycle";
import { useWorkspaceScope, useWorkspaceScopeStore } from "@/lib/stores/workspace-scope-store";
import { cn } from "@/lib/utils";

const ALL_SENTINEL = "__all__";

const INSTRUMENT_TYPE_LABEL: Record<InstrumentTypeV2, string> = {
  spot: "Spot",
  perp: "Perp",
  dated_future: "Dated future",
  option: "Option",
  lending: "Lending",
  staking: "Staking",
  lp: "LP",
  event_settled: "Event-settled",
};

const SHARE_CLASS_OPTIONS: ReadonlyArray<keyof typeof SHARE_CLASS_LABEL> = ["USD", "USDT", "USDC", "BTC", "ETH", "SOL"];

export interface DashboardFilterStripProps {
  readonly className?: string;
}

export function DashboardFilterStrip({ className }: DashboardFilterStripProps) {
  const { user } = useAuth();
  const scope = useWorkspaceScope();
  const applyScope = useWorkspaceScopeStore((s) => s.applyScope);

  const family = scope.families[0] ?? null;
  const archetype = scope.archetypes[0] ?? null;
  const venueSetVariant = scope.venueSetVariants[0] ?? null;
  const shareClass = scope.shareClasses[0] ?? null;
  const instrumentType = (scope.instrumentTypes[0] as InstrumentTypeV2 | undefined) ?? null;

  const isActive =
    family !== null ||
    archetype !== null ||
    venueSetVariant !== null ||
    shareClass !== null ||
    instrumentType !== null;

  // Expanded state is per-user UI ephemera, not workspace scope. Keep local
  // and persist to localStorage with the user-id as the key.
  const expandedKey = user?.id ? `dashboardFilter:${user.id}:expanded` : null;
  const [expanded, setExpandedState] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !expandedKey) return;
    try {
      setExpandedState(window.localStorage.getItem(expandedKey) === "1");
    } catch {
      // Storage disabled — keep default false.
    }
  }, [expandedKey]);
  const setExpanded = React.useCallback(
    (next: boolean) => {
      setExpandedState(next);
      if (typeof window === "undefined" || !expandedKey) return;
      try {
        if (next) window.localStorage.setItem(expandedKey, "1");
        else window.localStorage.removeItem(expandedKey);
      } catch {
        // Storage disabled — silent.
      }
    },
    [expandedKey],
  );

  const clear = React.useCallback(() => {
    applyScope(
      {
        families: [],
        archetypes: [],
        venueSetVariants: [],
        shareClasses: [],
        instrumentTypes: [],
      },
      "dashboard-filter",
    );
  }, [applyScope]);

  const variants = React.useMemo<readonly VenueSetVariant[]>(() => loadVenueSetVariants(), []);

  // If an archetype is selected, narrow the venue-set options to that archetype.
  const availableVariants = React.useMemo<readonly VenueSetVariant[]>(() => {
    if (!archetype) return variants;
    return variants.filter((v) => v.archetype === archetype);
  }, [variants, archetype]);

  const handleFamilyArchetypeChange = React.useCallback(
    (next: { family?: StrategyFamily; archetype?: StrategyArchetype }) => {
      const nextArchetype = next.archetype ?? null;
      const nextFamily = next.family ?? (nextArchetype ? ARCHETYPE_TO_FAMILY[nextArchetype] : null);
      applyScope(
        {
          families: nextFamily ? [nextFamily] : [],
          archetypes: nextArchetype ? [nextArchetype] : [],
          // Clear dependent dim when archetype changes so we don't leave a
          // stale variant that no longer matches.
          venueSetVariants: archetype !== nextArchetype ? [] : scope.venueSetVariants,
        },
        "dashboard-filter",
      );
    },
    [applyScope, archetype, scope.venueSetVariants],
  );

  return (
    <div
      className={cn("rounded-lg border border-border/50 bg-muted/10", className)}
      data-testid="dashboard-filter-strip"
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1.5"
          aria-expanded={expanded}
          aria-controls="dashboard-filter-strip-body"
          onClick={() => setExpanded(!expanded)}
          data-testid="dashboard-filter-strip-toggle"
        >
          <Filter className="size-3" aria-hidden />
          Filter strategies
          <ChevronDown className={cn("size-3 transition-transform", expanded && "rotate-180")} aria-hidden />
        </Button>

        {isActive ? (
          <>
            <ActiveFilterBadges
              family={family}
              archetype={archetype}
              venueSetVariant={venueSetVariant}
              shareClass={shareClass}
              instrumentType={instrumentType}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1 ml-auto text-muted-foreground hover:text-foreground"
              onClick={clear}
              data-testid="dashboard-filter-clear"
              aria-label="Clear filters"
            >
              <X className="size-3" aria-hidden />
              Clear filters
            </Button>
          </>
        ) : (
          <span className="text-[11px] text-muted-foreground">No filters: all strategies</span>
        )}
      </div>

      {expanded && (
        <div
          id="dashboard-filter-strip-body"
          className="px-3 pb-3 pt-1 border-t border-border/30 space-y-2"
          data-testid="dashboard-filter-strip-body"
        >
          <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center md:gap-3">
            <FamilyArchetypePicker
              value={{
                family: family ?? undefined,
                archetype: archetype ?? undefined,
              }}
              onChange={handleFamilyArchetypeChange}
              availabilityFilter="allowed"
              showAllOption
              idPrefix="dashboard-filter"
            />

            <Select
              value={venueSetVariant ?? ALL_SENTINEL}
              onValueChange={(next) =>
                applyScope(
                  {
                    venueSetVariants: next === ALL_SENTINEL ? [] : [next as VenueSetVariant["id"]],
                  },
                  "dashboard-filter",
                )
              }
              disabled={availableVariants.length === 0}
            >
              <SelectTrigger
                className="w-full md:w-64"
                data-testid="dashboard-filter-venue-set-select"
                aria-label="Venue set"
              >
                <SelectValue placeholder="Venue set" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SENTINEL}>All venue sets</SelectItem>
                {availableVariants.map((variant) => (
                  <SelectItem key={variant.id} value={variant.id}>
                    {variant.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={shareClass ?? ALL_SENTINEL}
              onValueChange={(next) =>
                applyScope(
                  {
                    shareClasses: next === ALL_SENTINEL ? [] : [next as keyof typeof SHARE_CLASS_LABEL],
                  },
                  "dashboard-filter",
                )
              }
            >
              <SelectTrigger
                className="w-full md:w-40"
                data-testid="dashboard-filter-share-class-select"
                aria-label="Share class"
              >
                <SelectValue placeholder="Share class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SENTINEL}>All share classes</SelectItem>
                {SHARE_CLASS_OPTIONS.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {SHARE_CLASS_LABEL[cls]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={instrumentType ?? ALL_SENTINEL}
              onValueChange={(next) =>
                applyScope(
                  {
                    instrumentTypes: next === ALL_SENTINEL ? [] : [next as InstrumentTypeV2],
                  },
                  "dashboard-filter",
                )
              }
            >
              <SelectTrigger
                className="w-full md:w-44"
                data-testid="dashboard-filter-instrument-type-select"
                aria-label="Instrument type"
              >
                <SelectValue placeholder="Instrument type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SENTINEL}>All instrument types</SelectItem>
                {INSTRUMENT_TYPES_V2.map((t) => (
                  <SelectItem key={t} value={t}>
                    {INSTRUMENT_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

function ActiveFilterBadges({
  family,
  archetype,
  venueSetVariant,
  shareClass,
  instrumentType,
}: {
  readonly family: StrategyFamily | null;
  readonly archetype: StrategyArchetype | null;
  readonly venueSetVariant: VenueSetVariant["id"] | null;
  readonly shareClass: keyof typeof SHARE_CLASS_LABEL | null;
  readonly instrumentType: InstrumentTypeV2 | null;
}) {
  const chips: string[] = [];
  if (family) chips.push(family);
  if (archetype) chips.push(archetype);
  if (venueSetVariant) chips.push(venueSetVariant);
  if (shareClass) chips.push(SHARE_CLASS_LABEL[shareClass]);
  if (instrumentType) chips.push(INSTRUMENT_TYPE_LABEL[instrumentType]);
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1" data-testid="dashboard-filter-active-chips">
      {chips.map((label) => (
        <Badge key={label} variant="outline" className="text-[10px] font-mono h-5 px-1.5">
          {label}
        </Badge>
      ))}
    </div>
  );
}
