"use client";

/**
 * FamilyArchetypePicker — cascading family → archetype → optional strategy-id
 * dropdown used across trading terminal, strategy catalogue, research, signals
 * dashboard, and order / position / P&L surfaces.
 *
 * Phase 3 of `ui_unification_v2_sanitisation_2026_04_20.plan.md`.
 *
 * Props:
 *   - value:                  current {family, archetype, strategyId} selection
 *   - onChange:               emitted with the full selection object on every change
 *   - showStrategyIdDropdown: when true, shows a third dropdown of representative
 *                             slot labels filtered by the picked archetype
 *   - availabilityFilter:     "allowed" (default) hides archetypes whose
 *                             representative slots are all invisible to the
 *                             current persona audience; "all" shows everything
 *   - idPrefix:               optional prefix for data-testid values so multiple
 *                             pickers can coexist on the same page
 *   - showAllOption:          when true, includes an "(All)" option for each
 *                             dropdown — the default for filter surfaces
 *
 * Consumers: see `ui_unification_v2_sanitisation_2026_04_20.plan.md` phase 3.
 */

import { useContext, useMemo } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ARCHETYPE_COVERAGE,
  ARCHETYPE_TO_FAMILY,
  AvailabilityStoreContext,
  FAMILY_METADATA,
  STRATEGY_FAMILIES_V2,
} from "@/lib/architecture-v2";
import type {
  StrategyArchetype,
  StrategyAvailabilityEntry,
  StrategyFamily,
} from "@/lib/architecture-v2";
import { audienceForPersonaId } from "@/lib/auth/audience-from-persona";
import { useAuth } from "@/hooks/use-auth";

export interface FamilyArchetypeSelection {
  readonly family?: StrategyFamily;
  readonly archetype?: StrategyArchetype;
  readonly strategyId?: string;
}

export interface FamilyArchetypePickerProps {
  readonly value: FamilyArchetypeSelection;
  readonly onChange: (next: FamilyArchetypeSelection) => void;
  readonly showStrategyIdDropdown?: boolean;
  readonly availabilityFilter?: "allowed" | "all";
  readonly idPrefix?: string;
  readonly showAllOption?: boolean;
  readonly className?: string;
}

const ALL_SENTINEL = "__all__" as const;

function collectSlotLabels(archetype: StrategyArchetype): readonly string[] {
  const coverage = ARCHETYPE_COVERAGE[archetype];
  if (!coverage) return [];
  const out: string[] = [];
  for (const cell of coverage.cells) {
    for (const slot of cell.representativeSlotLabels) {
      if (!out.includes(slot)) out.push(slot);
    }
  }
  return out;
}

export function FamilyArchetypePicker({
  value,
  onChange,
  showStrategyIdDropdown = false,
  availabilityFilter = "allowed",
  idPrefix = "",
  showAllOption = true,
  className,
}: FamilyArchetypePickerProps) {
  const { user } = useAuth();
  const availabilityCtx = useContext(AvailabilityStoreContext);
  const entries: Readonly<Record<string, StrategyAvailabilityEntry>> =
    availabilityCtx?.entries ?? {};

  const audience = audienceForPersonaId(user?.id ?? null, user?.role);

  // Determine allowed archetypes: if availabilityFilter === "allowed" AND
  // audience is non-admin, hide archetypes whose every representative slot is
  // not visible to the current audience (IM_RESERVED + RETIRED + pre-BACKTESTED
  // are hidden for trading_platform_subscriber + im_client).
  const allowedArchetypes = useMemo<readonly StrategyArchetype[]>(() => {
    if (availabilityFilter === "all" || audience === "admin") {
      return Object.keys(ARCHETYPE_COVERAGE) as StrategyArchetype[];
    }
    const keep: StrategyArchetype[] = [];
    for (const archetype of Object.keys(
      ARCHETYPE_COVERAGE,
    ) as StrategyArchetype[]) {
      const slots = collectSlotLabels(archetype);
      if (slots.length === 0) {
        // No representative slots declared yet — treat as visible so research /
        // catalogue surfaces do not go blank during early coverage expansion.
        keep.push(archetype);
        continue;
      }
      // Archetype is visible if at least one of its representative slots is
      // visible under the current audience.
      const someVisible = slots.some((slot) => {
        const entry =
          entries[slot] ??
          // default entry = PUBLIC / LIVE_ALLOCATED, always visible to all
          null;
        if (entry === null) return true;
        if (entry.lockState === "RETIRED") return false;
        if (entry.lockState === "PUBLIC") return true;
        if (entry.lockState === "INVESTMENT_MANAGEMENT_RESERVED") {
          // hidden from trading_platform_subscriber + im_client
          return audience === "im_desk";
        }
        // CLIENT_EXCLUSIVE — visible only to the owning client; for the picker
        // we conservatively hide.
        return false;
      });
      if (someVisible) keep.push(archetype);
    }
    return keep;
  }, [availabilityFilter, audience, entries]);

  const visibleFamilies = useMemo<readonly StrategyFamily[]>(() => {
    const families = new Set<StrategyFamily>();
    for (const archetype of allowedArchetypes) {
      families.add(ARCHETYPE_TO_FAMILY[archetype]);
    }
    return STRATEGY_FAMILIES_V2.filter((f) => families.has(f));
  }, [allowedArchetypes]);

  const archetypesForFamily = useMemo<readonly StrategyArchetype[]>(() => {
    if (!value.family) return [];
    return allowedArchetypes.filter(
      (a) => ARCHETYPE_TO_FAMILY[a] === value.family,
    );
  }, [value.family, allowedArchetypes]);

  const strategyIds = useMemo<readonly string[]>(() => {
    if (!value.archetype) return [];
    return collectSlotLabels(value.archetype);
  }, [value.archetype]);

  const familySelect = value.family ?? (showAllOption ? ALL_SENTINEL : "");
  const archetypeSelect =
    value.archetype ?? (showAllOption ? ALL_SENTINEL : "");
  const strategyIdSelect =
    value.strategyId ?? (showAllOption ? ALL_SENTINEL : "");

  const handleFamilyChange = (next: string) => {
    if (next === ALL_SENTINEL || next === "") {
      onChange({});
      return;
    }
    onChange({ family: next as StrategyFamily });
  };

  const handleArchetypeChange = (next: string) => {
    if (next === ALL_SENTINEL || next === "") {
      onChange({ family: value.family });
      return;
    }
    const archetype = next as StrategyArchetype;
    const family = ARCHETYPE_TO_FAMILY[archetype];
    onChange({ family, archetype });
  };

  const handleStrategyIdChange = (next: string) => {
    if (next === ALL_SENTINEL || next === "") {
      onChange({ family: value.family, archetype: value.archetype });
      return;
    }
    onChange({
      family: value.family,
      archetype: value.archetype,
      strategyId: next,
    });
  };

  const testIdPrefix = idPrefix.length > 0 ? `${idPrefix}-` : "";

  return (
    <div
      className={
        className ??
        "flex flex-col gap-2 md:flex-row md:items-center md:gap-3"
      }
      data-testid={`${testIdPrefix}family-archetype-picker`}
    >
      <Select value={familySelect} onValueChange={handleFamilyChange}>
        <SelectTrigger
          className="w-full md:w-56"
          data-testid={`${testIdPrefix}family-select`}
          aria-label="Strategy family"
        >
          <SelectValue placeholder="Family" />
        </SelectTrigger>
        <SelectContent>
          {showAllOption ? (
            <SelectItem value={ALL_SENTINEL}>All families</SelectItem>
          ) : null}
          {visibleFamilies.length === 0 ? (
            <SelectItem value="__empty__" disabled>
              No families available
            </SelectItem>
          ) : null}
          {visibleFamilies.map((family) => (
            <SelectItem key={family} value={family}>
              {FAMILY_METADATA[family]?.label ?? family}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={archetypeSelect}
        onValueChange={handleArchetypeChange}
        disabled={!value.family}
      >
        <SelectTrigger
          className="w-full md:w-64"
          data-testid={`${testIdPrefix}archetype-select`}
          aria-label="Strategy archetype"
        >
          <SelectValue placeholder="Archetype" />
        </SelectTrigger>
        <SelectContent>
          {showAllOption ? (
            <SelectItem value={ALL_SENTINEL}>All archetypes</SelectItem>
          ) : null}
          {archetypesForFamily.length === 0 ? (
            <SelectItem value="__empty__" disabled>
              Pick a family first
            </SelectItem>
          ) : null}
          {archetypesForFamily.map((archetype) => (
            <SelectItem key={archetype} value={archetype}>
              {archetype}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showStrategyIdDropdown ? (
        <Select
          value={strategyIdSelect}
          onValueChange={handleStrategyIdChange}
          disabled={!value.archetype}
        >
          <SelectTrigger
            className="w-full md:w-80"
            data-testid={`${testIdPrefix}strategy-id-select`}
            aria-label="Strategy id"
          >
            <SelectValue placeholder="Strategy id" />
          </SelectTrigger>
          <SelectContent>
            {showAllOption ? (
              <SelectItem value={ALL_SENTINEL}>All strategies</SelectItem>
            ) : null}
            {strategyIds.length === 0 ? (
              <SelectItem value="__empty__" disabled>
                {value.archetype
                  ? "No representative slots for archetype"
                  : "Pick an archetype first"}
              </SelectItem>
            ) : null}
            {strategyIds.map((slot) => (
              <SelectItem key={slot} value={slot} className="font-mono text-xs">
                {slot}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
    </div>
  );
}
