"use client";

import * as React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { formatUsd } from "@/lib/mocks/fixtures/options-futures-mock";
import type { ComboLeg, OptionRow, SelectedInstrument } from "@/lib/types/options";
import { cn } from "@/lib/utils";
import { buildComboInstrument, getGreeks } from "./options-combos-shared";

interface Props {
  strikes: number[];
  chainMap: Map<number, OptionRow>;
  closestAtmStrike: number;
  atmIdx: number;
  wingWidths: number[];
  onSelectInstrument: (inst: SelectedInstrument) => void;
}

export function ButterflyMatrix({
  strikes,
  chainMap,
  closestAtmStrike,
  atmIdx,
  wingWidths,
  onSelectInstrument,
}: Props) {
  const centerStrikes = strikes.slice(Math.max(0, atmIdx - 4), Math.min(strikes.length, atmIdx + 5));

  return (
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
                    const lowerG = getGreeks(chainMap, lower, "call");
                    const centerG = getGreeks(chainMap, center, "call");
                    const upperG = getGreeks(chainMap, upper, "call");
                    const hasData = chainMap.has(lower) && chainMap.has(upper);

                    if (!hasData) {
                      return (
                        <td key={width} className="py-1.5 px-1 text-center bg-muted/15">
                          <span className="text-muted-foreground/40 text-[9px]">N/A</span>
                        </td>
                      );
                    }

                    const netDebit = lowerG.price - 2 * centerG.price + upperG.price;
                    const allLegs: ComboLeg[] = [
                      { strike: lower, type: "call", direction: "buy", ...lowerG },
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
                      { strike: upper, type: "call", direction: "buy", ...upperG },
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
                            className={cn("font-mono font-medium", netDebit > 0 ? "text-rose-400" : "text-emerald-400")}
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
  );
}
