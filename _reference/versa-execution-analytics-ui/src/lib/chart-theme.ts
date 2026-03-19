/**
 * Recharts theme tokens — aligned with unified-trading-ui-kit design tokens.
 * Import these into every chart component to ensure dark-mode consistency.
 */

export const CHART_COLORS = [
  "var(--color-accent-cyan)",
  "var(--color-accent-green)",
  "var(--color-accent-amber)",
  "var(--color-accent-blue)",
  "var(--color-accent-purple)",
  "var(--color-accent-red)",
];

export const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "var(--color-bg-elevated)",
    border: "1px solid var(--color-border-default)",
    borderRadius: "6px",
    color: "var(--color-text-primary)",
    fontSize: "12px",
  },
  labelStyle: { color: "var(--color-text-secondary)" },
  itemStyle: { color: "var(--color-text-primary)" },
};

export const GRID_STYLE = {
  stroke: "var(--color-border-subtle)",
  strokeDasharray: "3 3",
};

export const AXIS_STYLE = {
  tick: { fill: "var(--color-text-muted)", fontSize: 11 },
  axisLine: { stroke: "var(--color-border-default)" },
  tickLine: { stroke: "var(--color-border-default)" },
};

export const LEGEND_STYLE = {
  wrapperStyle: { color: "var(--color-text-secondary)", fontSize: "12px" },
};
