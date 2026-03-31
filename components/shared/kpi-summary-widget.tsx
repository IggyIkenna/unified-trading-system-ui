"use client";

import * as React from "react";
import { KpiStrip, type KpiLayoutMode, type KpiMetric } from "./kpi-strip";
import { useWidgetHeaderEndSlot } from "@/components/widgets/widget-chrome-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export const KPI_SUMMARY_LAYOUT_OPTIONS: { value: KpiLayoutMode; label: string; hint?: string }[] = [
  { value: "fluid", label: "Fluid (auto)", hint: "Fill width first, wrap when needed" },
  { value: "single-row", label: "Single row", hint: "One row, scroll if narrow" },
  { value: "single-column", label: "Single column", hint: "Stacked" },
  { value: "cols-2", label: "2 columns", hint: "e.g. 3 rows of 2" },
  { value: "cols-3", label: "3 columns", hint: "e.g. 2 rows of 3" },
];

function isKpiLayoutMode(v: string): v is KpiLayoutMode {
  return v === "fluid" || v === "single-row" || v === "single-column" || v === "cols-2" || v === "cols-3";
}

function KpiLayoutMenuButton({
  layoutMode,
  onLayoutModeChange,
  compact,
}: {
  layoutMode: KpiLayoutMode;
  onLayoutModeChange: (m: KpiLayoutMode) => void;
  compact?: boolean;
}) {
  const layoutLabel = KPI_SUMMARY_LAYOUT_OPTIONS.find((o) => o.value === layoutMode)?.label ?? "Layout";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-1 px-1.5 text-muted-foreground hover:text-foreground shrink-0",
            compact ? "h-6 text-[10px]" : "h-7 text-[10px]",
          )}
          onClick={(e) => e.stopPropagation()}
          aria-label="KPI layout"
        >
          <LayoutGrid className="size-3 opacity-70" />
          <span className="max-w-[9rem] truncate hidden sm:inline">{layoutLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">KPI layout</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {KPI_SUMMARY_LAYOUT_OPTIONS.map((o) => (
          <DropdownMenuItem
            key={o.value}
            className="flex flex-col items-start gap-0.5 py-2"
            onClick={() => onLayoutModeChange(o.value)}
          >
            <span className={layoutMode === o.value ? "font-medium" : undefined}>{o.label}</span>
            {o.hint ? <span className="text-[10px] text-muted-foreground font-normal">{o.hint}</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface KpiSummaryWidgetProps {
  /** KPI tiles to render */
  metrics: KpiMetric[];
  /** localStorage key for persisting layout mode (per summary type) */
  storageKey: string;
  className?: string;
}

/**
 * Shared shell for KPI summary widgets: `KpiStrip` + layout mode (persisted) + optional title-bar control
 * when rendered inside `WidgetWrapper` (layout menu appears left of fullscreen).
 */
export function KpiSummaryWidget({ metrics, storageKey, className }: KpiSummaryWidgetProps) {
  const setHeaderEndSlot = useWidgetHeaderEndSlot();
  const hasChromeHeader = setHeaderEndSlot != null;

  const [layoutMode, setLayoutMode] = React.useState<KpiLayoutMode>("fluid");

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw && isKpiLayoutMode(raw)) setLayoutMode(raw);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey, layoutMode);
    } catch {
      /* ignore */
    }
  }, [storageKey, layoutMode]);

  React.useEffect(() => {
    if (!setHeaderEndSlot) return;
    setHeaderEndSlot(<KpiLayoutMenuButton layoutMode={layoutMode} onLayoutModeChange={setLayoutMode} compact />);
    return () => setHeaderEndSlot(null);
  }, [setHeaderEndSlot, layoutMode]);

  return (
    <div className={cn("flex h-full min-h-0 w-full min-w-0 flex-col p-1", className)}>
      {!hasChromeHeader && (
        <div className="flex shrink-0 justify-end pb-1">
          <KpiLayoutMenuButton layoutMode={layoutMode} onLayoutModeChange={setLayoutMode} />
        </div>
      )}
      <div className="min-h-0 min-w-0 flex-1 w-full">
        <KpiStrip metrics={metrics} layoutMode={layoutMode} fill compact />
      </div>
    </div>
  );
}
