"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { DollarSign, Layers, Plus, Send, Trash2 } from "lucide-react";
import * as React from "react";
import type { OptionLeg, OptionsChainResponse, SpreadLeg, SpreadTemplate } from "./types";

const SPREAD_TEMPLATES: SpreadTemplate[] = [
  {
    name: "Bull Call Spread",
    description: "Buy lower strike call, sell higher strike call",
    buildLegs: (atm, tick, expiry) => [
      { strike: atm, expiry, side: "call", direction: "buy", quantity: 1 },
      {
        strike: atm + tick * 2,
        expiry,
        side: "call",
        direction: "sell",
        quantity: 1,
      },
    ],
  },
  {
    name: "Bear Put Spread",
    description: "Buy higher strike put, sell lower strike put",
    buildLegs: (atm, tick, expiry) => [
      {
        strike: atm + tick,
        expiry,
        side: "put",
        direction: "buy",
        quantity: 1,
      },
      {
        strike: atm - tick,
        expiry,
        side: "put",
        direction: "sell",
        quantity: 1,
      },
    ],
  },
  {
    name: "Iron Condor",
    description: "Sell OTM call spread + sell OTM put spread (4 legs)",
    buildLegs: (atm, tick, expiry) => [
      {
        strike: atm - tick * 2,
        expiry,
        side: "put",
        direction: "buy",
        quantity: 1,
      },
      {
        strike: atm - tick,
        expiry,
        side: "put",
        direction: "sell",
        quantity: 1,
      },
      {
        strike: atm + tick,
        expiry,
        side: "call",
        direction: "sell",
        quantity: 1,
      },
      {
        strike: atm + tick * 2,
        expiry,
        side: "call",
        direction: "buy",
        quantity: 1,
      },
    ],
  },
  {
    name: "Straddle",
    description: "Buy ATM call + ATM put (same strike)",
    buildLegs: (atm, _tick, expiry) => [
      { strike: atm, expiry, side: "call", direction: "buy", quantity: 1 },
      { strike: atm, expiry, side: "put", direction: "buy", quantity: 1 },
    ],
  },
  {
    name: "Strangle",
    description: "Buy OTM call + OTM put (different strikes)",
    buildLegs: (atm, tick, expiry) => [
      {
        strike: atm + tick,
        expiry,
        side: "call",
        direction: "buy",
        quantity: 1,
      },
      {
        strike: atm - tick,
        expiry,
        side: "put",
        direction: "buy",
        quantity: 1,
      },
    ],
  },
];

export function MultiLegBuilder({
  chain,
  onSubmitBundle,
  onClose,
}: {
  chain: OptionsChainResponse;
  onSubmitBundle?: (legs: SpreadLeg[]) => void;
  onClose: () => void;
}) {
  const [legs, setLegs] = React.useState<SpreadLeg[]>([]);

  const spotPrice = chain.spotPrice;
  const firstExpiry = chain.expiries[0];
  const ticks: Record<string, number> = { BTC: 1000, ETH: 50, SPY: 5 };
  const tickSize = ticks[chain.underlying] ?? 1;
  const atmStrike = firstExpiry
    ? firstExpiry.rows.reduce((closest, row) =>
        Math.abs(row.strike - spotPrice) < Math.abs(closest.strike - spotPrice) ? row : closest,
      ).strike
    : spotPrice;

  const availableStrikes = React.useMemo(() => {
    const strikes = new Set<number>();
    for (const exp of chain.expiries) {
      for (const row of exp.rows) {
        strikes.add(row.strike);
      }
    }
    return Array.from(strikes).sort((a, b) => a - b);
  }, [chain.expiries]);

  const availableExpiries = React.useMemo(() => chain.expiries.map((e) => e.expiry), [chain.expiries]);

  const addLeg = () => {
    if (legs.length >= 4) return;
    setLegs([
      ...legs,
      {
        id: `leg-${legs.length}-${atmStrike}-${availableExpiries[0] ?? "x"}`,
        strike: atmStrike,
        expiry: availableExpiries[0] ?? "",
        side: "call",
        direction: "buy",
        quantity: 1,
      },
    ]);
  };

  const removeLeg = (id: string) => {
    setLegs(legs.filter((l) => l.id !== id));
  };

  const updateLeg = (id: string, updates: Partial<SpreadLeg>) => {
    setLegs(legs.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const applyTemplate = (template: SpreadTemplate) => {
    const expiry = availableExpiries[0] ?? "";
    const newLegs = template.buildLegs(atmStrike, tickSize, expiry).map((l, i) => ({
      ...l,
      id: `leg-${l.strike}-${l.side}-${l.expiry}-${i}`,
    }));
    setLegs(newLegs);
  };

  const lookupOption = (leg: SpreadLeg): OptionLeg | null => {
    const expiryGroup = chain.expiries.find((e) => e.expiry === leg.expiry);
    if (!expiryGroup) return null;
    const row = expiryGroup.rows.find((r) => r.strike === leg.strike);
    if (!row) return null;
    return leg.side === "call" ? row.call : row.put;
  };

  let combinedDelta = 0;
  let combinedGamma = 0;
  let combinedTheta = 0;
  let combinedVega = 0;
  for (const leg of legs) {
    const opt = lookupOption(leg);
    if (!opt) continue;
    const sign = leg.direction === "buy" ? 1 : -1;
    const qty = leg.quantity;
    combinedDelta += opt.greeks.delta * sign * qty;
    combinedGamma += opt.greeks.gamma * sign * qty;
    combinedTheta += opt.greeks.theta * sign * qty;
    combinedVega += opt.greeks.vega * sign * qty;
  }
  const combinedGreeks = {
    delta: combinedDelta,
    gamma: combinedGamma,
    theta: combinedTheta,
    vega: combinedVega,
  };

  let pnlProfile: {
    maxProfit: number;
    maxLoss: number;
    breakevens: number[];
  };
  if (legs.length === 0) {
    pnlProfile = { maxProfit: 0, maxLoss: 0, breakevens: [] };
  } else {
    let netPremium = 0;
    for (const leg of legs) {
      const opt = lookupOption(leg);
      if (!opt) continue;
      const mid = (opt.bid + opt.ask) / 2;
      const sign = leg.direction === "buy" ? -1 : 1;
      netPremium += mid * sign * leg.quantity;
    }

    const strikes = legs.map((l) => l.strike).sort((a, b) => a - b);
    const minStrike = (strikes[0] ?? spotPrice) - tickSize * 3;
    const maxStrike = (strikes[strikes.length - 1] ?? spotPrice) + tickSize * 3;
    const step = (maxStrike - minStrike) / 100;
    const pnlPoints: number[] = [];

    for (let price = minStrike; price <= maxStrike; price += step) {
      let expPnl = netPremium;
      for (const leg of legs) {
        const sign = leg.direction === "buy" ? 1 : -1;
        const intrinsic = leg.side === "call" ? Math.max(price - leg.strike, 0) : Math.max(leg.strike - price, 0);
        expPnl += intrinsic * sign * leg.quantity;
      }
      pnlPoints.push(expPnl);
    }

    const maxProfit = Math.max(...pnlPoints);
    const maxLoss = Math.min(...pnlPoints);

    const breakevens: number[] = [];
    for (let i = 1; i < pnlPoints.length; i++) {
      if ((pnlPoints[i - 1] <= 0 && pnlPoints[i] >= 0) || (pnlPoints[i - 1] >= 0 && pnlPoints[i] <= 0)) {
        const price = minStrike + i * step;
        breakevens.push(Math.round(price * 100) / 100);
      }
    }

    pnlProfile = {
      maxProfit: maxProfit === Infinity ? Infinity : Math.round(maxProfit * 100) / 100,
      maxLoss: Math.round(maxLoss * 100) / 100,
      breakevens,
    };
  }

  return (
    <div className="border-t border-border">
      <div className="px-3 py-2 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="size-4" />
            <span className="text-sm font-medium">Multi-Leg Builder</span>
            <Badge variant="outline" className="text-[10px]">
              {legs.length}/4 legs
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <div className="px-3 py-3 space-y-3">
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Templates</p>
          <div className="flex flex-wrap gap-1">
            {SPREAD_TEMPLATES.map((t) => (
              <Button
                key={t.name}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={() => applyTemplate(t)}
                title={t.description}
              >
                {t.name}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {legs.length > 0 && (
          <div className="space-y-2">
            {legs.map((leg, i) => {
              const opt = lookupOption(leg);
              return (
                <div key={leg.id} className="p-2 rounded-md border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                      Leg {i + 1}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:text-rose-400"
                      onClick={() => removeLeg(leg.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    <div className="space-y-0.5">
                      <label className="text-[9px] text-muted-foreground">Strike</label>
                      <Select
                        value={String(leg.strike)}
                        onValueChange={(v) => updateLeg(leg.id, { strike: Number(v) })}
                      >
                        <SelectTrigger className="h-6 text-[10px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableStrikes.map((s) => (
                            <SelectItem key={s} value={String(s)}>
                              {s.toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] text-muted-foreground">Expiry</label>
                      <Select value={leg.expiry} onValueChange={(v) => updateLeg(leg.id, { expiry: v })}>
                        <SelectTrigger className="h-6 text-[10px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableExpiries.map((e) => (
                            <SelectItem key={e} value={e}>
                              {e}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] text-muted-foreground">Type</label>
                      <div className="grid grid-cols-2 gap-0.5">
                        <Button
                          variant={leg.side === "call" ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-6 text-[9px] px-1",
                            leg.side === "call" && "bg-emerald-600 hover:bg-emerald-700",
                          )}
                          onClick={() => updateLeg(leg.id, { side: "call" })}
                        >
                          C
                        </Button>
                        <Button
                          variant={leg.side === "put" ? "default" : "outline"}
                          size="sm"
                          className={cn("h-6 text-[9px] px-1", leg.side === "put" && "bg-rose-600 hover:bg-rose-700")}
                          onClick={() => updateLeg(leg.id, { side: "put" })}
                        >
                          P
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] text-muted-foreground">Dir</label>
                      <div className="grid grid-cols-2 gap-0.5">
                        <Button
                          variant={leg.direction === "buy" ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-6 text-[9px] px-1",
                            leg.direction === "buy" && "bg-emerald-600 hover:bg-emerald-700",
                          )}
                          onClick={() => updateLeg(leg.id, { direction: "buy" })}
                        >
                          B
                        </Button>
                        <Button
                          variant={leg.direction === "sell" ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-6 text-[9px] px-1",
                            leg.direction === "sell" && "bg-rose-600 hover:bg-rose-700",
                          )}
                          onClick={() => updateLeg(leg.id, { direction: "sell" })}
                        >
                          S
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] text-muted-foreground">Qty</label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={leg.quantity}
                        onChange={(e) =>
                          updateLeg(leg.id, {
                            quantity: Math.max(1, parseInt(e.target.value) || 1),
                          })
                        }
                        className="h-6 text-[10px] font-mono px-1.5"
                      />
                    </div>
                  </div>
                  {opt && (
                    <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                      <span>
                        Mid: {((opt.bid + opt.ask) / 2).toFixed(2)} | IV: {(opt.iv * 100).toFixed(1)}%
                      </span>
                      <span className={leg.direction === "buy" ? "text-rose-400" : "text-emerald-400"}>
                        {leg.direction === "buy" ? "-" : "+"}
                        {(((opt.bid + opt.ask) / 2) * leg.quantity).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full text-xs" onClick={addLeg} disabled={legs.length >= 4}>
          <Plus className="size-3 mr-1.5" />
          Add Leg {legs.length >= 4 ? "(max 4)" : ""}
        </Button>

        {legs.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="p-2 rounded-md border bg-muted/10">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Combined Greeks</p>
                <div className="grid grid-cols-4 gap-2 text-[10px]">
                  <div className="text-center">
                    <span className="text-muted-foreground block">Delta</span>
                    <span className="font-mono font-medium">{combinedGreeks.delta.toFixed(3)}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-muted-foreground block">Gamma</span>
                    <span className="font-mono font-medium">{combinedGreeks.gamma.toFixed(4)}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-muted-foreground block">Theta</span>
                    <span className="font-mono font-medium">{combinedGreeks.theta.toFixed(2)}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-muted-foreground block">Vega</span>
                    <span className="font-mono font-medium">{combinedGreeks.vega.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="p-2 rounded-md border bg-muted/10">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                  <DollarSign className="size-3" />
                  P&L Profile (at expiry)
                </p>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <span className="text-muted-foreground">Max Profit</span>
                  <span className="font-mono text-emerald-400 text-right">
                    {pnlProfile.maxProfit === Infinity ? "Unlimited" : `$${pnlProfile.maxProfit.toLocaleString()}`}
                  </span>
                  <span className="text-muted-foreground">Max Loss</span>
                  <span className="font-mono text-rose-400 text-right">${pnlProfile.maxLoss.toLocaleString()}</span>
                  <span className="text-muted-foreground">Breakeven(s)</span>
                  <span className="font-mono text-right">
                    {pnlProfile.breakevens.length > 0
                      ? pnlProfile.breakevens.map((b) => `$${b.toLocaleString()}`).join(", ")
                      : "--"}
                  </span>
                </div>
              </div>
            </div>

            <Button className="w-full text-xs h-8" disabled={legs.length === 0} onClick={() => onSubmitBundle?.(legs)}>
              <Send className="size-3 mr-1.5" />
              Submit Multi-Leg ({legs.length} leg{legs.length !== 1 ? "s" : ""})
            </Button>
          </>
        )}

        {legs.length === 0 && (
          <div className="text-center py-4 text-xs text-muted-foreground">
            Select a template above or add legs manually
          </div>
        )}
      </div>
    </div>
  );
}
