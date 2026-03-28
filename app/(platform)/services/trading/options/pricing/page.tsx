"use client";

/**
 * /services/trading/options/pricing — Derivatives Pricing Engine.
 * Multi-model support (Black-Scholes, SVI, SABR, Heston), volatility surface,
 * Greeks sensitivity, and model comparison.
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap, TrendingUp, Activity, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type PricingModel = "black-scholes" | "svi" | "sabr" | "heston" | "mixed";
type Underlying = "BTC" | "ETH";

interface GreeksRow {
  strike: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

interface ModelComparison {
  strike: number;
  moneyness: string;
  bs: number;
  svi: number;
  sabr: number;
  heston: number;
  marketMid: number;
  closest: PricingModel;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

const SPOT_PRICES: Record<Underlying, number> = { BTC: 67432, ETH: 3457 };

const EXPIRIES = ["2026-04-04", "2026-04-25", "2026-06-27", "2026-09-26", "2027-03-26"];
const EXPIRY_LABELS = ["1W", "1M", "3M", "6M", "1Y"];

const MONEYNESS_STEPS = [0.80, 0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.20];

// Volatility surface mock (implied vol %) — rows=expiry, cols=moneyness
const VOL_SURFACE: number[][] = [
  [78, 72, 66, 60, 55, 60, 66, 73, 80],   // 1W
  [74, 68, 62, 57, 53, 57, 62, 68, 75],   // 1M
  [70, 64, 59, 54, 51, 54, 58, 64, 71],   // 3M
  [67, 62, 57, 52, 49, 52, 56, 61, 68],   // 6M
  [65, 60, 55, 51, 48, 51, 54, 59, 65],   // 1Y
];

function volColor(vol: number): string {
  if (vol >= 72) return "bg-red-500/80 text-white";
  if (vol >= 62) return "bg-orange-500/60 text-white";
  if (vol >= 55) return "bg-yellow-500/40 text-foreground";
  if (vol >= 50) return "bg-emerald-500/40 text-foreground";
  return "bg-sky-500/50 text-foreground";
}

const BTC_STRIKE_BASE = 67000;
const MOCK_GREEKS: GreeksRow[] = [
  { strike: 60000, delta: 0.89, gamma: 0.00002, theta: -12.45, vega: 48.2, rho: 18.3 },
  { strike: 62000, delta: 0.82, gamma: 0.00003, theta: -15.67, vega: 62.1, rho: 16.8 },
  { strike: 64000, delta: 0.72, gamma: 0.00004, theta: -19.34, vega: 78.5, rho: 14.9 },
  { strike: 65000, delta: 0.65, gamma: 0.00005, theta: -22.10, vega: 89.3, rho: 13.4 },
  { strike: 66000, delta: 0.57, gamma: 0.00005, theta: -24.56, vega: 95.7, rho: 11.9 },
  { strike: 67000, delta: 0.51, gamma: 0.00006, theta: -25.89, vega: 98.2, rho: 10.5 },
  { strike: 68000, delta: 0.44, gamma: 0.00005, theta: -24.78, vega: 96.1, rho: 9.2 },
  { strike: 70000, delta: 0.32, gamma: 0.00004, theta: -20.45, vega: 82.4, rho: 7.1 },
  { strike: 72000, delta: 0.22, gamma: 0.00003, theta: -15.89, vega: 64.8, rho: 5.3 },
  { strike: 75000, delta: 0.12, gamma: 0.00002, theta: -9.67, vega: 42.1, rho: 3.2 },
];

const MOCK_MODEL_COMPARISON: ModelComparison[] = [
  { strike: 60000, moneyness: "0.89", bs: 8234, svi: 8189, sabr: 8212, heston: 8201, marketMid: 8205, closest: "heston" },
  { strike: 64000, moneyness: "0.95", bs: 5102, svi: 5078, sabr: 5089, heston: 5095, marketMid: 5090, closest: "sabr" },
  { strike: 67000, moneyness: "0.99", bs: 3456, svi: 3423, sabr: 3440, heston: 3448, marketMid: 3442, closest: "sabr" },
  { strike: 70000, moneyness: "1.04", bs: 2187, svi: 2201, sabr: 2195, heston: 2190, marketMid: 2193, closest: "sabr" },
  { strike: 75000, moneyness: "1.11", bs: 987, svi: 1012, sabr: 1005, heston: 998, marketMid: 1002, closest: "heston" },
];

// ── Model Parameter Configs ─────────────────────────────────────────────────

interface ParamField {
  key: string;
  label: string;
  defaultValue: number;
  step: number;
}

const MODEL_PARAMS: Record<PricingModel, ParamField[]> = {
  "black-scholes": [
    { key: "volatility", label: "Volatility (%)", defaultValue: 55, step: 0.5 },
  ],
  svi: [
    { key: "a", label: "a (level)", defaultValue: 0.04, step: 0.001 },
    { key: "b", label: "b (slope)", defaultValue: 0.15, step: 0.01 },
    { key: "rho", label: "rho (tilt)", defaultValue: -0.25, step: 0.01 },
    { key: "m", label: "m (shift)", defaultValue: 0.02, step: 0.001 },
    { key: "sigma", label: "sigma (curvature)", defaultValue: 0.30, step: 0.01 },
  ],
  sabr: [
    { key: "alpha", label: "alpha", defaultValue: 0.35, step: 0.01 },
    { key: "beta", label: "beta", defaultValue: 0.70, step: 0.05 },
    { key: "rho", label: "rho", defaultValue: -0.30, step: 0.01 },
    { key: "nu", label: "nu (vol-of-vol)", defaultValue: 0.45, step: 0.01 },
  ],
  heston: [
    { key: "v0", label: "v0 (initial var)", defaultValue: 0.30, step: 0.01 },
    { key: "kappa", label: "kappa (mean-rev)", defaultValue: 2.50, step: 0.1 },
    { key: "theta", label: "theta (long var)", defaultValue: 0.25, step: 0.01 },
    { key: "sigma", label: "sigma (vol-of-vol)", defaultValue: 0.60, step: 0.01 },
    { key: "rho", label: "rho (correlation)", defaultValue: -0.70, step: 0.01 },
  ],
  mixed: [],
};

// ── Sub Components ───────────────────────────────────────────────────────────

function InputParameters({
  model,
  underlying,
}: {
  model: PricingModel;
  underlying: Underlying;
}) {
  const params = MODEL_PARAMS[model];
  const spot = SPOT_PRICES[underlying];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calculator className="size-4" />
          Input Parameters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Spot Price</label>
          <Input
            type="number"
            className="h-8 font-mono"
            defaultValue={spot}
            readOnly
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Risk-Free Rate (%)</label>
          <Input
            type="number"
            className="h-8 font-mono"
            defaultValue={4.5}
            step={0.1}
          />
        </div>

        {params.length > 0 && (
          <div className="border-t border-border pt-3 space-y-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
              Model Parameters
            </p>
            {params.map((p) => (
              <div key={p.key} className="space-y-1">
                <label className="text-xs text-muted-foreground">{p.label}</label>
                <Input
                  type="number"
                  className="h-8 font-mono"
                  defaultValue={p.defaultValue}
                  step={p.step}
                />
              </div>
            ))}
          </div>
        )}

        {model === "mixed" && (
          <div className="border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">
              Mixed mode auto-selects the best-fit model per strike/expiry pair.
            </p>
          </div>
        )}

        <Button className="w-full" size="sm">
          <Zap className="size-3.5 mr-1.5" />
          Calibrate
        </Button>
      </CardContent>
    </Card>
  );
}

function VolatilitySurface() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="size-4" />
          Volatility Surface
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Implied vol (%) across moneyness and tenor
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left py-1.5 pr-2 text-muted-foreground font-medium">Tenor</th>
                {MONEYNESS_STEPS.map((m) => (
                  <th
                    key={m}
                    className={cn(
                      "text-center py-1.5 px-1 font-mono font-medium",
                      m === 1.0 ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {m.toFixed(2)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VOL_SURFACE.map((row, ri) => (
                <tr key={EXPIRY_LABELS[ri]}>
                  <td className="py-1 pr-2 font-medium text-muted-foreground">
                    {EXPIRY_LABELS[ri]}
                  </td>
                  {row.map((vol, ci) => (
                    <td key={`${ri}-${ci}`} className="p-0.5">
                      <div
                        className={cn(
                          "rounded px-1.5 py-1 text-center font-mono text-xs font-medium",
                          volColor(vol),
                        )}
                      >
                        {vol}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 mt-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded bg-sky-500/50" /> &lt;50
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded bg-emerald-500/40" /> 50-55
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded bg-yellow-500/40" /> 55-62
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded bg-orange-500/60" /> 62-72
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded bg-red-500/80" /> &gt;72
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function GreeksSensitivity() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="size-4" />
          Greeks Sensitivity
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          BTC call options, 1M expiry
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Strike</TableHead>
              <TableHead className="text-xs text-right">Delta</TableHead>
              <TableHead className="text-xs text-right">Gamma</TableHead>
              <TableHead className="text-xs text-right">Theta</TableHead>
              <TableHead className="text-xs text-right">Vega</TableHead>
              <TableHead className="text-xs text-right">Rho</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_GREEKS.map((g) => {
              const isAtm = Math.abs(g.strike - BTC_STRIKE_BASE) < 1000;
              return (
                <TableRow
                  key={g.strike}
                  className={cn(isAtm && "bg-primary/5")}
                >
                  <TableCell className="font-mono text-xs font-medium">
                    {g.strike.toLocaleString()}
                    {isAtm && (
                      <Badge variant="outline" className="ml-1.5 text-[9px] py-0 px-1 text-primary border-primary/30">
                        ATM
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className={cn("text-right font-mono text-xs", g.delta > 0.5 ? "text-emerald-400" : "text-muted-foreground")}>
                    {g.delta.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {g.gamma.toFixed(5)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-red-400">
                    {g.theta.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-sky-400">
                    {g.vega.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {g.rho.toFixed(1)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ModelComparisonTable() {
  const MODEL_LABELS: Record<string, string> = {
    bs: "Black-Scholes",
    svi: "SVI",
    sabr: "SABR",
    heston: "Heston",
  };

  const CLOSEST_COLORS: Record<string, string> = {
    "black-scholes": "text-emerald-400",
    sabr: "text-sky-400",
    heston: "text-amber-400",
    svi: "text-violet-400",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Model Comparison</CardTitle>
        <p className="text-xs text-muted-foreground">
          Price comparison across models for BTC 1M calls (values in USD)
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Strike</TableHead>
              <TableHead className="text-xs">Moneyness</TableHead>
              <TableHead className="text-xs text-right">Black-Scholes</TableHead>
              <TableHead className="text-xs text-right">SVI</TableHead>
              <TableHead className="text-xs text-right">SABR</TableHead>
              <TableHead className="text-xs text-right">Heston</TableHead>
              <TableHead className="text-xs text-right font-semibold">Market Mid</TableHead>
              <TableHead className="text-xs">Best Fit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_MODEL_COMPARISON.map((row) => (
              <TableRow key={row.strike}>
                <TableCell className="font-mono text-xs font-medium">
                  {row.strike.toLocaleString()}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {row.moneyness}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono text-xs",
                  row.closest === "black-scholes" ? "text-emerald-400 font-semibold" : "text-muted-foreground",
                )}>
                  ${row.bs.toLocaleString()}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono text-xs",
                  row.closest === "svi" ? "text-violet-400 font-semibold" : "text-muted-foreground",
                )}>
                  ${row.svi.toLocaleString()}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono text-xs",
                  row.closest === "sabr" ? "text-sky-400 font-semibold" : "text-muted-foreground",
                )}>
                  ${row.sabr.toLocaleString()}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono text-xs",
                  row.closest === "heston" ? "text-amber-400 font-semibold" : "text-muted-foreground",
                )}>
                  ${row.heston.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono text-xs font-semibold">
                  ${row.marketMid.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px]", CLOSEST_COLORS[row.closest])}
                  >
                    {row.closest === "black-scholes" ? "B-S" : row.closest.toUpperCase()}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DerivativesPricingPage() {
  const [model, setModel] = React.useState<PricingModel>("black-scholes");
  const [underlying, setUnderlying] = React.useState<Underlying>("BTC");
  const [expiry, setExpiry] = React.useState(EXPIRIES[1]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 md:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Derivatives Pricing Engine</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Multi-model option pricing, calibration, and Greek analysis
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Model selector */}
            <Select
              value={model}
              onValueChange={(v) => setModel(v as PricingModel)}
            >
              <SelectTrigger size="sm" className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="black-scholes">Black-Scholes</SelectItem>
                <SelectItem value="svi">SVI</SelectItem>
                <SelectItem value="sabr">SABR</SelectItem>
                <SelectItem value="heston">Heston</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
            {/* Underlying */}
            <Select
              value={underlying}
              onValueChange={(v) => setUnderlying(v as Underlying)}
            >
              <SelectTrigger size="sm" className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BTC">BTC</SelectItem>
                <SelectItem value="ETH">ETH</SelectItem>
              </SelectContent>
            </Select>
            {/* Expiry */}
            <Select value={expiry} onValueChange={setExpiry}>
              <SelectTrigger size="sm" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPIRIES.map((e, i) => (
                  <SelectItem key={e} value={e}>
                    {e} ({EXPIRY_LABELS[i]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="text-xs">
              Spot: ${SPOT_PRICES[underlying].toLocaleString()}
            </Badge>
          </div>
        </div>

        {/* Three-panel layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
          {/* Left: Input Parameters */}
          <div className="lg:col-span-3">
            <InputParameters model={model} underlying={underlying} />
          </div>
          {/* Center: Volatility Surface */}
          <div className="lg:col-span-5">
            <VolatilitySurface />
          </div>
          {/* Right: Greeks */}
          <div className="lg:col-span-4">
            <GreeksSensitivity />
          </div>
        </div>

        {/* Bottom: Model Comparison */}
        <ModelComparisonTable />
      </div>
    </div>
  );
}
