"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitCompare, Plus, Search } from "lucide-react";

/**
 * Shared toolbar for research backtest pages.
 * Row 1: search + action buttons (compare, new)
 * Row 2: slot for page-specific filters
 */
export function ResearchToolbar({
  searchPlaceholder = "Search backtests...",
  searchValue,
  onSearchChange,
  compareCount,
  onCompareClick,
  newLabel = "New Backtest",
  onNewClick,
  filterSlot,
}: {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  compareCount: number;
  onCompareClick: () => void;
  newLabel?: string;
  onNewClick: () => void;
  filterSlot?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-6 pt-6 pb-4">
      {/* Row 1: Search + Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative min-w-[200px] max-w-md flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {compareCount >= 2 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={onCompareClick}
            >
              <GitCompare className="size-4" />
              Compare ({compareCount})
            </Button>
          )}
          <Button size="sm" onClick={onNewClick}>
            <Plus className="size-4 mr-1" />
            {newLabel}
          </Button>
        </div>
      </div>

      {/* Row 2: Page-specific filters */}
      {filterSlot && (
        <div className="flex flex-wrap items-center gap-3">
          {filterSlot}
          {compareCount > 0 && (
            <Badge variant="outline" className="text-xs">
              {compareCount} selected for compare
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
