"use client";

import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/formatters";
import * as React from "react";

interface AssetGalaxyProps {
  className?: string;
  showStats?: boolean;
}

const NODES = [
  { label: "TradFi", sub: "CME · ICE", color: "#22d3ee", fill: "#051318" },
  { label: "CeFi", sub: "Binance · OKX", color: "#4ade80", fill: "#05130a" },
  { label: "DeFi", sub: "Uniswap · Aave", color: "#a78bfa", fill: "#0c0818" },
  {
    label: "Sports",
    sub: "Betfair · Smarkets",
    color: "#fbbf24",
    fill: "#141003",
  },
  {
    label: "Predictions",
    sub: "Polymarket · Kalshi",
    color: "#fb7185",
    fill: "#140508",
  },
];

// Fixed positions as fractions of W×H, matching the reference image pentagon
const POS = [
  { fx: 0.17, fy: 0.38 }, // TradFi     : left mid
  { fx: 0.5, fy: 0.17 }, // CeFi       : top center
  { fx: 0.83, fy: 0.38 }, // DeFi       : right mid
  { fx: 0.26, fy: 0.8 }, // Sports     : bottom left
  { fx: 0.74, fy: 0.8 }, // Predictions: bottom right
];

const CONNECTIONS = [
  { from: 0, to: 1, label: "BTC", color: "#f59e0b" }, // TradFi  → CeFi
  { from: 1, to: 2, label: "BTC", color: "#f59e0b" }, // CeFi    → DeFi
  { from: 0, to: 4, label: "S&P", color: "#60a5fa" }, // TradFi  → Predictions
  { from: 3, to: 4, label: "Football", color: "#4ade80" }, // Sports  → Predictions
];

const STATS = [
  { value: "5", label: "Asset Classes", color: "#22d3ee" },
  { value: "128", label: "Venues", color: "#4ade80" },
  { value: "20+", label: "Strategies", color: "#a78bfa" },
  { value: "24/7", label: "Trading", color: "#fbbf24" },
];

// Stars generated once
const STARS = Array.from({ length: 60 }, (_, i) => ({
  x: (i * 137.508) % 1,
  y: (i * 97.3) % 1,
  r: 0.3 + (i % 5) * 0.15,
  alpha: 0.08 + (i % 7) * 0.025,
  phase: i * 0.9,
}));

export function AssetGalaxy({ className, showStats = true }: AssetGalaxyProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const rafRef = React.useRef<number>(0);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let W = 0,
      H = 0,
      dpr = 1;

    function resize() {
      if (!canvas) return;
      dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }

    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function drawFrame(t: number) {
      const ctx = canvas!.getContext("2d");
      if (!ctx || W === 0 || H === 0) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      // Node radius — based on the shorter axis, large enough to be circles
      const R = Math.min(W, H) * 0.135;

      // Node screen coords
      const pts = POS.map((p) => ({ x: p.fx * W, y: p.fy * H }));

      // Stars
      for (const s of STARS) {
        const a = s.alpha * (0.6 + 0.4 * Math.sin(t * 0.0007 + s.phase));
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${formatNumber(a, 3)})`;
        ctx.fill();
      }

      // Connections
      for (let i = 0; i < CONNECTIONS.length; i++) {
        const c = CONNECTIONS[i];
        const a = pts[c.from];
        const b = pts[c.to];
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;

        ctx.save();
        ctx.setLineDash([10, 8]);
        ctx.lineDashOffset = -((t * 0.035 + i * 40) % 40);
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();

        // Pill label
        const font = `bold ${Math.round(R * 0.175)}px 'Geist', ui-sans-serif, sans-serif`;
        ctx.font = font;
        const tw = ctx.measureText(c.label).width;
        const pw = tw + 18,
          ph = R * 0.35;
        const pr = ph / 2;

        ctx.beginPath();
        ctx.roundRect(mx - pw / 2, my - ph / 2, pw, ph, pr);
        ctx.fillStyle = c.color + "28";
        ctx.fill();
        ctx.strokeStyle = c.color + "99";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = c.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(c.label, mx, my);
      }

      // Nodes
      for (let i = 0; i < NODES.length; i++) {
        const n = NODES[i];
        const { x, y } = pts[i];

        // Outer glow halo
        const grd = ctx.createRadialGradient(x, y, R * 0.4, x, y, R * 2.0);
        grd.addColorStop(0, n.color + "20");
        grd.addColorStop(1, n.color + "00");
        ctx.beginPath();
        ctx.arc(x, y, R * 2.0, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Circle fill + border
        ctx.beginPath();
        ctx.arc(x, y, R, 0, Math.PI * 2);
        ctx.fillStyle = n.fill;
        ctx.strokeStyle = n.color;
        ctx.lineWidth = 2.5;
        ctx.fill();
        ctx.stroke();

        // Title text
        const titleSize = Math.max(Math.round(R * 0.28), 14);
        ctx.fillStyle = n.color;
        ctx.font = `bold ${titleSize}px 'Geist', ui-sans-serif, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.label, x, y - R * 0.16);

        // Sub text
        const subSize = Math.max(Math.round(R * 0.19), 11);
        ctx.fillStyle = "rgba(190,198,215,0.80)";
        ctx.font = `${subSize}px 'Geist', ui-sans-serif, sans-serif`;
        ctx.fillText(n.sub, x, y + R * 0.28);
      }

      ctx.restore();
    }

    function loop(ts: number) {
      drawFrame(ts);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div className={cn("w-full flex items-center gap-10 px-4", className)}>
      <canvas
        ref={canvasRef}
        suppressHydrationWarning
        className="block flex-1 min-w-0 rounded-xl"
        style={{ aspectRatio: "16 / 10", maxHeight: 480 }}
      />
      {showStats && (
        <div className="flex flex-col gap-7 flex-shrink-0">
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
