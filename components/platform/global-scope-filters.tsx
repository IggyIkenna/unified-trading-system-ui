"use client";

/**
 * GlobalScopeFilters — top-bar Org / Client / Family→Archetype / Strategy.
 *
 * 4-pill design (architecture-v2). The legacy "All Families" pill (which was
 * actually a 5-asset-group filter) is removed; identity is now expressed via
 * the v2 strategy taxonomy (8 families × 18 archetypes).
 *
 * The asset-group filter is preserved at the data layer via `scope.assetGroupIds`
 * so a future Asset Class pill can be reintroduced as a single-component edit
 * (see docs/audits/global-filters-v2.md §10).
 *
 * For internal users: shows Org + Client.
 * For external clients: org locks to the user's org (read-only chip).
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import { ARCHETYPE_TO_FAMILY, FAMILY_METADATA, STRATEGY_FAMILIES_V2 } from "@/lib/architecture-v2";
import type { StrategyArchetype, StrategyFamily } from "@/lib/architecture-v2";
import {
  checkTradingEntitlement,
  type EntitlementOrWildcard,
  type StrategyFamilyEntitlement,
  type TradingEntitlement,
} from "@/lib/config/auth";
import {
  CLIENTS as TRADING_CLIENTS,
  ORGANIZATIONS as TRADING_ORGS,
  STRATEGIES as TRADING_STRATEGIES,
} from "@/lib/mocks/fixtures/trading-data";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { formatArchetype, formatFamily } from "@/lib/strategy-display";
import { cn } from "@/lib/utils";
import { BarChart3, Building2, Check, ChevronDown, ChevronRight, ListTree, Users, X } from "lucide-react";
import * as React from "react";

interface Organization {
  id: string;
  name: string;
}
interface Client {
  id: string;
  name: string;
  orgId: string;
  status: "active" | "onboarding" | "inactive";
}
interface Strategy {
  id: string;
  name: string;
  clientId: string;
  assetClass: string;
  archetype: string;
  status: "live" | "paused" | "warning" | "stopped" | "error";
}

const organizations: Organization[] = TRADING_ORGS.map((o) => ({
  id: o.id,
  name: o.name,
}));
const clients: Client[] = TRADING_CLIENTS.map((c) => ({
  id: c.id,
  name: c.name,
  orgId: c.orgId,
  status: c.status,
}));
const strategies: Strategy[] = TRADING_STRATEGIES.map((s) => ({
  id: s.id,
  name: s.name,
  clientId: s.clientId,
  assetClass: s.assetClass,
  archetype: s.archetype,
  status: s.status,
}));

// ─────────────────────────────────────────────────────────────────────────────
// CompactMultiSelect — generic checkbox-popover for Org / Client / Strategy
// ─────────────────────────────────────────────────────────────────────────────

function CompactMultiSelect<T extends { id: string }>({
  icon,
  items,
  selectedIds,
  onSelectionChange,
  renderItem,
  allLabel = "All",
  groupBy,
  getGroupLabel,
  dropdownWidthClass = "w-64",
}: {
  icon: React.ReactNode;
  items: T[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  renderItem: (item: T) => React.ReactNode;
  allLabel?: string;
  groupBy?: (item: T) => string;
  getGroupLabel?: (group: string) => string;
  dropdownWidthClass?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});
  const isAllSelected = selectedIds.length === 0;
  const selectedCount = selectedIds.length;

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const selectAll = () => onSelectionChange([]);

  const getDisplayText = () => {
    if (isAllSelected) return allLabel;
    if (selectedCount === 1) {
      const item = items.find((i) => i.id === selectedIds[0]);
      return item ? (item as unknown as { name?: string }).name || item.id : selectedIds[0];
    }
    return `${selectedCount} selected`;
  };

  const groupedItems = React.useMemo(() => {
    if (!groupBy) return { default: items };
    const groups: Record<string, T[]> = {};
    items.forEach((item) => {
      const group = groupBy(item);
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    return groups;
  }, [items, groupBy]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 gap-1 px-2 text-xs",
            !isAllSelected ? "text-foreground font-medium" : "text-muted-foreground",
          )}
        >
          {icon}
          <span className="hidden sm:inline max-w-20 truncate">{getDisplayText()}</span>
          {selectedCount > 1 && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">
              {selectedCount}
            </Badge>
          )}
          <ChevronDown className="size-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn(dropdownWidthClass, "p-0 max-h-[35vh] overflow-hidden")}>
        <div className="max-h-[35vh] overflow-x-hidden overflow-y-auto overscroll-contain">
          <div className="p-1">
            <div
              role="button"
              tabIndex={0}
              onClick={selectAll}
              onKeyDown={(e) => e.key === "Enter" && selectAll()}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-secondary cursor-pointer",
                isAllSelected && "bg-secondary",
              )}
            >
              <span
                className={cn(
                  "size-4 rounded border flex items-center justify-center shrink-0",
                  isAllSelected ? "bg-primary border-primary" : "border-input",
                )}
              >
                {isAllSelected && <Check className="size-3 text-primary-foreground" />}
              </span>
              <span className="text-muted-foreground">{allLabel}</span>
            </div>
            <div className="h-px bg-border my-1" />
            {groupBy
              ? Object.entries(groupedItems)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([group, groupItems]) => {
                    const groupIds = groupItems.map((i) => i.id);
                    const allGroupSelected = groupIds.every((id) => selectedIds.includes(id));
                    const someGroupSelected = groupIds.some((id) => selectedIds.includes(id));
                    const toggleGroup = () => {
                      if (allGroupSelected) {
                        onSelectionChange(selectedIds.filter((id) => !groupIds.includes(id)));
                      } else {
                        onSelectionChange([...new Set([...selectedIds, ...groupIds])]);
                      }
                    };
                    const isCollapsed = collapsedGroups[group] !== false;
                    return (
                      <div
                        key={group}
                        className="border-b border-border/50 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0"
                      >
                        <div className="flex items-stretch gap-0.5">
                          <button
                            type="button"
                            className="shrink-0 flex items-center justify-center px-1 rounded hover:bg-secondary/80 text-muted-foreground"
                            aria-expanded={!isCollapsed}
                            aria-label={isCollapsed ? `Expand ${group}` : `Collapse ${group}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCollapsedGroups((c) => ({
                                ...c,
                                [group]: !isCollapsed,
                              }));
                            }}
                          >
                            <ChevronRight
                              className={cn("size-3.5 transition-transform duration-150", !isCollapsed && "rotate-90")}
                            />
                          </button>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={toggleGroup}
                            onKeyDown={(e) => e.key === "Enter" && toggleGroup()}
                            className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1 cursor-pointer hover:bg-secondary/50 rounded"
                          >
                            <span
                              className={cn(
                                "size-3.5 rounded border flex items-center justify-center shrink-0",
                                allGroupSelected
                                  ? "bg-primary border-primary"
                                  : someGroupSelected
                                    ? "bg-primary/50 border-primary"
                                    : "border-input",
                              )}
                            >
                              {(allGroupSelected || someGroupSelected) && (
                                <Check className="size-2.5 text-primary-foreground" />
                              )}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                              {getGroupLabel ? getGroupLabel(group) : group}
                            </span>
                            <span className="text-[10px] text-muted-foreground/50 ml-auto shrink-0">
                              {groupItems.length}
                            </span>
                          </div>
                        </div>
                        {!isCollapsed &&
                          groupItems.map((item) => {
                            const isSelected = selectedIds.includes(item.id);
                            return (
                              <div
                                key={item.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => toggleItem(item.id)}
                                onKeyDown={(e) => e.key === "Enter" && toggleItem(item.id)}
                                className={cn(
                                  "w-full min-w-0 flex items-center gap-2 pl-7 pr-2 py-1.5 rounded text-sm hover:bg-secondary cursor-pointer",
                                  isSelected && "bg-secondary",
                                )}
                              >
                                <span
                                  className={cn(
                                    "size-4 rounded border flex items-center justify-center shrink-0",
                                    isSelected ? "bg-primary border-primary" : "border-input",
                                  )}
                                >
                                  {isSelected && <Check className="size-3 text-primary-foreground" />}
                                </span>
                                {renderItem(item)}
                              </div>
                            );
                          })}
                      </div>
                    );
                  })
              : items.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleItem(item.id)}
                      onKeyDown={(e) => e.key === "Enter" && toggleItem(item.id)}
                      className={cn(
                        "w-full min-w-0 flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-secondary cursor-pointer",
                        isSelected && "bg-secondary",
                      )}
                    >
                      <span
                        className={cn(
                          "size-4 rounded border flex items-center justify-center shrink-0",
                          isSelected ? "bg-primary border-primary" : "border-input",
                        )}
                      >
                        {isSelected && <Check className="size-3 text-primary-foreground" />}
                      </span>
                      {renderItem(item)}
                    </div>
                  );
                })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FamilyArchetypeMultiSelect — grouped checkbox dropdown for the v2 taxonomy
//
// Family rows are tri-state checkboxes that select / deselect every archetype
// under them. Archetype rows toggle independently. The pill label collapses to
// the family or archetype name when only one is picked, otherwise "N selected".
// ─────────────────────────────────────────────────────────────────────────────

function FamilyArchetypeMultiSelect({
  archetypeIds,
  onChange,
}: {
  archetypeIds: string[];
  onChange: (nextArchetypeIds: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({});

  const isAll = archetypeIds.length === 0;
  const archetypeSet = React.useMemo(() => new Set(archetypeIds), [archetypeIds]);

  // Derive "fully-selected families" — every archetype of the family is in the
  // selection. Counts/labels lean on this so we don't need a parallel familyIds
  // array (which is what caused the off-by-one count bug).
  const fullySelectedFamilies = React.useMemo(() => {
    return STRATEGY_FAMILIES_V2.filter((f) => {
      const archs = FAMILY_METADATA[f].archetypes;
      return archs.length > 0 && archs.every((a) => archetypeSet.has(a));
    });
  }, [archetypeSet]);

  const display = (() => {
    if (isAll) return "All families";
    // If the user picked exactly one full family (and nothing else outside it), show its name.
    if (fullySelectedFamilies.length === 1) {
      const family = fullySelectedFamilies[0];
      const familyArchs = FAMILY_METADATA[family].archetypes;
      if (archetypeIds.length === familyArchs.length) return formatFamily(family);
    }
    // Single archetype pick — show its name.
    if (archetypeIds.length === 1) return formatArchetype(archetypeIds[0]);
    return `${archetypeIds.length} selected`;
  })();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-7 gap-1 px-2 text-xs", !isAll ? "text-foreground font-medium" : "text-muted-foreground")}
        >
          <ListTree className="size-3 text-violet-400" />
          <span className="hidden sm:inline max-w-32 truncate">{display}</span>
          {archetypeIds.length > 1 && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">
              {archetypeIds.length}
            </Badge>
          )}
          <ChevronDown className="size-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[20rem] p-0 max-h-[50vh] overflow-hidden">
        <div className="max-h-[50vh] overflow-y-auto overscroll-contain p-1">
          <div
            role="button"
            tabIndex={0}
            onClick={() => onChange([])}
            onKeyDown={(e) => e.key === "Enter" && onChange([])}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-secondary cursor-pointer",
              isAll && "bg-secondary",
            )}
          >
            <span
              className={cn(
                "size-4 rounded border flex items-center justify-center shrink-0",
                isAll ? "bg-primary border-primary" : "border-input",
              )}
            >
              {isAll && <Check className="size-3 text-primary-foreground" />}
            </span>
            <span className="text-muted-foreground">All families</span>
          </div>
          <div className="h-px bg-border my-1" />
          {STRATEGY_FAMILIES_V2.map((family) => {
            const meta = FAMILY_METADATA[family];
            const archetypes = meta.archetypes;
            const selectedCount = archetypes.filter((a) => archetypeSet.has(a)).length;
            const allSelected = archetypes.length > 0 && selectedCount === archetypes.length;
            const someSelected = selectedCount > 0 && !allSelected;
            const isCollapsed = collapsed[family] === true;

            const toggleFamily = () => {
              if (allSelected) {
                onChange(archetypeIds.filter((a) => !(archetypes as readonly string[]).includes(a)));
              } else {
                const others = archetypeIds.filter((a) => !(archetypes as readonly string[]).includes(a));
                onChange([...others, ...archetypes]);
              }
            };

            const toggleArchetype = (archetype: StrategyArchetype) => {
              if (archetypeSet.has(archetype)) {
                onChange(archetypeIds.filter((a) => a !== archetype));
              } else {
                onChange([...archetypeIds, archetype]);
              }
            };

            return (
              <div key={family} className="border-b border-border/50 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                <div className="flex items-stretch gap-0.5">
                  <button
                    type="button"
                    className="shrink-0 flex items-center justify-center px-1 rounded hover:bg-secondary/80 text-muted-foreground"
                    aria-expanded={!isCollapsed}
                    aria-label={isCollapsed ? `Expand ${meta.label}` : `Collapse ${meta.label}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCollapsed((c) => ({ ...c, [family]: !isCollapsed }));
                    }}
                  >
                    <ChevronRight
                      className={cn("size-3.5 transition-transform duration-150", !isCollapsed && "rotate-90")}
                    />
                  </button>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={toggleFamily}
                    onKeyDown={(e) => e.key === "Enter" && toggleFamily()}
                    className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1 cursor-pointer hover:bg-secondary/50 rounded"
                  >
                    <span
                      className={cn(
                        "size-3.5 rounded border flex items-center justify-center shrink-0",
                        allSelected
                          ? "bg-primary border-primary"
                          : someSelected
                            ? "bg-primary/50 border-primary"
                            : "border-input",
                      )}
                    >
                      {(allSelected || someSelected) && <Check className="size-2.5 text-primary-foreground" />}
                    </span>
                    <span className="text-[10px] font-semibold text-foreground/80 uppercase tracking-wider truncate">
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50 ml-auto shrink-0">{archetypes.length}</span>
                  </div>
                </div>
                {!isCollapsed &&
                  archetypes.map((archetype) => {
                    const isSelected = archetypeIds.includes(archetype);
                    return (
                      <div
                        key={archetype}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleArchetype(archetype)}
                        onKeyDown={(e) => e.key === "Enter" && toggleArchetype(archetype)}
                        className={cn(
                          "w-full flex items-center gap-2 pl-7 pr-2 py-1.5 rounded text-sm hover:bg-secondary cursor-pointer",
                          isSelected && "bg-secondary",
                        )}
                      >
                        <span
                          className={cn(
                            "size-4 rounded border flex items-center justify-center shrink-0",
                            isSelected ? "bg-primary border-primary" : "border-input",
                          )}
                        >
                          {isSelected && <Check className="size-3 text-primary-foreground" />}
                        </span>
                        <span className="text-sm">{formatArchetype(archetype)}</span>
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Asset classes a user is entitled to see, derived from their entitlements. */
function entitlementAssetClasses(
  userEnts: readonly (EntitlementOrWildcard | TradingEntitlement | StrategyFamilyEntitlement)[],
): Set<string> {
  const allowed = new Set<string>();
  if (checkTradingEntitlement(userEnts, { domain: "trading-defi", tier: "basic" })) allowed.add("DeFi");
  if (checkTradingEntitlement(userEnts, { domain: "trading-sports", tier: "basic" })) allowed.add("Sports");
  if (checkTradingEntitlement(userEnts, { domain: "trading-predictions", tier: "basic" })) allowed.add("Prediction");
  if (checkTradingEntitlement(userEnts, { domain: "trading-common", tier: "basic" })) {
    allowed.add("CeFi");
    allowed.add("TradFi");
  }
  return allowed;
}

/** Return strategies that match the v2 archetype selection. */
function filterByArchetype(list: Strategy[], archetypeIds: readonly string[]): Strategy[] {
  if (archetypeIds.length === 0) return list;
  const archetypeSet = new Set(archetypeIds);
  return list.filter((s) => {
    // Mock data uses kebab-case archetype labels; match by token prefix.
    const token = s.archetype.split("-")[0];
    for (const a of archetypeSet) {
      if ((a as StrategyArchetype).toLowerCase().startsWith(token.toLowerCase())) return true;
    }
    return false;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// GlobalScopeFilters
// ─────────────────────────────────────────────────────────────────────────────

export function GlobalScopeFilters({ className }: { className?: string }) {
  const { isInternal, user } = useAuth();
  const { scope, setOrganizationIds, setClientIds, setStrategyIds, setStrategyArchetypeIds, clearAll } =
    useGlobalScope();

  const internalUser = isInternal();
  const isClientScoped = !internalUser && !!user?.org;

  /**
   * Auto-initialize scope for client-scoped users whose org is in the mock
   * data hierarchy. This ensures all data contexts (positions, orders, etc.)
   * filter to the client's org on first mount rather than showing all data.
   */
  React.useEffect(() => {
    if (!isClientScoped || !user?.org?.id) return;
    const orgId = user.org.id;
    const orgExists = organizations.some((o) => o.id === orgId);
    if (!orgExists) return;
    if (!scope.organizationIds.includes(orgId)) {
      setOrganizationIds([orgId]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClientScoped, user?.org?.id]);

  /**
   * Strategies visible to external clients.
   *
   * Primary: filter by org membership in the mock trading-data hierarchy.
   * Fallback: if the persona's org isn't in the mock hierarchy (e.g. "elysium"),
   * filter by entitlement-derived asset classes so DeFi-only clients see only
   * DeFi strategies, sports-only clients see only sports strategies, etc.
   */
  const clientOrgStrategies = React.useMemo(() => {
    const orgId = user?.org?.id;
    if (!isClientScoped || !orgId) return [];
    const orgClientIds = clients.filter((c) => c.orgId === orgId).map((c) => c.id);
    const orgStrategies = strategies.filter((s) => orgClientIds.includes(s.clientId));
    if (orgStrategies.length > 0) return orgStrategies;
    const allowed = entitlementAssetClasses(user?.entitlements ?? []);
    return strategies.filter((s) => allowed.has(s.assetClass));
  }, [isClientScoped, user?.org?.id, user?.entitlements]);

  const filteredClients = React.useMemo(() => {
    if (scope.organizationIds.length === 0) return clients;
    return clients.filter((c) => scope.organizationIds.includes(c.orgId));
  }, [scope.organizationIds]);

  const filteredStrategies = React.useMemo(() => {
    let result = strategies;
    if (scope.organizationIds.length > 0) {
      const orgClientIds = clients.filter((c) => scope.organizationIds.includes(c.orgId)).map((c) => c.id);
      result = result.filter((s) => orgClientIds.includes(s.clientId));
    }
    if (scope.clientIds.length > 0) {
      result = result.filter((s) => scope.clientIds.includes(s.clientId));
    }
    // Asset-group filter is no longer surfaced as a pill but the field is
    // honoured at the data layer for reversibility (see docs/audits/global-filters-v2.md §10).
    if (scope.assetGroupIds.length > 0) {
      result = result.filter((s) => scope.assetGroupIds.includes(s.assetClass));
    }
    result = filterByArchetype(result, scope.strategyArchetypeIds);
    return result;
  }, [scope.organizationIds, scope.clientIds, scope.assetGroupIds, scope.strategyArchetypeIds]);

  const activeFilters = [
    scope.organizationIds.length > 0,
    scope.clientIds.length > 0,
    scope.strategyIds.length > 0,
    scope.strategyArchetypeIds.length > 0,
  ].filter(Boolean).length;

  if (isClientScoped && user?.org) {
    const clientScopeActiveFilters =
      (scope.strategyIds.length > 0 ? 1 : 0) + (scope.strategyArchetypeIds.length > 0 ? 1 : 0);
    return (
      <div className={cn("flex items-center gap-0.5", className)}>
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 text-xs text-muted-foreground">
          <Building2 className="size-3" />
          <span className="font-medium text-foreground">{user.org.name}</span>
        </div>
        <span className="text-muted-foreground/30 text-xs hidden sm:inline">/</span>
        <FamilyArchetypeMultiSelect
          archetypeIds={scope.strategyArchetypeIds}
          onChange={(next) => {
            setStrategyArchetypeIds(next);
            setStrategyIds([]);
          }}
        />
        <span className="text-muted-foreground/30 text-xs hidden sm:inline">/</span>
        <CompactMultiSelect
          icon={<BarChart3 className="size-3" />}
          items={filterByArchetype(clientOrgStrategies, scope.strategyArchetypeIds)}
          selectedIds={scope.strategyIds}
          onSelectionChange={setStrategyIds}
          allLabel="All Strategies"
          groupBy={(s) => s.assetClass}
          getGroupLabel={(g) => g}
          renderItem={(strategy) => (
            <span className="flex min-w-0 items-center gap-2 flex-1">
              <span
                className={cn(
                  "size-2 rounded-full shrink-0",
                  strategy.status === "live" && "bg-emerald-500",
                  strategy.status === "paused" && "bg-zinc-500",
                  strategy.status === "warning" && "bg-amber-500",
                )}
              />
              <span className="flex-1 min-w-0 truncate">{strategy.name}</span>
              <span className="text-[10px] text-muted-foreground shrink-0 max-w-[10rem] truncate">
                {strategy.archetype}
              </span>
            </span>
          )}
          dropdownWidthClass="w-[32rem]"
        />
        {clientScopeActiveFilters > 0 && (
          <>
            <div className="w-px h-4 bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
              onClick={() => {
                setStrategyIds([]);
                setStrategyArchetypeIds([]);
              }}
            >
              <X className="size-3 mr-0.5" />
              Clear
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-0.5", className)}>
      <CompactMultiSelect
        icon={<Building2 className="size-3 text-primary" />}
        items={organizations}
        selectedIds={scope.organizationIds}
        onSelectionChange={(ids) => {
          setOrganizationIds(ids);
          setClientIds([]);
          setStrategyIds([]);
        }}
        allLabel="All Orgs"
        renderItem={(org) => (
          <span className="flex items-center gap-2 flex-1">
            <Building2 className="size-3 text-muted-foreground" />
            {org.name}
          </span>
        )}
        dropdownWidthClass="w-64"
      />
      <span className="text-muted-foreground/30 text-xs hidden md:inline">/</span>
      <CompactMultiSelect
        icon={<Users className="size-3" />}
        items={filteredClients}
        selectedIds={scope.clientIds}
        onSelectionChange={(ids) => {
          setClientIds(ids);
          setStrategyIds([]);
        }}
        allLabel="All Clients"
        renderItem={(client) => (
          <span className="flex items-center gap-2 flex-1">
            <span
              className={cn(
                "size-2 rounded-full",
                client.status === "active" && "bg-emerald-500",
                client.status === "onboarding" && "bg-amber-500",
                client.status === "inactive" && "bg-zinc-500",
              )}
            />
            {client.name}
          </span>
        )}
        dropdownWidthClass="w-64"
      />
      <span className="text-muted-foreground/30 text-xs hidden md:inline">/</span>
      <FamilyArchetypeMultiSelect
        archetypeIds={scope.strategyArchetypeIds}
        onChange={(next) => {
          setStrategyArchetypeIds(next);
          setStrategyIds([]);
        }}
      />
      <span className="text-muted-foreground/30 text-xs hidden md:inline">/</span>
      <CompactMultiSelect
        icon={<BarChart3 className="size-3" />}
        items={filteredStrategies}
        selectedIds={scope.strategyIds}
        onSelectionChange={setStrategyIds}
        allLabel="All Strategies"
        groupBy={(s) => s.assetClass}
        getGroupLabel={(g) => g}
        renderItem={(strategy) => (
          <span className="flex items-center gap-2 flex-1">
            <span
              className={cn(
                "size-2 rounded-full",
                strategy.status === "live" && "bg-emerald-500",
                strategy.status === "paused" && "bg-zinc-500",
                strategy.status === "warning" && "bg-amber-500",
              )}
            />
            <span className="flex-1 truncate">{strategy.name}</span>
            <span className="text-[10px] text-muted-foreground">{strategy.archetype}</span>
          </span>
        )}
        dropdownWidthClass="w-[32rem]"
      />

      {activeFilters > 0 && (
        <>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={clearAll}
          >
            <X className="size-3 mr-0.5" />
            Clear
          </Button>
        </>
      )}
    </div>
  );
}
