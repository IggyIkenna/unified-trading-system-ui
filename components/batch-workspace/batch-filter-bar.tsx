"use client";

/**
 * BatchFilterBar — standardized filter strip for research workspace pages.
 *
 * Renders a horizontal bar of select/input filters with consistent styling.
 * Shared across Strategy, ML, and Execution to prevent filter UI drift.
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { X, Filter } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  defaultValue?: string;
  placeholder?: string;
}

interface BatchFilterBarProps {
  filters: FilterConfig[];
  values?: Record<string, string>;
  onChange?: (values: Record<string, string>) => void;
  className?: string;
}

export function BatchFilterBar({
  filters,
  values: controlledValues,
  onChange,
  className,
}: BatchFilterBarProps) {
  const [internalValues, setInternalValues] = React.useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    for (const f of filters) {
      if (f.defaultValue) defaults[f.key] = f.defaultValue;
    }
    return defaults;
  });

  const values = controlledValues ?? internalValues;

  const handleChange = (key: string, value: string) => {
    const next = { ...values, [key]: value };
    if (!controlledValues) setInternalValues(next);
    onChange?.(next);
  };

  const activeFilterCount = Object.values(values).filter(Boolean).length;

  const clearAll = () => {
    const cleared: Record<string, string> = {};
    if (!controlledValues) setInternalValues(cleared);
    onChange?.(cleared);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
        <Filter className="size-3.5" />
        <span className="hidden sm:inline">Filters</span>
      </div>

      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={values[filter.key] || ""}
          onValueChange={(v) => handleChange(filter.key, v)}
        >
          <SelectTrigger className="h-7 text-xs w-auto min-w-[120px] gap-1">
            <SelectValue placeholder={filter.placeholder || filter.label} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground gap-1"
          onClick={clearAll}
        >
          <X className="size-3" />
          Clear
          <Badge variant="secondary" className="text-[10px] px-1 py-0">
            {activeFilterCount}
          </Badge>
        </Button>
      )}
    </div>
  );
}
