"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PnLComponent } from "@/lib/types/pnl";
import {
  FactorTooltipCard,
  NEG_FILL,
  POS_FILL,
  formatAxisCompact,
  formatSignedCompact,
  rankByMagnitude,
  type FactorSubviewProps,
} from "./pnl-waterfall-helpers";

export function FactorHistogram({ components, selectedFactor, onSelect }: FactorSubviewProps) {
  const ranked = React.useMemo(() => rankByMagnitude(components), [components]);
  const total = components.length;
  const totalAbs = React.useMemo(() => ranked.reduce((s, c) => s + c.abs, 0) || 1, [ranked]);
  const maxAbs = React.useMemo(() => Math.max(...ranked.map((c) => c.abs), 1), [ranked]);
  const hasSelection = selectedFactor !== null;

  const needsRotate = components.length > 6 || components.some((c) => c.name.length > 6);

  const formatXTick = React.useCallback((name: string) => (name.length <= 7 ? name : `${name.slice(0, 6)}\u2026`), []);

  return (
    <div className="w-full h-[280px] shrink-0" data-testid="factor-histogram">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={components}
          margin={{ top: 18, right: 10, bottom: needsRotate ? 54 : 22, left: 4 }}
          barCategoryGap="22%"
        >
          <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" strokeOpacity={0.35} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}
            axisLine={{ stroke: "var(--border)", strokeOpacity: 0.6 }}
            tickLine={false}
            interval={0}
            angle={needsRotate ? -32 : 0}
            textAnchor={needsRotate ? "end" : "middle"}
            height={needsRotate ? 54 : 22}
            tickFormatter={formatXTick}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}
            tickFormatter={(v: number) => formatAxisCompact(v)}
            width={56}
            axisLine={false}
            tickLine={false}
            tickCount={5}
          />
          <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} strokeOpacity={0.9} ifOverflow="extendDomain" />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeOpacity: 0.35, strokeDasharray: "2 3", strokeWidth: 1 }}
            wrapperStyle={{ outline: "none" }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const row = payload[0]?.payload as PnLComponent | undefined;
              if (!row) return null;
              const rankEntry = ranked.find((r) => r.name === row.name);
              const rank = rankEntry?.rank ?? 0;
              const pctOfAbs = (Math.abs(row.value) / totalAbs) * 100;
              return (
                <FactorTooltipCard name={row.name} signed={row.value} pctOfAbs={pctOfAbs} rank={rank} total={total} />
              );
            }}
          />
          <Bar
            dataKey="value"
            radius={[2, 2, 0, 0]}
            isAnimationActive
            animationDuration={320}
            animationEasing="ease-out"
            onClick={(datum: unknown) => {
              const d = datum as { name?: string } | undefined;
              if (d?.name) onSelect(d.name);
            }}
            cursor="pointer"
          >
            {components.map((c) => {
              const isSelected = selectedFactor === c.name;
              const baseOpacity = hasSelection ? (isSelected ? 0.95 : 0.28) : 0.72;
              return (
                <Cell
                  key={c.name}
                  fill={c.isNegative ? NEG_FILL : POS_FILL}
                  fillOpacity={baseOpacity}
                  stroke={isSelected ? "var(--primary)" : "transparent"}
                  strokeWidth={isSelected ? 2 : 0}
                />
              );
            })}
            <LabelList
              dataKey="value"
              content={(props: unknown) => {
                const p = props as {
                  x?: number;
                  y?: number;
                  width?: number;
                  height?: number;
                  value?: number;
                  index?: number;
                };
                const { x = 0, y = 0, width = 0, value = 0, index } = p;
                if (!width || Math.abs(width) < 8) return null;
                const absVal = Math.abs(value);
                if (absVal < maxAbs * 0.1) return null;
                if (hasSelection && typeof index === "number") {
                  const cName = components[index]?.name;
                  if (cName && cName !== selectedFactor) return null;
                }
                const isNeg = value < 0;
                const h = p.height ?? 0;
                const labelY = isNeg ? y + h + 11 : y - 5;
                return (
                  <text
                    x={x + width / 2}
                    y={labelY}
                    fill="var(--foreground)"
                    fillOpacity={0.72}
                    fontSize={9.5}
                    fontFamily="var(--font-mono)"
                    textAnchor="middle"
                    style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}
                  >
                    {formatSignedCompact(value)}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
