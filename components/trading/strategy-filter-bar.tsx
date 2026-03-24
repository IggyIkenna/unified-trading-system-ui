"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Filter, X, ChevronDown } from "lucide-react";

// Asset class domains - where the strategy operates
export type AssetClass = "DeFi" | "CeFi" | "TradFi" | "Sports" | "Prediction";

// Strategy type domains - what the strategy does
export type StrategyType =
  | "Market Making"
  | "Basis Trade"
  | "Arbitrage"
  | "Lending"
  | "Staking"
  | "Momentum"
  | "Mean Reversion"
  | "ML Directional"
  | "Options"
  | "LP Provision";

export const ASSET_CLASSES: {
  value: AssetClass;
  label: string;
  color: string;
}[] = [
  { value: "DeFi", label: "DeFi", color: "#4ade80" },
  { value: "CeFi", label: "CeFi", color: "#60a5fa" },
  { value: "TradFi", label: "TradFi", color: "#a78bfa" },
  { value: "Sports", label: "Sports", color: "#fbbf24" },
  { value: "Prediction", label: "Prediction", color: "#f472b6" },
];

export const STRATEGY_TYPES: { value: StrategyType; label: string }[] = [
  { value: "Market Making", label: "Market Making" },
  { value: "Basis Trade", label: "Basis Trade" },
  { value: "Arbitrage", label: "Arbitrage" },
  { value: "Lending", label: "Lending" },
  { value: "Staking", label: "Staking" },
  { value: "Momentum", label: "Momentum" },
  { value: "Mean Reversion", label: "Mean Reversion" },
  { value: "ML Directional", label: "ML Directional" },
  { value: "Options", label: "Options" },
  { value: "LP Provision", label: "LP Provision" },
];

interface StrategyFilterBarProps {
  selectedAssetClasses: AssetClass[];
  selectedStrategyTypes: StrategyType[];
  onAssetClassChange: (assetClasses: AssetClass[]) => void;
  onStrategyTypeChange: (strategyTypes: StrategyType[]) => void;
  className?: string;
}

export function StrategyFilterBar({
  selectedAssetClasses,
  selectedStrategyTypes,
  onAssetClassChange,
  onStrategyTypeChange,
  className,
}: StrategyFilterBarProps) {
  const hasFilters =
    selectedAssetClasses.length > 0 || selectedStrategyTypes.length > 0;

  const toggleAssetClass = (assetClass: AssetClass) => {
    if (selectedAssetClasses.includes(assetClass)) {
      onAssetClassChange(
        selectedAssetClasses.filter((ac) => ac !== assetClass),
      );
    } else {
      onAssetClassChange([...selectedAssetClasses, assetClass]);
    }
  };

  const toggleStrategyType = (strategyType: StrategyType) => {
    if (selectedStrategyTypes.includes(strategyType)) {
      onStrategyTypeChange(
        selectedStrategyTypes.filter((st) => st !== strategyType),
      );
    } else {
      onStrategyTypeChange([...selectedStrategyTypes, strategyType]);
    }
  };

  const clearAll = () => {
    onAssetClassChange([]);
    onStrategyTypeChange([]);
  };

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <Filter className="size-4 text-muted-foreground" />

      {/* Asset Class Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-7 gap-1.5 text-xs",
              selectedAssetClasses.length > 0 && "border-primary",
            )}
          >
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
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Filter by Asset Class
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ASSET_CLASSES.map((ac) => (
            <DropdownMenuCheckboxItem
              key={ac.value}
              checked={selectedAssetClasses.includes(ac.value)}
              onCheckedChange={() => toggleAssetClass(ac.value)}
            >
              <span className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: ac.color }}
                />
                {ac.label}
              </span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Strategy Type Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-7 gap-1.5 text-xs",
              selectedStrategyTypes.length > 0 && "border-primary",
            )}
          >
            Strategy Type
            {selectedStrategyTypes.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {selectedStrategyTypes.length}
              </Badge>
            )}
            <ChevronDown className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Filter by Strategy Type
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STRATEGY_TYPES.map((st) => (
            <DropdownMenuCheckboxItem
              key={st.value}
              checked={selectedStrategyTypes.includes(st.value)}
              onCheckedChange={() => toggleStrategyType(st.value)}
            >
              {st.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active Filter Badges */}
      {selectedAssetClasses.map((ac) => {
        const config = ASSET_CLASSES.find((a) => a.value === ac);
        return (
          <Badge
            key={ac}
            variant="secondary"
            className="h-6 gap-1 pl-2 pr-1 text-xs"
            style={{ borderColor: config?.color, borderWidth: 1 }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: config?.color }}
            />
            {ac}
            <button
              onClick={() => toggleAssetClass(ac)}
              className="ml-0.5 hover:bg-secondary rounded p-0.5"
            >
              <X className="size-3" />
            </button>
          </Badge>
        );
      })}

      {selectedStrategyTypes.map((st) => (
        <Badge
          key={st}
          variant="secondary"
          className="h-6 gap-1 pl-2 pr-1 text-xs"
        >
          {st}
          <button
            onClick={() => toggleStrategyType(st)}
            className="ml-0.5 hover:bg-secondary rounded p-0.5"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      {/* Clear All */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
