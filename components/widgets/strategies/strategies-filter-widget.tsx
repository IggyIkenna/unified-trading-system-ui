"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { ASSET_CLASS_COLORS, ARCHETYPES, STATUSES } from "@/lib/config/services/strategies.config";
import { Search, Filter, ChevronDown, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStrategiesData } from "./strategies-data-context";

export function StrategiesFilterWidget(_props: WidgetComponentProps) {
  const {
    isLoading,
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

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[36px] items-center justify-center text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  return (
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
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
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
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
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
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
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
          <button type="button" onClick={() => toggleAssetClass(ac)} className="hover:bg-secondary rounded p-0.5">
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      {selectedArchetypes.map((arch) => {
        const label = ARCHETYPES.find((a) => a.id === arch)?.label ?? arch;
        return (
          <Badge key={arch} variant="secondary" className="h-6 gap-1 pl-2 pr-1">
            {label}
            <button type="button" onClick={() => toggleArchetype(arch)} className="hover:bg-secondary rounded p-0.5">
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
  );
}
