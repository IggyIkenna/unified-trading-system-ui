"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Layers,
  Send,
  DollarSign,
} from "lucide-react";
import { useOptionsChain } from "@/hooks/api/use-market-data";

// ---------- Types ----------

interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

interface OptionLeg {
  bid: number;
  ask: number;
  last: number;
  iv: number;
  greeks: OptionGreeks;
  volume: number;
  openInterest: number;
}

interface OptionsRow {
  strike: number;
  call: OptionLeg;
  put: OptionLeg;
}

interface ExpiryGroup {
  expiry: string;
  daysToExpiry: number;
  rows: OptionsRow[];
  spotPrice: number;
}

interface OptionsChainResponse {
  underlying: string;
  venue: string;
  spotPrice: number;
  expiries: ExpiryGroup[];
}

interface OptionsChainProps {
  underlying: string;
  venue: string;
  onSelectStrike?: (
    strike: number,
    expiry: string,
    side: "call" | "put",
  ) => void;
  className?: string;
}

// ---------- Mock data generator ----------

const UNDERLYINGS = ["BTC", "ETH", "SPY"] as const;

function generateMockExpiry(
  expiry: string,
  daysToExpiry: number,
  spotPrice: number,
  tickSize: number,
): ExpiryGroup {
  const numStrikes = 11;
  const halfRange = Math.floor(numStrikes / 2);
  const roundedSpot = Math.round(spotPrice / tickSize) * tickSize;
  const rows: OptionsRow[] = [];

  for (let i = -halfRange; i <= halfRange; i++) {
    const strike = roundedSpot + i * tickSize;
    const moneyness = spotPrice / strike;
    const baseIv =
      0.4 +
      0.15 * Math.pow(moneyness - 1, 2) * 100 +
      (daysToExpiry / 365) * 0.05;

    const callItm = spotPrice > strike;
    const putItm = spotPrice < strike;

    const callIntrinsic = Math.max(spotPrice - strike, 0);
    const putIntrinsic = Math.max(strike - spotPrice, 0);

    const timeValue = spotPrice * baseIv * Math.sqrt(daysToExpiry / 365) * 0.05;
    const callMid = callIntrinsic + timeValue * (1 + (callItm ? 0.1 : 0.3));
    const putMid = putIntrinsic + timeValue * (1 + (putItm ? 0.1 : 0.3));

    const spread = spotPrice * 0.0005;

    const callDelta = callItm
      ? 0.5 + 0.5 * (1 - Math.exp(-Math.abs(i) * 0.3))
      : 0.5 - 0.5 * (1 - Math.exp(-Math.abs(i) * 0.3));
    const putDelta = callDelta - 1;

    const gamma = 0.001 * Math.exp((-0.5 * i * i) / 4);
    const theta =
      (-(spotPrice * baseIv) / (2 * Math.sqrt(daysToExpiry / 365) * 365)) *
      gamma *
      10000;
    const vega = spotPrice * Math.sqrt(daysToExpiry / 365) * gamma * 100;

    rows.push({
      strike,
      call: {
        bid: Math.max(callMid - spread / 2, 0.01),
        ask: callMid + spread / 2,
        last: callMid + (Math.random() - 0.5) * spread * 0.5,
        iv: baseIv + (Math.random() - 0.5) * 0.02,
        greeks: { delta: callDelta, gamma, theta, vega },
        volume: Math.floor(Math.random() * 500 + 10),
        openInterest: Math.floor(Math.random() * 5000 + 100),
      },
      put: {
        bid: Math.max(putMid - spread / 2, 0.01),
        ask: putMid + spread / 2,
        last: putMid + (Math.random() - 0.5) * spread * 0.5,
        iv: baseIv + 0.01 + (Math.random() - 0.5) * 0.02,
        greeks: {
          delta: putDelta,
          gamma,
          theta: theta * 0.9,
          vega: vega * 0.95,
        },
        volume: Math.floor(Math.random() * 400 + 10),
        openInterest: Math.floor(Math.random() * 4000 + 100),
      },
    });
  }

  return { expiry, daysToExpiry, rows, spotPrice };
}

function generateMockOptionsChain(
  underlying: string,
  venue: string,
): OptionsChainResponse {
  const spots: Record<string, number> = {
    BTC: 67234.5,
    ETH: 3456.78,
    SPY: 542.3,
  };
  const ticks: Record<string, number> = { BTC: 1000, ETH: 50, SPY: 5 };

  const spotPrice = spots[underlying] ?? 100;
  const tickSize = ticks[underlying] ?? 1;

  const now = new Date();
  const expiries: ExpiryGroup[] = [
    { label: "Weekly", days: 7 },
    { label: "Bi-weekly", days: 14 },
    { label: "Monthly", days: 30 },
    { label: "Quarterly", days: 90 },
  ].map(({ days }) => {
    const d = new Date(now.getTime() + days * 86400000);
    const label = d.toISOString().slice(0, 10);
    return generateMockExpiry(label, days, spotPrice, tickSize);
  });

  return { underlying, venue, spotPrice, expiries };
}

// ---------- Formatting helpers ----------

function fmtNum(n: number, decimals: number): string {
  return n.toFixed(decimals);
}

function fmtIv(iv: number): string {
  return `${(iv * 100).toFixed(1)}%`;
}

function fmtInt(n: number): string {
  return n.toLocaleString();
}

// ---------- Sub-components ----------

const CALL_HEADS = [
  "Bid",
  "Ask",
  "Last",
  "IV",
  "Delta",
  "Gamma",
  "Theta",
  "Vega",
  "Vol",
  "OI",
] as const;
const PUT_HEADS = [
  "OI",
  "Vol",
  "Vega",
  "Theta",
  "Gamma",
  "Delta",
  "IV",
  "Last",
  "Ask",
  "Bid",
] as const;

function OptionCells({
  leg,
  side,
  itm,
  decimals,
  strike,
  expiry,
  onSelect,
}: {
  leg: OptionLeg;
  side: "call" | "put";
  itm: boolean;
  decimals: number;
  strike: number;
  expiry: string;
  onSelect?: (strike: number, expiry: string, side: "call" | "put") => void;
}) {
  const bg = itm
    ? side === "call"
      ? "bg-emerald-500/5"
      : "bg-rose-500/5"
    : "";
  const cls = cn("font-mono text-xs cursor-pointer", bg);

  const cells = [
    fmtNum(leg.bid, decimals),
    fmtNum(leg.ask, decimals),
    fmtNum(leg.last, decimals),
    fmtIv(leg.iv),
    fmtNum(leg.greeks.delta, 3),
    fmtNum(leg.greeks.gamma, 4),
    fmtNum(leg.greeks.theta, 2),
    fmtNum(leg.greeks.vega, 2),
    fmtInt(leg.volume),
    fmtInt(leg.openInterest),
  ];

  const ordered = side === "put" ? [...cells].reverse() : cells;

  return (
    <>
      {ordered.map((val, i) => (
        <TableCell
          key={i}
          className={cn(cls, "text-right px-1.5 py-1")}
          onClick={() => onSelect?.(strike, expiry, side)}
        >
          {val}
        </TableCell>
      ))}
    </>
  );
}

function ExpirySection({
  group,
  decimals,
  onSelectStrike,
}: {
  group: ExpiryGroup;
  decimals: number;
  onSelectStrike?: (
    strike: number,
    expiry: string,
    side: "call" | "put",
  ) => void;
}) {
  const [open, setOpen] = React.useState(true);

  // Find ATM strike (closest to spot)
  const atmStrike = group.rows.reduce((closest, row) =>
    Math.abs(row.strike - group.spotPrice) <
    Math.abs(closest.strike - group.spotPrice)
      ? row
      : closest,
  ).strike;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2 bg-muted/40 hover:bg-muted/60 transition-colors border-b border-border cursor-pointer">
        {open ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
        <span className="text-sm font-medium">{group.expiry}</span>
        <Badge variant="outline" className="text-[10px] font-mono">
          {group.daysToExpiry}d
        </Badge>
        <span className="text-xs text-muted-foreground ml-auto">
          {group.rows.length} strikes
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <Table>
          <TableHeader>
            <TableRow className="text-[10px]">
              {CALL_HEADS.map((h) => (
                <TableHead
                  key={`c-${h}`}
                  className="text-right px-1.5 py-1 text-emerald-400/80 text-[10px]"
                >
                  {h}
                </TableHead>
              ))}
              <TableHead className="text-center px-2 py-1 bg-muted/30 font-bold text-[10px]">
                Strike
              </TableHead>
              {PUT_HEADS.map((h) => (
                <TableHead
                  key={`p-${h}`}
                  className="text-right px-1.5 py-1 text-rose-400/80 text-[10px]"
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.rows.map((row) => {
              const isAtm = row.strike === atmStrike;
              const callItm = group.spotPrice > row.strike;
              const putItm = group.spotPrice < row.strike;

              return (
                <TableRow
                  key={row.strike}
                  className={cn(
                    isAtm && "bg-yellow-500/10 border-y border-yellow-500/30",
                  )}
                >
                  <OptionCells
                    leg={row.call}
                    side="call"
                    itm={callItm}
                    decimals={decimals}
                    strike={row.strike}
                    expiry={group.expiry}
                    onSelect={onSelectStrike}
                  />
                  <TableCell
                    className={cn(
                      "text-center font-mono font-bold text-xs px-2 py-1 bg-muted/20",
                      isAtm && "text-yellow-400",
                    )}
                  >
                    {fmtNum(row.strike, decimals)}
                    {isAtm && (
                      <span className="ml-1 text-[9px] text-yellow-500/80">
                        ATM
                      </span>
                    )}
                  </TableCell>
                  <OptionCells
                    leg={row.put}
                    side="put"
                    itm={putItm}
                    decimals={decimals}
                    strike={row.strike}
                    expiry={group.expiry}
                    onSelect={onSelectStrike}
                  />
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---------- Multi-Leg Builder Types ----------

interface SpreadLeg {
  id: string;
  strike: number;
  expiry: string;
  side: "call" | "put";
  direction: "buy" | "sell";
  quantity: number;
}

interface SpreadTemplate {
  name: string;
  description: string;
  buildLegs: (
    atmStrike: number,
    tickSize: number,
    expiry: string,
  ) => Omit<SpreadLeg, "id">[];
}

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

// ---------- Multi-Leg Builder Component ----------

function MultiLegBuilder({
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
        Math.abs(row.strike - spotPrice) < Math.abs(closest.strike - spotPrice)
          ? row
          : closest,
      ).strike
    : spotPrice;

  // Available strikes from all expiries
  const availableStrikes = React.useMemo(() => {
    const strikes = new Set<number>();
    for (const exp of chain.expiries) {
      for (const row of exp.rows) {
        strikes.add(row.strike);
      }
    }
    return Array.from(strikes).sort((a, b) => a - b);
  }, [chain.expiries]);

  const availableExpiries = React.useMemo(
    () => chain.expiries.map((e) => e.expiry),
    [chain.expiries],
  );

  const addLeg = () => {
    if (legs.length >= 4) return;
    setLegs([
      ...legs,
      {
        id: `leg-${Date.now()}`,
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
    const newLegs = template
      .buildLegs(atmStrike, tickSize, expiry)
      .map((l, i) => ({
        ...l,
        id: `leg-${Date.now()}-${i}`,
      }));
    setLegs(newLegs);
  };

  // Look up option data for a leg
  const lookupOption = (leg: SpreadLeg): OptionLeg | null => {
    const expiryGroup = chain.expiries.find((e) => e.expiry === leg.expiry);
    if (!expiryGroup) return null;
    const row = expiryGroup.rows.find((r) => r.strike === leg.strike);
    if (!row) return null;
    return leg.side === "call" ? row.call : row.put;
  };

  // Combined Greeks
  const combinedGreeks = React.useMemo(() => {
    let delta = 0,
      gamma = 0,
      theta = 0,
      vega = 0;
    for (const leg of legs) {
      const opt = lookupOption(leg);
      if (!opt) continue;
      const sign = leg.direction === "buy" ? 1 : -1;
      const qty = leg.quantity;
      delta += opt.greeks.delta * sign * qty;
      gamma += opt.greeks.gamma * sign * qty;
      theta += opt.greeks.theta * sign * qty;
      vega += opt.greeks.vega * sign * qty;
    }
    return { delta, gamma, theta, vega };
  }, [legs, chain]);

  // P&L profile estimate
  const pnlProfile = React.useMemo(() => {
    if (legs.length === 0)
      return { maxProfit: 0, maxLoss: 0, breakevens: [] as number[] };

    // Net premium: sum of (direction * mid price * quantity)
    let netPremium = 0;
    for (const leg of legs) {
      const opt = lookupOption(leg);
      if (!opt) continue;
      const mid = (opt.bid + opt.ask) / 2;
      const sign = leg.direction === "buy" ? -1 : 1; // buy = pay, sell = receive
      netPremium += mid * sign * leg.quantity;
    }

    // Compute P&L at various underlying prices
    const strikes = legs.map((l) => l.strike).sort((a, b) => a - b);
    const minStrike = (strikes[0] ?? spotPrice) - tickSize * 3;
    const maxStrike = (strikes[strikes.length - 1] ?? spotPrice) + tickSize * 3;
    const step = (maxStrike - minStrike) / 100;
    const pnlPoints: number[] = [];

    for (let price = minStrike; price <= maxStrike; price += step) {
      let expPnl = netPremium;
      for (const leg of legs) {
        const sign = leg.direction === "buy" ? 1 : -1;
        const intrinsic =
          leg.side === "call"
            ? Math.max(price - leg.strike, 0)
            : Math.max(leg.strike - price, 0);
        expPnl += intrinsic * sign * leg.quantity;
      }
      pnlPoints.push(expPnl);
    }

    const maxProfit = Math.max(...pnlPoints);
    const maxLoss = Math.min(...pnlPoints);

    // Find breakevens (zero crossings)
    const breakevens: number[] = [];
    for (let i = 1; i < pnlPoints.length; i++) {
      if (
        (pnlPoints[i - 1] <= 0 && pnlPoints[i] >= 0) ||
        (pnlPoints[i - 1] >= 0 && pnlPoints[i] <= 0)
      ) {
        const price = minStrike + i * step;
        breakevens.push(Math.round(price * 100) / 100);
      }
    }

    return {
      maxProfit:
        maxProfit === Infinity ? Infinity : Math.round(maxProfit * 100) / 100,
      maxLoss: Math.round(maxLoss * 100) / 100,
      breakevens,
    };
  }, [legs, chain, spotPrice, tickSize]);

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
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>

      <div className="px-3 py-3 space-y-3">
        {/* Templates */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Templates
          </p>
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

        {/* Leg entries */}
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
                    {/* Strike */}
                    <div className="space-y-0.5">
                      <label className="text-[9px] text-muted-foreground">
                        Strike
                      </label>
                      <Select
                        value={String(leg.strike)}
                        onValueChange={(v) =>
                          updateLeg(leg.id, { strike: Number(v) })
                        }
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
                    {/* Expiry */}
                    <div className="space-y-0.5">
                      <label className="text-[9px] text-muted-foreground">
                        Expiry
                      </label>
                      <Select
                        value={leg.expiry}
                        onValueChange={(v) => updateLeg(leg.id, { expiry: v })}
                      >
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
                    {/* Put/Call */}
                    <div className="space-y-0.5">
                      <label className="text-[9px] text-muted-foreground">
                        Type
                      </label>
                      <div className="grid grid-cols-2 gap-0.5">
                        <Button
                          variant={leg.side === "call" ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-6 text-[9px] px-1",
                            leg.side === "call" &&
                              "bg-emerald-600 hover:bg-emerald-700",
                          )}
                          onClick={() => updateLeg(leg.id, { side: "call" })}
                        >
                          C
                        </Button>
                        <Button
                          variant={leg.side === "put" ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-6 text-[9px] px-1",
                            leg.side === "put" &&
                              "bg-rose-600 hover:bg-rose-700",
                          )}
                          onClick={() => updateLeg(leg.id, { side: "put" })}
                        >
                          P
                        </Button>
                      </div>
                    </div>
                    {/* Buy/Sell */}
                    <div className="space-y-0.5">
                      <label className="text-[9px] text-muted-foreground">
                        Dir
                      </label>
                      <div className="grid grid-cols-2 gap-0.5">
                        <Button
                          variant={
                            leg.direction === "buy" ? "default" : "outline"
                          }
                          size="sm"
                          className={cn(
                            "h-6 text-[9px] px-1",
                            leg.direction === "buy" &&
                              "bg-emerald-600 hover:bg-emerald-700",
                          )}
                          onClick={() =>
                            updateLeg(leg.id, { direction: "buy" })
                          }
                        >
                          B
                        </Button>
                        <Button
                          variant={
                            leg.direction === "sell" ? "default" : "outline"
                          }
                          size="sm"
                          className={cn(
                            "h-6 text-[9px] px-1",
                            leg.direction === "sell" &&
                              "bg-rose-600 hover:bg-rose-700",
                          )}
                          onClick={() =>
                            updateLeg(leg.id, { direction: "sell" })
                          }
                        >
                          S
                        </Button>
                      </div>
                    </div>
                    {/* Quantity */}
                    <div className="space-y-0.5">
                      <label className="text-[9px] text-muted-foreground">
                        Qty
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={leg.quantity}
                        onChange={(e) =>
                          updateLeg(leg.id, {
                            quantity: Math.max(
                              1,
                              parseInt(e.target.value) || 1,
                            ),
                          })
                        }
                        className="h-6 text-[10px] font-mono px-1.5"
                      />
                    </div>
                  </div>
                  {/* Leg mid price */}
                  {opt && (
                    <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                      <span>
                        Mid: {((opt.bid + opt.ask) / 2).toFixed(2)} | IV:{" "}
                        {(opt.iv * 100).toFixed(1)}%
                      </span>
                      <span
                        className={
                          leg.direction === "buy"
                            ? "text-rose-400"
                            : "text-emerald-400"
                        }
                      >
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

        {/* Add leg button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={addLeg}
          disabled={legs.length >= 4}
        >
          <Plus className="size-3 mr-1.5" />
          Add Leg {legs.length >= 4 ? "(max 4)" : ""}
        </Button>

        {/* Combined P&L and Greeks */}
        {legs.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              {/* Combined Greeks */}
              <div className="p-2 rounded-md border bg-muted/10">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Combined Greeks
                </p>
                <div className="grid grid-cols-4 gap-2 text-[10px]">
                  <div className="text-center">
                    <span className="text-muted-foreground block">Delta</span>
                    <span className="font-mono font-medium">
                      {combinedGreeks.delta.toFixed(3)}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-muted-foreground block">Gamma</span>
                    <span className="font-mono font-medium">
                      {combinedGreeks.gamma.toFixed(4)}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-muted-foreground block">Theta</span>
                    <span className="font-mono font-medium">
                      {combinedGreeks.theta.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-muted-foreground block">Vega</span>
                    <span className="font-mono font-medium">
                      {combinedGreeks.vega.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* P&L Profile */}
              <div className="p-2 rounded-md border bg-muted/10">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                  <DollarSign className="size-3" />
                  P&L Profile (at expiry)
                </p>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <span className="text-muted-foreground">Max Profit</span>
                  <span className="font-mono text-emerald-400 text-right">
                    {pnlProfile.maxProfit === Infinity
                      ? "Unlimited"
                      : `$${pnlProfile.maxProfit.toLocaleString()}`}
                  </span>
                  <span className="text-muted-foreground">Max Loss</span>
                  <span className="font-mono text-rose-400 text-right">
                    ${pnlProfile.maxLoss.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">Breakeven(s)</span>
                  <span className="font-mono text-right">
                    {pnlProfile.breakevens.length > 0
                      ? pnlProfile.breakevens
                          .map((b) => `$${b.toLocaleString()}`)
                          .join(", ")
                      : "--"}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit */}
            <Button
              className="w-full text-xs h-8"
              disabled={legs.length === 0}
              onClick={() => onSubmitBundle?.(legs)}
            >
              <Send className="size-3 mr-1.5" />
              Submit Multi-Leg ({legs.length} leg{legs.length !== 1 ? "s" : ""})
            </Button>
          </>
        )}

        {/* Empty state */}
        {legs.length === 0 && (
          <div className="text-center py-4 text-xs text-muted-foreground">
            Select a template above or add legs manually
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Main component ----------

export function OptionsChain({
  underlying: initialUnderlying,
  venue,
  onSelectStrike,
  className,
}: OptionsChainProps) {
  const [underlying, setUnderlying] = React.useState(initialUnderlying);
  const [showSpreadBuilder, setShowSpreadBuilder] = React.useState(false);
  const { data, isLoading, isError } = useOptionsChain(underlying, venue);

  // Determine decimal precision by underlying
  const decimals = underlying === "BTC" ? 2 : underlying === "ETH" ? 2 : 2;

  // Use API data if available, otherwise fall back to mock
  const chain: OptionsChainResponse = React.useMemo(() => {
    if (
      data &&
      typeof data === "object" &&
      "expiries" in (data as Record<string, unknown>)
    ) {
      return data as OptionsChainResponse;
    }
    return generateMockOptionsChain(underlying, venue);
  }, [data, underlying, venue]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            Options Chain
            <Badge variant="secondary" className="text-[10px]">
              {venue}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={showSpreadBuilder ? "secondary" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setShowSpreadBuilder(!showSpreadBuilder)}
            >
              <Layers className="size-3 mr-1" />
              Build Spread
            </Button>
            <Select value={underlying} onValueChange={setUnderlying}>
              <SelectTrigger className="h-7 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNDERLYINGS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-[10px] font-mono">
              Spot:{" "}
              {chain.spotPrice.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </Badge>
          </div>
        </div>

        {isLoading && (
          <div className="text-xs text-muted-foreground mt-1">
            Loading options chain...
          </div>
        )}
        {isError && (
          <div className="text-xs text-muted-foreground mt-1">
            API unavailable -- showing mock data
          </div>
        )}
        {!data && !isLoading && !isError && (
          <div className="text-xs text-muted-foreground mt-1">
            No live data -- displaying sample options chain
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0 px-0">
        {/* Multi-Leg Builder Panel */}
        {showSpreadBuilder && (
          <MultiLegBuilder
            chain={chain}
            onClose={() => setShowSpreadBuilder(false)}
          />
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 px-3 py-1.5 border-b border-border text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="text-emerald-400">CALLS</span>
            <span className="inline-block w-3 h-2 bg-emerald-500/10 border border-emerald-500/30 rounded-sm" />
            <span>ITM</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-rose-400">PUTS</span>
            <span className="inline-block w-3 h-2 bg-rose-500/10 border border-rose-500/30 rounded-sm" />
            <span>ITM</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 bg-yellow-500/10 border border-yellow-500/30 rounded-sm" />
            <span>ATM</span>
          </div>
        </div>

        <div className="max-h-[700px] overflow-y-auto">
          {chain.expiries.map((group) => (
            <ExpirySection
              key={group.expiry}
              group={group}
              decimals={decimals}
              onSelectStrike={onSelectStrike}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export { generateMockOptionsChain };
export type {
  OptionsChainResponse,
  ExpiryGroup,
  OptionsRow,
  OptionLeg,
  OptionGreeks,
  SpreadLeg,
};
