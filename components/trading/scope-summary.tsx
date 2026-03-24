"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Building2,
  Users,
  BarChart3,
  ChevronDown,
  Wallet,
  TrendingUp,
  Radio,
  Database,
} from "lucide-react";

interface ScopeSummaryProps {
  organizations: { id: string; name: string }[];
  clients: { id: string; name: string }[];
  strategies: { id: string; name: string; status: string }[];
  /** IDs of strategies explicitly selected by user (vs all strategies matching org/client filter) */
  selectedStrategyIds?: string[];
  totalStrategies: number;
  totalOrganizations?: number;
  totalClients?: number;
  totalCapital: number;
  totalExposure: number;
  mode: "live" | "batch";
  asOfDatetime?: string;
  onClearScope?: () => void;
  className?: string;
}

export function ScopeSummary({
  organizations,
  clients,
  strategies,
  selectedStrategyIds = [],
  totalStrategies,
  totalOrganizations = 0,
  totalClients = 0,
  totalCapital,
  totalExposure,
  mode,
  asOfDatetime,
  onClearScope,
  className,
}: ScopeSummaryProps) {
  const formatCurrency = (v: number) => {
    if (Math.abs(v) >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
    if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}k`;
    return `$${v.toFixed(0)}`;
  };

  const liveStrategies = strategies.filter((s) => s.status === "live").length;
  const warningStrategies = strategies.filter(
    (s) => s.status === "warning",
  ).length;
  const pausedStrategies = strategies.filter(
    (s) => s.status === "paused" || s.status === "stopped",
  ).length;

  // Check if any filters are active
  const hasOrgFilter = organizations.length > 0;
  const hasClientFilter = clients.length > 0;
  const hasStrategyFilter = selectedStrategyIds.length > 0;
  const hasAnyFilter = hasOrgFilter || hasClientFilter || hasStrategyFilter;

  const scopeLabel = React.useMemo(() => {
    if (!hasAnyFilter) {
      const parts: string[] = [];
      if (totalOrganizations > 0)
        parts.push(`All Orgs (${totalOrganizations})`);
      if (totalClients > 0) parts.push(`All Clients (${totalClients})`);
      parts.push(`${totalStrategies} Strategies`);
      return parts.join(" / ");
    }
    const parts: string[] = [];
    if (organizations.length === 1) {
      parts.push(organizations[0].name);
    } else if (organizations.length > 1) {
      parts.push(`${organizations.length} orgs`);
    }
    if (clients.length === 1) {
      parts.push(clients[0].name);
    } else if (clients.length > 1) {
      parts.push(`${clients.length} clients`);
    }
    if (selectedStrategyIds.length === 1) {
      const selectedStrategy = strategies.find(
        (s) => s.id === selectedStrategyIds[0],
      );
      parts.push(selectedStrategy?.name || "1 strategy");
    } else if (selectedStrategyIds.length > 1) {
      parts.push(`${selectedStrategyIds.length} strategies`);
    }
    return parts.join(" > ") || "Filtered";
  }, [
    organizations,
    clients,
    strategies,
    selectedStrategyIds,
    hasAnyFilter,
    totalOrganizations,
    totalClients,
    totalStrategies,
  ]);

  const hasFilters = hasAnyFilter;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Scope Label */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 h-8">
            <span className="text-xs font-medium">SCOPE:</span>
            <span className="font-semibold max-w-[200px] truncate">
              {scopeLabel}
            </span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Scope</span>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={onClearScope}
                >
                  Clear All
                </Button>
              )}
            </div>

            {organizations.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="size-3" />
                  Organizations
                </div>
                <div className="flex flex-wrap gap-1">
                  {organizations.map((org) => (
                    <Badge key={org.id} variant="secondary" className="text-xs">
                      {org.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {clients.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3" />
                  Clients
                </div>
                <div className="flex flex-wrap gap-1">
                  {clients.map((client) => (
                    <Badge
                      key={client.id}
                      variant="secondary"
                      className="text-xs"
                    >
                      {client.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="size-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Strategies:</span>
                  <span className="font-medium">{strategies.length}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wallet className="size-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Capital:</span>
                  <span className="font-medium font-mono">
                    {formatCurrency(totalCapital)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Quick Stats */}
      <div className="flex items-center gap-2 text-xs">
        <Badge variant="outline" className="gap-1 font-mono">
          <BarChart3 className="size-3" />
          {strategies.length} strategies
        </Badge>

        <Badge variant="outline" className="gap-1 font-mono">
          <Wallet className="size-3" />
          {formatCurrency(totalCapital)}
        </Badge>

        <Badge variant="outline" className="gap-1 font-mono">
          <TrendingUp className="size-3" />
          {formatCurrency(totalExposure)} exposed
        </Badge>

        {/* Strategy Status */}
        <div className="flex items-center gap-1">
          {liveStrategies > 0 && (
            <Badge
              variant="outline"
              className="gap-1 text-[10px] border-[var(--status-live)] text-[var(--status-live)]"
            >
              <span className="size-1.5 rounded-full bg-[var(--status-live)] animate-pulse" />
              {liveStrategies} live
            </Badge>
          )}
          {warningStrategies > 0 && (
            <Badge
              variant="outline"
              className="gap-1 text-[10px] border-[var(--status-warning)] text-[var(--status-warning)]"
            >
              {warningStrategies} warning
            </Badge>
          )}
          {pausedStrategies > 0 && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              {pausedStrategies} paused
            </Badge>
          )}
        </div>

        {/* Mode indicator */}
        <Badge
          variant="outline"
          className={cn(
            "gap-1 text-[10px]",
            mode === "live"
              ? "border-[var(--status-live)] text-[var(--status-live)]"
              : "border-[var(--surface-markets)] text-[var(--surface-markets)]",
          )}
        >
          {mode === "live" ? (
            <>
              <Radio className="size-2.5 animate-pulse" />
              Live
            </>
          ) : (
            <>
              <Database className="size-2.5" />
              Batch {asOfDatetime?.split("T")[0]}
            </>
          )}
        </Badge>
      </div>
    </div>
  );
}
