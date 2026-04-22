"use client";

import { PageHeader } from "@/components/shared/page-header";
/**
 * /services/trading/options/pricing — Derivatives Pricing Engine.
 * Multi-model support (Black-Scholes, SVI, SABR, Heston), volatility surface,
 * Greeks sensitivity, and model comparison.
 */

import { WidgetScroll } from "@/components/shared/widget-scroll";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import type { ColumnDef } from "@tanstack/react-table";
import {
  MOCK_GREEKS,
  MOCK_MODEL_COMPARISON,
  type GreeksRow,
  type ModelComparison,
  type PricingModel,
  type Underlying,
} from "@/lib/mocks/fixtures/trading-pages";
import { Activity, Calculator, TrendingUp, Zap } from "lucide-react";
import * as React from "react";

// ── Mock Data ────────────────────────────────────────────────────────────────

const SPOT_PRICES: Record<Underlying, number> = { BTC: 67432, ETH: 3457 };

const EXPIRIES = ["2026-04-04", "2026-04-25", "2026-06-27", "2026-09-26", "2027-03-26"];
const EXPIRY_LABELS = ["1W", "1M", "3M", "6M", "1Y"];

const MONEYNESS_STEPS = [0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2];

// Volatility surface mock (implied vol %) — rows=expiry, cols=moneyness
const VOL_SURFACE: number[][] = [
  [78, 72, 66, 60, 55, 60, 66, 73, 80], // 1W
  [74, 68, 62, 57, 53, 57, 62, 68, 75], // 1M
  [70, 64, 59, 54, 51, 54, 58, 64, 71], // 3M
  [67, 62, 57, 52, 49, 52, 56, 61, 68], // 6M
  [65, 60, 55, 51, 48, 51, 54, 59, 65], // 1Y
];

function volColor(vol: number): string {
  if (vol >= 72) return "bg-red-500/80 text-white";
  if (vol >= 62) return "bg-orange-500/60 text-white";
  if (vol >= 55) return "bg-yellow-500/40 text-foreground";
  if (vol >= 50) return "bg-emerald-500/40 text-foreground";
  return "bg-sky-500/50 text-foreground";
}

const BTC_STRIKE_BASE = 67000;

const greeksColumns: ColumnDef<GreeksRow>[] = [
  {
    accessorKey: "strike",
    header: () => <span className="text-xs">Strike</span>,
    cell: ({ row }) => {
      const g = row.original;
      const isAtm = Math.abs(g.strike - BTC_STRIKE_BASE) < 1000;
      return (
        <span className="font-mono text-xs font-medium">
          {g.strike.toLocaleString()}
          {isAtm && (
            <Badge variant="outline" className="ml-1.5 text-[9px] py-0 px-1 text-primary border-primary/30">
              ATM
            </Badge>
          )}
        </span>
      );
    },
  },
  {
    accessorKey: "delta",
    header: () => <span className="block text-right text-xs">Delta</span>,
    cell: ({ row }) => (
      <span
        className={cn(
          "block text-right font-mono text-xs",
          row.original.delta > 0.5 ? "text-emerald-400" : "text-muted-foreground",
        )}
      >
        {formatNumber(row.original.delta, 2)}
      </span>
    ),
  },
  {
    accessorKey: "gamma",
    header: () => <span className="block text-right text-xs">Gamma</span>,
    cell: ({ row }) => (
      <span className="block text-right font-mono text-xs text-muted-foreground">
        {formatNumber(row.original.gamma, 5)}
      </span>
    ),
  },
  {
    accessorKey: "theta",
    header: () => <span className="block text-right text-xs">Theta</span>,
    cell: ({ row }) => (
      <span className="block text-right font-mono text-xs text-red-400">{formatNumber(row.original.theta, 2)}</span>
    ),
  },
  {
    accessorKey: "vega",
    header: () => <span className="block text-right text-xs">Vega</span>,
    cell: ({ row }) => (
      <span className="block text-right font-mono text-xs text-sky-400">{formatNumber(row.original.vega, 1)}</span>
    ),
  },
  {
    accessorKey: "rho",
    header: () => <span className="block text-right text-xs">Rho</span>,
    cell: ({ row }) => (
      <span className="block text-right font-mono text-xs text-muted-foreground">
        {formatNumber(row.original.rho, 1)}
      </span>
    ),
  },
];

// ── Model Parameter Configs ─────────────────────────────────────────────────

interface ParamField {
  key: string;
  label: string;
  defaultValue: number;
  step: number;
}

const MODEL_PARAMS: Record<PricingModel, ParamField[]> = {
  "black-scholes": [{ key: "volatility", label: "Volatility (%)", defaultValue: 55, step: 0.5 }],
  svi: [
    { key: "a", label: "a (level)", defaultValue: 0.04, step: 0.001 },
    { key: "b", label: "b (slope)", defaultValue: 0.15, step: 0.01 },
    { key: "rho", label: "rho (tilt)", defaultValue: -0.25, step: 0.01 },
    { key: "m", label: "m (shift)", defaultValue: 0.02, step: 0.001 },
    { key: "sigma", label: "sigma (curvature)", defaultValue: 0.3, step: 0.01 },
  ],
  sabr: [
    { key: "alpha", label: "alpha", defaultValue: 0.35, step: 0.01 },
    { key: "beta", label: "beta", defaultValue: 0.7, step: 0.05 },
    { key: "rho", label: "rho", defaultValue: -0.3, step: 0.01 },
    { key: "nu", label: "nu (vol-of-vol)", defaultValue: 0.45, step: 0.01 },
  ],
  heston: [
    { key: "v0", label: "v0 (initial var)", defaultValue: 0.3, step: 0.01 },
    { key: "kappa", label: "kappa (mean-rev)", defaultValue: 2.5, step: 0.1 },
    { key: "theta", label: "theta (long var)", defaultValue: 0.25, step: 0.01 },
    { key: "sigma", label: "sigma (vol-of-vol)", defaultValue: 0.6, step: 0.01 },
    { key: "rho", label: "rho (correlation)", defaultValue: -0.7, step: 0.01 },
  ],
  mixed: [],
};

// ── Sub Components ───────────────────────────────────────────────────────────

function InputParameters({ model, underlying }: { model: PricingModel; underlying: Underlying }) {
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
          <Input type="number" className="h-8 font-mono" defaultValue={spot} readOnly />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Risk-Free Rate (%)</label>
          <Input type="number" className="h-8 font-mono" defaultValue={4.5} step={0.1} />
        </div>

        {params.length > 0 && (
          <div className="border-t border-border pt-3 space-y-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Model Parameters</p>
            {params.map((p) => (
              <div key={p.key} className="space-y-1">
                <label className="text-xs text-muted-foreground">{p.label}</label>
                <Input type="number" className="h-8 font-mono" defaultValue={p.defaultValue} step={p.step} />
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
        <p className="text-xs text-muted-foreground">Implied vol (%) across moneyness and tenor</p>
      </CardHeader>
      <CardContent>
        <WidgetScroll axes="horizontal" scrollbarSize="thin">
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
                    {formatNumber(m, 2)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VOL_SURFACE.map((row, ri) => (
                <tr key={EXPIRY_LABELS[ri]}>
                  <td className="py-1 pr-2 font-medium text-muted-foreground">{EXPIRY_LABELS[ri]}</td>
                  {row.map((vol, ci) => (
                    <td key={`${ri}-${ci}`} className="p-0.5">
                      <div
                        className={cn("rounded px-1.5 py-1 text-center font-mono text-xs font-medium", volColor(vol))}
                      >
                        {vol}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </WidgetScroll>
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
        <p className="text-xs text-muted-foreground">BTC call options, 1M expiry</p>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={greeksColumns}
          data={MOCK_GREEKS}
          enableColumnVisibility={false}
          emptyMessage="No greeks data."
          className="[&_tbody_tr]:transition-colors"
        />
      </CardContent>
    </Card>
  );
}

const CLOSEST_COLORS: Record<string, string> = {
  "black-scholes": "text-emerald-400",
  sabr: "text-sky-400",
  heston: "text-amber-400",
  svi: "text-violet-400",
};

const modelComparisonColumns: ColumnDef<ModelComparison>[] = [
  {
    accessorKey: "strike",
    header: () => <span className="text-xs">Strike</span>,
    cell: ({ row }) => <span className="font-mono text-xs font-medium">{row.original.strike.toLocaleString()}</span>,
  },
  {
    accessorKey: "moneyness",
    header: () => <span className="text-xs">Moneyness</span>,
    cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.moneyness}</span>,
  },
  {
    accessorKey: "bs",
    header: () => <span className="block text-right text-xs">Black-Scholes</span>,
    cell: ({ row }) => (
      <span
        className={cn(
          "block text-right font-mono text-xs",
          row.original.closest === "black-scholes" ? "font-semibold text-emerald-400" : "text-muted-foreground",
        )}
      >
        {formatCurrency(row.original.bs, "USD", 0)}
      </span>
    ),
  },
  {
    accessorKey: "svi",
    header: () => <span className="block text-right text-xs">SVI</span>,
    cell: ({ row }) => (
      <span
        className={cn(
          "block text-right font-mono text-xs",
          row.original.closest === "svi" ? "font-semibold text-violet-400" : "text-muted-foreground",
        )}
      >
        {formatCurrency(row.original.svi, "USD", 0)}
      </span>
    ),
  },
  {
    accessorKey: "sabr",
    header: () => <span className="block text-right text-xs">SABR</span>,
    cell: ({ row }) => (
      <span
        className={cn(
          "block text-right font-mono text-xs",
          row.original.closest === "sabr" ? "font-semibold text-sky-400" : "text-muted-foreground",
        )}
      >
        {formatCurrency(row.original.sabr, "USD", 0)}
      </span>
    ),
  },
  {
    accessorKey: "heston",
    header: () => <span className="block text-right text-xs">Heston</span>,
    cell: ({ row }) => (
      <span
        className={cn(
          "block text-right font-mono text-xs",
          row.original.closest === "heston" ? "font-semibold text-amber-400" : "text-muted-foreground",
        )}
      >
        {formatCurrency(row.original.heston, "USD", 0)}
      </span>
    ),
  },
  {
    accessorKey: "marketMid",
    header: () => <span className="block text-right text-xs font-semibold">Market Mid</span>,
    cell: ({ row }) => (
      <span className="block text-right font-mono text-xs font-semibold">
        {formatCurrency(row.original.marketMid, "USD", 0)}
      </span>
    ),
  },
  {
    id: "best_fit",
    header: () => <span className="text-xs">Best Fit</span>,
    cell: ({ row }) => (
      <Badge variant="outline" className={cn("text-[10px]", CLOSEST_COLORS[row.original.closest])}>
        {row.original.closest === "black-scholes" ? "B-S" : row.original.closest.toUpperCase()}
      </Badge>
    ),
  },
];

function ModelComparisonTable() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Model Comparison</CardTitle>
        <p className="text-xs text-muted-foreground">Price comparison across models for BTC 1M calls (values in USD)</p>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={modelComparisonColumns}
          data={MOCK_MODEL_COMPARISON}
          enableColumnVisibility={false}
          emptyMessage="No model comparison rows."
        />
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
          <PageHeader
            title="Derivatives Pricing Engine"
            description="Multi-model option pricing, calibration, and Greek analysis"
          />
          <div className="flex items-center gap-3 flex-wrap">
            {/* Model selector */}
            <Select value={model} onValueChange={(v) => setModel(v as PricingModel)}>
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
            <Select value={underlying} onValueChange={(v) => setUnderlying(v as Underlying)}>
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
