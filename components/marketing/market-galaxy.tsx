"use client";
import * as React from "react";

// This file satisfies Turbopack's stale cached bundle reference.
// All rendering is delegated to the inline GalaxyViz in app/page.tsx.
// The SVG below is canvas-equivalent but avoids any invalid DOM props.

interface MarketGalaxyProps {
  className?: string;
  showStats?: boolean;
  animate?: boolean;
}

const NODES = [
  {
    label: "TradFi",
    sub: "CME · ICE",
    color: "#22d3ee",
    fill: "#051318",
    angle: -126,
  },
  {
    label: "CeFi",
    sub: "Binance · OKX",
    color: "#4ade80",
    fill: "#05130a",
    angle: -54,
  },
  {
    label: "DeFi",
    sub: "Uniswap · Aave",
    color: "#a78bfa",
    fill: "#0c0818",
    angle: 18,
  },
  {
    label: "Sports",
    sub: "Betfair · Smarkets",
    color: "#fbbf24",
    fill: "#141003",
    angle: 90,
  },
  {
    label: "Predictions",
    sub: "Polymarket · Kalshi",
    color: "#fb7185",
    fill: "#140508",
    angle: 162,
  },
];
const CONNS = [
  { from: 0, to: 1, label: "BTC", color: "#f59e0b" },
  { from: 1, to: 2, label: "BTC", color: "#f59e0b" },
  { from: 0, to: 2, label: "BTC", color: "#f59e0b" },
  { from: 0, to: 4, label: "S&P", color: "#60a5fa" },
  { from: 3, to: 4, label: "Football", color: "#4ade80" },
];
const STATS = [
  { value: "5", label: "Asset Classes", color: "#22d3ee" },
  { value: "128", label: "Venues", color: "#4ade80" },
  { value: "20+", label: "Strategies", color: "#a78bfa" },
  { value: "24/7", label: "Trading", color: "#fbbf24" },
];

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}
function getNodePosition(angle: number, cx: number, cy: number, r: number) {
  return {
    x: cx + r * Math.cos(toRad(angle)),
    y: cy + r * Math.sin(toRad(angle)),
  };
}

export function MarketGalaxy({ className, showStats = true, animate }: MarketGalaxyProps) {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 80);
    return () => clearInterval(id);
  }, []);

  const W = 520,
    H = 340,
    cx = W * 0.45,
    cy = H * 0.5,
    R = 120,
    nr = 46;

  const pts = NODES.map((n) => getNodePosition(n.angle, cx, cy, R));

  return (
    <div className="w-full flex items-center gap-8 px-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block flex-1 min-w-0 rounded-xl"
        style={{ minHeight: 280 }}
        suppressHydrationWarning
      >
        <defs>
          {NODES.map((n, i) => (
            <radialGradient key={i} id={`halo-${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={n.color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={n.color} stopOpacity={0} />
            </radialGradient>
          ))}
        </defs>

        {/* connections */}
        {CONNS.map((c, i) => {
          const a = pts[c.from],
            b = pts[c.to];
          const mx = (a.x + b.x) / 2,
            my = (a.y + b.y) / 2;
          const offset = (tick * 1.2 + i * 30) % 36;
          return (
            <g key={i}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={c.color}
                strokeOpacity={0.55}
                strokeWidth={1.8}
                strokeDasharray="9 7"
                strokeDashoffset={-offset}
              />
              <rect
                x={mx - 18}
                y={my - 9}
                width={36}
                height={18}
                rx={9}
                fill={c.color + "28"}
                stroke={c.color + "99"}
                strokeWidth={1}
              />
              <text
                x={mx}
                y={my + 4.5}
                textAnchor="middle"
                fill={c.color}
                fontSize={9}
                fontWeight="bold"
                fontFamily="ui-sans-serif,sans-serif"
              >
                {c.label}
              </text>
            </g>
          );
        })}

        {/* nodes */}
        {NODES.map((n, i) => {
          const { x, y } = pts[i];
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={nr * 1.9} fill={`url(#halo-${i})`} />
              <circle cx={x} cy={y} r={nr} fill={n.fill} stroke={n.color} strokeWidth={2.2} />
              <text
                x={x}
                y={y - 5}
                textAnchor="middle"
                fill={n.color}
                fontSize={13}
                fontWeight="bold"
                fontFamily="ui-sans-serif,sans-serif"
              >
                {n.label}
              </text>
              <text
                x={x}
                y={y + 14}
                textAnchor="middle"
                fill="rgba(190,198,215,0.8)"
                fontSize={9}
                fontFamily="ui-sans-serif,sans-serif"
              >
                {n.sub}
              </text>
            </g>
          );
        })}
      </svg>

      {showStats && (
        <div className="flex flex-col gap-6 flex-shrink-0">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold tabular-nums leading-none" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
