"use client";

import * as React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";
import {
  FactorTooltipCard,
  NEG_FILL,
  POS_FILL,
  formatSignedCompact,
  type FactorSubviewProps,
} from "./pnl-waterfall-helpers";

interface PieDatum {
  name: string;
  value: number;
  signed: number;
  isNegative: boolean;
  rank: number;
  pctOfAbs: number;
}

function renderActiveSector(props: unknown) {
  const p = props as {
    cx?: number;
    cy?: number;
    innerRadius?: number;
    outerRadius?: number;
    startAngle?: number;
    endAngle?: number;
    fill?: string;
  };
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = p;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={(outerRadius ?? 0) + 4}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke="var(--primary)"
      strokeWidth={1.5}
      fillOpacity={0.95}
    />
  );
}

interface PieLegendProps {
  visibleLegend: PieDatum[];
  allCount: number;
  selectedFactor: string | null;
  hoverName: string | null;
  hasEmphasis: boolean;
  showAll: boolean;
  onToggleAll: () => void;
  onSelect: (name: string) => void;
  onHover: (name: string | null) => void;
}

function PieLegend({
  visibleLegend,
  allCount,
  selectedFactor,
  hoverName,
  hasEmphasis,
  showAll,
  onToggleAll,
  onSelect,
  onHover,
}: PieLegendProps) {
  return (
    <div className="w-[44%] min-w-[180px] max-w-[260px] shrink-0 overflow-auto pr-0.5">
      <div className="grid grid-cols-[8px_1fr_auto_auto] items-center gap-x-2 text-nano uppercase tracking-[0.08em] text-muted-foreground/60 border-b border-border/60 pb-1 mb-1 sticky top-0 bg-background/95 backdrop-blur-sm">
        <span />
        <span>Factor</span>
        <span className="text-right">Value</span>
        <span className="text-right w-[38px]">%</span>
      </div>
      <div className="space-y-[1px]">
        {visibleLegend.map((d) => {
          const isSelected = selectedFactor === d.name;
          const isHovered = hoverName === d.name;
          const emphasized = isSelected || isHovered;
          const dim = hasEmphasis && !emphasized;
          return (
            <button
              key={d.name}
              type="button"
              onClick={() => onSelect(d.name)}
              onMouseEnter={() => onHover(d.name)}
              onMouseLeave={() => onHover(null)}
              className={`w-full grid grid-cols-[8px_1fr_auto_auto] items-center gap-x-2 rounded px-1.5 py-0.5 text-left transition-colors duration-150 ${
                isSelected ? "bg-primary/12 ring-1 ring-primary/25" : isHovered ? "bg-muted/60" : "hover:bg-muted/40"
              } ${dim ? "opacity-55" : "opacity-100"}`}
            >
              <span
                className="h-3 w-[3px] rounded-[1px]"
                style={{
                  backgroundColor: d.isNegative ? NEG_FILL : POS_FILL,
                  opacity: 0.9,
                }}
              />
              <span
                className={`truncate text-[11px] ${isSelected ? "text-primary font-medium" : "text-foreground/90"}`}
                title={`${d.name} · rank #${d.rank}`}
              >
                {d.name}
              </span>
              <span
                className="text-[10.5px] font-mono tabular-nums text-right whitespace-nowrap"
                style={{ color: d.isNegative ? "var(--pnl-negative)" : "var(--pnl-positive)" }}
              >
                {formatSignedCompact(d.signed)}
              </span>
              <span className="text-[10.5px] font-mono tabular-nums text-right text-muted-foreground w-[38px]">
                {d.pctOfAbs.toFixed(1)}%
              </span>
            </button>
          );
        })}
        {allCount > 8 && (
          <button
            type="button"
            onClick={onToggleAll}
            className="w-full text-micro text-muted-foreground/80 hover:text-foreground transition-colors pt-1.5 text-left pl-3.5"
          >
            {showAll ? "\u2212 Show top 8" : `+ Show all ${allCount}`}
          </button>
        )}
      </div>
    </div>
  );
}

export function FactorPie({ components, selectedFactor, onSelect }: FactorSubviewProps) {
  const totalAbs = React.useMemo(() => components.reduce((s, c) => s + Math.abs(c.value), 0) || 1, [components]);
  const netSigned = React.useMemo(() => components.reduce((s, c) => s + c.value, 0), [components]);
  const posCount = components.filter((c) => !c.isNegative).length;
  const negCount = components.filter((c) => c.isNegative).length;

  const data: PieDatum[] = React.useMemo(() => {
    const enriched = components.map((c) => ({
      name: c.name,
      value: Math.abs(c.value),
      signed: c.value,
      isNegative: !!c.isNegative,
      pctOfAbs: (Math.abs(c.value) / totalAbs) * 100,
    }));
    const rankMap = new Map([...enriched].sort((a, b) => b.value - a.value).map((d, i) => [d.name, i + 1] as const));
    const positives = enriched.filter((d) => !d.isNegative).sort((a, b) => b.value - a.value);
    const negatives = enriched.filter((d) => d.isNegative).sort((a, b) => b.value - a.value);
    return [...positives, ...negatives].map((d) => ({ ...d, rank: rankMap.get(d.name) ?? 0 }));
  }, [components, totalAbs]);

  const rankedForLegend = React.useMemo(() => [...data].sort((a, b) => a.rank - b.rank), [data]);

  const [hoverName, setHoverName] = React.useState<string | null>(null);
  const [showAllLegend, setShowAllLegend] = React.useState(false);

  const emphasisName = hoverName ?? selectedFactor ?? null;
  const hasEmphasis = emphasisName !== null;
  const activeIndex = hasEmphasis ? data.findIndex((d) => d.name === emphasisName) : -1;

  const visibleLegend = showAllLegend ? rankedForLegend : rankedForLegend.slice(0, 8);

  return (
    <div className="w-full h-[280px] shrink-0 flex gap-3" data-testid="factor-pie">
      <div className="relative flex-1 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              wrapperStyle={{ outline: "none" }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const row = payload[0]?.payload as PieDatum | undefined;
                if (!row) return null;
                return (
                  <FactorTooltipCard
                    name={row.name}
                    signed={row.signed}
                    pctOfAbs={row.pctOfAbs}
                    rank={row.rank}
                    total={data.length}
                  />
                );
              }}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="90%"
              paddingAngle={1.2}
              startAngle={90}
              endAngle={-270}
              stroke="var(--background)"
              strokeWidth={1}
              isAnimationActive
              animationDuration={360}
              animationEasing="ease-out"
              activeIndex={activeIndex >= 0 ? activeIndex : undefined}
              activeShape={renderActiveSector}
              onMouseEnter={(datum: unknown) => {
                const d = datum as { name?: string } | undefined;
                if (d?.name) setHoverName(d.name);
              }}
              onMouseLeave={() => setHoverName(null)}
              onClick={(datum: unknown) => {
                const d = datum as { name?: string } | undefined;
                if (d?.name) onSelect(d.name);
              }}
              cursor="pointer"
            >
              {data.map((d, i) => {
                const isEmphasized = emphasisName === d.name;
                const dim = hasEmphasis && !isEmphasized;
                const alt = i % 2 === 0;
                const baseOpacity = alt ? 0.82 : 0.66;
                return (
                  <Cell
                    key={d.name}
                    fill={d.isNegative ? NEG_FILL : POS_FILL}
                    fillOpacity={dim ? 0.26 : baseOpacity}
                    stroke="var(--background)"
                    strokeWidth={1.25}
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4"
          aria-hidden
        >
          <span className="text-[8.5px] uppercase tracking-[0.18em] text-muted-foreground/70 font-medium">
            Net attribution
          </span>
          <span
            className="font-mono tabular-nums text-[18px] leading-none font-semibold mt-1.5 whitespace-nowrap"
            style={{
              color: netSigned < 0 ? "var(--pnl-negative)" : "var(--pnl-positive)",
              letterSpacing: "-0.015em",
            }}
          >
            {formatSignedCompact(netSigned)}
          </span>
          <div className="mt-2 flex items-center gap-1.5 text-nano font-mono tabular-nums text-muted-foreground/80">
            <span>{data.length} factors</span>
            <span className="h-2 w-px bg-border/70" />
            <span className="inline-flex items-center gap-0.5">
              <span className="h-2 w-[2px] rounded-[1px] bg-[var(--pnl-positive)]/85" />
              <span className="text-[var(--pnl-positive)]/90">{posCount}</span>
            </span>
            <span className="inline-flex items-center gap-0.5">
              <span className="h-2 w-[2px] rounded-[1px] bg-[var(--pnl-negative)]/85" />
              <span className="text-[var(--pnl-negative)]/90">{negCount}</span>
            </span>
          </div>
        </div>
      </div>

      <PieLegend
        visibleLegend={visibleLegend}
        allCount={data.length}
        selectedFactor={selectedFactor}
        hoverName={hoverName}
        hasEmphasis={hasEmphasis}
        showAll={showAllLegend}
        onToggleAll={() => setShowAllLegend((v) => !v)}
        onSelect={onSelect}
        onHover={setHoverName}
      />
    </div>
  );
}
