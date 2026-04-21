"use client";

import { EntityLink } from "@/components/trading/entity-link";
import { SparklineCell } from "@/components/trading/kpi-card";
import { PnLValue } from "@/components/trading/pnl-value";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/shared/spinner";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { ARCHETYPES, ASSET_CLASS_COLORS, STATUSES } from "@/lib/config/services/strategies.config";
import type { Strategy } from "@/lib/mocks/fixtures/strategy-instances";
import { cn } from "@/lib/utils";
import { BarChart2, ChevronDown, Filter, Play, Search, Settings, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useStrategiesData } from "./strategies-data-context";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

function executionModeShort(s: Strategy): { code: string; title: string } {
  const m = s.dataArchitecture.executionMode;
  if (m === "same_candle_exit") return { code: "SCE", title: "Same Candle Exit" };
  if (m === "hold_until_flip") return { code: "HUF", title: "Hold Until Flip" };
  return { code: "EVT", title: "Event-Driven Continuous" };
}

export function StrategiesCatalogueWidget(_props: WidgetComponentProps) {
  const {
    isLoading,
    filteredStrategies,
    groupedStrategies,
    searchQuery,
    setSearchQuery,
    selectedAssetClasses,
    toggleAssetClass,
    selectedArchetypes,
    toggleArchetype,
    selectedStatuses,
    toggleStatus,
    hasFilters,
    clearFilters,
  } = useStrategiesData();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(true);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setNarrow(w < 560);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[120px] items-center justify-center text-muted-foreground">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-4">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40">
        <button
          type="button"
          aria-label={showFilters ? "Hide filters" : "Show filters"}
          onClick={() => setShowFilters((f) => !f)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Filter className="size-3" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>
      {showFilters && (
        <div className="px-3 py-2 border-b border-border/30 bg-muted/20">
          <div className="flex items-center gap-2 flex-wrap py-0.5">
            <div className="relative flex-1 min-w-[160px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search strategies, venues..."
                className="pl-9 h-8 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("h-8 gap-1.5", selectedAssetClasses.length > 0 && "border-primary")}
                >
                  <Filter className="size-3.5" />
                  Asset Class
                  {selectedAssetClasses.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-micro">
                      {selectedAssetClasses.length}
                    </Badge>
                  )}
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel className="text-xs">Asset Classes</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.keys(ASSET_CLASS_COLORS).map((ac) => (
                  <DropdownMenuCheckboxItem
                    key={ac}
                    checked={selectedAssetClasses.includes(ac)}
                    onCheckedChange={() => toggleAssetClass(ac)}
                  >
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: ASSET_CLASS_COLORS[ac] }} />
                      {ac}
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("h-8 gap-1.5", selectedArchetypes.length > 0 && "border-primary")}
                >
                  Archetype
                  {selectedArchetypes.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-micro">
                      {selectedArchetypes.length}
                    </Badge>
                  )}
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel className="text-xs">Strategy Types</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ARCHETYPES.map((arch) => (
                  <DropdownMenuCheckboxItem
                    key={arch.id}
                    checked={selectedArchetypes.includes(arch.id)}
                    onCheckedChange={() => toggleArchetype(arch.id)}
                  >
                    {arch.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("h-8 gap-1.5", selectedStatuses.length > 0 && "border-primary")}
                >
                  Status
                  {selectedStatuses.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-micro">
                      {selectedStatuses.length}
                    </Badge>
                  )}
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel className="text-xs">Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {STATUSES.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status.id}
                    checked={selectedStatuses.includes(status.id)}
                    onCheckedChange={() => toggleStatus(status.id)}
                  >
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: status.color }} />
                      {status.label}
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedAssetClasses.map((ac) => (
              <Badge
                key={ac}
                variant="secondary"
                className="h-6 gap-1 pl-2 pr-1"
                style={{ borderColor: ASSET_CLASS_COLORS[ac], borderWidth: 1 }}
              >
                <span className="size-1.5 rounded-full" style={{ backgroundColor: ASSET_CLASS_COLORS[ac] }} />
                {ac}
                <button
                  type="button"
                  aria-label={`Remove ${ac} filter`}
                  onClick={() => toggleAssetClass(ac)}
                  className="hover:bg-secondary rounded p-0.5"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}

            {selectedArchetypes.map((arch) => {
              const label = ARCHETYPES.find((a) => a.id === arch)?.label ?? arch;
              return (
                <Badge key={arch} variant="secondary" className="h-6 gap-1 pl-2 pr-1">
                  {label}
                  <button
                    type="button"
                    aria-label={`Remove ${label} filter`}
                    onClick={() => toggleArchetype(arch)}
                    className="hover:bg-secondary rounded p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              );
            })}

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
                Clear all
              </Button>
            )}
          </div>
        </div>
      )}
      {Object.entries(groupedStrategies).map(([assetClass, strategies]) => {
        const byArchetype: Record<string, Strategy[]> = {};
        for (const s of strategies) {
          const arch = s.archetype ?? "OTHER";
          if (!byArchetype[arch]) byArchetype[arch] = [];
          byArchetype[arch].push(s);
        }
        const archetypeLabel = (a: string) => ARCHETYPES.find((x) => x.id === a)?.label ?? a;
        return (
          <div
            key={assetClass}
            className="rounded-md border border-border/60 pl-2"
            style={{ borderLeftWidth: 3, borderLeftColor: ASSET_CLASS_COLORS[assetClass] ?? "var(--border)" }}
          >
            <CollapsibleSection title={assetClass} defaultOpen count={strategies.length} className="space-y-2">
              {Object.entries(byArchetype).map(([arch, archStrategies]) => (
                <div key={arch} className="space-y-1.5">
                  <div className="flex items-center gap-2 px-1 pt-1">
                    <span className="text-micro font-semibold text-muted-foreground uppercase tracking-wider">
                      {archetypeLabel(arch)}
                    </span>
                    <span className="text-micro text-muted-foreground">({archStrategies.length})</span>
                  </div>
                  <div className={cn("grid gap-3 pb-2", narrow ? "grid-cols-1" : "grid-cols-2")}>
                    {archStrategies.map((strategy) => {
                      const exec = executionModeShort(strategy);
                      const inst = strategy.instructionTypes ?? [];
                      return (
                        <Card
                          key={strategy.id}
                          className="cursor-pointer overflow-hidden transition-all duration-150 ease-out hover:shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <EntityLink
                                    type="strategy"
                                    id={strategy.id}
                                    label={strategy.name}
                                    className="text-base font-semibold"
                                  />
                                  <StatusBadge status={strategy.status} />
                                  <Badge variant="outline" className="font-mono text-micro">
                                    {strategy.version}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">{strategy.description}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span className="text-xs font-medium px-2 py-1 rounded bg-secondary text-secondary-foreground">
                                  {strategy.strategyType}
                                </span>
                                <Badge variant="outline" className="text-micro font-mono" title={exec.title}>
                                  {exec.code}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center gap-1 mb-2 flex-wrap">
                              {strategy.venues.slice(0, 3).map((venue) => (
                                <Badge key={venue} variant="outline" className="text-micro px-1.5 py-0">
                                  {venue}
                                </Badge>
                              ))}
                              {strategy.venues.length > 3 && (
                                <Badge variant="outline" className="text-micro px-1.5 py-0">
                                  +{strategy.venues.length - 3}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-1 mb-3 flex-wrap">
                              {inst.map((instType) => (
                                <Badge key={instType} variant="secondary" className="text-nano px-1.5 py-0 font-mono">
                                  {instType}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 py-3 border-t border-border">
                              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                <div>
                                  <span className="text-xs text-muted-foreground block">Sharpe</span>
                                  <span className="text-sm font-mono font-semibold">
                                    {formatNumber(strategy.performance.sharpe, 2)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground block">Return</span>
                                  <span
                                    className={cn(
                                      "text-sm font-mono font-semibold",
                                      strategy.performance.returnPct >= 0 ? "pnl-positive" : "pnl-negative",
                                    )}
                                  >
                                    {strategy.performance.returnPct >= 0 ? "+" : ""}
                                    {formatPercent(strategy.performance.returnPct, 1)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground block">Max DD</span>
                                  <span className="text-sm font-mono text-muted-foreground">
                                    {formatPercent(strategy.performance.maxDrawdown, 1)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground block">MTD P&L</span>
                                  <PnLValue value={strategy.performance.pnlMTD} size="sm" />
                                </div>
                              </div>
                              <SparklineCell
                                data={strategy.sparklineData}
                                className={narrow ? "w-16 h-6" : "w-20 h-8"}
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-3 border-t border-border">
                              <Link
                                href={`/services/trading/positions?strategy_id=${strategy.id}`}
                                className="flex-1 min-w-0"
                              >
                                <Button variant="outline" size="sm" className="w-full gap-2">
                                  <Play className="size-3" />
                                  View Live
                                </Button>
                              </Link>
                              <Link href={`/services/trading/strategies/${strategy.id}`} className="flex-1 min-w-0">
                                <Button variant="outline" size="sm" className="w-full gap-2">
                                  <BarChart2 className="size-3" />
                                  Details
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 min-w-0 w-full gap-2"
                                disabled
                                title="Per-strategy config page not yet implemented"
                              >
                                <Settings className="size-3" />
                                Config
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CollapsibleSection>
          </div>
        );
      })}

      {filteredStrategies.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No strategies match your filters. Try adjusting your search criteria.
        </div>
      )}
    </div>
  );
}
