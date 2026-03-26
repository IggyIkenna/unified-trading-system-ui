/**
 * Reusable KPI / stat tile for any page (promote lifecycle, dashboards, etc.).
 * Props: label, primary, body (custom slot instead of primary), secondary, hint,
 * class names, tone, variant (card | pipeline | bordered), density, layout (metric | heatmap).
 * Use `body`, not React `children` (eslint react/no-children-prop).
 */
import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONE_STYLES = {
  data: {
    label: "text-xs uppercase tracking-wider text-muted-foreground",
    primary: "font-mono text-2xl font-bold",
  },
  grid: {
    label:
      "text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm",
    primary:
      "break-words font-mono text-xl font-bold leading-tight sm:text-2xl",
  },
  pipeline: {
    label: "text-sm uppercase tracking-wider text-muted-foreground",
    primary: "font-mono text-2xl font-bold",
  },
  panel: {
    label: "text-xs uppercase text-muted-foreground",
    primary: "font-mono text-xl font-bold",
  },
  panelLg: {
    label: "text-xs uppercase text-muted-foreground",
    primary: "font-mono text-lg font-bold",
  },
} as const;

export type MetricTone = keyof typeof TONE_STYLES;

export type MetricDensity =
  | "compact"
  | "default"
  | "pipeline"
  | "panel"
  | "panelSm"
  | "walkforward";

const DENSITY_MINH: Record<MetricDensity, string> = {
  compact: "min-h-[5.25rem]",
  default: "min-h-[6.5rem]",
  pipeline: "min-h-[5.5rem]",
  panel: "min-h-[6.5rem]",
  panelSm: "min-h-[5rem]",
  walkforward: "min-h-[5.5rem]",
};

export type MetricCardVariant = "card" | "pipeline" | "bordered";

export type MetricCardProps = {
  /** Label above primary (or below when layout is heatmap) */
  label?: React.ReactNode;
  /** Main value; omitted when using `body` instead */
  primary?: React.ReactNode;
  primaryClassName?: string;
  /** Muted line under primary, e.g. conservative sizing */
  secondary?: React.ReactNode;
  secondaryClassName?: string;
  /** Small muted hint (grid metrics) */
  hint?: React.ReactNode;
  hintClassName?: string;
  /** Custom block after label (e.g. badges). When primary is omitted, renders label + body. */
  body?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  labelClassName?: string;
  tone?: MetricTone;
  variant?: MetricCardVariant;
  density?: MetricDensity;
  /** Extra classes on bordered variant outer box (border color, etc.) */
  borderedSurfaceClassName?: string;
  /**
   * Heatmap strip: colored value cell on top, caption label under.
   * Pass background/text via primaryClassName.
   */
  layout?: "metric" | "heatmap";
};

function MetricTileInner({
  label,
  primary,
  primaryClassName,
  secondary,
  secondaryClassName,
  hint,
  hintClassName,
  body: bodySlot,
  contentClassName,
  labelClassName,
  tone,
  density,
  variant,
}: Omit<MetricCardProps, "className" | "borderedSurfaceClassName"> & {
  tone: MetricTone;
  density: MetricDensity;
  variant: MetricCardVariant;
}) {
  const t = TONE_STYLES[tone];
  const minH = DENSITY_MINH[density];
  const isPipeline = variant === "pipeline";
  const padding = isPipeline ? "px-2 py-2" : "px-3 py-2.5";

  const inner = (
    <>
      {label != null && label !== false && (
        <div className={cn(t.label, labelClassName)}>{label}</div>
      )}
      {bodySlot != null ? (
        bodySlot
      ) : primary != null ? (
        <div className={cn(t.primary, primaryClassName)}>{primary}</div>
      ) : null}
      {secondary != null && (
        <div
          className={cn("text-xs text-muted-foreground", secondaryClassName)}
        >
          {secondary}
        </div>
      )}
      {hint != null && (
        <div
          className={cn(
            "line-clamp-2 max-w-full text-[10px] leading-snug text-muted-foreground sm:text-xs",
            hintClassName,
          )}
        >
          {hint}
        </div>
      )}
    </>
  );

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-1 text-center",
        minH,
        padding,
        contentClassName,
      )}
    >
      {inner}
    </div>
  );
}

export function MetricCard({
  label,
  primary,
  primaryClassName,
  secondary,
  secondaryClassName,
  hint,
  hintClassName,
  body,
  className,
  contentClassName,
  labelClassName,
  tone = "grid",
  variant = "card",
  density = "default",
  borderedSurfaceClassName,
  layout = "metric",
}: MetricCardProps) {
  if (layout === "heatmap") {
    return (
      <div className={cn("space-y-1 text-center", className)}>
        <div
          className={cn(
            "flex min-h-[2.75rem] items-center justify-center rounded-md px-1 py-2 text-xs font-mono font-semibold",
            primaryClassName,
          )}
        >
          {primary}
        </div>
        {label != null && label !== false && (
          <p
            className={cn(
              "line-clamp-2 text-xs leading-tight text-muted-foreground",
              labelClassName,
            )}
          >
            {label}
          </p>
        )}
      </div>
    );
  }

  if (variant === "pipeline") {
    return (
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col border-l-2 border-cyan-500/20 first:border-l-0",
          className,
        )}
      >
        <MetricTileInner
          label={label}
          primary={primary}
          primaryClassName={primaryClassName}
          secondary={secondary}
          secondaryClassName={secondaryClassName}
          hint={hint}
          hintClassName={hintClassName}
          body={body}
          contentClassName={contentClassName}
          labelClassName={labelClassName}
          tone={tone}
          density="pipeline"
          variant="pipeline"
        />
      </div>
    );
  }

  if (variant === "bordered") {
    return (
      <div
        className={cn(
          "flex flex-col rounded-lg border border-border/60",
          borderedSurfaceClassName,
          className,
        )}
      >
        <MetricTileInner
          label={label}
          primary={primary}
          primaryClassName={primaryClassName}
          secondary={secondary}
          secondaryClassName={secondaryClassName}
          hint={hint}
          hintClassName={hintClassName}
          body={body}
          contentClassName={contentClassName}
          labelClassName={labelClassName}
          tone={tone}
          density={density}
          variant="bordered"
        />
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "bg-card text-card-foreground flex min-h-0 min-w-0 flex-col gap-0 py-0 shadow-sm",
        className,
      )}
    >
      <CardContent className="flex flex-1 flex-col p-0 px-0">
        <MetricTileInner
          label={label}
          primary={primary}
          primaryClassName={primaryClassName}
          secondary={secondary}
          secondaryClassName={secondaryClassName}
          hint={hint}
          hintClassName={hintClassName}
          body={body}
          contentClassName={contentClassName}
          labelClassName={labelClassName}
          tone={tone}
          density={density}
          variant="card"
        />
      </CardContent>
    </Card>
  );
}
