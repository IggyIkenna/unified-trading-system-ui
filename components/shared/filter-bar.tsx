"use client";

// Unified Filter Bar - URL-persisted filters shared across platforms
// Supports dimensions, date ranges, and search

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Search, X, Calendar as CalendarIcon, Filter, ChevronDown, RotateCcw } from "lucide-react";
import { format } from "date-fns";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterDefinition {
  key: string;
  label: string;
  type: "select" | "multi-select" | "date" | "date-range" | "search";
  options?: FilterOption[];
  placeholder?: string;
}

interface FilterBarProps {
  filters: FilterDefinition[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onReset: () => void;
  persistToUrl?: boolean;
  className?: string;
}

// Individual filter components
function SelectFilter({
  filter,
  value,
  onChange,
}: {
  filter: FilterDefinition;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  // Ensure we never pass empty string to Select - always use __all__ for "no selection"
  const selectValue = value && value !== "" ? value : "__all__";

  // Filter options to ensure no empty values
  const validOptions = (filter.options || []).filter((opt) => opt.value && opt.value !== "");

  return (
    <Select value={selectValue} onValueChange={(v) => onChange(v === "__all__" ? "" : v)}>
      <SelectTrigger className="h-8 min-w-[140px] text-xs">
        <SelectValue placeholder={filter.placeholder || filter.label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All {filter.label}</SelectItem>
        {validOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            <div className="flex items-center justify-between gap-4 w-full">
              <span>{opt.label}</span>
              {opt.count !== undefined && <span className="text-muted-foreground text-[10px]">({opt.count})</span>}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MultiSelectFilter({
  filter,
  value,
  onChange,
}: {
  filter: FilterDefinition;
  value: string[] | undefined;
  onChange: (value: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = value || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 min-w-[140px] justify-between text-xs", selected.length > 0 && "border-primary/50")}
        >
          {selected.length > 0 ? (
            <span className="flex items-center gap-1">
              {filter.label}
              <Badge variant="secondary" className="ml-1 h-4 text-[10px]">
                {selected.length}
              </Badge>
            </span>
          ) : (
            <span className="text-muted-foreground">{filter.placeholder || filter.label}</span>
          )}
          <ChevronDown className="size-3 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2" align="start">
        <div className="space-y-1">
          {filter.options?.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                className={cn(
                  "w-full flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-muted/50",
                  isSelected && "bg-primary/10 text-primary",
                )}
                onClick={() => {
                  if (isSelected) {
                    onChange(selected.filter((v) => v !== opt.value));
                  } else {
                    onChange([...selected, opt.value]);
                  }
                }}
              >
                <span>{opt.label}</span>
                {opt.count !== undefined && <span className="text-muted-foreground">({opt.count})</span>}
              </button>
            );
          })}
        </div>
        {selected.length > 0 && (
          <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs" onClick={() => onChange([])}>
            Clear selection
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function DateRangeFilter({
  filter,
  value,
  onChange,
}: {
  filter: FilterDefinition;
  value: { start: Date; end: Date } | undefined;
  onChange: (value: { start: Date; end: Date } | undefined) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 min-w-[180px] justify-start text-xs", value && "border-primary/50")}
        >
          <CalendarIcon className="size-3 mr-2" />
          {value ? (
            <span>
              {format(value.start, "MMM d")} - {format(value.end, "MMM d, yyyy")}
            </span>
          ) : (
            <span className="text-muted-foreground">{filter.placeholder || "Select date range"}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex gap-2 p-2 border-b">
          {[
            { label: "1W", days: 7 },
            { label: "1M", days: 30 },
            { label: "3M", days: 90 },
            { label: "6M", days: 180 },
            { label: "1Y", days: 365 },
          ].map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              className="h-6 text-xs"
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - preset.days);
                onChange({ start, end });
                setOpen(false);
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <Calendar
          mode="range"
          selected={value ? { from: value.start, to: value.end } : undefined}
          onSelect={(range) => {
            if (range?.from && range?.to) {
              onChange({ start: range.from, end: range.to });
            }
          }}
          numberOfMonths={2}
        />
        {value && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function SearchFilter({
  filter,
  value,
  onChange,
}: {
  filter: FilterDefinition;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
      <Input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
        className="h-8 pl-7 pr-7 text-xs min-w-[180px]"
      />
      {value && (
        <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => onChange("")}>
          <X className="size-3 text-muted-foreground hover:text-foreground" />
        </button>
      )}
    </div>
  );
}

export function FilterBar({ filters, values, onChange, onReset, persistToUrl = false, className }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Count active filters
  const activeCount = Object.values(values).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object" && v !== null) return true;
    return !!v;
  }).length;

  // Sync with URL if enabled
  React.useEffect(() => {
    if (!persistToUrl) return;

    const params = new URLSearchParams(searchParams.toString());

    filters.forEach((filter) => {
      const value = values[filter.key];
      if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
        params.delete(filter.key);
      } else if (Array.isArray(value)) {
        params.set(filter.key, value.join(","));
      } else if (typeof value === "object" && value !== null && "start" in value && "end" in value) {
        params.set(filter.key, `${(value.start as Date).toISOString()}_${(value.end as Date).toISOString()}`);
      } else {
        params.set(filter.key, String(value));
      }
    });

    router.replace(`?${params.toString()}`, { scroll: false });
  }, [values, persistToUrl, filters, router, searchParams]);

  return (
    <div className={cn("flex flex-wrap items-center gap-2 px-4 py-2 border-b bg-muted/20", className)}>
      <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
        <Filter className="size-3.5" />
        Filters
      </div>

      {filters.map((filter) => {
        switch (filter.type) {
          case "select":
            return (
              <SelectFilter
                key={filter.key}
                filter={filter}
                value={values[filter.key] as string | undefined}
                onChange={(v) => onChange(filter.key, v)}
              />
            );
          case "multi-select":
            return (
              <MultiSelectFilter
                key={filter.key}
                filter={filter}
                value={values[filter.key] as string[] | undefined}
                onChange={(v) => onChange(filter.key, v)}
              />
            );
          case "date-range":
            return (
              <DateRangeFilter
                key={filter.key}
                filter={filter}
                value={values[filter.key] as { start: Date; end: Date } | undefined}
                onChange={(v) => onChange(filter.key, v)}
              />
            );
          case "search":
            return (
              <SearchFilter
                key={filter.key}
                filter={filter}
                value={values[filter.key] as string | undefined}
                onChange={(v) => onChange(filter.key, v)}
              />
            );
          default:
            return null;
        }
      })}

      {activeCount > 0 && (
        <>
          <div className="h-4 w-px bg-border mx-1" />
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={onReset}>
            <RotateCcw className="size-3" />
            Reset ({activeCount})
          </Button>
        </>
      )}
    </div>
  );
}

// Hook for managing filter state
export function useFilterState<T extends Record<string, unknown>>(initialFilters: T) {
  const [filters, setFilters] = React.useState<T>(initialFilters);

  const updateFilter = React.useCallback((key: string, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = React.useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return {
    filters,
    updateFilter,
    resetFilters,
    setFilters,
  };
}
