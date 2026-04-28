"use client";

import { Card } from "@/components/ui/card";
import { SparklineCell } from "@/components/trading/kpi-card";
import { cn } from "@/lib/utils";
import * as React from "react";

export interface MetricGaugeProps {
  /** Title rendered above the gauge (e.g. "Long/Short ratio"). */
  title: string;
  /** Current value to display + colour-code. Out-of-range values clamp to [min, max]. */
  value: number;
  /** Optional historical sparkline showing the metric trajectory. */
  sparkline?: number[];
  /** Lower bound of the gauge band. Default 0. */
  min?: number;
  /** Upper bound of the gauge band. Default 100. */
  max?: number;
  /**
   * Mid-line tone band — colour-coded zones expressed as fractions of the
   * full [min, max] range. Optional; default behaviour is a continuous
   * neutral-to-active gradient anchored at 0.5.
   */
  zones?: ReadonlyArray<{ from: number; to: number; tone: "positive" | "neutral" | "negative" | "warning" }>;
  /** Format value for display. Default: 2dp. */
  format?: (v: number) => string;
  /** Optional subtitle (e.g. "BTC perp · cross-venue"). */
  subtitle?: string;
  /** Optional change indicator vs last reading. */
  change?: number;
  /** Render compactly (no Card chrome). Default: false. */
  compact?: boolean;
  className?: string;
}

const TONE_FILL: Record<NonNullable<MetricGaugeProps["zones"]>[number]["tone"], string> = {
  positive: "rgba(16, 185, 129, 0.55)",
  neutral: "rgba(148, 163, 184, 0.45)",
  warning: "rgba(245, 158, 11, 0.55)",
  negative: "rgba(239, 68, 68, 0.55)",
};

function defaultFormat(v: number): string {
  if (Math.abs(v) >= 1000) return v.toFixed(0);
  if (Math.abs(v) >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

/**
 * Radial 0–100 (or arbitrary-range) gauge with optional historical sparkline.
 *
 * Built as a presentation primitive on top of `kpi-card.tsx`'s SparklineCell
 * (NOT a parallel sparkline implementation). Replaces the original P0.3
 * `RatioGauge` plan entry — naming makes the intent generic ("metric") rather
 * than ratio-specific.
 *
 * Cross-asset-group use cases:
 *  - Long/Short ratio (Coinglass)
 *  - Put/Call ratio (Deribit-style)
 *  - Sharp/Square ratio (sports)
 *  - Fear & Greed index (CMC sentiment, P7)
 *  - Funding-rate magnitude per asset
 *  - DeFi protocol health score
 */
export function MetricGauge({
  title,
  value,
  sparkline,
  min = 0,
  max = 100,
  zones,
  format = defaultFormat,
  subtitle,
  change,
  compact = false,
  className,
}: MetricGaugeProps) {
  const clamped = Math.max(min, Math.min(max, value));
  const fraction = max === min ? 0.5 : (clamped - min) / (max - min);
  // Render as an arc from 180° (left) to 0° (right) — half-circle gauge.
  const angleDeg = 180 * (1 - fraction);
  const radius = 32;
  const cx = 40;
  const cy = 40;
  const angleRad = (angleDeg * Math.PI) / 180;
  const needleX = cx + radius * Math.cos(Math.PI - angleRad);
  const needleY = cy - radius * Math.sin(angleRad);

  const arcPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

  const body = (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
        <span>{title}</span>
        {change !== undefined && (
          <span className={cn(change >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]")}>
            {change >= 0 ? "+" : ""}
            {change.toFixed(2)}
          </span>
        )}
      </div>
      <div className="flex items-end gap-3">
        <div className="relative w-[80px] h-[44px] shrink-0">
          <svg viewBox="0 0 80 44" className="w-full h-full">
            {/* Track */}
            <path d={arcPath} fill="none" stroke="var(--border)" strokeWidth={6} strokeLinecap="round" />
            {/* Zones */}
            {zones?.map((z, i) => {
              const zStart = (z.from - min) / (max - min);
              const zEnd = (z.to - min) / (max - min);
              const startA = 180 * (1 - zStart);
              const endA = 180 * (1 - zEnd);
              const sx = cx + radius * Math.cos((Math.PI * (180 - startA)) / 180);
              const sy = cy - radius * Math.sin((Math.PI * startA) / 180);
              const ex = cx + radius * Math.cos((Math.PI * (180 - endA)) / 180);
              const ey = cy - radius * Math.sin((Math.PI * endA) / 180);
              const largeArc = Math.abs(endA - startA) > 180 ? 1 : 0;
              const sweep = endA < startA ? 1 : 0;
              return (
                <path
                  key={i}
                  d={`M ${sx} ${sy} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${ex} ${ey}`}
                  fill="none"
                  stroke={TONE_FILL[z.tone]}
                  strokeWidth={6}
                  strokeLinecap="round"
                />
              );
            })}
            {/* Needle */}
            <line
              x1={cx}
              y1={cy}
              x2={needleX}
              y2={needleY}
              stroke="var(--foreground)"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r={2.5} fill="var(--foreground)" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-semibold font-mono tabular-nums leading-tight">{format(clamped)}</span>
          {sparkline && sparkline.length > 1 && (
            <div className="mt-0.5">
              <SparklineCell data={sparkline} />
            </div>
          )}
          {subtitle && <span className="text-[10px] text-muted-foreground/70">{subtitle}</span>}
        </div>
      </div>
    </div>
  );

  if (compact) {
    return <div className={cn("p-2", className)}>{body}</div>;
  }

  return <Card className={cn("p-3 bg-card", className)}>{body}</Card>;
}
