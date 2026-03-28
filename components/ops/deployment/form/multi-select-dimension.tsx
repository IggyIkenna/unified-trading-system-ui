"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ServiceDimension } from "@/lib/types/deployment";

// Multi-select component for dimensions
export interface MultiSelectDimensionProps {
  dimension: ServiceDimension;
  selected: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  hint?: string;
}

export function MultiSelectDimension({ dimension, selected, onChange, disabled, hint }: MultiSelectDimensionProps) {
  const values = dimension.values || [];

  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectAll = () => onChange([...values]);
  const clearAll = () => onChange([]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{dimension.name}</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={selectAll}
            disabled={disabled}
            className="text-xs text-[var(--color-accent-cyan)] hover:underline disabled:opacity-50 h-auto p-0"
          >
            Select all
          </Button>
          <span className="text-[var(--color-text-muted)]">|</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            disabled={disabled}
            className="text-xs text-[var(--color-text-secondary)] hover:underline disabled:opacity-50 h-auto p-0"
          >
            Clear
          </Button>
        </div>
      </div>

      {hint && <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>}

      <div
        className={cn(
          "flex flex-wrap gap-2 p-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] max-h-40 overflow-y-auto",
          disabled && "opacity-50 pointer-events-none",
        )}
      >
        {values.map((value) => {
          const isSelected = selected.includes(value);
          return (
            <Button
              key={value}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => toggleValue(value)}
              className={cn(
                "px-2.5 py-1 text-xs font-mono",
                isSelected &&
                  "bg-[var(--color-accent-cyan)]/20 border-[var(--color-accent-cyan)] text-[var(--color-accent-cyan)]",
              )}
            >
              {isSelected && <CheckCircle2 className="h-3 w-3 inline mr-1" />}
              {value}
            </Button>
          );
        })}
      </div>

      <p className="text-xs text-[var(--color-text-muted)]">
        {selected.length > 0
          ? `${selected.length} of ${values.length} selected`
          : `All ${values.length} will be processed (none selected = all)`}
      </p>
    </div>
  );
}
