"use client";

import * as React from "react";

// Canvas-only. Zero JSX SVG elements.
// Matches reference: large fixed-position nodes, sequential packet firing per connection.

const NODES = [
  {
    id: "tradfi",
    label: "TradFi",
    sub: "CME · ICE",
    color: "#22d3ee",
    fill: "#061820",
    fx: 0.16,
    fy: 0.36,
  },
  {
    id: "cefi",
    label: "CeFi",
    sub: "Binance · OKX",
    color: "#4ade80",
    fill: "#061a0f",
    fx: 0.5,
    fy: 0.19,
  },
  {
    id: "defi",
    label: "DeFi",
    sub: "Uniswap · Aave",
    color: "#a78bfa",
    fill: "#100a20",
    fx: 0.84,
    fy: 0.36,
  },
  {
    id: "sports",
    label: "Sports",
    sub: "Betfair · Pinnacle",
    color: "#fbbf24",
    fill: "#1a1205",
    fx: 0.24,
    fy: 0.8,
  },
  {
    id: "predictions",
    label: "Predictions",
    sub: "Polymarket · Kalshi",
    color: "#fb7185",
    fill: "#1a060c",
    fx: 0.73,
    fy: 0.8,
  },
];

// Sequential connections — same order every loop, matching reference image
// Nodes: TradFi(0), CeFi(1), DeFi(2), Sports(3), Predictions(4)
const CONNECTIONS = [
  { from: 0, to: 1, label: "BTC", delta: "+0.31%", color: "#f59e0b" }, // TradFi to CeFi
  { from: 1, to: 2, label: "BTC", delta: "+0.19%", color: "#f59e0b" }, // CeFi to DeFi
  { from: 0, to: 2, label: "BTC", delta: "+0.12%", color: "#f59e0b" }, // TradFi to DeFi (diagonal)
  { from: 4, to: 1, label: "BTC", delta: "+0.24%", color: "#f59e0b" }, // Predictions to CeFi - Polymarket BTC vs Binance/Deribit
  { from: 0, to: 4, label: "S&P", delta: "+0.08%", color: "#60a5fa" }, // TradFi to Predictions
  { from: 3, to: 4, label: "Football", delta: "+2.1%", color: "#4ade80" }, // Sports to Predictions
];

const PACKET_DURATION_MS = 1800;
const PAUSE_MS = 500;

export function ArbitrageGalaxy() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const rafRef = React.useRef<number>(0);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxOrNull = canvas.getContext("2d");
    if (!ctxOrNull) return;
    const ctx: CanvasRenderingContext2D = ctxOrNull;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const R = Math.min(W, H) * 0.13; // node radius — large enough for text

    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 0.8 + 0.2,
      alpha: Math.random() * 0.3 + 0.08,
      phase: Math.random() * Math.PI * 2,
    }));

    function xy(node: (typeof NODES)[0]) {
      return { x: node.fx * W, y: node.fy * H };
    }

    // sequencing state
    let connIdx = 0;
    let startMs = -1;
    let pausing = false;
    let pauseEnd = -1;

    function drawRoundRect(
      x: number,
      y: number,
      w: number,
      h: number,
      rx: number,
      fill: string,
      stroke: string,
      lw = 1,
    ) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, rx);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.stroke();
    }

    function renderFrame(t: number) {
      ctx.clearRect(0, 0, W, H);

      // stars
      for (const s of stars) {
        const a = s.alpha * (0.55 + 0.45 * Math.sin(t * 0.0007 + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
        ctx.fill();
      }

      // all dashed lines (static, dimmed)
      for (let ci = 0; ci < CONNECTIONS.length; ci++) {
        const conn = CONNECTIONS[ci];
        const a = xy(NODES[conn.from]);
        const b = xy(NODES[conn.to]);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = conn.color + "60";
        ctx.lineWidth = 2;
        ctx.setLineDash([9, 9]);
        ctx.lineDashOffset = -((t * 0.02 + ci * 30) % 36);
        ctx.stroke();
        ctx.restore();

        // static pill label at midpoint
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        ctx.font = "bold 11px 'Geist', sans-serif";
        const tw = ctx.measureText(conn.label).width + 18;
        const isActive = ci === connIdx && !pausing;
        const pillFill = isActive ? conn.color + "40" : conn.color + "15";
        const pillStroke = isActive ? conn.color + "cc" : conn.color + "55";
        drawRoundRect(
          mx - tw / 2,
          my - 11,
          tw,
          22,
          11,
          pillFill,
          pillStroke,
          isActive ? 1.5 : 1,
        );
        ctx.fillStyle = isActive ? conn.color : conn.color + "99";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(conn.label, mx, my);
      }

      // sequenced packet animation
      if (pausing) {
        if (t >= pauseEnd) {
          pausing = false;
          connIdx = (connIdx + 1) % CONNECTIONS.length;
          startMs = -1;
        }
      } else {
        if (startMs < 0) startMs = t;
        const progress = Math.min((t - startMs) / PACKET_DURATION_MS, 1);

        const conn = CONNECTIONS[connIdx];
        const a = xy(NODES[conn.from]);
        const b = xy(NODES[conn.to]);
        const px = a.x + (b.x - a.x) * progress;
        const py = a.y + (b.y - a.y) * progress;

        // bright dashed line for active connection
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = conn.color + "cc";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([9, 9]);
        ctx.lineDashOffset = -((t * 0.06) % 36);
        ctx.stroke();
        ctx.restore();

        // trail
        for (let i = 8; i >= 0; i--) {
          const tp = Math.max(0, progress - i * 0.022);
          const tx = a.x + (b.x - a.x) * tp;
          const ty = a.y + (b.y - a.y) * tp;
          const ta = ((8 - i) / 8) * 0.5;
          const tr = 6 - i * 0.5;
          ctx.beginPath();
          ctx.arc(tx, ty, Math.max(tr, 1), 0, Math.PI * 2);
          ctx.fillStyle =
            conn.color +
            Math.floor(ta * 255)
              .toString(16)
              .padStart(2, "0");
          ctx.fill();
        }

        // outer glow
        const glow = ctx.createRadialGradient(px, py, 0, px, py, 18);
        glow.addColorStop(0, conn.color + "bb");
        glow.addColorStop(1, conn.color + "00");
        ctx.beginPath();
        ctx.arc(px, py, 18, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // core dot
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        // floating delta badge
        if (progress > 0.12 && progress < 0.88) {
          const badge = conn.delta;
          ctx.font = "bold 10px 'Geist Mono', monospace";
          const bw = ctx.measureText(badge).width + 14;
          drawRoundRect(
            px - bw / 2,
            py - 26,
            bw,
            18,
            9,
            "#0a0a0b",
            conn.color,
            1.2,
          );
          ctx.fillStyle = conn.color;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(badge, px, py - 17);
        }

        if (progress >= 1) {
          pausing = true;
          pauseEnd = t + PAUSE_MS;
        }
      }

      // nodes — drawn last so they sit on top of lines
      for (const node of NODES) {
        const { x, y } = xy(node);

        // halo glow
        const glow = ctx.createRadialGradient(x, y, R * 0.3, x, y, R * 1.8);
        glow.addColorStop(0, node.color + "18");
        glow.addColorStop(1, node.color + "00");
        ctx.beginPath();
        ctx.arc(x, y, R * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // filled circle
        ctx.beginPath();
        ctx.arc(x, y, R, 0, Math.PI * 2);
        ctx.fillStyle = node.fill;
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2.5;
        ctx.fill();
        ctx.stroke();

        // title — matches reference bold coloured text
        const titleSize = Math.round(R * 0.3);
        ctx.fillStyle = node.color;
        ctx.font = `bold ${titleSize}px 'Geist', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.label, x, y - R * 0.18);

        // subtitle — readable grey
        const subSize = Math.round(R * 0.21);
        ctx.fillStyle = "rgba(190,190,200,0.70)";
        ctx.font = `${subSize}px 'Geist', sans-serif`;
        ctx.fillText(node.sub, x, y + R * 0.3);
      }
    }

    let lastFrame = 0;
    const FRAME_INTERVAL = 1000 / 24; // 24fps — smooth enough, half the CPU
    function loop(ts: number) {
      if (ts - lastFrame >= FRAME_INTERVAL) {
        renderFrame(ts);
        lastFrame = ts;
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      suppressHydrationWarning
      className="block w-full rounded-lg"
      style={{
        aspectRatio: "2.2 / 1",
        maxHeight: 450,
        background: "transparent",
      }}
    />
  );
}
