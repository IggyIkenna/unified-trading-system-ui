"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useVolSurface } from "@/hooks/api/use-market-data";
import { mock01 } from "@/lib/mocks/generators/deterministic";
import { formatPercent } from "@/lib/utils/formatters";

// ---------- Types ----------

interface VolSmilePoint {
  strike: number;
  iv: number;
}

interface VolSmileLine {
  expiry: string;
  daysToExpiry: number;
  points: VolSmilePoint[];
  atmIv: number;
  skew25Delta: number;
}

interface VolSurfaceResponse {
  underlying: string;
  smiles: VolSmileLine[];
}

interface VolSurfaceChartProps {
  underlying: string;
  height?: number;
  className?: string;
}

// ---------- Mock data ----------

function generateMockVolSurface(underlying: string): VolSurfaceResponse {
  const spots: Record<string, number> = {
    BTC: 67234.5,
    ETH: 3456.78,
    SPY: 542.3,
  };
  const ticks: Record<string, number> = { BTC: 1000, ETH: 50, SPY: 5 };

  const spotPrice = spots[underlying] ?? 100;
  const tickSize = ticks[underlying] ?? 1;
  const halfRange = 5;

  const expiryBuckets = [
    { label: "7d", days: 7 },
    { label: "14d", days: 14 },
    { label: "30d", days: 30 },
    { label: "90d", days: 90 },
  ];

  const underlyingSalt = [...underlying].reduce((acc, c) => acc + c.charCodeAt(0), 0);

  const smiles: VolSmileLine[] = expiryBuckets.map(({ label, days }, expIdx) => {
    const roundedSpot = Math.round(spotPrice / tickSize) * tickSize;
    const baseIv = 0.35 + (days / 365) * 0.08;
    const points: VolSmilePoint[] = [];
    let atmIv = baseIv;

    for (let i = -halfRange; i <= halfRange; i++) {
      const strike = roundedSpot + i * tickSize;
      // Smile shape: higher IV at wings, minimum near ATM
      const moneyness = Math.log(strike / spotPrice);
      const skewTerm = -0.08 * moneyness; // Put skew
      const convexityTerm = 0.6 * moneyness * moneyness; // Smile curvature
      const strikeIdx = i + halfRange;
      const iv =
        baseIv + skewTerm + convexityTerm + (mock01(strikeIdx + expIdx * 20, underlyingSalt + 601) - 0.5) * 0.005;

      if (i === 0) atmIv = iv;
      points.push({ strike, iv });
    }

    // 25-delta skew approximation: IV at ~25d put minus IV at ~25d call
    const putWingIv = points[1]?.iv ?? baseIv;
    const callWingIv = points[points.length - 2]?.iv ?? baseIv;
    const skew25Delta = putWingIv - callWingIv;

    return { expiry: label, daysToExpiry: days, points, atmIv, skew25Delta };
  });

  return { underlying, smiles };
}

// ---------- Colours for expiry lines ----------

const LINE_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
];

// ---------- Component ----------

export function VolSurfaceChart({ underlying, height = 350, className }: VolSurfaceChartProps) {
  const { data, isLoading } = useVolSurface(underlying);

  const surface: VolSurfaceResponse = React.useMemo(() => {
    if (data && typeof data === "object" && "smiles" in (data as Record<string, unknown>)) {
      return data as VolSurfaceResponse;
    }
    return generateMockVolSurface(underlying);
  }, [data, underlying]);

  // Build unified chart data: one row per strike, one column per expiry
  const chartData = React.useMemo(() => {
    if (surface.smiles.length === 0) return [];

    // Use the longest expiry's strike list as the x-axis domain
    const allStrikes = new Set<number>();
    for (const smile of surface.smiles) {
      for (const pt of smile.points) {
        allStrikes.add(pt.strike);
      }
    }

    const strikes = Array.from(allStrikes).sort((a, b) => a - b);

    return strikes.map((strike) => {
      const row: Record<string, number> = { strike };
      for (const smile of surface.smiles) {
        const pt = smile.points.find((p) => p.strike === strike);
        if (pt) {
          row[smile.expiry] = pt.iv * 100; // Convert to percentage for display
        }
      }
      return row;
    });
  }, [surface]);

  const avgAtmIv =
    surface.smiles.length > 0 ? surface.smiles.reduce((sum, s) => sum + s.atmIv, 0) / surface.smiles.length : 0;

  const avgSkew =
    surface.smiles.length > 0 ? surface.smiles.reduce((sum, s) => sum + s.skew25Delta, 0) / surface.smiles.length : 0;

  if (surface.smiles.length === 0) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Volatility Surface</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <span className="text-sm text-muted-foreground">No vol surface data available for {underlying}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            Volatility Surface
            <Badge variant="outline" className="text-[10px] font-mono">
              {underlying}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              ATM IV: {formatPercent(avgAtmIv * 100, 1)}
            </Badge>
            <Badge
              variant="secondary"
              className={cn("text-[10px]", avgSkew < 0 ? "text-rose-400" : "text-emerald-400")}
            >
              25d Skew: {formatPercent(avgSkew * 100, 2)}
            </Badge>
          </div>
        </div>
        {isLoading && <div className="text-xs text-muted-foreground mt-1">Loading vol surface...</div>}
      </CardHeader>

      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis
              dataKey="strike"
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
              tickFormatter={(v: number) => v.toLocaleString()}
              stroke="rgba(255,255,255,0.2)"
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
              tickFormatter={(v: number) => `${formatPercent(v, 0)}`}
              stroke="rgba(255,255,255,0.2)"
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: 11,
              }}
              formatter={(value: number) => [`${formatPercent(value, 1)}`, ""]}
              labelFormatter={(label: number) => `Strike: ${label.toLocaleString()}`}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {surface.smiles.map((smile, idx) => (
              <Line
                key={smile.expiry}
                type="monotone"
                dataKey={smile.expiry}
                stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export { generateMockVolSurface };
export type { VolSurfaceResponse, VolSmileLine, VolSmilePoint };
