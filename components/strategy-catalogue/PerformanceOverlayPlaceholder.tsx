// PLACEHOLDER — replaced by <PerformanceOverlay> once
// plans/active/performance_overlay_continuous_timeline_2026_04_21.plan.md (Plan C)
// ships. Prop shape matches the real component so swap-in is a named import change.

import { Skeleton } from "@/components/ui/skeleton";

export interface PerformanceOverlayPlaceholderProps {
  readonly instanceId: string;
  readonly views?: ReadonlyArray<"backtest" | "paper" | "live">;
  readonly heightClass?: string;
  readonly captionVariant?: "fomo" | "reality";
}

const DEFAULT_VIEWS: ReadonlyArray<"backtest" | "paper" | "live"> = [
  "backtest",
  "paper",
  "live",
];

export function PerformanceOverlayPlaceholder({
  instanceId: _instanceId,
  views = DEFAULT_VIEWS,
  heightClass = "h-32",
  captionVariant = "fomo",
}: PerformanceOverlayPlaceholderProps) {
  const caption =
    captionVariant === "fomo"
      ? `${views.join(" · ")} overlay coming when Plan C ships`
      : `Live P&L from odum-live (${views.join(" · ")}) — Plan C renders this`;

  return (
    <div
      className="rounded-md border border-dashed border-border/60 bg-muted/20 p-3"
      data-testid="performance-overlay-placeholder"
    >
      <Skeleton className={`w-full ${heightClass}`} />
      <p className="mt-2 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}
