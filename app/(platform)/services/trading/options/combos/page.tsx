"use client";

import { useState, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExecutionModeIndicator } from "@/components/trading/execution-mode-toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Plus, Trash2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";

// ── Types ────────────────────────────────────────────────────────────────────

type Direction = "buy" | "sell";
type OptionType = "call" | "put";

interface OptionLeg {
  id: string;
  direction: Direction;
  optionType: OptionType;
  strike: number;
  expiry: string;
  qty: number;
  premium: number;
}

interface StrategyTemplate {
  label: string;
  description: string;
  legs: Omit<OptionLeg, "id">[];
}

// ── Strategy templates ───────────────────────────────────────────────────────

const UNDERLYING_PRICE = 4250.0;

const STRATEGY_TEMPLATES: Record<string, StrategyTemplate> = {
  "bull-call-spread": {
    label: "Bull Call Spread",
    description: "Buy lower-strike call, sell higher-strike call. Limited risk, limited reward.",
    legs: [
      { direction: "buy", optionType: "call", strike: 4200, expiry: "2026-04-18", qty: 1, premium: 128.5 },
      { direction: "sell", optionType: "call", strike: 4400, expiry: "2026-04-18", qty: 1, premium: 42.3 },
    ],
  },
  "bear-put-spread": {
    label: "Bear Put Spread",
    description: "Buy higher-strike put, sell lower-strike put. Bearish with limited risk.",
    legs: [
      { direction: "buy", optionType: "put", strike: 4300, expiry: "2026-04-18", qty: 1, premium: 115.2 },
      { direction: "sell", optionType: "put", strike: 4100, expiry: "2026-04-18", qty: 1, premium: 38.6 },
    ],
  },
  straddle: {
    label: "Straddle",
    description: "Buy call and put at same strike. Profit from large moves in either direction.",
    legs: [
      { direction: "buy", optionType: "call", strike: 4250, expiry: "2026-04-18", qty: 1, premium: 98.4 },
      { direction: "buy", optionType: "put", strike: 4250, expiry: "2026-04-18", qty: 1, premium: 92.1 },
    ],
  },
  strangle: {
    label: "Strangle",
    description: "Buy OTM call and OTM put. Cheaper than straddle, needs bigger move.",
    legs: [
      { direction: "buy", optionType: "call", strike: 4400, expiry: "2026-04-18", qty: 1, premium: 42.3 },
      { direction: "buy", optionType: "put", strike: 4100, expiry: "2026-04-18", qty: 1, premium: 38.6 },
    ],
  },
  "iron-condor": {
    label: "Iron Condor",
    description: "Sell strangle + buy wings. Range-bound strategy with defined risk.",
    legs: [
      { direction: "buy", optionType: "put", strike: 4000, expiry: "2026-04-18", qty: 1, premium: 18.2 },
      { direction: "sell", optionType: "put", strike: 4100, expiry: "2026-04-18", qty: 1, premium: 38.6 },
      { direction: "sell", optionType: "call", strike: 4400, expiry: "2026-04-18", qty: 1, premium: 42.3 },
      { direction: "buy", optionType: "call", strike: 4500, expiry: "2026-04-18", qty: 1, premium: 16.8 },
    ],
  },
  butterfly: {
    label: "Butterfly",
    description: "Buy 1 lower, sell 2 middle, buy 1 upper call. Low cost, max profit at middle strike.",
    legs: [
      { direction: "buy", optionType: "call", strike: 4150, expiry: "2026-04-18", qty: 1, premium: 158.3 },
      { direction: "sell", optionType: "call", strike: 4250, expiry: "2026-04-18", qty: 2, premium: 98.4 },
      { direction: "buy", optionType: "call", strike: 4350, expiry: "2026-04-18", qty: 1, premium: 56.8 },
    ],
  },
  "calendar-spread": {
    label: "Calendar Spread",
    description: "Sell near-term, buy far-term same strike. Profit from time decay differential.",
    legs: [
      { direction: "sell", optionType: "call", strike: 4250, expiry: "2026-04-18", qty: 1, premium: 98.4 },
      { direction: "buy", optionType: "call", strike: 4250, expiry: "2026-05-16", qty: 1, premium: 142.7 },
    ],
  },
  custom: {
    label: "Custom",
    description: "Build your own multi-leg combination from scratch.",
    legs: [],
  },
};

let nextLegId = 1;
const makeLegId = () => `leg-${nextLegId++}`;

// ── Component ────────────────────────────────────────────────────────────────

export default function ComboBuilderPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [legs, setLegs] = useState<OptionLeg[]>([]);

  const applyTemplate = useCallback((templateKey: string) => {
    setSelectedTemplate(templateKey);
    const template = STRATEGY_TEMPLATES[templateKey];
    if (!template) return;
    setLegs(template.legs.map((l) => ({ ...l, id: makeLegId() })));
  }, []);

  const addLeg = () => {
    setLegs((prev) => [
      ...prev,
      {
        id: makeLegId(),
        direction: "buy",
        optionType: "call",
        strike: UNDERLYING_PRICE,
        expiry: "2026-04-18",
        qty: 1,
        premium: 0,
      },
    ]);
    setSelectedTemplate("custom");
  };

  const removeLeg = (id: string) => {
    setLegs((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLeg = (id: string, field: keyof OptionLeg, value: string | number) => {
    setLegs((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  // ── Payoff calculations ──────────────────────────────────────────────────

  const netPremium = useMemo(() => {
    return legs.reduce((acc, leg) => {
      const sign = leg.direction === "buy" ? -1 : 1;
      return acc + sign * leg.premium * leg.qty;
    }, 0);
  }, [legs]);

  const computePayoff = useCallback(
    (priceAtExpiry: number): number => {
      let payoff = 0;
      for (const leg of legs) {
        const sign = leg.direction === "buy" ? 1 : -1;
        let intrinsic = 0;
        if (leg.optionType === "call") {
          intrinsic = Math.max(0, priceAtExpiry - leg.strike);
        } else {
          intrinsic = Math.max(0, leg.strike - priceAtExpiry);
        }
        payoff += sign * intrinsic * leg.qty;
      }
      return payoff + netPremium;
    },
    [legs, netPremium],
  );

  // Price range for payoff diagram
  const priceRange = useMemo(() => {
    if (legs.length === 0) return { min: 3800, max: 4700, step: 50 };
    const strikes = legs.map((l) => l.strike);
    const minStrike = Math.min(...strikes);
    const maxStrike = Math.max(...strikes);
    const spread = maxStrike - minStrike || 200;
    const margin = Math.max(spread * 0.6, 150);
    return {
      min: Math.floor((minStrike - margin) / 50) * 50,
      max: Math.ceil((maxStrike + margin) / 50) * 50,
      step: 25,
    };
  }, [legs]);

  const payoffGrid = useMemo(() => {
    const points: Array<{ price: number; payoff: number }> = [];
    for (let p = priceRange.min; p <= priceRange.max; p += priceRange.step) {
      points.push({ price: p, payoff: computePayoff(p) });
    }
    return points;
  }, [priceRange, computePayoff]);

  const maxProfit = useMemo(() => {
    if (payoffGrid.length === 0) return 0;
    return Math.max(...payoffGrid.map((p) => p.payoff));
  }, [payoffGrid]);

  const maxLoss = useMemo(() => {
    if (payoffGrid.length === 0) return 0;
    return Math.min(...payoffGrid.map((p) => p.payoff));
  }, [payoffGrid]);

  const breakevens = useMemo(() => {
    const beps: number[] = [];
    for (let i = 1; i < payoffGrid.length; i++) {
      const prev = payoffGrid[i - 1];
      const curr = payoffGrid[i];
      if ((prev.payoff <= 0 && curr.payoff >= 0) || (prev.payoff >= 0 && curr.payoff <= 0)) {
        // Linear interpolation
        const ratio = Math.abs(prev.payoff) / (Math.abs(prev.payoff) + Math.abs(curr.payoff));
        beps.push(prev.price + ratio * (curr.price - prev.price));
      }
    }
    return beps;
  }, [payoffGrid]);

  const absMax = useMemo(() => {
    return Math.max(Math.abs(maxProfit), Math.abs(maxLoss), 1);
  }, [maxProfit, maxLoss]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 py-3 bg-background/95">
        <PageHeader
          title={
            <span className="flex flex-wrap items-center gap-2">
              <BarChart3 className="size-5 text-sky-400" />
              Combo Builder
              <ExecutionModeIndicator />
            </span>
          }
          description="Build multi-leg options strategies with real-time payoff analysis"
        >
          <span className="text-xs text-muted-foreground">Underlying:</span>
          <Badge variant="outline" className="font-mono">
            SPX {formatNumber(UNDERLYING_PRICE, 2)}
          </Badge>
        </PageHeader>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Strategy template selector */}
        <Card className="py-4">
          <CardContent className="px-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium">Strategy Template</label>
              <Select value={selectedTemplate} onValueChange={applyTemplate}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Select a strategy..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STRATEGY_TEMPLATES).map(([key, tmpl]) => (
                    <SelectItem key={key} value={key}>
                      {tmpl.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && STRATEGY_TEMPLATES[selectedTemplate] && (
                <span className="text-xs text-muted-foreground max-w-md">
                  {STRATEGY_TEMPLATES[selectedTemplate].description}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Legs table */}
        <Card className="py-4">
          <CardHeader className="px-4 py-0 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Legs</CardTitle>
              <Button size="sm" variant="outline" onClick={addLeg} className="gap-1.5">
                <Plus className="size-3.5" />
                Add Leg
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4">
            {legs.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                Select a template above or click "Add Leg" to start building
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Strike</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Premium</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {legs.map((leg, idx) => (
                    <TableRow key={leg.id}>
                      <TableCell className="font-mono text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <Select value={leg.direction} onValueChange={(v) => updateLeg(leg.id, "direction", v)}>
                          <SelectTrigger className="h-7 w-[90px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="buy">Buy</SelectItem>
                            <SelectItem value="sell">Sell</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={leg.optionType} onValueChange={(v) => updateLeg(leg.id, "optionType", v)}>
                          <SelectTrigger className="h-7 w-[80px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="call">Call</SelectItem>
                            <SelectItem value="put">Put</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={leg.strike}
                          onChange={(e) => updateLeg(leg.id, "strike", parseFloat(e.target.value) || 0)}
                          className="h-7 w-[100px] text-xs font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={leg.expiry}
                          onChange={(e) => updateLeg(leg.id, "expiry", e.target.value)}
                          className="h-7 w-[130px] text-xs font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={leg.qty}
                          onChange={(e) => updateLeg(leg.id, "qty", parseInt(e.target.value) || 1)}
                          className="h-7 w-[60px] text-xs font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={leg.premium}
                          onChange={(e) => updateLeg(leg.id, "premium", parseFloat(e.target.value) || 0)}
                          className="h-7 w-[90px] text-xs font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => removeLeg(leg.id)}
                          className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Remove leg"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Payoff diagram + Summary side by side */}
        {legs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Payoff diagram */}
            <Card className="lg:col-span-2 py-4">
              <CardHeader className="px-4 py-0 pb-3">
                <CardTitle className="text-sm">Payoff at Expiry</CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <div className="space-y-1">
                  {/* Y-axis label */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Max Profit: {formatCurrency(maxProfit, "USD", 2)}</span>
                    <span>Max Loss: {formatCurrency(maxLoss, "USD", 2)}</span>
                  </div>

                  {/* Grid */}
                  <div className="flex items-end gap-px h-[160px]">
                    {payoffGrid.map((point) => {
                      const height = Math.abs(point.payoff) / absMax;
                      const isProfit = point.payoff >= 0;
                      const isCurrentPrice = Math.abs(point.price - UNDERLYING_PRICE) < priceRange.step / 2;

                      return (
                        <div
                          key={point.price}
                          className="flex-1 flex flex-col items-stretch relative group"
                          title={`Price: ${point.price} | P&L: ${formatCurrency(point.payoff, "USD", 2)}`}
                        >
                          {/* Zero line at center */}
                          <div className="flex-1 flex flex-col justify-end">
                            {isProfit && (
                              <div
                                className={cn(
                                  "rounded-t-sm transition-all",
                                  isCurrentPrice ? "bg-emerald-400" : "bg-emerald-500/60 group-hover:bg-emerald-500/80",
                                )}
                                style={{ height: `${height * 100}%` }}
                              />
                            )}
                          </div>
                          <div className="h-px bg-border shrink-0" />
                          <div className="flex-1 flex flex-col justify-start">
                            {!isProfit && (
                              <div
                                className={cn(
                                  "rounded-b-sm transition-all",
                                  isCurrentPrice ? "bg-rose-400" : "bg-rose-500/60 group-hover:bg-rose-500/80",
                                )}
                                style={{ height: `${height * 100}%` }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* X-axis labels */}
                  <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
                    <span>{priceRange.min}</span>
                    <span className="font-medium text-foreground/70">Current: {UNDERLYING_PRICE}</span>
                    <span>{priceRange.max}</span>
                  </div>

                  {/* Breakeven labels */}
                  {breakevens.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {breakevens.map((bep, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                          BE: {formatNumber(bep, 0)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Summary panel */}
            <Card className="py-4">
              <CardHeader className="px-4 py-0 pb-3">
                <CardTitle className="text-sm">Summary</CardTitle>
              </CardHeader>
              <CardContent className="px-4 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Net Premium</span>
                    <span
                      className={cn("font-mono font-semibold", netPremium >= 0 ? "text-emerald-400" : "text-rose-400")}
                    >
                      {netPremium >= 0 ? "Credit" : "Debit"} {formatCurrency(Math.abs(netPremium), "USD", 2)}
                    </span>
                  </div>

                  <div className="h-px bg-border" />

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Max Profit</span>
                    <span className="font-mono font-semibold text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="size-3" />
                      {formatCurrency(maxProfit, "USD", 2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Max Loss</span>
                    <span className="font-mono font-semibold text-rose-400 flex items-center gap-1">
                      <TrendingDown className="size-3" />
                      {formatCurrency(Math.abs(maxLoss), "USD", 2)}
                    </span>
                  </div>

                  <div className="h-px bg-border" />

                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Breakeven(s)</span>
                    <div className="space-y-0.5">
                      {breakevens.length === 0 ? (
                        <span className="text-xs text-muted-foreground/60">N/A</span>
                      ) : (
                        breakevens.map((bep, i) => (
                          <div key={i} className="text-sm font-mono">
                            {formatNumber(bep, 2)}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="h-px bg-border" />

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Margin Req.</span>
                    <span className="font-mono font-semibold">{formatCurrency(Math.abs(maxLoss) * 2, "USD", 2)}</span>
                  </div>
                </div>

                <Button className="w-full" disabled={legs.length === 0}>
                  <BarChart3 className="size-4" />
                  Submit Combo Order
                </Button>

                {legs.length === 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-400/10 rounded-md px-2 py-1.5">
                    <AlertTriangle className="size-3 shrink-0" />
                    Add at least one leg to submit
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
