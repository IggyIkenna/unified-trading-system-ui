"use client";

/**
 * GlobalScopeFilters — Org / Client / Strategy selectors for Row 1 (lifecycle nav).
 * These are the global data-scoping controls that sit between the lifecycle tabs
 * and the user controls on the right side of the top bar.
 *
 * For internal users: shows all orgs, clients, strategies.
 * For external clients: auto-scoped to their org (selector hidden or read-only).
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/use-auth";
import {
  CLIENTS as TRADING_CLIENTS,
  ORGANIZATIONS as TRADING_ORGS,
  STRATEGIES as TRADING_STRATEGIES,
} from "@/lib/mocks/fixtures/trading-data";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { cn } from "@/lib/utils";
import { BarChart3, Building2, Check, ChevronDown, ChevronRight, Layers, Users, X } from "lucide-react";
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
  strategyType: string;
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
  strategyType: s.archetype,
  status: s.status,
}));

interface StrategyFamily {
  id: string;
  name: string;
  color: string;
}

const STRATEGY_FAMILIES: StrategyFamily[] = [
  { id: "DeFi", name: "DeFi", color: "bg-violet-500" },
  { id: "CeFi", name: "CeFi", color: "bg-sky-500" },
  { id: "TradFi", name: "TradFi", color: "bg-amber-500" },
  { id: "Sports", name: "Sports", color: "bg-emerald-500" },
  { id: "Prediction", name: "Prediction", color: "bg-rose-500" },
];

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
  /** When true, category rows are collapsed and strategy rows are hidden. */
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
        <div className="max-h-[35vh] overflow-y-auto overscroll-contain">
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
                                [group]: !c[group],
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
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-secondary cursor-pointer",
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

export function GlobalScopeFilters({ className }: { className?: string }) {
  const { isInternal, user } = useAuth();
  const { scope, setOrganizationIds, setClientIds, setStrategyIds, setStrategyFamilyIds, clearAll } = useGlobalScope();

  const internalUser = isInternal();
  const isClientScoped = !internalUser && !!user?.org;

  /** Strategies visible to external clients: same mock list, restricted to the signed-in org. */
  const clientOrgStrategies = React.useMemo(() => {
    const orgId = user?.org?.id;
    if (!isClientScoped || !orgId) return [];
    const orgClientIds = clients.filter((c) => c.orgId === orgId).map((c) => c.id);
    return strategies.filter((s) => orgClientIds.includes(s.clientId));
  }, [isClientScoped, user?.org?.id]);

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
    if (scope.strategyFamilyIds.length > 0) {
      result = result.filter((s) => scope.strategyFamilyIds.includes(s.assetClass));
    }
    return result;
  }, [scope.organizationIds, scope.clientIds, scope.strategyFamilyIds]);

  const activeFilters = [
    scope.organizationIds.length > 0,
    scope.clientIds.length > 0,
    scope.strategyIds.length > 0,
    scope.strategyFamilyIds.length > 0,
  ].filter(Boolean).length;

  if (isClientScoped && user?.org) {
    const clientScopeActiveFilters = scope.strategyIds.length > 0 ? 1 : 0;
    return (
      <div className={cn("flex items-center gap-0.5", className)}>
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 text-xs text-muted-foreground">
          <Building2 className="size-3" />
          <span className="font-medium text-foreground">{user.org.name}</span>
        </div>
        <span className="text-muted-foreground/30 text-xs hidden sm:inline">/</span>
        <CompactMultiSelect
          icon={<BarChart3 className="size-3" />}
          items={clientOrgStrategies}
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
              <span className="text-[10px] text-muted-foreground">{strategy.strategyType}</span>
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
              onClick={() => setStrategyIds([])}
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
      <CompactMultiSelect
        icon={<Layers className="size-3 text-violet-400" />}
        items={STRATEGY_FAMILIES}
        selectedIds={scope.strategyFamilyIds}
        onSelectionChange={(ids) => {
          setStrategyFamilyIds(ids);
          setStrategyIds([]);
        }}
        allLabel="All Families"
        renderItem={(family) => (
          <span className="flex items-center gap-2 flex-1">
            <span className={cn("size-2 rounded-full", family.color)} />
            {family.name}
          </span>
        )}
        dropdownWidthClass="w-44"
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
            <span className="text-[10px] text-muted-foreground">{strategy.strategyType}</span>
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
