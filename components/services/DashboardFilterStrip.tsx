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
 *   - plans/active/dashboard_services_grid_collapse_2026_04_21.plan.md Phase 4
 *   - codex/09-strategy/architecture-v2/dashboard-services-grid.md §4
 */

import * as React from "react";
import { ChevronDown, Filter, X } from "lucide-react";

import { FamilyArchetypePicker } from "@/components/architecture-v2/family-archetype-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardFilter } from "@/hooks/use-dashboard-filter";
import { ARCHETYPE_TO_FAMILY, type StrategyArchetype, type StrategyFamily } from "@/lib/architecture-v2/enums";
import { SHARE_CLASS_LABEL, loadVenueSetVariants, type VenueSetVariant } from "@/lib/architecture-v2/lifecycle";
import { INSTRUMENT_TYPES_V2, type InstrumentTypeV2 } from "@/lib/architecture-v2/coverage";
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
  const { filter, setFilter, clear, expanded, setExpanded, isActive } = useDashboardFilter();

  const variants = React.useMemo<readonly VenueSetVariant[]>(() => loadVenueSetVariants(), []);

  // If an archetype is selected, narrow the venue-set options to that archetype.
  const availableVariants = React.useMemo<readonly VenueSetVariant[]>(() => {
    if (!filter.archetype) return variants;
    return variants.filter((v) => v.archetype === filter.archetype);
  }, [variants, filter.archetype]);

  const handleFamilyArchetypeChange = React.useCallback(
    (next: { family?: StrategyFamily; archetype?: StrategyArchetype }) => {
      const nextArchetype = next.archetype ?? null;
      const nextFamily = next.family ?? (nextArchetype ? ARCHETYPE_TO_FAMILY[nextArchetype] : null);
      setFilter({
        family: nextFamily,
        archetype: nextArchetype,
        // Clear dependent dims when archetype changes so we don't leave a
        // stale variant that no longer matches.
        venueSetVariant: filter.archetype !== nextArchetype ? null : filter.venueSetVariant,
      });
    },
    [setFilter, filter.archetype, filter.venueSetVariant],
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
            <ActiveFilterBadges />
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
                family: filter.family ?? undefined,
                archetype: filter.archetype ?? undefined,
              }}
              onChange={handleFamilyArchetypeChange}
              availabilityFilter="allowed"
              showAllOption
              idPrefix="dashboard-filter"
            />

            <Select
              value={filter.venueSetVariant ?? ALL_SENTINEL}
              onValueChange={(next) =>
                setFilter({
                  venueSetVariant: next === ALL_SENTINEL ? null : next,
                })
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
              value={filter.shareClass ?? ALL_SENTINEL}
              onValueChange={(next) =>
                setFilter({
                  shareClass: next === ALL_SENTINEL ? null : (next as keyof typeof SHARE_CLASS_LABEL),
                })
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
              value={filter.instrumentType ?? ALL_SENTINEL}
              onValueChange={(next) =>
                setFilter({
                  instrumentType: next === ALL_SENTINEL ? null : (next as InstrumentTypeV2),
                })
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

function ActiveFilterBadges() {
  const { filter } = useDashboardFilter();
  const chips: string[] = [];
  if (filter.family) chips.push(filter.family);
  if (filter.archetype) chips.push(filter.archetype);
  if (filter.venueSetVariant) chips.push(filter.venueSetVariant);
  if (filter.shareClass) chips.push(SHARE_CLASS_LABEL[filter.shareClass]);
  if (filter.instrumentType) chips.push(INSTRUMENT_TYPE_LABEL[filter.instrumentType]);
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
