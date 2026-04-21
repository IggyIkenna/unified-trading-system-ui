"use client";

import * as React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  formatUsd,
  generateOptionChain,
  generateStrikes,
  SPOT_PRICES,
  STRIKE_INCREMENTS,
} from "@/lib/mocks/fixtures/options-futures-mock";
import type { Asset, ComboLeg, ComboType, OptionRow, SelectedInstrument } from "@/lib/types/options";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import { buildComboInstrument, CALENDAR_EXPIRIES, ComboTypePills, getGreeks } from "./options-combos-shared";
import { VerticalSpreadMatrix } from "./options-combos-vertical-spread";
import { ButterflyMatrix } from "./options-combos-butterfly";

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

  const strikesAboveAtm = strikes.filter((s) => s > closestAtmStrike);
  const strikesBelowAtm = strikes.filter((s) => s < closestAtmStrike);

  const wingWidths = [1, 2, 3, 4, 5].map((n) => n * inc);

  if (comboType === "vertical-spread") {
    return (
      <div className="space-y-3">
        <ComboTypePills comboType={comboType} setComboType={setComboType} />
        <p className="text-[10px] text-muted-foreground px-1">
          Bull call spread: BUY lower strike call, SELL higher strike call (same expiry). Lower triangle shows valid
          combinations. Click a cell to trade.
        </p>
        <VerticalSpreadMatrix
          asset={asset}
          strikes={strikes}
          chainMap={chainMap}
          onSelectInstrument={onSelectInstrument}
        />
      </div>
    );
  }

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
                  const callG = getGreeks(chainMap, strike, "call");
                  const putG = getGreeks(chainMap, strike, "put");
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
                      const callG = getGreeks(chainMap, callStrike, "call");
                      const putG = getGreeks(chainMap, putStrike, "put");
                      const netCost = callG.price + putG.price;
                      const legs: ComboLeg[] = [
                        { strike: callStrike, type: "call", direction: "buy", ...callG },
                        { strike: putStrike, type: "put", direction: "buy", ...putG },
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
                  const baseG = getGreeks(chainMap, strike, "call");

                  return (
                    <tr key={strike} className={cn("border-b", isAtm && "bg-amber-500/10")}>
                      <td className="py-2 px-2 font-mono font-medium text-[10px] whitespace-nowrap bg-muted/20">
                        {strike.toLocaleString()}
                        {isAtm && <span className="text-[8px] ml-1 text-amber-400/70">ATM</span>}
                      </td>
                      {CALENDAR_EXPIRIES.map((exp, eIdx) => {
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

  if (comboType === "butterfly") {
    return (
      <div className="space-y-3">
        <ComboTypePills comboType={comboType} setComboType={setComboType} />
        <p className="text-[10px] text-muted-foreground px-1">
          Buy 1 lower wing, sell 2 center, buy 1 upper wing. Net debit shown.
        </p>
        <ButterflyMatrix
          strikes={strikes}
          chainMap={chainMap}
          closestAtmStrike={closestAtmStrike}
          atmIdx={atmIdx}
          wingWidths={wingWidths}
          onSelectInstrument={onSelectInstrument}
        />
      </div>
    );
  }

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
                    const callG = getGreeks(chainMap, callStrike, "call");
                    const putG = getGreeks(chainMap, putStrike, "put");
                    const netCredit = putG.price - callG.price;
                    const legs: ComboLeg[] = [
                      { strike: callStrike, type: "call", direction: "buy", ...callG },
                      { strike: putStrike, type: "put", direction: "sell", ...putG },
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
