"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  formatUsd,
  generateOptionChain,
  generateStrikes,
  seededRandom,
  SPOT_PRICES,
  STRIKE_INCREMENTS,
} from "@/lib/mocks/fixtures/options-futures-mock";
import type { Asset, ComboLeg, ComboType, OptionRow, SelectedInstrument } from "@/lib/types/options";
import { cn } from "@/lib/utils";
import * as React from "react";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

// ---------- Options Combos ----------

const COMBO_TYPES: { value: ComboType; label: string }[] = [
  { value: "vertical-spread", label: "Vertical Spread" },
  { value: "straddle", label: "Straddle" },
  { value: "strangle", label: "Strangle" },
  { value: "calendar", label: "Calendar" },
  { value: "butterfly", label: "Butterfly" },
  { value: "risk-reversal", label: "Risk Reversal" },
];

const CALENDAR_EXPIRIES = ["26 JUN 26", "25 SEP 26", "25 DEC 26", "26 MAR 27", "26 JUN 27", "25 SEP 27"] as const;

export function OptionsCombosPanel({
  asset,
  onSelectInstrument,
}: {
  asset: Asset;
  onSelectInstrument: (inst: SelectedInstrument) => void;
}) {
  const [comboType, setComboType] = React.useState<ComboType>("vertical-spread");
  const spot = SPOT_PRICES[asset];
  const strikes = React.useMemo(() => generateStrikes(asset), [asset]);
  const chain = React.useMemo(() => generateOptionChain(asset, "26 JUN 26"), [asset]);
  const inc = STRIKE_INCREMENTS[asset];

  // Map strike -> OptionRow for quick lookup
  const chainMap = React.useMemo(() => {
    const m = new Map<number, OptionRow>();
    for (const row of chain) {
      m.set(row.strike, row);
    }
    return m;
  }, [chain]);

  const closestAtmStrike = strikes.reduce((prev, curr) =>
    Math.abs(curr - spot) < Math.abs(prev - spot) ? curr : prev,
  );
  const atmIdx = strikes.indexOf(closestAtmStrike);

  // Strikes above and below ATM for directional combos
  const strikesAboveAtm = strikes.filter((s) => s > closestAtmStrike);
  const strikesBelowAtm = strikes.filter((s) => s < closestAtmStrike);

  // Wing widths for butterfly
  const wingWidths = [1, 2, 3, 4, 5].map((n) => n * inc);

  const getGreeks = (strike: number, side: "call" | "put") => {
    const row = chainMap.get(strike);
    if (!row) {
      return { price: 0, delta: 0, gamma: 0, theta: 0, vega: 0 };
    }
    if (side === "call") {
      return {
        price: row.callMark,
        delta: row.callDelta,
        gamma: 0.003 + seededRandom(strike) * 0.005,
        theta: -(8 + seededRandom(strike + 1) * 15),
        vega: 0.1 + seededRandom(strike + 2) * 0.2,
      };
    }
    return {
      price: row.putMark,
      delta: row.putDelta,
      gamma: 0.003 + seededRandom(strike + 10) * 0.005,
      theta: -(8 + seededRandom(strike + 11) * 15),
      vega: 0.1 + seededRandom(strike + 12) * 0.2,
    };
  };

  const buildComboInstrument = (
    label: string,
    legs: ComboLeg[],
    type: string,
    netDebit: number,
  ): SelectedInstrument => ({
    name: label,
    type: "combo",
    price: Math.abs(netDebit),
    delta: legs.reduce((s, l) => s + l.delta * (l.direction === "buy" ? 1 : -1), 0),
    gamma: legs.reduce((s, l) => s + l.gamma * (l.direction === "buy" ? 1 : -1), 0),
    theta: legs.reduce((s, l) => s + l.theta * (l.direction === "buy" ? 1 : -1), 0),
    vega: legs.reduce((s, l) => s + l.vega * (l.direction === "buy" ? 1 : -1), 0),
    legs,
    comboType: type,
    netDebit,
  });

  // --- Vertical Spread ---
  if (comboType === "vertical-spread") {
    return (
      <div className="space-y-3">
        <ComboTypePills comboType={comboType} setComboType={setComboType} />
        <p className="text-[10px] text-muted-foreground px-1">
          Bull call spread: BUY lower strike call, SELL higher strike call (same expiry). Lower triangle shows valid
          combinations. Click a cell to trade.
        </p>
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="w-full">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Long &darr; / Short &rarr;
                  </th>
                  {strikes.map((s) => (
                    <th key={s} className="py-2 px-1.5 text-center font-mono font-medium text-[10px] whitespace-nowrap">
                      {s.toLocaleString()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {strikes.map((longStrike, lIdx) => (
                  <tr key={longStrike} className="border-b">
                    <td className="py-2 px-2 font-mono font-medium text-[10px] whitespace-nowrap bg-muted/20">
                      {longStrike.toLocaleString()}
                    </td>
                    {strikes.map((shortStrike, sIdx) => {
                      if (sIdx <= lIdx) {
                        return (
                          <td
                            key={sIdx}
                            className={cn("py-1.5 px-1 text-center", sIdx === lIdx ? "bg-muted/40" : "bg-muted/15")}
                          >
                            {sIdx === lIdx ? <span className="text-muted-foreground/40">&mdash;</span> : null}
                          </td>
                        );
                      }
                      const longG = getGreeks(longStrike, "call");
                      const shortG = getGreeks(shortStrike, "call");
                      const netDebit = longG.price - shortG.price;
                      const spread = Math.abs(netDebit) * 0.02 + seededRandom(longStrike + shortStrike) * 2;
                      const legs: ComboLeg[] = [
                        {
                          strike: longStrike,
                          type: "call",
                          direction: "buy",
                          ...longG,
                        },
                        {
                          strike: shortStrike,
                          type: "call",
                          direction: "sell",
                          ...shortG,
                        },
                      ];

                      return (
                        <td
                          key={sIdx}
                          className="py-1 px-1 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() => {
                            const label = `BUY ${asset}-26JUN26-${longStrike}-C / SELL ${asset}-26JUN26-${shortStrike}-C`;
                            onSelectInstrument(buildComboInstrument(label, legs, "Vertical Spread", netDebit));
                          }}
                        >
                          <div className="rounded border bg-card/80 p-1 min-w-[80px] space-y-0.5">
                            <div className="flex items-center justify-center gap-1.5">
                              <span
                                className={cn(
                                  "font-mono font-medium",
                                  netDebit > 0 ? "text-rose-400" : "text-emerald-400",
                                )}
                              >
                                {formatUsd(Math.abs(netDebit - spread), 1)}
                              </span>
                              <span className="font-mono text-muted-foreground">
                                {formatUsd(Math.abs(netDebit + spread), 1)}
                              </span>
                            </div>
                            <p className="text-[8px] text-muted-foreground/60 truncate">
                              {netDebit > 0 ? "Debit" : "Credit"}
                            </p>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    );
  }

  // --- Straddle (list/table, not matrix) ---
  if (comboType === "straddle") {
    const straddleStrikes = strikes.slice(Math.max(0, atmIdx - 5), Math.min(strikes.length, atmIdx + 6));

    return (
      <div className="space-y-3">
        <ComboTypePills comboType={comboType} setComboType={setComboType} />
        <p className="text-[10px] text-muted-foreground px-1">
          Buy call + buy put at the same strike. Click a row to trade.
        </p>
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="w-full">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground">
                  <th className="py-1.5 px-2 text-right font-normal">Strike</th>
                  <th className="py-1.5 px-2 text-right font-normal">Call Price</th>
                  <th className="py-1.5 px-2 text-right font-normal">Put Price</th>
                  <th className="py-1.5 px-2 text-right font-normal">Net Cost</th>
                  <th className="py-1.5 px-2 text-right font-normal">Combined IV</th>
                  <th className="py-1.5 px-2 text-right font-normal">Net Delta</th>
                </tr>
              </thead>
              <tbody>
                {straddleStrikes.map((strike) => {
                  const callG = getGreeks(strike, "call");
                  const putG = getGreeks(strike, "put");
                  const netCost = callG.price + putG.price;
                  const row = chainMap.get(strike);
                  const combinedIv = row ? (row.callIvBid + row.callIvAsk + row.putIvBid + row.putIvAsk) / 4 : 0;
                  const netDelta = callG.delta + putG.delta;
                  const isAtm = strike === closestAtmStrike;
                  const legs: ComboLeg[] = [
                    { strike, type: "call", direction: "buy", ...callG },
                    { strike, type: "put", direction: "buy", ...putG },
                  ];

                  return (
                    <tr
                      key={strike}
                      className={cn(
                        "border-b hover:bg-muted/30 transition-colors cursor-pointer",
                        isAtm && "bg-amber-500/10 border-amber-500/30",
                      )}
                      onClick={() => {
                        const label = `BUY ${asset}-26JUN26-${strike}-C + BUY ${asset}-26JUN26-${strike}-P`;
                        onSelectInstrument(buildComboInstrument(label, legs, "Straddle", netCost));
                      }}
                    >
                      <td className="py-1.5 px-2 text-right font-mono font-medium">
                        {strike.toLocaleString()}
                        {isAtm && <span className="text-[8px] ml-1 text-amber-400/70">ATM</span>}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono">{formatUsd(callG.price)}</td>
                      <td className="py-1.5 px-2 text-right font-mono">{formatUsd(putG.price)}</td>
                      <td className="py-1.5 px-2 text-right font-mono font-medium text-rose-400">
                        {formatUsd(netCost)}
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">
                        {formatPercent(combinedIv, 1)}
                      </td>
                      <td
                        className={cn(
                          "py-1.5 px-2 text-right font-mono",
                          netDelta >= 0 ? "text-emerald-400" : "text-rose-400",
                        )}
                      >
                        {netDelta >= 0 ? "+" : ""}
                        {formatNumber(netDelta, 3)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    );
  }

  // --- Strangle (OTM call + OTM put, full matrix) ---
  if (comboType === "strangle") {
    const callStrikes = strikesAboveAtm.slice(0, 8);
    const putStrikes = strikesBelowAtm.slice(-8);

    return (
      <div className="space-y-3">
        <ComboTypePills comboType={comboType} setComboType={setComboType} />
        <p className="text-[10px] text-muted-foreground px-1">
          Buy OTM call + buy OTM put at different strikes. Full matrix (any combination valid).
        </p>
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="w-full">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Call &darr; / Put &rarr;
                  </th>
                  {putStrikes.map((s) => (
                    <th key={s} className="py-2 px-1.5 text-center font-mono font-medium text-[10px] whitespace-nowrap">
                      {s.toLocaleString()}P
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {callStrikes.map((callStrike) => (
                  <tr key={callStrike} className="border-b">
                    <td className="py-2 px-2 font-mono font-medium text-[10px] whitespace-nowrap bg-muted/20">
                      {callStrike.toLocaleString()}C
                    </td>
                    {putStrikes.map((putStrike) => {
                      const callG = getGreeks(callStrike, "call");
                      const putG = getGreeks(putStrike, "put");
                      const netCost = callG.price + putG.price;
                      const legs: ComboLeg[] = [
                        {
                          strike: callStrike,
                          type: "call",
                          direction: "buy",
                          ...callG,
                        },
                        {
                          strike: putStrike,
                          type: "put",
                          direction: "buy",
                          ...putG,
                        },
                      ];

                      return (
                        <td
                          key={putStrike}
                          className="py-1 px-1 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() => {
                            const label = `BUY ${asset}-26JUN26-${callStrike}-C + BUY ${asset}-26JUN26-${putStrike}-P`;
                            onSelectInstrument(buildComboInstrument(label, legs, "Strangle", netCost));
                          }}
                        >
                          <div className="rounded border bg-card/80 p-1 min-w-[70px] space-y-0.5">
                            <span className="font-mono font-medium text-rose-400">{formatUsd(netCost, 1)}</span>
                            <p className="text-[8px] text-muted-foreground/60">Debit</p>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    );
  }

  // --- Calendar Spread (same strike, different expiries) ---
  if (comboType === "calendar") {
    const calStrikes = strikes.slice(Math.max(0, atmIdx - 4), Math.min(strikes.length, atmIdx + 5));

    return (
      <div className="space-y-3">
        <ComboTypePills comboType={comboType} setComboType={setComboType} />
        <p className="text-[10px] text-muted-foreground px-1">
          Long far-expiry call, short near-expiry call at the same strike. Net debit shown.
        </p>
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="w-full">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Strike &darr; / Expiry &rarr;
                  </th>
                  {CALENDAR_EXPIRIES.map((exp) => (
                    <th
                      key={exp}
                      className="py-2 px-1.5 text-center font-mono font-medium text-[10px] whitespace-nowrap"
                    >
                      {exp}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calStrikes.map((strike) => {
                  const isAtm = strike === closestAtmStrike;
                  const baseG = getGreeks(strike, "call");

                  return (
                    <tr key={strike} className={cn("border-b", isAtm && "bg-amber-500/10")}>
                      <td className="py-2 px-2 font-mono font-medium text-[10px] whitespace-nowrap bg-muted/20">
                        {strike.toLocaleString()}
                        {isAtm && <span className="text-[8px] ml-1 text-amber-400/70">ATM</span>}
                      </td>
                      {CALENDAR_EXPIRIES.map((exp, eIdx) => {
                        // Near expiry is always first column; further expiries cost more
                        const timePremium = (eIdx + 1) * baseG.price * 0.08;
                        const farPrice = baseG.price + timePremium;
                        const nearPrice = baseG.price;
                        const netDebit = farPrice - nearPrice;
                        const legs: ComboLeg[] = [
                          {
                            strike,
                            type: "call",
                            direction: "buy",
                            price: farPrice,
                            delta: baseG.delta * 0.95,
                            gamma: baseG.gamma * 0.9,
                            theta: baseG.theta * 0.7,
                            vega: baseG.vega * 1.2,
                          },
                          {
                            strike,
                            type: "call",
                            direction: "sell",
                            price: nearPrice,
                            delta: baseG.delta,
                            gamma: baseG.gamma,
                            theta: baseG.theta,
                            vega: baseG.vega,
                          },
                        ];

                        return (
                          <td
                            key={exp}
                            className="py-1 px-1 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                            onClick={() => {
                              const label = `BUY ${asset}-${exp.replace(/ /g, "")}-${strike}-C / SELL ${asset}-26JUN26-${strike}-C`;
                              onSelectInstrument(buildComboInstrument(label, legs, "Calendar Spread", netDebit));
                            }}
                          >
                            <div className="rounded border bg-card/80 p-1 min-w-[70px] space-y-0.5">
                              <span className="font-mono font-medium text-rose-400">{formatUsd(netDebit, 1)}</span>
                              <p className="text-[8px] text-muted-foreground/60">Debit</p>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    );
  }

  // --- Butterfly (buy 1 lower, sell 2 middle, buy 1 upper) ---
  if (comboType === "butterfly") {
    const centerStrikes = strikes.slice(Math.max(0, atmIdx - 4), Math.min(strikes.length, atmIdx + 5));

    return (
      <div className="space-y-3">
        <ComboTypePills comboType={comboType} setComboType={setComboType} />
        <p className="text-[10px] text-muted-foreground px-1">
          Buy 1 lower wing, sell 2 center, buy 1 upper wing. Net debit shown.
        </p>
        <div className="border rounded-lg overflow-hidden">
          <ScrollArea className="w-full">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                    Center &darr; / Width &rarr;
                  </th>
                  {wingWidths.map((w) => (
                    <th key={w} className="py-2 px-1.5 text-center font-mono font-medium text-[10px] whitespace-nowrap">
                      {w.toLocaleString()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {centerStrikes.map((center) => {
                  const isAtm = center === closestAtmStrike;
                  return (
                    <tr key={center} className={cn("border-b", isAtm && "bg-amber-500/10")}>
                      <td className="py-2 px-2 font-mono font-medium text-[10px] whitespace-nowrap bg-muted/20">
                        {center.toLocaleString()}
                        {isAtm && <span className="text-[8px] ml-1 text-amber-400/70">ATM</span>}
                      </td>
                      {wingWidths.map((width) => {
                        const lower = center - width;
                        const upper = center + width;
                        // Check that both wing strikes exist in the chain
                        const lowerG = getGreeks(lower, "call");
                        const centerG = getGreeks(center, "call");
                        const upperG = getGreeks(upper, "call");
                        const hasData = chainMap.has(lower) && chainMap.has(upper);

                        if (!hasData) {
                          return (
                            <td key={width} className="py-1.5 px-1 text-center bg-muted/15">
                              <span className="text-muted-foreground/40 text-[9px]">N/A</span>
                            </td>
                          );
                        }

                        const netDebit = lowerG.price - 2 * centerG.price + upperG.price;
                        const legs: ComboLeg[] = [
                          {
                            strike: lower,
                            type: "call",
                            direction: "buy",
                            ...lowerG,
                          },
                          {
                            strike: center,
                            type: "call",
                            direction: "sell",
                            price: centerG.price,
                            delta: centerG.delta * -2,
                            gamma: centerG.gamma * -2,
                            theta: centerG.theta * -2,
                            vega: centerG.vega * -2,
                          },
                          {
                            strike: upper,
                            type: "call",
                            direction: "buy",
                            ...upperG,
                          },
                        ];
                        // Fix center leg: direction=sell but we store raw greeks; sign handled in buildComboInstrument
                        legs[1] = {
                          strike: center,
                          type: "call",
                          direction: "sell",
                          price: centerG.price,
                          delta: centerG.delta,
                          gamma: centerG.gamma,
                          theta: centerG.theta,
                          vega: centerG.vega,
                        };

                        // Sell 2x center: duplicate the sell leg
                        const allLegs: ComboLeg[] = [
                          {
                            strike: lower,
                            type: "call",
                            direction: "buy",
                            ...lowerG,
                          },
                          {
                            strike: center,
                            type: "call",
                            direction: "sell",
                            price: centerG.price,
                            delta: centerG.delta,
                            gamma: centerG.gamma,
                            theta: centerG.theta,
                            vega: centerG.vega,
                          },
                          {
                            strike: center,
                            type: "call",
                            direction: "sell",
                            price: centerG.price,
                            delta: centerG.delta,
                            gamma: centerG.gamma,
                            theta: centerG.theta,
                            vega: centerG.vega,
                          },
                          {
                            strike: upper,
                            type: "call",
                            direction: "buy",
                            ...upperG,
                          },
                        ];

                        return (
                          <td
                            key={width}
                            className="py-1 px-1 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                            onClick={() => {
                              const label = `BUY ${lower}C / SELL 2x${center}C / BUY ${upper}C`;
                              onSelectInstrument(buildComboInstrument(label, allLegs, "Butterfly", netDebit));
                            }}
                          >
                            <div className="rounded border bg-card/80 p-1 min-w-[70px] space-y-0.5">
                              <span
                                className={cn(
                                  "font-mono font-medium",
                                  netDebit > 0 ? "text-rose-400" : "text-emerald-400",
                                )}
                              >
                                {formatUsd(Math.abs(netDebit), 1)}
                              </span>
                              <p className="text-[8px] text-muted-foreground/60">{netDebit > 0 ? "Debit" : "Credit"}</p>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
    );
  }

  // --- Risk Reversal (sell OTM put, buy OTM call) ---
  // comboType === "risk-reversal"
  const rrCallStrikes = strikesAboveAtm.slice(0, 8);
  const rrPutStrikes = strikesBelowAtm.slice(-8);

  return (
    <div className="space-y-3">
      <ComboTypePills comboType={comboType} setComboType={setComboType} />
      <p className="text-[10px] text-muted-foreground px-1">Sell OTM put, buy OTM call. Net credit or debit shown.</p>
      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="w-full">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  Call &darr; / Put &rarr;
                </th>
                {rrPutStrikes.map((s) => (
                  <th key={s} className="py-2 px-1.5 text-center font-mono font-medium text-[10px] whitespace-nowrap">
                    {s.toLocaleString()}P
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rrCallStrikes.map((callStrike) => (
                <tr key={callStrike} className="border-b">
                  <td className="py-2 px-2 font-mono font-medium text-[10px] whitespace-nowrap bg-muted/20">
                    {callStrike.toLocaleString()}C
                  </td>
                  {rrPutStrikes.map((putStrike) => {
                    const callG = getGreeks(callStrike, "call");
                    const putG = getGreeks(putStrike, "put");
                    // Net = sell put premium - buy call premium
                    const netCredit = putG.price - callG.price;
                    const legs: ComboLeg[] = [
                      {
                        strike: callStrike,
                        type: "call",
                        direction: "buy",
                        ...callG,
                      },
                      {
                        strike: putStrike,
                        type: "put",
                        direction: "sell",
                        ...putG,
                      },
                    ];

                    return (
                      <td
                        key={putStrike}
                        className="py-1 px-1 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => {
                          const label = `BUY ${asset}-26JUN26-${callStrike}-C / SELL ${asset}-26JUN26-${putStrike}-P`;
                          onSelectInstrument(buildComboInstrument(label, legs, "Risk Reversal", -netCredit));
                        }}
                      >
                        <div className="rounded border bg-card/80 p-1 min-w-[70px] space-y-0.5">
                          <span
                            className={cn(
                              "font-mono font-medium",
                              netCredit >= 0 ? "text-emerald-400" : "text-rose-400",
                            )}
                          >
                            {formatUsd(Math.abs(netCredit), 1)}
                          </span>
                          <p className="text-[8px] text-muted-foreground/60">{netCredit >= 0 ? "Credit" : "Debit"}</p>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}

function ComboTypePills({ comboType, setComboType }: { comboType: ComboType; setComboType: (ct: ComboType) => void }) {
  return (
    <ScrollArea className="w-full">
      <div className="flex items-center gap-1 pb-1">
        {COMBO_TYPES.map((ct) => (
          <Button
            key={ct.value}
            variant={comboType === ct.value ? "default" : "outline"}
            size="sm"
            className="h-7 px-2.5 text-[10px] whitespace-nowrap shrink-0"
            onClick={() => setComboType(ct.value)}
          >
            {ct.label}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
