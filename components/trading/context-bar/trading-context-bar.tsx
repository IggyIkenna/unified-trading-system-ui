"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Building2, Users, BarChart3, Coins, X, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ORGANIZATIONS as TRADING_ORGS,
  CLIENTS as TRADING_CLIENTS,
  STRATEGIES as TRADING_STRATEGIES,
} from "@/lib/trading-data";
import { MultiSelectDropdown } from "./multi-select-dropdown";
import { ContextBarModeControls } from "./context-bar-mode-controls";
import type { Client, ContextBarProps, ContextState, Organization, Strategy, Underlying } from "./types";

const defaultOrganizations: Organization[] = TRADING_ORGS.map((o) => ({
  id: o.id,
  name: o.name,
}));

const defaultClients: Client[] = TRADING_CLIENTS.map((c) => ({
  id: c.id,
  name: c.name,
  orgId: c.orgId,
  status: c.status,
}));

const defaultStrategies: Strategy[] = TRADING_STRATEGIES.map((s) => ({
  id: s.id,
  name: s.name,
  clientId: s.clientId,
  assetClass: s.assetClass,
  strategyType: s.archetype,
  status: s.status,
}));

const defaultUnderlyings: Underlying[] = [
  { id: "btc", symbol: "BTC", name: "Bitcoin", type: "crypto" },
  { id: "eth", symbol: "ETH", name: "Ethereum", type: "crypto" },
  { id: "sol", symbol: "SOL", name: "Solana", type: "crypto" },
  { id: "usdt", symbol: "USDT", name: "Tether", type: "crypto" },
  { id: "spy", symbol: "SPY", name: "S&P 500 ETF", type: "equity" },
  { id: "qqq", symbol: "QQQ", name: "Nasdaq 100 ETF", type: "equity" },
  { id: "nvda", symbol: "NVDA", name: "NVIDIA", type: "equity" },
  { id: "nba", symbol: "NBA", name: "NBA Basketball", type: "sport" },
  { id: "nfl", symbol: "NFL", name: "NFL Football", type: "sport" },
  { id: "epl", symbol: "EPL", name: "English Premier League", type: "sport" },
  { id: "mlb", symbol: "MLB", name: "MLB Baseball", type: "sport" },
  { id: "elections", symbol: "ELEC", name: "Elections", type: "event" },
  { id: "fed", symbol: "FED", name: "Fed Decisions", type: "event" },
];

function getUnderlyingIcon(type: Underlying["type"]) {
  switch (type) {
    case "crypto":
      return <Coins className="size-3.5" />;
    case "equity":
      return <TrendingUp className="size-3.5" />;
    case "sport":
      return <Trophy className="size-3.5" />;
    case "event":
      return <BarChart3 className="size-3.5" />;
    default:
      return <Coins className="size-3.5" />;
  }
}

export function ContextBar({
  organizations = defaultOrganizations,
  clients = defaultClients,
  strategies = defaultStrategies,
  underlyings = defaultUnderlyings,
  context,
  onContextChange,
  availableLevels = {
    organization: true,
    client: true,
    strategy: true,
    underlying: true,
  },
  className,
}: ContextBarProps) {
  const filteredClients = React.useMemo(() => {
    if (context.organizationIds.length === 0) return clients;
    return clients.filter((c) => context.organizationIds.includes(c.orgId));
  }, [clients, context.organizationIds]);

  const filteredStrategies = React.useMemo(() => {
    let result = strategies;

    if (context.organizationIds.length > 0) {
      const orgClientIds = clients.filter((c) => context.organizationIds.includes(c.orgId)).map((c) => c.id);
      result = result.filter((s) => orgClientIds.includes(s.clientId));
    }

    if (context.clientIds.length > 0) {
      result = result.filter((s) => context.clientIds.includes(s.clientId));
    }

    return result;
  }, [strategies, clients, context.organizationIds, context.clientIds]);

  const filteredUnderlyings = React.useMemo(() => {
    const strategiesForUnderlyings =
      context.strategyIds.length > 0
        ? filteredStrategies.filter((s) => context.strategyIds.includes(s.id))
        : filteredStrategies;

    const usedUnderlyingSymbols = new Set<string>();
    strategiesForUnderlyings.forEach((s) => {
      const tradingStrategy = TRADING_STRATEGIES.find((ts) => ts.id === s.id);
      if (tradingStrategy?.underlyings) {
        tradingStrategy.underlyings.forEach((u) => usedUnderlyingSymbols.add(u.toUpperCase()));
      }
    });

    if (usedUnderlyingSymbols.size === 0) return underlyings;
    return underlyings.filter((u) => usedUnderlyingSymbols.has(u.symbol.toUpperCase()));
  }, [filteredStrategies, context.strategyIds, underlyings]);

  const activeFilters = [
    context.organizationIds.length > 0 && context.organizationIds.length < organizations.length,
    context.clientIds.length > 0,
    context.strategyIds.length > 0,
    context.underlyingIds.length > 0,
  ].filter(Boolean).length;

  return (
    <div className={cn("h-9 flex items-center gap-1 px-4 border-b border-border bg-[#111113] text-sm", className)}>
      <ContextBarModeControls context={context} onContextChange={onContextChange} />

      <div className="flex items-center gap-1">
        {availableLevels.organization && (
          <>
            <MultiSelectDropdown
              label="Organizations"
              icon={<Building2 className="size-3.5 text-primary" />}
              items={organizations}
              selectedIds={context.organizationIds}
              onSelectionChange={(ids) =>
                onContextChange({
                  ...context,
                  organizationIds: ids,
                  clientIds: [],
                  strategyIds: [],
                })
              }
              allLabel="All Organizations"
              renderItem={(org) => (
                <span className="flex items-center gap-2 flex-1">
                  <Building2 className="size-3.5 text-muted-foreground" />
                  {org.name}
                </span>
              )}
            />
            <span className="text-muted-foreground/30">/</span>
          </>
        )}

        {availableLevels.client && (
          <>
            <MultiSelectDropdown
              label={`Clients (${filteredClients.length})`}
              icon={<Users className="size-3.5" />}
              items={filteredClients}
              selectedIds={context.clientIds}
              onSelectionChange={(ids) =>
                onContextChange({
                  ...context,
                  clientIds: ids,
                  strategyIds: [],
                })
              }
              allLabel="All Clients"
              emptyMessage="No clients for selected org"
              renderItem={(client) => (
                <span className="flex items-center gap-2 flex-1">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      client.status === "active" && "bg-[var(--status-live)]",
                      client.status === "onboarding" && "bg-[var(--status-warning)]",
                      client.status === "inactive" && "bg-[var(--status-idle)]",
                    )}
                  />
                  {client.name}
                </span>
              )}
            />

            {context.clientIds.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  onContextChange({
                    ...context,
                    clientIds: [],
                    strategyIds: [],
                  })
                }
                className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}

            <span className="text-muted-foreground/30">/</span>
          </>
        )}

        {availableLevels.strategy && (
          <>
            <MultiSelectDropdown
              label={`Strategies (${filteredStrategies.length})`}
              icon={<BarChart3 className="size-3.5" />}
              items={filteredStrategies}
              selectedIds={context.strategyIds}
              onSelectionChange={(ids) =>
                onContextChange({
                  ...context,
                  strategyIds: ids,
                })
              }
              allLabel="All Strategies"
              emptyMessage="No strategies for selection"
              dropdownWidthClass="w-[36rem]"
              groupBy={(s) => s.assetClass}
              getGroupLabel={(group) => group}
              renderItem={(strategy) => (
                <span className="flex items-center gap-2 flex-1">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      strategy.status === "live" && "bg-[var(--status-live)]",
                      strategy.status === "paused" && "bg-[var(--status-idle)]",
                      strategy.status === "warning" && "bg-[var(--status-warning)]",
                    )}
                  />
                  <span className="flex-1 truncate">{strategy.name}</span>
                  <span className="text-[10px] text-muted-foreground">{strategy.strategyType}</span>
                </span>
              )}
            />

            {context.strategyIds.length > 0 && (
              <button
                type="button"
                onClick={() => onContextChange({ ...context, strategyIds: [] })}
                className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}

            <span className="text-muted-foreground/30">/</span>
          </>
        )}

        {availableLevels.underlying && (
          <>
            <MultiSelectDropdown
              label={`Underlyings (${filteredUnderlyings.length})`}
              icon={<Coins className="size-3.5" />}
              items={filteredUnderlyings}
              selectedIds={context.underlyingIds}
              onSelectionChange={(ids) =>
                onContextChange({
                  ...context,
                  underlyingIds: ids,
                })
              }
              allLabel="All Underlyings"
              groupBy={(u) => u.type}
              getGroupLabel={(type) =>
                ({
                  crypto: "Crypto",
                  equity: "Equities",
                  sport: "Sports (Leagues)",
                  event: "Events",
                  commodity: "Commodities",
                })[type] || type
              }
              renderItem={(underlying) => (
                <span className="flex items-center gap-2 flex-1">
                  {getUnderlyingIcon(underlying.type)}
                  <span className="font-mono">{underlying.symbol}</span>
                  <span className="text-xs text-muted-foreground">{underlying.name}</span>
                </span>
              )}
            />

            {context.underlyingIds.length > 0 && (
              <button
                type="button"
                onClick={() => onContextChange({ ...context, underlyingIds: [] })}
                className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </>
        )}
      </div>

      <div className="flex-1" />

      {activeFilters > 0 && (
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium">
          {activeFilters} filter{activeFilters > 1 ? "s" : ""} active
        </Badge>
      )}

      {activeFilters > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() =>
            onContextChange({
              ...context,
              organizationIds: [],
              clientIds: [],
              strategyIds: [],
              underlyingIds: [],
            })
          }
        >
          Clear all
        </Button>
      )}
    </div>
  );
}

export function useContextState(initialState?: Partial<ContextState>) {
  const [context, setContext] = React.useState<ContextState>({
    mode: initialState?.mode || "live",
    asOfDatetime: initialState?.asOfDatetime,
    organizationIds: initialState?.organizationIds || [],
    clientIds: initialState?.clientIds || [],
    strategyIds: initialState?.strategyIds || [],
    underlyingIds: initialState?.underlyingIds || [],
  });

  return { context, setContext };
}

export const DEFAULT_ORGANIZATIONS = defaultOrganizations;
export const DEFAULT_CLIENTS = defaultClients;
export const DEFAULT_STRATEGIES = defaultStrategies;
export const DEFAULT_UNDERLYINGS = defaultUnderlyings;
